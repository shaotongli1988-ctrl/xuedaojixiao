/**
 * 知识库业务字典事实源。
 * 这里只负责 knowledge-base 域状态字典导出，不负责知识条目 CRUD、图谱或 QA。
 * 维护重点是知识条目状态展示必须与服务端合法值集合同源，并与关联文件状态展示保持可组合。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface KnowledgeBaseOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const KNOWLEDGE_BASE_STATUS_VALUES = [
  'draft',
  'published',
  'archived',
] as const;

export const KNOWLEDGE_BASE_STATUS_DICT_KEY = 'performance.knowledgeBase.status';
export const KNOWLEDGE_BASE_DICT_VERSION = 'knowledge-base-v1';

const KNOWLEDGE_BASE_STATUS_OPTIONS: ReadonlyArray<KnowledgeBaseOption> = [
  { value: 'draft', label: '草稿', orderNum: 10, tone: 'info' },
  { value: 'published', label: '已发布', orderNum: 20, tone: 'success' },
  { value: 'archived', label: '已归档', orderNum: 30, tone: 'info' },
];

function createItems(): BusinessDictItem[] {
  return KNOWLEDGE_BASE_STATUS_OPTIONS.map(option => ({
    id: `${KNOWLEDGE_BASE_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    ...(option.tone ? { tone: option.tone } : {}),
  }));
}

export function getKnowledgeBaseBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: KNOWLEDGE_BASE_STATUS_DICT_KEY,
      version: KNOWLEDGE_BASE_DICT_VERSION,
      items: createItems(),
    },
  ];
}
