/**
 * 驾驶舱控制器入口。
 * 这里只暴露模块 3 所需的驾驶舱汇总接口，不负责其他绩效子模块能力。
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
}
