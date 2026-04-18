import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceCapabilityService } from '../../service/capability';

/**
 * 能力模型控制器。
 * 这里只暴露主题13冻结的能力模型最小主链，不负责画像原始过程或人才资产主链动作。
 */
@Provide()
@CoolController()
export class AdminPerformanceCapabilityModelController extends BaseController {
  @Inject()
  performanceCapabilityService: PerformanceCapabilityService;

  @Post('/page', { summary: '能力模型分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceCapabilityService.modelPage(query));
  }

  @Get('/info', { summary: '能力模型详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceCapabilityService.modelInfo(Number(id)));
  }

  @Post('/add', { summary: '新增能力模型' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceCapabilityService.addModel(payload));
  }

  @Post('/update', { summary: '修改能力模型' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceCapabilityService.updateModel(payload));
  }
}
