/**
 * 课程学习业务字典事实源。
 * 这里只负责 course-learning 域任务状态和考试结果状态字典导出，不负责任务列表、提交或考试摘要计算。
 * 维护重点是 Web/Uni 对学习状态的展示口径必须与 helper 中的合法值集合同源。
 */
import type { BusinessDictGroup, BusinessDictItem } from './indicator-dict';

interface CourseLearningOption {
  value: string;
  label: string;
  orderNum: number;
  tone?: string;
}

export const COURSE_LEARNING_TASK_STATUS_VALUES = [
  'pending',
  'submitted',
  'evaluated',
] as const;
export const COURSE_LEARNING_EXAM_STATUS_VALUES = [
  'locked',
  'pending',
  'passed',
  'failed',
] as const;

export const COURSE_LEARNING_TASK_STATUS_DICT_KEY =
  'performance.courseLearning.taskStatus';
export const COURSE_LEARNING_EXAM_STATUS_DICT_KEY =
  'performance.courseLearning.examStatus';
export const COURSE_LEARNING_DICT_VERSION = 'course-learning-v1';

const COURSE_LEARNING_TASK_STATUS_OPTIONS: ReadonlyArray<CourseLearningOption> = [
  { value: 'pending', label: '待完成', orderNum: 10, tone: 'warning' },
  { value: 'submitted', label: '已提交', orderNum: 20, tone: 'info' },
  { value: 'evaluated', label: '已评估', orderNum: 30, tone: 'success' },
];

const COURSE_LEARNING_EXAM_STATUS_OPTIONS: ReadonlyArray<CourseLearningOption> = [
  { value: 'locked', label: '未解锁', orderNum: 10, tone: 'info' },
  { value: 'pending', label: '待生成', orderNum: 20, tone: 'warning' },
  { value: 'passed', label: '已通过', orderNum: 30, tone: 'success' },
  { value: 'failed', label: '未通过', orderNum: 40, tone: 'danger' },
];

function createItems(
  key: string,
  options: ReadonlyArray<CourseLearningOption>
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

export function getCourseLearningBusinessDictGroups(): BusinessDictGroup[] {
  return [
    {
      key: COURSE_LEARNING_TASK_STATUS_DICT_KEY,
      version: COURSE_LEARNING_DICT_VERSION,
      items: createItems(
        COURSE_LEARNING_TASK_STATUS_DICT_KEY,
        COURSE_LEARNING_TASK_STATUS_OPTIONS
      ),
    },
    {
      key: COURSE_LEARNING_EXAM_STATUS_DICT_KEY,
      version: COURSE_LEARNING_DICT_VERSION,
      items: createItems(
        COURSE_LEARNING_EXAM_STATUS_DICT_KEY,
        COURSE_LEARNING_EXAM_STATUS_OPTIONS
      ),
    },
  ];
}
