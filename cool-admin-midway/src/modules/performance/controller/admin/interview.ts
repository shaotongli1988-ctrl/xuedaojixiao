import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceInterviewService } from '../../service/interview';

/**
 * 招聘面试控制器。
 * 这里只暴露主题8首批冻结的面试标准 CRUD，不处理简历池、录用流程或跨模块聚合逻辑。
 */
@Provide()
@CoolController()
export class AdminPerformanceInterviewController extends BaseController {
  @Inject()
  performanceInterviewService: PerformanceInterviewService;

  @Post('/page', { summary: '面试分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceInterviewService.page(query));
  }

  @Get('/info', { summary: '面试详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceInterviewService.info(Number(id)));
  }

  @Post('/add', { summary: '新增面试' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceInterviewService.add(payload));
  }

  @Post('/update', { summary: '修改面试' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceInterviewService.updateInterview(payload));
  }

  @Post('/delete', { summary: '删除面试' })
  async deleteItems(@Body('ids') ids: number[]) {
    await this.performanceInterviewService.delete(ids || []);
    return this.ok();
  }
}
