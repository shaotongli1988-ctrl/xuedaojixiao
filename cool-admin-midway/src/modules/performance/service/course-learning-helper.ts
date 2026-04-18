/**
 * 课程学习增强纯逻辑辅助。
 * 这里只封装主题14的状态、分页、提交入参和考试摘要计算，不负责数据库、权限或控制器路由。
 * 维护重点是禁止把主题14扩写为真实 AI 供应商协议或额外状态机。
 */
import { CoolCommException } from '@cool-midway/core';

export type CourseLearningTaskStatus = 'pending' | 'submitted' | 'evaluated';
export type CourseExamResultStatus = 'locked' | 'pending' | 'passed' | 'failed';

const TASK_STATUS_SET: CourseLearningTaskStatus[] = [
  'pending',
  'submitted',
  'evaluated',
];

export const DEFAULT_COURSE_EXAM_PASS_THRESHOLD = 60;

export function normalizePositiveInteger(
  value: any,
  fieldName: string,
  fallback?: number
) {
  if (
    (value === undefined || value === null || value === '') &&
    fallback !== undefined
  ) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(`${fieldName}不合法`);
  }
  return parsed;
}

export function normalizeTaskStatus(
  value: any
): CourseLearningTaskStatus | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const status = String(value).trim() as CourseLearningTaskStatus;
  if (!TASK_STATUS_SET.includes(status)) {
    throw new CoolCommException('任务状态不合法');
  }
  return status;
}

export function normalizeSubmissionText(value: any) {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new CoolCommException('submissionText 不能为空');
  }
  return text;
}

export function normalizeNullableScore(value: any): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const score = Number(value);
  if (!Number.isFinite(score)) {
    return null;
  }
  return Number(score.toFixed(2));
}

export function normalizeNullableText(value: any): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const text = String(value).trim();
  return text ? text : null;
}

export function resolveCourseExamResultStatus(input: {
  hasTask: boolean;
  hasSubmitted: boolean;
  hasEvaluated: boolean;
  latestScore: number | null;
  passThreshold: number | null;
  enrollmentStatus?: string | null;
}): CourseExamResultStatus {
  if (!input.hasTask) {
    return 'locked';
  }

  if (!input.hasEvaluated) {
    return input.hasSubmitted ? 'pending' : 'locked';
  }

  const enrollmentStatus = String(input.enrollmentStatus || '')
    .trim()
    .toLowerCase();

  if (enrollmentStatus === 'failed') {
    return 'failed';
  }

  if (enrollmentStatus === 'passed') {
    return 'passed';
  }

  if (input.latestScore === null || input.passThreshold === null) {
    return 'pending';
  }

  return input.latestScore >= input.passThreshold ? 'passed' : 'failed';
}

export function buildCourseExamSummaryText(
  status: CourseExamResultStatus,
  latestScore: number | null
) {
  switch (status) {
    case 'locked':
      return '前置学习任务未满足，结果摘要暂不可见';
    case 'pending':
      return '结果摘要生成中';
    case 'passed':
      return latestScore === null
        ? '结果摘要已生成，当前状态为通过'
        : `最近结果 ${latestScore} 分，已通过`;
    case 'failed':
      return latestScore === null
        ? '结果摘要已生成，当前状态为未通过'
        : `最近结果 ${latestScore} 分，未通过`;
    default:
      return null;
  }
}

export function pickLatestTime(values: Array<any>) {
  const normalized = values
    .map(item => normalizeNullableText(item))
    .filter(Boolean) as string[];

  if (!normalized.length) {
    return null;
  }

  return normalized.sort().slice(-1)[0];
}
