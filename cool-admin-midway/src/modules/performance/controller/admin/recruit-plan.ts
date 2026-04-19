import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceRecruitPlanService } from '../../service/recruit-plan';

/**
 * 招聘计划控制器。
 * 这里只暴露主题16备案制扩展版主链动作，不承担审批流或跨主题联动。
 */
@Provide()
@CoolController('/admin/performance/recruitPlan')
export class AdminPerformanceRecruitPlanController extends BaseController {
  @Inject()
  performanceRecruitPlanService: PerformanceRecruitPlanService;

  @Post('/page', { summary: '招聘计划分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceRecruitPlanService.page(query));
  }

  @Get('/info', { summary: '招聘计划详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceRecruitPlanService.info(Number(id)));
  }

  @Post('/add', { summary: '新增招聘计划' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceRecruitPlanService.add(payload));
  }

  @Post('/update', { summary: '修改招聘计划' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceRecruitPlanService.updatePlan(payload));
  }

  @Post('/delete', { summary: '删除招聘计划' })
  async deleteItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceRecruitPlanService.deletePlan(payload));
  }

  @Post('/import', { summary: '导入招聘计划' })
  async importItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceRecruitPlanService.importPlans(payload));
  }

  @Post('/export', { summary: '导出招聘计划' })
  async exportItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceRecruitPlanService.exportPlans(payload));
  }

  @Post('/submit', { summary: '提交招聘计划' })
  async submitItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceRecruitPlanService.submitPlan(payload));
  }

  @Post('/close', { summary: '关闭招聘计划' })
  async closeItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceRecruitPlanService.closePlan(payload));
  }

  @Post('/void', { summary: '作废招聘计划' })
  async voidItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceRecruitPlanService.voidPlan(payload));
  }

  @Post('/reopen', { summary: '重新开启招聘计划' })
  async reopenItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceRecruitPlanService.reopenPlan(payload));
  }
}
