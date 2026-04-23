/**
 * 文件职责：定义资产台账关键响应的前端 runtime 契约解码器。
 * 不负责发请求、资产领用流转或报表聚合逻辑。
 * 维护重点：资产主记录与列表必须共享同一条结构边界，避免状态和关联采购字段被异常响应污染。
 */

import type { AssetInfoPageResult, AssetInfoRecord, AssetStatus } from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';
import { ASSET_STATUS } from '../shared/contract-enums';

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeAssetStatus(value: unknown, field: string): AssetStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_STATUS);
}

export function decodeAssetInfoRecord(value: unknown, field = 'assetInfoRecord'): AssetInfoRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		assetNo: expectPerformanceServiceString(record.assetNo, `${field}.assetNo`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		category: expectPerformanceServiceString(record.category, `${field}.category`),
		assetStatus:
			record.assetStatus === undefined
				? undefined
				: decodeAssetStatus(record.assetStatus, `${field}.assetStatus`),
		assetType: expectPerformanceServiceOptionalString(record.assetType, `${field}.assetType`),
		brand: expectPerformanceServiceOptionalString(record.brand, `${field}.brand`),
		model: expectPerformanceServiceOptionalString(record.model, `${field}.model`),
		serialNo: expectPerformanceServiceOptionalString(record.serialNo, `${field}.serialNo`),
		location: expectPerformanceServiceOptionalString(record.location, `${field}.location`),
		departmentId: expectPerformanceServiceOptionalNumber(
			record.departmentId,
			`${field}.departmentId`
		),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		managerId: expectPerformanceServiceOptionalNumber(record.managerId, `${field}.managerId`),
		managerName: expectPerformanceServiceOptionalString(
			record.managerName,
			`${field}.managerName`
		),
		purchaseDate: expectPerformanceServiceOptionalString(
			record.purchaseDate,
			`${field}.purchaseDate`
		),
		purchaseAmount: expectPerformanceServiceOptionalNumber(
			record.purchaseAmount,
			`${field}.purchaseAmount`
		),
		supplierName: expectPerformanceServiceOptionalString(
			record.supplierName,
			`${field}.supplierName`
		),
		warrantyExpiry: expectPerformanceServiceOptionalString(
			record.warrantyExpiry,
			`${field}.warrantyExpiry`
		),
		residualValue: expectPerformanceServiceOptionalNumber(
			record.residualValue,
			`${field}.residualValue`
		),
		depreciationMonths: expectPerformanceServiceOptionalNumber(
			record.depreciationMonths,
			`${field}.depreciationMonths`
		),
		depreciationStartMonth: expectPerformanceServiceOptionalString(
			record.depreciationStartMonth,
			`${field}.depreciationStartMonth`
		),
		remark: expectPerformanceServiceOptionalString(record.remark, `${field}.remark`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(
			record.updateTime,
			`${field}.updateTime`
		),
		supplierId: decodeOptionalNullableNumber(record.supplierId, `${field}.supplierId`),
		purchaseOrderId: decodeOptionalNullableNumber(
			record.purchaseOrderId,
			`${field}.purchaseOrderId`
		)
	};
}

export function decodeAssetInfoPageResult(
	value: unknown,
	field = 'assetInfoPageResult'
): AssetInfoPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetInfoRecord);
}
