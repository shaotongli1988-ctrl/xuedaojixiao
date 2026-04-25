import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产采购入库控制器。
 * 这里只暴露主题20冻结的 page/info/add/update/submit/receive/cancel 接口，不负责主题11采购审批链。
 */
@Provide()
@CoolController('/admin/performance/assetProcurement')
export class AdminPerformanceAssetProcurementController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Post('/page', { summary: '采购入库分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetProcurementPage(query));
  }

  @Get('/info', { summary: '采购入库详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceAssetDomainService.assetProcurementInfo(Number(id)));
  }

  @Post('/add', { summary: '新增采购入库单' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetProcurementAdd(payload));
  }

  @Post('/update', { summary: '编辑采购入库单' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetProcurementUpdate(payload));
  }

  @Post('/submit', { summary: '提交采购入库单' })
  async submit(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetProcurementSubmit(payload));
  }

  @Post('/receive', { summary: '确认入库' })
  async receive(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetProcurementReceive(payload));
  }

  @Post('/cancel', { summary: '取消采购入库单' })
  async cancel(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetProcurementCancel(payload));
  }
}
