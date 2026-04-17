/**
 * 晋升模块纯规则工具。
 * 这里只封装状态流转、评审结论和创建入参校验，不负责数据库读写或权限查询。
 * 维护重点是所有状态和值必须与唯一事实源固定保持一致。
 */
import { CoolCommException } from '@cool-midway/core';

export type PromotionStatus = 'draft' | 'reviewing' | 'approved' | 'rejected';
export type PromotionDecision = 'approved' | 'rejected';
type PromotionAction = 'submit' | PromotionDecision;

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
    throw new CoolCommException('当前状态不允许执行该操作');
  }
}

export function validatePromotionPayload(payload: PromotionPayloadInput) {
  if (!Number(payload.employeeId)) {
    throw new CoolCommException('员工不能为空');
  }

  if (!Number(payload.sponsorId)) {
    throw new CoolCommException('发起人不能为空');
  }

  if (!String(payload.fromPosition || '').trim()) {
    throw new CoolCommException('当前岗位不能为空');
  }

  if (!String(payload.toPosition || '').trim()) {
    throw new CoolCommException('目标岗位不能为空');
  }

  if (!normalizeNullableNumber(payload.assessmentId)) {
    if (!String(payload.sourceReason || '').trim()) {
      throw new CoolCommException('独立创建时必须填写原因说明');
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
  throw new CoolCommException('评审结论不正确');
}
