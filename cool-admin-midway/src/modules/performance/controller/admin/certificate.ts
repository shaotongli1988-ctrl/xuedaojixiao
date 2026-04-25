import { ALL, Body, Get, Inject, Post, Provide, Query } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { PerformanceCertificateService } from '../../service/certificate';

/**
 * 证书台账控制器。
 * 这里只暴露主题13冻结的证书台账、发放和记录摘要接口，不负责自动发证或课程结业联动。
 */
@Provide()
@CoolController()
export class AdminPerformanceCertificateController extends BaseController {
  @Inject()
  performanceCertificateService: PerformanceCertificateService;

  @Post('/page', { summary: '证书分页' })
  async pageList(@Body(ALL) query: any) {
    return this.ok(await this.performanceCertificateService.page(query));
  }

  @Get('/info', { summary: '证书详情' })
  async infoDetail(@Query('id') id: number) {
    return this.ok(await this.performanceCertificateService.info(Number(id)));
  }

  @Post('/add', { summary: '新增证书' })
  async createItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceCertificateService.add(payload));
  }

  @Post('/update', { summary: '修改证书' })
  async updateItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceCertificateService.updateCertificate(payload));
  }

  @Post('/issue', { summary: '发放证书' })
  async issueItem(@Body(ALL) payload: any) {
    return this.ok(await this.performanceCertificateService.issue(payload));
  }

  @Post('/recordPage', { summary: '证书发放记录分页' })
  async recordPage(@Body(ALL) query: any) {
    return this.ok(await this.performanceCertificateService.recordPage(query));
  }
}
