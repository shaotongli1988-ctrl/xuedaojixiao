/**
 * Asset-procurement 聚合状态机主源。
 * 这里只负责声明采购入库单主链的状态集合、动作和合法流转，不负责入库台账生成、供应商校验、权限范围或数据库更新。
 * 关键依赖是 asset-domain service 的状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是 draft 只允许提交或取消，received 不允许回退，且 cancel 只能停留在草稿/已提交两段主链内。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const ASSET_PROCUREMENT_STATE_MACHINE: PerformanceStateMachineDefinition =
  {
    aggregate: 'asset-procurement',
    version: 'phase1-v1',
    statuses: ['draft', 'submitted', 'received', 'cancelled'],
    actions: ['submit', 'receive', 'cancel'],
    transitions: [
      {
        from: 'draft',
        action: 'submit',
        to: 'submitted',
      },
      {
        from: 'submitted',
        action: 'receive',
        to: 'received',
      },
      {
        from: 'draft',
        action: 'cancel',
        to: 'cancelled',
      },
      {
        from: 'submitted',
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
