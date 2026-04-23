/**
 * 文件职责：定义课程主链关键响应的前端 runtime 契约解码器。
 * 不负责发请求、学习任务链路或页面展示逻辑。
 * 维护重点：课程主记录和报名摘要必须共享同一条结构边界，避免日期和状态字段被异常响应污染。
 */

import type {
	CourseEnrollmentPageResult,
	CourseEnrollmentRecord,
	CoursePageResult,
	CourseRecord,
	CourseStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

const COURSE_STATUS = ['draft', 'closed', 'published'] as const;

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableString(value, field);
}

function decodeCourseStatus(value: unknown, field: string): CourseStatus {
	return expectPerformanceServiceEnum(value, field, COURSE_STATUS);
}

export function decodeCourseRecord(value: unknown, field = 'courseRecord'): CourseRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		category: expectPerformanceServiceOptionalString(record.category, `${field}.category`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(
			record.updateTime,
			`${field}.updateTime`
		),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		status:
			record.status === undefined
				? undefined
				: decodeCourseStatus(record.status, `${field}.status`),
		code: expectPerformanceServiceOptionalString(record.code, `${field}.code`),
		description: expectPerformanceServiceOptionalString(
			record.description,
			`${field}.description`
		),
		enrollmentCount: expectPerformanceServiceOptionalNumber(
			record.enrollmentCount,
			`${field}.enrollmentCount`
		),
		startDate: decodeOptionalNullableString(record.startDate, `${field}.startDate`),
		endDate: decodeOptionalNullableString(record.endDate, `${field}.endDate`)
	};
}

export function decodeCoursePageResult(
	value: unknown,
	field = 'coursePageResult'
): CoursePageResult {
	return decodePerformanceServicePageResult(value, field, decodeCourseRecord);
}

export function decodeCourseEnrollmentRecord(
	value: unknown,
	field = 'courseEnrollmentRecord'
): CourseEnrollmentRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		status: expectPerformanceServiceOptionalString(record.status, `${field}.status`),
		userId: expectPerformanceServiceOptionalNumber(record.userId, `${field}.userId`) ?? 0,
		userName: expectPerformanceServiceString(record.userName, `${field}.userName`),
		enrollTime: expectPerformanceServiceOptionalString(
			record.enrollTime,
			`${field}.enrollTime`
		),
		score:
			record.score === undefined
				? undefined
				: (expectPerformanceServiceOptionalNumber(record.score, `${field}.score`) ??
					undefined)
	};
}

export function decodeCourseEnrollmentPageResult(
	value: unknown,
	field = 'courseEnrollmentPageResult'
): CourseEnrollmentPageResult {
	return decodePerformanceServicePageResult(value, field, decodeCourseEnrollmentRecord);
}
