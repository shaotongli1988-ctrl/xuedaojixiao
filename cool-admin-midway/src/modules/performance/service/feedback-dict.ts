/**
 * 360 环评业务字典事实源。
 * 这里只负责 feedback 域任务状态、反馈记录状态和评价关系字典导出，不负责任务流转、提交校验或权限范围判断。
 * 维护重点是服务端合法值集合与多端展示标签必须同源，避免任务页、汇总抽屉和提交表单各写一份状态/关系文案。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface FeedbackOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const FEEDBACK_TASK_STATUS_VALUES = [
  'draft',
  'running',
  'closed',
] as const;

export const FEEDBACK_RECORD_STATUS_VALUES = [
  'draft',
  'submitted',
] as const;

export const FEEDBACK_RELATION_TYPE_VALUES = [
  '上级',
  '同级',
  '下级',
  '协作人',
] as const;

export const FEEDBACK_TASK_STATUS_DICT_KEY = 'performance.feedback.taskStatus';
export const FEEDBACK_RECORD_STATUS_DICT_KEY = 'performance.feedback.recordStatus';
export const FEEDBACK_RELATION_TYPE_DICT_KEY = 'performance.feedback.relationType';
export const FEEDBACK_DICT_VERSION = 'feedback-v1';

const FEEDBACK_TASK_STATUS_OPTIONS: ReadonlyArray<FeedbackOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'running',
    label: '进行中',
    orderNum: 20,
    tone: 'warning',
  },
  {
    value: 'closed',
    label: '已关闭',
    orderNum: 30,
    tone: 'success',
  },
];

const FEEDBACK_RECORD_STATUS_OPTIONS: ReadonlyArray<FeedbackOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'submitted',
    label: '已提交',
    orderNum: 20,
    tone: 'success',
  },
];

const FEEDBACK_RELATION_TYPE_OPTIONS: ReadonlyArray<FeedbackOption> = [
  {
    value: '上级',
    label: '上级',
    orderNum: 10,
  },
  {
    value: '同级',
    label: '同级',
    orderNum: 20,
  },
  {
    value: '下级',
    label: '下级',
    orderNum: 30,
  },
  {
    value: '协作人',
    label: '协作人',
    orderNum: 40,
  },
];

function createItems(key: string, options: ReadonlyArray<FeedbackOption>): BusinessDictItem[] {
  return options.map(option => ({
    id: `${key}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    ...(option.tone ? { tone: option.tone } : {}),
  }));
}

export function getFeedbackBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: FEEDBACK_TASK_STATUS_DICT_KEY,
      version: FEEDBACK_DICT_VERSION,
      items: createItems(FEEDBACK_TASK_STATUS_DICT_KEY, FEEDBACK_TASK_STATUS_OPTIONS),
    },
    {
      key: FEEDBACK_RECORD_STATUS_DICT_KEY,
      version: FEEDBACK_DICT_VERSION,
      items: createItems(FEEDBACK_RECORD_STATUS_DICT_KEY, FEEDBACK_RECORD_STATUS_OPTIONS),
    },
    {
      key: FEEDBACK_RELATION_TYPE_DICT_KEY,
      version: FEEDBACK_DICT_VERSION,
      items: createItems(FEEDBACK_RELATION_TYPE_DICT_KEY, FEEDBACK_RELATION_TYPE_OPTIONS),
    },
  ];
}
