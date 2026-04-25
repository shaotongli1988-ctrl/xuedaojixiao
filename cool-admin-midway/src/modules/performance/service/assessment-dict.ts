/**
 * 评估单业务字典事实源。
 * 这里只负责 assessment 域状态字典导出，不负责总分计算、审批动作执行或权限范围判断。
 * 维护重点是服务端合法状态集合与多端展示标签必须同源，避免 helper、Web 共享组件和 Uni 页面各写一份状态文案。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface AssessmentOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const ASSESSMENT_STATUS_VALUES = [
  'draft',
  'submitted',
  'approved',
  'rejected',
] as const;

export const ASSESSMENT_STATUS_DICT_KEY = 'performance.assessment.status';
export const ASSESSMENT_DICT_VERSION = 'assessment-v1';

const ASSESSMENT_STATUS_OPTIONS: ReadonlyArray<AssessmentOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'submitted',
    label: '待审批',
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
];

function createItems(): BusinessDictItem[] {
  return ASSESSMENT_STATUS_OPTIONS.map(option => ({
    id: `${ASSESSMENT_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getAssessmentBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: ASSESSMENT_STATUS_DICT_KEY,
      version: ASSESSMENT_DICT_VERSION,
      items: createItems(),
    },
  ];
}
