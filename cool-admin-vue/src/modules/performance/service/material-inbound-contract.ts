/**
 * 文件职责：定义物资入库关键响应的前端 runtime 契约解码器。
 * 不负责发请求、库存汇总或采购审批逻辑。
 * 维护重点：入库单主记录与列表必须共享同一条结构边界，避免状态和可空来源字段被异常响应污染。
 */

import type {
	MaterialInboundPageResult,
	MaterialInboundRecord,
	MaterialInboundStatus
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

const MATERIAL_INBOUND_STATUS = ['draft', 'cancelled', 'submitted', 'received'] as const;

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

function decodeMaterialInboundStatus(value: unknown, field: string): MaterialInboundStatus {
	return expectPerformanceServiceEnum(value, field, MATERIAL_INBOUND_STATUS);
}

export function decodeMaterialInboundRecord(
	value: unknown,
	field = 'materialInboundRecord'
): MaterialInboundRecord {
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
		updateTime: expectPerformanceServiceOptionalString(
			record.updateTime,
			`${field}.updateTime`
		),
		title: expectPerformanceServiceOptionalString(record.title, `${field}.title`),
		quantity: expectPerformanceServiceNumber(record.quantity, `${field}.quantity`),
		amount: expectPerformanceServiceOptionalNumber(record.amount, `${field}.amount`),
		status:
			record.status === undefined
				? undefined
				: decodeMaterialInboundStatus(record.status, `${field}.status`),
		materialNo: expectPerformanceServiceOptionalString(
			record.materialNo,
			`${field}.materialNo`
		),
		unit: expectPerformanceServiceOptionalString(record.unit, `${field}.unit`),
		inboundNo: expectPerformanceServiceOptionalString(record.inboundNo, `${field}.inboundNo`),
		catalogId: expectPerformanceServiceOptionalNumber(record.catalogId, `${field}.catalogId`),
		materialId: expectPerformanceServiceOptionalNumber(
			record.materialId,
			`${field}.materialId`
		),
		materialCode: expectPerformanceServiceOptionalString(
			record.materialCode,
			`${field}.materialCode`
		),
		materialName: expectPerformanceServiceOptionalString(
			record.materialName,
			`${field}.materialName`
		),
		unitCost: expectPerformanceServiceOptionalNumber(record.unitCost, `${field}.unitCost`),
		unitPrice: expectPerformanceServiceOptionalNumber(record.unitPrice, `${field}.unitPrice`),
		totalAmount: expectPerformanceServiceNumber(record.totalAmount, `${field}.totalAmount`),
		receivedByName: expectPerformanceServiceOptionalString(
			record.receivedByName,
			`${field}.receivedByName`
		),
		category: decodeOptionalNullableString(record.category, `${field}.category`),
		specification: decodeOptionalNullableString(record.specification, `${field}.specification`),
		sourceType: decodeOptionalNullableString(record.sourceType, `${field}.sourceType`),
		sourceBizId: decodeOptionalNullableString(record.sourceBizId, `${field}.sourceBizId`),
		submittedAt: decodeOptionalNullableString(record.submittedAt, `${field}.submittedAt`),
		receivedBy: decodeOptionalNullableNumber(record.receivedBy, `${field}.receivedBy`),
		receivedAt: decodeOptionalNullableString(record.receivedAt, `${field}.receivedAt`),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`)
	};
}

export function decodeMaterialInboundPageResult(
	value: unknown,
	field = 'materialInboundPageResult'
): MaterialInboundPageResult {
	return decodePerformanceServicePageResult(value, field, decodeMaterialInboundRecord);
}
