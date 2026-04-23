/**
 * 文件职责：定义资产盘点关键响应的前端 runtime 契约解码器。
 * 不负责发请求、扫码对接或盘点差异明细计算逻辑。
 * 维护重点：盘点主记录与列表必须共享同一条结构边界，避免状态和计数字段被异常响应污染。
 */

import type {
	AssetInventoryPageResult,
	AssetInventoryRecord,
	AssetInventoryStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord
} from './service-contract';

const ASSET_INVENTORY_STATUS = ['draft', 'counting', 'completed', 'closed'] as const;

function decodeAssetInventoryStatus(value: unknown, field: string): AssetInventoryStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_INVENTORY_STATUS);
}

export function decodeAssetInventoryRecord(
	value: unknown,
	field = 'assetInventoryRecord'
): AssetInventoryRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		inventoryNo: expectPerformanceServiceOptionalString(
			record.inventoryNo,
			`${field}.inventoryNo`
		),
		scopeLabel: expectPerformanceServiceOptionalString(
			record.scopeLabel,
			`${field}.scopeLabel`
		),
		departmentId: expectPerformanceServiceOptionalNumber(
			record.departmentId,
			`${field}.departmentId`
		),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		location: expectPerformanceServiceOptionalString(record.location, `${field}.location`),
		ownerId: expectPerformanceServiceOptionalNumber(record.ownerId, `${field}.ownerId`),
		ownerName: expectPerformanceServiceOptionalString(record.ownerName, `${field}.ownerName`),
		plannedDate: expectPerformanceServiceOptionalString(
			record.plannedDate,
			`${field}.plannedDate`
		),
		completedDate: expectPerformanceServiceOptionalString(
			record.completedDate,
			`${field}.completedDate`
		),
		assetCount: expectPerformanceServiceOptionalNumber(
			record.assetCount,
			`${field}.assetCount`
		),
		matchedCount: expectPerformanceServiceOptionalNumber(
			record.matchedCount,
			`${field}.matchedCount`
		),
		differenceCount: expectPerformanceServiceOptionalNumber(
			record.differenceCount,
			`${field}.differenceCount`
		),
		remark: expectPerformanceServiceOptionalString(record.remark, `${field}.remark`),
		status:
			record.status === undefined
				? undefined
				: decodeAssetInventoryStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeAssetInventoryPageResult(
	value: unknown,
	field = 'assetInventoryPageResult'
): AssetInventoryPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetInventoryRecord);
}
