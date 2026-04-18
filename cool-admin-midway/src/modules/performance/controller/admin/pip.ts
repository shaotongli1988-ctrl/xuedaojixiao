import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformancePipService } from '../../service/pip';

/**
 * PIP 控制器。
 * 这里只暴露模块 6 所需的 PIP 列表、详情和状态动作接口，不负责其他绩效子模块。
 */
@Provide()
@CoolController()
export class AdminPerformancePipController extends BaseController {
  @Inject()
  performancePipService: PerformancePipService;

  @Post('/page', { summary: 'PIP 分页' })
  async pageList(@Body(ALL) query: any) {
    await this.performancePipService.initPipScope();
    return this.ok(await this.performancePipService.page(query));
  }

  @Get('/info', { summary: 'PIP 详情' })
  async infoDetail(@Query('id') id: number) {
    await this.performancePipService.initPipScope();
    return this.ok(await this.performancePipService.info(Number(id)));
  }

  @Post('/add', { summary: '新增 PIP' })
  async createItem(@Body(ALL) payload: any) {
    await this.performancePipService.initPipScope();
    return this.ok(await this.performancePipService.add(payload));
  }

  @Post('/update', { summary: '修改 PIP' })
  async updateItem(@Body(ALL) payload: any) {
    await this.performancePipService.initPipScope();
    return this.ok(await this.performancePipService.updatePip(payload));
  }

  @Post('/start', { summary: '启动 PIP' })
  async start(@Body(ALL) payload: any) {
    await this.performancePipService.initPipScope();
    return this.ok(await this.performancePipService.start(payload));
  }

  @Post('/track', { summary: '提交 PIP 跟进' })
  async track(@Body(ALL) payload: any) {
    await this.performancePipService.initPipScope();
    return this.ok(await this.performancePipService.track(payload));
  }

  @Post('/complete', { summary: '完成 PIP' })
  async complete(@Body(ALL) payload: any) {
    await this.performancePipService.initPipScope();
    return this.ok(await this.performancePipService.complete(payload));
  }

  @Post('/close', { summary: '关闭 PIP' })
  async close(@Body(ALL) payload: any) {
    await this.performancePipService.initPipScope();
    return this.ok(await this.performancePipService.close(payload));
  }

  @Post('/export', { summary: '导出 PIP 摘要' })
  async export(@Body(ALL) query: any) {
    await this.performancePipService.initPipScope();
    return this.ok(await this.performancePipService.export(query));
  }
}
