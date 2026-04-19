/**
 * 班主任跟进控制器。
 * 这里只暴露主题19冻结的跟进分页与新增接口，不承担提醒、附件或导出能力。
 */
import { ALL, Body, Inject, Post, Provide } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherFollowService } from '../../service/teacher-follow';

@Provide()
@CoolController('/admin/performance/teacherFollow')
export class AdminPerformanceTeacherFollowController extends BaseController {
  @Inject()
  performanceTeacherFollowService: PerformanceTeacherFollowService;

  @Post('/page', { summary: '班主任跟进分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTeacherFollowService.page(query));
  }

  @Post('/add', { summary: '新增班主任跟进' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherFollowService.add(payload));
  }
}
