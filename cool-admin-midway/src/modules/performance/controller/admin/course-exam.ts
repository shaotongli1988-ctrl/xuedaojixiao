import { Get, Inject, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceCourseExamService } from '../../service/course-exam';

/**
 * 课程考试结果摘要控制器。
 * 这里只暴露主题14冻结的考试/结果摘要只读接口，不负责试卷、题库或人工改分操作。
 */
@Provide()
@CoolController('/admin/performance/courseExam')
export class AdminPerformanceCourseExamController extends BaseController {
  @Inject()
  performanceCourseExamService: PerformanceCourseExamService;

  @Get('/summary', { summary: '考试结果摘要' })
  async summary(@Query('courseId') courseId: number) {
    return this.ok(await this.performanceCourseExamService.summary(Number(courseId)));
  }
}
