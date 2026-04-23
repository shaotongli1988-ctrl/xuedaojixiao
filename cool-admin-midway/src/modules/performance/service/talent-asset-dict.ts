/**
 * 人才资产业务字典事实源。
 * 这里只负责 talent-asset 域状态字典导出，不负责标签渲染、面试联动或删除约束执行。
 * 维护重点是服务端合法状态集合与多端展示标签必须同源，避免页面继续手写状态选项。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface TalentAssetOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const TALENT_ASSET_STATUS_VALUES = [
  'new',
  'tracking',
  'archived',
] as const;

export const TALENT_ASSET_STATUS_DICT_KEY =
  'performance.talentAsset.status';
export const TALENT_ASSET_DICT_VERSION = 'talent-asset-v1';

const TALENT_ASSET_STATUS_OPTIONS: ReadonlyArray<TalentAssetOption> = [
  {
    value: 'new',
    label: '新建',
    orderNum: 10,
    tone: 'success',
  },
  {
    value: 'tracking',
    label: '跟进中',
    orderNum: 20,
    tone: 'warning',
  },
  {
    value: 'archived',
    label: '已归档',
    orderNum: 30,
    tone: 'info',
  },
];

function createItems(): BusinessDictItem[] {
  return TALENT_ASSET_STATUS_OPTIONS.map(option => ({
    id: `${TALENT_ASSET_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getTalentAssetBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: TALENT_ASSET_STATUS_DICT_KEY,
      version: TALENT_ASSET_DICT_VERSION,
      items: createItems(),
    },
  ];
}
