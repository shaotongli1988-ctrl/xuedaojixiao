/**
 * User 模块领域模型注册中心入口。
 * 这里只负责聚合当前已收口的身份语义目录，不负责替代 app 用户登录或 base admin 运行时实现。
 * 关键依赖是 user/domain/auth 和仓库级全域 registry 都会从这里读取统一入口。
 * 维护重点是先固定身份语义边界，后续再逐步接线到具体 runtime consumer。
 */

import {
  USER_AUTH_CATALOG,
  USER_AUTH_CACHE_KEY_TEMPLATES,
  USER_ADMIN_TOKEN_CLAIMS,
  USER_APP_TOKEN_CLAIMS,
  type UserAuthCatalog,
} from '../auth/catalog';

export const USER_DOMAIN_REGISTRY_VERSION = 'phase1-v1';

export interface UserDomainRegistry {
  version: string;
  auth: UserAuthCatalog;
  adminTokenClaimKeys: readonly string[];
  appTokenClaimKeys: readonly string[];
  authCacheKeyTemplates: Readonly<Record<string, string>>;
}

export const USER_DOMAIN_REGISTRY: UserDomainRegistry = Object.freeze({
  version: USER_DOMAIN_REGISTRY_VERSION,
  auth: USER_AUTH_CATALOG,
  adminTokenClaimKeys: USER_ADMIN_TOKEN_CLAIMS.map(item => item.key),
  appTokenClaimKeys: USER_APP_TOKEN_CLAIMS.map(item => item.key),
  authCacheKeyTemplates: USER_AUTH_CACHE_KEY_TEMPLATES,
});
