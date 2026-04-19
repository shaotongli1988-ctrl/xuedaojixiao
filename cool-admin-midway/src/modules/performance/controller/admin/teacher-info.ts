/**
 * 班主任资源控制器。
 * 这里只暴露主题19冻结的资源录入、分配和合作状态更新接口，不处理前端菜单或非主链扩展动作。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherInfoService } from '../../service/teacher-info';

@Provide()
@CoolController('/admin/performance/teacherInfo')
export class AdminPerformanceTeacherInfoController extends BaseController {
  @Inject()
  performanceTeacherInfoService: PerformanceTeacherInfoService;

  @Post('/page', { summary: '班主任资源分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTeacherInfoService.page(query));
  }

  @Get('/info', { summary: '班主任资源详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceTeacherInfoService.info(Number(id)));
  }

  @Post('/add', { summary: '新增班主任资源' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherInfoService.add(payload));
  }

  @Post('/update', { summary: '编辑班主任资源' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherInfoService.update(payload));
  }

  @Post('/assign', { summary: '分配班主任资源' })
  async assignItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherInfoService.assign(payload));
  }

  @Post('/updateStatus', { summary: '更新班主任合作状态' })
  async updateStatus(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherInfoService.updateStatus(payload));
  }

  @Get('/attributionInfo', { summary: '班主任当前归因信息' })
  async attributionInfo(@Query('id') id: number) {
    return this.ok(
      await this.performanceTeacherInfoService.attributionInfo(Number(id))
    );
  }

  @Get('/attributionHistory', { summary: '班主任归因历史' })
  async attributionHistory(@Query('id') id: number) {
    return this.ok(
      await this.performanceTeacherInfoService.attributionHistory(Number(id))
    );
  }
}
