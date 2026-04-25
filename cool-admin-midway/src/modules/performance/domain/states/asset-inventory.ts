/**
 * Asset-inventory 聚合状态机主源。
 * 这里只负责声明资产盘点单主链的状态集合、动作和合法流转，不负责资产主状态回写、盘点结果统计、权限范围或数据库更新。
 * 关键依赖是 asset-domain service 的状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是 draft 只允许开始盘点，counting 完成后才能进入 closed，closed 不能再回到 counting/completed。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const ASSET_INVENTORY_STATE_MACHINE: PerformanceStateMachineDefinition =
  {
    aggregate: 'asset-inventory',
    version: 'phase1-v1',
    statuses: ['draft', 'counting', 'completed', 'closed'],
    actions: ['start', 'complete', 'close'],
    transitions: [
      {
        from: 'draft',
        action: 'start',
        to: 'counting',
      },
      {
        from: 'counting',
        action: 'complete',
        to: 'completed',
      },
      {
        from: 'completed',
        action: 'close',
        to: 'closed',
      },
    ],
  };
