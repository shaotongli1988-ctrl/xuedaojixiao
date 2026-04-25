import { Middleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';
import { IMiddleware } from '@midwayjs/core';
import { BaseSysLogService } from '../service/sys/log';
import { resolveUserAdminUserId } from '../../user/domain';

/**
 * 日志中间件
 */
@Middleware()
export class BaseLogMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const baseSysLogService = await ctx.requestContext.getAsync(
        BaseSysLogService
      );
      baseSysLogService.record(
        ctx,
        ctx.url,
        ctx.req.method === 'GET' ? ctx.request.query : ctx.request.body,
        resolveUserAdminUserId(ctx.admin)
      );
      await next();
    };
  }
}
