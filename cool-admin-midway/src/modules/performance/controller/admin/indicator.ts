import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceIndicatorService } from '../../service/indicator';

/**
 * 指标库控制器。
 * 这里只暴露模块 4 所需的标准 CRUD 接口，不处理共享鉴权或跨模块聚合逻辑。
 */
@Provide()
@CoolController()
export class AdminPerformanceIndicatorController extends BaseController {
  @Inject()
  performanceIndicatorService: PerformanceIndicatorService;

  @Post('/page', { summary: '指标分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceIndicatorService.page(query));
  }

  @Get('/info', { summary: '指标详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceIndicatorService.info(Number(id)));
  }

  @Post('/add', { summary: '新增指标' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceIndicatorService.add(payload));
  }

  @Post('/update', { summary: '修改指标' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceIndicatorService.updateIndicator(payload));
  }

  @Post('/delete', { summary: '删除指标' })
  async deleteItems(@Body('ids') ids: number[]) {
    await this.performanceIndicatorService.delete(ids || []);
    return this.ok();
  }
}
