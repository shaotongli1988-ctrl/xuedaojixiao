/**
 * 目标与目标运营业务字典事实源。
 * 这里只负责 goal 域目标状态、计划来源/周期/状态和日报状态字典导出，不负责数据库读写或页面编排。
 * 维护重点是目标主链与运营台的展示口径必须与服务端合法值集合同源，避免 Web、Uni 和 helper 分别维护。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface GoalOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const GOAL_STATUS_VALUES = [
  'draft',
  'in-progress',
  'completed',
  'cancelled',
] as const;
export const GOAL_SOURCE_TYPE_VALUES = ['public', 'personal'] as const;
export const GOAL_PERIOD_TYPE_VALUES = ['day', 'week', 'month'] as const;
export const GOAL_PLAN_STATUS_VALUES = [
  'assigned',
  'submitted',
  'auto_zero',
] as const;
export const GOAL_REPORT_STATUS_VALUES = [
  'generated',
  'sent',
  'intercepted',
  'delayed',
] as const;

export const GOAL_STATUS_DICT_KEY = 'performance.goal.status';
export const GOAL_SOURCE_TYPE_DICT_KEY = 'performance.goal.sourceType';
export const GOAL_PERIOD_TYPE_DICT_KEY = 'performance.goal.periodType';
export const GOAL_PLAN_STATUS_DICT_KEY = 'performance.goal.planStatus';
export const GOAL_REPORT_STATUS_DICT_KEY = 'performance.goal.reportStatus';
export const GOAL_DICT_VERSION = 'goal-v1';

const GOAL_STATUS_OPTIONS: ReadonlyArray<GoalOption> = [
  { value: 'draft', label: '草稿', orderNum: 10, tone: 'info' },
  { value: 'in-progress', label: '进行中', orderNum: 20, tone: 'warning' },
  { value: 'completed', label: '已完成', orderNum: 30, tone: 'success' },
  { value: 'cancelled', label: '已取消', orderNum: 40, tone: 'danger' },
];

const GOAL_SOURCE_TYPE_OPTIONS: ReadonlyArray<GoalOption> = [
  { value: 'public', label: '公共目标', orderNum: 10 },
  { value: 'personal', label: '个人补充目标', orderNum: 20 },
];

const GOAL_PERIOD_TYPE_OPTIONS: ReadonlyArray<GoalOption> = [
  { value: 'day', label: '日目标', orderNum: 10 },
  { value: 'week', label: '周目标', orderNum: 20 },
  { value: 'month', label: '月目标', orderNum: 30 },
];

const GOAL_PLAN_STATUS_OPTIONS: ReadonlyArray<GoalOption> = [
  { value: 'assigned', label: '待填报', orderNum: 10, tone: 'info' },
  { value: 'submitted', label: '已提交', orderNum: 20, tone: 'success' },
  { value: 'auto_zero', label: '自动补零', orderNum: 30, tone: 'warning' },
];

const GOAL_REPORT_STATUS_OPTIONS: ReadonlyArray<GoalOption> = [
  { value: 'generated', label: '已生成', orderNum: 10, tone: 'info' },
  { value: 'sent', label: '已发送', orderNum: 20, tone: 'success' },
  { value: 'intercepted', label: '已拦截', orderNum: 30, tone: 'danger' },
  { value: 'delayed', label: '已延期', orderNum: 40, tone: 'warning' },
];

function createItems(
  key: string,
  options: ReadonlyArray<GoalOption>
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

export function getGoalBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: GOAL_STATUS_DICT_KEY,
      version: GOAL_DICT_VERSION,
      items: createItems(GOAL_STATUS_DICT_KEY, GOAL_STATUS_OPTIONS),
    },
    {
      key: GOAL_SOURCE_TYPE_DICT_KEY,
      version: GOAL_DICT_VERSION,
      items: createItems(GOAL_SOURCE_TYPE_DICT_KEY, GOAL_SOURCE_TYPE_OPTIONS),
    },
    {
      key: GOAL_PERIOD_TYPE_DICT_KEY,
      version: GOAL_DICT_VERSION,
      items: createItems(GOAL_PERIOD_TYPE_DICT_KEY, GOAL_PERIOD_TYPE_OPTIONS),
    },
    {
      key: GOAL_PLAN_STATUS_DICT_KEY,
      version: GOAL_DICT_VERSION,
      items: createItems(GOAL_PLAN_STATUS_DICT_KEY, GOAL_PLAN_STATUS_OPTIONS),
    },
    {
      key: GOAL_REPORT_STATUS_DICT_KEY,
      version: GOAL_DICT_VERSION,
      items: createItems(GOAL_REPORT_STATUS_DICT_KEY, GOAL_REPORT_STATUS_OPTIONS),
    },
  ];
}
