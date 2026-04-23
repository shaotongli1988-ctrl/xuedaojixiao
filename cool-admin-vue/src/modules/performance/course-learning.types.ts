/**
 * 培训学习增强模块的前端类型出口。
 * 这里只做 generated 契约到页面消费类型的轻量适配，不负责请求封装或课程 CRUD 模型。
 * 维护重点是课程学习任务与考试摘要必须继续派生自 OpenAPI generated 契约，避免独立手写漂移。
 */

import type {
	ApiResponse_CourseExamSummary as GeneratedCourseExamSummaryResponse,
	CourseExamResultStatus as GeneratedCourseExamResultStatus
} from './generated/course-exam';
import type {
	ApiResponse_CourseLearningPageResult as GeneratedCourseLearningPageResponse,
	CourseLearningSubmitPayload as GeneratedCourseLearningSubmitPayload,
	CourseLearningTaskRecord as GeneratedCourseLearningTaskRecord,
	CourseLearningTaskStatus as GeneratedCourseLearningTaskStatus,
	CourseLearningTaskType as GeneratedCourseLearningTaskType
} from './generated/course-learning';

type ApiResponseData<T extends { data: unknown }> = T['data'];

export type CourseLearningTaskType = GeneratedCourseLearningTaskType;
export type CourseLearningTaskStatus = GeneratedCourseLearningTaskStatus;
export type CourseExamResultStatus = GeneratedCourseExamResultStatus;

export type CourseLearningTaskRecord = Omit<
	GeneratedCourseLearningTaskRecord,
	'courseTitle' | 'promptText' | 'latestScore' | 'feedbackSummary' | 'submittedAt' | 'evaluatedAt'
> & {
	courseTitle?: string | null;
	promptText?: string | null;
	latestScore?: number | null;
	feedbackSummary?: string | null;
	submissionText?: string | null;
	submittedAt?: string | null;
	evaluatedAt?: string | null;
};

export type CourseLearningPageResult = Omit<
	ApiResponseData<GeneratedCourseLearningPageResponse>,
	'list' | 'pagination'
> & {
	list?: CourseLearningTaskRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
};
export type CourseLearningPageQuery =
	import('./generated/course-learning').CourseReciteFetchPageRequest;
export type CourseLearningInfoQuery =
	import('./generated/course-learning').CourseReciteFetchInfoQuery;

export type CourseLearningSubmitPayload = GeneratedCourseLearningSubmitPayload;

export type CourseExamSummary = Omit<
	ApiResponseData<GeneratedCourseExamSummaryResponse>,
	'courseTitle' | 'latestScore' | 'passThreshold' | 'summaryText' | 'updatedAt'
> & {
	courseTitle?: string | null;
	latestScore?: number | null;
	passThreshold?: number | null;
	summaryText?: string | null;
	updatedAt?: string | null;
};
export type CourseExamSummaryQuery = import('./generated/course-exam').CourseExamFetchSummaryQuery;
