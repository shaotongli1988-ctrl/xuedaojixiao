import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformancePurchaseOrderService } from '../../service/purchase-order';

/**
 * 采购订单控制器。
 * 这里只暴露主题11冻结的采购订单标准 CRUD，不处理采购审批、收货/入库、对账或付款动作。
 */
@Provide()
@CoolController('/admin/performance/purchaseOrder')
export class AdminPerformancePurchaseOrderController extends BaseController {
  @Inject()
  performancePurchaseOrderService: PerformancePurchaseOrderService;

  @Post('/page', { summary: '采购订单分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performancePurchaseOrderService.page(query));
  }

  @Get('/info', { summary: '采购订单详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(
      await this.performancePurchaseOrderService.info(Number(id))
    );
  }

  @Post('/add', { summary: '新增采购订单' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performancePurchaseOrderService.add(payload));
  }

  @Post('/update', { summary: '修改采购订单' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performancePurchaseOrderService.updatePurchaseOrder(payload)
    );
  }

  @Post('/delete', { summary: '删除采购订单' })
  async deleteItems(@Body(ALL) payload: any) {
    await this.performancePurchaseOrderService.delete(this.normalizeIds(payload));
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
