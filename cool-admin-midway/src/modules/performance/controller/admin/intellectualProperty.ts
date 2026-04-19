/**
 * 知识产权台账控制器。
 * 这里只暴露 intellectualProperty 的页面语义层路由，不承载底层权限、校验和统计实现。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceIntellectualPropertyService } from '../../service/intellectualProperty';

@Provide()
@CoolController('/admin/performance/intellectualProperty')
export class AdminPerformanceIntellectualPropertyController extends BaseController {
  @Inject()
  performanceIntellectualPropertyService: PerformanceIntellectualPropertyService;

  @Post('/page', { summary: '知识产权分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceIntellectualPropertyService.page(query));
  }

  @Get('/info', { summary: '知识产权详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceIntellectualPropertyService.info(Number(id)));
  }

  @Get('/stats', { summary: '知识产权统计' })
  async statsSummary(@Query(ALL) query: any) {
    return this.ok(await this.performanceIntellectualPropertyService.stats(query));
  }

  @Post('/add', { summary: '新增知识产权' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceIntellectualPropertyService.add(payload));
  }

  @Post('/update', { summary: '更新知识产权' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceIntellectualPropertyService.updateProperty(payload)
    );
  }

  @Post('/delete', { summary: '删除知识产权' })
  async deleteItem(@Body('ids') ids: number[]) {
    await this.performanceIntellectualPropertyService.delete(ids || []);
    return this.ok();
  }
}
