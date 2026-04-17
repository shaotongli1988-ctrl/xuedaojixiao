import { ALL, App, Config, Inject, Middleware } from '@midwayjs/core';
import * as _ from 'lodash';
import { CoolCommException, CoolUrlTagData, TagTypes } from '@cool-midway/core';
import * as jwt from 'jsonwebtoken';
import { NextFunction, Context } from '@midwayjs/koa';
import {
  IMiddleware,
  IMidwayApplication,
  Init,
  InjectClient,
  REQUEST_CTX_KEY,
} from '@midwayjs/core';
import { CachingFactory, MidwayCache } from '@midwayjs/cache-manager';
import { Utils } from '../../../comm/utils';

const resolveBaseModuleConfig = (app?: IMidwayApplication) => {
  return require('../config').default({
    app,
    env: app?.getEnv?.(),
  });
};

/**
 * 权限校验
 */
@Middleware()
export class BaseAuthorityMiddleware
  implements IMiddleware<Context, NextFunction>
{
  @Config('koa.globalPrefix')
  prefix;

  @Config(ALL)
  allConfig;

  @InjectClient(CachingFactory, 'default')
  midwayCache: MidwayCache;

  @Inject()
  coolUrlTagData: CoolUrlTagData;

  @App()
  app: IMidwayApplication;

  @Inject()
  utils: Utils;

  ignoreUrls: string[] = [];

  private get jwtConfig() {
    const moduleConfig =
      this.allConfig?.module?.base || resolveBaseModuleConfig(this.app);
    if (!moduleConfig?.jwt) {
      throw new CoolCommException('系统登录配置缺失', 500);
    }
    return moduleConfig.jwt;
  }

  @Init()
  async init() {
    this.ignoreUrls = this.coolUrlTagData.byKey(TagTypes.IGNORE_TOKEN, 'admin');
  }

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      let statusCode = 200;
      let { url } = ctx;
      url = url.replace(this.prefix, '').split('?')[0];
      const token = ctx.get('Authorization');
      const adminUrl = '/admin/';
      // 路由地址为 admin前缀的 需要权限校验
      if (_.startsWith(url, adminUrl)) {
        try {
          ctx.admin = jwt.verify(token, this.jwtConfig.secret);
          ctx.requestContext.registerObject(REQUEST_CTX_KEY, ctx);
          if (ctx.admin.isRefresh) {
            ctx.status = 401;
            throw new CoolCommException('登录失效~', ctx.status);
          }
        } catch (error) {}
        // 使用matchUrl方法来检查URL是否应该被忽略
        const isIgnored = this.ignoreUrls.some(pattern =>
          this.utils.matchUrl(pattern, url)
        );
        if (isIgnored) {
          await next();
          return;
        }
        if (ctx.admin) {
          const rToken = await this.midwayCache.get(
            `admin:token:${ctx.admin.userId}`
          );
          // 判断密码版本是否正确
          const passwordV = await this.midwayCache.get(
            `admin:passwordVersion:${ctx.admin.userId}`
          );
          if (passwordV != ctx.admin.passwordVersion) {
            throw new CoolCommException('登录失效~', 401);
          }
          // 超管拥有所有权限
          if (ctx.admin.isAdmin === true && !ctx.admin.isRefresh) {
            if (rToken !== token && this.jwtConfig.sso) {
              throw new CoolCommException('登录失效~', 401);
            } else {
              await next();
              return;
            }
          }
          // 要登录每个人都有权限的接口
          if (
            new RegExp(`^${adminUrl}?.*/comm/`).test(url) ||
            // 字典接口
            url == '/admin/dict/info/data'
          ) {
            await next();
            return;
          }
          // 如果传的token是refreshToken则校验失败
          if (ctx.admin.isRefresh) {
            throw new CoolCommException('登录失效~', 401);
          }
          if (!rToken) {
            throw new CoolCommException('登录失效或无权限访问~', 401);
          }
          if (rToken !== token && this.jwtConfig.sso) {
            statusCode = 401;
          } else {
            let perms: string[] = await this.midwayCache.get(
              `admin:perms:${ctx.admin.userId}`
            );
            if (!_.isEmpty(perms)) {
              perms = perms.map(e => {
                return e.replace(/:/g, '/');
              });
              if (!perms.includes(url.split('?')[0].replace('/admin/', ''))) {
                statusCode = 403;
              }
            } else {
              statusCode = 403;
            }
          }
        } else {
          statusCode = 401;
        }
        if (statusCode > 200) {
          throw new CoolCommException('登录失效或无权限访问~', statusCode);
        }
      }
      await next();
    };
  }
}
