import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { PerformanceTeacherChannelCoreService } from './teacher-channel-core';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherAttributionConflictService {
  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  page(query: any) {
    return this.performanceTeacherChannelCoreService.teacherAttributionConflictPage(query);
  }

  info(id: number) {
    return this.performanceTeacherChannelCoreService.teacherAttributionConflictInfo(id);
  }

  create(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAttributionConflictCreate(payload);
  }

  resolve(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAttributionConflictResolve(payload);
  }
}
