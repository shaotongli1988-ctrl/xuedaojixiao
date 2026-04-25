/**
 * 年检材料控制器。
 * 这里只暴露年检材料页面语义层接口，不承载共享校验、权限和文件关系逻辑。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceOfficeCollabRecordService } from '../../service/office-collab-record';

@Provide()
@CoolController('/admin/performance/annualInspection')
export class AdminPerformanceAnnualInspectionController extends BaseController {
  @Inject()
  performanceOfficeCollabRecordService: PerformanceOfficeCollabRecordService;

  @Post('/page', { summary: '年检材料分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.pageByModule(
        'annualInspection',
        query
      )
    );
  }

  @Get('/info', { summary: '年检材料详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.infoByModule(
        'annualInspection',
        Number(id)
      )
    );
  }

  @Get('/stats', { summary: '年检材料统计' })
  async statsSummary(@Query(ALL) query: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.statsByModule(
        'annualInspection',
        query
      )
    );
  }

  @Post('/add', { summary: '新增年检材料' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.addByModule(
        'annualInspection',
        payload
      )
    );
  }

  @Post('/update', { summary: '更新年检材料' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceOfficeCollabRecordService.updateByModule(
        'annualInspection',
        payload
      )
    );
  }

  @Post('/delete', { summary: '删除年检材料' })
  async deleteItem(@Body('ids') ids: number[]) {
    await this.performanceOfficeCollabRecordService.deleteByModule(
      'annualInspection',
      ids || []
    );
    return this.ok();
  }
}
