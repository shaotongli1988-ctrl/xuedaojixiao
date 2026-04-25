/**
 * 文件职责：定义资产领用归还关键响应的前端 runtime 契约解码器。
 * 不负责发请求、申请单流转或资产主数据维护逻辑。
 * 维护重点：领用记录与列表必须共享同一条结构边界，避免状态和归还时间字段被异常响应污染。
 */

import type {
	AssetAssignmentPageResult,
	AssetAssignmentRecord,
	AssetAssignmentStatus,
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
import { ASSET_ASSIGNMENT_STATUS, ASSET_STATUS } from '../shared/contract-enums';

function decodeAssetStatus(value: unknown, field: string): AssetStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_STATUS);
}

function decodeAssetAssignmentStatus(value: unknown, field: string): AssetAssignmentStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_ASSIGNMENT_STATUS);
}

export function decodeAssetAssignmentRecord(
	value: unknown,
	field = 'assetAssignmentRecord'
): AssetAssignmentRecord {
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
		assigneeId: expectPerformanceServiceOptionalNumber(
			record.assigneeId,
			`${field}.assigneeId`
		),
		assigneeName: expectPerformanceServiceOptionalString(
			record.assigneeName,
			`${field}.assigneeName`
		),
		departmentId: expectPerformanceServiceOptionalNumber(
			record.departmentId,
			`${field}.departmentId`
		),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		assignDate: expectPerformanceServiceString(record.assignDate, `${field}.assignDate`),
		expectedReturnDate: expectPerformanceServiceOptionalString(
			record.expectedReturnDate,
			`${field}.expectedReturnDate`
		),
		actualReturnDate: expectPerformanceServiceOptionalString(
			record.actualReturnDate,
			`${field}.actualReturnDate`
		),
		purpose: expectPerformanceServiceOptionalString(record.purpose, `${field}.purpose`),
		returnRemark: expectPerformanceServiceOptionalString(
			record.returnRemark,
			`${field}.returnRemark`
		),
		status:
			record.status === undefined
				? undefined
				: decodeAssetAssignmentStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeAssetAssignmentPageResult(
	value: unknown,
	field = 'assetAssignmentPageResult'
): AssetAssignmentPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetAssignmentRecord);
}
