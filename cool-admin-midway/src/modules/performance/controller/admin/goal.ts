import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceGoalService } from '../../service/goal';
import { PerformanceGoalOperationsService } from '../../service/goal-operations';

/**
 * 目标地图控制器。
 * 这里只暴露模块 2 所需的目标与进度接口，不负责其他绩效子模块能力。
 */
@Provide()
@CoolController()
export class AdminPerformanceGoalController extends BaseController {
  @Inject()
  performanceGoalService: PerformanceGoalService;

  @Inject()
  performanceGoalOperationsService: PerformanceGoalOperationsService;

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

  @Get('/opsDepartmentConfig', { summary: '目标运营台部门配置' })
  async opsDepartmentConfig(@Query(ALL) query: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(await this.performanceGoalOperationsService.getDepartmentConfig(query));
  }

  @Get('/opsAccessProfile', { summary: '目标运营台权限画像' })
  async opsAccessProfile(@Query(ALL) query: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(await this.performanceGoalOperationsService.accessProfile(query));
  }

  @Post('/opsDepartmentConfigSave', { summary: '保存目标运营台部门配置' })
  async opsDepartmentConfigSave(@Body(ALL) payload: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(
      await this.performanceGoalOperationsService.saveDepartmentConfig(payload)
    );
  }

  @Post('/opsPlanPage', { summary: '目标运营台计划分页' })
  async opsPlanPage(@Body(ALL) query: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(await this.performanceGoalOperationsService.pagePlans(query));
  }

  @Get('/opsPlanInfo', { summary: '目标运营台计划详情' })
  async opsPlanInfo(@Query('id') id: number) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(await this.performanceGoalOperationsService.infoPlan(Number(id)));
  }

  @Post('/opsPlanSave', { summary: '保存目标运营台计划' })
  async opsPlanSave(@Body(ALL) payload: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(await this.performanceGoalOperationsService.savePlan(payload));
  }

  @Post('/opsPlanDelete', { summary: '删除目标运营台计划' })
  async opsPlanDelete(@Body('ids') ids: number[]) {
    await this.performanceGoalOperationsService.initGoalScope();
    await this.performanceGoalOperationsService.deletePlans(ids || []);
    return this.ok();
  }

  @Post('/opsDailySubmit', { summary: '目标运营台日结果填报' })
  async opsDailySubmit(@Body(ALL) payload: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(
      await this.performanceGoalOperationsService.submitDailyResults(payload)
    );
  }

  @Post('/opsDailyFinalize', { summary: '目标运营台日结果自动补零' })
  async opsDailyFinalize(@Body(ALL) payload: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(
      await this.performanceGoalOperationsService.finalizeDailyMissing(payload)
    );
  }

  @Post('/opsOverview', { summary: '目标运营台总览' })
  async opsOverview(@Body(ALL) query: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(await this.performanceGoalOperationsService.overview(query));
  }

  @Get('/opsReportInfo', { summary: '目标运营台日报详情' })
  async opsReportInfo(@Query(ALL) query: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(await this.performanceGoalOperationsService.reportInfo(query));
  }

  @Post('/opsReportGenerate', { summary: '生成目标运营台日报' })
  async opsReportGenerate(@Body(ALL) payload: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(
      await this.performanceGoalOperationsService.generateDailyReport(payload)
    );
  }

  @Post('/opsReportStatusUpdate', { summary: '更新目标运营台日报状态' })
  async opsReportStatusUpdate(@Body(ALL) payload: any) {
    await this.performanceGoalOperationsService.initGoalScope();
    return this.ok(
      await this.performanceGoalOperationsService.updateReportStatus(payload)
    );
  }
}
