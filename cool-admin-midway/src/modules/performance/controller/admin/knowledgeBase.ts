import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceKnowledgeBaseService } from '../../service/knowledgeBase';

/**
 * 知识库控制器。
 * 这里只暴露主题21冻结的知识条目、图谱、搜索和百问百答元数据接口，不处理正文编辑和 AI 推理。
 */
@Provide()
@CoolController()
export class AdminPerformanceKnowledgeBaseController extends BaseController {
  @Inject()
  performanceKnowledgeBaseService: PerformanceKnowledgeBaseService;

  @Post('/page', { summary: '知识库分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceKnowledgeBaseService.page(query));
  }

  @Get('/stats', { summary: '知识库统计' })
  async statsSummary(@Query(ALL) query: any) {
    return this.ok(await this.performanceKnowledgeBaseService.stats(query));
  }

  @Post('/add', { summary: '新增知识条目' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceKnowledgeBaseService.add(payload));
  }

  @Post('/update', { summary: '更新知识条目' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceKnowledgeBaseService.updateKnowledge(payload));
  }

  @Post('/delete', { summary: '删除知识条目' })
  async deleteItems(@Body('ids') ids: number[]) {
    await this.performanceKnowledgeBaseService.delete(ids || []);
    return this.ok();
  }

  @Get('/graph', { summary: '知识图谱' })
  async graphData() {
    return this.ok(await this.performanceKnowledgeBaseService.graph());
  }

  @Get('/search', { summary: '知识搜索' })
  async searchResult(@Query('keyword') keyword: string) {
    return this.ok(await this.performanceKnowledgeBaseService.search(keyword));
  }

  @Get('/qaList', { summary: '百问百答列表' })
  async qaList(@Query('keyword') keyword: string) {
    return this.ok(await this.performanceKnowledgeBaseService.qaList(keyword));
  }

  @Post('/qaAdd', { summary: '新增百问百答' })
  async qaAdd(@Body(ALL) payload: any) {
    return this.ok(await this.performanceKnowledgeBaseService.qaAdd(payload));
  }
}
