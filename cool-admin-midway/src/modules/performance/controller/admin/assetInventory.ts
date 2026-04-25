import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产盘点控制器。
 * 这里只暴露主题20冻结的 page/info/add/update/start/complete/close 接口，不负责扫码/RFID 场景。
 */
@Provide()
@CoolController('/admin/performance/assetInventory')
export class AdminPerformanceAssetInventoryController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Post('/page', { summary: '盘点单分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetInventoryPage(query));
  }

  @Get('/info', { summary: '盘点单详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceAssetDomainService.assetInventoryInfo(Number(id)));
  }

  @Post('/add', { summary: '新增盘点单' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetInventoryAdd(payload));
  }

  @Post('/update', { summary: '编辑盘点单' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetInventoryUpdate(payload));
  }

  @Post('/start', { summary: '开始盘点' })
  async start(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetInventoryStart(payload));
  }

  @Post('/complete', { summary: '完成盘点' })
  async complete(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetInventoryComplete(payload));
  }

  @Post('/close', { summary: '关闭盘点' })
  async close(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetInventoryClose(payload));
  }
}
