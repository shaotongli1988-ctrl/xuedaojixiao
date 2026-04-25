/**
 * 晋升模块纯规则工具。
 * 这里只封装状态流转、评审结论和创建入参校验，不负责数据库读写或权限查询。
 * 维护重点是所有状态和值必须与唯一事实源固定保持一致。
 */
import { CoolCommException } from '@cool-midway/core';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import { PROMOTION_STATUS_VALUES } from './promotion-dict';

export type PromotionStatus = (typeof PROMOTION_STATUS_VALUES)[number];
export type PromotionDecision = 'approved' | 'rejected';
type PromotionAction = 'submit' | PromotionDecision;
const PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateActionNotAllowed
  );
const PERFORMANCE_EMPLOYEE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeRequired
  );
const PERFORMANCE_PROMOTION_SPONSOR_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.promotionSponsorRequired
  );
const PERFORMANCE_PROMOTION_FROM_POSITION_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.promotionFromPositionRequired
  );
const PERFORMANCE_PROMOTION_TO_POSITION_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.promotionToPositionRequired
  );
const PERFORMANCE_PROMOTION_INDEPENDENT_REASON_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.promotionIndependentReasonRequired
  );
const PERFORMANCE_PROMOTION_DECISION_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.promotionDecisionInvalid
  );

export interface PromotionPayloadInput {
  assessmentId?: number | null;
  employeeId?: number;
  sponsorId?: number;
  fromPosition?: string;
  toPosition?: string;
  sourceReason?: string;
}

export function assertPromotionTransition(
  status: PromotionStatus,
  action: PromotionAction
) {
  const legalActions: Record<PromotionStatus, PromotionAction[]> = {
    draft: ['submit'],
    reviewing: ['approved', 'rejected'],
    approved: [],
    rejected: [],
  };

  if (!legalActions[status]?.includes(action)) {
    throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
  }
}

export function validatePromotionPayload(payload: PromotionPayloadInput) {
  if (!Number(payload.employeeId)) {
    throw new CoolCommException(PERFORMANCE_EMPLOYEE_REQUIRED_MESSAGE);
  }

  if (!Number(payload.sponsorId)) {
    throw new CoolCommException(PERFORMANCE_PROMOTION_SPONSOR_REQUIRED_MESSAGE);
  }

  if (!String(payload.fromPosition || '').trim()) {
    throw new CoolCommException(
      PERFORMANCE_PROMOTION_FROM_POSITION_REQUIRED_MESSAGE
    );
  }

  if (!String(payload.toPosition || '').trim()) {
    throw new CoolCommException(PERFORMANCE_PROMOTION_TO_POSITION_REQUIRED_MESSAGE);
  }

  if (!normalizeNullableNumber(payload.assessmentId)) {
    if (!String(payload.sourceReason || '').trim()) {
      throw new CoolCommException(
        PERFORMANCE_PROMOTION_INDEPENDENT_REASON_REQUIRED_MESSAGE
      );
    }
  }
}

export function normalizeNullableNumber(value: any) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

export function normalizePromotionDecision(value: any): PromotionDecision {
  if (value === 'approved' || value === 'rejected') {
    return value;
  }
  throw new CoolCommException(PERFORMANCE_PROMOTION_DECISION_INVALID_MESSAGE);
}
