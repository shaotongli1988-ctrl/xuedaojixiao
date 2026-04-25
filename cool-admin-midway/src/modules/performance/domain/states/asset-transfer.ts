/**
 * Asset-transfer 聚合状态机主源。
 * 这里只负责声明资产调拨单主链的状态集合、动作和合法流转，不负责资产部门归属回写、位置变更、权限范围或数据库更新。
 * 关键依赖是 asset-domain service 的状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是调拨提交流程会直接写入 inTransit，取消只允许停留在 draft/inTransit 主链内，completed 不能回退。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const ASSET_TRANSFER_STATE_MACHINE: PerformanceStateMachineDefinition =
  {
    aggregate: 'asset-transfer',
    version: 'phase1-v1',
    statuses: ['draft', 'inTransit', 'completed', 'cancelled'],
    actions: ['submit', 'complete', 'cancel'],
    transitions: [
      {
        from: 'draft',
        action: 'submit',
        to: 'inTransit',
      },
      {
        from: 'inTransit',
        action: 'complete',
        to: 'completed',
      },
      {
        from: 'draft',
        action: 'cancel',
        to: 'cancelled',
      },
      {
        from: 'inTransit',
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
