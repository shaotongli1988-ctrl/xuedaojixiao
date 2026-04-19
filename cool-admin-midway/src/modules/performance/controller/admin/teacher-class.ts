/**
 * 班主任班级控制器。
 * 这里只暴露主题19冻结的班级分页、详情和最小 CRUD，不处理复杂报表或导入导出。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherClassService } from '../../service/teacher-class';

@Provide()
@CoolController('/admin/performance/teacherClass')
export class AdminPerformanceTeacherClassController extends BaseController {
  @Inject()
  performanceTeacherClassService: PerformanceTeacherClassService;

  @Post('/page', { summary: '班主任班级分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTeacherClassService.page(query));
  }

  @Get('/info', { summary: '班主任班级详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceTeacherClassService.info(Number(id)));
  }

  @Post('/add', { summary: '新增班级' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherClassService.add(payload));
  }

  @Post('/update', { summary: '编辑班级' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherClassService.update(payload));
  }

  @Post('/delete', { summary: '删除班级' })
  async deleteItems(@Body(ALL) payload: any) {
    await this.performanceTeacherClassService.delete(this.normalizeIds(payload));
    return this.ok();
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
