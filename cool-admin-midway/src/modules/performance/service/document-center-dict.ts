/**
 * 文件中心业务字典事实源。
 * 这里只负责 document-center 域分类、文件类型、存储、密级和状态字典导出，不负责文件元数据 CRUD。
 * 维护重点是主题21文件中心的筛选项、表单选项和标签展示必须与服务端合法值集合同源。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface DocumentCenterOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const DOCUMENT_CENTER_CATEGORY_VALUES = [
  'policy',
  'process',
  'template',
  'contract',
  'archive',
  'other',
] as const;
export const DOCUMENT_CENTER_FILE_TYPE_VALUES = [
  'pdf',
  'doc',
  'xls',
  'ppt',
  'img',
  'zip',
  'other',
] as const;
export const DOCUMENT_CENTER_STORAGE_VALUES = [
  'local',
  'cloud',
  'hybrid',
] as const;
export const DOCUMENT_CENTER_CONFIDENTIALITY_VALUES = [
  'public',
  'internal',
  'secret',
] as const;
export const DOCUMENT_CENTER_STATUS_VALUES = [
  'draft',
  'review',
  'published',
  'archived',
] as const;

export const DOCUMENT_CENTER_CATEGORY_DICT_KEY = 'performance.documentCenter.category';
export const DOCUMENT_CENTER_FILE_TYPE_DICT_KEY = 'performance.documentCenter.fileType';
export const DOCUMENT_CENTER_STORAGE_DICT_KEY = 'performance.documentCenter.storage';
export const DOCUMENT_CENTER_CONFIDENTIALITY_DICT_KEY =
  'performance.documentCenter.confidentiality';
export const DOCUMENT_CENTER_STATUS_DICT_KEY = 'performance.documentCenter.status';
export const DOCUMENT_CENTER_DICT_VERSION = 'document-center-v1';

const DOCUMENT_CENTER_CATEGORY_OPTIONS: ReadonlyArray<DocumentCenterOption> = [
  { value: 'policy', label: '制度', orderNum: 10 },
  { value: 'process', label: '流程', orderNum: 20 },
  { value: 'template', label: '模板', orderNum: 30 },
  { value: 'contract', label: '合同', orderNum: 40 },
  { value: 'archive', label: '归档', orderNum: 50 },
  { value: 'other', label: '其他', orderNum: 60 },
];

const DOCUMENT_CENTER_FILE_TYPE_OPTIONS: ReadonlyArray<DocumentCenterOption> = [
  { value: 'pdf', label: 'PDF', orderNum: 10 },
  { value: 'doc', label: 'DOC', orderNum: 20 },
  { value: 'xls', label: 'XLS', orderNum: 30 },
  { value: 'ppt', label: 'PPT', orderNum: 40 },
  { value: 'img', label: '图片', orderNum: 50 },
  { value: 'zip', label: 'ZIP', orderNum: 60 },
  { value: 'other', label: '其他', orderNum: 70 },
];

const DOCUMENT_CENTER_STORAGE_OPTIONS: ReadonlyArray<DocumentCenterOption> = [
  { value: 'local', label: '本地', orderNum: 10 },
  { value: 'cloud', label: '云端', orderNum: 20 },
  { value: 'hybrid', label: '混合', orderNum: 30 },
];

const DOCUMENT_CENTER_CONFIDENTIALITY_OPTIONS: ReadonlyArray<DocumentCenterOption> = [
  { value: 'public', label: '公开', orderNum: 10, tone: 'success' },
  { value: 'internal', label: '内部', orderNum: 20, tone: 'warning' },
  { value: 'secret', label: '机密', orderNum: 30, tone: 'danger' },
];

const DOCUMENT_CENTER_STATUS_OPTIONS: ReadonlyArray<DocumentCenterOption> = [
  { value: 'draft', label: '草稿', orderNum: 10, tone: 'info' },
  { value: 'review', label: '待审核', orderNum: 20, tone: 'warning' },
  { value: 'published', label: '已发布', orderNum: 30, tone: 'success' },
  { value: 'archived', label: '已归档', orderNum: 40, tone: 'info' },
];

function createItems(
  key: string,
  options: ReadonlyArray<DocumentCenterOption>
): BusinessDictItem[] {
  return options.map(option => ({
    id: `${key}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    ...(option.tone ? { tone: option.tone } : {}),
  }));
}

export function getDocumentCenterBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: DOCUMENT_CENTER_CATEGORY_DICT_KEY,
      version: DOCUMENT_CENTER_DICT_VERSION,
      items: createItems(
        DOCUMENT_CENTER_CATEGORY_DICT_KEY,
        DOCUMENT_CENTER_CATEGORY_OPTIONS
      ),
    },
    {
      key: DOCUMENT_CENTER_FILE_TYPE_DICT_KEY,
      version: DOCUMENT_CENTER_DICT_VERSION,
      items: createItems(
        DOCUMENT_CENTER_FILE_TYPE_DICT_KEY,
        DOCUMENT_CENTER_FILE_TYPE_OPTIONS
      ),
    },
    {
      key: DOCUMENT_CENTER_STORAGE_DICT_KEY,
      version: DOCUMENT_CENTER_DICT_VERSION,
      items: createItems(
        DOCUMENT_CENTER_STORAGE_DICT_KEY,
        DOCUMENT_CENTER_STORAGE_OPTIONS
      ),
    },
    {
      key: DOCUMENT_CENTER_CONFIDENTIALITY_DICT_KEY,
      version: DOCUMENT_CENTER_DICT_VERSION,
      items: createItems(
        DOCUMENT_CENTER_CONFIDENTIALITY_DICT_KEY,
        DOCUMENT_CENTER_CONFIDENTIALITY_OPTIONS
      ),
    },
    {
      key: DOCUMENT_CENTER_STATUS_DICT_KEY,
      version: DOCUMENT_CENTER_DICT_VERSION,
      items: createItems(
        DOCUMENT_CENTER_STATUS_DICT_KEY,
        DOCUMENT_CENTER_STATUS_OPTIONS
      ),
    },
  ];
}
