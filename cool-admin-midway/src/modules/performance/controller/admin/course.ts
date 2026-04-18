import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceCourseService } from '../../service/course';

/**
 * 培训课程控制器。
 * 这里只暴露主题 7 冻结的课程主链接口，不承接员工报名或培训扩展域动作。
 */
@Provide()
@CoolController()
export class AdminPerformanceCourseController extends BaseController {
  @Inject()
  performanceCourseService: PerformanceCourseService;

  @Post('/page', { summary: '课程分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceCourseService.page(query));
  }

  @Get('/info', { summary: '课程详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceCourseService.info(Number(id)));
  }

  @Post('/add', { summary: '新增课程' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceCourseService.add(payload));
  }

  @Post('/update', { summary: '修改课程' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceCourseService.updateCourse(payload));
  }

  @Post('/delete', { summary: '删除课程' })
  async deleteItems(@Body('ids') ids: number[]) {
    await this.performanceCourseService.delete(ids || []);
    return this.ok();
  }

  @Post('/enrollmentPage', { summary: '课程报名列表' })
  async enrollmentPage(@Body(ALL) query: any) {
    return this.ok(await this.performanceCourseService.enrollmentPage(query));
  }
}
