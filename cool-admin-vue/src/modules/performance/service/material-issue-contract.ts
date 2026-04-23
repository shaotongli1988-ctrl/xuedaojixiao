/**
 * 文件职责：定义物资领用关键响应的前端 runtime 契约解码器。
 * 不负责发请求、归还流程或库存盘点逻辑。
 * 维护重点：领用单主记录与列表必须共享同一条结构边界，避免状态和可空领用字段被异常响应污染。
 */

import type {
	MaterialIssuePageResult,
	MaterialIssueRecord,
	MaterialIssueStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord
} from './service-contract';

const MATERIAL_ISSUE_STATUS = ['draft', 'issued', 'cancelled', 'submitted'] as const;

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

function decodeMaterialIssueStatus(value: unknown, field: string): MaterialIssueStatus {
	return expectPerformanceServiceEnum(value, field, MATERIAL_ISSUE_STATUS);
}

export function decodeMaterialIssueRecord(
	value: unknown,
	field = 'materialIssueRecord'
): MaterialIssueRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		departmentId: expectPerformanceServiceOptionalNumber(record.departmentId, `${field}.departmentId`),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`),
		title: expectPerformanceServiceOptionalString(record.title, `${field}.title`),
		quantity: expectPerformanceServiceNumber(record.quantity, `${field}.quantity`),
		status:
			record.status === undefined
				? undefined
				: decodeMaterialIssueStatus(record.status, `${field}.status`),
		materialNo: expectPerformanceServiceOptionalString(record.materialNo, `${field}.materialNo`),
		unit: expectPerformanceServiceOptionalString(record.unit, `${field}.unit`),
		catalogId: expectPerformanceServiceOptionalNumber(record.catalogId, `${field}.catalogId`),
		materialId: expectPerformanceServiceOptionalNumber(record.materialId, `${field}.materialId`),
		materialCode: expectPerformanceServiceOptionalString(record.materialCode, `${field}.materialCode`),
		materialName: expectPerformanceServiceOptionalString(record.materialName, `${field}.materialName`),
		issueNo: expectPerformanceServiceOptionalString(record.issueNo, `${field}.issueNo`),
		assigneeId: expectPerformanceServiceOptionalNumber(record.assigneeId, `${field}.assigneeId`),
		assigneeName: expectPerformanceServiceOptionalString(
			record.assigneeName,
			`${field}.assigneeName`
		),
		issuedByName: expectPerformanceServiceOptionalString(
			record.issuedByName,
			`${field}.issuedByName`
		),
		category: decodeOptionalNullableString(record.category, `${field}.category`),
		specification: decodeOptionalNullableString(record.specification, `${field}.specification`),
		purpose: decodeOptionalNullableString(record.purpose, `${field}.purpose`),
		issueDate: decodeOptionalNullableString(record.issueDate, `${field}.issueDate`),
		submittedAt: decodeOptionalNullableString(record.submittedAt, `${field}.submittedAt`),
		issuedBy: decodeOptionalNullableNumber(record.issuedBy, `${field}.issuedBy`),
		issuedAt: decodeOptionalNullableString(record.issuedAt, `${field}.issuedAt`),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`)
	};
}

export function decodeMaterialIssuePageResult(
	value: unknown,
	field = 'materialIssuePageResult'
): MaterialIssuePageResult {
	return decodePerformanceServicePageResult(value, field, decodeMaterialIssueRecord);
}
