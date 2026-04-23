/**
 * 采购订单业务字典事实源。
 * 这里只负责 purchase-order 域状态字典导出，不负责订单动作、审批流或范围权限。
 * 维护重点是采购单主资源状态展示必须与服务端状态机同源，避免多视图页面再各写一份状态选项。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface PurchaseOrderOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const PURCHASE_ORDER_STATUS_VALUES = [
  'draft',
  'inquiring',
  'pendingApproval',
  'approved',
  'received',
  'closed',
  'cancelled',
] as const;

export const PURCHASE_ORDER_STATUS_DICT_KEY = 'performance.purchaseOrder.status';
export const PURCHASE_ORDER_DICT_VERSION = 'purchase-order-v1';

const PURCHASE_ORDER_STATUS_OPTIONS: ReadonlyArray<PurchaseOrderOption> = [
  { value: 'draft', label: '草稿', orderNum: 10, tone: 'info' },
  { value: 'inquiring', label: '询价中', orderNum: 20, tone: 'warning' },
  { value: 'pendingApproval', label: '待审批', orderNum: 30, tone: 'danger' },
  { value: 'approved', label: '已审批', orderNum: 40, tone: 'primary' },
  { value: 'received', label: '已收货', orderNum: 50, tone: 'success' },
  { value: 'closed', label: '已关闭', orderNum: 60, tone: 'info' },
  { value: 'cancelled', label: '已取消', orderNum: 70, tone: 'warning' },
];

function createItems(): BusinessDictItem[] {
  return PURCHASE_ORDER_STATUS_OPTIONS.map(option => ({
    id: `${PURCHASE_ORDER_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getPurchaseOrderBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: PURCHASE_ORDER_STATUS_DICT_KEY,
      version: PURCHASE_ORDER_DICT_VERSION,
      items: createItems(),
    },
  ];
}
