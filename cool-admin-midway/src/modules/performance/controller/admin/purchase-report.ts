import { Get, Inject, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformancePurchaseReportService } from '../../service/purchase-report';

/**
 * 采购报表控制器。
 * 这里只暴露主题11冻结的 summary/trend/supplierStats 只读接口，不承担导出、菜单或联调脚本职责。
 */
@Provide()
@CoolController('/admin/performance/purchaseReport')
export class AdminPerformancePurchaseReportController extends BaseController {
  @Inject()
  performancePurchaseReportService: PerformancePurchaseReportService;

  @Get('/summary', { summary: '采购报表汇总' })
  async summary(@Query() query: any) {
    return this.ok(await this.performancePurchaseReportService.summary(query));
  }

  @Get('/trend', { summary: '采购报表趋势' })
  async trend(@Query() query: any) {
    return this.ok(await this.performancePurchaseReportService.trend(query));
  }

  @Get('/supplierStats', { summary: '供应商采购统计' })
  async supplierStats(@Query() query: any) {
    return this.ok(await this.performancePurchaseReportService.supplierStats(query));
  }
}
