/**
 * 班主任渠道合作看板控制器。
 * 这里只暴露主题19冻结的 summary 聚合接口，不返回跨范围原始明细。
 */
import { Get, Inject, Provide } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherDashboardService } from '../../service/teacher-dashboard';

@Provide()
@CoolController('/admin/performance/teacherDashboard')
export class AdminPerformanceTeacherDashboardController extends BaseController {
  @Inject()
  performanceTeacherDashboardService: PerformanceTeacherDashboardService;

  @Get('/summary', { summary: '班主任渠道合作看板汇总' })
  async summary() {
    return this.ok(await this.performanceTeacherDashboardService.summary());
  }
}
