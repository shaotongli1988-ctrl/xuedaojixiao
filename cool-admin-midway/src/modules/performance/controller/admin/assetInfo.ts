import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产台账控制器。
 * 这里只暴露主题20冻结的 page/info/add/update/delete/updateStatus 接口，不负责其他资产子流程。
 */
@Provide()
@CoolController('/admin/performance/assetInfo')
export class AdminPerformanceAssetInfoController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Post('/page', { summary: '资产台账分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetInfoPage(query));
  }

  @Get('/info', { summary: '资产详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceAssetDomainService.assetInfoDetail(Number(id)));
  }

  @Post('/add', { summary: '新增资产' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetInfoAdd(payload));
  }

  @Post('/update', { summary: '编辑资产' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetInfoUpdate(payload));
  }

  @Post('/delete', { summary: '删除资产' })
  async deleteItems(@Body(ALL) payload: any) {
    await this.performanceAssetDomainService.assetInfoDelete(this.normalizeIds(payload));
    return this.ok();
  }

  @Post('/updateStatus', { summary: '更新资产状态' })
  async updateStatus(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetInfoUpdateStatus(payload));
  }

  private normalizeIds(payload: any) {
    if (Array.isArray(payload?.ids)) {
      return payload.ids;
    }
    if (payload?.id !== undefined && payload?.id !== null) {
      return [payload.id];
    }
    return [];
  }
}
