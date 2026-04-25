/**
 * 统一封装后台运行时权限上下文的 SSOT 读取。
 * 这里只负责把 token 中的 permissionMask、isAdmin 与 perms 列表收敛成同一套权限位判断；
 * 不负责角色标签推断、菜单生成或任何业务域的数据范围规则。
 * 维护重点是所有业务鉴权都必须优先走 permissionMask，避免字符串权限或用户名判断继续扩散。
 */
import {
  BASE_PERMISSION_BIT_BY_KEY,
  BASE_SUPER_ADMIN_PERMISSION_BIT,
  baseHasAnyPermissionBit,
  baseHasPermissionBit,
  baseResolvePermissionMask,
  type AdminPermissionKey,
} from '../../domain';

export interface PermissionRuntimeContext {
  perms?: readonly string[];
  permissionMask?: string | null;
  isAdmin?: boolean | null;
}

function normalizePermissionKey(permissionKey: string) {
  return String(permissionKey || '').trim() as AdminPermissionKey;
}

export function resolveRuntimePermissionMask(
  context: PermissionRuntimeContext
) {
  const tokenPermissionMask = String(context.permissionMask || '').trim();
  if (tokenPermissionMask) {
    return tokenPermissionMask;
  }
  return baseResolvePermissionMask(context.perms || [], {
    isAdmin: context.isAdmin === true,
  });
}

export function hasPermissionKey(
  context: PermissionRuntimeContext,
  permissionKey: string
) {
  const normalizedPermissionKey = normalizePermissionKey(permissionKey);
  const bit = BASE_PERMISSION_BIT_BY_KEY[normalizedPermissionKey];
  if (bit === undefined) {
    return false;
  }
  return baseHasPermissionBit(resolveRuntimePermissionMask(context), bit);
}

export function hasAnyPermissionKeys(
  context: PermissionRuntimeContext,
  permissionKeys: readonly string[]
) {
  const bits = permissionKeys
    .map(item => BASE_PERMISSION_BIT_BY_KEY[normalizePermissionKey(item)])
    .filter(bit => bit !== undefined);

  if (!bits.length) {
    return false;
  }

  return baseHasAnyPermissionBit(resolveRuntimePermissionMask(context), bits);
}

export function isSuperAdminPermission(context: PermissionRuntimeContext) {
  return baseHasPermissionBit(
    resolveRuntimePermissionMask(context),
    BASE_SUPER_ADMIN_PERMISSION_BIT
  );
}
