/**
 * 招聘计划业务字典事实源。
 * 这里只负责 recruit-plan 域状态值域与展示字典导出，不负责页面权限、导入导出或招聘流程动作执行。
 * 维护重点是服务端合法状态集合与多端展示标签必须同源，避免页面继续各写一份状态选项。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface RecruitPlanOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const RECRUIT_PLAN_STATUS_VALUES = [
  'draft',
  'active',
  'voided',
  'closed',
] as const;

export const RECRUIT_PLAN_STATUS_DICT_KEY =
  'performance.recruitPlan.status';
export const RECRUIT_PLAN_DICT_VERSION = 'recruit-plan-v1';

const RECRUIT_PLAN_STATUS_OPTIONS: ReadonlyArray<RecruitPlanOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'active',
    label: '生效中',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'voided',
    label: '已作废',
    orderNum: 30,
    tone: 'danger',
  },
  {
    value: 'closed',
    label: '已关闭',
    orderNum: 40,
    tone: 'warning',
  },
];

function createItems(): BusinessDictItem[] {
  return RECRUIT_PLAN_STATUS_OPTIONS.map(option => ({
    id: `${RECRUIT_PLAN_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getRecruitPlanBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: RECRUIT_PLAN_STATUS_DICT_KEY,
      version: RECRUIT_PLAN_DICT_VERSION,
      items: createItems(),
    },
  ];
}
