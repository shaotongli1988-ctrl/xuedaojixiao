import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceAssetDomainService } from '../../service/asset-domain';

/**
 * 资产报废控制器。
 * 这里只暴露主题20冻结的 page/info/add/update/submit/approve/execute/cancel 接口，不负责财务核销或残值处置扩展。
 */
@Provide()
@CoolController('/admin/performance/assetDisposal')
export class AdminPerformanceAssetDisposalController extends BaseController {
  @Inject()
  performanceAssetDomainService: PerformanceAssetDomainService;

  @Post('/page', { summary: '报废单分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceAssetDomainService.assetDisposalPage(query));
  }

  @Get('/info', { summary: '报废单详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceAssetDomainService.assetDisposalInfo(Number(id)));
  }

  @Post('/add', { summary: '新增报废单' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetDisposalAdd(payload));
  }

  @Post('/update', { summary: '编辑报废单' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetDisposalUpdate(payload));
  }

  @Post('/submit', { summary: '提交报废单' })
  async submit(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetDisposalSubmit(payload));
  }

  @Post('/approve', { summary: '审批报废单' })
  async approve(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetDisposalApprove(payload));
  }

  @Post('/execute', { summary: '执行报废' })
  async execute(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetDisposalExecute(payload));
  }

  @Post('/cancel', { summary: '取消报废单' })
  async cancel(@Body(ALL) payload: any) {
    return this.ok(await this.performanceAssetDomainService.assetDisposalCancel(payload));
  }
}
