/**
 * 文件职责：定义目标运营台关键响应的前端 runtime 契约解码器。
 * 不负责发请求、页面态拼装或业务文案。
 * 维护重点：只校验当前目标运营页面真实依赖的稳定字段，避免后端异常结构静默污染视图状态。
 */

import type {
	GoalOpsAccessProfile,
	GoalOpsDailyFinalizeResult,
	GoalOpsDepartmentConfig,
	GoalOpsDepartmentSummary,
	GoalOpsLeaderboard,
	GoalOpsOverview,
	GoalOpsOverviewRow,
	GoalOpsPlanPageResult,
	GoalOpsPlanRecord,
	GoalOpsReportAutoZeroEmployee,
	GoalOpsReportInfo,
	GoalOpsReportSummary
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceBoolean,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceNumberArray,
	expectPerformanceServiceOptionalEnum,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

const GOAL_OPS_ROLE_KIND = ['employee', 'manager', 'hr', 'readonly', 'unsupported'] as const;
const GOAL_OPS_SCOPE_KEY = ['self', 'department', 'company'] as const;
const GOAL_OPS_PERIOD_TYPE = ['day', 'week', 'month'] as const;
const GOAL_OPS_SOURCE_TYPE = ['public', 'personal'] as const;
const GOAL_OPS_PLAN_STATUS = ['assigned', 'submitted', 'auto_zero'] as const;
const GOAL_OPS_REPORT_STATUS = ['generated', 'sent', 'intercepted', 'delayed'] as const;

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableString(value, field);
}

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeGoalOpsOverviewRow(
	value: unknown,
	field = 'goalOpsOverviewRow'
): GoalOpsOverviewRow {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		employeeId: expectPerformanceServiceNumber(record.employeeId, `${field}.employeeId`),
		employeeName: expectPerformanceServiceString(record.employeeName, `${field}.employeeName`),
		departmentId: expectPerformanceServiceNumber(record.departmentId, `${field}.departmentId`),
		publicTargetValue: expectPerformanceServiceNumber(
			record.publicTargetValue,
			`${field}.publicTargetValue`
		),
		publicActualValue: expectPerformanceServiceNumber(
			record.publicActualValue,
			`${field}.publicActualValue`
		),
		personalTargetValue: expectPerformanceServiceNumber(
			record.personalTargetValue,
			`${field}.personalTargetValue`
		),
		personalActualValue: expectPerformanceServiceNumber(
			record.personalActualValue,
			`${field}.personalActualValue`
		),
		totalTargetValue: expectPerformanceServiceNumber(
			record.totalTargetValue,
			`${field}.totalTargetValue`
		),
		totalActualValue: expectPerformanceServiceNumber(
			record.totalActualValue,
			`${field}.totalActualValue`
		),
		completionRate: expectPerformanceServiceNumber(
			record.completionRate,
			`${field}.completionRate`
		),
		assignedCount: expectPerformanceServiceNumber(record.assignedCount, `${field}.assignedCount`),
		submittedCount: expectPerformanceServiceNumber(
			record.submittedCount,
			`${field}.submittedCount`
		),
		autoZeroCount: expectPerformanceServiceNumber(record.autoZeroCount, `${field}.autoZeroCount`)
	};
}

function decodeGoalOpsDepartmentSummary(
	value: unknown,
	field = 'goalOpsDepartmentSummary'
): GoalOpsDepartmentSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		planDate: expectPerformanceServiceString(record.planDate, `${field}.planDate`),
		departmentId: expectPerformanceServiceNumber(record.departmentId, `${field}.departmentId`),
		employeeCount: expectPerformanceServiceNumber(record.employeeCount, `${field}.employeeCount`),
		publicTargetValue: expectPerformanceServiceNumber(
			record.publicTargetValue,
			`${field}.publicTargetValue`
		),
		publicActualValue: expectPerformanceServiceNumber(
			record.publicActualValue,
			`${field}.publicActualValue`
		),
		personalTargetValue: expectPerformanceServiceNumber(
			record.personalTargetValue,
			`${field}.personalTargetValue`
		),
		personalActualValue: expectPerformanceServiceNumber(
			record.personalActualValue,
			`${field}.personalActualValue`
		),
		totalTargetValue: expectPerformanceServiceNumber(
			record.totalTargetValue,
			`${field}.totalTargetValue`
		),
		totalActualValue: expectPerformanceServiceNumber(
			record.totalActualValue,
			`${field}.totalActualValue`
		),
		completionRate: expectPerformanceServiceNumber(
			record.completionRate,
			`${field}.completionRate`
		),
		assignedCount: expectPerformanceServiceNumber(record.assignedCount, `${field}.assignedCount`),
		submittedCount: expectPerformanceServiceNumber(
			record.submittedCount,
			`${field}.submittedCount`
		),
		autoZeroCount: expectPerformanceServiceNumber(record.autoZeroCount, `${field}.autoZeroCount`)
	};
}

function decodeGoalOpsLeaderboard(value: unknown, field = 'goalOpsLeaderboard'): GoalOpsLeaderboard {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		completionRate: expectPerformanceServiceArray(
			record.completionRate,
			`${field}.completionRate`
		).map((item, index) => decodeGoalOpsOverviewRow(item, `${field}.completionRate[${index}]`)),
		output: expectPerformanceServiceArray(record.output, `${field}.output`).map((item, index) =>
			decodeGoalOpsOverviewRow(item, `${field}.output[${index}]`)
		)
	};
}

function decodeGoalOpsReportAutoZeroEmployee(
	value: unknown,
	field = 'goalOpsReportAutoZeroEmployee'
): GoalOpsReportAutoZeroEmployee {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		employeeId: expectPerformanceServiceNumber(record.employeeId, `${field}.employeeId`),
		employeeName: expectPerformanceServiceString(record.employeeName, `${field}.employeeName`),
		autoZeroCount: expectPerformanceServiceNumber(record.autoZeroCount, `${field}.autoZeroCount`)
	};
}

function decodeGoalOpsReportSummary(
	value: unknown,
	field = 'goalOpsReportSummary'
): GoalOpsReportSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		planDate: expectPerformanceServiceString(record.planDate, `${field}.planDate`),
		departmentId: expectPerformanceServiceNumber(record.departmentId, `${field}.departmentId`),
		departmentSummary: decodeGoalOpsDepartmentSummary(
			record.departmentSummary,
			`${field}.departmentSummary`
		),
		topCompletionEmployees: expectPerformanceServiceArray(
			record.topCompletionEmployees,
			`${field}.topCompletionEmployees`
		).map((item, index) =>
			decodeGoalOpsOverviewRow(item, `${field}.topCompletionEmployees[${index}]`)
		),
		topOutputEmployees: expectPerformanceServiceArray(
			record.topOutputEmployees,
			`${field}.topOutputEmployees`
		).map((item, index) =>
			decodeGoalOpsOverviewRow(item, `${field}.topOutputEmployees[${index}]`)
		),
		autoZeroEmployees: expectPerformanceServiceArray(
			record.autoZeroEmployees,
			`${field}.autoZeroEmployees`
		).map((item, index) =>
			decodeGoalOpsReportAutoZeroEmployee(item, `${field}.autoZeroEmployees[${index}]`)
		)
	};
}

export function decodeGoalOpsAccessProfile(
	value: unknown,
	field = 'goalOpsAccessProfile'
): GoalOpsAccessProfile {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		departmentId: expectPerformanceServiceNullableNumber(
			record.departmentId,
			`${field}.departmentId`
		),
		activePersonaKey: expectPerformanceServiceNullableString(
			record.activePersonaKey,
			`${field}.activePersonaKey`
		),
		roleKind: expectPerformanceServiceEnum(record.roleKind, `${field}.roleKind`, GOAL_OPS_ROLE_KIND),
		scopeKey: expectPerformanceServiceEnum(record.scopeKey, `${field}.scopeKey`, GOAL_OPS_SCOPE_KEY),
		isHr: expectPerformanceServiceBoolean(record.isHr, `${field}.isHr`),
		canManageDepartment: expectPerformanceServiceBoolean(
			record.canManageDepartment,
			`${field}.canManageDepartment`
		),
		canMaintainPersonalPlan: expectPerformanceServiceBoolean(
			record.canMaintainPersonalPlan,
			`${field}.canMaintainPersonalPlan`
		),
		manageableDepartmentIds: expectPerformanceServiceNumberArray(
			record.manageableDepartmentIds,
			`${field}.manageableDepartmentIds`
		)
	};
}

export function decodeGoalOpsDailyFinalizeResult(
	value: unknown,
	field = 'goalOpsDailyFinalizeResult'
): GoalOpsDailyFinalizeResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		departmentId: expectPerformanceServiceNumber(record.departmentId, `${field}.departmentId`),
		planDate: expectPerformanceServiceString(record.planDate, `${field}.planDate`),
		autoZeroCount: expectPerformanceServiceNumber(record.autoZeroCount, `${field}.autoZeroCount`)
	};
}

export function decodeGoalOpsOverview(value: unknown, field = 'goalOpsOverview'): GoalOpsOverview {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		planDate: expectPerformanceServiceString(record.planDate, `${field}.planDate`),
		departmentId: decodeOptionalNullableNumber(record.departmentId, `${field}.departmentId`),
		departmentSummary: decodeGoalOpsDepartmentSummary(
			record.departmentSummary,
			`${field}.departmentSummary`
		),
		leaderboard: decodeGoalOpsLeaderboard(record.leaderboard, `${field}.leaderboard`),
		rows: expectPerformanceServiceArray(record.rows, `${field}.rows`).map((item, index) =>
			decodeGoalOpsOverviewRow(item, `${field}.rows[${index}]`)
		)
	};
}

export function decodeGoalOpsDepartmentConfig(
	value: unknown,
	field = 'goalOpsDepartmentConfig'
): GoalOpsDepartmentConfig {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		departmentId: expectPerformanceServiceOptionalNumber(record.departmentId, `${field}.departmentId`),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		assignTime: expectPerformanceServiceString(record.assignTime, `${field}.assignTime`),
		submitDeadline: expectPerformanceServiceString(
			record.submitDeadline,
			`${field}.submitDeadline`
		),
		reportSendTime: expectPerformanceServiceString(record.reportSendTime, `${field}.reportSendTime`),
		reportPushMode: expectPerformanceServiceString(record.reportPushMode, `${field}.reportPushMode`),
		reportPushTarget: decodeOptionalNullableString(
			record.reportPushTarget,
			`${field}.reportPushTarget`
		),
		updatedBy: decodeOptionalNullableNumber(record.updatedBy, `${field}.updatedBy`),
		updateTime: decodeOptionalNullableString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeGoalOpsPlanRecord(
	value: unknown,
	field = 'goalOpsPlanRecord'
): GoalOpsPlanRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		departmentId: expectPerformanceServiceOptionalNumber(record.departmentId, `${field}.departmentId`),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		employeeId: expectPerformanceServiceOptionalNumber(record.employeeId, `${field}.employeeId`),
		employeeName: expectPerformanceServiceOptionalString(record.employeeName, `${field}.employeeName`),
		periodType: expectPerformanceServiceEnum(
			record.periodType,
			`${field}.periodType`,
			GOAL_OPS_PERIOD_TYPE
		),
		planDate: decodeOptionalNullableString(record.planDate, `${field}.planDate`),
		periodStartDate: expectPerformanceServiceString(
			record.periodStartDate,
			`${field}.periodStartDate`
		),
		periodEndDate: expectPerformanceServiceString(record.periodEndDate, `${field}.periodEndDate`),
		sourceType: expectPerformanceServiceEnum(
			record.sourceType,
			`${field}.sourceType`,
			GOAL_OPS_SOURCE_TYPE
		),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		description: decodeOptionalNullableString(record.description, `${field}.description`),
		targetValue: expectPerformanceServiceNumber(record.targetValue, `${field}.targetValue`),
		actualValue: expectPerformanceServiceOptionalNumber(record.actualValue, `${field}.actualValue`),
		completionRate: expectPerformanceServiceOptionalNumber(
			record.completionRate,
			`${field}.completionRate`
		),
		unit: decodeOptionalNullableString(record.unit, `${field}.unit`),
		status: expectPerformanceServiceOptionalEnum(
			record.status,
			`${field}.status`,
			GOAL_OPS_PLAN_STATUS
		),
		parentPlanId: decodeOptionalNullableNumber(record.parentPlanId, `${field}.parentPlanId`),
		isSystemGenerated:
			record.isSystemGenerated === undefined
				? undefined
				: expectPerformanceServiceBoolean(record.isSystemGenerated, `${field}.isSystemGenerated`),
		assignedBy: decodeOptionalNullableNumber(record.assignedBy, `${field}.assignedBy`),
		submittedBy: decodeOptionalNullableNumber(record.submittedBy, `${field}.submittedBy`),
		submittedAt: decodeOptionalNullableString(record.submittedAt, `${field}.submittedAt`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeGoalOpsPlanPageResult(
	value: unknown,
	field = 'goalOpsPlanPageResult'
): GoalOpsPlanPageResult {
	return decodePerformanceServicePageResult(value, field, decodeGoalOpsPlanRecord);
}

export function decodeGoalOpsReportInfo(
	value: unknown,
	field = 'goalOpsReportInfo'
): GoalOpsReportInfo {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		departmentId: expectPerformanceServiceNumber(record.departmentId, `${field}.departmentId`),
		reportDate: expectPerformanceServiceString(record.reportDate, `${field}.reportDate`),
		status: expectPerformanceServiceEnum(
			record.status,
			`${field}.status`,
			GOAL_OPS_REPORT_STATUS
		),
		summary:
			record.summary == null
				? null
				: decodeGoalOpsReportSummary(record.summary, `${field}.summary`),
		generatedAt: decodeOptionalNullableString(record.generatedAt, `${field}.generatedAt`),
		sentAt: decodeOptionalNullableString(record.sentAt, `${field}.sentAt`),
		pushMode: expectPerformanceServiceOptionalString(record.pushMode, `${field}.pushMode`),
		pushTarget: decodeOptionalNullableString(record.pushTarget, `${field}.pushTarget`),
		generatedBy: decodeOptionalNullableNumber(record.generatedBy, `${field}.generatedBy`),
		operatedBy: decodeOptionalNullableNumber(record.operatedBy, `${field}.operatedBy`),
		operationRemark: decodeOptionalNullableString(
			record.operationRemark,
			`${field}.operationRemark`
		),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}
