/**
 * 自动审批流辅助规则。
 * 这里负责主题 5 冻结后的对象白名单、状态集合、配置校验和源业务对象回写口径，不负责数据库访问或权限查询。
 * 维护重点是已冻结对象的审批语义必须唯一，不能把对象状态错误映射到共享审批实例。
 */
import { CoolCommException } from '@cool-midway/core';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  APPROVAL_FLOW_ACTIONS,
  APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS,
  APPROVAL_FLOW_INSTANCE_STATUSES,
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain';

export const APPROVAL_OBJECT_TYPES = [
  'assessment',
  'promotion',
  'assetAssignmentRequest',
] as const;
export type ApprovalObjectType = (typeof APPROVAL_OBJECT_TYPES)[number];

export const APPROVAL_INSTANCE_STATUSES = APPROVAL_FLOW_INSTANCE_STATUSES;
export type ApprovalInstanceStatus =
  (typeof APPROVAL_INSTANCE_STATUSES)[number];

export const APPROVAL_NODE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'timed_out',
  'transferred',
  'cancelled',
] as const;
export type ApprovalNodeStatus = (typeof APPROVAL_NODE_STATUSES)[number];

export const APPROVAL_RESOLVER_TYPES = [
  'specified_user',
  'applicant_direct_manager',
  'employee_department_manager',
  'department_tree_role',
  'hr_manual_assign',
] as const;
export type ApprovalResolverType = (typeof APPROVAL_RESOLVER_TYPES)[number];

export const APPROVAL_TERMINAL_STATUSES: ApprovalInstanceStatus[] = [
  'approved',
  'rejected',
  'withdrawn',
  'terminated',
];

export const APPROVAL_ACTIVE_STATUSES: ApprovalInstanceStatus[] = [
  'pending_resolution',
  'in_review',
  'manual_pending',
];
const PERFORMANCE_NUMERIC_FIELD_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.numericFieldInvalid
  );

export type ApprovalAction = (typeof APPROVAL_FLOW_ACTIONS)[number];

export const allowedTransitionsByStatus: Record<
  ApprovalInstanceStatus,
  ApprovalAction[]
> = {
  pending_resolution: [...APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS.pending_resolution],
  in_review: [...APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS.in_review],
  manual_pending: [...APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS.manual_pending],
  approved: [...APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS.approved],
  rejected: [...APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS.rejected],
  withdrawn: [...APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS.withdrawn],
  terminated: [...APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS.terminated],
};

export function isApprovalObjectType(value: string): value is ApprovalObjectType {
  return APPROVAL_OBJECT_TYPES.includes(value as ApprovalObjectType);
}

export function normalizeApprovalObjectType(value: any): ApprovalObjectType {
  const objectType = String(value || '').trim() as ApprovalObjectType;

  if (!isApprovalObjectType(objectType)) {
    throw new CoolCommException(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.approvalObjectInvalid
      )
    );
  }

  return objectType;
}

export function normalizeApprovalResolverType(value: any): ApprovalResolverType {
  const resolverType = String(value || '').trim() as ApprovalResolverType;

  if (!APPROVAL_RESOLVER_TYPES.includes(resolverType)) {
    throw new CoolCommException('审批人解析方式不合法');
  }

  return resolverType;
}

export function normalizeOptionalString(value: any, maxLength?: number) {
  const normalized = value == null ? '' : String(value).trim();

  if (maxLength && normalized.length > maxLength) {
    throw new CoolCommException('字段长度超出限制');
  }

  return normalized;
}

export function normalizeRequiredString(
  value: any,
  message: string,
  maxLength?: number
) {
  const normalized = normalizeOptionalString(value, maxLength);

  if (!normalized) {
    throw new CoolCommException(message);
  }

  return normalized;
}

export function normalizeOptionalNumber(value: any) {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new CoolCommException(PERFORMANCE_NUMERIC_FIELD_INVALID_MESSAGE);
  }

  return parsed;
}

export function normalizeOptionalBoolean(value: any, defaultValue = false) {
  if (value == null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return Boolean(value);
}

export function ensureApprovalConfigNodes(nodes: any[]) {
  if (!Array.isArray(nodes) || !nodes.length) {
    throw new CoolCommException('审批节点不能为空');
  }

  const normalized = nodes
    .map(item => {
      const nodeOrder = Number(item?.nodeOrder);

      if (!Number.isInteger(nodeOrder) || nodeOrder <= 0) {
        throw new CoolCommException('审批节点顺序不合法');
      }

      const resolverType = normalizeApprovalResolverType(item?.resolverType);
      const resolverValue = normalizeOptionalString(item?.resolverValue, 200);
      const timeoutHours =
        item?.timeoutHours == null || item?.timeoutHours === ''
          ? null
          : Number(item.timeoutHours);

      if (
        timeoutHours != null &&
        (!Number.isInteger(timeoutHours) || timeoutHours <= 0)
      ) {
        throw new CoolCommException('审批节点超时阈值不合法');
      }

      if (
        ['specified_user', 'department_tree_role'].includes(resolverType) &&
        !resolverValue
      ) {
        throw new CoolCommException('当前审批节点缺少解析参数');
      }

      return {
        nodeOrder,
        nodeCode: normalizeRequiredString(
          item?.nodeCode,
          '审批节点编码不能为空',
          50
        ),
        nodeName: normalizeRequiredString(
          item?.nodeName,
          '审批节点名称不能为空',
          100
        ),
        resolverType,
        resolverValue,
        timeoutHours,
        allowTransfer: normalizeOptionalBoolean(item?.allowTransfer, true),
      };
    })
    .sort((a, b) => a.nodeOrder - b.nodeOrder);

  normalized.forEach((item, index) => {
    if (item.nodeOrder !== index + 1) {
      throw new CoolCommException('审批节点顺序必须从 1 开始连续递增');
    }
  });

  const nodeOrderSet = new Set(normalized.map(item => item.nodeOrder));
  const nodeCodeSet = new Set(normalized.map(item => item.nodeCode));

  if (nodeOrderSet.size !== normalized.length) {
    throw new CoolCommException('审批节点顺序重复');
  }

  if (nodeCodeSet.size !== normalized.length) {
    throw new CoolCommException('审批节点编码重复');
  }

  return normalized;
}

export function getApprovalSourceStatus(objectType: ApprovalObjectType) {
  if (objectType === 'assessment') {
    return 'submitted';
  }
  if (objectType === 'promotion') {
    return 'reviewing';
  }
  return 'inApproval';
}

export function getApprovalSourceApprovedStatus(objectType: ApprovalObjectType) {
  return objectType === 'assetAssignmentRequest'
    ? 'approvedPendingAssignment'
    : 'approved';
}

export function getApprovalSourceRejectedStatus(objectType: ApprovalObjectType) {
  return 'rejected';
}

export function getApprovalSourceWithdrawnStatus(
  objectType: ApprovalObjectType
) {
  return objectType === 'assetAssignmentRequest' ? 'withdrawn' : 'draft';
}

export function getManualReviewPerm(objectType: ApprovalObjectType) {
  if (objectType === 'assessment') {
    return PERMISSIONS.performance.assessment.approve;
  }
  if (objectType === 'promotion') {
    return PERMISSIONS.performance.promotion.review;
  }
  return PERMISSIONS.performance.approvalFlow.approve;
}

export function getApprovalSourceDraftStatus(objectType: ApprovalObjectType) {
  return objectType === 'assetAssignmentRequest' ? 'withdrawn' : 'draft';
}

export function canWithdrawInstance(
  instanceStatus: ApprovalInstanceStatus,
  currentNodeOrder: number | null,
  currentNodeStatus: ApprovalNodeStatus | null,
  currentNodeActionTime?: string | null
) {
  if (instanceStatus === 'pending_resolution') {
    return true;
  }

  if (instanceStatus !== 'in_review') {
    return false;
  }

  return (
    Number(currentNodeOrder || 0) === 1 &&
    currentNodeStatus === 'pending' &&
    !currentNodeActionTime
  );
}

export function assertApprovalActiveStatus(status: string) {
  if (!APPROVAL_ACTIVE_STATUSES.includes(status as ApprovalInstanceStatus)) {
    throw new CoolCommException(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.approvalInstanceEnded
      )
    );
  }
}

export function assertApprovalInstanceAction(
  status: ApprovalInstanceStatus,
  action: ApprovalAction
) {
  if (!allowedTransitionsByStatus[status].includes(action)) {
    throw new CoolCommException(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.approvalInvalidTransition
      )
    );
  }
}

export function canTransitionApprovalInstance(
  status: string,
  action: ApprovalAction
) {
  return (allowedTransitionsByStatus[status as ApprovalInstanceStatus] || []).includes(
    action
  );
}

export function assertApprovalInstanceTransition(
  status: string,
  action: ApprovalAction
) {
  if (!canTransitionApprovalInstance(status, action)) {
    throw new CoolCommException(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.approvalInvalidTransition
      )
    );
  }
}
