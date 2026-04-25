/**
 * 招聘面试业务字典事实源。
 * 这里只负责 interview 域面试状态和面试类型字典导出，不负责范围权限、终态约束或来源快照拼装。
 * 维护重点是服务端合法状态/类型集合与多端展示标签必须同源，避免服务层、Web 和 Uni 各写一份业务文案。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface InterviewOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const INTERVIEW_STATUS_VALUES = [
  'scheduled',
  'completed',
  'cancelled',
] as const;
export const INTERVIEW_TYPE_VALUES = [
  'technical',
  'behavioral',
  'manager',
  'hr',
] as const;

export const INTERVIEW_STATUS_DICT_KEY = 'performance.interview.status';
export const INTERVIEW_TYPE_DICT_KEY = 'performance.interview.type';
export const INTERVIEW_DICT_VERSION = 'interview-v1';

const INTERVIEW_STATUS_OPTIONS: ReadonlyArray<InterviewOption> = [
  {
    value: 'scheduled',
    label: '待执行',
    orderNum: 10,
    tone: 'warning',
  },
  {
    value: 'completed',
    label: '已完成',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'cancelled',
    label: '已取消',
    orderNum: 30,
    tone: 'danger',
  },
];

const INTERVIEW_TYPE_OPTIONS: ReadonlyArray<InterviewOption> = [
  {
    value: 'technical',
    label: '技术面',
    orderNum: 10,
  },
  {
    value: 'behavioral',
    label: '行为面',
    orderNum: 20,
  },
  {
    value: 'manager',
    label: '经理面',
    orderNum: 30,
  },
  {
    value: 'hr',
    label: 'HR 面',
    orderNum: 40,
  },
];

function createItems(
  key: string,
  options: ReadonlyArray<InterviewOption>
): BusinessDictItem[] {
  return options.map(option => ({
    id: `${key}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    ...(option.tone ? { tone: option.tone } : {}),
  }));
}

export function getInterviewBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: INTERVIEW_STATUS_DICT_KEY,
      version: INTERVIEW_DICT_VERSION,
      items: createItems(INTERVIEW_STATUS_DICT_KEY, INTERVIEW_STATUS_OPTIONS),
    },
    {
      key: INTERVIEW_TYPE_DICT_KEY,
      version: INTERVIEW_DICT_VERSION,
      items: createItems(INTERVIEW_TYPE_DICT_KEY, INTERVIEW_TYPE_OPTIONS),
    },
  ];
}
