/**
 * 文件职责：暴露薪资分页、详情、维护、确认、归档和调整记录接口。
 * 不负责共享鉴权配置和其他绩效子模块路由。
 * 维护重点：接口集合必须与 API 事实源保持一致，且不开放导出。
 */
import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceSalaryService } from '../../service/salary';

/**
 * 薪资管理控制器。
 * 这里只暴露模块 8 首期需要的薪资接口，不开放导出。
 */
@Provide()
@CoolController()
export class AdminPerformanceSalaryController extends BaseController {
  @Inject()
  performanceSalaryService: PerformanceSalaryService;

  @Post('/page', { summary: '薪资分页' })
  async pageList(@Body(ALL) query: any) {
    await this.performanceSalaryService.initSalaryScope();
    return this.ok(await this.performanceSalaryService.page(query));
  }

  @Get('/info', { summary: '薪资详情' })
  async infoDetail(@Query('id') id: number) {
    await this.performanceSalaryService.initSalaryScope();
    return this.ok(await this.performanceSalaryService.info(Number(id)));
  }

  @Post('/add', { summary: '新增薪资' })
  async createItem(@Body(ALL) payload: any) {
    await this.performanceSalaryService.initSalaryScope();
    return this.ok(await this.performanceSalaryService.add(payload));
  }

  @Post('/update', { summary: '修改薪资' })
  async updateItem(@Body(ALL) payload: any) {
    await this.performanceSalaryService.initSalaryScope();
    return this.ok(await this.performanceSalaryService.updateSalary(payload));
  }

  @Post('/confirm', { summary: '确认薪资' })
  async confirm(@Body(ALL) payload: { id: number }) {
    await this.performanceSalaryService.initSalaryScope();
    return this.ok(await this.performanceSalaryService.confirm(payload));
  }

  @Post('/archive', { summary: '归档薪资' })
  async archive(@Body(ALL) payload: { id: number }) {
    await this.performanceSalaryService.initSalaryScope();
    return this.ok(await this.performanceSalaryService.archive(payload));
  }

  @Post('/changeAdd', { summary: '新增薪资调整记录' })
  async changeAdd(
    @Body(ALL) payload: { salaryId: number; adjustAmount: number; changeReason: string }
  ) {
    await this.performanceSalaryService.initSalaryScope();
    return this.ok(await this.performanceSalaryService.changeAdd(payload));
  }
}
