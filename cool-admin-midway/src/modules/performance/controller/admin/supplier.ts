import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceSupplierService } from '../../service/supplier';

/**
 * 供应商控制器。
 * 这里只暴露主题11冻结的供应商标准 CRUD，不处理资质管理、评级、合同流或结算中心能力。
 */
@Provide()
@CoolController('/admin/performance/supplier')
export class AdminPerformanceSupplierController extends BaseController {
  @Inject()
  performanceSupplierService: PerformanceSupplierService;

  @Post('/page', { summary: '供应商分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceSupplierService.page(query));
  }

  @Get('/info', { summary: '供应商详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceSupplierService.info(Number(id)));
  }

  @Post('/add', { summary: '新增供应商' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceSupplierService.add(payload));
  }

  @Post('/update', { summary: '修改供应商' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceSupplierService.updateSupplier(payload));
  }

  @Post('/delete', { summary: '删除供应商' })
  async deleteItems(@Body(ALL) payload: any) {
    await this.performanceSupplierService.delete(this.normalizeIds(payload));
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
