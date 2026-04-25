import { Get, Inject, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产首页控制器。
 * 这里只暴露主题20冻结的 summary 接口，不负责台账或子单据动作。
 */
@Provide()
@CoolController('/admin/performance/assetDashboard')
export class AdminPerformanceAssetDashboardController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Get('/summary', { summary: '资产首页汇总' })
  async summary(@Query() query: any) {
    return this.ok(await this.performanceAssetDomainService.assetDashboardSummary(query));
  }
}

