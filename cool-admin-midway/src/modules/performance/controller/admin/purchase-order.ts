import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformancePurchaseOrderService } from '../../service/purchase-order';

/**
 * 采购订单控制器。
 * 这里只暴露主题11扩容后冻结的采购订单主链与流程动作，不处理付款、对账、库存总账或外部 ERP。
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

  @Post('/submitInquiry', { summary: '提交询价' })
  async submitInquiry(@Body(ALL) payload: any) {
    return this.ok(await this.performancePurchaseOrderService.submitInquiry(payload));
  }

  @Post('/submitApproval', { summary: '提交审批' })
  async submitApproval(@Body(ALL) payload: any) {
    return this.ok(await this.performancePurchaseOrderService.submitApproval(payload));
  }

  @Post('/approve', { summary: '审批通过' })
  async approve(@Body(ALL) payload: any) {
    return this.ok(await this.performancePurchaseOrderService.approve(payload));
  }

  @Post('/reject', { summary: '审批驳回' })
  async reject(@Body(ALL) payload: any) {
    return this.ok(await this.performancePurchaseOrderService.reject(payload));
  }

  @Post('/receive', { summary: '采购收货' })
  async receive(@Body(ALL) payload: any) {
    return this.ok(await this.performancePurchaseOrderService.receive(payload));
  }

  @Post('/close', { summary: '关闭采购单' })
  async close(@Body(ALL) payload: any) {
    return this.ok(await this.performancePurchaseOrderService.close(payload));
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
