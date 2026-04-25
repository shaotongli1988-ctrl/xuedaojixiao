/**
 * 简历池业务字典事实源。
 * 这里只负责 resume-pool 域状态与来源类型字典导出，不负责附件管理、转人才资产或面试动作执行。
 * 维护重点是服务端合法值集合与多端展示标签必须同源，避免页面继续手写状态和来源选项。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface ResumePoolOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const RESUME_POOL_STATUS_VALUES = [
  'new',
  'screening',
  'interviewing',
  'archived',
] as const;

export const RESUME_POOL_SOURCE_TYPE_VALUES = [
  'manual',
  'attachment',
  'external',
  'referral',
] as const;

export const RESUME_POOL_STATUS_DICT_KEY =
  'performance.resumePool.status';
export const RESUME_POOL_SOURCE_TYPE_DICT_KEY =
  'performance.resumePool.sourceType';
export const RESUME_POOL_DICT_VERSION = 'resume-pool-v1';

const RESUME_POOL_STATUS_OPTIONS: ReadonlyArray<ResumePoolOption> = [
  {
    value: 'new',
    label: '新建',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'screening',
    label: '筛选中',
    orderNum: 20,
    tone: 'warning',
  },
  {
    value: 'interviewing',
    label: '面试中',
    orderNum: 30,
    tone: 'success',
  },
  {
    value: 'archived',
    label: '已归档',
    orderNum: 40,
    tone: 'info',
  },
];

const RESUME_POOL_SOURCE_TYPE_OPTIONS: ReadonlyArray<ResumePoolOption> = [
  {
    value: 'manual',
    label: '手工录入',
    orderNum: 10,
  },
  {
    value: 'attachment',
    label: '附件解析',
    orderNum: 20,
  },
  {
    value: 'external',
    label: '外部来源',
    orderNum: 30,
  },
  {
    value: 'referral',
    label: '内推',
    orderNum: 40,
  },
];

function createItems(
  dictKey: string,
  options: ReadonlyArray<ResumePoolOption>
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

export function getResumePoolBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: RESUME_POOL_STATUS_DICT_KEY,
      version: RESUME_POOL_DICT_VERSION,
      items: createItems(
        RESUME_POOL_STATUS_DICT_KEY,
        RESUME_POOL_STATUS_OPTIONS
      ),
    },
    {
      key: RESUME_POOL_SOURCE_TYPE_DICT_KEY,
      version: RESUME_POOL_DICT_VERSION,
      items: createItems(
        RESUME_POOL_SOURCE_TYPE_DICT_KEY,
        RESUME_POOL_SOURCE_TYPE_OPTIONS
      ),
    },
  ];
}
