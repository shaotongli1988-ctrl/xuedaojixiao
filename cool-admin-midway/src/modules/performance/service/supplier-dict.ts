/**
 * 供应商业务字典事实源。
 * 这里只负责 supplier 域状态字典导出，不负责采购单联动、敏感字段脱敏或删除约束。
 * 维护重点是服务端合法状态集合与多端展示标签必须同源，避免页面继续手写启停状态选项。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface SupplierOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const SUPPLIER_STATUS_VALUES = ['active', 'inactive'] as const;

export const SUPPLIER_STATUS_DICT_KEY = 'performance.supplier.status';
export const SUPPLIER_DICT_VERSION = 'supplier-v1';

const SUPPLIER_STATUS_OPTIONS: ReadonlyArray<SupplierOption> = [
  {
    value: 'active',
    label: '启用',
    orderNum: 10,
    tone: 'success',
  },
  {
    value: 'inactive',
    label: '停用',
    orderNum: 20,
    tone: 'info',
  },
];

function createItems(): BusinessDictItem[] {
  return SUPPLIER_STATUS_OPTIONS.map(option => ({
    id: `${SUPPLIER_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getSupplierBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: SUPPLIER_STATUS_DICT_KEY,
      version: SUPPLIER_DICT_VERSION,
      items: createItems(),
    },
  ];
}
