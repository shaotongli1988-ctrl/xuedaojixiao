/**
 * 快递协同控制器。
 * 这里只暴露快递协同页面语义层接口，不负责真实快递系统集成、签收流或结算动作。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceOfficeCollabRecordService } from '../../service/office-collab-record';

@Provide()
@CoolController('/admin/performance/expressCollab')
export class AdminPerformanceExpressCollabController extends BaseController {
  @Inject()
  performanceOfficeCollabRecordService: PerformanceOfficeCollabRecordService;

  @Post('/page', { summary: '快递协同分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.pageByModule(
        'expressCollab',
        query
      )
    );
  }

  @Get('/info', { summary: '快递协同详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.infoByModule(
        'expressCollab',
        Number(id)
      )
    );
  }

  @Get('/stats', { summary: '快递协同统计' })
  async statsSummary(@Query(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.statsByModule(
        'expressCollab',
        query
      )
    );
  }

  @Post('/add', { summary: '新增快递协同记录' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.addByModule(
        'expressCollab',
        payload
      )
    );
  }

  @Post('/update', { summary: '更新快递协同记录' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.updateByModule(
        'expressCollab',
        payload
      )
    );
  }

  @Post('/delete', { summary: '删除快递协同记录' })
  async deleteItem(@Body('ids') ids: number[]) {
    await this.performanceOfficeCollabRecordService.deleteByModule(
      'expressCollab',
      ids || []
    );
    return this.ok();
  }
}
