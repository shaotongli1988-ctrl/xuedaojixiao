/**
 * 班主任合作控制器。
 * 这里只暴露主题19冻结的合作标记动作，不扩展到签约、结算或代理体系。
 */
import { ALL, Body, Inject, Post, Provide } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherCooperationService } from '../../service/teacher-cooperation';

@Provide()
@CoolController('/admin/performance/teacherCooperation')
export class AdminPerformanceTeacherCooperationController extends BaseController {
  @Inject()
  performanceTeacherCooperationService: PerformanceTeacherCooperationService;

  @Post('/mark', { summary: '标记班主任合作' })
  async mark(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherCooperationService.mark(payload));
  }
}
