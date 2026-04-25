import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceCoursePracticeService } from '../../service/course-practice';

/**
 * 课程练习任务控制器。
 * 这里只暴露主题14冻结的练习任务 page/info/submit 三个接口，不负责课程管理或真实 AI 协议。
 */
@Provide()
@CoolController('/admin/performance/coursePractice')
export class AdminPerformanceCoursePracticeController extends BaseController {
  @Inject()
  performanceCoursePracticeService: PerformanceCoursePracticeService;

  @Post('/page', { summary: '练习任务分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceCoursePracticeService.page(query));
  }

  @Get('/info', { summary: '练习任务详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceCoursePracticeService.info(Number(id)));
  }

  @Post('/submit', { summary: '提交练习任务' })
  async submit(@Body(ALL) payload: any) {
    return this.ok(await this.performanceCoursePracticeService.submit(payload));
  }
}
