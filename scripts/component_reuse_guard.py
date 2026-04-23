#!/usr/bin/env python3
"""
仓库本地实现层收敛守卫。

负责：
- 检查前端页面/组件中是否直接发请求，绕过 service/request 公共层
- 检查典型列表页是否把分页、搜索、弹窗等职责混在单文件里
- 输出轻量 migration checklist，提醒后续可抽取的公共层方向

不负责：
- 自动重构页面
- 证明公共抽象一定正确

维护重点：
- 规则应偏向发现明显重复和越层调用，避免对正常页面结构大面积误报
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


SEVERITY_RANK = {"high": 0, "medium": 1, "low": 2}
NOISE_DIR_PARTS = {
    ".git",
    ".codex-runtime",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".local",
    ".gocache",
    ".gocache-test",
    ".gomodcache",
    ".pnpm-store",
    ".yarn",
    "uni_modules",
}
FRONTEND_EXTENSIONS = {".js", ".jsx", ".ts", ".tsx", ".vue"}
FRONTEND_PATH_HINTS = ("pages", "page", "views", "view", "components", "component")
PAGE_ONLY_HINTS = ("/pages/", "/views/")
ALLOWLIST_HINTS = ("/service/", "/services/", "/request.", "/utils/request.", "/api/")
DIRECT_REQUEST_RE = re.compile(
    r"(\baxios(?:\.[A-Za-z0-9_]+)?\s*\(|(?<![\w$.])fetch\s*\(|\buni\.request\s*\(|\bthis\.\$http\b|\$http\.)",
    re.IGNORECASE,
)
LIST_STATE_RE = re.compile(
    r"\b("
    r"page|pageNo|pageNum|pageIndex|currentPage|"
    r"size|pageSize|total|pagination|"
    r"loading|tableLoading|"
    r"query|filters|searchForm|"
    r"dialogVisible|drawerVisible|"
    r"tableData|rows|records|list"
    r")\b"
)
SHARED_HOOK_RE = re.compile(r"\b(useListPage|usePageQuery|useCrud|page-shell|list-page)\b", re.IGNORECASE)
LIST_COLLECTION_SIGNAL_RE = re.compile(
    r"(<el-table\b|<cl-table\b|:data=\"(?:rows|list|records|tableData)\"|"
    r"v-for=\"[^\"]+\bin\s+(?:rows|list|records)\b|"
    r"\b(?:rows|list|records)\.value\s*=)",
    re.IGNORECASE,
)
LIST_CONTROL_SIGNAL_RE = re.compile(
    r"(<el-pagination\b|\bfetchPage\s*\(|\bloadList\s*\(|\brefreshList\s*\(|\bchangePage\s*\(|"
    r"\bpagination\.(?:page|size|total)\b)",
    re.IGNORECASE,
)
PAGINATION_DRIFT_RE = re.compile(r"\b(rows|records|list)\b")
PAGINATION_COMPAT_RE = re.compile(
    r"("
    r"(?:result|res|data|response|payload)\s*(?:\.|\?\.)\s*(?:list|rows|records)\s*(?:\|\||\?\?)\s*"
    r"(?:\(?\s*(?:(?:result|res|data|response|payload)\s*(?:\.|\?\.)\s*)?(?:list|rows|records))"
    r"|"
    r"(?:list|rows|records)\s*(?:\|\||\?\?)\s*(?:result|res|data|response|payload)\s*(?:\.|\?\.)\s*(?:list|rows|records)"
    r")",
    re.IGNORECASE,
)


@dataclass
class WarningItem:
    code: str
    severity: str
    message: str
    category: str = ""
    file: str = ""
    suggestion: str = ""
    target_public_layer: str = ""
    evidence: str = ""


@dataclass
class MigrationItem:
    category: str
    module: str
    location: str
    current_drift: str
    target_public_layer: str
    risk: str
    blocking: bool
    next_batch: str
    suggestion: str


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


def parse_git_status(root: Path) -> list[Path]:
    result = run_cmd(["git", "status", "--porcelain", "--untracked-files=all"], root)
    if result.returncode != 0:
        return []
    changed: list[Path] = []
    for raw_line in result.stdout.splitlines():
        if not raw_line:
            continue
        line = raw_line[3:] if len(raw_line) > 3 else raw_line
        if " -> " in line:
            line = line.split(" -> ", 1)[1]
        changed.append((root / line).resolve())
    return changed


def is_noise_path(path: Path) -> bool:
    parts = {part.lower() for part in path.parts}
    return any(part in parts for part in NOISE_DIR_PARTS)


def read_text(path: Path, limit: int = 180_000) -> str:
    if not path.exists() or not path.is_file():
        return ""
    try:
        return path.read_text(encoding="utf-8", errors="ignore")[:limit]
    except OSError:
        return ""


def compute_threshold(phase: str, fail_on: str) -> str:
    if fail_on != "auto":
        return fail_on
    return "none" if phase == "start" else "high"


def warning_meets_threshold(severity: str, threshold: str) -> bool:
    if threshold == "none":
        return False
    return SEVERITY_RANK[severity] <= SEVERITY_RANK[threshold]


def is_frontend_page_or_component(path: Path) -> bool:
    if is_noise_path(path) or path.suffix.lower() not in FRONTEND_EXTENSIONS:
        return False
    normalized = path.as_posix().lower()
    if "/pages/demo/" in normalized or "/modules/demo/" in normalized:
        return False
    return any(f"/{hint}/" in normalized for hint in FRONTEND_PATH_HINTS)


def is_page_file(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return any(hint in normalized for hint in PAGE_ONLY_HINTS)


def is_request_allowlisted(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return any(hint in normalized for hint in ALLOWLIST_HINTS)


def list_state_markers(text: str) -> set[str]:
    return {match.lower() for match in LIST_STATE_RE.findall(text)}


def pagination_aliases(text: str) -> set[str]:
    return {match.lower() for match in PAGINATION_DRIFT_RE.findall(text)}


def is_list_page_candidate(path: Path, text: str) -> bool:
    if not is_page_file(path):
        return False
    return bool(LIST_COLLECTION_SIGNAL_RE.search(text) and LIST_CONTROL_SIGNAL_RE.search(text))


def module_name_for(path: Path) -> str:
    normalized = path.as_posix().split("/")
    for segment in reversed(normalized):
        if segment and segment not in {"index.vue", "index.ts", "components", "views", "pages"}:
            return segment
    return path.stem


def collect_all_frontend_files(cwd: Path) -> list[Path]:
    result: list[Path] = []
    for path in cwd.rglob("*"):
        if is_frontend_page_or_component(path):
            result.append(path.resolve())
    return result


def build_warnings(changed_files: list[Path], force: bool) -> list[WarningItem]:
    warnings: list[WarningItem] = []
    for path in changed_files:
        if not is_frontend_page_or_component(path):
            continue
        text = read_text(path)
        if not text:
            continue

        normalized = path.as_posix()
        direct_request = DIRECT_REQUEST_RE.search(text)
        if direct_request and not is_request_allowlisted(path):
            warnings.append(
                WarningItem(
                    code="direct-request-in-page",
                    severity="high",
                    category="request-layer",
                    file=normalized,
                    message="页面/组件直接发请求，绕过 service/request 公共层。",
                    target_public_layer="service/request",
                    suggestion="把请求收敛到 service 层，再由页面只编排状态与交互。",
                    evidence="matched direct axios/fetch/uni.request signal",
                )
            )

        state_markers = list_state_markers(text)
        if (
            is_list_page_candidate(path, text)
            and len(state_markers) >= (3 if force else 4)
            and not SHARED_HOOK_RE.search(text)
        ):
            warnings.append(
                WarningItem(
                    code="mixed-list-state",
                    severity="medium",
                    category="page-state",
                    file=normalized,
                    message="列表页把分页、查询和弹窗状态集中在单文件，缺少共享 hook/base shell 迹象。",
                    target_public_layer="shared list hook/page shell",
                    suggestion="评估收敛到 useListPage、page-shell 或等价共享层。",
                    evidence=f"matched {len(state_markers)} distinct list-state markers",
                )
            )

        aliases = pagination_aliases(text)
        if (
            is_page_file(path)
            and len(aliases) >= 2
            and "pagination" in text.lower()
            and PAGINATION_COMPAT_RE.search(text)
        ):
            warnings.append(
                WarningItem(
                    code="pagination-shape-drift",
                    severity="low",
                    category="pagination",
                    file=normalized,
                    message="页面内出现 rows/records/list 等多种分页字段信号，需确认是否复用统一分页结构。",
                    target_public_layer="pagination contract",
                    suggestion="确认 service 返回结构已统一，避免页面对多个分页字段做本地兼容。",
                    evidence=f"matched pagination field aliases: {', '.join(sorted(aliases))}",
                )
            )
    return warnings


def build_migration_items(warnings: list[WarningItem]) -> list[MigrationItem]:
    items: list[MigrationItem] = []
    for warning in warnings:
        items.append(
            MigrationItem(
                category=warning.category or "shared-logic",
                module=module_name_for(Path(warning.file)),
                location=warning.file,
                current_drift=warning.message,
                target_public_layer=warning.target_public_layer or "shared public layer",
                risk=warning.severity,
                blocking=warning.severity == "high",
                next_batch="next-touch" if warning.severity != "high" else "current-batch",
                suggestion=warning.suggestion,
            )
        )
    return items


def render_console_report(
    phase: str,
    cwd: Path,
    changed_files: list[Path],
    fail_threshold: str,
    warnings: list[WarningItem],
    migration_items: list[MigrationItem],
) -> str:
    lines = [
        f"Component reuse guard: {phase}",
        f"工作目录: {cwd}",
        f"校验阈值: {fail_threshold}",
        f"改动文件数: {len(changed_files)}",
        f"告警数: {len(warnings)}",
    ]
    for path in changed_files[:20]:
        lines.append(f"  - {path}")
    if len(changed_files) > 20:
        lines.append(f"  - ... 其余 {len(changed_files) - 20} 个文件")

    if not warnings:
        lines.append("问题: 无")
        return "\n".join(lines)

    lines.append("问题:")
    for severity in ("high", "medium", "low"):
        chunk = [item for item in warnings if item.severity == severity]
        if not chunk:
            continue
        lines.append(f"  [{severity.upper()}] {len(chunk)}")
        for item in chunk:
            lines.append(f"    - {item.message} ({item.file})")
            if item.evidence:
                lines.append(f"      证据: {item.evidence}")
            if item.suggestion:
                lines.append(f"      修复: {item.suggestion}")

    if migration_items:
        lines.append("迁移建议:")
        for item in migration_items[:10]:
            lines.append(
                f"  - {item.location} -> {item.target_public_layer} "
                f"({item.risk}, {'blocking' if item.blocking else 'non-blocking'})"
            )
    return "\n".join(lines)


def write_report(path: str, content: str) -> None:
    target = Path(path).resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.rstrip() + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the component reuse shared logic guard.")
    parser.add_argument("--phase", choices=("start", "batch", "final"), default="final")
    parser.add_argument("--task", default="")
    parser.add_argument("--cwd", default=os.getcwd())
    parser.add_argument("--changed-file", action="append", default=[])
    parser.add_argument("--all", action="store_true", help="扫描仓库内全部前端页面/组件文件，而不是仅看 git/worktree 上下文。")
    parser.add_argument("--fail-on", choices=("auto", "none", "high", "medium", "low"), default="auto")
    parser.add_argument("--force", action="store_true", help="更积极地把页面内重复状态识别为收敛风险。")
    parser.add_argument("--report-md", default="")
    parser.add_argument("--report-json", default="")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    cwd = Path(args.cwd).resolve()
    git_root = find_git_root(cwd)
    raw_changed_files = [Path(item).resolve() for item in args.changed_file]
    if args.all:
        raw_changed_files = collect_all_frontend_files(cwd)
    elif not raw_changed_files and git_root and git_has_commits(git_root):
        raw_changed_files = parse_git_status(git_root)
    changed_files = [path for path in raw_changed_files if not is_noise_path(path)]

    warnings = build_warnings(changed_files, args.force)
    migration_items = build_migration_items(warnings)
    threshold = compute_threshold(args.phase, args.fail_on)

    console_report = render_console_report(
        phase=args.phase,
        cwd=cwd,
        changed_files=changed_files,
        fail_threshold=threshold,
        warnings=warnings,
        migration_items=migration_items,
    )
    print(console_report)

    if args.report_md:
        write_report(args.report_md, console_report)
    if args.report_json:
        payload = {
            "phase": args.phase,
            "cwd": str(cwd),
            "failThreshold": threshold,
            "changedFiles": [str(path) for path in changed_files],
            "warnings": [asdict(item) for item in warnings],
            "migrationChecklist": [asdict(item) for item in migration_items],
        }
        write_report(args.report_json, json.dumps(payload, ensure_ascii=False, indent=2))

    has_blocking = any(warning_meets_threshold(item.severity, threshold) for item in warnings)
    return 1 if has_blocking else 0


if __name__ == "__main__":
    sys.exit(main())
