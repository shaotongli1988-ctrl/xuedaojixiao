import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceContractService } from '../../service/contract';

/**
 * 合同台账控制器。
 * 这里只暴露主题10首批冻结的合同标准 CRUD，不处理电子签、审批流或归档下载。
 */
@Provide()
@CoolController()
export class AdminPerformanceContractController extends BaseController {
  @Inject()
  performanceContractService: PerformanceContractService;

  @Post('/page', { summary: '合同分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceContractService.page(query));
  }

  @Get('/info', { summary: '合同详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceContractService.info(Number(id)));
  }

  @Post('/add', { summary: '新增合同' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceContractService.add(payload));
  }

  @Post('/update', { summary: '修改合同' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceContractService.updateContract(payload));
  }

  @Post('/delete', { summary: '删除合同' })
  async deleteItems(@Body('ids') ids: number[]) {
    await this.performanceContractService.delete(ids || []);
    return this.ok();
  }
}
