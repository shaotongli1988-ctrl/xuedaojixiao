import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { PerformanceTeacherChannelCoreService } from './teacher-channel-core';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherAttributionService {
  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  page(query: any) {
    return this.performanceTeacherChannelCoreService.teacherAttributionPage(query);
  }

  info(id: number) {
    return this.performanceTeacherChannelCoreService.teacherAttributionInfo(id);
  }

  assign(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAttributionAssign(payload);
  }

  change(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAttributionChange(payload);
  }

  remove(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAttributionRemove(payload);
  }
}
