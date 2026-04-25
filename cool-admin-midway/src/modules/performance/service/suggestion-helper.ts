/**
 * 自动建议纯逻辑工具。
 * 这里负责建议触发、状态流转和撤销审计校验，不处理数据库、权限上下文或正式单据创建。
 */
import { CoolCommException } from '@cool-midway/core';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  SUGGESTION_REVOKE_REASON_CODE_VALUES,
  SUGGESTION_STATUS_VALUES,
  SUGGESTION_TYPE_VALUES,
} from './suggestion-dict';

export type SuggestionType = (typeof SUGGESTION_TYPE_VALUES)[number];
export type SuggestionStatus = (typeof SUGGESTION_STATUS_VALUES)[number];
export type SuggestionAction = 'accept' | 'ignore' | 'reject' | 'revoke';
const [SUGGESTION_TYPE_PIP, SUGGESTION_TYPE_PROMOTION] = SUGGESTION_TYPE_VALUES;
const [SUGGESTION_PENDING_STATUS, SUGGESTION_ACCEPTED_STATUS] =
  SUGGESTION_STATUS_VALUES;
export const SUGGESTION_ACTIVE_STATUSES: SuggestionStatus[] = [
  SUGGESTION_PENDING_STATUS,
  SUGGESTION_ACCEPTED_STATUS,
];

export const SUGGESTION_RULE_VERSION = 'suggestion-rule-v1';

const REVOKE_REASON_CODES = SUGGESTION_REVOKE_REASON_CODE_VALUES;
const PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateActionNotAllowed
  );
const PERFORMANCE_SUGGESTION_ACTION_UNSUPPORTED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.suggestionActionUnsupported
  );
const PERFORMANCE_SUGGESTION_REVOKE_HR_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.suggestionRevokeHrOnly
  );

export type RevokeReasonCode = (typeof REVOKE_REASON_CODES)[number];

export interface SuggestionAssessmentSnapshot {
  id: number;
  status?: string | null;
  grade?: string | null;
  totalScore?: number | string | null;
  employeeId: number;
  departmentId: number;
  periodType: string;
  periodValue: string;
  tenantId?: number | null;
}

export interface SuggestionCandidate {
  suggestionType: SuggestionType;
  triggerLabel: string;
  triggerGrade: string | null;
  triggerScore: number | null;
}

function normalizeScore(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

export function deriveSuggestionCandidate(
  assessment: SuggestionAssessmentSnapshot
): SuggestionCandidate | null {
  if (assessment.status !== 'approved') {
    return null;
  }

  const grade = String(assessment.grade || '').trim();
  const score = normalizeScore(assessment.totalScore);

  if (grade === 'C' && score !== null && score < 70) {
    return {
      suggestionType: SUGGESTION_TYPE_PIP,
      triggerLabel: '命中 PIP 建议规则',
      triggerGrade: grade,
      triggerScore: score,
    };
  }

  if ((grade === 'S' || grade === 'A') && score !== null && score >= 80) {
    return {
      suggestionType: SUGGESTION_TYPE_PROMOTION,
      triggerLabel: '命中晋升建议规则',
      triggerGrade: grade,
      triggerScore: score,
    };
  }

  return null;
}

export function resolveSuggestionTrigger(
  assessment: SuggestionAssessmentSnapshot
) {
  return deriveSuggestionCandidate(assessment);
}

export function assertSuggestionTransition(
  currentStatus: SuggestionStatus,
  action: SuggestionAction,
  isHr: boolean
) {
  switch (action) {
    case 'accept':
    case 'ignore':
    case 'reject':
      if (currentStatus !== SUGGESTION_PENDING_STATUS) {
        throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
      }
      return;
    case 'revoke':
      if (!isHr) {
        throw new CoolCommException(PERFORMANCE_SUGGESTION_REVOKE_HR_ONLY_MESSAGE);
      }
      if (
        currentStatus !== SUGGESTION_PENDING_STATUS &&
        currentStatus !== SUGGESTION_ACCEPTED_STATUS
      ) {
        throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
      }
      return;
    default:
      throw new CoolCommException(
        PERFORMANCE_SUGGESTION_ACTION_UNSUPPORTED_MESSAGE
      );
  }
}

export function nextSuggestionStatus(
  action: SuggestionAction
): SuggestionStatus {
  switch (action) {
    case 'accept':
      return SUGGESTION_STATUS_VALUES[1];
    case 'ignore':
      return SUGGESTION_STATUS_VALUES[2];
    case 'reject':
      return SUGGESTION_STATUS_VALUES[3];
    case 'revoke':
      return SUGGESTION_STATUS_VALUES[4];
    default:
      throw new CoolCommException(
        PERFORMANCE_SUGGESTION_ACTION_UNSUPPORTED_MESSAGE
      );
  }
}

export function resolveSuggestionStatusTransition(
  currentStatus: SuggestionStatus,
  action: SuggestionAction,
  isHr = false
) {
  assertSuggestionTransition(currentStatus, action, isHr);
  return nextSuggestionStatus(action);
}

export function validateRevokePayload(payload: {
  revokeReasonCode?: string;
  revokeReason?: string;
}) {
  if (!REVOKE_REASON_CODES.includes(payload.revokeReasonCode as RevokeReasonCode)) {
    throw new CoolCommException('撤销原因编码不合法');
  }

  if (!String(payload.revokeReason || '').trim()) {
    throw new CoolCommException('撤销原因不能为空');
  }
}
