/**
 * User 模块身份语义目录。
 * 这里只负责集中 admin token claims、super-admin 判定语义、缓存键模板和关键运行时入口，不负责改写 base 模块中的实际登录与鉴权实现。
 * 关键依赖是 base 登录、权限、中间件和用户保护逻辑当前都实现这些语义。
 * 维护重点是这里描述的是“当前唯一语义入口”，后续运行时代码必须向这里收敛，而不是继续新增平级约定。
 */

import * as jwt from 'jsonwebtoken';

export type UserAdminTokenClaimKey =
  | 'isRefresh'
  | 'roleIds'
  | 'isAdmin'
  | 'username'
  | 'userId'
  | 'passwordVersion'
  | 'permissionMask'
  | 'tenantId';

export type UserAppTokenClaimKey = 'id' | 'isRefresh' | 'tenantId';

export interface UserAuthClaimDefinition {
  key: string;
  description: string;
}

export interface UserAuthSourceDescriptor {
  key: string;
  sourcePaths: readonly string[];
  description: string;
}

export interface UserAuthCatalog {
  adminTokenClaims: readonly UserAuthClaimDefinition[];
  appTokenClaims: readonly UserAuthClaimDefinition[];
  superAdminRoleField: {
    entity: string;
    field: string;
    sourcePath: string;
  };
  cacheKeyTemplates: Readonly<Record<string, string>>;
  runtimeSources: readonly UserAuthSourceDescriptor[];
  buildCacheKey: (
    templateKey: keyof typeof USER_AUTH_CACHE_KEY_TEMPLATES,
    userId: number | string
  ) => string;
  buildAdminTokenPayload: (
    input: UserAdminTokenPayloadInput
  ) => UserAdminTokenPayload;
  readAdminTokenClaim: <TClaimKey extends UserAdminTokenClaimKey>(
    payload: unknown,
    claimKey: TClaimKey
  ) => UserAdminTokenPayload[TClaimKey] | null;
  resolveAdminRoleIds: (payload: unknown) => number[];
  resolveAdminUserId: (payload: unknown) => number | null;
  resolveAdminIsAdmin: (payload: unknown) => boolean | null;
  resolveAdminPasswordVersion: (payload: unknown) => number | null;
  resolveAdminPermissionMask: (payload: unknown) => string | null;
  isAdminRefreshToken: (payload: unknown) => boolean;
  verifyAdminToken: (token: string, secret: string) => Record<string, unknown> | null;
  resolveAdminRuntimeContext: (payload: unknown) => UserAdminRuntimeContext;
  buildAppTokenPayload: (input: UserAppTokenPayloadInput) => UserAppTokenPayload;
  readAppTokenClaim: <TClaimKey extends UserAppTokenClaimKey>(
    payload: unknown,
    claimKey: TClaimKey
  ) => UserAppTokenPayload[TClaimKey] | null;
  resolveAppUserId: (payload: unknown) => number | null;
  resolveAppTenantId: (payload: unknown) => number | string | null;
  isAppRefreshToken: (payload: unknown) => boolean;
  verifyAppToken: (token: string, secret: string) => Record<string, unknown> | null;
  resolveAppRuntimeContext: (payload: unknown) => UserAppRuntimeContext;
}

export interface UserAdminTokenPayload {
  isRefresh: boolean;
  roleIds: number[];
  isAdmin: boolean;
  username: string;
  userId: number;
  passwordVersion: number;
  permissionMask: string;
  tenantId: number | string | null;
}

export interface UserAdminTokenPayloadInput {
  isRefresh?: boolean;
  roleIds?: readonly number[];
  isAdmin?: boolean;
  username?: string;
  userId?: number;
  passwordVersion?: number;
  permissionMask?: string;
  tenantId?: number | string | null;
}

export interface UserAdminRuntimeContext {
  userId: number | null;
  roleIds: number[];
  isAdmin: boolean | null;
  passwordVersion: number | null;
  permissionMask: string | null;
  isRefresh: boolean;
  username: string | null;
  tenantId: number | string | null;
}

export interface UserAppTokenPayload {
  id: number;
  isRefresh: boolean;
  tenantId: number | string | null;
}

export interface UserAppTokenPayloadInput {
  id?: number;
  isRefresh?: boolean;
  tenantId?: number | string | null;
}

export interface UserAppRuntimeContext {
  userId: number | null;
  isRefresh: boolean;
  tenantId: number | string | null;
}

export const USER_ADMIN_TOKEN_CLAIMS = [
  { key: 'isRefresh', description: '标记当前 token 是否为 refresh token。' },
  { key: 'roleIds', description: '当前 admin 用户绑定的角色 ID 列表。' },
  { key: 'isAdmin', description: '当前 admin 是否拥有系统超管权限。' },
  { key: 'username', description: '当前 admin 登录用户名。' },
  { key: 'userId', description: '当前 admin 用户 ID。' },
  {
    key: 'passwordVersion',
    description: '当前 admin 密码版本，用于 token 失效校验。',
  },
  {
    key: 'permissionMask',
    description: '当前 admin 的权限位图字符串。',
  },
  { key: 'tenantId', description: '当前 admin 的租户标识。' },
] as const satisfies readonly UserAuthClaimDefinition[];

export const USER_APP_TOKEN_CLAIMS = [
  { key: 'id', description: '当前 app 用户 ID。' },
  { key: 'isRefresh', description: '标记当前 token 是否为 refresh token。' },
  { key: 'tenantId', description: '当前 app 用户所属租户标识。' },
] as const satisfies readonly UserAuthClaimDefinition[];

export const USER_SUPER_ADMIN_ROLE_FIELD = Object.freeze({
  entity: 'base_sys_role',
  field: 'isSuperAdmin',
  sourcePath: 'src/modules/base/entity/sys/role.ts',
});

export const USER_AUTH_CACHE_KEY_TEMPLATES = Object.freeze({
  departmentIds: 'admin:department:{userId}',
  perms: 'admin:perms:{userId}',
  accessToken: 'admin:token:{userId}',
  refreshToken: 'admin:token:refresh:{userId}',
  passwordVersion: 'admin:passwordVersion:{userId}',
});

export const USER_AUTH_RUNTIME_SOURCES = [
  {
    key: 'admin_token_issue',
    sourcePaths: ['src/modules/base/service/sys/login.ts'],
    description: '负责签发 admin token，并写入 passwordVersion/token 缓存。',
  },
  {
    key: 'super_admin_resolution',
    sourcePaths: [
      'src/modules/base/service/sys/login.ts',
      'src/modules/base/service/sys/perms.ts',
    ],
    description: '负责根据 role.isSuperAdmin 判定当前 admin 是否为系统超管。',
  },
  {
    key: 'super_admin_role_protection',
    sourcePaths: ['src/modules/base/service/sys/role.ts'],
    description: '负责阻止系统超管角色被普通 CRUD 直接修改。',
  },
  {
    key: 'super_admin_user_protection',
    sourcePaths: ['src/modules/base/service/sys/user.ts'],
    description: '负责阻止绑定系统超管角色的用户被普通用户管理入口操作。',
  },
  {
    key: 'authority_verification',
    sourcePaths: ['src/modules/base/middleware/authority.ts'],
    description: '负责在中间件中校验 token、passwordVersion 与 permissionMask。',
  },
  {
    key: 'admin_runtime_context_fallback',
    sourcePaths: [
      'src/modules/base/service/sys/perms.ts',
      'src/modules/base/service/sys/user.ts',
      'src/modules/base/service/sys/department.ts',
      'src/modules/base/controller/admin/comm.ts',
    ],
    description: '负责在 ctx.admin 缺失时统一回退读取 admin token，并归一化运行时 claim 上下文。',
  },
  {
    key: 'admin_runtime_context_consumers',
    sourcePaths: [
      'src/modules/base/controller/admin/sys/user.ts',
      'src/modules/base/controller/admin/sys/department.ts',
      'src/modules/base/controller/admin/sys/role.ts',
      'src/modules/base/db/tenant.ts',
      'src/modules/base/middleware/log.ts',
      'src/modules/base/service/sys/menu.ts',
      'src/modules/base/service/sys/role.ts',
    ],
    description: '负责在已注入 ctx.admin 的常规管理入口中，通过统一运行时上下文读取 userId、roleIds 和 isAdmin。',
  },
  {
    key: 'app_token_issue',
    sourcePaths: ['src/modules/user/service/login.ts'],
    description: '负责签发 app 用户 token，并写入当前 app claim 结构。',
  },
  {
    key: 'app_token_refresh_and_verification',
    sourcePaths: [
      'src/modules/user/service/login.ts',
      'src/modules/user/middleware/app.ts',
    ],
    description: '负责校验 app refresh/access token，并统一读取 app 用户运行时上下文。',
  },
  {
    key: 'app_runtime_context_consumers',
    sourcePaths: [
      'src/modules/user/controller/app/address.ts',
      'src/modules/user/controller/app/info.ts',
      'src/modules/user/service/address.ts',
    ],
    description: '负责在 app 侧 controller/service 中，通过统一运行时上下文读取当前用户 ID。',
  },
] as const satisfies readonly UserAuthSourceDescriptor[];

function buildAuthCacheKey(
  templateKey: keyof typeof USER_AUTH_CACHE_KEY_TEMPLATES,
  userId: number | string
) {
  return USER_AUTH_CACHE_KEY_TEMPLATES[templateKey].replace(
    '{userId}',
    String(userId)
  );
}

function buildAdminTokenPayload(
  input: UserAdminTokenPayloadInput
): UserAdminTokenPayload {
  return {
    isRefresh: input.isRefresh === true,
    roleIds: Array.isArray(input.roleIds)
      ? input.roleIds
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      : [],
    isAdmin: input.isAdmin === true,
    username: String(input.username || ''),
    userId: Number(input.userId) || 0,
    passwordVersion: Number(input.passwordVersion) || 0,
    permissionMask: String(input.permissionMask || '0'),
    tenantId:
      input.tenantId == null || input.tenantId === ''
        ? null
        : (input.tenantId as number | string),
  };
}

function readAdminTokenClaim<TClaimKey extends UserAdminTokenClaimKey>(
  payload: unknown,
  claimKey: TClaimKey
): UserAdminTokenPayload[TClaimKey] | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const value = (payload as Record<string, unknown>)[claimKey];
  return value == null ? null : (value as UserAdminTokenPayload[TClaimKey]);
}

function buildAppTokenPayload(
  input: UserAppTokenPayloadInput
): UserAppTokenPayload {
  return {
    id: Number(input.id) || 0,
    isRefresh: input.isRefresh === true,
    tenantId:
      input.tenantId == null || input.tenantId === ''
        ? null
        : (input.tenantId as number | string),
  };
}

function readAppTokenClaim<TClaimKey extends UserAppTokenClaimKey>(
  payload: unknown,
  claimKey: TClaimKey
): UserAppTokenPayload[TClaimKey] | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const value = (payload as Record<string, unknown>)[claimKey];
  return value == null ? null : (value as UserAppTokenPayload[TClaimKey]);
}

function resolveAdminRoleIds(payload: unknown) {
  const roleIds = readAdminTokenClaim(payload, 'roleIds');
  if (!Array.isArray(roleIds)) {
    return [];
  }
  return roleIds
    .map(item => Number(item))
    .filter(item => Number.isInteger(item) && item > 0);
}

function resolveAdminUserId(payload: unknown) {
  const userId = readAdminTokenClaim(payload, 'userId');
  const normalizedUserId = Number(userId);
  return Number.isInteger(normalizedUserId) && normalizedUserId > 0
    ? normalizedUserId
    : null;
}

function resolveAdminIsAdmin(payload: unknown) {
  const isAdmin = readAdminTokenClaim(payload, 'isAdmin');
  return typeof isAdmin === 'boolean' ? isAdmin : null;
}

function resolveAdminPasswordVersion(payload: unknown) {
  const passwordVersion = readAdminTokenClaim(payload, 'passwordVersion');
  const normalizedPasswordVersion = Number(passwordVersion);
  return Number.isFinite(normalizedPasswordVersion)
    ? normalizedPasswordVersion
    : null;
}

function resolveAdminPermissionMask(payload: unknown) {
  const permissionMask = readAdminTokenClaim(payload, 'permissionMask');
  if (permissionMask == null) {
    return null;
  }
  return String(permissionMask).trim() || null;
}

function isAdminRefreshToken(payload: unknown) {
  return readAdminTokenClaim(payload, 'isRefresh') === true;
}

function verifyAdminToken(token: string, secret: string) {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded && typeof decoded === 'object'
      ? (decoded as Record<string, unknown>)
      : null;
  } catch (error) {
    return null;
  }
}

function verifyAppToken(token: string, secret: string) {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded && typeof decoded === 'object'
      ? (decoded as Record<string, unknown>)
      : null;
  } catch (error) {
    return null;
  }
}

function resolveAdminRuntimeContext(payload: unknown): UserAdminRuntimeContext {
  const username = readAdminTokenClaim(payload, 'username');
  const tenantId = readAdminTokenClaim(payload, 'tenantId');

  return Object.freeze({
    userId: resolveAdminUserId(payload),
    roleIds: resolveAdminRoleIds(payload),
    isAdmin: resolveAdminIsAdmin(payload),
    passwordVersion: resolveAdminPasswordVersion(payload),
    permissionMask: resolveAdminPermissionMask(payload),
    isRefresh: isAdminRefreshToken(payload),
    username: username == null ? null : String(username),
    tenantId:
      tenantId == null || tenantId === '' ? null : (tenantId as number | string),
  });
}

function resolveAppUserId(payload: unknown) {
  const userId = readAppTokenClaim(payload, 'id');
  const normalizedUserId = Number(userId);
  return Number.isInteger(normalizedUserId) && normalizedUserId > 0
    ? normalizedUserId
    : null;
}

function resolveAppTenantId(payload: unknown) {
  const tenantId = readAppTokenClaim(payload, 'tenantId');
  return tenantId == null || tenantId === ''
    ? null
    : (tenantId as number | string);
}

function isAppRefreshToken(payload: unknown) {
  return readAppTokenClaim(payload, 'isRefresh') === true;
}

function resolveAppRuntimeContext(payload: unknown): UserAppRuntimeContext {
  return Object.freeze({
    userId: resolveAppUserId(payload),
    isRefresh: isAppRefreshToken(payload),
    tenantId: resolveAppTenantId(payload),
  });
}

export const USER_AUTH_CATALOG: UserAuthCatalog = Object.freeze({
  adminTokenClaims: USER_ADMIN_TOKEN_CLAIMS,
  appTokenClaims: USER_APP_TOKEN_CLAIMS,
  superAdminRoleField: USER_SUPER_ADMIN_ROLE_FIELD,
  cacheKeyTemplates: USER_AUTH_CACHE_KEY_TEMPLATES,
  runtimeSources: USER_AUTH_RUNTIME_SOURCES,
  buildCacheKey: buildAuthCacheKey,
  buildAdminTokenPayload,
  readAdminTokenClaim,
  resolveAdminRoleIds,
  resolveAdminUserId,
  resolveAdminIsAdmin,
  resolveAdminPasswordVersion,
  resolveAdminPermissionMask,
  isAdminRefreshToken,
  verifyAdminToken,
  resolveAdminRuntimeContext,
  buildAppTokenPayload,
  readAppTokenClaim,
  resolveAppUserId,
  resolveAppTenantId,
  isAppRefreshToken,
  verifyAppToken,
  resolveAppRuntimeContext,
});

export const buildUserAuthCacheKey = USER_AUTH_CATALOG.buildCacheKey;
export const buildUserAdminTokenPayload =
  USER_AUTH_CATALOG.buildAdminTokenPayload;
export const readUserAdminTokenClaim = USER_AUTH_CATALOG.readAdminTokenClaim;
export const resolveUserAdminRoleIds = USER_AUTH_CATALOG.resolveAdminRoleIds;
export const resolveUserAdminUserId = USER_AUTH_CATALOG.resolveAdminUserId;
export const resolveUserAdminIsAdmin = USER_AUTH_CATALOG.resolveAdminIsAdmin;
export const resolveUserAdminPasswordVersion =
  USER_AUTH_CATALOG.resolveAdminPasswordVersion;
export const resolveUserAdminPermissionMask =
  USER_AUTH_CATALOG.resolveAdminPermissionMask;
export const isUserAdminRefreshToken = USER_AUTH_CATALOG.isAdminRefreshToken;
export const verifyUserAdminToken = USER_AUTH_CATALOG.verifyAdminToken;
export const resolveUserAdminRuntimeContext =
  USER_AUTH_CATALOG.resolveAdminRuntimeContext;
export const buildUserAppTokenPayload = USER_AUTH_CATALOG.buildAppTokenPayload;
export const readUserAppTokenClaim = USER_AUTH_CATALOG.readAppTokenClaim;
export const resolveUserAppUserId = USER_AUTH_CATALOG.resolveAppUserId;
export const resolveUserAppTenantId = USER_AUTH_CATALOG.resolveAppTenantId;
export const isUserAppRefreshToken = USER_AUTH_CATALOG.isAppRefreshToken;
export const verifyUserAppToken = USER_AUTH_CATALOG.verifyAppToken;
export const resolveUserAppRuntimeContext =
  USER_AUTH_CATALOG.resolveAppRuntimeContext;
