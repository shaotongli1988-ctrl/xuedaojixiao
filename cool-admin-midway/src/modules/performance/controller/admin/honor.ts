/**
 * 荣誉管理控制器。
 * 这里只暴露荣誉管理页面语义层接口，不负责共享台账的底层校验和统计实现。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceOfficeCollabRecordService } from '../../service/office-collab-record';

@Provide()
@CoolController('/admin/performance/honor')
export class AdminPerformanceHonorController extends BaseController {
  @Inject()
  performanceOfficeCollabRecordService: PerformanceOfficeCollabRecordService;

  @Post('/page', { summary: '荣誉管理分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.pageByModule('honor', query)
    );
  }

  @Get('/info', { summary: '荣誉管理详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.infoByModule('honor', Number(id))
    );
  }

  @Get('/stats', { summary: '荣誉管理统计' })
  async statsSummary(@Query(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.statsByModule('honor', query)
    );
  }

  @Post('/add', { summary: '新增荣誉记录' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.addByModule('honor', payload)
    );
  }

  @Post('/update', { summary: '更新荣誉记录' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.updateByModule('honor', payload)
    );
  }

  @Post('/delete', { summary: '删除荣誉记录' })
  async deleteItem(@Body('ids') ids: number[]) {
    await this.performanceOfficeCollabRecordService.deleteByModule('honor', ids || []);
    return this.ok();
  }
}
