/**
 * Asset-disposal 聚合状态机主源。
 * 这里只负责声明资产报废单主链的状态集合、动作和合法流转，不负责资产报废台账回写、审批人执行人写入、权限范围或数据库更新。
 * 关键依赖是 asset-domain service 的状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是 submitted 只能进入 approved 或 cancelled，approved 只能执行成 scrapped 或取消，scrapped 后不得回退。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const ASSET_DISPOSAL_STATE_MACHINE: PerformanceStateMachineDefinition =
  {
    aggregate: 'asset-disposal',
    version: 'phase1-v1',
    statuses: ['draft', 'submitted', 'approved', 'scrapped', 'cancelled'],
    actions: ['submit', 'approve', 'execute', 'cancel'],
    transitions: [
      {
        from: 'draft',
        action: 'submit',
        to: 'submitted',
      },
      {
        from: 'submitted',
        action: 'approve',
        to: 'approved',
      },
      {
        from: 'approved',
        action: 'execute',
        to: 'scrapped',
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
        from: 'approved',
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
