import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { PerformanceTeacherChannelCoreService } from './teacher-channel-core';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherAgentAuditService {
  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  page(query: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentAuditPage(query);
  }

  info(id: number) {
    return this.performanceTeacherChannelCoreService.teacherAgentAuditInfo(id);
  }
}
