import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssessmentService } from '../../service/assessment';

/**
 * 评估单控制器。
 * 这里只暴露模块 1 所需的评估单接口，不负责其他绩效子模块能力。
 */
@Provide()
@CoolController()
export class AdminPerformanceAssessmentController extends BaseController {
  @Inject()
  performanceAssessmentService: PerformanceAssessmentService;

  @Post('/page', { summary: '评估单分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssessmentService.page(query));
  }

  @Get('/info', { summary: '评估单详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceAssessmentService.info(Number(id)));
  }

  @Post('/add', { summary: '新增评估单' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssessmentService.add(payload));
  }

  @Post('/update', { summary: '修改评估单' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssessmentService.updateAssessment(payload));
  }

  @Post('/delete', { summary: '删除评估单' })
  async deleteItems(@Body('ids') ids: number[]) {
    await this.performanceAssessmentService.delete(ids || []);
    return this.ok();
  }

  @Post('/submit', { summary: '提交评估单' })
  async submit(@Body('id') id: number) {
    return this.ok(await this.performanceAssessmentService.submit(Number(id)));
  }

  @Post('/approve', { summary: '审批通过' })
  async approve(@Body('id') id: number, @Body('comment') comment?: string) {
    return this.ok(
      await this.performanceAssessmentService.approve(Number(id), comment)
    );
  }

  @Post('/reject', { summary: '审批驳回' })
  async reject(@Body('id') id: number, @Body('comment') comment?: string) {
    return this.ok(
      await this.performanceAssessmentService.reject(Number(id), comment)
    );
  }

  @Post('/export', { summary: '导出评估单' })
  async export(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssessmentService.export(query));
  }
}
