import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceCourseReciteService } from '../../service/course-recite';

/**
 * 课程背诵任务控制器。
 * 这里只暴露主题14冻结的背诵任务 page/info/submit 三个接口，不负责课程 CRUD 或考试摘要。
 */
@Provide()
@CoolController('/admin/performance/courseRecite')
export class AdminPerformanceCourseReciteController extends BaseController {
  @Inject()
  performanceCourseReciteService: PerformanceCourseReciteService;

  @Post('/page', { summary: '背诵任务分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceCourseReciteService.page(query));
  }

  @Get('/info', { summary: '背诵任务详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceCourseReciteService.info(Number(id)));
  }

  @Post('/submit', { summary: '提交背诵任务' })
  async submit(@Body(ALL) payload: any) {
    return this.ok(await this.performanceCourseReciteService.submit(payload));
  }
}
