import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产报表控制器。
 * 这里只暴露主题20冻结的 summary/page/export 接口，不负责文件模板或 BI 扩展。
 */
@Provide()
@CoolController('/admin/performance/assetReport')
export class AdminPerformanceAssetReportController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Get('/summary', { summary: '资产报表汇总' })
  async summary(@Query() query: any) {
    return this.ok(await this.performanceAssetDomainService.assetReportSummary(query));
  }

  @Post('/page', { summary: '资产报表分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetReportPage(query));
  }

  @Get('/export', { summary: '导出资产报表' })
  async export(@Query() query: any) {
    return this.ok(await this.performanceAssetDomainService.assetReportExport(query));
  }
}
