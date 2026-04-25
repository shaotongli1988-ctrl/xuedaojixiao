/**
 * 文件职责：定义招聘面试关键响应的前端 runtime 契约解码器。
 * 不负责发请求、路由跳转或页面详情摘要拼装。
 * 维护重点：面试主记录与招聘链来源快照必须共享同一条结构边界，避免详情页和录用链路读到漂移字段。
 */

import type {
	InterviewPageResult,
	InterviewRecord,
	InterviewStatus,
	RecruitmentSourceSnapshot
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
import {
	INTERVIEW_STATUS,
	INTERVIEW_TYPE,
	RECRUITMENT_SOURCE_RESOURCE,
	RECRUIT_PLAN_STATUS,
	RESUME_POOL_STATUS
} from '../shared/contract-enums';

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

function decodeInterviewSourceSnapshot(value: unknown, field: string): RecruitmentSourceSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		sourceResource:
			record.sourceResource === undefined
				? undefined
				: expectPerformanceServiceEnum(record.sourceResource, `${field}.sourceResource`, [
						...RECRUITMENT_SOURCE_RESOURCE
					] as const),
		talentAssetId: decodeOptionalNullableNumber(record.talentAssetId, `${field}.talentAssetId`),
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`),
		jobStandardPositionName: decodeOptionalNullableString(
			record.jobStandardPositionName,
			`${field}.jobStandardPositionName`
		),
		jobStandardRequirementSummary: decodeOptionalNullableString(
			record.jobStandardRequirementSummary,
			`${field}.jobStandardRequirementSummary`
		),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		recruitPlanTitle: decodeOptionalNullableString(
			record.recruitPlanTitle,
			`${field}.recruitPlanTitle`
		),
		recruitPlanStatus:
			record.recruitPlanStatus === undefined
				? undefined
				: expectPerformanceServiceEnum(
						record.recruitPlanStatus,
						`${field}.recruitPlanStatus`,
						RECRUIT_PLAN_STATUS
					),
		resumePoolId: decodeOptionalNullableNumber(record.resumePoolId, `${field}.resumePoolId`),
		interviewId: decodeOptionalNullableNumber(record.interviewId, `${field}.interviewId`),
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
				: decodeInterviewStatus(record.interviewStatus, `${field}.interviewStatus`),
		sourceStatusSnapshot: decodeOptionalNullableString(
			record.sourceStatusSnapshot,
			`${field}.sourceStatusSnapshot`
		)
	};
}

function decodeInterviewResumePoolSummary(
	value: unknown,
	field: string
): RecruitmentSourceSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		sourceResource: 'resumePool',
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		resumePoolId: expectPerformanceServiceOptionalNumber(record.id, `${field}.resumePoolId`),
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
		sourceStatusSnapshot:
			record.status === undefined
				? undefined
				: expectPerformanceServiceEnum(
						record.status,
						`${field}.status`,
						RESUME_POOL_STATUS
					),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`)
	};
}

function decodeInterviewRecruitPlanSummary(
	value: unknown,
	field: string
): RecruitmentSourceSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		sourceResource: 'recruitPlan',
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		recruitPlanId: expectPerformanceServiceOptionalNumber(record.id, `${field}.recruitPlanId`),
		recruitPlanTitle: expectPerformanceServiceString(record.title, `${field}.title`),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		positionName: decodeOptionalNullableString(record.positionName, `${field}.positionName`),
		recruitPlanStatus:
			record.status === undefined
				? undefined
				: expectPerformanceServiceEnum(
						record.status,
						`${field}.status`,
						RECRUIT_PLAN_STATUS
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
			record.positionName,
			`${field}.targetPosition`
		),
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`)
	};
}

export function decodeInterviewRecord(value: unknown, field = 'interviewRecord'): InterviewRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		candidateName: expectPerformanceServiceString(
			record.candidateName,
			`${field}.candidateName`
		),
		position: expectPerformanceServiceString(record.position, `${field}.position`),
		departmentId: decodeOptionalNullableNumber(record.departmentId, `${field}.departmentId`),
		interviewerId:
			expectPerformanceServiceOptionalNumber(
				record.interviewerId,
				`${field}.interviewerId`
			) ?? undefined,
		interviewerName: expectPerformanceServiceOptionalString(
			record.interviewerName,
			`${field}.interviewerName`
		),
		interviewDate: expectPerformanceServiceString(
			record.interviewDate,
			`${field}.interviewDate`
		),
		interviewType:
			record.interviewType === undefined
				? undefined
				: record.interviewType === null
					? null
					: expectPerformanceServiceEnum(
							record.interviewType,
							`${field}.interviewType`,
							INTERVIEW_TYPE
						),
		score: decodeOptionalNullableNumber(record.score, `${field}.score`),
		resumePoolId: decodeOptionalNullableNumber(record.resumePoolId, `${field}.resumePoolId`),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		sourceSnapshot:
			record.sourceSnapshot == null
				? null
				: decodeInterviewSourceSnapshot(record.sourceSnapshot, `${field}.sourceSnapshot`),
		resumePoolSummary:
			record.resumePoolSummary == null
				? null
				: decodeInterviewResumePoolSummary(
						record.resumePoolSummary,
						`${field}.resumePoolSummary`
					),
		resumePoolSnapshot:
			record.resumePoolSnapshot == null
				? null
				: decodeInterviewResumePoolSummary(
						record.resumePoolSnapshot,
						`${field}.resumePoolSnapshot`
					),
		recruitPlanSummary:
			record.recruitPlanSummary == null
				? null
				: decodeInterviewRecruitPlanSummary(
						record.recruitPlanSummary,
						`${field}.recruitPlanSummary`
					),
		recruitPlanSnapshot:
			record.recruitPlanSnapshot == null
				? null
				: decodeInterviewRecruitPlanSummary(
						record.recruitPlanSnapshot,
						`${field}.recruitPlanSnapshot`
					),
		status:
			record.status === undefined
				? undefined
				: decodeInterviewStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeInterviewPageResult(
	value: unknown,
	field = 'interviewPageResult'
): InterviewPageResult {
	return decodePerformanceServicePageResult(value, field, decodeInterviewRecord);
}
