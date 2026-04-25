/**
 * 班主任待跟进控制器。
 * 这里只暴露主题19冻结的 today / overdue 派生待办分页，不扩展新主状态。
 */
import { ALL, Body, Inject, Post, Provide } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherTodoService } from '../../service/teacher-todo';

@Provide()
@CoolController('/admin/performance/teacherTodo')
export class AdminPerformanceTeacherTodoController extends BaseController {
  @Inject()
  performanceTeacherTodoService: PerformanceTeacherTodoService;

  @Post('/page', { summary: '班主任待跟进分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTeacherTodoService.page(query));
  }
}
