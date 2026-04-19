import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceTalentAssetService } from '../../service/talentAsset';

/**
 * 招聘人才资产控制器。
 * 这里只暴露主题12冻结的摘要主链标准 CRUD，不承担面试转换或招聘后链路编排。
 */
@Provide()
@CoolController('/admin/performance/talentAsset')
export class AdminPerformanceTalentAssetController extends BaseController {
  @Inject()
  performanceTalentAssetService: PerformanceTalentAssetService;

  @Post('/page', { summary: '人才资产分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceTalentAssetService.page(query));
  }

  @Get('/info', { summary: '人才资产详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceTalentAssetService.info(Number(id)));
  }

  @Post('/add', { summary: '新增人才资产' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTalentAssetService.add(payload));
  }

  @Post('/update', { summary: '修改人才资产' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceTalentAssetService.updateTalentAsset(payload));
  }

  @Post('/delete', { summary: '删除人才资产' })
  async deleteItems(@Body(ALL) payload: any) {
    await this.performanceTalentAssetService.delete(this.normalizeIds(payload));
    return this.ok();
  }

  private normalizeIds(payload: any) {
    if (Array.isArray(payload?.ids)) {
      return payload.ids;
    }

    if (payload?.id !== undefined && payload?.id !== null) {
      return [payload.id];
    }

    return [];
  }
}
