/**
 * 车辆管理台账控制器。
 * 这里只暴露 vehicle 的页面语义层路由，不承载底层权限、校验和统计实现。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceVehicleService } from '../../service/vehicle';

@Provide()
@CoolController('/admin/performance/vehicle')
export class AdminPerformanceVehicleController extends BaseController {
  @Inject()
  performanceVehicleService: PerformanceVehicleService;

  @Post('/page', { summary: '车辆管理分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceVehicleService.page(query));
  }

  @Get('/info', { summary: '车辆管理详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceVehicleService.info(Number(id)));
  }

  @Get('/stats', { summary: '车辆管理统计' })
  async statsSummary(@Query(ALL) query: any) {
    return this.ok(await this.performanceVehicleService.stats(query));
  }

  @Post('/add', { summary: '新增车辆' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceVehicleService.add(payload));
  }

  @Post('/update', { summary: '更新车辆' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceVehicleService.updateVehicle(payload));
  }

  @Post('/delete', { summary: '删除车辆' })
  async deleteItem(@Body('ids') ids: number[]) {
    await this.performanceVehicleService.delete(ids || []);
    return this.ok();
  }
}
