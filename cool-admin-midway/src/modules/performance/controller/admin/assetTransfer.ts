import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产调拨控制器。
 * 这里只暴露主题20冻结的 page/info/add/update/submit/complete/cancel 接口，不负责物流签收扩展。
 */
@Provide()
@CoolController('/admin/performance/assetTransfer')
export class AdminPerformanceAssetTransferController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Post('/page', { summary: '调拨单分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetTransferPage(query));
  }

  @Get('/info', { summary: '调拨单详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceAssetDomainService.assetTransferInfo(Number(id)));
  }

  @Post('/add', { summary: '新增调拨单' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetTransferAdd(payload));
  }

  @Post('/update', { summary: '编辑调拨单' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetTransferUpdate(payload));
  }

  @Post('/submit', { summary: '提交调拨单' })
  async submit(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetTransferSubmit(payload));
  }

  @Post('/complete', { summary: '完成调拨' })
  async complete(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetTransferComplete(payload));
  }

  @Post('/cancel', { summary: '取消调拨单' })
  async cancel(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetTransferCancel(payload));
  }
}
