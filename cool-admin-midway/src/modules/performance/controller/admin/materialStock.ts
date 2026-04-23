import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceMaterialDomainService } from '../../service/material-domain';

/**
 * 物资库存控制器。
 * 这里只暴露一期冻结的只读库存分页、详情和汇总接口，不允许直接改库存。
 */
@Provide()
@CoolController('/admin/performance/materialStock')
export class AdminPerformanceMaterialStockController extends BaseController {
  @Inject()
  performanceMaterialDomainService: PerformanceMaterialDomainService;

  @Post('/page', { summary: '物资库存分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceMaterialDomainService.materialStockPage(query));
  }

  @Get('/info', { summary: '物资库存详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceMaterialDomainService.materialStockInfo(Number(id)));
  }

  @Get('/summary', { summary: '物资库存汇总' })
  async summary(@Query() query: any) {
    return this.ok(await this.performanceMaterialDomainService.materialStockSummary(query));
  }
}
