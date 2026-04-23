/**
 * 文件职责：定义人才资产关键响应的前端 runtime 契约解码器。
 * 不负责发请求、来源自动转化或联系方式导出。
 * 维护重点：人才资产主记录与列表必须共享同一条结构边界，避免状态和标签字段被异常响应污染。
 */

import type {
	TalentAssetPageResult,
	TalentAssetRecord,
	TalentAssetStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString,
	expectPerformanceServiceStringArray
} from './service-contract';

const TALENT_ASSET_STATUS = ['new', 'tracking', 'archived'] as const;

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	return expectPerformanceServiceString(value, field);
}

function decodeTalentAssetStatus(value: unknown, field: string): TalentAssetStatus {
	return expectPerformanceServiceEnum(value, field, TALENT_ASSET_STATUS);
}

export function decodeTalentAssetRecord(
	value: unknown,
	field = 'talentAssetRecord'
): TalentAssetRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		candidateName: expectPerformanceServiceString(record.candidateName, `${field}.candidateName`),
		code: decodeOptionalNullableString(record.code, `${field}.code`),
		targetDepartmentId:
			expectPerformanceServiceOptionalNumber(
				record.targetDepartmentId,
				`${field}.targetDepartmentId`
			) ?? undefined,
		targetDepartmentName: expectPerformanceServiceOptionalString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		targetPosition: decodeOptionalNullableString(record.targetPosition, `${field}.targetPosition`),
		source: expectPerformanceServiceString(record.source, `${field}.source`),
		tagList:
			record.tagList === undefined
				? undefined
				: expectPerformanceServiceStringArray(record.tagList, `${field}.tagList`),
		followUpSummary: decodeOptionalNullableString(
			record.followUpSummary,
			`${field}.followUpSummary`
		),
		nextFollowUpDate: decodeOptionalNullableString(
			record.nextFollowUpDate,
			`${field}.nextFollowUpDate`
		),
		status:
			record.status === undefined
				? undefined
				: decodeTalentAssetStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeTalentAssetPageResult(
	value: unknown,
	field = 'talentAssetPageResult'
): TalentAssetPageResult {
	return decodePerformanceServicePageResult(value, field, decodeTalentAssetRecord);
}
