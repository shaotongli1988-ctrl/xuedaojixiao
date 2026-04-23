/**
 * 文件职责：定义资产首页 summary 响应的前端 runtime 契约解码器。
 * 不负责发请求、页面展示编排或单据详情逻辑。
 * 维护重点：总览卡片、分布图和动态流必须共享同一条结构边界，避免统计字段被异常响应污染。
 */

import type {
	AssetCategoryDistributionItem,
	AssetDashboardActionSummaryItem,
	AssetDashboardActivityItem,
	AssetDashboardSummary,
	AssetStatus,
	AssetStatusDistributionItem
} from '../types';
import {
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString,
	expectPerformanceServiceArray
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

const ASSET_DASHBOARD_MODULE = [
	'assetInfo',
	'assetAssignment',
	'assetMaintenance',
	'assetProcurement',
	'assetTransfer',
	'assetInventory',
	'assetDisposal',
	'assetDepreciation'
] as const;

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableString(value, field);
}

function decodeAssetStatus(value: unknown, field: string): AssetStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_STATUS);
}

function decodeAssetStatusDistributionItem(
	value: unknown,
	field: string
): AssetStatusDistributionItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		status: decodeAssetStatus(record.status, `${field}.status`),
		count: expectPerformanceServiceNumber(record.count, `${field}.count`),
		amount: expectPerformanceServiceOptionalNumber(record.amount, `${field}.amount`)
	};
}

function decodeAssetCategoryDistributionItem(
	value: unknown,
	field: string
): AssetCategoryDistributionItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		category: expectPerformanceServiceString(record.category, `${field}.category`),
		count: expectPerformanceServiceNumber(record.count, `${field}.count`),
		amount: expectPerformanceServiceOptionalNumber(record.amount, `${field}.amount`)
	};
}

function decodeAssetDashboardActionSummaryItem(
	value: unknown,
	field: string
): AssetDashboardActionSummaryItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		actionCount: expectPerformanceServiceNumber(record.actionCount, `${field}.actionCount`),
		assetCount: expectPerformanceServiceNumber(record.assetCount, `${field}.assetCount`),
		documentCount: expectPerformanceServiceNumber(
			record.documentCount,
			`${field}.documentCount`
		)
	};
}

function decodeAssetDashboardActivityItem(
	value: unknown,
	field: string
): AssetDashboardActivityItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		status: expectPerformanceServiceOptionalString(record.status, `${field}.status`),
		resultStatus: expectPerformanceServiceOptionalString(
			record.resultStatus,
			`${field}.resultStatus`
		),
		operatorName: expectPerformanceServiceOptionalString(
			record.operatorName,
			`${field}.operatorName`
		),
		module: expectPerformanceServiceEnum(
			record.module,
			`${field}.module`,
			ASSET_DASHBOARD_MODULE
		),
		actionLabel: expectPerformanceServiceOptionalString(
			record.actionLabel,
			`${field}.actionLabel`
		),
		objectNo: expectPerformanceServiceOptionalString(record.objectNo, `${field}.objectNo`),
		objectName: expectPerformanceServiceOptionalString(
			record.objectName,
			`${field}.objectName`
		),
		occurredAt: expectPerformanceServiceOptionalString(
			record.occurredAt,
			`${field}.occurredAt`
		),
		assetId: decodeOptionalNullableNumber(record.assetId, `${field}.assetId`),
		departmentId: decodeOptionalNullableNumber(record.departmentId, `${field}.departmentId`),
		documentKey: decodeOptionalNullableString(record.documentKey, `${field}.documentKey`)
	};
}

export function decodeAssetDashboardSummary(
	value: unknown,
	field = 'assetDashboardSummary'
): AssetDashboardSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		totalAssetCount: expectPerformanceServiceNumber(
			record.totalAssetCount,
			`${field}.totalAssetCount`
		),
		pendingInboundCount: expectPerformanceServiceNumber(
			record.pendingInboundCount,
			`${field}.pendingInboundCount`
		),
		availableCount: expectPerformanceServiceNumber(
			record.availableCount,
			`${field}.availableCount`
		),
		assignedCount: expectPerformanceServiceNumber(
			record.assignedCount,
			`${field}.assignedCount`
		),
		maintenanceCount: expectPerformanceServiceNumber(
			record.maintenanceCount,
			`${field}.maintenanceCount`
		),
		inventoryingCount: expectPerformanceServiceNumber(
			record.inventoryingCount,
			`${field}.inventoryingCount`
		),
		scrappedCount: expectPerformanceServiceNumber(
			record.scrappedCount,
			`${field}.scrappedCount`
		),
		lostCount: expectPerformanceServiceNumber(record.lostCount, `${field}.lostCount`),
		totalOriginalAmount: expectPerformanceServiceNumber(
			record.totalOriginalAmount,
			`${field}.totalOriginalAmount`
		),
		monthlyDepreciationAmount: expectPerformanceServiceNumber(
			record.monthlyDepreciationAmount,
			`${field}.monthlyDepreciationAmount`
		),
		pendingDisposalCount: expectPerformanceServiceNumber(
			record.pendingDisposalCount,
			`${field}.pendingDisposalCount`
		),
		expiringWarrantyCount: expectPerformanceServiceNumber(
			record.expiringWarrantyCount,
			`${field}.expiringWarrantyCount`
		),
		updatedAt: expectPerformanceServiceOptionalString(record.updatedAt, `${field}.updatedAt`),
		statusDistribution: expectPerformanceServiceArray(
			record.statusDistribution,
			`${field}.statusDistribution`
		).map((item, index) =>
			decodeAssetStatusDistributionItem(item, `${field}.statusDistribution[${index}]`)
		),
		categoryDistribution: expectPerformanceServiceArray(
			record.categoryDistribution,
			`${field}.categoryDistribution`
		).map((item, index) =>
			decodeAssetCategoryDistributionItem(item, `${field}.categoryDistribution[${index}]`)
		),
		actionOverview: (() => {
			const actionOverview = expectPerformanceServiceRecord(
				record.actionOverview,
				`${field}.actionOverview`
			);
			return {
				today: decodeAssetDashboardActionSummaryItem(
					actionOverview.today,
					`${field}.actionOverview.today`
				),
				thisWeek: decodeAssetDashboardActionSummaryItem(
					actionOverview.thisWeek,
					`${field}.actionOverview.thisWeek`
				),
				thisMonth: decodeAssetDashboardActionSummaryItem(
					actionOverview.thisMonth,
					`${field}.actionOverview.thisMonth`
				)
			};
		})(),
		actionTimeline: expectPerformanceServiceArray(
			record.actionTimeline,
			`${field}.actionTimeline`
		).map((item, index) =>
			decodeAssetDashboardActivityItem(item, `${field}.actionTimeline[${index}]`)
		),
		recentActivities: expectPerformanceServiceArray(
			record.recentActivities,
			`${field}.recentActivities`
		).map((item, index) =>
			decodeAssetDashboardActivityItem(item, `${field}.recentActivities[${index}]`)
		)
	};
}
