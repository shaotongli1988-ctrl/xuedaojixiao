/**
 * 班主任渠道业务字典事实源。
 * 这里只负责 teacher-channel 域合作状态、班级状态和待办桶字典导出，不负责渠道服务的数据范围或动作门禁。
 * 维护重点是 Web/Uni 的状态标签和筛选项必须与主题19服务端合法值集合同源。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface TeacherChannelOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const TEACHER_CHANNEL_COOPERATION_STATUS_VALUES = [
  'uncontacted',
  'contacted',
  'negotiating',
  'partnered',
  'terminated',
] as const;
export const TEACHER_CHANNEL_CLASS_STATUS_VALUES = [
  'draft',
  'active',
  'closed',
] as const;
export const TEACHER_CHANNEL_TODO_BUCKET_VALUES = [
  'today',
  'overdue',
] as const;

export const TEACHER_CHANNEL_COOPERATION_STATUS_DICT_KEY =
  'performance.teacherChannel.cooperationStatus';
export const TEACHER_CHANNEL_CLASS_STATUS_DICT_KEY =
  'performance.teacherChannel.classStatus';
export const TEACHER_CHANNEL_TODO_BUCKET_DICT_KEY =
  'performance.teacherChannel.todoBucket';
export const TEACHER_CHANNEL_DICT_VERSION = 'teacher-channel-v1';

const TEACHER_CHANNEL_COOPERATION_STATUS_OPTIONS: ReadonlyArray<TeacherChannelOption> = [
  { value: 'uncontacted', label: '未建联', orderNum: 10, tone: 'info' },
  { value: 'contacted', label: '已跟进', orderNum: 20, tone: 'primary' },
  { value: 'negotiating', label: '洽谈中', orderNum: 30, tone: 'warning' },
  { value: 'partnered', label: '已合作', orderNum: 40, tone: 'success' },
  { value: 'terminated', label: '已终止', orderNum: 50, tone: 'danger' },
];

const TEACHER_CHANNEL_CLASS_STATUS_OPTIONS: ReadonlyArray<TeacherChannelOption> = [
  { value: 'draft', label: '草稿', orderNum: 10, tone: 'warning' },
  { value: 'active', label: '已启用', orderNum: 20, tone: 'success' },
  { value: 'closed', label: '已关闭', orderNum: 30, tone: 'info' },
];

const TEACHER_CHANNEL_TODO_BUCKET_OPTIONS: ReadonlyArray<TeacherChannelOption> = [
  { value: 'today', label: '今日待跟进', orderNum: 10, tone: 'warning' },
  { value: 'overdue', label: '已逾期待跟进', orderNum: 20, tone: 'danger' },
];

function createItems(
  key: string,
  options: ReadonlyArray<TeacherChannelOption>
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

export function getTeacherChannelBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: TEACHER_CHANNEL_COOPERATION_STATUS_DICT_KEY,
      version: TEACHER_CHANNEL_DICT_VERSION,
      items: createItems(
        TEACHER_CHANNEL_COOPERATION_STATUS_DICT_KEY,
        TEACHER_CHANNEL_COOPERATION_STATUS_OPTIONS
      ),
    },
    {
      key: TEACHER_CHANNEL_CLASS_STATUS_DICT_KEY,
      version: TEACHER_CHANNEL_DICT_VERSION,
      items: createItems(
        TEACHER_CHANNEL_CLASS_STATUS_DICT_KEY,
        TEACHER_CHANNEL_CLASS_STATUS_OPTIONS
      ),
    },
    {
      key: TEACHER_CHANNEL_TODO_BUCKET_DICT_KEY,
      version: TEACHER_CHANNEL_DICT_VERSION,
      items: createItems(
        TEACHER_CHANNEL_TODO_BUCKET_DICT_KEY,
        TEACHER_CHANNEL_TODO_BUCKET_OPTIONS
      ),
    },
  ];
}
