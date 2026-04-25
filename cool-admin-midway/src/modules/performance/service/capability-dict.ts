/**
 * 能力地图业务字典事实源。
 * 这里只负责 capability 域能力模型状态字典导出，不负责能力项、画像计算或权限范围判断。
 * 维护重点是能力模型状态集合与多端展示标签必须同源，避免 helper、Web 和 Uni 各写一份状态文案。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface CapabilityOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const CAPABILITY_MODEL_STATUS_VALUES = [
  'draft',
  'active',
  'archived',
] as const;

export const CAPABILITY_MODEL_STATUS_DICT_KEY = 'performance.capability.status';
export const CAPABILITY_DICT_VERSION = 'capability-v1';

const CAPABILITY_MODEL_STATUS_OPTIONS: ReadonlyArray<CapabilityOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'warning',
  },
  {
    value: 'active',
    label: '已生效',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'archived',
    label: '已归档',
    orderNum: 30,
    tone: 'info',
  },
];

function createItems(): BusinessDictItem[] {
  return CAPABILITY_MODEL_STATUS_OPTIONS.map(option => ({
    id: `${CAPABILITY_MODEL_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getCapabilityBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: CAPABILITY_MODEL_STATUS_DICT_KEY,
      version: CAPABILITY_DICT_VERSION,
      items: createItems(),
    },
  ];
}
