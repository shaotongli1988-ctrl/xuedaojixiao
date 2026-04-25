/**
 * 录用管理业务字典事实源。
 * 这里只负责 hiring 域状态与来源类型字典导出，不负责录用动作执行、来源快照拼装或跨主题联动。
 * 维护重点是服务端合法值集合与 Web 展示标签必须同源，避免页面继续手写录用状态和来源类型。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface HiringOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const HIRING_STATUS_VALUES = [
  'offered',
  'accepted',
  'rejected',
  'closed',
] as const;

export const HIRING_SOURCE_TYPE_VALUES = [
  'manual',
  'resumePool',
  'talentAsset',
  'interview',
] as const;

export const HIRING_STATUS_DICT_KEY = 'performance.hiring.status';
export const HIRING_SOURCE_TYPE_DICT_KEY = 'performance.hiring.sourceType';
export const HIRING_DICT_VERSION = 'hiring-v1';

const HIRING_STATUS_OPTIONS: ReadonlyArray<HiringOption> = [
  {
    value: 'offered',
    label: '待候选人反馈',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'accepted',
    label: '已接受',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'rejected',
    label: '已拒绝',
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

const HIRING_SOURCE_TYPE_OPTIONS: ReadonlyArray<HiringOption> = [
  {
    value: 'manual',
    label: '手工创建',
    orderNum: 10,
  },
  {
    value: 'resumePool',
    label: '简历池',
    orderNum: 20,
  },
  {
    value: 'talentAsset',
    label: '人才资产',
    orderNum: 30,
  },
  {
    value: 'interview',
    label: '面试',
    orderNum: 40,
  },
];

function createItems(
  dictKey: string,
  options: ReadonlyArray<HiringOption>
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

export function getHiringBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: HIRING_STATUS_DICT_KEY,
      version: HIRING_DICT_VERSION,
      items: createItems(HIRING_STATUS_DICT_KEY, HIRING_STATUS_OPTIONS),
    },
    {
      key: HIRING_SOURCE_TYPE_DICT_KEY,
      version: HIRING_DICT_VERSION,
      items: createItems(
        HIRING_SOURCE_TYPE_DICT_KEY,
        HIRING_SOURCE_TYPE_OPTIONS
      ),
    },
  ];
}
