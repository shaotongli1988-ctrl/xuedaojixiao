/**
 * 审批流业务字典事实源。
 * 这里只负责审批实例状态值域与展示字典导出，不负责审批动作执行、审批节点解析或对象级权限判断。
 * 维护重点是审批状态展示标签必须与 approval-flow 状态机同源，避免页面和服务端各维护一套状态文案。
 */

import { APPROVAL_FLOW_INSTANCE_STATUSES } from '../domain/states/approval-flow';
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface ApprovalFlowOption {
  value: (typeof APPROVAL_FLOW_INSTANCE_STATUSES)[number];
  label: string;
  orderNum: number;
  tone: string;
}

export const APPROVAL_FLOW_STATUS_VALUES = APPROVAL_FLOW_INSTANCE_STATUSES;
export const APPROVAL_FLOW_STATUS_DICT_KEY =
  'performance.approvalFlow.status';
export const APPROVAL_FLOW_DICT_VERSION = 'approval-flow-v1';

const APPROVAL_FLOW_STATUS_OPTIONS: ReadonlyArray<ApprovalFlowOption> = [
  {
    value: 'pending_resolution',
    label: '待定位',
    orderNum: 10,
    tone: 'warning',
  },
  {
    value: 'in_review',
    label: '审批中',
    orderNum: 20,
    tone: 'primary',
  },
  {
    value: 'manual_pending',
    label: '待人工处理',
    orderNum: 30,
    tone: 'warning',
  },
  {
    value: 'approved',
    label: '已通过',
    orderNum: 40,
    tone: 'success',
  },
  {
    value: 'rejected',
    label: '已驳回',
    orderNum: 50,
    tone: 'danger',
  },
  {
    value: 'withdrawn',
    label: '已撤回',
    orderNum: 60,
    tone: 'info',
  },
  {
    value: 'terminated',
    label: '已终止',
    orderNum: 70,
    tone: 'danger',
  },
];

function createItems(): BusinessDictItem[] {
  return APPROVAL_FLOW_STATUS_OPTIONS.map(option => ({
    id: `${APPROVAL_FLOW_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getApprovalFlowBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: APPROVAL_FLOW_STATUS_DICT_KEY,
      version: APPROVAL_FLOW_DICT_VERSION,
      items: createItems(),
    },
  ];
}
