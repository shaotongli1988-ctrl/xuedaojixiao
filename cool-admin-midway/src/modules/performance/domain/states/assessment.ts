/**
 * Assessment 聚合状态机主源。
 * 这里只负责声明评估单的状态集合、动作和合法流转，不负责 service 内权限判断和数据范围过滤。
 * 关键依赖是后续 assessment service、状态机守卫和文档同步都要以这里为主源。
 * 维护重点是状态值必须与文档和 OpenAPI 一致，且非法流转不能再由页面自行猜测。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const ASSESSMENT_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'assessment',
  version: 'phase1-v1',
  statuses: ['draft', 'submitted', 'approved', 'rejected'],
  actions: [
    'saveDraft',
    'submit',
    'approve',
    'reject',
    'returnToDraft',
  ],
  transitions: [
    {
      from: 'draft',
      action: 'saveDraft',
      to: 'draft',
      actors: ['org.employee', 'org.line_manager', 'org.hrbp'],
    },
    {
      from: 'draft',
      action: 'submit',
      to: 'submitted',
      actors: ['org.employee'],
    },
    {
      from: 'submitted',
      action: 'approve',
      to: 'approved',
      actors: ['org.line_manager'],
    },
    {
      from: 'submitted',
      action: 'reject',
      to: 'rejected',
      actors: ['org.line_manager'],
    },
    {
      from: 'rejected',
      action: 'returnToDraft',
      to: 'draft',
      actors: ['org.employee'],
    },
  ],
};
