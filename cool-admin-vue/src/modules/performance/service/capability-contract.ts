/**
 * 文件职责：定义能力地图关键响应的前端 runtime 契约解码器。
 * 不负责发请求、课程联动或页面画像展示逻辑。
 * 维护重点：模型、明细项和画像详情必须共享同一条结构边界，避免可空字段和状态字段被异常响应污染。
 */

import type {
	CapabilityItemRecord,
	CapabilityModelPageResult,
	CapabilityModelRecord,
	CapabilityModelStatus,
	CapabilityPortraitRecord
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString,
	expectPerformanceServiceStringArray
} from './service-contract';

const CAPABILITY_MODEL_STATUS = ['draft', 'active', 'archived'] as const;

function decodeCapabilityModelStatus(value: unknown, field: string): CapabilityModelStatus {
	return expectPerformanceServiceEnum(value, field, CAPABILITY_MODEL_STATUS);
}

export function decodeCapabilityModelRecord(
	value: unknown,
	field = 'capabilityModelRecord'
): CapabilityModelRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		code:
			record.code === undefined
				? undefined
				: expectPerformanceServiceNullableString(record.code, `${field}.code`),
		category:
			record.category === undefined
				? undefined
				: expectPerformanceServiceNullableString(record.category, `${field}.category`),
		description:
			record.description === undefined
				? undefined
				: expectPerformanceServiceNullableString(
						record.description,
						`${field}.description`
					),
		status:
			record.status === undefined
				? undefined
				: decodeCapabilityModelStatus(record.status, `${field}.status`),
		itemCount: expectPerformanceServiceOptionalNumber(record.itemCount, `${field}.itemCount`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeCapabilityModelPageResult(
	value: unknown,
	field = 'capabilityModelPageResult'
): CapabilityModelPageResult {
	return decodePerformanceServicePageResult(value, field, decodeCapabilityModelRecord);
}

export function decodeCapabilityItemRecord(
	value: unknown,
	field = 'capabilityItemRecord'
): CapabilityItemRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		modelId: expectPerformanceServiceOptionalNumber(record.modelId, `${field}.modelId`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		level:
			record.level === undefined
				? undefined
				: expectPerformanceServiceNullableString(record.level, `${field}.level`),
		description:
			record.description === undefined
				? undefined
				: expectPerformanceServiceNullableString(
						record.description,
						`${field}.description`
					),
		evidenceHint:
			record.evidenceHint === undefined
				? undefined
				: expectPerformanceServiceNullableString(
						record.evidenceHint,
						`${field}.evidenceHint`
					),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeCapabilityPortraitRecord(
	value: unknown,
	field = 'capabilityPortraitRecord'
): CapabilityPortraitRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		employeeId:
			expectPerformanceServiceOptionalNumber(record.employeeId, `${field}.employeeId`) ?? 0,
		employeeName: expectPerformanceServiceOptionalString(
			record.employeeName,
			`${field}.employeeName`
		),
		departmentId:
			record.departmentId === undefined
				? undefined
				: expectPerformanceServiceNullableNumber(
						record.departmentId,
						`${field}.departmentId`
					),
		departmentName:
			record.departmentName === undefined
				? undefined
				: expectPerformanceServiceNullableString(
						record.departmentName,
						`${field}.departmentName`
					),
		capabilityTags:
			record.capabilityTags === undefined
				? undefined
				: expectPerformanceServiceStringArray(
						record.capabilityTags,
						`${field}.capabilityTags`
					),
		levelSummary:
			record.levelSummary === undefined
				? undefined
				: expectPerformanceServiceStringArray(record.levelSummary, `${field}.levelSummary`),
		certificateCount: expectPerformanceServiceOptionalNumber(
			record.certificateCount,
			`${field}.certificateCount`
		),
		lastCertifiedAt:
			record.lastCertifiedAt === undefined
				? undefined
				: expectPerformanceServiceNullableString(
						record.lastCertifiedAt,
						`${field}.lastCertifiedAt`
					),
		updatedAt: expectPerformanceServiceOptionalString(record.updatedAt, `${field}.updatedAt`)
	};
}
