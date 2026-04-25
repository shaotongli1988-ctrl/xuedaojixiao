/**
 * 工作计划业务字典事实源。
 * 这里只负责 work-plan 域的状态、来源审批状态、优先级和来源类型字典导出，
 * 不负责执行动作鉴权、钉钉同步流程或数据库读写。
 * 维护重点是服务端合法值集合与多端展示文案必须同源，避免页面继续各写一份。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface WorkPlanOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const WORK_PLAN_STATUS_VALUES = [
  'draft',
  'planned',
  'inProgress',
  'completed',
  'cancelled',
] as const;

export const WORK_PLAN_PRIORITY_VALUES = [
  'low',
  'medium',
  'high',
  'urgent',
] as const;

export const WORK_PLAN_SOURCE_TYPE_VALUES = [
  'manual',
  'dingtalkApproval',
] as const;

export const WORK_PLAN_SOURCE_STATUS_VALUES = [
  'none',
  'processing',
  'approved',
  'rejected',
  'withdrawn',
  'terminated',
] as const;

export const WORK_PLAN_STATUS_DICT_KEY = 'performance.workPlan.status';
export const WORK_PLAN_PRIORITY_DICT_KEY = 'performance.workPlan.priority';
export const WORK_PLAN_SOURCE_TYPE_DICT_KEY =
  'performance.workPlan.sourceType';
export const WORK_PLAN_SOURCE_STATUS_DICT_KEY =
  'performance.workPlan.sourceStatus';
export const WORK_PLAN_DICT_VERSION = 'work-plan-v1';

const WORK_PLAN_STATUS_OPTIONS: ReadonlyArray<WorkPlanOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'planned',
    label: '已计划',
    orderNum: 20,
    tone: 'warning',
  },
  {
    value: 'inProgress',
    label: '执行中',
    orderNum: 30,
    tone: 'warning',
  },
  {
    value: 'completed',
    label: '已完成',
    orderNum: 40,
    tone: 'success',
  },
  {
    value: 'cancelled',
    label: '已取消',
    orderNum: 50,
    tone: 'danger',
  },
];

const WORK_PLAN_SOURCE_STATUS_OPTIONS: ReadonlyArray<WorkPlanOption> = [
  {
    value: 'none',
    label: '无来源审批',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'processing',
    label: '审批中',
    orderNum: 20,
    tone: 'warning',
  },
  {
    value: 'approved',
    label: '已通过',
    orderNum: 30,
    tone: 'success',
  },
  {
    value: 'rejected',
    label: '已驳回',
    orderNum: 40,
    tone: 'danger',
  },
  {
    value: 'withdrawn',
    label: '已撤回',
    orderNum: 50,
    tone: 'warning',
  },
  {
    value: 'terminated',
    label: '已终止',
    orderNum: 60,
    tone: 'danger',
  },
];

const WORK_PLAN_PRIORITY_OPTIONS: ReadonlyArray<WorkPlanOption> = [
  {
    value: 'low',
    label: '低',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'medium',
    label: '中',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'high',
    label: '高',
    orderNum: 30,
    tone: 'warning',
  },
  {
    value: 'urgent',
    label: '紧急',
    orderNum: 40,
    tone: 'danger',
  },
];

const WORK_PLAN_SOURCE_TYPE_OPTIONS: ReadonlyArray<WorkPlanOption> = [
  {
    value: 'manual',
    label: '手工创建',
    orderNum: 10,
  },
  {
    value: 'dingtalkApproval',
    label: '钉钉审批',
    orderNum: 20,
  },
];

function createBusinessDictItems(
  dictKey: string,
  options: ReadonlyArray<WorkPlanOption>
): BusinessDictItem[] {
  return options.map(option => ({
    id: `${dictKey}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getWorkPlanBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: WORK_PLAN_STATUS_DICT_KEY,
      version: WORK_PLAN_DICT_VERSION,
      items: createBusinessDictItems(
        WORK_PLAN_STATUS_DICT_KEY,
        WORK_PLAN_STATUS_OPTIONS
      ),
    },
    {
      key: WORK_PLAN_SOURCE_STATUS_DICT_KEY,
      version: WORK_PLAN_DICT_VERSION,
      items: createBusinessDictItems(
        WORK_PLAN_SOURCE_STATUS_DICT_KEY,
        WORK_PLAN_SOURCE_STATUS_OPTIONS
      ),
    },
    {
      key: WORK_PLAN_PRIORITY_DICT_KEY,
      version: WORK_PLAN_DICT_VERSION,
      items: createBusinessDictItems(
        WORK_PLAN_PRIORITY_DICT_KEY,
        WORK_PLAN_PRIORITY_OPTIONS
      ),
    },
    {
      key: WORK_PLAN_SOURCE_TYPE_DICT_KEY,
      version: WORK_PLAN_DICT_VERSION,
      items: createBusinessDictItems(
        WORK_PLAN_SOURCE_TYPE_DICT_KEY,
        WORK_PLAN_SOURCE_TYPE_OPTIONS
      ),
    },
  ];
}
