/**
 * 代理体系审计控制器。
 * 这里只暴露主题19 V0.2 冻结的审计只读接口，不允许前端新增、编辑或删除审计数据。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherAgentAuditService } from '../../service/teacher-agent-audit';

@Provide()
@CoolController('/admin/performance/teacherAgentAudit')
export class AdminPerformanceTeacherAgentAuditController extends BaseController {
  @Inject()
  performanceTeacherAgentAuditService: PerformanceTeacherAgentAuditService;

  @Post('/page', { summary: '代理审计分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTeacherAgentAuditService.page(query));
  }

  @Get('/info', { summary: '代理审计详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceTeacherAgentAuditService.info(Number(id)));
  }
}
