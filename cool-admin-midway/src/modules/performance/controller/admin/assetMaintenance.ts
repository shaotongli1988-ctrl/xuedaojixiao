import { ALL, Body, Inject, Post, Provide } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产维护控制器。
 * 这里只暴露主题20冻结的 page/add/update/complete/cancel/delete 接口，不负责采购备件或财务能力。
 */
@Provide()
@CoolController('/admin/performance/assetMaintenance')
export class AdminPerformanceAssetMaintenanceController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Post('/page', { summary: '维护记录分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetMaintenancePage(query));
  }

  @Post('/add', { summary: '新增维护记录' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetMaintenanceAdd(payload));
  }

  @Post('/update', { summary: '编辑维护记录' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetMaintenanceUpdate(payload));
  }

  @Post('/complete', { summary: '完成维护' })
  async complete(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetMaintenanceComplete(payload));
  }

  @Post('/cancel', { summary: '取消维护' })
  async cancel(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetMaintenanceCancel(payload));
  }

  @Post('/delete', { summary: '删除维护记录' })
  async deleteItems(@Body(ALL) payload: any) {
    await this.performanceAssetDomainService.assetMaintenanceDelete(this.normalizeIds(payload));
    return this.ok();
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
