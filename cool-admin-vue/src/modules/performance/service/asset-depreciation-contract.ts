/**
 * 文件职责：定义资产折旧关键响应的前端 runtime 契约解码器。
 * 不负责发请求、财务关账或会计凭证逻辑。
 * 维护重点：折旧明细与汇总必须共享同一条结构边界，避免金额和月份字段被异常响应污染。
 */

import type {
	AssetDepreciationPageResult,
	AssetDepreciationRecord,
	AssetDepreciationSummary,
	AssetStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNumber,
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

function decodeAssetStatus(value: unknown, field: string): AssetStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_STATUS);
}

export function decodeAssetDepreciationRecord(
	value: unknown,
	field = 'assetDepreciationRecord'
): AssetDepreciationRecord {
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
		departmentId: expectPerformanceServiceOptionalNumber(
			record.departmentId,
			`${field}.departmentId`
		),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		depreciationMonth: expectPerformanceServiceString(
			record.depreciationMonth,
			`${field}.depreciationMonth`
		),
		originalAmount: expectPerformanceServiceNumber(
			record.originalAmount,
			`${field}.originalAmount`
		),
		residualValue: expectPerformanceServiceNumber(
			record.residualValue,
			`${field}.residualValue`
		),
		monthlyDepreciation: expectPerformanceServiceNumber(
			record.monthlyDepreciation,
			`${field}.monthlyDepreciation`
		),
		accumulatedDepreciation: expectPerformanceServiceNumber(
			record.accumulatedDepreciation,
			`${field}.accumulatedDepreciation`
		),
		netValue: expectPerformanceServiceNumber(record.netValue, `${field}.netValue`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeAssetDepreciationPageResult(
	value: unknown,
	field = 'assetDepreciationPageResult'
): AssetDepreciationPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetDepreciationRecord);
}

export function decodeAssetDepreciationSummary(
	value: unknown,
	field = 'assetDepreciationSummary'
): AssetDepreciationSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		month: expectPerformanceServiceOptionalString(record.month, `${field}.month`),
		assetCount: expectPerformanceServiceNumber(record.assetCount, `${field}.assetCount`),
		totalOriginalAmount: expectPerformanceServiceNumber(
			record.totalOriginalAmount,
			`${field}.totalOriginalAmount`
		),
		totalAccumulatedDepreciation: expectPerformanceServiceNumber(
			record.totalAccumulatedDepreciation,
			`${field}.totalAccumulatedDepreciation`
		),
		totalNetValue: expectPerformanceServiceNumber(
			record.totalNetValue,
			`${field}.totalNetValue`
		),
		currentMonthDepreciation: expectPerformanceServiceNumber(
			record.currentMonthDepreciation,
			`${field}.currentMonthDepreciation`
		),
		lastRecalculatedAt: expectPerformanceServiceOptionalString(
			record.lastRecalculatedAt,
			`${field}.lastRecalculatedAt`
		)
	};
}
