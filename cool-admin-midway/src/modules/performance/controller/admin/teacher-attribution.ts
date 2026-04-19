/**
 * 班主任资源归因控制器。
 * 这里只暴露主题19 V0.2 冻结的最小归因接口，不处理审批流、结算或复杂归因报表。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherAttributionService } from '../../service/teacher-attribution';

@Provide()
@CoolController('/admin/performance/teacherAttribution')
export class AdminPerformanceTeacherAttributionController extends BaseController {
  @Inject()
  performanceTeacherAttributionService: PerformanceTeacherAttributionService;

  @Post('/page', { summary: '归因分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTeacherAttributionService.page(query));
  }

  @Get('/info', { summary: '归因详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceTeacherAttributionService.info(Number(id)));
  }

  @Post('/assign', { summary: '建立归因' })
  async assign(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAttributionService.assign(payload));
  }

  @Post('/change', { summary: '调整归因' })
  async change(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAttributionService.change(payload));
  }

  @Post('/remove', { summary: '移除归因' })
  async remove(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAttributionService.remove(payload));
  }
}
