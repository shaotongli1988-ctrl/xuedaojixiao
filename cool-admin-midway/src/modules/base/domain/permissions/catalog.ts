/**
 * Base 模块菜单与权限事实源聚合目录。
 * 这里只负责把 menu.json 与 generated 权限产物统一挂到 domain 入口下，不负责改写运行时鉴权或重新生成权限位图。
 * 关键依赖是 menu.json、permissions.generated、permission-bits.generated 与 route-permissions.generated。
 * 维护重点是这里必须忠实反映当前生成链关系，不能擅自重排权限位或修改权限语义。
 */

import baseMenuTree = require('../../menu.json');
import basePermissionSourceConfig = require('./source.json');
import {
  ADMIN_PERMISSION_KEYS,
  PERMISSIONS,
  PERMISSION_SOURCE_FILE,
  type AdminPermissionKey,
} from '../../generated/permissions.generated';
export type { AdminPermissionKey } from '../../generated/permissions.generated';
import {
  ALL_PERMISSION_BITS,
  formatPermissionMask,
  hasAnyPermissionBit,
  hasPermissionBit,
  normalizePermissionKey,
  parsePermissionMask,
  PERMISSION_BIT_BY_KEY,
  resolvePermissionMask,
  SUPER_ADMIN_PERMISSION_BIT,
} from '../../generated/permission-bits.generated';
import { ROUTE_PERMISSION_BY_PATH } from '../../generated/route-permissions.generated';

export interface BaseMenuNodeDefinition {
  name: string;
  router: string | null;
  perms: string | null;
  type: number;
  icon: string | null;
  orderNum: number;
  viewPath: string | null;
  keepAlive: boolean;
  isShow: boolean;
  childMenus: readonly BaseMenuNodeDefinition[];
}

export interface BaseMenuRouteEntry {
  path: string;
  permissionKeys: readonly AdminPermissionKey[];
}

export type BaseRoutePermissionRequirement =
  | AdminPermissionKey
  | {
      readonly or: readonly BaseRoutePermissionRequirement[];
    };

export interface BasePermissionCatalog {
  sourceFile: string;
  generatedSourceFile: string;
  generatedTargets: readonly string[];
  ownedSourceFiles: readonly string[];
  permissionUsageScanRoots: readonly string[];
  permissionUsageIgnoredPathSegments: readonly string[];
  permissionUsageScanExtensions: readonly string[];
  permissionUsageAllowedFiles: readonly string[];
  generatedPermissionFile: string;
  generatedPermissionBitsFile: string;
  generatedRoutePermissionsFile: string;
  menuTree: readonly BaseMenuNodeDefinition[];
  menuRouteEntries: readonly BaseMenuRouteEntry[];
  menuPermissionKeys: readonly AdminPermissionKey[];
  permissionKeys: readonly AdminPermissionKey[];
  permissions: typeof PERMISSIONS;
  permissionBitByKey: Readonly<Record<AdminPermissionKey, bigint>>;
  allPermissionBits: readonly bigint[];
  superAdminPermissionBit: bigint;
  normalizePermissionKey: typeof normalizePermissionKey;
  parsePermissionMask: typeof parsePermissionMask;
  formatPermissionMask: typeof formatPermissionMask;
  resolvePermissionMask: typeof resolvePermissionMask;
  hasPermissionBit: typeof hasPermissionBit;
  hasAnyPermissionBit: typeof hasAnyPermissionBit;
  runtimePermissionAliases: Readonly<Record<string, readonly string[]>>;
  loginOnlyRoutePrefixes: readonly string[];
  normalizeAdminRouteUrl: (url: string) => string;
  resolveRuntimePermissionCandidates: (url: string) => readonly string[];
  isLoginOnlyRoute: (url: string) => boolean;
  routePermissionByPath: Readonly<
    Record<string, BaseRoutePermissionRequirement>
  >;
  routePermissionKeys: readonly AdminPermissionKey[];
}

interface BasePermissionSourceConfig {
  menuSourcePath: string;
  generatedTargets: readonly string[];
  ownedSourceFiles: readonly string[];
  permissionUsageScanRoots: readonly string[];
  permissionUsageIgnoredPathSegments: readonly string[];
  permissionUsageScanExtensions: readonly string[];
  permissionUsageAllowedFiles: readonly string[];
  writeActions: readonly string[];
  routePermissionPriority: Readonly<Record<string, number>>;
}

const BASE_PERMISSION_SOURCE_CONFIG =
  basePermissionSourceConfig as BasePermissionSourceConfig;
const BASE_MENU_TREE =
  baseMenuTree as readonly BaseMenuNodeDefinition[];

function splitPermissionKeys(perms: string | null | undefined) {
  if (typeof perms !== 'string' || !perms.trim()) {
    return [] as AdminPermissionKey[];
  }

  return perms
    .split(',')
    .map(item => item.trim())
    .filter(Boolean) as AdminPermissionKey[];
}

function collectMenuRouteEntries(
  nodes: readonly BaseMenuNodeDefinition[]
): BaseMenuRouteEntry[] {
  const entries: BaseMenuRouteEntry[] = [];

  for (const node of nodes) {
    if (node.router) {
      entries.push({
        path: node.router,
        permissionKeys: splitPermissionKeys(node.perms),
      });
    }

    if (node.childMenus.length) {
      entries.push(...collectMenuRouteEntries(node.childMenus));
    }
  }

  return entries;
}

function collectMenuPermissionKeys(nodes: readonly BaseMenuNodeDefinition[]) {
  const permissionKeys = new Set<AdminPermissionKey>();

  for (const node of nodes) {
    for (const permissionKey of splitPermissionKeys(node.perms)) {
      permissionKeys.add(permissionKey);
    }

    if (node.childMenus.length) {
      for (const permissionKey of collectMenuPermissionKeys(node.childMenus)) {
        permissionKeys.add(permissionKey);
      }
    }
  }

  return [...permissionKeys].sort();
}

function collectRoutePermissionKeys(
  requirement: BaseRoutePermissionRequirement,
  bag: Set<AdminPermissionKey>
) {
  if (typeof requirement === 'string') {
    bag.add(requirement);
    return;
  }

  for (const item of requirement.or) {
    collectRoutePermissionKeys(item, bag);
  }
}

const INTERNAL_BASE_MENU_ROUTE_ENTRIES = Object.freeze(
  collectMenuRouteEntries(BASE_MENU_TREE)
);
const INTERNAL_BASE_MENU_PERMISSION_KEYS = Object.freeze(
  collectMenuPermissionKeys(BASE_MENU_TREE)
);
const INTERNAL_BASE_ROUTE_PERMISSION_KEYS = Object.freeze(
  (() => {
    const permissionKeys = new Set<AdminPermissionKey>();

    for (const requirement of Object.values(
      ROUTE_PERMISSION_BY_PATH as Record<string, BaseRoutePermissionRequirement>
    )) {
      collectRoutePermissionKeys(requirement, permissionKeys);
    }

    return [...permissionKeys].sort();
  })()
);
const INTERNAL_BASE_RUNTIME_PERMISSION_ALIASES = Object.freeze({
  'performance/assessment/page': Object.freeze([
    'performance/assessment/myPage',
    'performance/assessment/pendingPage',
  ]),
});
const INTERNAL_BASE_LOGIN_ONLY_ROUTE_PREFIXES = Object.freeze([
  '/admin/performance/teacherInfo/',
  '/admin/performance/teacherFollow/',
  '/admin/performance/teacherCooperation/',
  '/admin/performance/teacherClass/',
  '/admin/performance/teacherDashboard/',
  '/admin/performance/teacherTodo/',
  '/admin/performance/teacherAgent/',
  '/admin/performance/teacherAgentRelation/',
  '/admin/performance/teacherAttribution/',
  '/admin/performance/teacherAttributionConflict/',
  '/admin/performance/teacherAgentAudit/',
]);

function normalizeAdminRouteUrl(url: string) {
  return String(url || '').split('?')[0].trim().replace('/admin/', '');
}

function resolveRuntimePermissionCandidates(url: string) {
  const normalizedUrl = normalizeAdminRouteUrl(url);
  return Object.freeze([
    normalizedUrl,
    ...(INTERNAL_BASE_RUNTIME_PERMISSION_ALIASES[normalizedUrl] || []),
  ]);
}

function isLoginOnlyRoute(url: string) {
  const normalizedUrl = String(url || '').split('?')[0].trim();
  return INTERNAL_BASE_LOGIN_ONLY_ROUTE_PREFIXES.some(prefix =>
    normalizedUrl.startsWith(prefix)
  );
}

export const BASE_PERMISSION_CATALOG: BasePermissionCatalog = Object.freeze({
  sourceFile: BASE_PERMISSION_SOURCE_CONFIG.menuSourcePath,
  generatedSourceFile: PERMISSION_SOURCE_FILE,
  generatedTargets: BASE_PERMISSION_SOURCE_CONFIG.generatedTargets,
  ownedSourceFiles: BASE_PERMISSION_SOURCE_CONFIG.ownedSourceFiles,
  permissionUsageScanRoots: BASE_PERMISSION_SOURCE_CONFIG.permissionUsageScanRoots,
  permissionUsageIgnoredPathSegments:
    BASE_PERMISSION_SOURCE_CONFIG.permissionUsageIgnoredPathSegments,
  permissionUsageScanExtensions:
    BASE_PERMISSION_SOURCE_CONFIG.permissionUsageScanExtensions,
  permissionUsageAllowedFiles:
    BASE_PERMISSION_SOURCE_CONFIG.permissionUsageAllowedFiles,
  generatedPermissionFile: 'src/modules/base/generated/permissions.generated.ts',
  generatedPermissionBitsFile:
    'src/modules/base/generated/permission-bits.generated.ts',
  generatedRoutePermissionsFile:
    'src/modules/base/generated/route-permissions.generated.ts',
  menuTree: BASE_MENU_TREE,
  menuRouteEntries: INTERNAL_BASE_MENU_ROUTE_ENTRIES,
  menuPermissionKeys: INTERNAL_BASE_MENU_PERMISSION_KEYS,
  permissionKeys: ADMIN_PERMISSION_KEYS,
  permissions: PERMISSIONS,
  permissionBitByKey: PERMISSION_BIT_BY_KEY,
  allPermissionBits: ALL_PERMISSION_BITS,
  superAdminPermissionBit: SUPER_ADMIN_PERMISSION_BIT,
  normalizePermissionKey,
  parsePermissionMask,
  formatPermissionMask,
  resolvePermissionMask,
  hasPermissionBit,
  hasAnyPermissionBit,
  runtimePermissionAliases: INTERNAL_BASE_RUNTIME_PERMISSION_ALIASES,
  loginOnlyRoutePrefixes: INTERNAL_BASE_LOGIN_ONLY_ROUTE_PREFIXES,
  normalizeAdminRouteUrl,
  resolveRuntimePermissionCandidates,
  isLoginOnlyRoute,
  routePermissionByPath: ROUTE_PERMISSION_BY_PATH as Readonly<
    Record<string, BaseRoutePermissionRequirement>
  >,
  routePermissionKeys: INTERNAL_BASE_ROUTE_PERMISSION_KEYS,
});

export const BASE_MENU_TREE_DEFINITION = BASE_PERMISSION_CATALOG.menuTree;
export const BASE_MENU_ROUTE_ENTRIES = BASE_PERMISSION_CATALOG.menuRouteEntries;
export const BASE_MENU_PERMISSION_KEYS = BASE_PERMISSION_CATALOG.menuPermissionKeys;
export const BASE_ADMIN_PERMISSION_KEYS = BASE_PERMISSION_CATALOG.permissionKeys;
export const BASE_PERMISSION_SOURCE_FILE = BASE_PERMISSION_CATALOG.sourceFile;
export const BASE_PERMISSION_GENERATED_TARGETS =
  BASE_PERMISSION_CATALOG.generatedTargets;
export const BASE_PERMISSION_OWNED_SOURCE_FILES =
  BASE_PERMISSION_CATALOG.ownedSourceFiles;
export const BASE_PERMISSION_USAGE_SCAN_ROOTS =
  BASE_PERMISSION_CATALOG.permissionUsageScanRoots;
export const BASE_PERMISSION_USAGE_IGNORED_PATH_SEGMENTS =
  BASE_PERMISSION_CATALOG.permissionUsageIgnoredPathSegments;
export const BASE_PERMISSION_USAGE_SCAN_EXTENSIONS =
  BASE_PERMISSION_CATALOG.permissionUsageScanExtensions;
export const BASE_PERMISSION_USAGE_ALLOWED_FILES =
  BASE_PERMISSION_CATALOG.permissionUsageAllowedFiles;
export const BASE_PERMISSION_BIT_BY_KEY =
  BASE_PERMISSION_CATALOG.permissionBitByKey;
export const BASE_SUPER_ADMIN_PERMISSION_BIT =
  BASE_PERMISSION_CATALOG.superAdminPermissionBit;
export const baseNormalizePermissionKey =
  BASE_PERMISSION_CATALOG.normalizePermissionKey;
export const baseParsePermissionMask =
  BASE_PERMISSION_CATALOG.parsePermissionMask;
export const baseFormatPermissionMask =
  BASE_PERMISSION_CATALOG.formatPermissionMask;
export const baseResolvePermissionMask =
  BASE_PERMISSION_CATALOG.resolvePermissionMask;
export const baseHasPermissionBit =
  BASE_PERMISSION_CATALOG.hasPermissionBit;
export const baseHasAnyPermissionBit =
  BASE_PERMISSION_CATALOG.hasAnyPermissionBit;
export const BASE_RUNTIME_PERMISSION_ALIASES =
  BASE_PERMISSION_CATALOG.runtimePermissionAliases;
export const BASE_LOGIN_ONLY_ROUTE_PREFIXES =
  BASE_PERMISSION_CATALOG.loginOnlyRoutePrefixes;
export const baseNormalizeAdminRouteUrl =
  BASE_PERMISSION_CATALOG.normalizeAdminRouteUrl;
export const baseResolveRuntimePermissionCandidates =
  BASE_PERMISSION_CATALOG.resolveRuntimePermissionCandidates;
export const baseIsLoginOnlyRoute =
  BASE_PERMISSION_CATALOG.isLoginOnlyRoute;
export const BASE_PERMISSION_WRITE_ACTIONS =
  BASE_PERMISSION_SOURCE_CONFIG.writeActions;
export const BASE_ROUTE_PERMISSION_PRIORITY =
  BASE_PERMISSION_SOURCE_CONFIG.routePermissionPriority;
export const BASE_ROUTE_PERMISSION_BY_PATH =
  BASE_PERMISSION_CATALOG.routePermissionByPath;
export const BASE_ROUTE_PERMISSION_KEYS =
  BASE_PERMISSION_CATALOG.routePermissionKeys;
