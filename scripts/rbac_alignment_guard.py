#!/usr/bin/env python3
"""
RBAC alignment guard.

Checks RBAC alignment across:
- Backend: route/controller auth enforcement and permission keys
- Frontend: route/menu/button visibility guards and permission keys
- Role/permission drift between backend and frontend
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
CODE_SUFFIXES = {".py", ".java", ".kt", ".go", ".ts", ".tsx", ".js", ".jsx", ".vue", ".php", ".cs"}
IGNORE_PARTS = {
    ".git",
    "node_modules",
    "dist",
    "dist_tsc",
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
}
RBAC_TASK_HINTS = ("rbac", "权限", "鉴权", "授权", "role", "permission", "acl", "guard")

PATH_BACKEND_RE = re.compile(r"(backend|server|api|controller|route|router|handler|service)", re.IGNORECASE)
PATH_FRONTEND_RE = re.compile(r"(frontend|web|ui|client|src|pages|views|components|router|menu)", re.IGNORECASE)
PATH_RBAC_RE = re.compile(r"(rbac|permission|permissions|auth|role|roles|acl|guard|access)", re.IGNORECASE)
PATH_ROUTE_RE = re.compile(r"(controller|route|router|api|handler)", re.IGNORECASE)
PATH_FRONT_SENSITIVE_RE = re.compile(r"(router|route|navigation|menu|nav|sidebar|sider)", re.IGNORECASE)
PATH_PERMISSION_REGISTRY_RE = re.compile(
    r"(permission|permissions|rbac|auth|role|router|navigation|menu|sidebar|guard|access|seed|migrations?)",
    re.IGNORECASE,
)

BACKEND_ROUTE_SIGNAL_RE = re.compile(
    r"@(Get|Post|Put|Patch|Delete|Request)Mapping|router\.(get|post|put|patch|delete)|app\.(get|post|put|patch|delete)|APIRouter\(|@(app|router)\.(get|post|put|patch|delete)|Route\(",
    re.IGNORECASE,
)
BACKEND_AUTH_SIGNAL_RE = re.compile(
    r"PreAuthorize|Secured|RolesAllowed|RequiresPermissions|SaCheckPermission|hasAuthority|hasRole|permission_required|check_permission|require_permission|authorize|auth_guard|authGuard|Depends\(.{0,80}(auth|permission)",
    re.IGNORECASE | re.DOTALL,
)
BACKEND_OPEN_ROUTE_SIGNAL_RE = re.compile(
    r"IGNORE_TOKEN|开放接口|BaseOpenController|AllowAnonymous|AnonymousAccess",
    re.IGNORECASE,
)
FRONTEND_PERMISSION_SIGNAL_RE = re.compile(
    r"v-permission|hasPermission|usePermission|checkPermission|permission\.includes|permissions\.includes|can\(|meta\.permissions|meta\.roles|authStore|roleStore|allowedRoles|beforeEach",
    re.IGNORECASE,
)
FRONTEND_ACTION_SIGNAL_RE = re.compile(
    r"<Route|createBrowserRouter|createRoutesFromElements|createRouter|navigationSections|path\s*:|routes?\s*=|NavLink",
    re.IGNORECASE,
)
BACKEND_PERMISSION_FILE_SIGNAL_RE = re.compile(
    r"insert\s+into\s+permission|role_permission|permission_id|permission[_ ](code|key)|requirespermissions|haspermission|has_permission",
    re.IGNORECASE,
)
FRONTEND_PERMISSION_FILE_SIGNAL_RE = re.compile(
    r"hasPermission|hasAnyPermission|usePermission|PermissionGate|ProtectedRoute|navigationSections|permission\s*:|anyPermissions|meta\.permissions|v-permission",
    re.IGNORECASE,
)

PERMISSION_CANDIDATE_RE = re.compile(r"[\"']([A-Za-z][A-Za-z0-9_.:-]{2,})[\"']")
PERMISSION_CONTEXT_RE = re.compile(
    r"(permission|permissions|perm|authority|authorities|scope|scopes|access|allow|acl|rbac)",
    re.IGNORECASE,
)
PERMISSION_KEY_RE = re.compile(r"^[a-z][a-z0-9_-]*(?:[.:][A-Za-z][A-Za-z0-9_-]*){1,6}$")
PERMISSION_ACTION_SUFFIXES = {
    "view",
    "manage",
    "create",
    "update",
    "delete",
    "read",
    "write",
    "list",
    "export",
    "import",
    "approve",
    "reject",
    "execute",
    "config",
    "configure",
    "publish",
    "trigger_alert",
    "schedule",
    "feedback",
    "generate",
    "sync",
}

ROLE_CANDIDATE_RE = re.compile(r"[\"']([A-Za-z0-9_\-:\u4e00-\u9fa5]{2,32})[\"']")
ROLE_HINT_RE = re.compile(r"(role|roles|角色)", re.IGNORECASE)
CHINESE_ROLE_NAME_RE = re.compile(r"(管理员|负责人|顾问|合作伙伴|老师|学生|运营|财务|销售)")
KNOWN_ROLE_TOKENS = {
    "admin",
    "superadmin",
    "manager",
    "operator",
    "teacher",
    "student",
    "guest",
    "auditor",
    "maintainer",
    "owner",
    "管理员",
    "超级管理员",
    "教师",
    "学生",
    "访客",
}
KNOWN_NON_ROLE_TOKENS = {
    "get",
    "post",
    "put",
    "delete",
    "patch",
    "options",
    "head",
}
BACKEND_INTERNAL_ONLY_ROLE_TOKENS = {
    "admin",
    "superadmin",
    "owner",
    "maintainer",
    "operator",
    "guest",
    "auditor",
    "teacher",
    "student",
    "管理员",
    "超级管理员",
    "访客",
    "教师",
    "学生",
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
    backend_permission_keys: set[str] = field(default_factory=set)
    frontend_permission_keys: set[str] = field(default_factory=set)
    backend_registry_permission_keys: set[str] = field(default_factory=set)
    frontend_registry_permission_keys: set[str] = field(default_factory=set)
    backend_roles: set[str] = field(default_factory=set)
    frontend_roles: set[str] = field(default_factory=set)
    backend_route_files_without_auth: list[str] = field(default_factory=list)
    frontend_sensitive_files_without_guard: list[str] = field(default_factory=list)
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
    result = run_cmd(["git", "rev-parse", "--verify", "HEAD"], root)
    return result.returncode == 0


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


def read_text(path: Path, limit: int = 260_000) -> str:
    if not path.exists() or not path.is_file():
        return ""
    try:
        return path.read_text(encoding="utf-8", errors="ignore")[:limit]
    except OSError:
        return ""


def is_ignored_path(path: Path) -> bool:
    parts = {part.lower() for part in path.parts}
    if any(part in parts for part in IGNORE_PARTS):
        return True
    normalized = path.as_posix().lower()
    noisy_markers = (
        "/.local/",
        '/".local/',
        "/.gocache/",
        "/.gocache-test/",
        "/.gomodcache/",
        "/tools/go/",
    )
    return any(marker in normalized for marker in noisy_markers)


def is_code_path(path: Path) -> bool:
    if is_ignored_path(path):
        return False
    return path.suffix.lower() in CODE_SUFFIXES


def is_documentation_path(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return "/docs/" in normalized or path.suffix.lower() == ".md"


def is_test_support_path(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return "/tests/" in normalized or "/__tests__/" in normalized or ".test." in normalized or ".spec." in normalized


def is_skill_support_path(path: Path) -> bool:
    normalized = path.as_posix().lower()
    parts = {part.lower() for part in path.parts}
    if "skills" not in parts:
        return False
    if path.name == "SKILL.md":
        return True
    if "/references/" in normalized:
        return True
    if normalized.endswith("/agents/openai.yaml"):
        return True
    if "/scripts/" in normalized and "/docs/skills/" in normalized:
        return True
    return False


def is_support_only_path(path: Path) -> bool:
    return is_documentation_path(path) or is_test_support_path(path) or is_skill_support_path(path)


def classify_side(path: Path) -> str:
    normalized = path.as_posix().lower()
    if "/cool-admin-midway/" in normalized or "/backend/" in normalized or "/server/" in normalized:
        return "backend"
    if "/cool-admin-vue/" in normalized or "/cool-uni/" in normalized or "/frontend/" in normalized:
        return "frontend"
    backend = bool(PATH_BACKEND_RE.search(normalized))
    frontend = bool(PATH_FRONTEND_RE.search(normalized))
    if backend and not frontend:
        return "backend"
    if frontend and not backend:
        return "frontend"
    if "/src/" in normalized:
        return "frontend"
    return "backend"


def normalize_role(role: str) -> str:
    value = role.strip()
    if not value:
        return ""
    if value.startswith("ROLE_"):
        value = value[5:]
    return value


def is_role_like(token: str) -> bool:
    normalized = token.strip()
    if not normalized:
        return False
    if normalized.endswith("Page") or normalized.endswith("Route") or normalized.endswith("View"):
        return False
    if "." in normalized or "/" in normalized:
        return False
    lower = normalized.lower()
    if lower in KNOWN_NON_ROLE_TOKENS:
        return False
    if lower in KNOWN_ROLE_TOKENS:
        return True
    if normalized.startswith("ROLE_"):
        return True
    if normalized.isupper():
        return False
    if re.fullmatch(r"(super_)?(admin|manager|operator|teacher|student|guest|auditor|owner|maintainer)", lower):
        return True
    if re.fullmatch(
        r"(admin|manager|operator|teacher|student|guest|auditor|owner|maintainer)([_:-](admin|manager|operator|teacher|student|guest|auditor|owner|maintainer))+",
        lower,
    ):
        return True
    return False


def is_permission_like(token: str) -> bool:
    if len(token) < 4 or not PERMISSION_KEY_RE.fullmatch(token):
        return False
    lower = token.lower()
    if "://" in lower:
        return False
    if lower.endswith((".png", ".jpg", ".jpeg", ".svg", ".css", ".html", ".md", ".json", ".yaml", ".yml")):
        return False
    if lower.startswith("payload."):
        return False
    if ":" not in token and "." not in token:
        return False
    tail = re.split(r"[.:]", lower)[-1]
    return tail in PERMISSION_ACTION_SUFFIXES


def is_permission_registry_path(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return bool(PATH_PERMISSION_REGISTRY_RE.search(normalized))


def is_canonical_permission_registry_path(path: Path) -> bool:
    normalized = path.as_posix().lower()
    return normalized.endswith("/generated/permissions.generated.ts")


def is_relaxed_registry_permission_key(token: str) -> bool:
    return bool(PERMISSION_KEY_RE.fullmatch(token) and token.count(":") >= 2)


def extract_permission_keys(path: Path, text: str) -> set[str]:
    keys: set[str] = set()
    file_level_context = bool(
        is_permission_registry_path(path)
        or BACKEND_PERMISSION_FILE_SIGNAL_RE.search(text)
        or FRONTEND_PERMISSION_FILE_SIGNAL_RE.search(text)
    )
    for match in PERMISSION_CANDIDATE_RE.finditer(text):
        candidate = match.group(1)
        if not (is_permission_like(candidate) or (file_level_context and is_relaxed_registry_permission_key(candidate))):
            continue
        left = text[max(0, match.start() - 100) : match.start()]
        right = text[match.end() : match.end() + 20]
        around = left + right
        if file_level_context or PERMISSION_CONTEXT_RE.search(around):
            keys.add(candidate)
    return keys


def extract_roles(text: str) -> set[str]:
    roles: set[str] = set()
    for match in ROLE_CANDIDATE_RE.finditer(text):
        candidate = normalize_role(match.group(1))
        if not candidate:
            continue
        left = text[max(0, match.start() - 60) : match.start()]
        around = left + text[match.end() : match.end() + 20]
        if is_role_like(candidate):
            roles.add(candidate)
            continue
        if ROLE_HINT_RE.search(around) and CHINESE_ROLE_NAME_RE.search(candidate):
            roles.add(candidate)
    return roles


def should_collect_permission_keys(path: Path, text: str, side: str) -> bool:
    normalized = path.as_posix().lower()
    if side == "backend":
        if is_permission_registry_path(path):
            return True
        if BACKEND_AUTH_SIGNAL_RE.search(text) or BACKEND_PERMISSION_FILE_SIGNAL_RE.search(text):
            return True
        return False
    if is_permission_registry_path(path):
        return True
    return bool(FRONTEND_PERMISSION_FILE_SIGNAL_RE.search(text))


def should_collect_roles(path: Path, text: str) -> bool:
    normalized = path.as_posix().lower()
    if PATH_RBAC_RE.search(normalized):
        return True
    if "role_names" in text:
        return True
    return bool(ROLE_HINT_RE.search(text))


def is_frontend_sensitive_entry(path: Path, text: str) -> bool:
    normalized = path.as_posix().lower()
    name = path.name.lower()
    if "/miniapp/" in normalized:
        return False
    if "/hooks/" in normalized or "/utils/" in normalized:
        return False
    if not PATH_FRONT_SENSITIVE_RE.search(normalized):
        return False
    if not any(token in name for token in ("router", "route", "navigation", "menu", "sidebar", "sider")):
        return False
    if "/hooks/" in normalized and path.name.startswith("use"):
        return False
    if "/components/" in normalized and "sidebar" not in path.name.lower() and "menu" not in path.name.lower():
        return False
    return bool(FRONTEND_ACTION_SIGNAL_RE.search(text))


def detect_context(task: str, changed_files: list[Path], force: bool, explicit_roles: set[str], explicit_keys: set[str]) -> tuple[bool, str]:
    if force:
        return True, "forced-by-flag"
    if explicit_roles or explicit_keys:
        return True, "explicit-role-or-permission"
    lowered_task = task.lower()
    if any(hint in lowered_task for hint in RBAC_TASK_HINTS):
        return True, "task-hint"
    relevant_files = [path for path in changed_files if not is_support_only_path(path)]
    if any(PATH_RBAC_RE.search(path.as_posix()) for path in relevant_files):
        return True, "path-hint"
    return False, "no-rbac-evidence"


def scan_changed_files(changed_files: list[Path]) -> ScanResult:
    result = ScanResult()
    for path in changed_files:
        if is_support_only_path(path):
            continue
        if not is_code_path(path):
            continue
        text = read_text(path)
        if not text:
            continue
        side = classify_side(path)
        permission_keys = extract_permission_keys(path, text) if should_collect_permission_keys(path, text, side) else set()
        roles = extract_roles(text) if should_collect_roles(path, text) else set()

        if side == "backend":
            result.scanned_backend_files += 1
            result.backend_permission_keys.update(permission_keys)
            if is_canonical_permission_registry_path(path):
                result.backend_registry_permission_keys.update(permission_keys)
            result.backend_roles.update(roles)
            if PATH_ROUTE_RE.search(path.as_posix()) and BACKEND_ROUTE_SIGNAL_RE.search(text):
                if not BACKEND_AUTH_SIGNAL_RE.search(text) and not BACKEND_OPEN_ROUTE_SIGNAL_RE.search(text):
                    result.backend_route_files_without_auth.append(str(path))
        else:
            result.scanned_frontend_files += 1
            result.frontend_permission_keys.update(permission_keys)
            if is_canonical_permission_registry_path(path):
                result.frontend_registry_permission_keys.update(permission_keys)
            result.frontend_roles.update(roles)
            if is_frontend_sensitive_entry(path, text):
                if not FRONTEND_PERMISSION_SIGNAL_RE.search(text) and "ProtectedRoute" not in text:
                    result.frontend_sensitive_files_without_guard.append(str(path))
    return result


def add_issue(
    issues: list[Issue],
    severity: str,
    title: str,
    detail: str,
    evidence: list[str] | None = None,
    fix_hint: str = "",
) -> None:
    issues.append(
        Issue(
            severity=severity,
            title=title,
            detail=detail,
            evidence=evidence or [],
            fix_hint=fix_hint,
        )
    )


def dedupe_issues(issues: list[Issue]) -> list[Issue]:
    seen: set[tuple[str, str, str]] = set()
    out: list[Issue] = []
    for issue in issues:
        key = (issue.severity, issue.title, issue.detail)
        if key in seen:
            continue
        seen.add(key)
        out.append(issue)
    return out


def compute_threshold(phase: str, fail_on: str) -> str:
    if fail_on != "auto":
        return fail_on
    if phase == "start":
        return "none"
    return "high"


def severity_meets_threshold(issue_severity: str, threshold: str) -> bool:
    if threshold == "none":
        return False
    return SEVERITY_RANK[issue_severity] <= SEVERITY_RANK[threshold]


def build_report(
    phase: str,
    task: str,
    cwd: Path,
    git_root: Path | None,
    changed_files: list[Path],
    explicit_roles: set[str],
    explicit_keys: set[str],
    force: bool,
    fail_threshold: str,
) -> Report:
    context_enabled, context_reason = detect_context(task, changed_files, force, explicit_roles, explicit_keys)
    notes: list[str] = []
    issues: list[Issue] = []
    scan = ScanResult()

    if not context_enabled:
        notes.append("未检测到 RBAC 相关上下文，本次跳过严格阻断。")
        return Report(
            phase=phase,
            cwd=cwd,
            git_root=git_root,
            context_enabled=False,
            context_reason=context_reason,
            changed_files=changed_files,
            scan=scan,
            issues=[],
            notes=notes,
            fail_threshold=fail_threshold,
        )

    scan = scan_changed_files(changed_files)
    is_full_inventory = len(changed_files) >= 200 and not explicit_keys and not explicit_roles
    key_drift_severity = "medium" if explicit_keys or len(changed_files) < 200 else "low"
    key_drift_backend_detail = (
        "后端新增或调整的权限键未在前端权限控制中出现。"
        if key_drift_severity == "medium"
        else "全量盘点发现后端权限键未在前端证据中出现，建议作为治理清单持续收敛。"
    )
    key_drift_frontend_detail = (
        "前端使用了后端未声明的权限键，存在假权限或越权风险。"
        if key_drift_severity == "medium"
        else "全量盘点发现前端权限键未在后端证据中出现，建议作为治理清单持续收敛。"
    )

    if scan.backend_route_files_without_auth:
        add_issue(
            issues,
            "high",
            "后端路由改动缺少鉴权证据",
            "检测到后端路由/接口文件改动，但未发现明确鉴权标记。",
            evidence=scan.backend_route_files_without_auth[:12],
            fix_hint="在接口层补齐角色/权限校验（注解、中间件或统一鉴权函数）。",
        )

    if scan.frontend_sensitive_files_without_guard:
        add_issue(
            issues,
            "medium",
            "前端敏感入口缺少权限控制证据",
            "检测到路由/菜单/操作入口改动，但未发现显式权限判断。",
            evidence=scan.frontend_sensitive_files_without_guard[:12],
            fix_hint="为路由、菜单和按钮补充 hasPermission/can/v-permission 等控制。",
        )

    compare_backend_keys = scan.backend_permission_keys
    compare_frontend_keys = scan.frontend_permission_keys
    if is_full_inventory and scan.backend_registry_permission_keys and scan.frontend_registry_permission_keys:
        compare_backend_keys = scan.backend_registry_permission_keys
        compare_frontend_keys = scan.frontend_registry_permission_keys
        notes.append("全量 RBAC 对齐优先使用双端 canonical permissions.generated.ts 作为权限键基准。")

    backend_only_keys = sorted(compare_backend_keys - compare_frontend_keys)
    frontend_only_keys = sorted(compare_frontend_keys - compare_backend_keys)
    if backend_only_keys:
        if is_full_inventory:
            notes.append(
                "全量盘点发现后端权限键覆盖不完全（治理级提示），已降为非阻断备注。"
            )
        else:
            add_issue(
                issues,
                key_drift_severity,
                "后端权限键未在前端对齐",
                key_drift_backend_detail,
                evidence=backend_only_keys[:15],
                fix_hint="同步前端路由/菜单/按钮权限键，确保显隐和后端一致。",
            )
    if frontend_only_keys:
        if is_full_inventory:
            notes.append(
                "全量盘点发现前端权限键覆盖不完全（治理级提示），已降为非阻断备注。"
            )
        else:
            add_issue(
                issues,
                key_drift_severity,
                "前端权限键未在后端对齐",
                key_drift_frontend_detail,
                evidence=frontend_only_keys[:15],
                fix_hint="在后端补齐权限定义与校验，或删除无效前端权限键。",
            )

    if scan.backend_permission_keys and scan.frontend_permission_keys:
        overlap = scan.backend_permission_keys & scan.frontend_permission_keys
        if not overlap:
            add_issue(
                issues,
                "high",
                "前后端权限键无交集",
                "前后端都检测到权限键，但命名体系完全不一致。",
                fix_hint="统一权限键命名规范（例如 resource:action）并做双端迁移。",
            )

    if explicit_keys:
        missing_backend = sorted(explicit_keys - scan.backend_permission_keys)
        missing_frontend = sorted(explicit_keys - scan.frontend_permission_keys)
        if missing_backend:
            add_issue(
                issues,
                "high",
                "显式权限键未落地到后端",
                "声明的关键权限点在后端未检测到。",
                evidence=missing_backend,
                fix_hint="补齐后端权限声明与鉴权逻辑。",
            )
        if missing_frontend:
            add_issue(
                issues,
                "high",
                "显式权限键未落地到前端",
                "声明的关键权限点在前端未检测到。",
                evidence=missing_frontend,
                fix_hint="补齐前端路由/菜单/按钮权限控制。",
            )

    if explicit_roles:
        missing_backend_roles = sorted(explicit_roles - scan.backend_roles)
        missing_frontend_roles = sorted(explicit_roles - scan.frontend_roles)
        if missing_backend_roles:
            add_issue(
                issues,
                "medium",
                "显式角色未在后端检测到",
                "声明的角色未在后端角色逻辑中出现。",
                evidence=missing_backend_roles,
                fix_hint="确认后端角色枚举、角色映射和鉴权规则已更新。",
            )
        if missing_frontend_roles:
            add_issue(
                issues,
                "medium",
                "显式角色未在前端检测到",
                "声明的角色未在前端显隐或路由控制中出现。",
                evidence=missing_frontend_roles,
                fix_hint="确认前端角色映射、菜单路由和按钮显隐规则已更新。",
            )

    comparable_backend_roles = scan.backend_roles - BACKEND_INTERNAL_ONLY_ROLE_TOKENS
    backend_only_roles = sorted(comparable_backend_roles - scan.frontend_roles)
    frontend_only_roles = sorted(scan.frontend_roles - scan.backend_roles)
    if not is_full_inventory:
        if backend_only_roles and scan.frontend_roles:
            add_issue(
                issues,
                "low",
                "后端角色集合与前端存在差异",
                "后端存在前端未识别的角色。",
                evidence=backend_only_roles[:10],
                fix_hint="确认前端是否需要识别该角色，或标注为仅后端内部角色。",
            )
        if frontend_only_roles and scan.backend_roles:
            add_issue(
                issues,
                "low",
                "前端角色集合与后端存在差异",
                "前端存在后端未识别的角色。",
                evidence=frontend_only_roles[:10],
                fix_hint="确认角色来源，避免前端使用未授权角色标识。",
            )

    if scan.scanned_backend_files == 0 and scan.scanned_frontend_files == 0:
        notes.append("当前改动中未发现可解析代码文件，RBAC 检测覆盖有限。")

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
    lines: list[str] = []
    lines.append(f"RBAC 对齐守卫: {report.phase}")
    lines.append(f"工作目录: {report.cwd}")
    lines.append(f"Git 根目录: {report.git_root if report.git_root else '未检测到'}")
    lines.append(f"校验阈值: {report.fail_threshold}")
    lines.append(f"RBAC 上下文: {'开启' if report.context_enabled else '跳过'} ({report.context_reason})")
    lines.append(f"改动文件数: {len(report.changed_files)}")
    lines.append(
        "扫描统计: "
        f"backend_files={report.scan.scanned_backend_files} "
        f"frontend_files={report.scan.scanned_frontend_files} "
        f"backend_perm_keys={len(report.scan.backend_permission_keys)} "
        f"frontend_perm_keys={len(report.scan.frontend_permission_keys)}"
    )
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
    parser = argparse.ArgumentParser(description="RBAC alignment guard.")
    parser.add_argument("--phase", choices=("start", "batch", "final"), default="final")
    parser.add_argument("--task", default="", help="可选：用户任务描述文本。")
    parser.add_argument("--cwd", default=os.getcwd(), help="项目目录，默认当前目录。")
    parser.add_argument("--changed-file", action="append", default=[], help="显式传入改动文件，可重复。")
    parser.add_argument("--role", action="append", default=[], help="显式声明本次角色，可重复。")
    parser.add_argument("--permission-key", action="append", default=[], help="显式声明本次权限键，可重复。")
    parser.add_argument("--force", action="store_true", help="即使无 RBAC 上下文证据也强制执行严格校验。")
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
    if not changed_files and git_root:
        if git_has_commits(git_root):
            changed_files = parse_git_changed_files(git_root)
        else:
            changed_files = []
    changed_files = [path for path in changed_files if not is_ignored_path(path)]

    explicit_roles = {normalize_role(role) for role in args.role if normalize_role(role)}
    explicit_keys = {key.strip() for key in args.permission_key if key.strip()}

    report = build_report(
        phase=args.phase,
        task=args.task,
        cwd=cwd,
        git_root=git_root,
        changed_files=changed_files,
        explicit_roles=explicit_roles,
        explicit_keys=explicit_keys,
        force=args.force,
        fail_threshold=threshold,
    )

    rendered = render_report(report)
    print(rendered)

    report_md = Path(args.report_md).resolve() if args.report_md else None
    report_json = Path(args.report_json).resolve() if args.report_json else None
    write_reports(report_md, report_json, rendered, report.issues)

    fail = any(severity_meets_threshold(issue.severity, threshold) for issue in report.issues)
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
