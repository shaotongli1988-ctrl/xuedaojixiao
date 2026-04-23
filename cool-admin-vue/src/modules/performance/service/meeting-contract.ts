/**
 * 文件职责：定义会议管理关键响应的前端 runtime 契约解码器。
 * 不负责发请求、签到交互或会议详情展示编排。
 * 维护重点：会议主记录与分页结果必须共享同一条结构边界，避免终态和人员字段被异常响应污染。
 */

import type {
	MeetingPageResult,
	MeetingRecord,
	MeetingStatus
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

const MEETING_STATUS = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

function decodeMeetingStatus(value: unknown, field: string): MeetingStatus {
	return expectPerformanceServiceEnum(value, field, MEETING_STATUS);
}

export function decodeMeetingRecord(
	value: unknown,
	field = 'meetingRecord'
): MeetingRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		code:
			record.code === undefined
				? undefined
				: expectPerformanceServiceNullableString(record.code, `${field}.code`),
		type:
			record.type === undefined
				? undefined
				: expectPerformanceServiceNullableString(record.type, `${field}.type`),
		description:
			record.description === undefined
				? undefined
				: expectPerformanceServiceNullableString(record.description, `${field}.description`),
		startDate: expectPerformanceServiceString(record.startDate, `${field}.startDate`),
		endDate: expectPerformanceServiceString(record.endDate, `${field}.endDate`),
		location:
			record.location === undefined
				? undefined
				: expectPerformanceServiceNullableString(record.location, `${field}.location`),
		organizerId:
			expectPerformanceServiceOptionalNumber(record.organizerId, `${field}.organizerId`) ??
			undefined,
		organizerName: expectPerformanceServiceOptionalString(
			record.organizerName,
			`${field}.organizerName`
		),
		participantCount: expectPerformanceServiceOptionalNumber(
			record.participantCount,
			`${field}.participantCount`
		),
		status:
			record.status === undefined
				? undefined
				: decodeMeetingStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeMeetingPageResult(
	value: unknown,
	field = 'meetingPageResult'
): MeetingPageResult {
	return decodePerformanceServicePageResult(value, field, decodeMeetingRecord);
}
