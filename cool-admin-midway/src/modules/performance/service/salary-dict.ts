/**
 * 薪资业务字典事实源。
 * 这里只负责 salary 域状态字典导出，不负责薪资金额计算、确认归档动作或权限范围判断。
 * 维护重点是服务端合法状态集合与多端展示标签必须同源，避免服务层、Web 页面和 Uni 页面各写一份状态文案。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface SalaryOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const SALARY_STATUS_VALUES = [
  'draft',
  'confirmed',
  'archived',
] as const;

export const SALARY_STATUS_DICT_KEY = 'performance.salary.status';
export const SALARY_DICT_VERSION = 'salary-v1';

const SALARY_STATUS_OPTIONS: ReadonlyArray<SalaryOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'warning',
  },
  {
    value: 'confirmed',
    label: '已确认',
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
  return SALARY_STATUS_OPTIONS.map(option => ({
    id: `${SALARY_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getSalaryBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: SALARY_STATUS_DICT_KEY,
      version: SALARY_DICT_VERSION,
      items: createItems(),
    },
  ];
}
