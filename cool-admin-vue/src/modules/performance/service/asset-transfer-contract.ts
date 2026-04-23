/**
 * 文件职责：定义资产调拨关键响应的前端 runtime 契约解码器。
 * 不负责发请求、物流跟踪或盘点报废联动逻辑。
 * 维护重点：调拨记录与列表必须共享同一条结构边界，避免状态和部门字段被异常响应污染。
 */

import type {
	AssetStatus,
	AssetTransferPageResult,
	AssetTransferRecord,
	AssetTransferStatus
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

const ASSET_TRANSFER_STATUS = [
	'draft',
	'cancelled',
	'submitted',
	'completed',
	'inTransit'
] as const;

function decodeAssetStatus(value: unknown, field: string): AssetStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_STATUS);
}

function decodeAssetTransferStatus(value: unknown, field: string): AssetTransferStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_TRANSFER_STATUS);
}

export function decodeAssetTransferRecord(
	value: unknown,
	field = 'assetTransferRecord'
): AssetTransferRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		transferNo: expectPerformanceServiceOptionalString(
			record.transferNo,
			`${field}.transferNo`
		),
		assetId: expectPerformanceServiceOptionalNumber(record.assetId, `${field}.assetId`),
		assetNo: expectPerformanceServiceOptionalString(record.assetNo, `${field}.assetNo`),
		assetName: expectPerformanceServiceOptionalString(record.assetName, `${field}.assetName`),
		assetStatus:
			record.assetStatus === undefined
				? undefined
				: decodeAssetStatus(record.assetStatus, `${field}.assetStatus`),
		fromDepartmentId: expectPerformanceServiceOptionalNumber(
			record.fromDepartmentId,
			`${field}.fromDepartmentId`
		),
		fromDepartmentName: expectPerformanceServiceOptionalString(
			record.fromDepartmentName,
			`${field}.fromDepartmentName`
		),
		toDepartmentId: expectPerformanceServiceOptionalNumber(
			record.toDepartmentId,
			`${field}.toDepartmentId`
		),
		toDepartmentName: expectPerformanceServiceOptionalString(
			record.toDepartmentName,
			`${field}.toDepartmentName`
		),
		fromLocation: expectPerformanceServiceOptionalString(
			record.fromLocation,
			`${field}.fromLocation`
		),
		toLocation: expectPerformanceServiceOptionalString(
			record.toLocation,
			`${field}.toLocation`
		),
		applicantId: expectPerformanceServiceOptionalNumber(
			record.applicantId,
			`${field}.applicantId`
		),
		applicantName: expectPerformanceServiceOptionalString(
			record.applicantName,
			`${field}.applicantName`
		),
		submitTime: expectPerformanceServiceOptionalString(
			record.submitTime,
			`${field}.submitTime`
		),
		completeTime: expectPerformanceServiceOptionalString(
			record.completeTime,
			`${field}.completeTime`
		),
		remark: expectPerformanceServiceOptionalString(record.remark, `${field}.remark`),
		status:
			record.status === undefined
				? undefined
				: decodeAssetTransferStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeAssetTransferPageResult(
	value: unknown,
	field = 'assetTransferPageResult'
): AssetTransferPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetTransferRecord);
}
