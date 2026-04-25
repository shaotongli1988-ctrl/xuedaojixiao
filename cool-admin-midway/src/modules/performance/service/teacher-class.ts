import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { PerformanceTeacherChannelCoreService } from './teacher-channel-core';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherClassService {
  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  page(query: any) {
    return this.performanceTeacherChannelCoreService.teacherClassPage(query);
  }

  info(id: number) {
    return this.performanceTeacherChannelCoreService.teacherClassInfo(id);
  }

  add(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherClassAdd(payload);
  }

  update(payload: any) {
    return this.performanceTeacherChannelCoreService.teacherClassUpdate(payload);
  }

  delete(ids: number[]) {
    return this.performanceTeacherChannelCoreService.teacherClassDelete(ids);
  }
}
