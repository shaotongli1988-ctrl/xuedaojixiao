/**
 * 驾驶舱控制器入口。
 * 这里只暴露首期 summary 和主题 6 crossSummary 两条只读聚合接口，不负责其他绩效子模块能力。
 */
import { Get, Inject, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceDashboardService } from '../../service/dashboard';
@Provide()
@CoolController()
export class AdminPerformanceDashboardController extends BaseController {
  @Inject()
  performanceDashboardService: PerformanceDashboardService;

  @Get('/summary', { summary: '绩效驾驶舱汇总' })
  async summary(
    @Query('periodType') periodType?: string,
    @Query('periodValue') periodValue?: string,
    @Query('departmentId') departmentId?: number
  ) {
    return this.ok(
      await this.performanceDashboardService.summary({
        periodType,
        periodValue,
        departmentId: departmentId ? Number(departmentId) : undefined,
      })
    );
  }

  @Get('/crossSummary', { summary: '跨模块驾驶舱汇总' })
  async crossSummary(
    @Query('periodType') periodType?: string,
    @Query('periodValue') periodValue?: string,
    @Query('departmentId') departmentId?: number,
    @Query('metricCodes') metricCodes?: string[] | string
  ) {
    return this.ok(
      await this.performanceDashboardService.crossSummary({
        periodType,
        periodValue,
        departmentId: departmentId ? Number(departmentId) : undefined,
        metricCodes: this.normalizeMetricCodes(metricCodes),
      })
    );
  }

  private normalizeMetricCodes(metricCodes?: string[] | string) {
    const list = Array.isArray(metricCodes) ? metricCodes : [metricCodes];
    return list
      .flatMap(item => String(item || '').split(','))
      .map(item => item.trim())
      .filter(Boolean);
  }
}
