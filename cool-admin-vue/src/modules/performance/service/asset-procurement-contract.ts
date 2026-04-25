/**
 * 文件职责：定义资产采购入库关键响应的前端 runtime 契约解码器。
 * 不负责发请求、采购订单审批链或供应商主数据逻辑。
 * 维护重点：采购记录与列表必须共享同一条结构边界，避免状态和关联采购字段被异常响应污染。
 */

import type {
	AssetProcurementPageResult,
	AssetProcurementRecord,
	AssetProcurementStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';
import { ASSET_PROCUREMENT_STATUS } from '../shared/contract-enums';

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeAssetProcurementStatus(value: unknown, field: string): AssetProcurementStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_PROCUREMENT_STATUS);
}

export function decodeAssetProcurementRecord(
	value: unknown,
	field = 'assetProcurementRecord'
): AssetProcurementRecord {
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
		supplierName: expectPerformanceServiceOptionalString(
			record.supplierName,
			`${field}.supplierName`
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
		procurementNo: expectPerformanceServiceOptionalString(
			record.procurementNo,
			`${field}.procurementNo`
		),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		assetCategory: expectPerformanceServiceString(
			record.assetCategory,
			`${field}.assetCategory`
		),
		quantity: expectPerformanceServiceNumber(record.quantity, `${field}.quantity`),
		amount: expectPerformanceServiceNumber(record.amount, `${field}.amount`),
		requesterId: expectPerformanceServiceOptionalNumber(
			record.requesterId,
			`${field}.requesterId`
		),
		requesterName: expectPerformanceServiceOptionalString(
			record.requesterName,
			`${field}.requesterName`
		),
		expectedArrivalDate: expectPerformanceServiceOptionalString(
			record.expectedArrivalDate,
			`${field}.expectedArrivalDate`
		),
		receiveDate: expectPerformanceServiceOptionalString(
			record.receiveDate,
			`${field}.receiveDate`
		),
		status:
			record.status === undefined
				? undefined
				: decodeAssetProcurementStatus(record.status, `${field}.status`),
		supplierId: decodeOptionalNullableNumber(record.supplierId, `${field}.supplierId`),
		purchaseOrderId: decodeOptionalNullableNumber(
			record.purchaseOrderId,
			`${field}.purchaseOrderId`
		)
	};
}

export function decodeAssetProcurementPageResult(
	value: unknown,
	field = 'assetProcurementPageResult'
): AssetProcurementPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetProcurementRecord);
}
