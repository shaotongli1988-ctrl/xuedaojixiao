/**
 * 课程业务字典事实源。
 * 这里只负责 course 域状态字典导出，不负责报名摘要、学习增强或课程编辑权限。
 * 维护重点是服务端合法状态集合与多端展示标签必须同源，避免课程状态继续在页面和类型文件里各写一份。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface CourseOption {
  value: string;
  label: string;
  orderNum: number;
  tone: string;
}

export const COURSE_STATUS_VALUES = [
  'draft',
  'published',
  'closed',
] as const;

export const COURSE_STATUS_DICT_KEY = 'performance.course.status';
export const COURSE_DICT_VERSION = 'course-v1';

const COURSE_STATUS_OPTIONS: ReadonlyArray<CourseOption> = [
  {
    value: 'draft',
    label: '草稿',
    orderNum: 10,
    tone: 'warning',
  },
  {
    value: 'published',
    label: '已发布',
    orderNum: 20,
    tone: 'success',
  },
  {
    value: 'closed',
    label: '已关闭',
    orderNum: 30,
    tone: 'info',
  },
];

function createItems(): BusinessDictItem[] {
  return COURSE_STATUS_OPTIONS.map(option => ({
    id: `${COURSE_STATUS_DICT_KEY}:${option.value}`,
    name: option.label,
    value: option.value,
    orderNum: option.orderNum,
    parentId: null,
    tone: option.tone,
  }));
}

export function getCourseBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: COURSE_STATUS_DICT_KEY,
      version: COURSE_DICT_VERSION,
      items: createItems(),
    },
  ];
}
