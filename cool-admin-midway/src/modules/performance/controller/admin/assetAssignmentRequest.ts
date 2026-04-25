import { ALL, Body, Get, Inject, Post, Provide } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产领用申请控制器。
 * 这里只暴露 Theme20 L1/L2 申请单的最小接口，不负责真实领用执行记录的归还或丢失处理。
 */
@Provide()
@CoolController('/admin/performance/assetAssignmentRequest')
export class AdminPerformanceAssetAssignmentRequestController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Post('/page', { summary: '领用申请分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetAssignmentRequestPage(query));
  }

  @Get('/info', { summary: '领用申请详情' })
  async info() {
    const id = Number(this.baseCtx?.query?.id);
    return this.ok(
      await this.performanceAssetDomainService.assetAssignmentRequestInfo(id)
    );
  }

  @Post('/add', { summary: '新增领用申请草稿' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceAssetDomainService.assetAssignmentRequestAdd(payload)
    );
  }

  @Post('/update', { summary: '编辑领用申请草稿' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceAssetDomainService.assetAssignmentRequestUpdate(payload)
    );
  }

  @Post('/submit', { summary: '提交领用申请' })
  async submit(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceAssetDomainService.assetAssignmentRequestSubmit(payload)
    );
  }

  @Post('/withdraw', { summary: '撤回领用申请' })
  async withdraw(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceAssetDomainService.assetAssignmentRequestWithdraw(payload)
    );
  }

  @Post('/assign', { summary: '配发资产' })
  async assign(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceAssetDomainService.assetAssignmentRequestAssign(payload)
    );
  }

  @Post('/cancel', { summary: '取消领用申请' })
  async cancel(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceAssetDomainService.assetAssignmentRequestCancel(payload)
    );
  }
}
