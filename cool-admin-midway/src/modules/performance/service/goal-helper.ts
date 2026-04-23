/**
 * 目标地图纯逻辑工具。
 * 这里只放进度、日期和状态流转等可测试规则，不处理数据库访问或权限上下文。
 */
import { CoolCommException } from '@cool-midway/core';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import { GOAL_STATUS_VALUES } from './goal-dict';

export type GoalStatus = 'draft' | 'in-progress' | 'completed' | 'cancelled';

export interface GoalValuePayload {
  targetValue: number;
  currentValue?: number;
  startDate: string;
  endDate: string;
}

const PERFORMANCE_TARGET_VALUE_POSITIVE_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.targetValuePositive
  );
const PERFORMANCE_DATE_RANGE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeRequired
  );
const PERFORMANCE_DATE_RANGE_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeInvalid
  );
const PERFORMANCE_GOAL_CURRENT_VALUE_NON_NEGATIVE_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalCurrentValueNonNegative
  );
const PERFORMANCE_GOAL_COMPLETED_ROLLBACK_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalCompletedRollbackDenied
  );
const PERFORMANCE_GOAL_COMPLETED_PROGRESS_UPDATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalCompletedProgressUpdateDenied
  );
const PERFORMANCE_GOAL_CANCELLED_PROGRESS_UPDATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalCancelledProgressUpdateDenied
  );
const PERFORMANCE_GOAL_EDIT_STATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalEditStateDenied
  );

export function normalizeGoalNumber(value: any): number {
  return Number(Number(value || 0).toFixed(2));
}

export function validateGoalPayload(payload: GoalValuePayload) {
  const targetValue = normalizeGoalNumber(payload.targetValue);
  const currentValue = normalizeGoalNumber(payload.currentValue || 0);

  if (targetValue <= 0) {
    throw new CoolCommException(PERFORMANCE_TARGET_VALUE_POSITIVE_MESSAGE);
  }

  if (currentValue < 0) {
    throw new CoolCommException(
      PERFORMANCE_GOAL_CURRENT_VALUE_NON_NEGATIVE_MESSAGE
    );
  }

  if (!payload.startDate || !payload.endDate) {
    throw new CoolCommException(PERFORMANCE_DATE_RANGE_REQUIRED_MESSAGE);
  }

  if (payload.startDate > payload.endDate) {
    throw new CoolCommException(PERFORMANCE_DATE_RANGE_INVALID_MESSAGE);
  }
}

export function calculateGoalProgressRate(
  currentValue: number,
  targetValue: number
): number {
  const current = normalizeGoalNumber(currentValue);
  const target = normalizeGoalNumber(targetValue);

  if (target <= 0) {
    throw new CoolCommException(PERFORMANCE_TARGET_VALUE_POSITIVE_MESSAGE);
  }

  if (current <= 0) {
    return 0;
  }

  return Number(Math.min((current / target) * 100, 100).toFixed(2));
}

export function resolveGoalStatusForStoredValue(
  currentStatus: GoalStatus,
  currentValue: number,
  targetValue: number
): GoalStatus {
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }

  if (calculateGoalProgressRate(currentValue, targetValue) >= 100) {
    return 'completed';
  }

  if (currentStatus === 'completed') {
    throw new CoolCommException(
      PERFORMANCE_GOAL_COMPLETED_ROLLBACK_DENIED_MESSAGE
    );
  }

  return currentValue > 0 || currentStatus === 'in-progress'
    ? 'in-progress'
    : 'draft';
}

export function resolveGoalStatusAfterProgress(
  currentStatus: GoalStatus,
  currentValue: number,
  targetValue: number
): GoalStatus {
  if (currentStatus === 'completed') {
    throw new CoolCommException(
      PERFORMANCE_GOAL_COMPLETED_PROGRESS_UPDATE_DENIED_MESSAGE
    );
  }

  if (currentStatus === 'cancelled') {
    throw new CoolCommException(
      PERFORMANCE_GOAL_CANCELLED_PROGRESS_UPDATE_DENIED_MESSAGE
    );
  }

  if (calculateGoalProgressRate(currentValue, targetValue) >= 100) {
    return 'completed';
  }

  return 'in-progress';
}

export function assertGoalUpdatable(status: GoalStatus) {
  if (
    !GOAL_STATUS_VALUES.some(
      item => item === status && (item === 'draft' || item === 'in-progress')
    )
  ) {
    throw new CoolCommException(PERFORMANCE_GOAL_EDIT_STATE_DENIED_MESSAGE);
  }
}
