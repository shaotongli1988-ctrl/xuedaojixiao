/**
 * 文件职责：定义晋升管理关键响应的前端 runtime 契约解码器。
 * 不负责发请求、评审弹窗编排或跨模块联动。
 * 维护重点：晋升主记录与评审记录必须共享同一条结构边界，避免关联 ID 和评审明细被异常响应污染。
 */

import type { PromotionPageResult, PromotionRecord, PromotionReviewRecord } from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

function decodePromotionReviewRecord(
	value: unknown,
	field = 'promotionReviewRecord'
): PromotionReviewRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		promotionId: expectPerformanceServiceOptionalNumber(
			record.promotionId,
			`${field}.promotionId`
		),
		reviewerId:
			expectPerformanceServiceOptionalNumber(record.reviewerId, `${field}.reviewerId`) ?? 0,
		reviewerName: expectPerformanceServiceOptionalString(
			record.reviewerName,
			`${field}.reviewerName`
		),
		decision: expectPerformanceServiceString(record.decision, `${field}.decision`) as
			| 'approved'
			| 'rejected',
		comment: expectPerformanceServiceOptionalString(record.comment, `${field}.comment`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`)
	};
}

export function decodePromotionRecord(value: unknown, field = 'promotionRecord'): PromotionRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(
			record.updateTime,
			`${field}.updateTime`
		),
		status: expectPerformanceServiceOptionalString(record.status, `${field}.status`),
		employeeName: expectPerformanceServiceOptionalString(
			record.employeeName,
			`${field}.employeeName`
		),
		suggestionId: expectPerformanceServiceOptionalNumber(
			record.suggestionId,
			`${field}.suggestionId`
		),
		sourceReason: expectPerformanceServiceString(record.sourceReason, `${field}.sourceReason`),
		sponsorName: expectPerformanceServiceOptionalString(
			record.sponsorName,
			`${field}.sponsorName`
		),
		fromPosition: expectPerformanceServiceString(record.fromPosition, `${field}.fromPosition`),
		toPosition: expectPerformanceServiceString(record.toPosition, `${field}.toPosition`),
		reason: expectPerformanceServiceString(record.reason, `${field}.reason`),
		reviewTime: expectPerformanceServiceOptionalString(
			record.reviewTime,
			`${field}.reviewTime`
		),
		assessmentId:
			record.assessmentId === undefined
				? undefined
				: expectPerformanceServiceNullableNumber(
						record.assessmentId,
						`${field}.assessmentId`
					),
		employeeId:
			expectPerformanceServiceOptionalNumber(record.employeeId, `${field}.employeeId`) ??
			undefined,
		sponsorId:
			expectPerformanceServiceOptionalNumber(record.sponsorId, `${field}.sponsorId`) ??
			undefined,
		reviewRecords:
			record.reviewRecords === undefined
				? undefined
				: expectPerformanceServiceArray(record.reviewRecords, `${field}.reviewRecords`).map(
						(item, index) =>
							decodePromotionReviewRecord(item, `${field}.reviewRecords[${index}]`)
					)
	};
}

export function decodePromotionPageResult(
	value: unknown,
	field = 'promotionPageResult'
): PromotionPageResult {
	return decodePerformanceServicePageResult(value, field, decodePromotionRecord);
}
