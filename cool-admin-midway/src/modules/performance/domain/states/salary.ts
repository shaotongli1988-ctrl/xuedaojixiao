/**
 * Salary 聚合状态机主源。
 * 这里只负责声明薪资主链的状态集合、动作和合法流转，不负责金额计算、调整记录持久化、权限范围或数据库更新。
 * 关键依赖是 salary service 的状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是状态值必须与 salary-dict/salary service 一致，且 changeAdd 只能在 confirmed 内保持同态调整，不能越过 archived。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const SALARY_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'salary',
  version: 'phase1-v1',
  statuses: ['draft', 'confirmed', 'archived'],
  actions: ['confirm', 'archive', 'changeAdd'],
  transitions: [
    {
      from: 'draft',
      action: 'confirm',
      to: 'confirmed',
    },
    {
      from: 'confirmed',
      action: 'archive',
      to: 'archived',
    },
    {
      from: 'confirmed',
      action: 'changeAdd',
      to: 'confirmed',
    },
  ],
};
