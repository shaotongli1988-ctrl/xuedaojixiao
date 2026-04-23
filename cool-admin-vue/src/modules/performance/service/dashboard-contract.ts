/**
 * 文件职责：定义绩效驾驶舱关键只读响应的前端 runtime 契约解码器。
 * 不负责图表组件渲染、筛选条件状态管理或其他业务页聚合。
 * 维护重点：summary 与 crossSummary 的指标数组和枚举字段必须共用同一条结构边界，避免看板聚合结果出现静默漂移。
 */

import type {
	DashboardCrossDataStatus,
	DashboardCrossMetricCard,
	DashboardCrossMetricCode,
	DashboardCrossScopeType,
	DashboardCrossSourceDomain,
	DashboardCrossSummary,
	DashboardDepartmentDistributionItem,
	DashboardGradeDistributionItem,
	DashboardStageProgressItem,
	DashboardSummary
} from '../types';
import {
	expectPerformanceServiceArray,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

const DASHBOARD_CROSS_METRIC_CODE = [
	'recruitment_completion_rate',
	'training_pass_rate',
	'meeting_effectiveness_index'
] as const;
const DASHBOARD_CROSS_SOURCE_DOMAIN = ['recruitment', 'training', 'meeting'] as const;
const DASHBOARD_CROSS_SCOPE_TYPE = ['global', 'department_tree'] as const;
const DASHBOARD_CROSS_DATA_STATUS = ['ready', 'delayed', 'unavailable'] as const;
const DASHBOARD_GRADE = ['S', 'A', 'B', 'C'] as const;

function decodeDashboardCrossMetricCode(value: unknown, field: string): DashboardCrossMetricCode {
	return expectPerformanceServiceEnum(value, field, DASHBOARD_CROSS_METRIC_CODE);
}

function decodeDashboardCrossSourceDomain(
	value: unknown,
	field: string
): DashboardCrossSourceDomain {
	return expectPerformanceServiceEnum(value, field, DASHBOARD_CROSS_SOURCE_DOMAIN);
}

function decodeDashboardCrossScopeType(value: unknown, field: string): DashboardCrossScopeType {
	return expectPerformanceServiceEnum(value, field, DASHBOARD_CROSS_SCOPE_TYPE);
}

function decodeDashboardCrossDataStatus(value: unknown, field: string): DashboardCrossDataStatus {
	return expectPerformanceServiceEnum(value, field, DASHBOARD_CROSS_DATA_STATUS);
}

function decodeDashboardStageProgressItem(
	value: unknown,
	field = 'dashboardStageProgressItem'
): DashboardStageProgressItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		stageKey: expectPerformanceServiceString(record.stageKey, `${field}.stageKey`),
		stageLabel: expectPerformanceServiceString(record.stageLabel, `${field}.stageLabel`),
		completedCount: expectPerformanceServiceNumber(
			record.completedCount,
			`${field}.completedCount`
		),
		totalCount: expectPerformanceServiceNumber(record.totalCount, `${field}.totalCount`),
		completionRate: expectPerformanceServiceNumber(
			record.completionRate,
			`${field}.completionRate`
		),
		sort: expectPerformanceServiceNumber(record.sort, `${field}.sort`)
	};
}

function decodeDashboardDepartmentDistributionItem(
	value: unknown,
	field = 'dashboardDepartmentDistributionItem'
): DashboardDepartmentDistributionItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		departmentId: expectPerformanceServiceNumber(record.departmentId, `${field}.departmentId`),
		departmentName: expectPerformanceServiceString(
			record.departmentName,
			`${field}.departmentName`
		),
		averageScore: expectPerformanceServiceNumber(record.averageScore, `${field}.averageScore`),
		assessmentCount: expectPerformanceServiceNumber(
			record.assessmentCount,
			`${field}.assessmentCount`
		)
	};
}

function decodeDashboardGradeDistributionItem(
	value: unknown,
	field = 'dashboardGradeDistributionItem'
): DashboardGradeDistributionItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		grade: expectPerformanceServiceEnum(record.grade, `${field}.grade`, DASHBOARD_GRADE),
		count: expectPerformanceServiceNumber(record.count, `${field}.count`),
		ratio: expectPerformanceServiceNumber(record.ratio, `${field}.ratio`)
	};
}

function decodeDashboardCrossMetricCard(
	value: unknown,
	field = 'dashboardCrossMetricCard'
): DashboardCrossMetricCard {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		unit: expectPerformanceServiceString(record.unit, `${field}.unit`),
		periodValue: expectPerformanceServiceString(record.periodValue, `${field}.periodValue`),
		periodType: expectPerformanceServiceString(record.periodType, `${field}.periodType`),
		metricCode: decodeDashboardCrossMetricCode(record.metricCode, `${field}.metricCode`),
		metricLabel: expectPerformanceServiceString(record.metricLabel, `${field}.metricLabel`),
		sourceDomain: decodeDashboardCrossSourceDomain(
			record.sourceDomain,
			`${field}.sourceDomain`
		),
		scopeType: decodeDashboardCrossScopeType(record.scopeType, `${field}.scopeType`),
		dataStatus: decodeDashboardCrossDataStatus(record.dataStatus, `${field}.dataStatus`),
		statusText: expectPerformanceServiceString(record.statusText, `${field}.statusText`),
		metricValue: expectPerformanceServiceNullableNumber(
			record.metricValue,
			`${field}.metricValue`
		),
		departmentId: expectPerformanceServiceNullableNumber(
			record.departmentId,
			`${field}.departmentId`
		),
		updatedAt: expectPerformanceServiceNullableString(record.updatedAt, `${field}.updatedAt`)
	};
}

export function decodeDashboardSummary(
	value: unknown,
	field = 'dashboardSummary'
): DashboardSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		averageScore: expectPerformanceServiceNumber(record.averageScore, `${field}.averageScore`),
		pendingApprovalCount: expectPerformanceServiceNumber(
			record.pendingApprovalCount,
			`${field}.pendingApprovalCount`
		),
		goalCompletionRate: expectPerformanceServiceNumber(
			record.goalCompletionRate,
			`${field}.goalCompletionRate`
		),
		stageProgress: expectPerformanceServiceArray(
			record.stageProgress,
			`${field}.stageProgress`
		).map((item, index) =>
			decodeDashboardStageProgressItem(item, `${field}.stageProgress[${index}]`)
		),
		departmentDistribution: expectPerformanceServiceArray(
			record.departmentDistribution,
			`${field}.departmentDistribution`
		).map((item, index) =>
			decodeDashboardDepartmentDistributionItem(
				item,
				`${field}.departmentDistribution[${index}]`
			)
		),
		gradeDistribution: expectPerformanceServiceArray(
			record.gradeDistribution,
			`${field}.gradeDistribution`
		).map((item, index) =>
			decodeDashboardGradeDistributionItem(item, `${field}.gradeDistribution[${index}]`)
		)
	};
}

export function decodeDashboardCrossSummary(
	value: unknown,
	field = 'dashboardCrossSummary'
): DashboardCrossSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		metricCards: expectPerformanceServiceArray(record.metricCards, `${field}.metricCards`).map(
			(item, index) => decodeDashboardCrossMetricCard(item, `${field}.metricCards[${index}]`)
		)
	};
}
