/**
 * 职位标准业务字典事实源。
 * 这里只负责主题17状态值域与展示字典导出，不负责页面权限、部门范围或招聘联动。
 * 维护重点是服务端值域校验与多端展示标签必须同源。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface JobStandardOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const JOB_STANDARD_STATUS_VALUES = [
  'draft',
  'active',
  'inactive',
] as const;

export const JOB_STANDARD_STATUS_DICT_KEY =
  'performance.jobStandard.status';
export const JOB_STANDARD_DICT_VERSION = 'job-standard-v1';

const JOB_STANDARD_STATUS_OPTIONS: ReadonlyArray<JobStandardOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'warning',
  },
  {
    value: 'active',
    label: '已启用',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'inactive',
    label: '已停用',
    orderNum: 30,
    tone: 'info',
  },
];

function createItems(): BusinessDictItem[] {
  return JOB_STANDARD_STATUS_OPTIONS.map(option => ({
    id: `${JOB_STANDARD_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getJobStandardBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: JOB_STANDARD_STATUS_DICT_KEY,
      version: JOB_STANDARD_DICT_VERSION,
      items: createItems(),
    },
  ];
}
