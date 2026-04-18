import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceSuggestionService } from '../../service/suggestion';

/**
 * suggestion 控制器。
 * 这里只暴露自动建议的只读链路与人工处理动作，不负责正式单据创建或前端跳转。
 */
@Provide()
@CoolController()
export class AdminPerformanceSuggestionController extends BaseController {
  @Inject()
  performanceSuggestionService: PerformanceSuggestionService;

  @Post('/page', { summary: '建议分页' })
  async pageList(@Body(ALL) query: any) {
    await this.performanceSuggestionService.initSuggestionScope();
    return this.ok(await this.performanceSuggestionService.page(query));
  }

  @Get('/info', { summary: '建议详情' })
  async infoDetail(@Query('id') id: number) {
    await this.performanceSuggestionService.initSuggestionScope();
    return this.ok(await this.performanceSuggestionService.info(Number(id)));
  }

  @Post('/accept', { summary: '采用建议' })
  async accept(@Body(ALL) payload: any) {
    await this.performanceSuggestionService.initSuggestionScope();
    return this.ok(await this.performanceSuggestionService.accept(payload));
  }

  @Post('/ignore', { summary: '忽略建议' })
  async ignore(@Body(ALL) payload: any) {
    await this.performanceSuggestionService.initSuggestionScope();
    return this.ok(await this.performanceSuggestionService.ignore(payload));
  }

  @Post('/reject', { summary: '驳回建议' })
  async reject(@Body(ALL) payload: any) {
    await this.performanceSuggestionService.initSuggestionScope();
    return this.ok(await this.performanceSuggestionService.reject(payload));
  }

  @Post('/revoke', { summary: '撤销建议' })
  async revoke(@Body(ALL) payload: any) {
    await this.performanceSuggestionService.initSuggestionScope();
    return this.ok(await this.performanceSuggestionService.revoke(payload));
  }
}
