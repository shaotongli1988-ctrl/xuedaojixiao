import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { PerformanceTeacherChannelCoreService } from './teacher-channel-core';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherTodoService {
  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  page(query: any) {
    return this.performanceTeacherChannelCoreService.teacherTodoPage(query);
  }
}
