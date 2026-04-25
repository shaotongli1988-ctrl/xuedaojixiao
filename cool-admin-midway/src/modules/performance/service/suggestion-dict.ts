/**
 * 自动建议业务字典事实源。
 * 这里只负责 suggestion 域建议类型、状态和撤销原因字典导出，不负责规则触发、人工处理动作或权限范围判断。
 * 维护重点是服务端合法值集合与多端展示标签必须同源，避免 helper、Web 页面和 Uni 页面各写一份类型/状态文案。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface SuggestionOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
  extra?: Record<string, any>;
}

export const SUGGESTION_TYPE_VALUES = ['pip', 'promotion'] as const;
export const SUGGESTION_STATUS_VALUES = [
  'pending',
  'accepted',
  'ignored',
  'rejected',
  'revoked',
] as const;
export const SUGGESTION_REVOKE_REASON_CODE_VALUES = [
  'thresholdError',
  'assessmentCorrected',
  'scopeError',
  'duplicateSuggestion',
] as const;

export const SUGGESTION_TYPE_DICT_KEY = 'performance.suggestion.type';
export const SUGGESTION_STATUS_DICT_KEY = 'performance.suggestion.status';
export const SUGGESTION_REVOKE_REASON_CODE_DICT_KEY =
  'performance.suggestion.revokeReasonCode';
export const SUGGESTION_DICT_VERSION = 'suggestion-v1';

const SUGGESTION_TYPE_OPTIONS: ReadonlyArray<SuggestionOption> = [
  {
    value: 'pip',
    label: 'PIP 建议',
    orderNum: 10,
    tone: 'warning',
    extra: {
      targetLabel: 'PIP',
    },
  },
  {
    value: 'promotion',
    label: '晋升建议',
    orderNum: 20,
    tone: 'success',
    extra: {
      targetLabel: '晋升单',
    },
  },
];

const SUGGESTION_STATUS_OPTIONS: ReadonlyArray<SuggestionOption> = [
  {
    value: 'pending',
    label: '待处理',
    orderNum: 10,
    tone: 'warning',
  },
  {
    value: 'accepted',
    label: '已采用',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'ignored',
    label: '已忽略',
    orderNum: 30,
    tone: 'info',
  },
  {
    value: 'rejected',
    label: '已驳回',
    orderNum: 40,
    tone: 'warning',
  },
  {
    value: 'revoked',
    label: '已撤销',
    orderNum: 50,
    tone: 'danger',
  },
];

const SUGGESTION_REVOKE_REASON_CODE_OPTIONS: ReadonlyArray<SuggestionOption> = [
  {
    value: 'thresholdError',
    label: '阈值命中错误',
    orderNum: 10,
  },
  {
    value: 'assessmentCorrected',
    label: '评估数据已更正',
    orderNum: 20,
  },
  {
    value: 'scopeError',
    label: '数据范围判断错误',
    orderNum: 30,
  },
  {
    value: 'duplicateSuggestion',
    label: '重复建议',
    orderNum: 40,
  },
];

function createItems(
  key: string,
  options: ReadonlyArray<SuggestionOption>
): BusinessDictItem[] {
  return options.map(option => ({
    id: `${key}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    ...(option.tone ? { tone: option.tone } : {}),
    ...(option.extra ? { extra: option.extra } : {}),
  }));
}

export function getSuggestionBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: SUGGESTION_TYPE_DICT_KEY,
      version: SUGGESTION_DICT_VERSION,
      items: createItems(SUGGESTION_TYPE_DICT_KEY, SUGGESTION_TYPE_OPTIONS),
    },
    {
      key: SUGGESTION_STATUS_DICT_KEY,
      version: SUGGESTION_DICT_VERSION,
      items: createItems(SUGGESTION_STATUS_DICT_KEY, SUGGESTION_STATUS_OPTIONS),
    },
    {
      key: SUGGESTION_REVOKE_REASON_CODE_DICT_KEY,
      version: SUGGESTION_DICT_VERSION,
      items: createItems(
        SUGGESTION_REVOKE_REASON_CODE_DICT_KEY,
        SUGGESTION_REVOKE_REASON_CODE_OPTIONS
      ),
    },
  ];
}
