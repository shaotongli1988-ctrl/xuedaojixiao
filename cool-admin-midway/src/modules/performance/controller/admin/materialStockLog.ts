import { ALL, Body, Inject, Post, Provide } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceMaterialDomainService } from '../../service/material-domain';

/**
 * 物资库存流水控制器。
 * 这里只暴露一期冻结的只读分页接口，不提供单条编辑或删除能力。
 */
@Provide()
@CoolController('/admin/performance/materialStockLog')
export class AdminPerformanceMaterialStockLogController extends BaseController {
  @Inject()
  performanceMaterialDomainService: PerformanceMaterialDomainService;

  @Post('/page', { summary: '物资库存流水分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceMaterialDomainService.materialStockLogPage(query));
  }
}
