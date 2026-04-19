/**
 * Theme22 行政协同共享服务兼容入口。
 * 这里只把历史的 officeCollab 调用名桥接到新的共享记录域服务，避免并行开发期间出现双实现漂移。
 * 维护重点是所有真实业务逻辑只保留在 office-collab-record.ts，兼容层只做方法名和属性名转发。
 */
import { Provide, Scope, ScopeEnum } from '@midwayjs/core';
import {
  OfficeCollabModuleKey,
  PerformanceOfficeCollabRecordService,
} from './office-collab-record';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceOfficeCollabService extends PerformanceOfficeCollabRecordService {
  get performanceOfficeCollabEntity() {
    return this.performanceOfficeCollabRecordEntity as any;
  }

  set performanceOfficeCollabEntity(value: any) {
    this.performanceOfficeCollabRecordEntity = value;
  }

  async page(moduleKey: OfficeCollabModuleKey, query: any) {
    return this.pageByModule(moduleKey, query);
  }

  async info(moduleKeyOrId: any, id?: any) {
    if (typeof moduleKeyOrId === 'string' && id !== undefined) {
      return this.infoByModule(moduleKeyOrId as OfficeCollabModuleKey, Number(id));
    }
    return super.info(moduleKeyOrId, id);
  }

  async stats(moduleKey: OfficeCollabModuleKey, query: any) {
    return this.statsByModule(moduleKey, query);
  }

  async add(moduleKeyOrPayload: any, payload?: any) {
    if (typeof moduleKeyOrPayload === 'string' && payload !== undefined) {
      return this.addByModule(moduleKeyOrPayload as OfficeCollabModuleKey, payload);
    }
    return super.add(moduleKeyOrPayload);
  }

  async updateRecord(moduleKey: OfficeCollabModuleKey, payload: any) {
    return this.updateByModule(moduleKey, payload);
  }

  async delete(moduleKeyOrIds: any, ids?: any) {
    if (typeof moduleKeyOrIds === 'string' && ids !== undefined) {
      return this.deleteByModule(moduleKeyOrIds as OfficeCollabModuleKey, ids);
    }
    return super.delete(moduleKeyOrIds);
  }
}
