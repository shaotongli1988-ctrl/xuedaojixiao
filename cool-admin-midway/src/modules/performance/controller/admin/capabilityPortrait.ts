import { Get, Inject, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceCapabilityService } from '../../service/capability';

/**
 * 能力画像控制器。
 * 这里只暴露主题13冻结的能力画像摘要接口，不负责画像原始分值、评语或简历全文返回。
 */
@Provide()
@CoolController()
export class AdminPerformanceCapabilityPortraitController extends BaseController {
  @Inject()
  performanceCapabilityService: PerformanceCapabilityService;

  @Get('/info', { summary: '能力画像摘要' })
  async infoDetail(@Query('employeeId') employeeId: number) {
    return this.ok(
      await this.performanceCapabilityService.portraitInfo(Number(employeeId))
    );
  }
}
