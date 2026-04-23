/**
 * 文件职责：定义评估单关键响应的前端 runtime 契约解码器。
 * 不负责发请求、页面表单编排或字典文案映射。
 * 维护重点：列表、详情、审批动作和导出行必须共享同一条结构边界，避免评估状态和分数结构被异常响应污染。
 */

import type {
	AssessmentExportRows,
	AssessmentPageResult,
	AssessmentRecord,
	AssessmentScoreItem,
	AssessmentStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

const ASSESSMENT_STATUS = ['draft', 'submitted', 'approved', 'rejected'] as const;

function decodeAssessmentScoreItem(
	value: unknown,
	field = 'assessmentScoreItem'
): AssessmentScoreItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		indicatorId:
			record.indicatorId === undefined
				? undefined
				: expectPerformanceServiceNullableNumber(
						record.indicatorId,
						`${field}.indicatorId`
					),
		indicatorName: expectPerformanceServiceString(
			record.indicatorName,
			`${field}.indicatorName`
		),
		score: expectPerformanceServiceOptionalNumber(record.score, `${field}.score`) ?? 0,
		weight: expectPerformanceServiceOptionalNumber(record.weight, `${field}.weight`) ?? 0,
		comment: expectPerformanceServiceOptionalString(record.comment, `${field}.comment`),
		weightedScore: expectPerformanceServiceOptionalNumber(
			record.weightedScore,
			`${field}.weightedScore`
		)
	};
}

export function decodeAssessmentRecord(
	value: unknown,
	field = 'assessmentRecord'
): AssessmentRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		code: expectPerformanceServiceOptionalString(record.code, `${field}.code`),
		employeeId: expectPerformanceServiceOptionalNumber(
			record.employeeId,
			`${field}.employeeId`
		),
		employeeName: expectPerformanceServiceOptionalString(
			record.employeeName,
			`${field}.employeeName`
		),
		assessorId: expectPerformanceServiceOptionalNumber(
			record.assessorId,
			`${field}.assessorId`
		),
		assessorName: expectPerformanceServiceOptionalString(
			record.assessorName,
			`${field}.assessorName`
		),
		departmentId: expectPerformanceServiceOptionalNumber(
			record.departmentId,
			`${field}.departmentId`
		),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		periodType: expectPerformanceServiceOptionalString(
			record.periodType,
			`${field}.periodType`
		),
		periodValue: expectPerformanceServiceOptionalString(
			record.periodValue,
			`${field}.periodValue`
		),
		targetCompletion: expectPerformanceServiceOptionalNumber(
			record.targetCompletion,
			`${field}.targetCompletion`
		),
		totalScore: expectPerformanceServiceOptionalNumber(
			record.totalScore,
			`${field}.totalScore`
		),
		grade: expectPerformanceServiceOptionalString(record.grade, `${field}.grade`),
		selfEvaluation: expectPerformanceServiceOptionalString(
			record.selfEvaluation,
			`${field}.selfEvaluation`
		),
		managerFeedback: expectPerformanceServiceOptionalString(
			record.managerFeedback,
			`${field}.managerFeedback`
		),
		status:
			record.status === undefined
				? undefined
				: expectPerformanceServiceEnum(record.status, `${field}.status`, ASSESSMENT_STATUS),
		submitTime: expectPerformanceServiceOptionalString(
			record.submitTime,
			`${field}.submitTime`
		),
		approveTime: expectPerformanceServiceOptionalString(
			record.approveTime,
			`${field}.approveTime`
		),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(
			record.updateTime,
			`${field}.updateTime`
		),
		scoreItems:
			record.scoreItems === undefined
				? undefined
				: expectPerformanceServiceArray(record.scoreItems, `${field}.scoreItems`).map(
						(item, index) =>
							decodeAssessmentScoreItem(item, `${field}.scoreItems[${index}]`)
					)
	};
}

export function decodeAssessmentPageResult(
	value: unknown,
	field = 'assessmentPageResult'
): AssessmentPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssessmentRecord);
}

function decodeAssessmentStatus(value: unknown, field: string): AssessmentStatus {
	return expectPerformanceServiceEnum(value, field, ASSESSMENT_STATUS);
}

export function decodeAssessmentExportRows(
	value: unknown,
	field = 'assessmentExportRows'
): AssessmentExportRows {
	return expectPerformanceServiceArray(value, field).map((item, index) => {
		const row = expectPerformanceServiceRecord(item, `${field}[${index}]`);

		return {
			code: expectPerformanceServiceString(row.code, `${field}[${index}].code`),
			employeeName: expectPerformanceServiceString(
				row.employeeName,
				`${field}[${index}].employeeName`
			),
			departmentName: expectPerformanceServiceString(
				row.departmentName,
				`${field}[${index}].departmentName`
			),
			periodType: expectPerformanceServiceString(
				row.periodType,
				`${field}[${index}].periodType`
			),
			periodValue: expectPerformanceServiceString(
				row.periodValue,
				`${field}[${index}].periodValue`
			),
			assessorName: expectPerformanceServiceString(
				row.assessorName,
				`${field}[${index}].assessorName`
			),
			status: decodeAssessmentStatus(row.status, `${field}[${index}].status`),
			targetCompletion:
				expectPerformanceServiceOptionalNumber(
					row.targetCompletion,
					`${field}[${index}].targetCompletion`
				) ?? 0,
			totalScore:
				expectPerformanceServiceOptionalNumber(
					row.totalScore,
					`${field}[${index}].totalScore`
				) ?? 0,
			grade: expectPerformanceServiceString(row.grade, `${field}[${index}].grade`),
			submitTime: expectPerformanceServiceOptionalString(
				row.submitTime,
				`${field}[${index}].submitTime`
			),
			approveTime: expectPerformanceServiceOptionalString(
				row.approveTime,
				`${field}[${index}].approveTime`
			)
		};
	});
}
