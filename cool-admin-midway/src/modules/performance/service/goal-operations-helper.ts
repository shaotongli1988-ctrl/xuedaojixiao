import { CoolCommException } from '@cool-midway/core';
import {
  GOAL_PERIOD_TYPE_VALUES,
  GOAL_SOURCE_TYPE_VALUES,
} from './goal-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';

/**
 * 目标运营台纯逻辑工具。
 * 这里只放周期、时间、贡献拆分、榜单和日报摘要等可测试规则，不处理数据库访问或权限上下文。
 */
export type GoalOpsPeriodType = 'day' | 'week' | 'month';
export type GoalOpsSourceType = 'public' | 'personal';
export type GoalOpsPlanStatus = 'assigned' | 'submitted' | 'auto_zero';
const PERFORMANCE_GOAL_OPS_PERIOD_TYPE_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodTypeInvalid
  );
const PERFORMANCE_GOAL_OPS_PERIOD_RANGE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodRangeRequired
  );
const PERFORMANCE_GOAL_OPS_PERIOD_RANGE_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodRangeInvalid
  );
const PERFORMANCE_GOAL_OPS_DAILY_PLAN_DATE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsDailyPlanDateRequired
  );
const PERFORMANCE_GOAL_OPS_PLAN_DATE_OUT_OF_RANGE_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPlanDateOutOfRange
  );
const PERFORMANCE_GOAL_OPS_SOURCE_TYPE_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsSourceTypeInvalid
  );

export interface GoalOpsPlanLike {
  id: number;
  employeeId: number;
  employeeName?: string;
  departmentId: number;
  planDate?: string | null;
  periodType: GoalOpsPeriodType;
  sourceType: GoalOpsSourceType;
  title: string;
  targetValue: number;
  actualValue: number;
  status: GoalOpsPlanStatus;
}

export interface GoalOpsOverviewRow {
  employeeId: number;
  employeeName: string;
  departmentId: number;
  publicTargetValue: number;
  publicActualValue: number;
  personalTargetValue: number;
  personalActualValue: number;
  totalTargetValue: number;
  totalActualValue: number;
  completionRate: number;
  assignedCount: number;
  submittedCount: number;
  autoZeroCount: number;
}

export function normalizeGoalOpsNumber(value: any): number {
  return Number(Number(value || 0).toFixed(2));
}

export function assertGoalOpsTime(value: any, fieldLabel: string) {
  const text = String(value || '').trim();
  if (!/^\d{2}:\d{2}$/.test(text)) {
    throw new CoolCommException(`${fieldLabel}格式必须为 HH:mm`);
  }

  const [hour, minute] = text.split(':').map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new CoolCommException(`${fieldLabel}不是有效时间`);
  }

  return text;
}

export function assertGoalOpsPeriod(
  periodType: GoalOpsPeriodType,
  periodStartDate: string,
  periodEndDate: string,
  planDate?: string | null
) {
  if (!GOAL_PERIOD_TYPE_VALUES.some(item => item === periodType)) {
    throw new CoolCommException(PERFORMANCE_GOAL_OPS_PERIOD_TYPE_INVALID_MESSAGE);
  }

  if (!periodStartDate || !periodEndDate) {
    throw new CoolCommException(PERFORMANCE_GOAL_OPS_PERIOD_RANGE_REQUIRED_MESSAGE);
  }

  if (periodStartDate > periodEndDate) {
    throw new CoolCommException(PERFORMANCE_GOAL_OPS_PERIOD_RANGE_INVALID_MESSAGE);
  }

  if (periodType === 'day') {
    if (!planDate) {
      throw new CoolCommException(
        PERFORMANCE_GOAL_OPS_DAILY_PLAN_DATE_REQUIRED_MESSAGE
      );
    }
    if (planDate < periodStartDate || planDate > periodEndDate) {
      throw new CoolCommException(PERFORMANCE_GOAL_OPS_PLAN_DATE_OUT_OF_RANGE_MESSAGE);
    }
  }
}

export function assertGoalOpsSourceType(sourceType: GoalOpsSourceType) {
  if (!GOAL_SOURCE_TYPE_VALUES.some(item => item === sourceType)) {
    throw new CoolCommException(PERFORMANCE_GOAL_OPS_SOURCE_TYPE_INVALID_MESSAGE);
  }
}

export function calculateGoalOpsCompletionRate(
  actualValue: number,
  targetValue: number
) {
  const actual = normalizeGoalOpsNumber(actualValue);
  const target = normalizeGoalOpsNumber(targetValue);

  if (target <= 0) {
    return 0;
  }

  if (actual <= 0) {
    return 0;
  }

  return Number(Math.min((actual / target) * 100, 100).toFixed(2));
}

export function buildGoalOpsOverviewRows(plans: GoalOpsPlanLike[]) {
  const grouped = new Map<number, GoalOpsOverviewRow>();

  for (const plan of plans) {
    const current =
      grouped.get(plan.employeeId) ||
      ({
        employeeId: plan.employeeId,
        employeeName: plan.employeeName || '',
        departmentId: plan.departmentId,
        publicTargetValue: 0,
        publicActualValue: 0,
        personalTargetValue: 0,
        personalActualValue: 0,
        totalTargetValue: 0,
        totalActualValue: 0,
        completionRate: 0,
        assignedCount: 0,
        submittedCount: 0,
        autoZeroCount: 0,
      } as GoalOpsOverviewRow);

    const targetValue = normalizeGoalOpsNumber(plan.targetValue);
    const actualValue = normalizeGoalOpsNumber(plan.actualValue);

    if (plan.sourceType === 'public') {
      current.publicTargetValue = normalizeGoalOpsNumber(
        current.publicTargetValue + targetValue
      );
      current.publicActualValue = normalizeGoalOpsNumber(
        current.publicActualValue + actualValue
      );
    } else {
      current.personalTargetValue = normalizeGoalOpsNumber(
        current.personalTargetValue + targetValue
      );
      current.personalActualValue = normalizeGoalOpsNumber(
        current.personalActualValue + actualValue
      );
    }

    current.totalTargetValue = normalizeGoalOpsNumber(
      current.totalTargetValue + targetValue
    );
    current.totalActualValue = normalizeGoalOpsNumber(
      current.totalActualValue + actualValue
    );
    current.assignedCount += 1;

    if (plan.status === 'submitted') {
      current.submittedCount += 1;
    }

    if (plan.status === 'auto_zero') {
      current.autoZeroCount += 1;
    }

    current.completionRate = calculateGoalOpsCompletionRate(
      current.totalActualValue,
      current.totalTargetValue
    );

    grouped.set(plan.employeeId, current);
  }

  return Array.from(grouped.values());
}

export function buildGoalOpsLeaderboard(rows: GoalOpsOverviewRow[]) {
  const completionRate = [...rows].sort((left, right) => {
    if (right.completionRate !== left.completionRate) {
      return right.completionRate - left.completionRate;
    }
    return right.totalActualValue - left.totalActualValue;
  });

  const output = [...rows].sort((left, right) => {
    if (right.totalActualValue !== left.totalActualValue) {
      return right.totalActualValue - left.totalActualValue;
    }
    return right.completionRate - left.completionRate;
  });

  return {
    completionRate,
    output,
  };
}

export function buildGoalOpsDepartmentSummary(
  planDate: string,
  departmentId: number,
  rows: GoalOpsOverviewRow[]
) {
  const summary = {
    planDate,
    departmentId,
    employeeCount: rows.length,
    publicTargetValue: 0,
    publicActualValue: 0,
    personalTargetValue: 0,
    personalActualValue: 0,
    totalTargetValue: 0,
    totalActualValue: 0,
    completionRate: 0,
    assignedCount: 0,
    submittedCount: 0,
    autoZeroCount: 0,
  };

  for (const row of rows) {
    summary.publicTargetValue = normalizeGoalOpsNumber(
      summary.publicTargetValue + row.publicTargetValue
    );
    summary.publicActualValue = normalizeGoalOpsNumber(
      summary.publicActualValue + row.publicActualValue
    );
    summary.personalTargetValue = normalizeGoalOpsNumber(
      summary.personalTargetValue + row.personalTargetValue
    );
    summary.personalActualValue = normalizeGoalOpsNumber(
      summary.personalActualValue + row.personalActualValue
    );
    summary.totalTargetValue = normalizeGoalOpsNumber(
      summary.totalTargetValue + row.totalTargetValue
    );
    summary.totalActualValue = normalizeGoalOpsNumber(
      summary.totalActualValue + row.totalActualValue
    );
    summary.assignedCount += row.assignedCount;
    summary.submittedCount += row.submittedCount;
    summary.autoZeroCount += row.autoZeroCount;
  }

  summary.completionRate = calculateGoalOpsCompletionRate(
    summary.totalActualValue,
    summary.totalTargetValue
  );

  return summary;
}

export function buildGoalOpsDailyReportSummary(
  planDate: string,
  departmentId: number,
  rows: GoalOpsOverviewRow[]
) {
  const leaderboard = buildGoalOpsLeaderboard(rows);
  const departmentSummary = buildGoalOpsDepartmentSummary(
    planDate,
    departmentId,
    rows
  );

  return {
    planDate,
    departmentId,
    departmentSummary,
    topCompletionEmployees: leaderboard.completionRate.slice(0, 5),
    topOutputEmployees: leaderboard.output.slice(0, 5),
    autoZeroEmployees: rows
      .filter(item => item.autoZeroCount > 0)
      .map(item => ({
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        autoZeroCount: item.autoZeroCount,
      })),
  };
}
