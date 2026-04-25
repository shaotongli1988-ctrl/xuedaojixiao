/**
 * Purchase-order 聚合状态机主源。
 * 这里只负责声明采购订单主链的状态集合、动作和合法流转，不负责部门树范围、审批日志写入、收货数量校验或数据库更新。
 * 关键依赖是 purchase-order service 的状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是状态值必须与 purchase-order-dict/purchase-order service 一致，且 receive 允许 approved/received 两个状态进入 received。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const PURCHASE_ORDER_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'purchase-order',
  version: 'phase1-v1',
  statuses: [
    'draft',
    'inquiring',
    'pendingApproval',
    'approved',
    'received',
    'closed',
    'cancelled',
  ],
  actions: [
    'submitInquiry',
    'submitApproval',
    'approve',
    'reject',
    'receive',
    'close',
  ],
  transitions: [
    {
      from: 'draft',
      action: 'submitInquiry',
      to: 'inquiring',
    },
    {
      from: 'inquiring',
      action: 'submitApproval',
      to: 'pendingApproval',
    },
    {
      from: 'pendingApproval',
      action: 'approve',
      to: 'approved',
    },
    {
      from: 'pendingApproval',
      action: 'reject',
      to: 'draft',
    },
    {
      from: 'approved',
      action: 'receive',
      to: 'received',
    },
    {
      from: 'received',
      action: 'receive',
      to: 'received',
    },
    {
      from: 'approved',
      action: 'close',
      to: 'closed',
    },
    {
      from: 'received',
      action: 'close',
      to: 'closed',
    },
  ],
};
