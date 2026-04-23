#!/usr/bin/env python3
"""
仓库本地状态流对齐守卫。

负责：
- 在 backend/web/uni 代码中扫描状态集合与流转边
- 检查状态敏感文件是否具备最基本的流转校验信号
- 输出可机读的 JSON 报告，供统一交付守卫聚合

不负责：
- 证明业务状态机绝对正确
- 替代真实单测、集成测试或人工验收

维护重点：
- 只做轻量启发式检查，规则变化要保持误报成本可控
- 输出字段要稳定，避免上层聚合脚本解析漂移
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path


SEVERITY_RANK = {"high": 0, "medium": 1, "low": 2}
CODE_SUFFIXES = {".py", ".js", ".jsx", ".ts", ".tsx", ".vue", ".java", ".go", ".kt", ".php", ".cs"}
IGNORE_PARTS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".next",
    "target",
    "__pycache__",
    ".codex-runtime",
    ".venv",
    "venv",
    "site-packages",
    ".local",
    ".gocache",
    ".gocache-test",
    ".gomodcache",
    ".pnpm-store",
    ".yarn",
    "scripts",
    "generated",
    "uni_modules",
    "packages",
    "public",
    "docs",
    "reports",
}

TASK_HINTS = ("状态", "状态流", "流转", "workflow", "state", "status", "transition", "fsm")
PATH_STATUS_RE = re.compile(r"(status|state|workflow|transition|flow)", re.IGNORECASE)
STATE_CONTEXT_RE = re.compile(
    r"(status|workflow|transition|fromStatus|toStatus|nextStatus|fromState|toState|nextState)",
    re.IGNORECASE,
)
TRANSITION_GUARD_RE = re.compile(
    r"(canTransition|allowedTransitions|stateMachine|transitionMap|statusGuard|stateGuard|isValidTransition|guardTransition|assert[A-Za-z0-9]*Transition|assert[A-Za-z0-9]*(ActionAllowed|Editable)|canShowAction|canAcceptSuggestion|canIgnoreSuggestion|canRejectSuggestion|canStartWorkPlan|canCompleteWorkPlan|canCancelWorkPlan|fixedStatuses|actionKeys)",
    re.IGNORECASE,
)
STATE_VALUE_HINT_RE = re.compile(
    r"(status|state|fixedStatuses|createStatusOption|build[A-Za-z0-9]*StatusOptions|blacklistStatus|sourceStatus)",
    re.IGNORECASE,
)
STATE_ACTION_RE = re.compile(
    r"(\bapprove\b|\breject\b|\bsubmit\b|\bcancel\b|\bwithdraw\b|\btransfer\b|\bfallback\b|\bresolve\b|\bterminate\b|\bstart\b|\bstop\b|\bclose\b|\bcomplete\b|\barchive\b|\bassign\b|\breceive\b|\bexecute\b|markLost|updateStatus|progressUpdate)",
    re.IGNORECASE,
)
TRANSITION_ARROW_RE = re.compile(
    r"([A-Za-z0-9_\-\u4e00-\u9fa5]{2,32})\s*(?:->|→|＞)\s*([A-Za-z0-9_\-\u4e00-\u9fa5]{2,32})"
)
FROM_TO_RE = re.compile(
    r"(?:fromStatus|from_state|sourceStatus)\s*[:=]\s*[\"']([A-Za-z0-9_\-\u4e00-\u9fa5]{2,32})[\"'].*?"
    r"(?:toStatus|to_state|targetStatus)\s*[:=]\s*[\"']([A-Za-z0-9_\-\u4e00-\u9fa5]{2,32})[\"']",
    re.IGNORECASE | re.DOTALL,
)
MAP_TRANSITION_RE = re.compile(r"[\"']([A-Za-z0-9_\-\u4e00-\u9fa5]{2,32})[\"']\s*:\s*\[(.*?)\]", re.DOTALL)
QUOTED_TOKEN_RE = re.compile(r"[\"']([A-Za-z0-9_\-\u4e00-\u9fa5]{1,40})[\"']")
STATE_KEY_RE = re.compile(r"[\"']([A-Za-z0-9_\-\u4e00-\u9fa5]{1,40})[\"']\s*:")
STATE_ASSIGNMENT_RE = re.compile(
    r"(?:status|state|workflow|fromStatus|toStatus|nextStatus)[A-Za-z0-9_]*\s*[:=]\s*[\"']([A-Za-z0-9_\-\u4e00-\u9fa5]{1,40})[\"']",
    re.IGNORECASE,
)
NON_BUSINESS_STATUS_CONTEXT_RE = re.compile(
    r"(\bstatusCode\b|ctx\.status|response\.status|res\.status|\bhttpStatus\b|\bsetStatus\b|disable-transitions|permission\.[A-Za-z0-9_]+|status\s*[:=]\s*\d)",
    re.IGNORECASE,
)
NON_STATE_METADATA_LINE_RE = re.compile(
    r"(\baggregate\b\s*:|\bcapabilityKey\b\s*:|\blegacyPermissionAliases\b\s*:|\bowner\b\s*:|\bdomain\b\s*:)",
    re.IGNORECASE,
)
STATE_CONTEXT_BLOCK_START_RE = re.compile(
    r"(export\s+type\s+[A-Za-z0-9_]*(?:Status|State)[A-Za-z0-9_]*\s*=|"
    r"(?:const|export\s+const)\s+[A-Za-z0-9_]*(?:STATUS|STATES|Status|State)[A-Za-z0-9_]*\s*=\s*\[|"
    r"[A-Za-z0-9_]*(?:status|state)[A-Za-z0-9_]*\s*:\s*\[)",
    re.IGNORECASE,
)
STATE_CONTEXT_BLOCK_END_RE = re.compile(r"[\];}]")

IGNORE_STATE_TOKENS = {
    "true",
    "false",
    "null",
    "none",
    "undefined",
    "status",
    "state",
    "workflow",
    "transition",
    "default",
    "success",
    "error",
    "message",
    "data",
    "code",
    "route",
    "page",
    "button",
    "label",
    "load",
    "any",
    "boolean",
    "number",
    "string",
    "extends",
    "element",
    "this",
    "base",
    "children",
    "classes",
    "all",
    "edit",
    "delete",
    "accept",
    "ready",
    "loading",
    "missing",
    "denied",
    "delayed",
    "unavailable",
    "neutral",
    "primary",
    "danger",
    "info",
    "add",
    "approve",
    "archive",
    "config",
    "close",
    "complete",
    "confirm",
    "blacklist",
    "change",
    "detail",
    "fallback",
    "goal-card",
    "ignored",
    "hook",
    "id",
    "in_review",
    "intercepted",
    "ignore",
    "key",
    "launching",
    "manual_pending",
    "name",
    "never",
    "pending_resolution",
    "plain",
    "practice",
    "receive",
    "record-card",
    "remind",
    "resolve",
    "select",
    "signing",
    "slide",
    "start",
    "status-available",
    "status-tabs",
    "submit",
    "task-card",
    "terminate",
    "timed_out",
    "transparent",
    "track",
    "transfer",
    "transferred",
    "type",
    "unblacklist",
    "unknown",
    "update",
    "value",
    "withdraw",
}
ALLOWED_CAMEL_CASE_STATES = {
    "inProgress",
    "pendingApproval",
    "approvedPendingAssignment",
    "manualPending",
    "inTransit",
}


@dataclass
class Issue:
    severity: str
    title: str
    detail: str
    evidence: list[str] = field(default_factory=list)
    fix_hint: str = ""


@dataclass
class ScanResult:
    backend_states: set[str] = field(default_factory=set)
    frontend_states: set[str] = field(default_factory=set)
    backend_transitions: set[tuple[str, str]] = field(default_factory=set)
    frontend_transitions: set[tuple[str, str]] = field(default_factory=set)
    backend_files_without_guard: list[str] = field(default_factory=list)
    frontend_files_without_guard: list[str] = field(default_factory=list)
    scanned_backend_files: int = 0
    scanned_frontend_files: int = 0


@dataclass
class Report:
    phase: str
    cwd: Path
    git_root: Path | None
    context_enabled: bool
    context_reason: str
    changed_files: list[Path]
    scan: ScanResult
    issues: list[Issue]
    notes: list[str]
    fail_threshold: str


def run_cmd(args: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=str(cwd), capture_output=True, text=True, check=False)


def find_git_root(cwd: Path) -> Path | None:
    result = run_cmd(["git", "rev-parse", "--show-toplevel"], cwd)
    if result.returncode != 0:
        return None
    value = result.stdout.strip()
    return Path(value) if value else None


def git_has_commits(root: Path) -> bool:
    return run_cmd(["git", "rev-parse", "--verify", "HEAD"], root).returncode == 0


def parse_git_changed_files(root: Path) -> list[Path]:
    result = run_cmd(["git", "status", "--porcelain", "--untracked-files=all"], root)
    if result.returncode != 0:
        return []
    files: list[Path] = []
    for raw_line in result.stdout.splitlines():
        if not raw_line:
            continue
        payload = raw_line[3:] if len(raw_line) > 3 else raw_line
        if " -> " in payload:
            payload = payload.split(" -> ", 1)[1]
        files.append((root / payload).resolve())
    return files


def read_text(path: Path, limit: int = 220_000) -> str:
    if not path.exists() or not path.is_file():
        return ""
    try:
        return path.read_text(encoding="utf-8", errors="ignore")[:limit]
    except OSError:
        return ""


def is_ignored_path(path: Path) -> bool:
    parts = {part.lower() for part in path.parts}
    return any(part in parts for part in IGNORE_PARTS)


def is_generated_state_contract_path(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return (
        "/cool-admin-vue/src/modules/performance/generated/" in normalized
        or normalized.endswith("/cool-uni/generated/performance-goal.generated.ts")
        or normalized.endswith("/cool-uni/generated/performance-course.generated.ts")
        or normalized.endswith("/cool-uni/generated/performance-course-learning.generated.ts")
    )


def is_code_path(path: Path) -> bool:
    return path.suffix.lower() in CODE_SUFFIXES and (
        not is_ignored_path(path) or is_generated_state_contract_path(path)
    )


def is_non_business_state_metadata_path(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return (
        "/src/domain-registry/" in normalized
        or "/test/" in normalized
        or "/tests/" in normalized
        or normalized.endswith(".dictionary.ts")
    )


def compute_threshold(phase: str, fail_on: str) -> str:
    if fail_on != "auto":
        return fail_on
    return "none" if phase == "start" else "high"


def severity_meets_threshold(severity: str, threshold: str) -> bool:
    if threshold == "none":
        return False
    return SEVERITY_RANK[severity] <= SEVERITY_RANK[threshold]


def normalize_state_token(token: str) -> str:
    value = token.strip().strip("_").strip("-")
    if not value:
        return ""
    lower = value.lower()
    if lower in IGNORE_STATE_TOKENS:
        return ""
    if "/" in value or "." in value or "://" in lower:
        return ""
    if value[0].isdigit():
        return ""
    if re.fullmatch(r"\d+", value):
        return ""
    if re.fullmatch(r"\d+(px|rpx|rem|em|vh|vw|%)", lower):
        return ""
    if re.fullmatch(r"\d+(ms|s)", lower):
        return ""
    if re.fullmatch(r"0[xob][0-9a-f]+", lower):
        return ""
    if re.fullmatch(r"[A-Z0-9]{1,4}", value):
        return ""
    if re.fullmatch(r"[A-Z0-9]+(?:-[A-Z0-9]+)+", value):
        return ""
    if lower.startswith(("aria-", "data-", "cl-", "el-", "uni-")):
        return ""
    if lower.endswith(("count", "status", "options", "option", "model")):
        return ""
    if "__" in value or "::" in value:
        return ""
    if value.startswith("active") and any(ch.isupper() for ch in value[len("active") :]):
        return ""
    if any(ch.isupper() for ch in value[1:]) and value not in ALLOWED_CAMEL_CASE_STATES:
        return ""
    if value.endswith(("Tabs", "TabList")):
        return ""
    if lower.endswith(("-card", "-tabs")):
        return ""
    if lower.endswith(("-tag", "-pill")):
        return ""
    if lower.startswith("status-"):
        return ""
    if lower in {"disable-transitions", "blank"}:
        return ""
    if lower in {"accept", "shadow", "small", "warning"}:
        return ""
    if any("\u4e00" <= ch <= "\u9fff" for ch in value):
        return ""
    if value[0].isupper() and not value.isupper():
        return ""
    if len(value) == 1:
        return ""
    return value


def collect_focus_windows(lines: list[str]) -> str:
    matched_indexes = [
        index
        for index, line in enumerate(lines)
        if STATE_CONTEXT_RE.search(line) or TRANSITION_GUARD_RE.search(line)
    ]
    if not matched_indexes:
        return ""

    selected: list[str] = []
    seen_indexes: set[int] = set()
    for index in matched_indexes:
        for current in range(max(0, index - 3), min(len(lines), index + 4)):
            if current in seen_indexes:
                continue
            seen_indexes.add(current)
            selected.append(lines[current])
    return "\n".join(selected)


def has_business_state_context(text: str) -> bool:
    if not STATE_CONTEXT_RE.search(text):
        return False

    meaningful_lines = [
        line
        for line in text.splitlines()
        if STATE_CONTEXT_RE.search(line) or TRANSITION_GUARD_RE.search(line)
    ]
    if not meaningful_lines:
        return False

    return any(not NON_BUSINESS_STATUS_CONTEXT_RE.search(line) for line in meaningful_lines)


def line_has_state_context(lines: list[str], index: int) -> bool:
    for current in range(max(0, index - 1), min(len(lines), index + 2)):
        line = lines[current]
        if NON_BUSINESS_STATUS_CONTEXT_RE.search(line):
            continue
        if STATE_CONTEXT_RE.search(line) or TRANSITION_GUARD_RE.search(line):
            return True
    return False


def line_has_direct_state_context(line: str) -> bool:
    return bool(STATE_CONTEXT_RE.search(line) or TRANSITION_GUARD_RE.search(line))


def has_actionable_state_context(text: str) -> bool:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if not STATE_ACTION_RE.search(line):
            continue
        for current in range(max(0, index - 1), min(len(lines), index + 2)):
            nearby = lines[current]
            if NON_BUSINESS_STATUS_CONTEXT_RE.search(nearby):
                continue
            if line_has_direct_state_context(nearby):
                return True
    return False


def has_guard_signal(text: str) -> bool:
    if TRANSITION_GUARD_RE.search(text):
        return True

    guard_patterns = (
        re.compile(r"\b[A-Za-z_][A-Za-z0-9_]*\.status\s*(?:===|!==)"),
        re.compile(r"\b[A-Za-z_][A-Za-z0-9_]*\.(?:assetStatus|sourceStatus|blacklistStatus)\s*(?:===|!==)"),
        re.compile(r"\.includes\(\s*String\([^)]*status"),
        re.compile(r"\.includes\(\s*(?:row|item|order|current|instance|node)\.status"),
        re.compile(r"switch\s*\(\s*[^)]*status\s*\)"),
        re.compile(r"switch\s*\(\s*[^)]*finalStatus\s*\)"),
    )
    return any(pattern.search(text) for pattern in guard_patterns)


def collect_state_context_line_indexes(lines: list[str]) -> set[int]:
    indexes: set[int] = set()
    carry_until = -1
    for index, line in enumerate(lines):
        if NON_BUSINESS_STATUS_CONTEXT_RE.search(line):
            continue

        if line_has_direct_state_context(line) or STATE_VALUE_HINT_RE.search(line):
            indexes.add(index)

        state_options_block = STATE_CONTEXT_RE.search(line) and "options" in line and "[" in line
        if STATE_CONTEXT_BLOCK_START_RE.search(line) or state_options_block:
            carry_until = max(carry_until, index + 12)
            indexes.add(index)
            if STATE_CONTEXT_BLOCK_END_RE.search(line.split("=", 1)[-1]):
                carry_until = index
            continue

        if carry_until >= index:
            indexes.add(index)
            if STATE_CONTEXT_BLOCK_END_RE.search(line):
                carry_until = index - 1

    return indexes


def classify_side(path: Path) -> str:
    normalized = path.as_posix().lower()
    if "/cool-admin-midway/" in normalized:
        return "backend"
    if "/cool-admin-vue/" in normalized or "/cool-uni/" in normalized:
        return "frontend"
    if "/src/" in normalized and "/modules/" in normalized:
        return "frontend"
    return "backend"


def parse_transition_expr(expr: str) -> tuple[str, str] | None:
    raw = expr.strip()
    if not raw:
        return None
    match = TRANSITION_ARROW_RE.search(raw)
    if not match:
        return None
    from_state = normalize_state_token(match.group(1))
    to_state = normalize_state_token(match.group(2))
    if not from_state or not to_state:
        return None
    return (from_state, to_state)


def extract_states_and_transitions(text: str) -> tuple[set[str], set[tuple[str, str]]]:
    states: set[str] = set()
    transitions: set[tuple[str, str]] = set()

    if not has_business_state_context(text):
        return states, transitions

    lines = text.splitlines()
    focused_text = collect_focus_windows(lines) or text
    state_context_lines = collect_state_context_line_indexes(lines)

    for index, line in enumerate(lines):
        if index not in state_context_lines and not line_has_state_context(lines, index):
            continue
        if NON_STATE_METADATA_LINE_RE.search(line):
            continue
        if (
            index in state_context_lines
            or line_has_direct_state_context(line)
            or STATE_VALUE_HINT_RE.search(line)
        ):
            for match in QUOTED_TOKEN_RE.findall(line):
                token = normalize_state_token(match)
                if token:
                    states.add(token)

        if line_has_direct_state_context(line):
            for match in STATE_KEY_RE.findall(line):
                token = normalize_state_token(match)
                if token:
                    states.add(token)

            for match in STATE_ASSIGNMENT_RE.findall(line):
                token = normalize_state_token(match)
                if token:
                    states.add(token)

        for from_state, to_state in TRANSITION_ARROW_RE.findall(line):
            left = normalize_state_token(from_state)
            right = normalize_state_token(to_state)
            if left and right:
                transitions.add((left, right))

    for from_state, to_state in FROM_TO_RE.findall(focused_text):
        left = normalize_state_token(from_state)
        right = normalize_state_token(to_state)
        if left and right:
            transitions.add((left, right))

    for source_state, payload in MAP_TRANSITION_RE.findall(focused_text):
        source = normalize_state_token(source_state)
        if not source:
            continue
        for target_state in QUOTED_TOKEN_RE.findall(payload):
            target = normalize_state_token(target_state)
            if target:
                transitions.add((source, target))

    return states, transitions


def should_check_transition_guard(path: Path, text: str) -> bool:
    normalized = path.as_posix().lower()
    if normalized.endswith("/access-context.ts"):
        return False
    if is_non_business_state_metadata_path(path):
        return False
    if PATH_STATUS_RE.search(normalized):
        return True
    return has_business_state_context(text)


def should_require_guard_evidence(path: Path) -> bool:
    normalized = path.as_posix().lower()
    if path.suffix.lower() in {".json"}:
        return False
    if normalized.endswith(".d.ts") or ".generated." in normalized:
        return False
    if normalized.endswith("-dict.ts"):
        return False
    if "/controller/" in normalized:
        return False
    if (
        "/cool-admin-vue/src/modules/performance/service/" in normalized
        or "/cool-uni/service/performance/" in normalized
    ):
        return False
    return not any(part in normalized for part in ("/entity/", "/types/", "/test/", "/tests/", "/dist_tsc/"))


def should_flag_missing_guard(
    path: Path, text: str, states: set[str], transitions: set[tuple[str, str]]
) -> bool:
    if not should_require_guard_evidence(path):
        return False
    if not states and not transitions:
        return False
    if transitions:
        return True
    normalized = path.as_posix().lower()
    if "/service/" in normalized or "/controller/" in normalized or "/views/" in normalized or "/pages/" in normalized:
        return has_actionable_state_context(text)
    return False


def dedupe_issues(issues: list[Issue]) -> list[Issue]:
    seen: set[tuple[str, str, str]] = set()
    result: list[Issue] = []
    for issue in issues:
        key = (issue.severity, issue.title, issue.detail)
        if key in seen:
            continue
        seen.add(key)
        result.append(issue)
    return result


def scan_repo(cwd: Path, changed_files: list[Path]) -> ScanResult:
    scan = ScanResult()
    changed_set = {path.resolve() for path in changed_files}
    for path in cwd.rglob("*"):
        if not is_code_path(path):
            continue
        text = read_text(path)
        if not text or not should_check_transition_guard(path, text):
            continue

        side = classify_side(path)
        states, transitions = extract_states_and_transitions(text)
        if side == "backend":
            scan.scanned_backend_files += 1
            scan.backend_states.update(states)
            scan.backend_transitions.update(transitions)
            if (
                path.resolve() in changed_set
                and should_flag_missing_guard(path, text, states, transitions)
                and not has_guard_signal(text)
            ):
                scan.backend_files_without_guard.append(str(path))
        else:
            scan.scanned_frontend_files += 1
            scan.frontend_states.update(states)
            scan.frontend_transitions.update(transitions)
            if (
                path.resolve() in changed_set
                and should_flag_missing_guard(path, text, states, transitions)
                and not has_guard_signal(text)
            ):
                scan.frontend_files_without_guard.append(str(path))
    return scan


def collect_all_code_files(cwd: Path) -> list[Path]:
    result: list[Path] = []
    for path in cwd.rglob("*"):
        if is_code_path(path):
            result.append(path.resolve())
    return result


def build_report(
    phase: str,
    task: str,
    cwd: Path,
    git_root: Path | None,
    changed_files: list[Path],
    explicit_states: set[str],
    explicit_transitions: set[tuple[str, str]],
    force: bool,
    fail_threshold: str,
) -> Report:
    notes: list[str] = []
    task_context = any(hint.lower() in task.lower() for hint in TASK_HINTS)
    file_context = any(PATH_STATUS_RE.search(path.as_posix()) for path in changed_files)
    context_enabled = force or task_context or file_context
    context_reason = "force" if force else "task/file 命中状态流语义" if context_enabled else "未命中状态流上下文"

    if not context_enabled:
        notes.append("未检测到明确状态流上下文，本次仅输出空报告。")
        return Report(
            phase=phase,
            cwd=cwd,
            git_root=git_root,
            context_enabled=False,
            context_reason=context_reason,
            changed_files=changed_files,
            scan=ScanResult(),
            issues=[],
            notes=notes,
            fail_threshold=fail_threshold,
        )

    scan = scan_repo(cwd, changed_files)
    scan.backend_states.update(explicit_states)
    scan.frontend_states.update(explicit_states)
    scan.backend_transitions.update(explicit_transitions)
    scan.frontend_transitions.update(explicit_transitions)

    issues: list[Issue] = []
    backend_only_states = sorted(scan.backend_states - scan.frontend_states)
    frontend_only_states = sorted(scan.frontend_states - scan.backend_states)
    backend_only_transitions = sorted(scan.backend_transitions - scan.frontend_transitions)
    frontend_only_transitions = sorted(scan.frontend_transitions - scan.backend_transitions)

    if backend_only_states and scan.frontend_states:
        issues.append(
            Issue(
                severity="medium",
                title="后端状态集合未完全映射到前端",
                detail="检测到后端状态值在前端侧缺少对应消费或显式定义。",
                evidence=backend_only_states[:12],
                fix_hint="检查 dict/store、页面标签映射和按钮显隐策略是否同步。",
            )
        )

    if frontend_only_states and scan.backend_states:
        issues.append(
            Issue(
                severity="medium",
                title="前端状态集合未完全映射到后端",
                detail="检测到前端状态值在后端侧缺少对应定义或来源不明。",
                evidence=frontend_only_states[:12],
                fix_hint="确认前端未本地扩展状态值，必要时回收到后端字典或状态机定义。",
            )
        )

    if backend_only_transitions and scan.frontend_transitions:
        issues.append(
            Issue(
                severity="medium",
                title="后端流转边未完全映射到前端",
                detail="检测到后端存在前端未覆盖的状态流转。",
                evidence=[f"{left}->{right}" for left, right in backend_only_transitions[:12]],
                fix_hint="补齐前端操作按钮策略或确认该流转仅后端内部使用。",
            )
        )

    if frontend_only_transitions and scan.backend_transitions:
        issues.append(
            Issue(
                severity="medium",
                title="前端流转边未完全映射到后端",
                detail="检测到前端声明了后端未体现的状态流转。",
                evidence=[f"{left}->{right}" for left, right in frontend_only_transitions[:12]],
                fix_hint="移除前端本地推导流转或把后端状态机补齐到唯一事实源。",
            )
        )

    if scan.backend_files_without_guard:
        issues.append(
            Issue(
                severity="high",
                title="后端状态敏感改动缺少流转校验信号",
                detail="改动文件命中了状态语义，但未发现明确的流转校验/状态机守卫信号。",
                evidence=scan.backend_files_without_guard[:10],
                fix_hint="补齐 allowedTransitions/stateMachine/canTransition 一类显式校验。",
            )
        )

    if scan.frontend_files_without_guard:
        issues.append(
            Issue(
                severity="high",
                title="前端状态敏感改动缺少流转校验信号",
                detail="改动文件命中了状态语义，但未发现明确的按钮守卫或流转校验信号。",
                evidence=scan.frontend_files_without_guard[:10],
                fix_hint="补齐按钮禁用、状态机判断或显式流转映射，避免前端本地放行非法状态。",
            )
        )

    if not issues:
        notes.append("未发现达到阈值的状态集合、流转边或显式守卫缺口。")

    return Report(
        phase=phase,
        cwd=cwd,
        git_root=git_root,
        context_enabled=True,
        context_reason=context_reason,
        changed_files=changed_files,
        scan=scan,
        issues=dedupe_issues(issues),
        notes=notes,
        fail_threshold=fail_threshold,
    )


def render_report(report: Report) -> str:
    lines = [
        f"State machine guard: {report.phase}",
        f"工作目录: {report.cwd}",
        f"Git 根目录: {report.git_root if report.git_root else '未检测到'}",
        f"校验阈值: {report.fail_threshold}",
        f"状态流上下文: {'开启' if report.context_enabled else '跳过'} ({report.context_reason})",
        f"改动文件数: {len(report.changed_files)}",
        "扫描统计: "
        f"backend_files={report.scan.scanned_backend_files} "
        f"frontend_files={report.scan.scanned_frontend_files} "
        f"backend_states={len(report.scan.backend_states)} "
        f"frontend_states={len(report.scan.frontend_states)} "
        f"backend_transitions={len(report.scan.backend_transitions)} "
        f"frontend_transitions={len(report.scan.frontend_transitions)}",
    ]

    for path in report.changed_files[:20]:
        lines.append(f"  - {path}")
    if len(report.changed_files) > 20:
        lines.append(f"  - ... 其余 {len(report.changed_files) - 20} 个文件")

    if report.notes:
        lines.append("备注:")
        for note in report.notes:
            lines.append(f"  - {note}")

    if not report.issues:
        lines.append("问题: 无")
        return "\n".join(lines)

    lines.append("问题:")
    for severity in ("high", "medium", "low"):
        chunk = [issue for issue in report.issues if issue.severity == severity]
        if not chunk:
            continue
        lines.append(f"  [{severity.upper()}] {len(chunk)}")
        for issue in chunk:
            lines.append(f"    - {issue.title}: {issue.detail}")
            if issue.evidence:
                lines.append(f"      证据: {', '.join(issue.evidence[:10])}")
            if issue.fix_hint:
                lines.append(f"      修复: {issue.fix_hint}")
    return "\n".join(lines)


def write_reports(report_md: Path | None, report_json: Path | None, text: str, issues: list[Issue]) -> None:
    if report_md:
        report_md.parent.mkdir(parents=True, exist_ok=True)
        report_md.write_text(text + "\n", encoding="utf-8")
    if report_json:
        report_json.parent.mkdir(parents=True, exist_ok=True)
        payload = [
            {
                "severity": issue.severity,
                "title": issue.title,
                "detail": issue.detail,
                "evidence": issue.evidence,
                "fix_hint": issue.fix_hint,
            }
            for issue in issues
        ]
        report_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="State machine alignment guard.")
    parser.add_argument("--phase", choices=("start", "batch", "final"), default="final")
    parser.add_argument("--task", default="", help="可选：用户任务描述文本。")
    parser.add_argument("--cwd", default=os.getcwd(), help="项目目录，默认当前目录。")
    parser.add_argument("--changed-file", action="append", default=[], help="显式传入改动文件，可重复。")
    parser.add_argument("--all", action="store_true", help="扫描仓库内全部代码文件，而不是仅看 git/worktree 上下文。")
    parser.add_argument("--state", action="append", default=[], help="显式声明状态值，可重复。")
    parser.add_argument("--transition", action="append", default=[], help="显式声明流转边，例如 draft>approved。")
    parser.add_argument("--force", action="store_true", help="即使无状态上下文也强制执行扫描。")
    parser.add_argument(
        "--fail-on",
        choices=("auto", "none", "high", "medium", "low"),
        default="auto",
        help="失败阈值。auto: start 不阻断，batch/final 对 high 阻断。",
    )
    parser.add_argument("--report-md", default="", help="可选：Markdown 报告路径。")
    parser.add_argument("--report-json", default="", help="可选：JSON 报告路径。")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    cwd = Path(args.cwd).resolve()
    git_root = find_git_root(cwd)
    threshold = compute_threshold(args.phase, args.fail_on)

    changed_files = [Path(item).resolve() for item in args.changed_file]
    if args.all:
        changed_files = collect_all_code_files(cwd)
    elif not changed_files and git_root and git_has_commits(git_root):
        changed_files = parse_git_changed_files(git_root)
    changed_files = [path for path in changed_files if not is_ignored_path(path)]

    explicit_states = {normalize_state_token(item) for item in args.state if normalize_state_token(item)}
    explicit_transitions: set[tuple[str, str]] = set()
    invalid_transitions: list[str] = []
    for item in args.transition:
        parsed = parse_transition_expr(item)
        if parsed:
            explicit_transitions.add(parsed)
        elif item.strip():
            invalid_transitions.append(item.strip())

    report = build_report(
        phase=args.phase,
        task=args.task,
        cwd=cwd,
        git_root=git_root,
        changed_files=changed_files,
        explicit_states=explicit_states,
        explicit_transitions=explicit_transitions,
        force=args.force,
        fail_threshold=threshold,
    )

    if invalid_transitions:
        report.issues.append(
            Issue(
                severity="high",
                title="存在无效流转表达式",
                detail="--transition 仅支持 A>B / A->B / A=>B / A→B 格式。",
                evidence=invalid_transitions,
                fix_hint="修正流转表达式后重跑。",
            )
        )
        report.issues = dedupe_issues(report.issues)

    rendered = render_report(report)
    print(rendered)

    report_md = Path(args.report_md).resolve() if args.report_md else None
    report_json = Path(args.report_json).resolve() if args.report_json else None
    write_reports(report_md, report_json, rendered, report.issues)

    has_blocking_issue = any(severity_meets_threshold(issue.severity, threshold) for issue in report.issues)
    return 1 if has_blocking_issue else 0


if __name__ == "__main__":
    sys.exit(main())
