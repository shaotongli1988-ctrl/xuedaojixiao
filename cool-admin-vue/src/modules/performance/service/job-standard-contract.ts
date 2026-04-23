/**
 * 文件职责：定义职位标准关键响应的前端 runtime 契约解码器。
 * 不负责发请求、页面筛选状态或招聘链后续跳转。
 * 维护重点：职位标准主记录与列表必须共享同一条结构边界，避免岗位状态和标签字段被异常响应污染。
 */

import type { JobStandardPageResult, JobStandardRecord, JobStandardStatus } from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString,
	expectPerformanceServiceStringArray
} from './service-contract';

const JOB_STANDARD_STATUS = ['draft', 'active', 'inactive'] as const;

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	return expectPerformanceServiceString(value, field);
}

function decodeJobStandardStatus(value: unknown, field: string): JobStandardStatus {
	return expectPerformanceServiceEnum(value, field, JOB_STANDARD_STATUS);
}

export function decodeJobStandardRecord(
	value: unknown,
	field = 'jobStandardRecord'
): JobStandardRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		positionName: expectPerformanceServiceString(record.positionName, `${field}.positionName`),
		targetDepartmentId:
			expectPerformanceServiceOptionalNumber(
				record.targetDepartmentId,
				`${field}.targetDepartmentId`
			) ?? undefined,
		targetDepartmentName: expectPerformanceServiceOptionalString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		jobLevel: decodeOptionalNullableString(record.jobLevel, `${field}.jobLevel`),
		profileSummary: decodeOptionalNullableString(
			record.profileSummary,
			`${field}.profileSummary`
		),
		requirementSummary: decodeOptionalNullableString(
			record.requirementSummary,
			`${field}.requirementSummary`
		),
		skillTagList:
			record.skillTagList === undefined
				? undefined
				: expectPerformanceServiceStringArray(record.skillTagList, `${field}.skillTagList`),
		interviewTemplateSummary: decodeOptionalNullableString(
			record.interviewTemplateSummary,
			`${field}.interviewTemplateSummary`
		),
		status:
			record.status === undefined
				? undefined
				: decodeJobStandardStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeJobStandardPageResult(
	value: unknown,
	field = 'jobStandardPageResult'
): JobStandardPageResult {
	return decodePerformanceServicePageResult(value, field, decodeJobStandardRecord);
}
