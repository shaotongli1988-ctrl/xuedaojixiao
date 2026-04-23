/**
 * 文件职责：定义招聘计划关键响应的前端 runtime 契约解码器。
 * 不负责发请求、页面筛选编排或导入文件解析。
 * 维护重点：招聘计划主记录、来源快照和导出结果共用同一条结构边界，避免状态流转和来源信息被异常响应污染。
 */

import type {
	RecruitPlanDeleteResult,
	RecruitPlanExportRow,
	RecruitPlanImportResult,
	RecruitPlanPageResult,
	RecruitPlanRecord,
	RecruitPlanStatus,
	RecruitmentSourceSnapshot
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

const RECRUIT_PLAN_STATUS = ['draft', 'active', 'voided', 'closed'] as const;
const JOB_STANDARD_STATUS = ['draft', 'active', 'inactive'] as const;

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

function decodeRecruitPlanStatus(value: unknown, field: string): RecruitPlanStatus {
	return expectPerformanceServiceEnum(value, field, RECRUIT_PLAN_STATUS);
}

function decodeRecruitPlanSourceSnapshot(value: unknown, field: string): RecruitmentSourceSnapshot {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: decodeOptionalNullableNumber(record.id, `${field}.id`),
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
		targetPosition: decodeOptionalNullableString(
			record.positionName,
			`${field}.targetPosition`
		),
		status:
			record.status === undefined
				? undefined
				: expectPerformanceServiceEnum(
						record.status,
						`${field}.status`,
						JOB_STANDARD_STATUS
					)
	};
}

export function decodeRecruitPlanRecord(
	value: unknown,
	field = 'recruitPlanRecord'
): RecruitPlanRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		targetDepartmentId: expectPerformanceServiceNumber(
			record.targetDepartmentId,
			`${field}.targetDepartmentId`
		),
		targetDepartmentName: decodeOptionalNullableString(
			record.targetDepartmentName,
			`${field}.targetDepartmentName`
		),
		positionName: expectPerformanceServiceString(record.positionName, `${field}.positionName`),
		headcount: expectPerformanceServiceNumber(record.headcount, `${field}.headcount`),
		startDate: expectPerformanceServiceString(record.startDate, `${field}.startDate`),
		endDate: expectPerformanceServiceString(record.endDate, `${field}.endDate`),
		recruiterId: decodeOptionalNullableNumber(record.recruiterId, `${field}.recruiterId`),
		recruiterName: decodeOptionalNullableString(record.recruiterName, `${field}.recruiterName`),
		requirementSummary: decodeOptionalNullableString(
			record.requirementSummary,
			`${field}.requirementSummary`
		),
		jobStandardId: decodeOptionalNullableNumber(record.jobStandardId, `${field}.jobStandardId`),
		jobStandardPositionName: decodeOptionalNullableString(
			record.jobStandardPositionName,
			`${field}.jobStandardPositionName`
		),
		jobStandardSummary:
			record.jobStandardSummary == null
				? null
				: decodeRecruitPlanSourceSnapshot(
						record.jobStandardSummary,
						`${field}.jobStandardSummary`
					),
		jobStandardSnapshot:
			record.jobStandardSnapshot == null
				? null
				: decodeRecruitPlanSourceSnapshot(
						record.jobStandardSnapshot,
						`${field}.jobStandardSnapshot`
					),
		sourceSnapshot:
			record.sourceSnapshot == null
				? null
				: decodeRecruitPlanSourceSnapshot(record.sourceSnapshot, `${field}.sourceSnapshot`),
		status:
			record.status === undefined
				? undefined
				: decodeRecruitPlanStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeRecruitPlanPageResult(
	value: unknown,
	field = 'recruitPlanPageResult'
): RecruitPlanPageResult {
	return decodePerformanceServicePageResult(value, field, decodeRecruitPlanRecord);
}

export function decodeRecruitPlanDeleteResult(
	value: unknown,
	field = 'recruitPlanDeleteResult'
): RecruitPlanDeleteResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceNumber(record.id, `${field}.id`),
		deleted: expectPerformanceServiceBoolean(record.deleted, `${field}.deleted`)
	};
}

export function decodeRecruitPlanImportResult(
	value: unknown,
	field = 'recruitPlanImportResult'
): RecruitPlanImportResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		fileId: expectPerformanceServiceNumber(record.fileId, `${field}.fileId`),
		importedCount: expectPerformanceServiceNumber(
			record.importedCount,
			`${field}.importedCount`
		),
		skippedCount: expectPerformanceServiceNumber(record.skippedCount, `${field}.skippedCount`)
	};
}

export function decodeRecruitPlanExportRows(
	value: unknown,
	field = 'recruitPlanExportRows'
): RecruitPlanExportRow[] {
	return expectPerformanceServiceArray(value, field).map((item, index) => {
		const row = expectPerformanceServiceRecord(item, `${field}[${index}]`);

		return {
			id: expectPerformanceServiceOptionalNumber(row.id, `${field}[${index}].id`),
			title: expectPerformanceServiceString(row.title, `${field}[${index}].title`),
			targetDepartmentId:
				row.targetDepartmentId === undefined
					? undefined
					: expectPerformanceServiceNullableNumber(
							row.targetDepartmentId,
							`${field}[${index}].targetDepartmentId`
						),
			targetDepartmentName: decodeOptionalNullableString(
				row.targetDepartmentName,
				`${field}[${index}].targetDepartmentName`
			),
			positionName: expectPerformanceServiceString(
				row.positionName,
				`${field}[${index}].positionName`
			),
			headcount: expectPerformanceServiceNumber(
				row.headcount,
				`${field}[${index}].headcount`
			),
			startDate: expectPerformanceServiceString(
				row.startDate,
				`${field}[${index}].startDate`
			),
			endDate: expectPerformanceServiceString(row.endDate, `${field}[${index}].endDate`),
			recruiterId:
				row.recruiterId === undefined
					? undefined
					: expectPerformanceServiceNullableNumber(
							row.recruiterId,
							`${field}[${index}].recruiterId`
						),
			recruiterName: decodeOptionalNullableString(
				row.recruiterName,
				`${field}[${index}].recruiterName`
			),
			status:
				row.status === undefined
					? undefined
					: decodeRecruitPlanStatus(row.status, `${field}[${index}].status`),
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
