import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceMaterialDomainService } from '../../service/material-domain';

/**
 * 物资入库控制器。
 * 这里只暴露一期冻结的 page/info/add/update/submit/receive/cancel 接口，不承担采购分流能力。
 */
@Provide()
@CoolController('/admin/performance/materialInbound')
export class AdminPerformanceMaterialInboundController extends BaseController {
  @Inject()
  performanceMaterialDomainService: PerformanceMaterialDomainService;

  @Post('/page', { summary: '物资入库分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceMaterialDomainService.materialInboundPage(query));
  }

  @Get('/info', { summary: '物资入库详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceMaterialDomainService.materialInboundInfo(Number(id)));
  }

  @Post('/add', { summary: '新增物资入库单' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialInboundAdd(payload));
  }

  @Post('/update', { summary: '编辑物资入库单' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialInboundUpdate(payload));
  }

  @Post('/submit', { summary: '提交物资入库单' })
  async submit(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialInboundSubmit(payload));
  }

  @Post('/receive', { summary: '确认物资入库' })
  async receive(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialInboundReceive(payload));
  }

  @Post('/cancel', { summary: '取消物资入库单' })
  async cancel(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialInboundCancel(payload));
  }
}
