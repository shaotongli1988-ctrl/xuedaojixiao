/**
 * 课程学习增强模块的兼容类型出口。
 * 这里只复用 course-learning.types 中的 SSOT 类型，不再维护第二份并行领域模型。
 * 维护重点是保留既有命名兼容，同时确保真实结构继续来自 generated 契约。
 */

export type {
	CourseExamResultStatus,
	CourseExamSummaryQuery,
	CourseLearningInfoQuery,
	CourseLearningPageQuery,
	CourseLearningPageResult,
	CourseLearningSubmitPayload,
	CourseLearningTaskRecord,
	CourseLearningTaskStatus,
	CourseLearningTaskType
} from './course-learning.types';

export type {
	CourseExamSummary as CourseExamSummaryRecord,
	CourseLearningPageResult as CourseLearningTaskPageResult
} from './course-learning.types';
