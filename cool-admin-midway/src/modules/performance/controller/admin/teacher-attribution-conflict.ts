/**
 * 班主任资源归因冲突控制器。
 * 这里只暴露主题19 V0.2 冻结的冲突查询与处理接口，不处理审批、通知或复杂风控规则。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherAttributionConflictService } from '../../service/teacher-attribution-conflict';

@Provide()
@CoolController('/admin/performance/teacherAttributionConflict')
export class AdminPerformanceTeacherAttributionConflictController extends BaseController {
  @Inject()
  performanceTeacherAttributionConflictService: PerformanceTeacherAttributionConflictService;

  @Post('/page', { summary: '归因冲突分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTeacherAttributionConflictService.page(query));
  }

  @Get('/info', { summary: '归因冲突详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(
      await this.performanceTeacherAttributionConflictService.info(Number(id))
    );
  }

  @Post('/create', { summary: '创建归因冲突' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAttributionConflictService.create(payload));
  }

  @Post('/resolve', { summary: '处理归因冲突' })
  async resolve(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAttributionConflictService.resolve(payload));
  }
}
