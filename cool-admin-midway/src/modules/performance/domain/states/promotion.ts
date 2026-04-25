/**
 * Promotion 聚合状态机主源。
 * 这里只负责声明晋升单主链的状态集合、动作和合法流转，不负责评审入参校验、数据库写入或审批实例联动。
 * 关键依赖是 promotion-helper 的流转规则、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是状态值必须与 promotion-dict/promotion-helper 一致，且 reviewing 终审后不能再由第二套局部规则回退。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const PROMOTION_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'promotion',
  version: 'phase1-v1',
  statuses: ['draft', 'reviewing', 'approved', 'rejected'],
  actions: ['submit', 'approve', 'reject'],
  transitions: [
    {
      from: 'draft',
      action: 'submit',
      to: 'reviewing',
      actors: ['org.line_manager', 'org.hrbp'],
    },
    {
      from: 'reviewing',
      action: 'approve',
      to: 'approved',
      actors: ['org.line_manager', 'org.hrbp'],
    },
    {
      from: 'reviewing',
      action: 'reject',
      to: 'rejected',
      actors: ['org.line_manager', 'org.hrbp'],
    },
  ],
};
