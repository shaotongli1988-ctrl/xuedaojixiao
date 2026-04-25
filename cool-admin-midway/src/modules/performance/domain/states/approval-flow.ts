/**
 * Approval Flow 聚合状态机主源。
 * 这里只负责声明审批实例的核心状态和值，不负责审批节点解析、转交实现或对象级权限判断。
 * 关键依赖是 approval-flow service、角色能力判定和后续 OpenAPI/文档同步都要从这里读取主状态集合。
 * 维护重点是状态枚举和动作名必须稳定，避免 service 和前端对审批状态出现漂移。
 */

import type { PerformanceStateMachineDefinition } from './types';

export const APPROVAL_FLOW_INSTANCE_STATUSES = [
  'pending_resolution',
  'in_review',
  'manual_pending',
  'approved',
  'rejected',
  'withdrawn',
  'terminated',
] as const;

export const APPROVAL_FLOW_ACTIONS = [
  'launch',
  'approve',
  'reject',
  'transfer',
  'withdraw',
  'remind',
  'resolve',
  'fallback',
  'terminate',
  'timeout',
] as const;

export type ApprovalFlowInstanceStatus =
  (typeof APPROVAL_FLOW_INSTANCE_STATUSES)[number];
export type ApprovalFlowAction = (typeof APPROVAL_FLOW_ACTIONS)[number];

export const APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS = Object.freeze({
  pending_resolution: [
    'withdraw',
    'remind',
    'resolve',
    'fallback',
    'terminate',
  ],
  in_review: [
    'approve',
    'reject',
    'transfer',
    'withdraw',
    'remind',
    'terminate',
    'timeout',
  ],
  manual_pending: ['remind', 'resolve', 'fallback', 'terminate'],
  approved: [],
  rejected: [],
  withdrawn: [],
  terminated: [],
} as const satisfies Readonly<
  Record<ApprovalFlowInstanceStatus, readonly ApprovalFlowAction[]>
>);

export const APPROVAL_FLOW_STATE_MACHINE: PerformanceStateMachineDefinition = {
  aggregate: 'approval-flow',
  version: 'phase1-v1',
  statuses: APPROVAL_FLOW_INSTANCE_STATUSES,
  actions: APPROVAL_FLOW_ACTIONS,
  transitions: [
    {
      from: 'pending_resolution',
      action: 'resolve',
      to: 'in_review',
      actors: ['fn.performance_operator', 'org.hrbp'],
    },
    {
      from: 'pending_resolution',
      action: 'withdraw',
      to: 'withdrawn',
      actors: ['fn.performance_operator', 'org.hrbp'],
    },
    {
      from: 'pending_resolution',
      action: 'fallback',
      to: 'terminated',
      actors: ['org.hrbp'],
    },
    {
      from: 'pending_resolution',
      action: 'terminate',
      to: 'terminated',
      actors: ['org.hrbp'],
    },
    {
      from: 'pending_resolution',
      action: 'remind',
      to: 'pending_resolution',
      actors: ['fn.performance_operator', 'org.hrbp'],
    },
    {
      from: 'in_review',
      action: 'approve',
      to: 'approved',
      actors: ['org.line_manager', 'org.hrbp'],
    },
    {
      from: 'in_review',
      action: 'reject',
      to: 'rejected',
      actors: ['org.line_manager', 'org.hrbp'],
    },
    {
      from: 'in_review',
      action: 'transfer',
      to: 'in_review',
      actors: ['org.line_manager', 'org.hrbp'],
    },
    {
      from: 'in_review',
      action: 'withdraw',
      to: 'withdrawn',
      actors: ['fn.performance_operator', 'org.hrbp'],
    },
    {
      from: 'in_review',
      action: 'timeout',
      to: 'manual_pending',
      actors: ['system.scheduler'],
    },
    {
      from: 'in_review',
      action: 'remind',
      to: 'in_review',
      actors: ['fn.performance_operator', 'org.hrbp'],
    },
    {
      from: 'in_review',
      action: 'terminate',
      to: 'terminated',
      actors: ['org.hrbp'],
    },
    {
      from: 'manual_pending',
      action: 'resolve',
      to: 'in_review',
      actors: ['org.hrbp'],
    },
    {
      from: 'manual_pending',
      action: 'fallback',
      to: 'terminated',
      actors: ['org.hrbp'],
    },
    {
      from: 'manual_pending',
      action: 'remind',
      to: 'manual_pending',
      actors: ['org.hrbp'],
    },
    {
      from: 'manual_pending',
      action: 'terminate',
      to: 'terminated',
      actors: ['org.hrbp'],
    },
  ],
};
