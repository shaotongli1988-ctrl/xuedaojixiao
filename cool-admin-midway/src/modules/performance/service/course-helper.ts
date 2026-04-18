/**
 * 培训课程纯逻辑辅助。
 * 这里只封装主题 7 的状态、字段裁剪和输入归一化，不负责数据库、权限或 controller 路由。
 * 维护重点是 `published` 的可编辑字段白名单必须固定，避免后续实现静默放宽。
 */
import { CoolCommException } from '@cool-midway/core';

export type CourseStatus = 'draft' | 'published' | 'closed';

export interface CourseSnapshot {
  title: string;
  code: string | null;
  category: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: CourseStatus;
}

export interface NormalizedCoursePayload extends CourseSnapshot {}

const COURSE_STATUS: CourseStatus[] = ['draft', 'published', 'closed'];

const normalizeText = (value: any) => {
  const normalized = value === undefined || value === null ? '' : String(value);
  const trimmed = normalized.trim();
  return trimmed ? trimmed : null;
};

export function normalizeCourseStatus(
  value: any,
  fallback: CourseStatus = 'draft'
): CourseStatus {
  const status = String(value ?? fallback).trim() as CourseStatus;

  if (!COURSE_STATUS.includes(status)) {
    throw new CoolCommException('课程状态不合法');
  }

  return status;
}

export function normalizeCoursePayload(
  payload: any,
  fallback?: Partial<CourseSnapshot>
): NormalizedCoursePayload {
  const title = normalizeText(payload?.title) ?? fallback?.title ?? null;

  if (!title) {
    throw new CoolCommException('课程标题不能为空');
  }

  return {
    title,
    code: normalizeText(payload?.code) ?? fallback?.code ?? null,
    category: normalizeText(payload?.category) ?? fallback?.category ?? null,
    description:
      normalizeText(payload?.description) ?? fallback?.description ?? null,
    startDate: normalizeText(payload?.startDate) ?? fallback?.startDate ?? null,
    endDate: normalizeText(payload?.endDate) ?? fallback?.endDate ?? null,
    status: normalizeCourseStatus(payload?.status, fallback?.status ?? 'draft'),
  };
}

export function normalizeCourseAddPayload(payload: any): NormalizedCoursePayload {
  const normalized = normalizeCoursePayload(payload, {
    status: 'draft',
  });

  if (normalized.status !== 'draft') {
    throw new CoolCommException('新建课程默认保存为草稿');
  }

  return normalized;
}

export function buildCourseUpdatePatch(
  current: CourseSnapshot,
  payload: any
): Partial<NormalizedCoursePayload> {
  if (current.status === 'closed') {
    throw new CoolCommException('当前状态不允许编辑');
  }

  const normalized = normalizeCoursePayload(payload, current);

  if (current.status === 'draft') {
    if (normalized.status === 'closed') {
      throw new CoolCommException('当前状态不允许执行该操作');
    }

    return normalized;
  }

  if (normalized.title !== current.title) {
    throw new CoolCommException('已发布课程不允许修改标题');
  }

  if ((normalized.code ?? null) !== (current.code ?? null)) {
    throw new CoolCommException('已发布课程不允许修改编码');
  }

  if ((normalized.category ?? null) !== (current.category ?? null)) {
    throw new CoolCommException('已发布课程不允许修改分类');
  }

  if ((normalized.startDate ?? null) !== (current.startDate ?? null)) {
    throw new CoolCommException('已发布课程不允许修改开始日期');
  }

  if (!['published', 'closed'].includes(normalized.status)) {
    throw new CoolCommException('当前状态不允许执行该操作');
  }

  return {
    description: normalized.description,
    endDate: normalized.endDate,
    status: normalized.status,
  };
}

export function assertCourseDeletable(status: CourseStatus) {
  if (status !== 'draft') {
    throw new CoolCommException('当前状态不允许删除');
  }
}
