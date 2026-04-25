/**
 * 合同台账业务字典事实源。
 * 这里只负责 contract 域合同类型和合同状态字典导出，不负责合同校验、状态流转或权限范围判断。
 * 维护重点是服务端合法类型/状态集合与多端展示标签必须同源，避免服务层、Web 和 Uni 各写一份业务文案。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface ContractOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const CONTRACT_TYPE_VALUES = [
  'full-time',
  'part-time',
  'internship',
  'other',
] as const;
export const CONTRACT_STATUS_VALUES = [
  'draft',
  'active',
  'expired',
  'terminated',
] as const;

export const CONTRACT_TYPE_DICT_KEY = 'performance.contract.type';
export const CONTRACT_STATUS_DICT_KEY = 'performance.contract.status';
export const CONTRACT_DICT_VERSION = 'contract-v1';

const CONTRACT_TYPE_OPTIONS: ReadonlyArray<ContractOption> = [
  {
    value: 'full-time',
    label: '全职',
    orderNum: 10,
  },
  {
    value: 'part-time',
    label: '兼职',
    orderNum: 20,
  },
  {
    value: 'internship',
    label: '实习',
    orderNum: 30,
  },
  {
    value: 'other',
    label: '其他',
    orderNum: 40,
  },
];

const CONTRACT_STATUS_OPTIONS: ReadonlyArray<ContractOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'active',
    label: '生效',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'expired',
    label: '到期',
    orderNum: 30,
    tone: 'warning',
  },
  {
    value: 'terminated',
    label: '终止',
    orderNum: 40,
    tone: 'danger',
  },
];

function createItems(
  key: string,
  options: ReadonlyArray<ContractOption>
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

export function getContractBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: CONTRACT_TYPE_DICT_KEY,
      version: CONTRACT_DICT_VERSION,
      items: createItems(CONTRACT_TYPE_DICT_KEY, CONTRACT_TYPE_OPTIONS),
    },
    {
      key: CONTRACT_STATUS_DICT_KEY,
      version: CONTRACT_DICT_VERSION,
      items: createItems(CONTRACT_STATUS_DICT_KEY, CONTRACT_STATUS_OPTIONS),
    },
  ];
}
