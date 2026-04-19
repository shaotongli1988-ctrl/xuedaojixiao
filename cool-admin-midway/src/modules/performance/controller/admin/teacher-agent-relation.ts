/**
 * 代理上下级关系控制器。
 * 这里只暴露主题19 V0.2 冻结的关系维护接口，不处理结算、经营统计或外部通知。
 */
import { ALL, Body, Inject, Post, Provide } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherAgentRelationService } from '../../service/teacher-agent-relation';

@Provide()
@CoolController('/admin/performance/teacherAgentRelation')
export class AdminPerformanceTeacherAgentRelationController extends BaseController {
  @Inject()
  performanceTeacherAgentRelationService: PerformanceTeacherAgentRelationService;

  @Post('/page', { summary: '代理关系分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTeacherAgentRelationService.page(query));
  }

  @Post('/add', { summary: '新增代理关系' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAgentRelationService.add(payload));
  }

  @Post('/update', { summary: '编辑代理关系' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAgentRelationService.update(payload));
  }

  @Post('/delete', { summary: '删除代理关系' })
  async deleteItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAgentRelationService.delete(payload));
  }
}
