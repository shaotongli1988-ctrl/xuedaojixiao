/**
 * 培训课程纯逻辑辅助。
 * 这里只封装主题 7 的状态、字段裁剪和输入归一化，不负责数据库、权限或 controller 路由。
 * 维护重点是 `published` 的可编辑字段白名单必须固定，避免后续实现静默放宽。
 */
import { CoolCommException } from '@cool-midway/core';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import { COURSE_STATUS_VALUES } from './course-dict';

export type CourseStatus = (typeof COURSE_STATUS_VALUES)[number];
const PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateActionNotAllowed
  );
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateDeleteNotAllowed
  );
const PERFORMANCE_COURSE_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.courseStatusInvalid
  );
const PERFORMANCE_COURSE_TITLE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.courseTitleRequired
  );
const PERFORMANCE_COURSE_ADD_DRAFT_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.courseAddDraftOnly
  );
const PERFORMANCE_COURSE_PUBLISHED_TITLE_EDIT_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedTitleEditDenied
  );
const PERFORMANCE_COURSE_PUBLISHED_CODE_EDIT_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedCodeEditDenied
  );
const PERFORMANCE_COURSE_PUBLISHED_CATEGORY_EDIT_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedCategoryEditDenied
  );
const PERFORMANCE_COURSE_PUBLISHED_START_DATE_EDIT_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedStartDateEditDenied
  );

export interface CourseSnapshot {
  title: string;
  code: string | null;
  category: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: CourseStatus;
}

export type NormalizedCoursePayload = CourseSnapshot;

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

  if (!COURSE_STATUS_VALUES.includes(status)) {
    throw new CoolCommException(PERFORMANCE_COURSE_STATUS_INVALID_MESSAGE);
  }

  return status;
}

export function normalizeCoursePayload(
  payload: any,
  fallback?: Partial<CourseSnapshot>
): NormalizedCoursePayload {
  const title = normalizeText(payload?.title) ?? fallback?.title ?? null;

  if (!title) {
    throw new CoolCommException(PERFORMANCE_COURSE_TITLE_REQUIRED_MESSAGE);
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
    throw new CoolCommException(PERFORMANCE_COURSE_ADD_DRAFT_ONLY_MESSAGE);
  }

  return normalized;
}

export function buildCourseUpdatePatch(
  current: CourseSnapshot,
  payload: any
): Partial<NormalizedCoursePayload> {
  if (current.status === 'closed') {
    throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
  }

  const normalized = normalizeCoursePayload(payload, current);

  if (current.status === 'draft') {
    if (normalized.status === 'closed') {
      throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
    }

    return normalized;
  }

  if (normalized.title !== current.title) {
    throw new CoolCommException(
      PERFORMANCE_COURSE_PUBLISHED_TITLE_EDIT_DENIED_MESSAGE
    );
  }

  if ((normalized.code ?? null) !== (current.code ?? null)) {
    throw new CoolCommException(
      PERFORMANCE_COURSE_PUBLISHED_CODE_EDIT_DENIED_MESSAGE
    );
  }

  if ((normalized.category ?? null) !== (current.category ?? null)) {
    throw new CoolCommException(
      PERFORMANCE_COURSE_PUBLISHED_CATEGORY_EDIT_DENIED_MESSAGE
    );
  }

  if ((normalized.startDate ?? null) !== (current.startDate ?? null)) {
    throw new CoolCommException(
      PERFORMANCE_COURSE_PUBLISHED_START_DATE_EDIT_DENIED_MESSAGE
    );
  }

  if (!['published', 'closed'].includes(normalized.status)) {
    throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
  }

  return {
    description: normalized.description,
    endDate: normalized.endDate,
    status: normalized.status,
  };
}

export function assertCourseDeletable(status: CourseStatus) {
  if (status !== 'draft') {
    throw new CoolCommException(PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE);
  }
}
