import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产折旧控制器。
 * 这里只暴露主题20冻结的 page/summary/recalculate 接口，不负责会计凭证或总账扩展。
 */
@Provide()
@CoolController('/admin/performance/assetDepreciation')
export class AdminPerformanceAssetDepreciationController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Post('/page', { summary: '折旧分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetDepreciationPage(query));
  }

  @Get('/summary', { summary: '折旧汇总' })
  async summary(@Query() query: any) {
    return this.ok(await this.performanceAssetDomainService.assetDepreciationSummary(query));
  }

  @Post('/recalculate', { summary: '折旧重算' })
  async recalculate(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetDepreciationRecalculate(payload));
  }
}
