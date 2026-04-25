/**
 * Goal 聚合状态机主源。
 * 这里只负责声明目标主链的状态集合、动作和合法流转，不负责进度数值校验、数据范围或权限作用域解析。
 * 关键依赖是 goal-helper 的状态演算规则、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是状态值必须与 goal-dict/goal-helper 一致，且 completed/cancelled 终态不能被第二套局部流转定义回退。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const GOAL_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'goal',
  version: 'phase1-v1',
  statuses: ['draft', 'in-progress', 'completed', 'cancelled'],
  actions: ['saveDraft', 'startProgress', 'complete', 'cancel'],
  transitions: [
    {
      from: 'draft',
      action: 'saveDraft',
      to: 'draft',
      actors: ['org.line_manager', 'org.hrbp'],
    },
    {
      from: 'draft',
      action: 'startProgress',
      to: 'in-progress',
      actors: ['org.employee', 'org.line_manager', 'org.hrbp'],
    },
    {
      from: 'draft',
      action: 'complete',
      to: 'completed',
      actors: ['org.employee', 'org.line_manager', 'org.hrbp'],
    },
    {
      from: 'draft',
      action: 'cancel',
      to: 'cancelled',
      actors: ['org.line_manager', 'org.hrbp'],
    },
    {
      from: 'in-progress',
      action: 'startProgress',
      to: 'in-progress',
      actors: ['org.employee', 'org.line_manager', 'org.hrbp'],
    },
    {
      from: 'in-progress',
      action: 'complete',
      to: 'completed',
      actors: ['org.employee', 'org.line_manager', 'org.hrbp'],
    },
    {
      from: 'in-progress',
      action: 'cancel',
      to: 'cancelled',
      actors: ['org.line_manager', 'org.hrbp'],
    },
  ],
};
