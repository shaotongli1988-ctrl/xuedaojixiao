/**
 * 目标地图纯逻辑工具。
 * 这里只放进度、日期和状态流转等可测试规则，不处理数据库访问或权限上下文。
 */
import { CoolCommException } from '@cool-midway/core';

export type GoalStatus = 'draft' | 'in-progress' | 'completed' | 'cancelled';

export interface GoalValuePayload {
  targetValue: number;
  currentValue?: number;
  startDate: string;
  endDate: string;
}

export function normalizeGoalNumber(value: any): number {
  return Number(Number(value || 0).toFixed(2));
}

export function validateGoalPayload(payload: GoalValuePayload) {
  const targetValue = normalizeGoalNumber(payload.targetValue);
  const currentValue = normalizeGoalNumber(payload.currentValue || 0);

  if (targetValue <= 0) {
    throw new CoolCommException('目标值必须大于 0');
  }

  if (currentValue < 0) {
    throw new CoolCommException('当前值不能小于 0');
  }

  if (!payload.startDate || !payload.endDate) {
    throw new CoolCommException('开始日期和结束日期不能为空');
  }

  if (payload.startDate > payload.endDate) {
    throw new CoolCommException('开始日期不能晚于结束日期');
  }
}

export function calculateGoalProgressRate(
  currentValue: number,
  targetValue: number
): number {
  const current = normalizeGoalNumber(currentValue);
  const target = normalizeGoalNumber(targetValue);

  if (target <= 0) {
    throw new CoolCommException('目标值必须大于 0');
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
    throw new CoolCommException('已完成目标不能回退为进行中');
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
    throw new CoolCommException('已完成目标不能继续更新进度');
  }

  if (currentStatus === 'cancelled') {
    throw new CoolCommException('已取消目标不能继续更新进度');
  }

  if (calculateGoalProgressRate(currentValue, targetValue) >= 100) {
    return 'completed';
  }

  return 'in-progress';
}

export function assertGoalUpdatable(status: GoalStatus) {
  if (!['draft', 'in-progress'].includes(status)) {
    throw new CoolCommException('当前状态不允许编辑目标');
  }
}
