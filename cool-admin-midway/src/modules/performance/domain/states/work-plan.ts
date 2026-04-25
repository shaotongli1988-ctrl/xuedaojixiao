/**
 * Work-plan 聚合状态机主源。
 * 这里只负责声明工作计划主链的状态集合、动作和合法流转，不负责部门范围、参与人可执行判定、来源审批字段映射或数据库更新。
 * 关键依赖是 workPlan service 的状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是执行状态必须与 work-plan-dict/workPlan service 一致，且来源审批同步只能把 draft 推进到 planned 或 cancelled，不能越过 completed。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const WORK_PLAN_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'work-plan',
  version: 'phase1-v1',
  statuses: ['draft', 'planned', 'inProgress', 'completed', 'cancelled'],
  actions: ['syncApproved', 'syncRejected', 'start', 'complete', 'cancel'],
  transitions: [
    {
      from: 'draft',
      action: 'syncApproved',
      to: 'planned',
    },
    {
      from: 'draft',
      action: 'syncRejected',
      to: 'cancelled',
    },
    {
      from: 'planned',
      action: 'syncRejected',
      to: 'cancelled',
    },
    {
      from: 'draft',
      action: 'start',
      to: 'inProgress',
    },
    {
      from: 'planned',
      action: 'start',
      to: 'inProgress',
    },
    {
      from: 'inProgress',
      action: 'complete',
      to: 'completed',
    },
    {
      from: 'draft',
      action: 'cancel',
      to: 'cancelled',
    },
    {
      from: 'planned',
      action: 'cancel',
      to: 'cancelled',
    },
    {
      from: 'inProgress',
      action: 'cancel',
      to: 'cancelled',
    },
    {
      from: 'cancelled',
      action: 'cancel',
      to: 'cancelled',
    },
  ],
};
