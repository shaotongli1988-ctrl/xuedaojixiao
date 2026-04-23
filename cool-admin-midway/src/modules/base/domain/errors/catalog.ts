/**
 * Base 模块错误语义目录。
 * 这里只负责登记当前稳定错误码、默认文案与运行时来源，不负责直接抛异常或决定 HTTP 状态码。
 * 关键依赖是 base 登录、鉴权、中后台用户管理等共享链路会复用这些错误语义。
 * 维护重点是兼容现有文案契约，避免字符串继续散落在 service / middleware 中失控漂移。
 */

export type BaseDomainErrorCategory =
  | 'auth'
  | 'permission'
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'config'
  | 'internal';

export interface BaseDomainErrorDefinition {
  code: string;
  category: BaseDomainErrorCategory;
  defaultMessage: string;
}

export const BASE_DOMAIN_ERROR_CODES = Object.freeze({
  systemLoginConfigMissing: 'BASE_SYSTEM_LOGIN_CONFIG_MISSING',
  loginCredentialInvalid: 'BASE_LOGIN_CREDENTIAL_INVALID',
  loginRoleMissing: 'BASE_LOGIN_ROLE_MISSING',
  captchaInvalid: 'BASE_CAPTCHA_INVALID',
  authExpired: 'BASE_AUTH_EXPIRED',
  authPermissionDenied: 'BASE_AUTH_PERMISSION_DENIED',
  sessionExpiredRelogin: 'BASE_SESSION_EXPIRED_RELOGIN',
  illegalOperation: 'BASE_ILLEGAL_OPERATION',
  usernameDuplicate: 'BASE_USERNAME_DUPLICATE',
  userNotFound: 'BASE_USER_NOT_FOUND',
  originalPasswordInvalid: 'BASE_ORIGINAL_PASSWORD_INVALID',
  superAdminRoleProtected: 'BASE_SUPER_ADMIN_ROLE_PROTECTED',
  menuCodeStructureInvalid: 'BASE_MENU_CODE_STRUCTURE_INVALID',
  paramKeyDuplicate: 'BASE_PARAM_KEY_DUPLICATE',
  devEnvironmentOnly: 'BASE_DEV_ENVIRONMENT_ONLY',
});

export const BASE_DOMAIN_ERRORS = Object.freeze([
  {
    code: BASE_DOMAIN_ERROR_CODES.systemLoginConfigMissing,
    category: 'config',
    defaultMessage: '系统登录配置缺失',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.loginCredentialInvalid,
    category: 'auth',
    defaultMessage: '账户或密码不正确~',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.loginRoleMissing,
    category: 'permission',
    defaultMessage: '该用户未设置任何角色，无法登录~',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.captchaInvalid,
    category: 'validation',
    defaultMessage: '验证码不正确',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.authExpired,
    category: 'auth',
    defaultMessage: '登录失效~',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.authPermissionDenied,
    category: 'permission',
    defaultMessage: '登录失效或无权限访问~',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.sessionExpiredRelogin,
    category: 'auth',
    defaultMessage: '登录状态已失效，请重新登录',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.illegalOperation,
    category: 'permission',
    defaultMessage: '非法操作~',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.usernameDuplicate,
    category: 'conflict',
    defaultMessage: '用户名已经存在~',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.userNotFound,
    category: 'not_found',
    defaultMessage: '用户不存在',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.originalPasswordInvalid,
    category: 'validation',
    defaultMessage: '原密码错误',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.superAdminRoleProtected,
    category: 'permission',
    defaultMessage: '系统超管角色仅允许通过系统基座维护',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.menuCodeStructureInvalid,
    category: 'validation',
    defaultMessage: '代码结构不正确，请检查',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.paramKeyDuplicate,
    category: 'conflict',
    defaultMessage: '存在相同的keyName',
  },
  {
    code: BASE_DOMAIN_ERROR_CODES.devEnvironmentOnly,
    category: 'config',
    defaultMessage: '只能在开发环境下创建代码',
  },
] as const satisfies readonly BaseDomainErrorDefinition[]);

export const BASE_DOMAIN_ERROR_BY_CODE = Object.freeze(
  BASE_DOMAIN_ERRORS.reduce<Record<string, BaseDomainErrorDefinition>>(
    (result, item) => {
      result[item.code] = item;
      return result;
    },
    {}
  )
);

export const BASE_DOMAIN_ERROR_RUNTIME_SOURCES = [
  'src/modules/base/middleware/authority.ts',
  'src/modules/base/service/coding.ts',
  'src/modules/base/service/sys/login.ts',
  'src/modules/base/service/sys/menu.ts',
  'src/modules/base/service/sys/param.ts',
  'src/modules/base/service/sys/role.ts',
  'src/modules/base/service/sys/user.ts',
] as const;
