/**
 * 文件职责：定义录用管理关键响应的前端 runtime 契约解码器。
 * 不负责发请求、状态动作编排或页面来源摘要拼装。
 * 维护重点：录用主记录与来源快照必须共享同一条结构边界，避免 offered/终态流转和来源关联字段被异常响应污染。
 */

import type {
	HiringPageResult,
	HiringSourceSnapshot,
	HiringStatus,
	HiringTransportRecord,
	InterviewStatus
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';
import { HIRING_SOURCE_TYPE, HIRING_STATUS, INTERVIEW_STATUS } from '../shared/contract-enums';

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	return expectPerformanceServiceString(value, field);
}

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeInterviewStatus(value: unknown, field: string): InterviewStatus {
	return expectPerformanceServiceEnum(value, field, INTERVIEW_STATUS);
}

function decodeHiringStatus(value: unknown, field: string): HiringStatus {
	return expectPerformanceServiceEnum(value, field, HIRING_STATUS);
}

function decodeHiringSourceSnapshot(value: unknown, field: string): HiringSourceSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		sourceResource:
			record.sourceResource === undefined
				? undefined
				: record.sourceResource === null
					? null
					: expectPerformanceServiceEnum(
							record.sourceResource,
							`${field}.sourceResource`,
							HIRING_SOURCE_TYPE
						),
		interviewId: decodeOptionalNullableNumber(record.interviewId, `${field}.interviewId`),
		resumePoolId: decodeOptionalNullableNumber(record.resumePoolId, `${field}.resumePoolId`),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		recruitPlanTitle: decodeOptionalNullableString(
			record.recruitPlanTitle,
			`${field}.recruitPlanTitle`
		),
		candidateName: decodeOptionalNullableString(record.candidateName, `${field}.candidateName`),
		targetDepartmentId: decodeOptionalNullableNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetDepartmentName: decodeOptionalNullableString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		targetPosition: decodeOptionalNullableString(
			record.targetPosition,
			`${field}.targetPosition`
		),
		interviewStatus:
			record.interviewStatus === undefined
				? undefined
				: record.interviewStatus === null
					? null
					: decodeInterviewStatus(record.interviewStatus, `${field}.interviewStatus`),
		sourceStatusSnapshot: decodeOptionalNullableString(
			record.sourceStatusSnapshot,
			`${field}.sourceStatusSnapshot`
		)
	};
}

export function decodeHiringTransportRecord(
	value: unknown,
	field = 'hiringTransportRecord'
): HiringTransportRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		candidateName: expectPerformanceServiceString(
			record.candidateName,
			`${field}.candidateName`
		),
		targetDepartmentId: expectPerformanceServiceNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetDepartmentName: decodeOptionalNullableString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		targetPosition: decodeOptionalNullableString(
			record.targetPosition,
			`${field}.targetPosition`
		),
		sourceType:
			record.sourceType === undefined
				? undefined
				: record.sourceType === null
					? null
					: expectPerformanceServiceEnum(
							record.sourceType,
							`${field}.sourceType`,
							HIRING_SOURCE_TYPE
						),
		sourceId: decodeOptionalNullableNumber(record.sourceId, `${field}.sourceId`),
		sourceStatusSnapshot: decodeOptionalNullableString(
			record.sourceStatusSnapshot,
			`${field}.sourceStatusSnapshot`
		),
		sourceSnapshot:
			record.sourceSnapshot === undefined
				? undefined
				: record.sourceSnapshot === null
					? null
					: typeof record.sourceSnapshot === 'string'
						? record.sourceSnapshot
						: decodeHiringSourceSnapshot(
								record.sourceSnapshot,
								`${field}.sourceSnapshot`
							),
		interviewId: decodeOptionalNullableNumber(record.interviewId, `${field}.interviewId`),
		resumePoolId: decodeOptionalNullableNumber(record.resumePoolId, `${field}.resumePoolId`),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		hiringDecision: decodeOptionalNullableString(
			record.hiringDecision,
			`${field}.hiringDecision`
		),
		decisionContent: decodeOptionalNullableString(
			record.decisionContent,
			`${field}.decisionContent`
		),
		status: decodeHiringStatus(record.status, `${field}.status`),
		offeredAt: decodeOptionalNullableString(record.offeredAt, `${field}.offeredAt`),
		acceptedAt: decodeOptionalNullableString(record.acceptedAt, `${field}.acceptedAt`),
		rejectedAt: decodeOptionalNullableString(record.rejectedAt, `${field}.rejectedAt`),
		closedAt: decodeOptionalNullableString(record.closedAt, `${field}.closedAt`),
		closeReason: decodeOptionalNullableString(record.closeReason, `${field}.closeReason`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeHiringPageResult(
	value: unknown,
	field = 'hiringPageResult'
): HiringPageResult {
	return decodePerformanceServicePageResult(value, field, decodeHiringTransportRecord);
}
