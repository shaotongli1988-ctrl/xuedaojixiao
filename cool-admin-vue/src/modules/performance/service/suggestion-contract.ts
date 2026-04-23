/**
 * 文件职责：定义建议引擎关键响应的前端 runtime 契约解码器。
 * 不负责发请求、正式单据创建或页面动作编排。
 * 维护重点：建议主记录与 accept 预填结果必须共享同一条结构边界，避免关联 ID 和状态字段被异常响应污染。
 */

import type {
	SuggestionAcceptResult,
	SuggestionPageResult,
	SuggestionRecord,
	SuggestionStatus,
	SuggestionType
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';
import { SUGGESTION_STATUS, SUGGESTION_TYPE } from '../shared/contract-enums';

function decodeSuggestionType(value: unknown, field: string): SuggestionType {
	return expectPerformanceServiceEnum(value, field, SUGGESTION_TYPE);
}

function decodeSuggestionStatus(value: unknown, field: string): SuggestionStatus {
	return expectPerformanceServiceEnum(value, field, SUGGESTION_STATUS);
}

export function decodeSuggestionRecord(
	value: unknown,
	field = 'suggestionRecord'
): SuggestionRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		departmentId: expectPerformanceServiceOptionalNumber(
			record.departmentId,
			`${field}.departmentId`
		),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		status:
			record.status === undefined
				? undefined
				: decodeSuggestionStatus(record.status, `${field}.status`),
		assessmentId: expectPerformanceServiceOptionalNumber(
			record.assessmentId,
			`${field}.assessmentId`
		),
		employeeId: expectPerformanceServiceOptionalNumber(
			record.employeeId,
			`${field}.employeeId`
		),
		employeeName: expectPerformanceServiceOptionalString(
			record.employeeName,
			`${field}.employeeName`
		),
		periodValue: expectPerformanceServiceOptionalString(
			record.periodValue,
			`${field}.periodValue`
		),
		suggestionType: decodeSuggestionType(record.suggestionType, `${field}.suggestionType`),
		periodType: expectPerformanceServiceOptionalString(
			record.periodType,
			`${field}.periodType`
		),
		triggerLabel: expectPerformanceServiceOptionalString(
			record.triggerLabel,
			`${field}.triggerLabel`
		),
		handleTime: expectPerformanceServiceOptionalString(
			record.handleTime,
			`${field}.handleTime`
		),
		ruleVersion: expectPerformanceServiceOptionalString(
			record.ruleVersion,
			`${field}.ruleVersion`
		),
		revokeReason: expectPerformanceServiceOptionalString(
			record.revokeReason,
			`${field}.revokeReason`
		),
		handlerId:
			record.handlerId === undefined
				? undefined
				: expectPerformanceServiceNullableNumber(record.handlerId, `${field}.handlerId`),
		handlerName:
			record.handlerName === undefined
				? undefined
				: expectPerformanceServiceNullableString(
						record.handlerName,
						`${field}.handlerName`
					),
		linkedEntityType:
			record.linkedEntityType === undefined
				? undefined
				: expectPerformanceServiceNullableString(
						record.linkedEntityType,
						`${field}.linkedEntityType`
					),
		linkedEntityId:
			record.linkedEntityId === undefined
				? undefined
				: expectPerformanceServiceNullableNumber(
						record.linkedEntityId,
						`${field}.linkedEntityId`
					)
	};
}

export function decodeSuggestionPageResult(
	value: unknown,
	field = 'suggestionPageResult'
): SuggestionPageResult {
	return decodePerformanceServicePageResult(value, field, decodeSuggestionRecord);
}

export function decodeSuggestionAcceptResult(
	value: unknown,
	field = 'suggestionAcceptResult'
): SuggestionAcceptResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		prefill:
			record.prefill == null
				? undefined
				: (() => {
						const prefill = expectPerformanceServiceRecord(
							record.prefill,
							`${field}.prefill`
						);
						return {
							assessmentId: expectPerformanceServiceOptionalNumber(
								prefill.assessmentId,
								`${field}.prefill.assessmentId`
							),
							employeeId: expectPerformanceServiceOptionalNumber(
								prefill.employeeId,
								`${field}.prefill.employeeId`
							),
							suggestionType:
								prefill.suggestionType === undefined
									? undefined
									: decodeSuggestionType(
											prefill.suggestionType,
											`${field}.prefill.suggestionType`
										),
							suggestionId: expectPerformanceServiceOptionalNumber(
								prefill.suggestionId,
								`${field}.prefill.suggestionId`
							)
						};
					})(),
		suggestion:
			record.suggestion == null
				? undefined
				: decodeSuggestionRecord(record.suggestion, `${field}.suggestion`)
	};
}
