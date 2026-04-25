import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { PerformanceTeacherChannelCoreService } from './teacher-channel-core';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherAgentService {
  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  page(query: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentPage(query);
  }

  info(id: number) {
    return this.performanceTeacherChannelCoreService.teacherAgentInfo(id);
  }

  add(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentAdd(payload);
  }

  update(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentUpdate(payload);
  }

  updateStatus(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentUpdateStatus(payload);
  }

  blacklist(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentBlacklist(payload);
  }

  unblacklist(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherAgentUnblacklist(payload);
  }
}
