import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceMaterialDomainService } from '../../service/material-domain';

/**
 * 物资目录控制器。
 * 这里只暴露一期冻结的目录 CRUD 与状态更新接口，不处理库存回写或采购分流。
 */
@Provide()
@CoolController('/admin/performance/materialCatalog')
export class AdminPerformanceMaterialCatalogController extends BaseController {
  @Inject()
  performanceMaterialDomainService: PerformanceMaterialDomainService;

  @Post('/page', { summary: '物资目录分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceMaterialDomainService.materialCatalogPage(query));
  }

  @Get('/info', { summary: '物资目录详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceMaterialDomainService.materialCatalogInfo(Number(id)));
  }

  @Post('/add', { summary: '新增物资目录' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialCatalogAdd(payload));
  }

  @Post('/update', { summary: '编辑物资目录' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialCatalogUpdate(payload));
  }

  @Post('/updateStatus', { summary: '更新物资目录状态' })
  async updateStatus(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceMaterialDomainService.materialCatalogUpdateStatus(payload)
    );
  }

  @Post('/delete', { summary: '删除物资目录' })
  async deleteItems(@Body(ALL) payload: any) {
    await this.performanceMaterialDomainService.materialCatalogDelete(this.normalizeIds(payload));
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
