import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceJobStandardService } from '../../service/job-standard';

/**
 * 职位标准控制器。
 * 这里只暴露主题17冻结的后端主链动作，不承担招聘计划、简历池、面试、录用或运行态初始化逻辑。
 */
@Provide()
@CoolController('/admin/performance/jobStandard')
export class AdminPerformanceJobStandardController extends BaseController {
  @Inject()
  performanceJobStandardService: PerformanceJobStandardService;

  @Post('/page', { summary: '职位标准分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceJobStandardService.page(query));
  }

  @Get('/info', { summary: '职位标准详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceJobStandardService.info(Number(id)));
  }

  @Post('/add', { summary: '新增职位标准' })
  async addItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceJobStandardService.add(payload));
  }

  @Post('/update', { summary: '修改职位标准' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(
      await this.performanceJobStandardService.updateJobStandard(payload)
    );
  }

  @Post('/setStatus', { summary: '更新职位标准状态' })
  async setStatus(@Body(ALL) payload: any) {
    return this.ok(await this.performanceJobStandardService.setStatus(payload));
  }
}
