/**
 * Asset-assignment-request 聚合状态机主源。
 * 这里只负责声明资产领用申请主链的状态集合、动作和合法流转，不负责审批实例编排、正式领用记录落库、资产主状态回写或权限范围。
 * 关键依赖是 asset-domain / approval-flow service 的状态保护、状态机 coverage 守卫和领域注册中心都要以这里为主源。
 * 维护重点是审批结果同步、manualPending 回退和 issuing 短暂中间态必须与运行时保持一致，不能把 issued/cancelled 误回退到草稿链。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const ASSET_ASSIGNMENT_REQUEST_STATE_MACHINE: PerformanceStateMachineDefinition =
  {
    aggregate: 'asset-assignment-request',
    version: 'phase1-v1',
    statuses: [
      'draft',
      'inApproval',
      'rejected',
      'withdrawn',
      'approvedPendingAssignment',
      'issuing',
      'issued',
      'cancelled',
      'manualPending',
    ],
    actions: [
      'submit',
      'approve',
      'reject',
      'withdraw',
      'fallback',
      'assign',
      'cancel',
    ],
    transitions: [
      {
        from: 'draft',
        action: 'submit',
        to: 'inApproval',
      },
      {
        from: 'inApproval',
        action: 'approve',
        to: 'approvedPendingAssignment',
      },
      {
        from: 'inApproval',
        action: 'reject',
        to: 'rejected',
      },
      {
        from: 'inApproval',
        action: 'withdraw',
        to: 'withdrawn',
      },
      {
        from: 'inApproval',
        action: 'fallback',
        to: 'manualPending',
      },
      {
        from: 'approvedPendingAssignment',
        action: 'assign',
        to: 'issuing',
      },
      {
        from: 'issuing',
        action: 'assign',
        to: 'issued',
      },
      {
        from: 'draft',
        action: 'cancel',
        to: 'cancelled',
      },
      {
        from: 'inApproval',
        action: 'cancel',
        to: 'cancelled',
      },
      {
        from: 'manualPending',
        action: 'cancel',
        to: 'cancelled',
      },
      {
        from: 'rejected',
        action: 'cancel',
        to: 'cancelled',
      },
      {
        from: 'withdrawn',
        action: 'cancel',
        to: 'cancelled',
      },
      {
        from: 'approvedPendingAssignment',
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
