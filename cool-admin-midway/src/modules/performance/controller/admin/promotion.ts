import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformancePromotionService } from '../../service/promotion';
import type { PromotionDecision } from '../../service/promotion-helper';

/**
 * 晋升管理控制器。
 * 这里只暴露模块 7 所需的晋升单与评审记录接口，不负责 PIP、薪资或自动推荐能力。
 */
@Provide()
@CoolController()
export class AdminPerformancePromotionController extends BaseController {
  @Inject()
  performancePromotionService: PerformancePromotionService;

  @Post('/page', { summary: '晋升分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performancePromotionService.page(query));
  }

  @Get('/info', { summary: '晋升详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performancePromotionService.info(Number(id)));
  }

  @Post('/add', { summary: '新增晋升单' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performancePromotionService.add(payload));
  }

  @Post('/update', { summary: '修改晋升单' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performancePromotionService.updatePromotion(payload));
  }

  @Post('/submit', { summary: '提交晋升单' })
  async submit(@Body('id') id: number) {
    return this.ok(await this.performancePromotionService.submit(Number(id)));
  }

  @Post('/review', { summary: '评审晋升单' })
  async review(
    @Body('id') id: number,
    @Body('decision') decision: PromotionDecision,
    @Body('comment') comment?: string
  ) {
    return this.ok(
      await this.performancePromotionService.review(Number(id), decision, comment)
    );
  }
}
