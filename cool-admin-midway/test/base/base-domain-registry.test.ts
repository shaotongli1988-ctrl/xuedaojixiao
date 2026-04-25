/// <reference types="jest" />
/**
 * Base 模块 domain registry 最小测试。
 * 这里只验证菜单、权限键、位图与路由权限映射的一致性，不覆盖运行时登录或角色分配逻辑。
 */

import {
  BASE_DOMAIN_REGISTRY,
  BASE_DOMAIN_REGISTRY_VERSION,
} from '../../src/modules/base/domain';
import {
  BASE_ADMIN_PERMISSION_KEYS,
  BASE_MENU_PERMISSION_KEYS,
  BASE_PERMISSION_GENERATED_TARGETS,
  BASE_PERMISSION_OWNED_SOURCE_FILES,
  BASE_PERMISSION_SOURCE_FILE,
  BASE_PERMISSION_USAGE_ALLOWED_FILES,
  BASE_PERMISSION_USAGE_IGNORED_PATH_SEGMENTS,
  BASE_PERMISSION_USAGE_SCAN_EXTENSIONS,
  BASE_PERMISSION_USAGE_SCAN_ROOTS,
  BASE_PERMISSION_WRITE_ACTIONS,
  BASE_LOGIN_ONLY_ROUTE_PREFIXES,
  BASE_RUNTIME_PERMISSION_ALIASES,
  BASE_ROUTE_PERMISSION_PRIORITY,
  BASE_ROUTE_PERMISSION_BY_PATH,
  BASE_ROUTE_PERMISSION_KEYS,
  baseIsLoginOnlyRoute,
  baseNormalizeAdminRouteUrl,
  baseResolveRuntimePermissionCandidates,
} from '../../src/modules/base/domain';
import { GLOBAL_DOMAIN_SSOT_REGISTRY } from '../../src/domain-registry';

describe('base domain registry', () => {
  test('should expose phase1 registry and permission catalog', () => {
    expect(BASE_DOMAIN_REGISTRY.version).toBe(BASE_DOMAIN_REGISTRY_VERSION);
    expect(BASE_DOMAIN_REGISTRY.permissionKeys.length).toBeGreaterThan(0);
    expect(BASE_DOMAIN_REGISTRY.menuRouteEntries.length).toBeGreaterThan(0);
    expect(
      Object.keys(BASE_DOMAIN_REGISTRY.routePermissionByPath).length
    ).toBeGreaterThan(0);
    expect(BASE_DOMAIN_REGISTRY.permissions.menuTree.length).toBeGreaterThan(0);
    expect(BASE_PERMISSION_SOURCE_FILE).toBe(
      'cool-admin-midway/src/modules/base/menu.json'
    );
    expect(BASE_DOMAIN_REGISTRY.permissions.generatedSourceFile).toBe(
      BASE_PERMISSION_SOURCE_FILE
    );
    expect(BASE_PERMISSION_GENERATED_TARGETS).toEqual([
      'cool-admin-midway/src/modules/base/generated',
      'cool-admin-vue/src/modules/base/generated',
      'cool-uni/generated',
    ]);
    expect(BASE_PERMISSION_OWNED_SOURCE_FILES).toEqual([
      'cool-admin-midway/src/modules/base/menu.json',
      'cool-admin-midway/src/modules/base/domain/permissions/source.json',
      'cool-admin-midway/src/modules/base/domain/permissions/source.mjs',
    ]);
    expect(BASE_PERMISSION_USAGE_SCAN_ROOTS).toEqual([
      'cool-admin-midway/src/modules/base',
      'cool-admin-midway/src/modules/performance',
      'cool-admin-vue/src/cool',
      'cool-admin-vue/src/modules/base',
      'cool-admin-vue/src/modules/performance',
      'cool-uni/cool',
      'cool-uni/pages',
      'cool-uni/service',
      'cool-uni/types',
    ]);
    expect(BASE_PERMISSION_USAGE_IGNORED_PATH_SEGMENTS).toEqual([
      '/generated/',
      '/test/',
      '/tests/',
    ]);
    expect(BASE_PERMISSION_USAGE_SCAN_EXTENSIONS).toEqual([
      '.ts',
      '.tsx',
      '.js',
      '.mjs',
      '.vue',
      '.json',
    ]);
    expect(BASE_PERMISSION_USAGE_ALLOWED_FILES).toEqual([
      'cool-admin-midway/src/modules/base/menu.json',
      'cool-admin-midway/src/modules/base/domain/permissions/source.json',
      'cool-admin-midway/src/modules/base/domain/permissions/source.mjs',
      'scripts/generate-permissions.mjs',
      'scripts/check-permissions.mjs',
    ]);
    expect(BASE_RUNTIME_PERMISSION_ALIASES).toEqual({
      'performance/assessment/page': [
        'performance/assessment/myPage',
        'performance/assessment/pendingPage',
      ],
    });
    expect(BASE_LOGIN_ONLY_ROUTE_PREFIXES).toEqual([
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
    expect(baseNormalizeAdminRouteUrl('/admin/performance/assessment/page?x=1')).toBe(
      'performance/assessment/page'
    );
    expect(
      baseResolveRuntimePermissionCandidates('/admin/performance/assessment/page')
    ).toEqual([
      'performance/assessment/page',
      'performance/assessment/myPage',
      'performance/assessment/pendingPage',
    ]);
    expect(
      baseResolveRuntimePermissionCandidates('/admin/performance/goal/page')
    ).toEqual(['performance/goal/page']);
    expect(baseIsLoginOnlyRoute('/admin/performance/teacherInfo/page')).toBe(
      true
    );
    expect(baseIsLoginOnlyRoute('/admin/performance/goal/page')).toBe(false);
    expect(BASE_PERMISSION_WRITE_ACTIONS).toEqual(
      expect.arrayContaining(['add', 'delete', 'update', 'submit'])
    );
    expect(BASE_ROUTE_PERMISSION_PRIORITY).toEqual({
      page: 0,
      list: 1,
      summary: 2,
      info: 3,
    });
  });

  test('should keep menu permission keys aligned with generated permission keys', () => {
    expect([...BASE_MENU_PERMISSION_KEYS].sort()).toEqual(
      [...BASE_ADMIN_PERMISSION_KEYS]
        .filter(item => BASE_MENU_PERMISSION_KEYS.includes(item))
        .sort()
    );
  });

  test('should keep route permission keys aligned with generated permission keys', () => {
    const generatedPermissionKeySet = new Set(BASE_ADMIN_PERMISSION_KEYS);
    expect(
      BASE_ROUTE_PERMISSION_KEYS.every(item => generatedPermissionKeySet.has(item))
    ).toBe(true);
    expect(BASE_ROUTE_PERMISSION_BY_PATH['/sys/menu']).toBe('base:sys:menu:page');
    expect(BASE_ROUTE_PERMISSION_BY_PATH['/sys/user']).toEqual(
      expect.objectContaining({
        or: expect.arrayContaining([
          'base:sys:department:list',
          'base:sys:user:page',
        ]),
      })
    );
  });

  test('should keep permission bit map aligned with generated permission keys', () => {
    expect(
      Object.keys(BASE_DOMAIN_REGISTRY.permissions.permissionBitByKey).sort()
    ).toEqual([...BASE_ADMIN_PERMISSION_KEYS].sort());
    expect(BASE_DOMAIN_REGISTRY.permissions.superAdminPermissionBit).toBe(BigInt(1));
  });

  test('should register base domain registry in global ssot map', () => {
    expect(GLOBAL_DOMAIN_SSOT_REGISTRY.modules.base.runtimeRegistry).toBe(
      BASE_DOMAIN_REGISTRY
    );
    expect(
      GLOBAL_DOMAIN_SSOT_REGISTRY.modules.base.surfaces.find(
        item => item.key === 'domain_registry'
      )
    ).toEqual(
      expect.objectContaining({
        status: 'implemented',
        targetSourcePath: 'src/modules/base/domain/registry/index.ts',
      })
    );
  });
});
