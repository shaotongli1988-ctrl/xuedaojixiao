/**
 * 自动建议纯逻辑工具。
 * 这里负责建议触发、状态流转和撤销审计校验，不处理数据库、权限上下文或正式单据创建。
 */
import { CoolCommException } from '@cool-midway/core';

export type SuggestionType = 'pip' | 'promotion';
export type SuggestionStatus =
  | 'pending'
  | 'accepted'
  | 'ignored'
  | 'rejected'
  | 'revoked';
export type SuggestionAction = 'accept' | 'ignore' | 'reject' | 'revoke';
export const SUGGESTION_ACTIVE_STATUSES: SuggestionStatus[] = [
  'pending',
  'accepted',
];

export const SUGGESTION_RULE_VERSION = 'suggestion-rule-v1';

const REVOKE_REASON_CODES = [
  'thresholdError',
  'assessmentCorrected',
  'scopeError',
  'duplicateSuggestion',
] as const;

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
      suggestionType: 'pip',
      triggerLabel: '命中 PIP 建议规则',
      triggerGrade: grade,
      triggerScore: score,
    };
  }

  if ((grade === 'S' || grade === 'A') && score !== null && score >= 80) {
    return {
      suggestionType: 'promotion',
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
      if (currentStatus !== 'pending') {
        throw new CoolCommException('当前状态不允许执行该操作');
      }
      return;
    case 'revoke':
      if (!isHr) {
        throw new CoolCommException('只有 HR 可以撤销建议');
      }
      if (currentStatus !== 'pending' && currentStatus !== 'accepted') {
        throw new CoolCommException('当前状态不允许执行该操作');
      }
      return;
    default:
      throw new CoolCommException('不支持的建议动作');
  }
}

export function nextSuggestionStatus(
  action: SuggestionAction
): SuggestionStatus {
  switch (action) {
    case 'accept':
      return 'accepted';
    case 'ignore':
      return 'ignored';
    case 'reject':
      return 'rejected';
    case 'revoke':
      return 'revoked';
    default:
      throw new CoolCommException('不支持的建议动作');
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
