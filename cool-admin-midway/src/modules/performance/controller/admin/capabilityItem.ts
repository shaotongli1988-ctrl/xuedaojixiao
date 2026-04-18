import { Get, Inject, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceCapabilityService } from '../../service/capability';

/**
 * 能力项控制器。
 * 这里只暴露主题13冻结的能力项详情接口，不负责能力项维护动作。
 */
@Provide()
@CoolController()
export class AdminPerformanceCapabilityItemController extends BaseController {
  @Inject()
  performanceCapabilityService: PerformanceCapabilityService;

  @Get('/info', { summary: '能力项详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceCapabilityService.itemInfo(Number(id)));
  }
}
