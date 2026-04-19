import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { PerformanceTeacherChannelCoreService } from './teacher-channel-core';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherDashboardService {
  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  summary() {
    return this.performanceTeacherChannelCoreService.teacherDashboardSummary();
  }
}
