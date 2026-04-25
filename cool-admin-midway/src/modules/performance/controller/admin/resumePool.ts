import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceResumePoolService } from '../../service/resumePool';

/**
 * 招聘简历池控制器。
 * 这里只暴露主题15冻结的后端主链动作，不承担前端页面联调或跨主题流程编排。
 */
@Provide()
@CoolController('/admin/performance/resumePool')
export class AdminPerformanceResumePoolController extends BaseController {
  @Inject()
  performanceResumePoolService: PerformanceResumePoolService;

  @Post('/page', { summary: '简历分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceResumePoolService.page(query));
  }

  @Get('/info', { summary: '简历详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceResumePoolService.info(Number(id)));
  }

  @Post('/add', { summary: '新增简历' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceResumePoolService.add(payload));
  }

  @Post('/update', { summary: '修改简历' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceResumePoolService.updateResume(payload));
  }

  @Post('/import', { summary: '导入简历' })
  async importItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceResumePoolService.importResume(payload));
  }

  @Post('/export', { summary: '导出简历' })
  async exportItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceResumePoolService.exportResume(payload));
  }

  @Post('/uploadAttachment', { summary: '上传附件' })
  async uploadAttachment(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceResumePoolService.uploadAttachment(payload)
    );
  }

  @Post('/downloadAttachment', { summary: '下载附件' })
  async downloadAttachment(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceResumePoolService.downloadAttachment(payload)
    );
  }

  @Post('/convertToTalentAsset', { summary: '转人才资产' })
  async convertToTalentAsset(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceResumePoolService.convertToTalentAsset(payload)
    );
  }

  @Post('/createInterview', { summary: '发起面试' })
  async createInterview(@Body(ALL) payload: any) {
    return this.ok(await this.performanceResumePoolService.createInterview(payload));
  }
}
