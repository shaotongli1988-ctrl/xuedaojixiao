/**
 * 文件职责：定义简历池关键响应的前端 runtime 契约解码器。
 * 不负责发请求、附件实际下载、路由跳转或页面预填。
 * 维护重点：简历记录、附件摘要、招聘来源快照和动作结果共用同一条结构边界，避免招聘链来源信息被异常响应带偏。
 */

import type {
	RecruitmentSourceSnapshot,
	ResumePoolAttachmentDownloadResult,
	ResumePoolAttachmentSummary,
	ResumePoolCreateInterviewResult,
	ResumePoolExportRow,
	ResumePoolImportResult,
	ResumePoolInterviewSourceSnapshot,
	ResumePoolJobStandardSnapshot,
	ResumePoolPageResult,
	ResumePoolRecord,
	ResumePoolRecruitPlanSnapshot,
	ResumePoolReferenceSnapshot,
	ResumePoolSourceType,
	ResumePoolStatus,
	ResumePoolTalentAssetConvertResult
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceBoolean,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';
import {
	JOB_STANDARD_STATUS,
	RECRUIT_PLAN_STATUS,
	RESUME_POOL_SOURCE_TYPE,
	RESUME_POOL_STATUS
} from '../shared/contract-enums';

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableString(value, field);
}

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeResumePoolStatus(value: unknown, field: string): ResumePoolStatus {
	return expectPerformanceServiceEnum(value, field, RESUME_POOL_STATUS);
}

function decodeResumePoolSourceType(value: unknown, field: string): ResumePoolSourceType {
	return expectPerformanceServiceEnum(value, field, RESUME_POOL_SOURCE_TYPE);
}

function decodeResumePoolAttachmentSummary(
	value: unknown,
	field = 'resumePoolAttachmentSummary'
): ResumePoolAttachmentSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		size: expectPerformanceServiceNumber(record.size, `${field}.size`),
		uploadTime: expectPerformanceServiceString(record.uploadTime, `${field}.uploadTime`)
	};
}

function decodeRecruitPlanSnapshot(value: unknown, field: string): RecruitmentSourceSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: decodeOptionalNullableNumber(record.id, `${field}.id`),
		title: decodeOptionalNullableString(record.title, `${field}.title`),
		status:
			record.status === undefined
				? undefined
				: expectPerformanceServiceEnum(
						record.status,
						`${field}.status`,
						RECRUIT_PLAN_STATUS
					),
		positionName: decodeOptionalNullableString(record.positionName, `${field}.positionName`),
		sourceResource: 'recruitPlan',
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`),
		recruitPlanId: decodeOptionalNullableNumber(record.id, `${field}.recruitPlanId`),
		recruitPlanTitle: decodeOptionalNullableString(record.title, `${field}.recruitPlanTitle`),
		recruitPlanStatus:
			record.status === undefined
				? undefined
				: expectPerformanceServiceEnum(
						record.status,
						`${field}.recruitPlanStatus`,
						RECRUIT_PLAN_STATUS
					),
		targetDepartmentId: decodeOptionalNullableNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetDepartmentName: decodeOptionalNullableString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		targetPosition: decodeOptionalNullableString(record.positionName, `${field}.targetPosition`)
	};
}

function decodeJobStandardSnapshot(value: unknown, field: string): RecruitmentSourceSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: decodeOptionalNullableNumber(record.id, `${field}.id`),
		status:
			record.status === undefined
				? undefined
				: expectPerformanceServiceEnum(
						record.status,
						`${field}.status`,
						JOB_STANDARD_STATUS
					),
		positionName: decodeOptionalNullableString(record.positionName, `${field}.positionName`),
		sourceResource: 'jobStandard',
		jobStandardId: decodeOptionalNullableNumber(record.id, `${field}.jobStandardId`),
		jobStandardPositionName: decodeOptionalNullableString(
			record.positionName,
			`${field}.jobStandardPositionName`
		),
		jobStandardRequirementSummary: decodeOptionalNullableString(
			record.requirementSummary,
			`${field}.jobStandardRequirementSummary`
		),
		targetDepartmentId: decodeOptionalNullableNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetDepartmentName: decodeOptionalNullableString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		targetPosition: decodeOptionalNullableString(record.positionName, `${field}.targetPosition`)
	};
}

function decodeInterviewSourceSnapshot(value: unknown, field: string): RecruitmentSourceSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		sourceResource: 'resumePool',
		resumePoolId: expectPerformanceServiceNumber(record.resumePoolId, `${field}.resumePoolId`),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		recruitPlanTitle: decodeOptionalNullableString(
			record.recruitPlanTitle,
			`${field}.recruitPlanTitle`
		),
		candidateName: decodeOptionalNullableString(record.candidateName, `${field}.candidateName`),
		targetDepartmentId: expectPerformanceServiceNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetPosition: decodeOptionalNullableString(
			record.targetPosition,
			`${field}.targetPosition`
		)
	};
}

function decodeReferenceSnapshot(value: unknown, field: string): RecruitmentSourceSnapshot {
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
		status: decodeResumePoolStatus(record.status, `${field}.status`),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`)
	};
}

function decodeGeneratedInterviewSourceSnapshot(
	value: unknown,
	field: string
): ResumePoolInterviewSourceSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		sourceResource: 'resumePool',
		resumePoolId: expectPerformanceServiceNumber(record.resumePoolId, `${field}.resumePoolId`),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		recruitPlanTitle: decodeOptionalNullableString(
			record.recruitPlanTitle,
			`${field}.recruitPlanTitle`
		),
		candidateName: decodeOptionalNullableString(record.candidateName, `${field}.candidateName`),
		targetDepartmentId: expectPerformanceServiceNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetPosition: decodeOptionalNullableString(
			record.targetPosition,
			`${field}.targetPosition`
		)
	};
}

function decodeGeneratedReferenceSnapshot(
	value: unknown,
	field: string
): ResumePoolReferenceSnapshot {
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
		phone: expectPerformanceServiceString(record.phone, `${field}.phone`),
		email: decodeOptionalNullableString(record.email, `${field}.email`),
		status: decodeResumePoolStatus(record.status, `${field}.status`),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`)
	};
}

function decodeGeneratedRecruitPlanSnapshot(
	value: unknown,
	field: string
): ResumePoolRecruitPlanSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: decodeOptionalNullableNumber(record.id, `${field}.id`),
		title: expectPerformanceServiceOptionalString(record.title, `${field}.title`),
		positionName: decodeOptionalNullableString(record.positionName, `${field}.positionName`),
		targetDepartmentId: decodeOptionalNullableNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetDepartmentName: decodeOptionalNullableString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		headcount: decodeOptionalNullableNumber(record.headcount, `${field}.headcount`),
		startDate: decodeOptionalNullableString(record.startDate, `${field}.startDate`),
		endDate: decodeOptionalNullableString(record.endDate, `${field}.endDate`),
		status:
			record.status == null
				? (record.status ?? undefined)
				: expectPerformanceServiceEnum(
						record.status,
						`${field}.status`,
						RECRUIT_PLAN_STATUS
					),
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`)
	};
}

function decodeGeneratedJobStandardSnapshot(
	value: unknown,
	field: string
): ResumePoolJobStandardSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: decodeOptionalNullableNumber(record.id, `${field}.id`),
		positionName: expectPerformanceServiceOptionalString(
			record.positionName,
			`${field}.positionName`
		),
		jobLevel: decodeOptionalNullableString(record.jobLevel, `${field}.jobLevel`),
		targetDepartmentId: decodeOptionalNullableNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetDepartmentName: decodeOptionalNullableString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		status:
			record.status == null
				? (record.status ?? undefined)
				: expectPerformanceServiceEnum(
						record.status,
						`${field}.status`,
						JOB_STANDARD_STATUS
					),
		requirementSummary: decodeOptionalNullableString(
			record.requirementSummary,
			`${field}.requirementSummary`
		)
	};
}

export function decodeResumePoolRecord(
	value: unknown,
	field = 'resumePoolRecord'
): ResumePoolRecord {
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
		targetDepartmentName: expectPerformanceServiceOptionalString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		targetPosition: decodeOptionalNullableString(
			record.targetPosition,
			`${field}.targetPosition`
		),
		phone: expectPerformanceServiceString(record.phone, `${field}.phone`),
		email: decodeOptionalNullableString(record.email, `${field}.email`),
		resumeText: typeof record.resumeText === 'string' ? record.resumeText : '',
		sourceType: decodeResumePoolSourceType(record.sourceType, `${field}.sourceType`),
		sourceRemark: decodeOptionalNullableString(record.sourceRemark, `${field}.sourceRemark`),
		externalLink: decodeOptionalNullableString(record.externalLink, `${field}.externalLink`),
		attachmentIdList:
			record.attachmentIdList === undefined
				? undefined
				: expectPerformanceServiceArray(
						record.attachmentIdList,
						`${field}.attachmentIdList`
					).map((item, index) =>
						expectPerformanceServiceNumber(item, `${field}.attachmentIdList[${index}]`)
					),
		attachmentSummaryList:
			record.attachmentSummaryList === undefined
				? undefined
				: expectPerformanceServiceArray(
						record.attachmentSummaryList,
						`${field}.attachmentSummaryList`
					).map((item, index) =>
						decodeResumePoolAttachmentSummary(
							item,
							`${field}.attachmentSummaryList[${index}]`
						)
					),
		status: decodeResumePoolStatus(record.status, `${field}.status`),
		linkedTalentAssetId: decodeOptionalNullableNumber(
			record.linkedTalentAssetId,
			`${field}.linkedTalentAssetId`
		),
		latestInterviewId: decodeOptionalNullableNumber(
			record.latestInterviewId,
			`${field}.latestInterviewId`
		),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`),
		recruitPlanTitle: decodeOptionalNullableString(
			record.recruitPlanTitle,
			`${field}.recruitPlanTitle`
		),
		jobStandardPositionName: decodeOptionalNullableString(
			record.jobStandardPositionName,
			`${field}.jobStandardPositionName`
		),
		sourceSnapshot:
			record.sourceSnapshot == null
				? null
				: decodeInterviewSourceSnapshot(record.sourceSnapshot, `${field}.sourceSnapshot`),
		recruitPlanSnapshot:
			record.recruitPlanSnapshot == null
				? null
				: decodeRecruitPlanSnapshot(
						record.recruitPlanSnapshot,
						`${field}.recruitPlanSnapshot`
					),
		jobStandardSnapshot:
			record.jobStandardSnapshot == null
				? null
				: decodeJobStandardSnapshot(
						record.jobStandardSnapshot,
						`${field}.jobStandardSnapshot`
					),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeResumePoolPageResult(
	value: unknown,
	field = 'resumePoolPageResult'
): ResumePoolPageResult {
	return decodePerformanceServicePageResult(value, field, decodeResumePoolRecord);
}

export function decodeResumePoolImportResult(
	value: unknown,
	field = 'resumePoolImportResult'
): ResumePoolImportResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		fileId: expectPerformanceServiceNumber(record.fileId, `${field}.fileId`),
		importedCount: expectPerformanceServiceNumber(
			record.importedCount,
			`${field}.importedCount`
		),
		overwrittenCount: expectPerformanceServiceNumber(
			record.overwrittenCount,
			`${field}.overwrittenCount`
		),
		skippedCount: expectPerformanceServiceNumber(record.skippedCount, `${field}.skippedCount`)
	};
}

export function decodeResumePoolExportRows(
	value: unknown,
	field = 'resumePoolExportRows'
): ResumePoolExportRow[] {
	return expectPerformanceServiceArray(value, field).map((item, index) => {
		const row = expectPerformanceServiceRecord(item, `${field}[${index}]`);

		return {
			id: expectPerformanceServiceOptionalNumber(row.id, `${field}[${index}].id`),
			candidateName: expectPerformanceServiceString(
				row.candidateName,
				`${field}[${index}].candidateName`
			),
			targetDepartmentId: expectPerformanceServiceNumber(
				row.targetDepartmentId,
				`${field}[${index}].targetDepartmentId`
			),
			targetDepartmentName: expectPerformanceServiceOptionalString(
				row.targetDepartmentName,
				`${field}[${index}].targetDepartmentName`
			),
			targetPosition: decodeOptionalNullableString(
				row.targetPosition,
				`${field}[${index}].targetPosition`
			),
			phone: expectPerformanceServiceString(row.phone, `${field}[${index}].phone`),
			email: decodeOptionalNullableString(row.email, `${field}[${index}].email`),
			resumeText: expectPerformanceServiceString(
				row.resumeText,
				`${field}[${index}].resumeText`
			),
			sourceType: decodeResumePoolSourceType(row.sourceType, `${field}[${index}].sourceType`),
			sourceRemark: decodeOptionalNullableString(
				row.sourceRemark,
				`${field}[${index}].sourceRemark`
			),
			externalLink: decodeOptionalNullableString(
				row.externalLink,
				`${field}[${index}].externalLink`
			),
			status: decodeResumePoolStatus(row.status, `${field}[${index}].status`),
			linkedTalentAssetId: decodeOptionalNullableNumber(
				row.linkedTalentAssetId,
				`${field}[${index}].linkedTalentAssetId`
			),
			latestInterviewId: decodeOptionalNullableNumber(
				row.latestInterviewId,
				`${field}[${index}].latestInterviewId`
			),
			createTime: expectPerformanceServiceOptionalString(
				row.createTime,
				`${field}[${index}].createTime`
			),
			updateTime: expectPerformanceServiceOptionalString(
				row.updateTime,
				`${field}[${index}].updateTime`
			)
		};
	});
}

export function decodeResumePoolAttachmentDownloadResult(
	value: unknown,
	field = 'resumePoolAttachmentDownloadResult'
): ResumePoolAttachmentDownloadResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		size: expectPerformanceServiceNumber(record.size, `${field}.size`),
		uploadTime: expectPerformanceServiceString(record.uploadTime, `${field}.uploadTime`),
		url: expectPerformanceServiceString(record.url, `${field}.url`),
		downloadUrl: expectPerformanceServiceString(record.downloadUrl, `${field}.downloadUrl`),
		fileId: expectPerformanceServiceString(record.fileId, `${field}.fileId`)
	};
}

export function decodeResumePoolTalentAssetConvertResult(
	value: unknown,
	field = 'resumePoolTalentAssetConvertResult'
): ResumePoolTalentAssetConvertResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		talentAssetId: expectPerformanceServiceNumber(
			record.talentAssetId,
			`${field}.talentAssetId`
		),
		created: expectPerformanceServiceBoolean(record.created, `${field}.created`)
	};
}

export function decodeResumePoolCreateInterviewResult(
	value: unknown,
	field = 'resumePoolCreateInterviewResult'
): ResumePoolCreateInterviewResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		interviewId: expectPerformanceServiceNumber(record.interviewId, `${field}.interviewId`),
		status: decodeResumePoolStatus(record.status, `${field}.status`),
		resumePoolId: expectPerformanceServiceNumber(record.resumePoolId, `${field}.resumePoolId`),
		recruitPlanId: decodeOptionalNullableNumber(record.recruitPlanId, `${field}.recruitPlanId`),
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`),
		sourceSnapshot:
			record.sourceSnapshot == null
				? undefined
				: decodeGeneratedInterviewSourceSnapshot(
						record.sourceSnapshot,
						`${field}.sourceSnapshot`
					),
		snapshot:
			record.snapshot == null
				? undefined
				: decodeGeneratedReferenceSnapshot(record.snapshot, `${field}.snapshot`),
		resumePoolSummary:
			record.resumePoolSummary == null
				? undefined
				: decodeGeneratedReferenceSnapshot(
						record.resumePoolSummary,
						`${field}.resumePoolSummary`
					),
		resumePoolSnapshot:
			record.resumePoolSnapshot == null
				? undefined
				: decodeGeneratedReferenceSnapshot(
						record.resumePoolSnapshot,
						`${field}.resumePoolSnapshot`
					),
		recruitPlanSummary:
			record.recruitPlanSummary == null
				? null
				: decodeGeneratedRecruitPlanSnapshot(
						record.recruitPlanSummary,
						`${field}.recruitPlanSummary`
					),
		recruitPlanSnapshot:
			record.recruitPlanSnapshot == null
				? null
				: decodeGeneratedRecruitPlanSnapshot(
						record.recruitPlanSnapshot,
						`${field}.recruitPlanSnapshot`
					),
		jobStandardSummary:
			record.jobStandardSummary == null
				? null
				: decodeGeneratedJobStandardSnapshot(
						record.jobStandardSummary,
						`${field}.jobStandardSummary`
					),
		jobStandardSnapshot:
			record.jobStandardSnapshot == null
				? null
				: decodeGeneratedJobStandardSnapshot(
						record.jobStandardSnapshot,
						`${field}.jobStandardSnapshot`
					)
	};
}
