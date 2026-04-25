/**
 * Base 模块领域模型注册中心入口。
 * 这里只负责聚合当前已收口的菜单与权限事实源，不负责运行时权限判断、角色分配或菜单导入。
 * 关键依赖是 base/domain/permissions 与后续全域 registry、守卫脚本、测试都会从这里读取统一入口。
 * 维护重点是 additive-first，后续新增 roles/errors/auth 子目录时不能破坏现有 generated 链的兼容性。
 */

import {
  BASE_ADMIN_PERMISSION_KEYS,
  BASE_MENU_PERMISSION_KEYS,
  BASE_MENU_ROUTE_ENTRIES,
  BASE_PERMISSION_CATALOG,
  BASE_ROUTE_PERMISSION_BY_PATH,
  BASE_ROUTE_PERMISSION_KEYS,
  type BasePermissionCatalog,
} from '../permissions/catalog';

export const BASE_DOMAIN_REGISTRY_VERSION = 'phase1-v1';

export interface BaseDomainRegistry {
  version: string;
  permissions: BasePermissionCatalog;
  menuPermissionKeys: readonly string[];
  permissionKeys: readonly string[];
  routePermissionByPath: Readonly<Record<string, unknown>>;
  routePermissionKeys: readonly string[];
  menuRouteEntries: readonly {
    path: string;
    permissionKeys: readonly string[];
  }[];
}

export const BASE_DOMAIN_REGISTRY: BaseDomainRegistry = Object.freeze({
  version: BASE_DOMAIN_REGISTRY_VERSION,
  permissions: BASE_PERMISSION_CATALOG,
  menuPermissionKeys: BASE_MENU_PERMISSION_KEYS,
  permissionKeys: BASE_ADMIN_PERMISSION_KEYS,
  routePermissionByPath: BASE_ROUTE_PERMISSION_BY_PATH,
  routePermissionKeys: BASE_ROUTE_PERMISSION_KEYS,
  menuRouteEntries: BASE_MENU_ROUTE_ENTRIES,
});
