import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceFeedbackService } from '../../service/feedback';

/**
 * 360 环评控制器。
 * 这里只暴露模块 5 的任务、提交和汇总接口，不负责前端页面状态编排。
 */
@Provide()
@CoolController()
export class AdminPerformanceFeedbackController extends BaseController {
  @Inject()
  performanceFeedbackService: PerformanceFeedbackService;

  @Post('/page', { summary: '环评任务分页' })
  async pageList(@Body(ALL) query: any) {
    await this.performanceFeedbackService.initFeedbackScope();
    return this.ok(await this.performanceFeedbackService.page(query));
  }

  @Get('/info', { summary: '环评任务详情' })
  async infoDetail(@Query('id') id: number) {
    await this.performanceFeedbackService.initFeedbackScope();
    return this.ok(await this.performanceFeedbackService.info(Number(id)));
  }

  @Post('/add', { summary: '新增环评任务' })
  async createItem(@Body(ALL) payload: any) {
    await this.performanceFeedbackService.initFeedbackScope();
    return this.ok(await this.performanceFeedbackService.add(payload));
  }

  @Post('/submit', { summary: '提交环评反馈' })
  async submit(@Body(ALL) payload: any) {
    await this.performanceFeedbackService.initFeedbackScope();
    return this.ok(await this.performanceFeedbackService.submit(payload));
  }

  @Get('/summary', { summary: '环评汇总' })
  async summary(@Query('id') id: number) {
    await this.performanceFeedbackService.initFeedbackScope();
    return this.ok(await this.performanceFeedbackService.summary(Number(id)));
  }
}
