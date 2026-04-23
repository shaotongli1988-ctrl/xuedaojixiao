/**
 * 文件职责：定义采购订单关键响应的前端 runtime 契约解码器。
 * 不负责发请求、状态流转按钮编排或采购工作台展示逻辑。
 * 维护重点：采购单主记录与子表明细必须共享同一条结构边界，避免页面在详情、列表和动作返回之间读到漂移字段。
 */

import type {
	PurchaseOrderApprovalLog,
	PurchaseOrderInquiryRecord,
	PurchaseOrderItemRecord,
	PurchaseOrderPageResult,
	PurchaseOrderReceiptRecord,
	PurchaseOrderRecord,
	PurchaseOrderStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

const PURCHASE_ORDER_STATUS = [
	'draft',
	'cancelled',
	'approved',
	'closed',
	'received',
	'inquiring',
	'pendingApproval'
] as const;

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	return expectPerformanceServiceString(value, field);
}

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeOptionalTextLikeString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number' && !Number.isNaN(value)) {
		return String(value);
	}

	throw new Error(`${field} 必须为字符串`);
}

function decodePurchaseOrderStatus(value: unknown, field: string): PurchaseOrderStatus {
	return expectPerformanceServiceEnum(value, field, PURCHASE_ORDER_STATUS);
}

function decodePurchaseOrderItemRecord(
	value: unknown,
	field = 'purchaseOrderItemRecord'
): PurchaseOrderItemRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		itemName: expectPerformanceServiceString(record.itemName, `${field}.itemName`),
		specification: decodeOptionalNullableString(record.specification, `${field}.specification`),
		unit: decodeOptionalNullableString(record.unit, `${field}.unit`),
		quantity:
			expectPerformanceServiceOptionalNumber(record.quantity, `${field}.quantity`) ?? 0,
		unitPrice: decodeOptionalNullableNumber(record.unitPrice, `${field}.unitPrice`),
		amount: decodeOptionalNullableNumber(record.amount, `${field}.amount`),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`)
	};
}

function decodePurchaseOrderInquiryRecord(
	value: unknown,
	field = 'purchaseOrderInquiryRecord'
): PurchaseOrderInquiryRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		supplierId: decodeOptionalNullableNumber(record.supplierId, `${field}.supplierId`),
		supplierName: decodeOptionalNullableString(record.supplierName, `${field}.supplierName`),
		quotedAmount: decodeOptionalNullableNumber(record.quotedAmount, `${field}.quotedAmount`),
		inquiryRemark: decodeOptionalNullableString(record.inquiryRemark, `${field}.inquiryRemark`),
		createdBy: decodeOptionalNullableString(record.createdBy, `${field}.createdBy`),
		createdAt: decodeOptionalNullableString(record.createdAt, `${field}.createdAt`)
	};
}

function decodePurchaseOrderApprovalLog(
	value: unknown,
	field = 'purchaseOrderApprovalLog'
): PurchaseOrderApprovalLog {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		action: expectPerformanceServiceOptionalString(record.action, `${field}.action`),
		approverId: decodeOptionalNullableNumber(record.approverId, `${field}.approverId`),
		approverName: decodeOptionalNullableString(record.approverName, `${field}.approverName`),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`),
		createdAt: decodeOptionalNullableString(record.createdAt, `${field}.createdAt`)
	};
}

function decodePurchaseOrderReceiptRecord(
	value: unknown,
	field = 'purchaseOrderReceiptRecord'
): PurchaseOrderReceiptRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		receivedQuantity: decodeOptionalNullableNumber(
			record.receivedQuantity,
			`${field}.receivedQuantity`
		),
		receivedAt: decodeOptionalNullableString(record.receivedAt, `${field}.receivedAt`),
		receiverId: decodeOptionalNullableNumber(record.receiverId, `${field}.receiverId`),
		receiverName: decodeOptionalNullableString(record.receiverName, `${field}.receiverName`),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`)
	};
}

export function decodePurchaseOrderRecord(
	value: unknown,
	field = 'purchaseOrderRecord'
): PurchaseOrderRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		supplierName: expectPerformanceServiceOptionalString(
			record.supplierName,
			`${field}.supplierName`
		),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		requesterName: expectPerformanceServiceOptionalString(
			record.requesterName,
			`${field}.requesterName`
		),
		status:
			record.status === undefined
				? undefined
				: decodePurchaseOrderStatus(record.status, `${field}.status`),
		totalAmount:
			expectPerformanceServiceOptionalNumber(record.totalAmount, `${field}.totalAmount`) ?? 0,
		orderNo: expectPerformanceServiceOptionalString(record.orderNo, `${field}.orderNo`),
		orderDate: expectPerformanceServiceString(record.orderDate, `${field}.orderDate`),
		currency: expectPerformanceServiceOptionalString(record.currency, `${field}.currency`),
		supplierId:
			expectPerformanceServiceOptionalNumber(record.supplierId, `${field}.supplierId`) ??
			undefined,
		departmentId:
			expectPerformanceServiceOptionalNumber(record.departmentId, `${field}.departmentId`) ??
			undefined,
		requesterId:
			expectPerformanceServiceOptionalNumber(record.requesterId, `${field}.requesterId`) ??
			undefined,
		expectedDeliveryDate: decodeOptionalNullableString(
			record.expectedDeliveryDate,
			`${field}.expectedDeliveryDate`
		),
		approvedBy:
			typeof record.approvedByName === 'string' && record.approvedByName.trim()
				? record.approvedByName
				: decodeOptionalTextLikeString(record.approvedBy, `${field}.approvedBy`),
		approvedAt: decodeOptionalNullableString(record.approvedAt, `${field}.approvedAt`),
		approvalRemark: decodeOptionalNullableString(
			record.approvalRemark,
			`${field}.approvalRemark`
		),
		closedReason: decodeOptionalNullableString(record.closedReason, `${field}.closedReason`),
		receivedQuantity: decodeOptionalNullableNumber(
			record.receivedQuantity,
			`${field}.receivedQuantity`
		),
		receivedAt: decodeOptionalNullableString(record.receivedAt, `${field}.receivedAt`),
		items:
			record.items == null
				? undefined
				: expectPerformanceServiceArray(record.items, `${field}.items`).map((item, index) =>
						decodePurchaseOrderItemRecord(item, `${field}.items[${index}]`)
				  ),
		inquiryRecords:
			record.inquiryRecords == null
				? undefined
				: expectPerformanceServiceArray(
						record.inquiryRecords,
						`${field}.inquiryRecords`
				  ).map((item, index) =>
						decodePurchaseOrderInquiryRecord(item, `${field}.inquiryRecords[${index}]`)
				  ),
		approvalLogs:
			record.approvalLogs == null
				? undefined
				: expectPerformanceServiceArray(
						record.approvalLogs,
						`${field}.approvalLogs`
				  ).map((item, index) =>
						decodePurchaseOrderApprovalLog(item, `${field}.approvalLogs[${index}]`)
				  ),
		receiptRecords:
			record.receiptRecords == null
				? undefined
				: expectPerformanceServiceArray(
						record.receiptRecords,
						`${field}.receiptRecords`
				  ).map((item, index) =>
						decodePurchaseOrderReceiptRecord(item, `${field}.receiptRecords[${index}]`)
				  ),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`)
	};
}

export function decodePurchaseOrderPageResult(
	value: unknown,
	field = 'purchaseOrderPageResult'
): PurchaseOrderPageResult {
	return decodePerformanceServicePageResult(value, field, decodePurchaseOrderRecord);
}
