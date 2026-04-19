import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { PerformanceTeacherChannelCoreService } from './teacher-channel-core';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherInfoService {
  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  page(query: any) {
    return this.performanceTeacherChannelCoreService.teacherInfoPage(query);
  }

  info(id: number) {
    return this.performanceTeacherChannelCoreService.teacherInfoInfo(id);
  }

  add(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherInfoAdd(payload);
  }

  update(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherInfoUpdate(payload);
  }

  assign(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherInfoAssign(payload);
  }

  updateStatus(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherInfoUpdateStatus(payload);
  }
}
