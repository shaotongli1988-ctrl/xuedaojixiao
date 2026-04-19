import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceHiringService } from '../../service/hiring';

/**
 * 录用管理控制器。
 * 这里只暴露主题18冻结的 page/info/add/updateStatus/close 五个动作，不承担删除导出或跨主题联动。
 */
@Provide()
@CoolController('/admin/performance/hiring')
export class AdminPerformanceHiringController extends BaseController {
  @Inject()
  performanceHiringService: PerformanceHiringService;

  @Post('/page', { summary: '录用分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceHiringService.page(query));
  }

  @Get('/info', { summary: '录用详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceHiringService.info(Number(id)));
  }

  @Post('/add', { summary: '新增录用' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceHiringService.add(payload));
  }

  @Post('/updateStatus', { summary: '更新录用状态' })
  async updateStatus(@Body(ALL) payload: any) {
    return this.ok(await this.performanceHiringService.updateStatus(payload));
  }

  @Post('/close', { summary: '关闭录用' })
  async closeItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceHiringService.close(payload));
  }
}
