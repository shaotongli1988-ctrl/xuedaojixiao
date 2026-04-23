/**
 * 文件职责：定义资产报废关键响应的前端 runtime 契约解码器。
 * 不负责发请求、财务核销或外部审批编排逻辑。
 * 维护重点：报废主记录与列表必须共享同一条结构边界，避免状态和执行时间字段被异常响应污染。
 */

import type {
	AssetDisposalPageResult,
	AssetDisposalRecord,
	AssetDisposalStatus,
	AssetStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
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

const ASSET_DISPOSAL_STATUS = ['scrapped', 'draft', 'cancelled', 'submitted', 'approved'] as const;

function decodeAssetStatus(value: unknown, field: string): AssetStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_STATUS);
}

function decodeAssetDisposalStatus(value: unknown, field: string): AssetDisposalStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_DISPOSAL_STATUS);
}

export function decodeAssetDisposalRecord(
	value: unknown,
	field = 'assetDisposalRecord'
): AssetDisposalRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		disposalNo: expectPerformanceServiceOptionalString(record.disposalNo, `${field}.disposalNo`),
		assetId: expectPerformanceServiceOptionalNumber(record.assetId, `${field}.assetId`),
		assetNo: expectPerformanceServiceOptionalString(record.assetNo, `${field}.assetNo`),
		assetName: expectPerformanceServiceOptionalString(record.assetName, `${field}.assetName`),
		assetStatus:
			record.assetStatus === undefined
				? undefined
				: decodeAssetStatus(record.assetStatus, `${field}.assetStatus`),
		departmentId: expectPerformanceServiceOptionalNumber(record.departmentId, `${field}.departmentId`),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		applicantId: expectPerformanceServiceOptionalNumber(record.applicantId, `${field}.applicantId`),
		applicantName: expectPerformanceServiceOptionalString(
			record.applicantName,
			`${field}.applicantName`
		),
		reason: expectPerformanceServiceString(record.reason, `${field}.reason`),
		estimatedResidualAmount: expectPerformanceServiceOptionalNumber(
			record.estimatedResidualAmount,
			`${field}.estimatedResidualAmount`
		),
		submitTime: expectPerformanceServiceOptionalString(record.submitTime, `${field}.submitTime`),
		approveTime: expectPerformanceServiceOptionalString(record.approveTime, `${field}.approveTime`),
		executeTime: expectPerformanceServiceOptionalString(record.executeTime, `${field}.executeTime`),
		remark: expectPerformanceServiceOptionalString(record.remark, `${field}.remark`),
		status:
			record.status === undefined
				? undefined
				: decodeAssetDisposalStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeAssetDisposalPageResult(
	value: unknown,
	field = 'assetDisposalPageResult'
): AssetDisposalPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetDisposalRecord);
}
