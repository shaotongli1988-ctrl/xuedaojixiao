import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceApprovalFlowService } from '../../service/approval-flow';

/**
 * 自动审批流控制器。
 * 这里只暴露审批配置、实例详情和审批动作接口，不负责 assessment / promotion 的提交流程入口。
 */
@Provide()
@CoolController()
export class AdminPerformanceApprovalFlowController extends BaseController {
  @Inject()
  performanceApprovalFlowService: PerformanceApprovalFlowService;

  @Get('/config/info', { summary: '审批流配置详情' })
  async configInfo(@Query('objectType') objectType: string) {
    return this.ok(await this.performanceApprovalFlowService.configInfo(objectType));
  }

  @Post('/config/save', { summary: '审批流配置保存' })
  async configSave(@Body(ALL) payload: any) {
    return this.ok(await this.performanceApprovalFlowService.configSave(payload));
  }

  @Get('/info', { summary: '审批实例详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceApprovalFlowService.info(Number(id)));
  }

  @Post('/approve', { summary: '审批通过' })
  async approve(@Body(ALL) payload: any) {
    return this.ok(await this.performanceApprovalFlowService.approve(payload));
  }

  @Post('/reject', { summary: '审批驳回' })
  async reject(@Body(ALL) payload: any) {
    return this.ok(await this.performanceApprovalFlowService.reject(payload));
  }

  @Post('/transfer', { summary: '当前节点转办' })
  async transfer(@Body(ALL) payload: any) {
    return this.ok(await this.performanceApprovalFlowService.transfer(payload));
  }

  @Post('/withdraw', { summary: '发起人撤回' })
  async withdraw(@Body(ALL) payload: any) {
    return this.ok(await this.performanceApprovalFlowService.withdraw(payload));
  }

  @Post('/remind', { summary: '催办当前节点' })
  async remind(@Body(ALL) payload: any) {
    return this.ok(await this.performanceApprovalFlowService.remind(payload));
  }

  @Post('/resolve', { summary: 'HR 人工指定或恢复' })
  async resolve(@Body(ALL) payload: any) {
    return this.ok(await this.performanceApprovalFlowService.resolve(payload));
  }

  @Post('/fallback', { summary: '回退到手工审批主链' })
  async fallback(@Body(ALL) payload: any) {
    return this.ok(await this.performanceApprovalFlowService.fallback(payload));
  }

  @Post('/terminate', { summary: 'HR 强制终止' })
  async terminate(@Body(ALL) payload: any) {
    return this.ok(await this.performanceApprovalFlowService.terminate(payload));
  }
}
