/**
 * Base 权限生成链的源配置与纯计算入口。
 * 这里只负责读取 source.json、解析菜单权限键并生成权限模型，不负责写入 generated 文件或参与运行时鉴权。
 * 关键依赖是 scripts/generate-permissions.mjs 与后续权限守卫都会复用这里的纯函数。
 * 维护重点是这里必须保持 source-only，不能反向依赖 generated 产物，否则会再次形成循环主源。
 */

import fs from 'node:fs';
import path from 'node:path';

export const BASE_PERMISSION_SOURCE_CONFIG_RELATIVE_PATH =
  'cool-admin-midway/src/modules/base/domain/permissions/source.json';

export function loadBasePermissionSourceConfig(repoRoot) {
  const sourceConfigPath = path.join(
    repoRoot,
    BASE_PERMISSION_SOURCE_CONFIG_RELATIVE_PATH
  );
  const sourceConfig = JSON.parse(fs.readFileSync(sourceConfigPath, 'utf8'));

  return {
    sourceConfigPath,
    menuSourcePath: String(sourceConfig.menuSourcePath || '').trim(),
    generatedTargets: Array.isArray(sourceConfig.generatedTargets)
      ? sourceConfig.generatedTargets.map(item => String(item || '').trim())
      : [],
    ownedSourceFiles: Array.isArray(sourceConfig.ownedSourceFiles)
      ? sourceConfig.ownedSourceFiles.map(item => String(item || '').trim())
      : [],
    permissionUsageScanRoots: Array.isArray(sourceConfig.permissionUsageScanRoots)
      ? sourceConfig.permissionUsageScanRoots.map(item =>
          String(item || '').trim()
        )
      : [],
    permissionUsageIgnoredPathSegments: Array.isArray(
      sourceConfig.permissionUsageIgnoredPathSegments
    )
      ? sourceConfig.permissionUsageIgnoredPathSegments.map(item =>
          String(item || '').trim()
        )
      : [],
    permissionUsageScanExtensions: Array.isArray(
      sourceConfig.permissionUsageScanExtensions
    )
      ? sourceConfig.permissionUsageScanExtensions.map(item =>
          String(item || '').trim().toLowerCase()
        )
      : [],
    permissionUsageAllowedFiles: Array.isArray(
      sourceConfig.permissionUsageAllowedFiles
    )
      ? sourceConfig.permissionUsageAllowedFiles.map(item =>
          String(item || '').trim()
        )
      : [],
    writeActions: Array.isArray(sourceConfig.writeActions)
      ? sourceConfig.writeActions.map(item => String(item || '').trim())
      : [],
    routePermissionPriority:
      sourceConfig.routePermissionPriority &&
      typeof sourceConfig.routePermissionPriority === 'object'
        ? Object.fromEntries(
            Object.entries(sourceConfig.routePermissionPriority).map(
              ([key, value]) => [String(key || '').trim(), Number(value)]
            )
          )
        : {},
  };
}

export function resolveBasePermissionOwnedSourceFiles(repoRoot) {
  const sourceConfig = loadBasePermissionSourceConfig(repoRoot);
  return sourceConfig.ownedSourceFiles.length
    ? sourceConfig.ownedSourceFiles
    : [
        sourceConfig.menuSourcePath,
        BASE_PERMISSION_SOURCE_CONFIG_RELATIVE_PATH,
        'cool-admin-midway/src/modules/base/domain/permissions/source.mjs',
      ];
}

export function resolveBasePermissionUsageScanRoots(repoRoot) {
  const sourceConfig = loadBasePermissionSourceConfig(repoRoot);
  return sourceConfig.permissionUsageScanRoots.length
    ? sourceConfig.permissionUsageScanRoots
    : [
        'cool-admin-midway/src/modules/base',
        'cool-admin-midway/src/modules/performance',
        'cool-admin-vue/src/cool',
        'cool-admin-vue/src/modules/base',
        'cool-admin-vue/src/modules/performance',
        'cool-uni/cool',
        'cool-uni/pages',
        'cool-uni/service',
        'cool-uni/types',
      ];
}

export function resolveBasePermissionUsageIgnoredPathSegments(repoRoot) {
  const sourceConfig = loadBasePermissionSourceConfig(repoRoot);
  return sourceConfig.permissionUsageIgnoredPathSegments.length
    ? sourceConfig.permissionUsageIgnoredPathSegments
    : ['/generated/', '/test/', '/tests/'];
}

export function resolveBasePermissionUsageScanExtensions(repoRoot) {
  const sourceConfig = loadBasePermissionSourceConfig(repoRoot);
  return sourceConfig.permissionUsageScanExtensions.length
    ? sourceConfig.permissionUsageScanExtensions
    : ['.ts', '.tsx', '.js', '.mjs', '.vue', '.json'];
}

export function resolveBasePermissionUsageAllowedFiles(repoRoot) {
  const sourceConfig = loadBasePermissionSourceConfig(repoRoot);
  return sourceConfig.permissionUsageAllowedFiles.length
    ? sourceConfig.permissionUsageAllowedFiles
    : [
        ...resolveBasePermissionOwnedSourceFiles(repoRoot),
        'scripts/generate-permissions.mjs',
        'scripts/check-permissions.mjs',
      ];
}

export function isAdminPermissionKey(value) {
  return (
    typeof value === 'string' && value.split(':').filter(Boolean).length >= 3
  );
}

export function splitPermissionKeys(perms) {
  if (typeof perms !== 'string' || !perms.trim()) {
    return [];
  }

  return perms
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

export function splitPermissionKey(permissionKey) {
  return String(permissionKey || '')
    .split(':')
    .map(item => item.trim())
    .filter(Boolean);
}

export function buildTreeFromPermissionKeys(permissionKeys) {
  const tree = {};

  for (const permissionKey of permissionKeys) {
    const segments = splitPermissionKey(permissionKey);
    let cursor = tree;

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      if (!cursor[segment]) {
        cursor[segment] = {};
      }
      cursor = cursor[segment];
    }

    cursor[segments[segments.length - 1]] = permissionKey;
  }

  return tree;
}

export function sortRoutePermissions(
  permissionKeys,
  routePermissionPriority = {}
) {
  return [...permissionKeys].sort((left, right) => {
    const leftAction = splitPermissionKey(left).at(-1) || '';
    const rightAction = splitPermissionKey(right).at(-1) || '';
    const leftPriority =
      routePermissionPriority[leftAction] ?? Number.MAX_SAFE_INTEGER;
    const rightPriority =
      routePermissionPriority[rightAction] ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.localeCompare(right);
  });
}

export function selectPrimaryRoutePermission(
  permissionKeys,
  routePermissionPriority = {}
) {
  return (
    sortRoutePermissions(permissionKeys, routePermissionPriority)[0] || null
  );
}

export function buildRoutePermissionRequirement(
  permissionKeys,
  routePermissionPriority = {}
) {
  const groupedPermissionKeys = new Map();

  for (const permissionKey of permissionKeys) {
    const resourceKey = splitPermissionKey(permissionKey).slice(0, -1).join(':');
    if (!groupedPermissionKeys.has(resourceKey)) {
      groupedPermissionKeys.set(resourceKey, []);
    }
    groupedPermissionKeys.get(resourceKey).push(permissionKey);
  }

  const primaryPermissionKeys = [...groupedPermissionKeys.values()]
    .map(group =>
      selectPrimaryRoutePermission(group, routePermissionPriority)
    )
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  if (!primaryPermissionKeys.length) {
    return null;
  }

  if (primaryPermissionKeys.length === 1) {
    return primaryPermissionKeys[0];
  }

  return {
    or: primaryPermissionKeys,
  };
}

export function collectPermissionModel(menuTree, options = {}) {
  const writeActions = new Set(options.writeActions || []);
  const routePermissionPriority = options.routePermissionPriority || {};
  const permissionKeys = new Set();
  const routeEntries = [];

  function walk(nodes) {
    for (const node of nodes || []) {
      const childMenus = Array.isArray(node?.childMenus) ? node.childMenus : [];
      const nodePermissionKeys = splitPermissionKeys(node?.perms).filter(
        isAdminPermissionKey
      );

      for (const permissionKey of nodePermissionKeys) {
        permissionKeys.add(permissionKey);
      }

      if (
        node?.type === 1 &&
        typeof node?.router === 'string' &&
        node.router.startsWith('/')
      ) {
        const childPermissionKeys = childMenus
          .flatMap(child => splitPermissionKeys(child?.perms))
          .filter(isAdminPermissionKey);
        const routePermission = buildRoutePermissionRequirement(
          childPermissionKeys,
          routePermissionPriority
        );

        if (routePermission) {
          routeEntries.push({
            path: node.router,
            permission: routePermission,
          });
        }
      }

      walk(childMenus);
    }
  }

  walk(menuTree);

  const sortedPermissionKeys = [...permissionKeys].sort((left, right) =>
    left.localeCompare(right)
  );
  const uniqueRouteEntries = [
    ...new Map(routeEntries.map(item => [item.path, item])).values(),
  ].sort((left, right) => left.path.localeCompare(right.path));

  return {
    permissionKeys: sortedPermissionKeys,
    permissionTree: buildTreeFromPermissionKeys(sortedPermissionKeys),
    writePermissionKeys: sortedPermissionKeys.filter(permissionKey =>
      writeActions.has(splitPermissionKey(permissionKey).at(-1) || '')
    ),
    routeEntries: uniqueRouteEntries,
  };
}
