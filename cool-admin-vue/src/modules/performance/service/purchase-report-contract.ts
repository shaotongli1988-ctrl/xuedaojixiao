/**
 * 文件职责：定义采购报表只读响应的前端 runtime 契约解码器。
 * 不负责图表渲染、筛选条件编排或采购工作台交互。
 * 维护重点：汇总、趋势和供应商统计必须共享同一条数据边界，避免看板指标被异常响应带偏。
 */

import type {
	PurchaseReportSummary,
	PurchaseReportSupplierStat,
	PurchaseReportTrendPoint
} from '../types';
import {
	expectPerformanceServiceArray,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

export function decodePurchaseReportSummary(
	value: unknown,
	field = 'purchaseReportSummary'
): PurchaseReportSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		totalOrders: expectPerformanceServiceNumber(record.totalOrders, `${field}.totalOrders`),
		totalAmount: expectPerformanceServiceNumber(record.totalAmount, `${field}.totalAmount`),
		inquiringCount: expectPerformanceServiceNumber(
			record.inquiringCount,
			`${field}.inquiringCount`
		),
		pendingApprovalCount: expectPerformanceServiceNumber(
			record.pendingApprovalCount,
			`${field}.pendingApprovalCount`
		),
		approvedCount: expectPerformanceServiceNumber(
			record.approvedCount,
			`${field}.approvedCount`
		),
		receivedCount: expectPerformanceServiceNumber(
			record.receivedCount,
			`${field}.receivedCount`
		),
		closedCount: expectPerformanceServiceNumber(record.closedCount, `${field}.closedCount`),
		cancelledCount: expectPerformanceServiceNumber(
			record.cancelledCount,
			`${field}.cancelledCount`
		),
		supplierCount: expectPerformanceServiceNumber(
			record.supplierCount,
			`${field}.supplierCount`
		)
	};
}

function decodePurchaseReportTrendPoint(
	value: unknown,
	field = 'purchaseReportTrendPoint'
): PurchaseReportTrendPoint {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		period: expectPerformanceServiceString(record.period, `${field}.period`),
		orderCount: expectPerformanceServiceNumber(record.orderCount, `${field}.orderCount`),
		totalAmount: expectPerformanceServiceNumber(record.totalAmount, `${field}.totalAmount`),
		approvedCount: expectPerformanceServiceNumber(
			record.approvedCount,
			`${field}.approvedCount`
		),
		receivedQuantity: expectPerformanceServiceNumber(
			record.receivedQuantity,
			`${field}.receivedQuantity`
		)
	};
}

export function decodePurchaseReportTrendPoints(
	value: unknown,
	field = 'purchaseReportTrendPoints'
): PurchaseReportTrendPoint[] {
	return expectPerformanceServiceArray(value, field).map((item, index) =>
		decodePurchaseReportTrendPoint(item, `${field}[${index}]`)
	);
}

function decodePurchaseReportSupplierStat(
	value: unknown,
	field = 'purchaseReportSupplierStat'
): PurchaseReportSupplierStat {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		supplierName: expectPerformanceServiceString(record.supplierName, `${field}.supplierName`),
		totalAmount: expectPerformanceServiceNumber(record.totalAmount, `${field}.totalAmount`),
		receivedQuantity: expectPerformanceServiceNumber(
			record.receivedQuantity,
			`${field}.receivedQuantity`
		),
		orderCount: expectPerformanceServiceNumber(record.orderCount, `${field}.orderCount`),
		supplierId:
			record.supplierId === undefined
				? undefined
				: expectPerformanceServiceNullableNumber(record.supplierId, `${field}.supplierId`),
		lastOrderDate: expectPerformanceServiceOptionalString(
			record.lastOrderDate,
			`${field}.lastOrderDate`
		)
	};
}

export function decodePurchaseReportSupplierStats(
	value: unknown,
	field = 'purchaseReportSupplierStats'
): PurchaseReportSupplierStat[] {
	return expectPerformanceServiceArray(value, field).map((item, index) =>
		decodePurchaseReportSupplierStat(item, `${field}[${index}]`)
	);
}
