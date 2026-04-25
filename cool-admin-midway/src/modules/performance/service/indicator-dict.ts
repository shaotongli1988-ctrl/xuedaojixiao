/**
 * 指标库业务字典事实源。
 * 这里只负责沉淀 indicator 域可复用的值域、展示标签和字典导出，
 * 不负责接口鉴权、数据库读写或其他绩效模块的状态机。
 * 维护重点是合法值集合与下发字典必须始终同源，避免前后端再各自维护一份。
 */
export interface BusinessDictItem {
  id: string;
  name: string;
  value: string | number;
  orderNum: number;
  parentId: null;
  tone?: string;
  disabled?: boolean;
  extra?: Record<string, any>;
}

export interface BusinessDictGroup {
  key: string;
  version: string;
  items: BusinessDictItem[];
}

interface IndicatorOption<T extends string | number> {
  value: T;
  label: string;
  orderNum: number;
  tone?: string;
}

export const INDICATOR_CATEGORY_VALUES = [
  'assessment',
  'goal',
  'feedback',
] as const;

export const INDICATOR_APPLY_SCOPE_VALUES = [
  'all',
  'department',
  'employee',
] as const;

export const INDICATOR_STATUS_VALUES = [0, 1] as const;

export const INDICATOR_CATEGORY_DICT_KEY = 'performance.indicator.category';
export const INDICATOR_STATUS_DICT_KEY = 'performance.indicator.status';
export const INDICATOR_APPLY_SCOPE_DICT_KEY =
  'performance.indicator.applyScope';
export const INDICATOR_DICT_VERSION = 'indicator-v1';

const INDICATOR_CATEGORY_OPTIONS: ReadonlyArray<IndicatorOption<string>> = [
  {
    value: 'assessment',
    label: '考核指标',
    orderNum: 10,
  },
  {
    value: 'goal',
    label: '目标指标',
    orderNum: 20,
  },
  {
    value: 'feedback',
    label: '环评指标',
    orderNum: 30,
  },
];

const INDICATOR_STATUS_OPTIONS: ReadonlyArray<IndicatorOption<number>> = [
  {
    value: 1,
    label: '启用',
    orderNum: 10,
    tone: 'success',
  },
  {
    value: 0,
    label: '禁用',
    orderNum: 20,
    tone: 'info',
  },
];

const INDICATOR_APPLY_SCOPE_OPTIONS: ReadonlyArray<IndicatorOption<string>> = [
  {
    value: 'all',
    label: '全员',
    orderNum: 10,
  },
  {
    value: 'department',
    label: '部门',
    orderNum: 20,
  },
  {
    value: 'employee',
    label: '员工/岗位',
    orderNum: 30,
  },
];

function createBusinessDictItems<T extends string | number>(
  dictKey: string,
  options: ReadonlyArray<IndicatorOption<T>>
): BusinessDictItem[] {
  return options.map(option => ({
    id: `${dictKey}:${String(option.value)}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getIndicatorBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: INDICATOR_CATEGORY_DICT_KEY,
      version: INDICATOR_DICT_VERSION,
      items: createBusinessDictItems(
        INDICATOR_CATEGORY_DICT_KEY,
        INDICATOR_CATEGORY_OPTIONS
      ),
    },
    {
      key: INDICATOR_STATUS_DICT_KEY,
      version: INDICATOR_DICT_VERSION,
      items: createBusinessDictItems(
        INDICATOR_STATUS_DICT_KEY,
        INDICATOR_STATUS_OPTIONS
      ),
    },
    {
      key: INDICATOR_APPLY_SCOPE_DICT_KEY,
      version: INDICATOR_DICT_VERSION,
      items: createBusinessDictItems(
        INDICATOR_APPLY_SCOPE_DICT_KEY,
        INDICATOR_APPLY_SCOPE_OPTIONS
      ),
    },
  ];
}
