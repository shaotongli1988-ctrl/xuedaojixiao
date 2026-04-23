/**
 * 文件职责：定义物资台账关键响应的前端 runtime 契约解码器。
 * 不负责发请求、库存变更或入出库流转逻辑。
 * 维护重点：物资目录主记录与列表必须共享同一条结构边界，避免分类备注等可空字段被异常响应污染。
 */

import type {
	MaterialCatalogPageResult,
	MaterialCatalogRecord,
	MaterialCatalogStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';
import { MATERIAL_CATALOG_STATUS } from '../shared/contract-enums';

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableString(value, field);
}

function decodeMaterialCatalogStatus(value: unknown, field: string): MaterialCatalogStatus {
	return expectPerformanceServiceEnum(value, field, MATERIAL_CATALOG_STATUS);
}

export function decodeMaterialCatalogRecord(
	value: unknown,
	field = 'materialCatalogRecord'
): MaterialCatalogRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
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
		code: expectPerformanceServiceString(record.code, `${field}.code`),
		materialNo: expectPerformanceServiceOptionalString(
			record.materialNo,
			`${field}.materialNo`
		),
		unit: expectPerformanceServiceString(record.unit, `${field}.unit`),
		stockDepartmentCount: expectPerformanceServiceOptionalNumber(
			record.stockDepartmentCount,
			`${field}.stockDepartmentCount`
		),
		departmentCount: expectPerformanceServiceOptionalNumber(
			record.departmentCount,
			`${field}.departmentCount`
		),
		currentQty: expectPerformanceServiceOptionalNumber(
			record.currentQty,
			`${field}.currentQty`
		),
		availableQty: expectPerformanceServiceOptionalNumber(
			record.availableQty,
			`${field}.availableQty`
		),
		reservedQty: expectPerformanceServiceOptionalNumber(
			record.reservedQty,
			`${field}.reservedQty`
		),
		issuedQty: expectPerformanceServiceOptionalNumber(record.issuedQty, `${field}.issuedQty`),
		safetyStock: expectPerformanceServiceOptionalNumber(
			record.safetyStock,
			`${field}.safetyStock`
		),
		referenceUnitCost: expectPerformanceServiceOptionalNumber(
			record.referenceUnitCost,
			`${field}.referenceUnitCost`
		),
		category: decodeOptionalNullableString(record.category, `${field}.category`),
		specification: decodeOptionalNullableString(record.specification, `${field}.specification`),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`)
	};
}

export function decodeMaterialCatalogPageResult(
	value: unknown,
	field = 'materialCatalogPageResult'
): MaterialCatalogPageResult {
	return decodePerformanceServicePageResult(value, field, decodeMaterialCatalogRecord);
}
