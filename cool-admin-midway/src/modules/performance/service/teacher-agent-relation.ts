import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { PerformanceTeacherChannelCoreService } from './teacher-channel-core';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherAgentRelationService {
  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  page(query: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentRelationPage(query);
  }

  add(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentRelationAdd(payload);
  }

  update(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentRelationUpdate(payload);
  }

  delete(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentRelationDelete(payload);
  }
}
