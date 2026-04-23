/**
 * 文件职责：定义指标库关键响应的前端 runtime 契约解码器。
 * 不负责发请求、页面表单校验或字典文案映射。
 * 维护重点：指标主记录与列表必须共享同一条结构边界，避免状态和适用范围字段被异常响应污染。
 */

import type {
	IndicatorApplyScope,
	IndicatorCategory,
	IndicatorPageResult,
	IndicatorRecord,
	IndicatorStatus
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
import {
	INDICATOR_APPLY_SCOPE,
	INDICATOR_CATEGORY,
	INDICATOR_STATUS
} from '../shared/contract-enums';

function decodeIndicatorCategory(value: unknown, field: string): IndicatorCategory {
	return expectPerformanceServiceEnum(value, field, INDICATOR_CATEGORY);
}

function decodeIndicatorApplyScope(value: unknown, field: string): IndicatorApplyScope {
	return expectPerformanceServiceEnum(value, field, INDICATOR_APPLY_SCOPE);
}

function decodeIndicatorStatus(value: unknown, field: string): IndicatorStatus {
	if (typeof value !== 'number' || !INDICATOR_STATUS.includes(value as IndicatorStatus)) {
		throw new Error(`${field} 非法`);
	}

	return value as IndicatorStatus;
}

export function decodeIndicatorRecord(value: unknown, field = 'indicatorRecord'): IndicatorRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		code: expectPerformanceServiceString(record.code, `${field}.code`),
		category: decodeIndicatorCategory(record.category, `${field}.category`),
		weight: expectPerformanceServiceNumber(record.weight, `${field}.weight`),
		scoreScale: expectPerformanceServiceNumber(record.scoreScale, `${field}.scoreScale`),
		applyScope: decodeIndicatorApplyScope(record.applyScope, `${field}.applyScope`),
		description:
			record.description === undefined
				? undefined
				: record.description === null
					? null
					: expectPerformanceServiceString(record.description, `${field}.description`),
		status: decodeIndicatorStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeIndicatorPageResult(
	value: unknown,
	field = 'indicatorPageResult'
): IndicatorPageResult {
	return decodePerformanceServicePageResult(value, field, decodeIndicatorRecord);
}
