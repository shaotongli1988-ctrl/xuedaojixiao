import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceGoalService } from '../../service/goal';

/**
 * 目标地图控制器。
 * 这里只暴露模块 2 所需的目标与进度接口，不负责其他绩效子模块能力。
 */
@Provide()
@CoolController()
export class AdminPerformanceGoalController extends BaseController {
  @Inject()
  performanceGoalService: PerformanceGoalService;

  @Post('/page', { summary: '目标分页' })
  async pageList(@Body(ALL) query: any) {
    await this.performanceGoalService.initGoalScope();
    return this.ok(await this.performanceGoalService.page(query));
  }

  @Get('/info', { summary: '目标详情' })
  async infoDetail(@Query('id') id: number) {
    await this.performanceGoalService.initGoalScope();
    return this.ok(await this.performanceGoalService.info(Number(id)));
  }

  @Post('/add', { summary: '新增目标' })
  async createItem(@Body(ALL) payload: any) {
    await this.performanceGoalService.initGoalScope();
    return this.ok(await this.performanceGoalService.add(payload));
  }

  @Post('/update', { summary: '修改目标' })
  async updateItem(@Body(ALL) payload: any) {
    await this.performanceGoalService.initGoalScope();
    return this.ok(await this.performanceGoalService.updateGoal(payload));
  }

  @Post('/delete', { summary: '删除目标' })
  async deleteItems(@Body('ids') ids: number[]) {
    await this.performanceGoalService.initGoalScope();
    await this.performanceGoalService.delete(ids || []);
    return this.ok();
  }

  @Post('/progressUpdate', { summary: '更新目标进度' })
  async progressUpdate(@Body(ALL) payload: any) {
    await this.performanceGoalService.initGoalScope();
    return this.ok(await this.performanceGoalService.progressUpdate(payload));
  }

  @Post('/export', { summary: '导出目标' })
  async export(@Body(ALL) query: any) {
    await this.performanceGoalService.initGoalScope();
    return this.ok(await this.performanceGoalService.export(query));
  }
}
