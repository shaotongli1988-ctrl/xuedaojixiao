import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController, CoolTag, TagTypes } from '@cool-midway/core';
import { PerformanceWorkPlanService } from '../../service/workPlan';

/**
 * 工作计划控制器。
 * 这里只暴露工作计划分页、编辑、执行动作和钉钉审批同步入口，不负责真实钉钉 SDK 鉴权或消息通知。
 */
@Provide()
@CoolController('/admin/performance/workPlan')
export class AdminPerformanceWorkPlanController extends BaseController {
  @Inject()
  performanceWorkPlanService: PerformanceWorkPlanService;

  @Post('/page', { summary: '工作计划分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceWorkPlanService.page(query));
  }

  @Get('/info', { summary: '工作计划详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceWorkPlanService.info(Number(id)));
  }

  @Post('/add', { summary: '新增工作计划' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceWorkPlanService.add(payload));
  }

  @Post('/update', { summary: '编辑工作计划' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceWorkPlanService.updateWorkPlan(payload));
  }

  @Post('/delete', { summary: '删除工作计划' })
  async deleteItem(@Body(ALL) payload: any) {
    await this.performanceWorkPlanService.delete(this.normalizeIds(payload));
    return this.ok();
  }

  @Post('/start', { summary: '开始执行工作计划' })
  async startItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceWorkPlanService.start(payload));
  }

  @Post('/complete', { summary: '完成工作计划' })
  async completeItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceWorkPlanService.complete(payload));
  }

  @Post('/cancel', { summary: '取消工作计划' })
  async cancelItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceWorkPlanService.cancel(payload));
  }

  @Post('/syncDingtalkApproval', { summary: '手工同步钉钉审批来源' })
  async syncDingtalkApproval(@Body(ALL) payload: any) {
    return this.ok(await this.performanceWorkPlanService.syncDingtalkApproval(payload));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/dingtalk/callback', { summary: '钉钉审批回调承接' })
  async dingtalkCallback(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceWorkPlanService.syncDingtalkApproval(payload, {
        bypassPerm: true,
      })
    );
  }

  private normalizeIds(payload: any) {
    if (Array.isArray(payload?.ids)) {
      return payload.ids;
    }
    if (payload?.id !== undefined && payload?.id !== null) {
      return [payload.id];
    }
    return [];
  }
}
