/**
 * 宣传资料控制器。
 * 这里只暴露宣传资料页面语义层接口，不负责 documentCenter 元数据关系和共享校验细节。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceOfficeCollabRecordService } from '../../service/office-collab-record';

@Provide()
@CoolController('/admin/performance/publicityMaterial')
export class AdminPerformancePublicityMaterialController extends BaseController {
  @Inject()
  performanceOfficeCollabRecordService: PerformanceOfficeCollabRecordService;

  @Post('/page', { summary: '宣传资料分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.pageByModule(
        'publicityMaterial',
        query
      )
    );
  }

  @Get('/info', { summary: '宣传资料详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.infoByModule(
        'publicityMaterial',
        Number(id)
      )
    );
  }

  @Get('/stats', { summary: '宣传资料统计' })
  async statsSummary(@Query(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.statsByModule(
        'publicityMaterial',
        query
      )
    );
  }

  @Post('/add', { summary: '新增宣传资料' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.addByModule(
        'publicityMaterial',
        payload
      )
    );
  }

  @Post('/update', { summary: '更新宣传资料' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.updateByModule(
        'publicityMaterial',
        payload
      )
    );
  }

  @Post('/delete', { summary: '删除宣传资料' })
  async deleteItem(@Body('ids') ids: number[]) {
    await this.performanceOfficeCollabRecordService.deleteByModule(
      'publicityMaterial',
      ids || []
    );
    return this.ok();
  }
}
