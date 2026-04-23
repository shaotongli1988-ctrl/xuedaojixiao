/**
 * 文件职责：定义课程学习任务响应的前端 runtime 契约解码器。
 * 不负责发请求、课程 CRUD 或考试摘要逻辑。
 * 维护重点：练习/背诵任务记录和分页结构必须共享同一条边界，避免可空文本与分数字段被异常响应污染。
 */

import type {
	CourseLearningPageResult,
	CourseLearningTaskRecord,
	CourseLearningTaskStatus,
	CourseLearningTaskType
} from '../course-learning.types';
import {
	expectPerformanceServiceArray,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';
import {
	COURSE_LEARNING_TASK_STATUS,
	COURSE_LEARNING_TASK_TYPE
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

function decodeCourseLearningTaskStatus(value: unknown, field: string): CourseLearningTaskStatus {
	return expectPerformanceServiceEnum(value, field, COURSE_LEARNING_TASK_STATUS);
}

function decodeCourseLearningTaskType(value: unknown, field: string): CourseLearningTaskType {
	return expectPerformanceServiceEnum(value, field, COURSE_LEARNING_TASK_TYPE);
}

export function decodeCourseLearningTaskRecord(
	value: unknown,
	field = 'courseLearningTaskRecord'
): CourseLearningTaskRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceNumber(record.id, `${field}.id`),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		status: decodeCourseLearningTaskStatus(record.status, `${field}.status`),
		courseId: expectPerformanceServiceNumber(record.courseId, `${field}.courseId`),
		taskType: decodeCourseLearningTaskType(record.taskType, `${field}.taskType`),
		submissionText: expectPerformanceServiceOptionalString(
			record.submissionText,
			`${field}.submissionText`
		),
		courseTitle: decodeOptionalNullableString(record.courseTitle, `${field}.courseTitle`),
		promptText: decodeOptionalNullableString(record.promptText, `${field}.promptText`),
		latestScore: decodeOptionalNullableNumber(record.latestScore, `${field}.latestScore`),
		feedbackSummary: decodeOptionalNullableString(
			record.feedbackSummary,
			`${field}.feedbackSummary`
		),
		submittedAt: decodeOptionalNullableString(record.submittedAt, `${field}.submittedAt`),
		evaluatedAt: decodeOptionalNullableString(record.evaluatedAt, `${field}.evaluatedAt`)
	};
}

export function decodeCourseLearningPageResult(
	value: unknown,
	field = 'courseLearningPageResult'
): CourseLearningPageResult {
	const record = expectPerformanceServiceRecord(value, field);
	const pagination = expectPerformanceServiceRecord(record.pagination, `${field}.pagination`);

	return {
		list:
			record.list === undefined
				? undefined
				: expectPerformanceServiceArray(record.list, `${field}.list`).map((item, index) =>
						decodeCourseLearningTaskRecord(item, `${field}.list[${index}]`)
					),
		pagination: {
			page: expectPerformanceServiceNumber(pagination.page, `${field}.pagination.page`),
			size: expectPerformanceServiceNumber(pagination.size, `${field}.pagination.size`),
			total: expectPerformanceServiceNumber(pagination.total, `${field}.pagination.total`)
		}
	};
}
