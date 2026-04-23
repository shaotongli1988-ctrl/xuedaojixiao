import { Config, Controller, Get, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { SwaggerBuilder } from '../builder';
import { BaseController } from '@cool-midway/core';

/**
 * 运行时 Swagger 调试入口。
 * 这里只提供开发态派生视图，不承担仓库级 API 契约事实源职责。
 */
@Controller('/swagger')
export class SwaggerIndexController extends BaseController {
  @Inject()
  ctx: Context;

  @Inject()
  swaggerBuilder: SwaggerBuilder;

  @Config('cool.eps')
  epsConfig: boolean;

  @Get('/', { summary: '调试 Swagger 界面（非事实源）' })
  public async index() {
    if (!this.epsConfig) {
      return this.fail('Eps未开启');
    }
    await this.ctx.render('swagger', {});
  }

  @Get('/json', { summary: '获得调试 Swagger JSON（非事实源）' })
  public async json() {
    if (!this.epsConfig) {
      return this.fail('Eps未开启');
    }
    return this.swaggerBuilder.json;
  }
}
