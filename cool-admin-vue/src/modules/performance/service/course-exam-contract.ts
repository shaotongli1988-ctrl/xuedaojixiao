/**
 * 文件职责：定义课程考试摘要响应的前端 runtime 契约解码器。
 * 不负责发请求、学习任务详情或题库试卷逻辑。
 * 维护重点：考试摘要必须继续绑定课程学习域类型边界，避免可空分数字段被异常响应污染。
 */

import type { CourseExamResultStatus, CourseExamSummary } from '../course-learning.types';
import {
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceRecord
} from './service-contract';
import { COURSE_EXAM_RESULT_STATUS } from '../shared/contract-enums';

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

function decodeCourseExamResultStatus(value: unknown, field: string): CourseExamResultStatus {
	return expectPerformanceServiceEnum(value, field, COURSE_EXAM_RESULT_STATUS);
}

export function decodeCourseExamSummary(
	value: unknown,
	field = 'courseExamSummary'
): CourseExamSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		courseId: expectPerformanceServiceNumber(record.courseId, `${field}.courseId`),
		resultStatus: decodeCourseExamResultStatus(record.resultStatus, `${field}.resultStatus`),
		courseTitle: decodeOptionalNullableString(record.courseTitle, `${field}.courseTitle`),
		latestScore: decodeOptionalNullableNumber(record.latestScore, `${field}.latestScore`),
		passThreshold: decodeOptionalNullableNumber(record.passThreshold, `${field}.passThreshold`),
		summaryText: decodeOptionalNullableString(record.summaryText, `${field}.summaryText`),
		updatedAt: decodeOptionalNullableString(record.updatedAt, `${field}.updatedAt`)
	};
}
