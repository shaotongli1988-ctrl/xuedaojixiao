/**
 * 代理主体控制器。
 * 这里只暴露主题19 V0.2 冻结的代理主体最小主链接口，不处理结算、经营报表或合同链路。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTeacherAgentService } from '../../service/teacher-agent';

@Provide()
@CoolController('/admin/performance/teacherAgent')
export class AdminPerformanceTeacherAgentController extends BaseController {
  @Inject()
  performanceTeacherAgentService: PerformanceTeacherAgentService;

  @Post('/page', { summary: '代理主体分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTeacherAgentService.page(query));
  }

  @Get('/info', { summary: '代理主体详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceTeacherAgentService.info(Number(id)));
  }

  @Post('/add', { summary: '新增代理主体' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAgentService.add(payload));
  }

  @Post('/update', { summary: '编辑代理主体' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAgentService.update(payload));
  }

  @Post('/updateStatus', { summary: '更新代理主体状态' })
  async updateStatus(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAgentService.updateStatus(payload));
  }

  @Post('/blacklist', { summary: '拉黑代理主体' })
  async blacklist(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAgentService.blacklist(payload));
  }

  @Post('/unblacklist', { summary: '移出代理主体黑名单' })
  async unblacklist(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTeacherAgentService.unblacklist(payload));
  }
}
