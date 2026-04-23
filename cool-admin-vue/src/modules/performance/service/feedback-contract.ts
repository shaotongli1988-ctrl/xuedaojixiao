/**
 * 文件职责：定义 360 环评关键响应的前端 runtime 契约解码器。
 * 不负责发请求、页面统计补算或评分表单交互。
 * 维护重点：任务、提交汇总与导出行必须共享同一条结构边界，避免评分和关系字段被异常响应污染。
 */

import type {
	FeedbackExportRow,
	FeedbackPageResult,
	FeedbackRecord,
	FeedbackSummary,
	FeedbackTaskRecord,
	FeedbackTaskRelationItem
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

function decodeFeedbackTaskRelationItem(
	value: unknown,
	field = 'feedbackTaskRelationItem'
): FeedbackTaskRelationItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		feedbackUserId:
			expectPerformanceServiceOptionalNumber(record.feedbackUserId, `${field}.feedbackUserId`) ?? 0,
		feedbackUserName: expectPerformanceServiceOptionalString(
			record.feedbackUserName,
			`${field}.feedbackUserName`
		),
		relationType: expectPerformanceServiceString(record.relationType, `${field}.relationType`)
	};
}

function decodeFeedbackRecord(
	value: unknown,
	field = 'feedbackRecord'
): FeedbackRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		status: expectPerformanceServiceOptionalString(record.status, `${field}.status`),
		taskId: expectPerformanceServiceOptionalNumber(record.taskId, `${field}.taskId`),
		content: expectPerformanceServiceOptionalString(record.content, `${field}.content`),
		submitTime: expectPerformanceServiceOptionalString(record.submitTime, `${field}.submitTime`),
		score:
			expectPerformanceServiceOptionalNumber(record.score, `${field}.score`) ?? 0,
		feedbackUserId: expectPerformanceServiceOptionalNumber(
			record.feedbackUserId,
			`${field}.feedbackUserId`
		),
		feedbackUserName: expectPerformanceServiceOptionalString(
			record.feedbackUserName,
			`${field}.feedbackUserName`
		),
		relationType: expectPerformanceServiceString(record.relationType, `${field}.relationType`)
	};
}

export function decodeFeedbackTaskRecord(
	value: unknown,
	field = 'feedbackTaskRecord'
): FeedbackTaskRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		status: expectPerformanceServiceOptionalString(record.status, `${field}.status`),
		employeeName: expectPerformanceServiceOptionalString(
			record.employeeName,
			`${field}.employeeName`
		),
		deadline: expectPerformanceServiceOptionalString(record.deadline, `${field}.deadline`),
		submittedCount: expectPerformanceServiceOptionalNumber(
			record.submittedCount,
			`${field}.submittedCount`
		),
		totalCount: expectPerformanceServiceOptionalNumber(record.totalCount, `${field}.totalCount`),
		feedbackUserIds:
			record.feedbackUserIds === undefined
				? undefined
				: expectPerformanceServiceArray(record.feedbackUserIds, `${field}.feedbackUserIds`).map(
						(item, index) =>
							expectPerformanceServiceOptionalNumber(
								item,
								`${field}.feedbackUserIds[${index}]`
							) ?? 0
				  ),
		assessmentId:
			record.assessmentId === undefined
				? undefined
				: expectPerformanceServiceNullableNumber(record.assessmentId, `${field}.assessmentId`),
		employeeId:
			expectPerformanceServiceOptionalNumber(record.employeeId, `${field}.employeeId`) ??
			undefined,
		relationTypes:
			record.relationTypes === undefined
				? undefined
				: expectPerformanceServiceArray(record.relationTypes, `${field}.relationTypes`).map(
						(item, index) =>
							decodeFeedbackTaskRelationItem(item, `${field}.relationTypes[${index}]`)
				  )
	};
}

export function decodeFeedbackPageResult(
	value: unknown,
	field = 'feedbackPageResult'
): FeedbackPageResult {
	return decodePerformanceServicePageResult(value, field, decodeFeedbackTaskRecord);
}

export function decodeFeedbackSummary(
	value: unknown,
	field = 'feedbackSummary'
): FeedbackSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		submittedCount:
			expectPerformanceServiceOptionalNumber(record.submittedCount, `${field}.submittedCount`) ?? 0,
		totalCount: expectPerformanceServiceOptionalNumber(record.totalCount, `${field}.totalCount`) ?? 0,
		taskId: expectPerformanceServiceOptionalNumber(record.taskId, `${field}.taskId`) ?? 0,
		averageScore:
			expectPerformanceServiceOptionalNumber(record.averageScore, `${field}.averageScore`) ?? 0,
		records: expectPerformanceServiceArray(record.records, `${field}.records`).map((item, index) =>
			decodeFeedbackRecord(item, `${field}.records[${index}]`)
		)
	};
}

export function decodeFeedbackExportRows(
	value: unknown,
	field = 'feedbackExportRows'
): FeedbackExportRow[] {
	return expectPerformanceServiceArray(value, field).map((item, index) => {
		const row = expectPerformanceServiceRecord(item, `${field}[${index}]`);

		return {
			title: expectPerformanceServiceString(row.title, `${field}[${index}].title`),
			employeeId:
				expectPerformanceServiceOptionalNumber(row.employeeId, `${field}[${index}].employeeId`) ??
				0,
			deadline: expectPerformanceServiceOptionalString(row.deadline, `${field}[${index}].deadline`),
			submittedCount:
				expectPerformanceServiceOptionalNumber(
					row.submittedCount,
					`${field}[${index}].submittedCount`
				) ?? 0,
			totalCount:
				expectPerformanceServiceOptionalNumber(row.totalCount, `${field}[${index}].totalCount`) ??
				0,
			taskId: expectPerformanceServiceOptionalNumber(row.taskId, `${field}[${index}].taskId`) ?? 0,
			averageScore:
				expectPerformanceServiceOptionalNumber(
					row.averageScore,
					`${field}[${index}].averageScore`
				) ?? 0,
			assessmentId:
				row.assessmentId === undefined
					? undefined
					: expectPerformanceServiceNullableNumber(
							row.assessmentId,
							`${field}[${index}].assessmentId`
					  )
		};
	});
}
