import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceMaterialDomainService } from '../../service/material-domain';

/**
 * 物资出库控制器。
 * 这里只暴露一期冻结的 page/info/add/update/submit/issue/cancel 接口，不承担审批编排能力。
 */
@Provide()
@CoolController('/admin/performance/materialIssue')
export class AdminPerformanceMaterialIssueController extends BaseController {
  @Inject()
  performanceMaterialDomainService: PerformanceMaterialDomainService;

  @Post('/page', { summary: '物资出库分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceMaterialDomainService.materialIssuePage(query));
  }

  @Get('/info', { summary: '物资出库详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceMaterialDomainService.materialIssueInfo(Number(id)));
  }

  @Post('/add', { summary: '新增物资出库单' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialIssueAdd(payload));
  }

  @Post('/update', { summary: '编辑物资出库单' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialIssueUpdate(payload));
  }

  @Post('/submit', { summary: '提交物资出库单' })
  async submit(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialIssueSubmit(payload));
  }

  @Post('/issue', { summary: '确认物资出库' })
  async issue(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialIssueIssue(payload));
  }

  @Post('/cancel', { summary: '取消物资出库单' })
  async cancel(@Body(ALL) payload: any) {
    return this.ok(await this.performanceMaterialDomainService.materialIssueCancel(payload));
  }
}
