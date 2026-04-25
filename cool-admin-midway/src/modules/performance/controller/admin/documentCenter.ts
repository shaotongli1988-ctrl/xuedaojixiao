import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceDocumentCenterService } from '../../service/documentCenter';

/**
 * 文件管理控制器。
 * 这里只暴露主题21冻结的文件元数据主链接口，不处理真实上传、目录树或权限继承。
 */
@Provide()
@CoolController()
export class AdminPerformanceDocumentCenterController extends BaseController {
  @Inject()
  performanceDocumentCenterService: PerformanceDocumentCenterService;

  @Post('/page', { summary: '文件管理分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceDocumentCenterService.page(query));
  }

  @Get('/info', { summary: '文件管理详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceDocumentCenterService.info(Number(id)));
  }

  @Get('/stats', { summary: '文件管理统计' })
  async statsSummary(@Query(ALL) query: any) {
    return this.ok(await this.performanceDocumentCenterService.stats(query));
  }

  @Post('/add', { summary: '新增文件元数据' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceDocumentCenterService.add(payload));
  }

  @Post('/update', { summary: '更新文件元数据' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceDocumentCenterService.updateDocument(payload));
  }

  @Post('/delete', { summary: '删除文件元数据' })
  async deleteItems(@Body('ids') ids: number[]) {
    await this.performanceDocumentCenterService.delete(ids || []);
    return this.ok();
  }
}
