/**
 * 文件职责：定义工作计划关键响应的前端 runtime 契约解码器。
 * 不负责发请求、页面默认值补齐或业务动作编排。
 * 维护重点：列表、详情和动作返回要共享同一份结构约束，避免后端异常字段把工作计划状态机静默带偏。
 */

import type { JsonObject, WorkPlanAssignee, WorkPlanPageResult, WorkPlanRecord } from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceNumberArray,
	expectPerformanceServiceOptionalEnum,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString,
	isPerformanceServiceRecord
} from './service-contract';
import { WORK_PLAN_PRIORITY, WORK_PLAN_STATUS } from '../shared/contract-enums';

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

function decodeWorkPlanAssignee(value: unknown, field = 'workPlanAssignee'): WorkPlanAssignee {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`)
	};
}

function decodeOptionalJsonRecord(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	if (!isPerformanceServiceRecord(value)) {
		throw new Error(`${field} 必须为对象`);
	}

	return decodeJsonObject(value, field);
}

function decodeJsonValue(value: unknown, field: string): JsonObject[string] {
	if (
		value === null ||
		value === undefined ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item, index) => {
			const nextValue = decodeJsonValue(item, `${field}[${index}]`);

			if (nextValue === undefined) {
				throw new Error(`${field}[${index}] 不能为 undefined`);
			}

			return nextValue;
		});
	}

	if (isPerformanceServiceRecord(value)) {
		return decodeJsonObject(value, field);
	}

	throw new Error(`${field} 必须为 JSON 值`);
}

function decodeJsonObject(value: Record<string, unknown>, field: string): JsonObject {
	const result: JsonObject = {};

	for (const [key, entry] of Object.entries(value)) {
		result[key] = decodeJsonValue(entry, `${field}.${key}`);
	}

	return result;
}

export function decodeWorkPlanRecord(value: unknown, field = 'workPlanRecord'): WorkPlanRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(
			record.updateTime,
			`${field}.updateTime`
		),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		status: expectPerformanceServiceOptionalEnum(
			record.status,
			`${field}.status`,
			WORK_PLAN_STATUS
		),
		workNo: expectPerformanceServiceOptionalString(record.workNo, `${field}.workNo`),
		assigneeIds:
			record.assigneeIds === undefined
				? undefined
				: expectPerformanceServiceNumberArray(record.assigneeIds, `${field}.assigneeIds`),
		assigneeList:
			record.assigneeList === undefined
				? undefined
				: expectPerformanceServiceArray(record.assigneeList, `${field}.assigneeList`).map(
						(item, index) =>
							decodeWorkPlanAssignee(item, `${field}.assigneeList[${index}]`)
					),
		assigneeNames:
			record.assigneeNames === undefined
				? undefined
				: expectPerformanceServiceArray(record.assigneeNames, `${field}.assigneeNames`).map(
						(item, index) =>
							expectPerformanceServiceString(item, `${field}.assigneeNames[${index}]`)
					),
		priority: expectPerformanceServiceOptionalEnum(
			record.priority,
			`${field}.priority`,
			WORK_PLAN_PRIORITY
		),
		description: decodeOptionalNullableString(record.description, `${field}.description`),
		ownerDepartmentId: expectPerformanceServiceNumber(
			record.ownerDepartmentId,
			`${field}.ownerDepartmentId`
		),
		ownerDepartmentName: decodeOptionalNullableString(
			record.ownerDepartmentName,
			`${field}.ownerDepartmentName`
		),
		ownerId: expectPerformanceServiceNumber(record.ownerId, `${field}.ownerId`),
		ownerName: decodeOptionalNullableString(record.ownerName, `${field}.ownerName`),
		plannedStartDate: decodeOptionalNullableString(
			record.plannedStartDate,
			`${field}.plannedStartDate`
		),
		plannedEndDate: decodeOptionalNullableString(
			record.plannedEndDate,
			`${field}.plannedEndDate`
		),
		startedAt: decodeOptionalNullableString(record.startedAt, `${field}.startedAt`),
		completedAt: decodeOptionalNullableString(record.completedAt, `${field}.completedAt`),
		progressSummary: decodeOptionalNullableString(
			record.progressSummary,
			`${field}.progressSummary`
		),
		resultSummary: decodeOptionalNullableString(record.resultSummary, `${field}.resultSummary`),
		sourceType: decodeOptionalNullableString(record.sourceType, `${field}.sourceType`),
		sourceBizType: decodeOptionalNullableString(record.sourceBizType, `${field}.sourceBizType`),
		sourceBizId: decodeOptionalNullableString(record.sourceBizId, `${field}.sourceBizId`),
		sourceTitle: decodeOptionalNullableString(record.sourceTitle, `${field}.sourceTitle`),
		sourceStatus: decodeOptionalNullableString(record.sourceStatus, `${field}.sourceStatus`),
		externalInstanceId: decodeOptionalNullableString(
			record.externalInstanceId,
			`${field}.externalInstanceId`
		),
		externalProcessCode: decodeOptionalNullableString(
			record.externalProcessCode,
			`${field}.externalProcessCode`
		),
		approvalFinishedAt: decodeOptionalNullableString(
			record.approvalFinishedAt,
			`${field}.approvalFinishedAt`
		),
		sourceSnapshot: decodeOptionalJsonRecord(record.sourceSnapshot, `${field}.sourceSnapshot`)
	};
}

export function decodeWorkPlanPageResult(
	value: unknown,
	field = 'workPlanPageResult'
): WorkPlanPageResult {
	return decodePerformanceServicePageResult(value, field, decodeWorkPlanRecord);
}
