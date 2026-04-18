import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceMeetingService } from '../../service/meeting';

/**
 * 会议管理控制器。
 * 这里只暴露会议主链与会议级签到接口，不负责编排前端页面状态或菜单权限导入。
 */
@Provide()
@CoolController()
export class AdminPerformanceMeetingController extends BaseController {
  @Inject()
  performanceMeetingService: PerformanceMeetingService;

  @Post('/page', { summary: '会议分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceMeetingService.page(query));
  }

  @Get('/info', { summary: '会议详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceMeetingService.info(Number(id)));
  }

  @Post('/add', { summary: '新增会议' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMeetingService.add(payload));
  }

  @Post('/update', { summary: '修改会议' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMeetingService.updateMeeting(payload));
  }

  @Post('/delete', { summary: '删除会议' })
  async deleteItems(@Body(ALL) payload: any) {
    await this.performanceMeetingService.delete(this.normalizeIds(payload));
    return this.ok();
  }

  @Post('/checkIn', { summary: '会议签到' })
  async checkIn(@Body('id') id: number) {
    return this.ok(await this.performanceMeetingService.checkIn(Number(id)));
  }

  private normalizeIds(payload: any) {
    if (Array.isArray(payload?.ids)) {
      return payload.ids;
    }

    if (payload?.id !== undefined && payload?.id !== null) {
      return [payload.id];
    }

    return [];
  }
}
