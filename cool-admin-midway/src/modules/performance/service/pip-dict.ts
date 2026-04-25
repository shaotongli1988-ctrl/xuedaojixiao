/**
 * PIP 业务字典事实源。
 * 这里只负责 pip 域状态字典导出，不负责 PIP 动作执行、跟进提交流程或权限范围判断。
 * 维护重点是服务端合法状态集合与多端展示标签必须同源，避免列表页、移动页和服务层各写一份状态文案。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface PipOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const PIP_STATUS_VALUES = [
  'draft',
  'active',
  'completed',
  'closed',
] as const;

export const PIP_STATUS_DICT_KEY = 'performance.pip.status';
export const PIP_DICT_VERSION = 'pip-v1';

const PIP_STATUS_OPTIONS: ReadonlyArray<PipOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'active',
    label: '进行中',
    orderNum: 20,
    tone: 'warning',
  },
  {
    value: 'completed',
    label: '已完成',
    orderNum: 30,
    tone: 'success',
  },
  {
    value: 'closed',
    label: '已关闭',
    orderNum: 40,
    tone: 'danger',
  },
];

function createItems(): BusinessDictItem[] {
  return PIP_STATUS_OPTIONS.map(option => ({
    id: `${PIP_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getPipBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: PIP_STATUS_DICT_KEY,
      version: PIP_DICT_VERSION,
      items: createItems(),
    },
  ];
}
