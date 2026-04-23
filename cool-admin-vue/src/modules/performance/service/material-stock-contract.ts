/**
 * 文件职责：定义物资库存关键响应的前端 runtime 契约解码器。
 * 不负责发请求、库存调整或入出库动作逻辑。
 * 维护重点：库存记录与列表必须共享同一条结构边界，避免库存状态和时间字段被异常响应污染。
 */

import type {
	MaterialCatalogStatus,
	MaterialStockPageResult,
	MaterialStockRecord,
	MaterialStockStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceBoolean,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord
} from './service-contract';
import {
	MATERIAL_CATALOG_STATUS,
	MATERIAL_STOCK_STATUS
} from '../shared/contract-enums';

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableString(value, field);
}

function decodeMaterialCatalogStatus(value: unknown, field: string): MaterialCatalogStatus {
	return expectPerformanceServiceEnum(value, field, MATERIAL_CATALOG_STATUS);
}

function decodeMaterialStockStatus(value: unknown, field: string): MaterialStockStatus {
	return expectPerformanceServiceEnum(value, field, MATERIAL_STOCK_STATUS);
}

export function decodeMaterialStockRecord(
	value: unknown,
	field = 'materialStockRecord'
): MaterialStockRecord {
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
		status:
			record.status === undefined
				? undefined
				: decodeMaterialCatalogStatus(record.status, `${field}.status`),
		materialNo: expectPerformanceServiceOptionalString(
			record.materialNo,
			`${field}.materialNo`
		),
		unit: expectPerformanceServiceOptionalString(record.unit, `${field}.unit`),
		currentQty: expectPerformanceServiceOptionalNumber(
			record.currentQty,
			`${field}.currentQty`
		),
		availableQty: expectPerformanceServiceNumber(record.availableQty, `${field}.availableQty`),
		reservedQty: expectPerformanceServiceOptionalNumber(
			record.reservedQty,
			`${field}.reservedQty`
		),
		issuedQty: expectPerformanceServiceOptionalNumber(record.issuedQty, `${field}.issuedQty`),
		safetyStock: expectPerformanceServiceOptionalNumber(
			record.safetyStock,
			`${field}.safetyStock`
		),
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
		stockId: expectPerformanceServiceOptionalNumber(record.stockId, `${field}.stockId`),
		stockStatus:
			record.stockStatus === undefined
				? undefined
				: decodeMaterialStockStatus(record.stockStatus, `${field}.stockStatus`),
		lastUnitCost: expectPerformanceServiceOptionalNumber(
			record.lastUnitCost,
			`${field}.lastUnitCost`
		),
		stockAmount: expectPerformanceServiceOptionalNumber(
			record.stockAmount,
			`${field}.stockAmount`
		),
		isLowStock:
			record.isLowStock === undefined
				? undefined
				: expectPerformanceServiceBoolean(record.isLowStock, `${field}.isLowStock`),
		category: decodeOptionalNullableString(record.category, `${field}.category`),
		specification: decodeOptionalNullableString(record.specification, `${field}.specification`),
		lastInboundTime: decodeOptionalNullableString(
			record.lastInboundTime,
			`${field}.lastInboundTime`
		),
		lastIssueTime: decodeOptionalNullableString(record.lastIssueTime, `${field}.lastIssueTime`)
	};
}

export function decodeMaterialStockPageResult(
	value: unknown,
	field = 'materialStockPageResult'
): MaterialStockPageResult {
	return decodePerformanceServicePageResult(value, field, decodeMaterialStockRecord);
}
