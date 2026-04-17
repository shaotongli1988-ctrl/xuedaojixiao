/**
 * 评估单纯逻辑工具。
 * 这里只放总分、等级和状态流转等可测试规则，不处理数据库访问或权限上下文。
 */
import { CoolCommException } from '@cool-midway/core';

export type AssessmentStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type AssessmentAction = 'save' | 'submit' | 'approve' | 'reject';

export interface AssessmentScoreInput {
  indicatorId?: number | null;
  indicatorName: string;
  score: number;
  weight: number;
  comment?: string;
}

export interface AssessmentScoreOutput extends AssessmentScoreInput {
  weightedScore: number;
}

export function normalizeAssessmentScores(
  items: AssessmentScoreInput[] = []
): AssessmentScoreInput[] {
  return items.map(item => {
    return {
      indicatorId: item.indicatorId ? Number(item.indicatorId) : null,
      indicatorName: String(item.indicatorName || '').trim(),
      score: Number(item.score || 0),
      weight: Number(item.weight || 0),
      comment: item.comment ? String(item.comment).trim() : '',
    };
  });
}

export function calculateAssessmentTotalScore(
  items: AssessmentScoreInput[] = []
): number {
  const scores = normalizeAssessmentScores(items);

  if (!scores.length) {
    throw new CoolCommException('评分明细不能为空');
  }

  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) {
    throw new CoolCommException('评分权重总和必须大于 0');
  }

  const total = scores.reduce((sum, item) => sum + item.score * item.weight, 0);

  return Number((total / totalWeight).toFixed(2));
}

export function resolveAssessmentGrade(score: number): 'S' | 'A' | 'B' | 'C' {
  const value = Number(score);

  if (value >= 90) {
    return 'S';
  }

  if (value >= 80) {
    return 'A';
  }

  if (value >= 70) {
    return 'B';
  }

  return 'C';
}

export function buildWeightedScoreItems(
  items: AssessmentScoreInput[] = []
): AssessmentScoreOutput[] {
  const scores = normalizeAssessmentScores(items);
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);

  return scores.map(item => {
    return {
      ...item,
      weightedScore:
        totalWeight > 0
          ? Number(((item.score * item.weight) / totalWeight).toFixed(2))
          : 0,
    };
  });
}

export function assertAssessmentTransition(
  currentStatus: AssessmentStatus,
  action: AssessmentAction
) {
  const transitionMap: Record<
    AssessmentAction,
    AssessmentStatus[]
  > = {
    save: ['draft', 'rejected'],
    submit: ['draft'],
    approve: ['submitted'],
    reject: ['submitted'],
  };

  if (!transitionMap[action].includes(currentStatus)) {
    throw new CoolCommException('当前状态不允许执行该操作');
  }
}
