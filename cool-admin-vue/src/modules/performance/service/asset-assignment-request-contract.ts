/**
 * 文件职责：定义资产领用申请关键响应的前端 runtime 契约解码器。
 * 不负责发请求、审批编排或实际领用记录流转逻辑。
 * 维护重点：申请单主记录与列表必须共享同一条结构边界，避免层级状态和关联资产字段被异常响应污染。
 */

import type {
	AssetAssignmentRequestLevel,
	AssetAssignmentRequestPageResult,
	AssetAssignmentRequestRecord,
	AssetAssignmentRequestStatus,
	AssetAssignmentRequestType,
	AssetAssignmentStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString,
	expectPerformanceServiceStringArray
} from './service-contract';
import {
	ASSET_ASSIGNMENT_REQUEST_LEVEL,
	ASSET_ASSIGNMENT_REQUEST_STATUS,
	ASSET_ASSIGNMENT_REQUEST_TYPE,
	ASSET_ASSIGNMENT_STATUS
} from '../shared/contract-enums';

function decodeAssetAssignmentRequestLevel(
	value: unknown,
	field: string
): AssetAssignmentRequestLevel {
	return expectPerformanceServiceEnum(value, field, ASSET_ASSIGNMENT_REQUEST_LEVEL);
}

function decodeAssetAssignmentRequestType(
	value: unknown,
	field: string
): AssetAssignmentRequestType {
	return expectPerformanceServiceEnum(value, field, ASSET_ASSIGNMENT_REQUEST_TYPE);
}

function decodeAssetAssignmentStatus(value: unknown, field: string): AssetAssignmentStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_ASSIGNMENT_STATUS);
}

function decodeAssetAssignmentRequestStatus(
	value: unknown,
	field: string
): AssetAssignmentRequestStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_ASSIGNMENT_REQUEST_STATUS);
}

export function decodeAssetAssignmentRequestRecord(
	value: unknown,
	field = 'assetAssignmentRequestRecord'
): AssetAssignmentRequestRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		requestNo: expectPerformanceServiceOptionalString(record.requestNo, `${field}.requestNo`),
		requestLevel:
			record.requestLevel === undefined
				? undefined
				: decodeAssetAssignmentRequestLevel(record.requestLevel, `${field}.requestLevel`),
		requestType: decodeAssetAssignmentRequestType(record.requestType, `${field}.requestType`),
		applicantId: expectPerformanceServiceOptionalNumber(
			record.applicantId,
			`${field}.applicantId`
		),
		applicantName: expectPerformanceServiceOptionalString(
			record.applicantName,
			`${field}.applicantName`
		),
		applicantDepartmentId: expectPerformanceServiceOptionalNumber(
			record.applicantDepartmentId,
			`${field}.applicantDepartmentId`
		),
		applicantDepartmentName: expectPerformanceServiceOptionalString(
			record.applicantDepartmentName,
			`${field}.applicantDepartmentName`
		),
		assetCategory: expectPerformanceServiceString(
			record.assetCategory,
			`${field}.assetCategory`
		),
		assetModelRequest: expectPerformanceServiceOptionalString(
			record.assetModelRequest,
			`${field}.assetModelRequest`
		),
		quantity: expectPerformanceServiceNumber(record.quantity, `${field}.quantity`),
		unitPriceEstimate: expectPerformanceServiceNumber(
			record.unitPriceEstimate,
			`${field}.unitPriceEstimate`
		),
		usageReason: expectPerformanceServiceOptionalString(
			record.usageReason,
			`${field}.usageReason`
		),
		expectedUseStartDate: expectPerformanceServiceOptionalString(
			record.expectedUseStartDate,
			`${field}.expectedUseStartDate`
		),
		targetDepartmentId: expectPerformanceServiceOptionalNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetDepartmentName: expectPerformanceServiceOptionalString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		exceptionReason: expectPerformanceServiceOptionalString(
			record.exceptionReason,
			`${field}.exceptionReason`
		),
		originalAssetId: expectPerformanceServiceOptionalNumber(
			record.originalAssetId,
			`${field}.originalAssetId`
		),
		originalAssetNo: expectPerformanceServiceOptionalString(
			record.originalAssetNo,
			`${field}.originalAssetNo`
		),
		originalAssignmentId: expectPerformanceServiceOptionalNumber(
			record.originalAssignmentId,
			`${field}.originalAssignmentId`
		),
		approvalInstanceId: expectPerformanceServiceOptionalNumber(
			record.approvalInstanceId,
			`${field}.approvalInstanceId`
		),
		approvalStatus: expectPerformanceServiceOptionalString(
			record.approvalStatus,
			`${field}.approvalStatus`
		),
		currentApproverId: expectPerformanceServiceOptionalNumber(
			record.currentApproverId,
			`${field}.currentApproverId`
		),
		currentApproverName: expectPerformanceServiceOptionalString(
			record.currentApproverName,
			`${field}.currentApproverName`
		),
		approvalTriggeredRules:
			record.approvalTriggeredRules === undefined
				? undefined
				: expectPerformanceServiceStringArray(
						record.approvalTriggeredRules,
						`${field}.approvalTriggeredRules`
					),
		assignedAssetId: expectPerformanceServiceOptionalNumber(
			record.assignedAssetId,
			`${field}.assignedAssetId`
		),
		assignedAssetNo: expectPerformanceServiceOptionalString(
			record.assignedAssetNo,
			`${field}.assignedAssetNo`
		),
		assignedAssetName: expectPerformanceServiceOptionalString(
			record.assignedAssetName,
			`${field}.assignedAssetName`
		),
		assignmentRecordId: expectPerformanceServiceOptionalNumber(
			record.assignmentRecordId,
			`${field}.assignmentRecordId`
		),
		assignmentStatus:
			record.assignmentStatus === undefined
				? undefined
				: decodeAssetAssignmentStatus(record.assignmentStatus, `${field}.assignmentStatus`),
		assignedBy: expectPerformanceServiceOptionalNumber(
			record.assignedBy,
			`${field}.assignedBy`
		),
		assignedByName: expectPerformanceServiceOptionalString(
			record.assignedByName,
			`${field}.assignedByName`
		),
		assignedAt: expectPerformanceServiceOptionalString(
			record.assignedAt,
			`${field}.assignedAt`
		),
		status:
			record.status === undefined
				? undefined
				: decodeAssetAssignmentRequestStatus(record.status, `${field}.status`),
		submitTime: expectPerformanceServiceOptionalString(
			record.submitTime,
			`${field}.submitTime`
		),
		withdrawTime: expectPerformanceServiceOptionalString(
			record.withdrawTime,
			`${field}.withdrawTime`
		),
		cancelReason: expectPerformanceServiceOptionalString(
			record.cancelReason,
			`${field}.cancelReason`
		),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeAssetAssignmentRequestPageResult(
	value: unknown,
	field = 'assetAssignmentRequestPageResult'
): AssetAssignmentRequestPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetAssignmentRequestRecord);
}
