/**
 * Asset-maintenance 聚合状态机主源。
 * 这里只负责声明资产维护记录主链的状态集合、动作和合法流转，不负责资产主状态回写、维护结果文本、权限范围或数据库更新。
 * 关键依赖是 asset-domain service 的状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是当前 runtime 只显式暴露 scheduled -> completed/cancelled，两条终态链都不能回退。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const ASSET_MAINTENANCE_STATE_MACHINE: PerformanceStateMachineDefinition =
  {
    aggregate: 'asset-maintenance',
    version: 'phase1-v1',
    statuses: ['scheduled', 'inProgress', 'completed', 'cancelled'],
    actions: ['complete', 'cancel'],
    transitions: [
      {
        from: 'scheduled',
        action: 'complete',
        to: 'completed',
      },
      {
        from: 'inProgress',
        action: 'complete',
        to: 'completed',
      },
      {
        from: 'scheduled',
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
