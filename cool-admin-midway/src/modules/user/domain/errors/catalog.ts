/**
 * User 模块错误语义目录。
 * 这里只负责登记 app 登录、短信、微信登录链路的稳定错误语义，不负责替代具体登录实现。
 * 关键依赖是 user/service、middleware 以及移动端登录体验需要从同一目录读取默认文案。
 * 维护重点是保留现有用户可见文案，避免不同登录入口继续发散出新的近义错误提示。
 */

export type UserDomainErrorCategory =
  | 'auth'
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'config'
  | 'integration'
  | 'rate_limit';

export interface UserDomainErrorDefinition {
  code: string;
  category: UserDomainErrorCategory;
  defaultMessage: string;
}

export const USER_DOMAIN_ERROR_CODES = Object.freeze({
  imageCaptchaInvalid: 'USER_IMAGE_CAPTCHA_INVALID',
  smsCodeInvalid: 'USER_SMS_CODE_INVALID',
  phoneResolveConfigMissing: 'USER_PHONE_RESOLVE_CONFIG_MISSING',
  wechatLoginFailed: 'USER_WECHAT_LOGIN_FAILED',
  refreshTokenTypeInvalid: 'USER_REFRESH_TOKEN_TYPE_INVALID',
  refreshTokenFailed: 'USER_REFRESH_TOKEN_FAILED',
  userNotFound: 'USER_NOT_FOUND',
  accountOrPasswordInvalid: 'USER_ACCOUNT_OR_PASSWORD_INVALID',
  updateFailedOrPhoneDuplicate: 'USER_UPDATE_FAILED_OR_PHONE_DUPLICATE',
  smsPluginMissing: 'USER_SMS_PLUGIN_MISSING',
  smsRateLimited: 'USER_SMS_RATE_LIMITED',
  wechatPluginMissing: 'USER_WECHAT_PLUGIN_MISSING',
  userDisabledOrMissing: 'USER_DISABLED_OR_MISSING',
  loginRetry: 'USER_LOGIN_RETRY',
  phoneResolveRefreshFailed: 'USER_PHONE_RESOLVE_REFRESH_FAILED',
  authExpired: 'USER_AUTH_EXPIRED',
});

export const USER_DOMAIN_ERRORS = Object.freeze([
  {
    code: USER_DOMAIN_ERROR_CODES.imageCaptchaInvalid,
    category: 'validation',
    defaultMessage: '图片验证码错误',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.smsCodeInvalid,
    category: 'validation',
    defaultMessage: '验证码错误',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.phoneResolveConfigMissing,
    category: 'config',
    defaultMessage: '获得手机号失败，请检查配置',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.wechatLoginFailed,
    category: 'integration',
    defaultMessage: '微信登录失败',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.refreshTokenTypeInvalid,
    category: 'auth',
    defaultMessage: 'token类型非refreshToken',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.refreshTokenFailed,
    category: 'auth',
    defaultMessage: '刷新token失败，请检查refreshToken是否正确或过期',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.userNotFound,
    category: 'not_found',
    defaultMessage: '用户不存在',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.accountOrPasswordInvalid,
    category: 'auth',
    defaultMessage: '账号或密码错误',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.updateFailedOrPhoneDuplicate,
    category: 'conflict',
    defaultMessage: '更新失败，参数错误或者手机号已存在',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.smsPluginMissing,
    category: 'config',
    defaultMessage:
      '未配置短信插件，请到插件市场下载安装配置：https://cool-js.com/plugin?keyWord=短信',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.smsRateLimited,
    category: 'rate_limit',
    defaultMessage: '发送过于频繁，请稍后再试',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.wechatPluginMissing,
    category: 'config',
    defaultMessage: '未配置微信插件，请到插件市场下载安装配置：https://cool-js.com/plugin/70',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.userDisabledOrMissing,
    category: 'auth',
    defaultMessage: '用户不存在或已被禁用',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.loginRetry,
    category: 'integration',
    defaultMessage: '登录失败，请重试',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.phoneResolveRefreshFailed,
    category: 'integration',
    defaultMessage: '获取手机号失败，请刷新重试',
  },
  {
    code: USER_DOMAIN_ERROR_CODES.authExpired,
    category: 'auth',
    defaultMessage: '登录失效~',
  },
] as const satisfies readonly UserDomainErrorDefinition[]);

export const USER_DOMAIN_ERROR_BY_CODE = Object.freeze(
  USER_DOMAIN_ERRORS.reduce<Record<string, UserDomainErrorDefinition>>(
    (result, item) => {
      result[item.code] = item;
      return result;
    },
    {}
  )
);

export const USER_DOMAIN_ERROR_RUNTIME_SOURCES = [
  'src/modules/user/middleware/app.ts',
  'src/modules/user/service/info.ts',
  'src/modules/user/service/login.ts',
  'src/modules/user/service/sms.ts',
  'src/modules/user/service/wx.ts',
] as const;
