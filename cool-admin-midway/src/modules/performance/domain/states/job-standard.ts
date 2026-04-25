/**
 * Job Standard 聚合状态机主源。
 * 这里只负责声明职位标准主链的状态集合、动作和合法流转，不负责部门树范围、只读权限或页面按钮显隐。
 * 关键依赖是 job-standard service、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是状态值与主题17冻结契约保持一致，且非 draft 编辑限制不能被第二套局部常量重新定义。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const JOB_STANDARD_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'job-standard',
  version: 'phase1-v1',
  statuses: ['draft', 'active', 'inactive'],
  actions: ['saveDraft', 'activate', 'deactivate', 'reactivate'],
  transitions: [
    {
      from: 'draft',
      action: 'saveDraft',
      to: 'draft',
      actors: ['org.hrbp'],
    },
    {
      from: 'draft',
      action: 'activate',
      to: 'active',
      actors: ['org.hrbp'],
    },
    {
      from: 'active',
      action: 'deactivate',
      to: 'inactive',
      actors: ['org.hrbp'],
    },
    {
      from: 'inactive',
      action: 'reactivate',
      to: 'active',
      actors: ['org.hrbp'],
    },
  ],
};
