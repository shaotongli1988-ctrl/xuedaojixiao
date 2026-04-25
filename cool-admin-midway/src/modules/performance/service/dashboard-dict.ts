/**
 * 驾驶舱业务字典事实源。
 * 这里只负责驾驶舱范围值域与展示字典导出，不负责真正的权限裁剪、汇总查询或部门树解析。
 * 维护重点是范围选项必须和 dashboard service 的实际 scopeType 语义保持一致，避免前端自行猜测范围值。
 */

import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface DashboardScopeOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const DASHBOARD_SCOPE_VALUES = ['global', 'department_tree'] as const;
export const DASHBOARD_SCOPE_DICT_KEY = 'performance.dashboard.scope';
export const DASHBOARD_DICT_VERSION = 'dashboard-v1';

const DASHBOARD_SCOPE_OPTIONS: ReadonlyArray<DashboardScopeOption> = [
  {
    value: 'global',
    label: '全公司',
    orderNum: 10,
    tone: 'success',
  },
  {
    value: 'department_tree',
    label: '部门树',
    orderNum: 20,
    tone: 'primary',
  },
];

function createItems(): BusinessDictItem[] {
  return DASHBOARD_SCOPE_OPTIONS.map(option => ({
    id: `${DASHBOARD_SCOPE_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getDashboardBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: DASHBOARD_SCOPE_DICT_KEY,
      version: DASHBOARD_DICT_VERSION,
      items: createItems(),
    },
  ];
}
