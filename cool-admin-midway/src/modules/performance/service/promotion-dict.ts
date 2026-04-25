/**
 * 晋升业务字典事实源。
 * 这里只负责 promotion 域状态字典导出，不负责评审动作执行、来源评估单联动或权限范围判断。
 * 维护重点是服务端合法状态集合与多端展示标签必须同源，避免列表和评审抽屉各写一份状态文案。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface PromotionOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const PROMOTION_STATUS_VALUES = [
  'draft',
  'reviewing',
  'approved',
  'rejected',
] as const;

export const PROMOTION_STATUS_DICT_KEY = 'performance.promotion.status';
export const PROMOTION_DICT_VERSION = 'promotion-v1';

const PROMOTION_STATUS_OPTIONS: ReadonlyArray<PromotionOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'info',
  },
  {
    value: 'reviewing',
    label: '评审中',
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
  return PROMOTION_STATUS_OPTIONS.map(option => ({
    id: `${PROMOTION_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getPromotionBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: PROMOTION_STATUS_DICT_KEY,
      version: PROMOTION_DICT_VERSION,
      items: createItems(),
    },
  ];
}
