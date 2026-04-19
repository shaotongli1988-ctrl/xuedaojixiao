/**
 * 美工协同控制器。
 * 这里只暴露美工协同页面语义层接口，不承载共享记录域的底层实现。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceOfficeCollabRecordService } from '../../service/office-collab-record';

@Provide()
@CoolController('/admin/performance/designCollab')
export class AdminPerformanceDesignCollabController extends BaseController {
  @Inject()
  performanceOfficeCollabRecordService: PerformanceOfficeCollabRecordService;

  @Post('/page', { summary: '美工协同分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.pageByModule(
        'designCollab',
        query
      )
    );
  }

  @Get('/info', { summary: '美工协同详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.infoByModule(
        'designCollab',
        Number(id)
      )
    );
  }

  @Get('/stats', { summary: '美工协同统计' })
  async statsSummary(@Query(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.statsByModule(
        'designCollab',
        query
      )
    );
  }

  @Post('/add', { summary: '新增美工协同任务' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.addByModule(
        'designCollab',
        payload
      )
    );
  }

  @Post('/update', { summary: '更新美工协同任务' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.updateByModule(
        'designCollab',
        payload
      )
    );
  }

  @Post('/delete', { summary: '删除美工协同任务' })
  async deleteItem(@Body('ids') ids: number[]) {
    await this.performanceOfficeCollabRecordService.deleteByModule(
      'designCollab',
      ids || []
    );
    return this.ok();
  }
}
