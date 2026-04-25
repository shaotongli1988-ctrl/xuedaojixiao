#!/usr/bin/env python3
"""
仓库本地统一交付守卫。

负责：
- 统一收集本批次 changed files
- 先做轻量交付闭环检查（代码/测试/文档/脚本）
- 串行调用本地子守卫：RBAC、状态机、实现层收敛
- 产出一个聚合后的 Markdown/JSON 报告

不负责：
- 替代真实 build、lint、unit/integration 测试
- 直接修复发现的问题

维护重点：
- 依赖必须全部位于仓库内，不能再绑定外部 skill 运行时
- 子守卫参数语义要保持一致，便于手工执行和 CI 复用
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path


SEVERITY_RANK = {"high": 0, "medium": 1, "low": 2}
CODE_SUFFIXES = {".py", ".js", ".jsx", ".ts", ".tsx", ".vue", ".java", ".go", ".kt", ".php", ".cs"}
TEST_HINTS = ("/test/", "/tests/", "__tests__", ".test.", ".spec.", "_test.")
DOC_HINTS = ("/docs/", ".md")
SCRIPT_HINTS = ("/scripts/", ".github/workflows/")
SHARED_CHANGE_HINTS = (
    "/src/modules/dict/",
    "/src/modules/performance/service/",
    "/src/modules/performance/types",
    "/cool/store/dict",
    "/generated/",
)


@dataclass
class Issue:
    severity: str
    title: str
    detail: str
    evidence: list[str] = field(default_factory=list)
    fix_hint: str = ""
    guard: str = "local"


@dataclass
class GuardResult:
    name: str
    exit_code: int
    issues: list[Issue]
    stdout: str


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


def compute_threshold(phase: str, fail_on: str) -> str:
    if fail_on != "auto":
        return fail_on
    return "none" if phase == "start" else "high"


def severity_meets_threshold(severity: str, threshold: str) -> bool:
    if threshold == "none":
        return False
    return SEVERITY_RANK[severity] <= SEVERITY_RANK[threshold]


def is_code_path(path: Path) -> bool:
    return path.suffix.lower() in CODE_SUFFIXES


def has_hint(path: Path, hints: tuple[str, ...]) -> bool:
    normalized = path.as_posix().lower()
    return any(hint.lower() in normalized for hint in hints)


def local_delivery_issues(changed_files: list[Path], task: str) -> list[Issue]:
    issues: list[Issue] = []
    code_files = [path for path in changed_files if is_code_path(path)]
    test_files = [path for path in changed_files if has_hint(path, TEST_HINTS)]
    doc_files = [path for path in changed_files if has_hint(path, DOC_HINTS)]
    script_files = [path for path in changed_files if has_hint(path, SCRIPT_HINTS)]
    shared_files = [path for path in changed_files if has_hint(path, SHARED_CHANGE_HINTS)]

    if code_files and not test_files:
        issues.append(
            Issue(
                severity="medium",
                title="缺少测试证据文件改动",
                detail="本批次包含代码改动，但未检测到任何 test/spec 文件变更。",
                evidence=[str(path) for path in code_files[:10]],
                fix_hint="补充最小回归测试，或在交付记录里显式说明为何本次仅能依赖命令级验证。",
            )
        )

    if (code_files or script_files) and not doc_files:
        issues.append(
            Issue(
                severity="low",
                title="代码或脚本改动未伴随文档更新",
                detail="本批次命中了代码/脚本路径，但未检测到 README、设计记录或交付文档变更。",
                evidence=[str(path) for path in (code_files + script_files)[:10]],
                fix_hint="补充 README、设计说明或交付记录中的执行入口与已知边界。",
            )
        )

    if shared_files and not test_files:
        issues.append(
            Issue(
                severity="high",
                title="共享层改动缺少定向回归证据",
                detail="检测到字典、共享 service/type/store 一类改动，但没有看到测试文件同步变更。",
                evidence=[str(path) for path in shared_files[:10]],
                fix_hint="补充针对共享层的定向测试或最小回归脚本，避免隐式行为漂移。",
            )
        )

    if "状态" in task or re.search(r"\b(status|state|transition)\b", task, re.IGNORECASE):
        issues.append(
            Issue(
                severity="low",
                title="任务命中状态语义",
                detail="统一守卫已识别到状态语义任务，建议结合状态机守卫和定向状态回归一起查看。",
                evidence=[task],
                fix_hint="确认状态集合、流转边、按钮显隐和非法状态回退已同步验证。",
            )
        )

    return issues


def collect_all_delivery_files(cwd: Path) -> list[Path]:
    include_suffixes = CODE_SUFFIXES | {".md", ".json", ".yml", ".yaml", ".mjs"}
    files: list[Path] = []
    for path in cwd.rglob("*"):
        if not path.is_file():
            continue
        normalized = path.as_posix()
        if "/node_modules/" in normalized or "/dist/" in normalized or "/build/" in normalized or "/coverage/" in normalized:
            continue
        if path.suffix.lower() in include_suffixes:
            files.append(path.resolve())
    return files


def parse_issue_payload(path: Path, guard_name: str) -> list[Issue]:
    if not path.exists():
        return [
            Issue(
                severity="high",
                title=f"{guard_name} 未输出 JSON 报告",
                detail="子守卫执行后没有生成预期的 JSON 报告。",
                fix_hint="检查子守卫是否异常退出或报告路径是否可写。",
                guard=guard_name,
            )
        ]
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return [
            Issue(
                severity="high",
                title=f"{guard_name} JSON 报告不可解析",
                detail="子守卫报告输出格式异常。",
                fix_hint="修复子守卫 JSON 结构，保持统一可聚合格式。",
                guard=guard_name,
            )
        ]

    issues: list[Issue] = []
    if isinstance(payload, dict):
        payload = payload.get("warnings", payload.get("issues", []))
    for item in payload:
        issues.append(
            Issue(
                severity=item.get("severity", "low"),
                title=item.get("title") or item.get("message", "子守卫提示"),
                detail=item.get("detail") or item.get("message", ""),
                evidence=item.get("evidence", []) if isinstance(item.get("evidence", []), list) else [str(item.get("evidence"))],
                fix_hint=item.get("fix_hint") or item.get("suggestion", ""),
                guard=guard_name,
            )
        )
    return issues


def run_subguard(
    script_name: str,
    guard_name: str,
    cwd: Path,
    phase: str,
    threshold: str,
    task: str,
    changed_files: list[Path],
) -> GuardResult:
    script_path = Path(__file__).resolve().parent / script_name
    if not script_path.exists():
        return GuardResult(
            name=guard_name,
            exit_code=1,
            issues=[
                Issue(
                    severity="high",
                    title=f"{guard_name} 缺失",
                    detail=f"仓库内未找到 {script_name}。",
                    fix_hint="补齐本地守卫脚本并重新执行统一守卫。",
                    guard=guard_name,
                )
            ],
            stdout="",
        )

    with tempfile.NamedTemporaryFile(prefix=f"{guard_name}-", suffix=".json", delete=False) as handle:
        report_json_path = Path(handle.name)

    command = [
        "python3",
        str(script_path),
        "--phase",
        phase,
        "--cwd",
        str(cwd),
        "--fail-on",
        threshold,
        "--report-json",
        str(report_json_path),
    ]
    if task:
        command.extend(["--task", task])
    for changed_file in changed_files:
        command.extend(["--changed-file", str(changed_file)])

    result = run_cmd(command, cwd)
    issues = parse_issue_payload(report_json_path, guard_name)
    try:
        report_json_path.unlink(missing_ok=True)
    except OSError:
        pass
    return GuardResult(name=guard_name, exit_code=result.returncode, issues=issues, stdout=result.stdout.strip())


def render_report(
    phase: str,
    cwd: Path,
    git_root: Path | None,
    threshold: str,
    changed_files: list[Path],
    local_issues: list[Issue],
    subguards: list[GuardResult],
) -> str:
    lines = [
        f"Unified delivery guard: {phase}",
        f"工作目录: {cwd}",
        f"Git 根目录: {git_root if git_root else '未检测到'}",
        f"校验阈值: {threshold}",
        f"改动文件数: {len(changed_files)}",
    ]
    for path in changed_files[:20]:
        lines.append(f"  - {path}")
    if len(changed_files) > 20:
        lines.append(f"  - ... 其余 {len(changed_files) - 20} 个文件")

    lines.append("子守卫结果:")
    for result in subguards:
        lines.append(f"  - {result.name}: exit={result.exit_code}, issues={len(result.issues)}")

    merged_issues = [*local_issues, *[issue for result in subguards for issue in result.issues]]
    if not merged_issues:
        lines.append("问题: 无")
        return "\n".join(lines)

    lines.append("问题:")
    for severity in ("high", "medium", "low"):
        chunk = [issue for issue in merged_issues if issue.severity == severity]
        if not chunk:
            continue
        lines.append(f"  [{severity.upper()}] {len(chunk)}")
        for issue in chunk[:20]:
            title = f"[{issue.guard}] {issue.title}" if issue.guard != "local" else issue.title
            lines.append(f"    - {title}: {issue.detail}")
            if issue.evidence:
                lines.append(f"      证据: {', '.join(issue.evidence[:8])}")
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
                "guard": issue.guard,
            }
            for issue in issues
        ]
        report_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the local unified delivery guard.")
    parser.add_argument("--phase", choices=("start", "batch", "final"), default="final")
    parser.add_argument("--task", default="")
    parser.add_argument("--cwd", default=os.getcwd())
    parser.add_argument("--changed-file", action="append", default=[])
    parser.add_argument("--all", action="store_true", help="扫描仓库内全部交付相关文件，而不是仅看 git/worktree 上下文。")
    parser.add_argument("--fail-on", choices=("auto", "none", "high", "medium", "low"), default="auto")
    parser.add_argument("--report-md", default="")
    parser.add_argument("--report-json", default="")
    parser.add_argument("--skip-rbac-guard", action="store_true")
    parser.add_argument("--skip-state-machine-guard", action="store_true")
    parser.add_argument("--skip-component-reuse-guard", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    cwd = Path(args.cwd).resolve()
    git_root = find_git_root(cwd)
    threshold = compute_threshold(args.phase, args.fail_on)

    changed_files = [Path(item).resolve() for item in args.changed_file]
    if args.all:
        changed_files = collect_all_delivery_files(cwd)
    elif not changed_files and git_root and git_has_commits(git_root):
        changed_files = parse_git_changed_files(git_root)

    local_issues = local_delivery_issues(changed_files, args.task)
    subguards: list[GuardResult] = []

    if not args.skip_rbac_guard:
        subguards.append(
            run_subguard(
                script_name="rbac_alignment_guard.py",
                guard_name="rbac",
                cwd=cwd,
                phase=args.phase,
                threshold=threshold,
                task=args.task,
                changed_files=changed_files,
            )
        )
    if not args.skip_state_machine_guard:
        subguards.append(
            run_subguard(
                script_name="state_machine_guard.py",
                guard_name="state-machine",
                cwd=cwd,
                phase=args.phase,
                threshold=threshold,
                task=args.task,
                changed_files=changed_files,
            )
        )
    if not args.skip_component_reuse_guard:
        subguards.append(
            run_subguard(
                script_name="component_reuse_guard.py",
                guard_name="component-reuse",
                cwd=cwd,
                phase=args.phase,
                threshold=threshold,
                task=args.task,
                changed_files=changed_files,
            )
        )

    merged_issues = [*local_issues, *[issue for result in subguards for issue in result.issues]]
    rendered = render_report(args.phase, cwd, git_root, threshold, changed_files, local_issues, subguards)
    print(rendered)

    report_md = Path(args.report_md).resolve() if args.report_md else None
    report_json = Path(args.report_json).resolve() if args.report_json else None
    write_reports(report_md, report_json, rendered, merged_issues)

    has_blocking_issue = any(severity_meets_threshold(issue.severity, threshold) for issue in merged_issues)
    has_blocking_guard = any(result.exit_code != 0 and threshold != "none" for result in subguards)
    return 1 if (has_blocking_issue or has_blocking_guard) else 0


if __name__ == "__main__":
    sys.exit(main())
