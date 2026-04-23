/**
 * 文件职责：定义资产维护保养关键响应的前端 runtime 契约解码器。
 * 不负责发请求、折旧联动或报废流程逻辑。
 * 维护重点：维护记录与列表必须共享同一条结构边界，避免状态和时间字段被异常响应污染。
 */

import type {
	AssetMaintenancePageResult,
	AssetMaintenanceRecord,
	AssetMaintenanceStatus,
	AssetStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord
} from './service-contract';

const ASSET_STATUS = [
	'assigned',
	'lost',
	'pendingInbound',
	'available',
	'maintenance',
	'inTransfer',
	'inventorying',
	'scrapped'
] as const;

const ASSET_MAINTENANCE_STATUS = ['cancelled', 'completed', 'scheduled', 'inProgress'] as const;

function decodeAssetStatus(value: unknown, field: string): AssetStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_STATUS);
}

function decodeAssetMaintenanceStatus(
	value: unknown,
	field: string
): AssetMaintenanceStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_MAINTENANCE_STATUS);
}

export function decodeAssetMaintenanceRecord(
	value: unknown,
	field = 'assetMaintenanceRecord'
): AssetMaintenanceRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		assetId: expectPerformanceServiceOptionalNumber(record.assetId, `${field}.assetId`),
		assetNo: expectPerformanceServiceOptionalString(record.assetNo, `${field}.assetNo`),
		assetName: expectPerformanceServiceOptionalString(record.assetName, `${field}.assetName`),
		assetStatus:
			record.assetStatus === undefined
				? undefined
				: decodeAssetStatus(record.assetStatus, `${field}.assetStatus`),
		maintenanceType: expectPerformanceServiceOptionalString(
			record.maintenanceType,
			`${field}.maintenanceType`
		),
		vendorName: expectPerformanceServiceOptionalString(record.vendorName, `${field}.vendorName`),
		cost: expectPerformanceServiceOptionalNumber(record.cost, `${field}.cost`),
		planDate: expectPerformanceServiceOptionalString(record.planDate, `${field}.planDate`),
		startDate: expectPerformanceServiceOptionalString(record.startDate, `${field}.startDate`),
		completeDate: expectPerformanceServiceOptionalString(
			record.completeDate,
			`${field}.completeDate`
		),
		description: expectPerformanceServiceOptionalString(
			record.description,
			`${field}.description`
		),
		resultSummary: expectPerformanceServiceOptionalString(
			record.resultSummary,
			`${field}.resultSummary`
		),
		status:
			record.status === undefined
				? undefined
				: decodeAssetMaintenanceStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeAssetMaintenancePageResult(
	value: unknown,
	field = 'assetMaintenancePageResult'
): AssetMaintenancePageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetMaintenanceRecord);
}
