import { ALL, Body, Inject, Post, Provide } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产领用归还控制器。
 * 这里只暴露主题20冻结的 page/add/update/return/markLost/delete 接口，不负责台账主数据维护。
 */
@Provide()
@CoolController('/admin/performance/assetAssignment')
export class AdminPerformanceAssetAssignmentController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Post('/page', { summary: '领用记录分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetAssignmentPage(query));
  }

  @Post('/add', { summary: '新增领用记录' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetAssignmentAdd(payload));
  }

  @Post('/update', { summary: '编辑领用记录' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetAssignmentUpdate(payload));
  }

  @Post('/return', { summary: '归还资产' })
  async returnAsset(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetAssignmentReturn(payload));
  }

  @Post('/markLost', { summary: '标记丢失' })
  async markLost(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetAssignmentMarkLost(payload));
  }

  @Post('/delete', { summary: '删除领用记录' })
  async deleteItems(@Body(ALL) payload: any) {
    await this.performanceAssetDomainService.assetAssignmentDelete(this.normalizeIds(payload));
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
