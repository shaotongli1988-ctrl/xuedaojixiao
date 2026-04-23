/**
 * 文件职责：定义资产报表关键响应的前端 runtime 契约解码器。
 * 不负责发请求、图表渲染或导出文件处理逻辑。
 * 维护重点：报表摘要、列表和导出行必须共享同一条结构边界，避免状态和金额字段被异常响应污染。
 */

import type {
	AssetDisposalStatus,
	AssetReportExportResult,
	AssetReportPageResult,
	AssetReportRecord,
	AssetReportSummary,
	AssetStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord
} from './service-contract';
import { ASSET_DISPOSAL_STATUS, ASSET_STATUS } from '../shared/contract-enums';

function decodeAssetStatus(value: unknown, field: string): AssetStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_STATUS);
}

function decodeAssetDisposalStatus(value: unknown, field: string): AssetDisposalStatus {
	return expectPerformanceServiceEnum(value, field, ASSET_DISPOSAL_STATUS);
}

export function decodeAssetReportRecord(
	value: unknown,
	field = 'assetReportRecord'
): AssetReportRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		reportDate: expectPerformanceServiceOptionalString(
			record.reportDate,
			`${field}.reportDate`
		),
		assetId: expectPerformanceServiceOptionalNumber(record.assetId, `${field}.assetId`),
		assetNo: expectPerformanceServiceOptionalString(record.assetNo, `${field}.assetNo`),
		assetName: expectPerformanceServiceOptionalString(record.assetName, `${field}.assetName`),
		category: expectPerformanceServiceOptionalString(record.category, `${field}.category`),
		departmentId: expectPerformanceServiceOptionalNumber(
			record.departmentId,
			`${field}.departmentId`
		),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		assetStatus:
			record.assetStatus === undefined
				? undefined
				: decodeAssetStatus(record.assetStatus, `${field}.assetStatus`),
		originalAmount: expectPerformanceServiceOptionalNumber(
			record.originalAmount,
			`${field}.originalAmount`
		),
		netValue: expectPerformanceServiceOptionalNumber(record.netValue, `${field}.netValue`),
		monthlyDepreciation: expectPerformanceServiceOptionalNumber(
			record.monthlyDepreciation,
			`${field}.monthlyDepreciation`
		),
		disposalStatus:
			record.disposalStatus === undefined
				? undefined
				: decodeAssetDisposalStatus(record.disposalStatus, `${field}.disposalStatus`),
		remark: expectPerformanceServiceOptionalString(record.remark, `${field}.remark`)
	};
}

export function decodeAssetReportSummary(
	value: unknown,
	field = 'assetReportSummary'
): AssetReportSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		assetCount: expectPerformanceServiceNumber(record.assetCount, `${field}.assetCount`),
		totalOriginalAmount: expectPerformanceServiceNumber(
			record.totalOriginalAmount,
			`${field}.totalOriginalAmount`
		),
		totalNetValue: expectPerformanceServiceNumber(
			record.totalNetValue,
			`${field}.totalNetValue`
		),
		assignedCount: expectPerformanceServiceNumber(
			record.assignedCount,
			`${field}.assignedCount`
		),
		maintenanceCount: expectPerformanceServiceNumber(
			record.maintenanceCount,
			`${field}.maintenanceCount`
		),
		scrappedCount: expectPerformanceServiceNumber(
			record.scrappedCount,
			`${field}.scrappedCount`
		),
		lostCount: expectPerformanceServiceNumber(record.lostCount, `${field}.lostCount`)
	};
}

export function decodeAssetReportPageResult(
	value: unknown,
	field = 'assetReportPageResult'
): AssetReportPageResult {
	return decodePerformanceServicePageResult(value, field, decodeAssetReportRecord);
}

export function decodeAssetReportExportResult(
	value: unknown,
	field = 'assetReportExportResult'
): AssetReportExportResult {
	return expectPerformanceServiceArray(value, field).map((item, index) =>
		decodeAssetReportRecord(item, `${field}[${index}]`)
	);
}
