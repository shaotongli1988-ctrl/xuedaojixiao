/**
 * cool-uni 课程学习移动页类型与纯前端规则。
 * 这里只转发 OpenAPI 生成的学习任务与考试摘要契约，并补充动作判断。
 */
import type {
	ApiResponse_CourseExamSummary,
	ApiResponse_CourseLearningPageResult,
	CourseReciteFetchInfoQuery as GeneratedCourseReciteFetchInfoQuery,
	CourseReciteFetchPageRequest as GeneratedCourseReciteFetchPageRequest,
	CourseLearningTaskRecord as GeneratedCourseLearningTaskRecord,
} from "/@/generated/performance-course-learning.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];
type PagePagination = {
	page: number;
	size: number;
	total: number;
};

export type {
	CourseExamFetchSummaryQuery,
	CourseExamResultStatus,
	CourseLearningSubmitPayload,
	CourseLearningTaskStatus,
	CourseLearningTaskType,
	CourseReciteFetchInfoQuery,
	CourseReciteFetchPageRequest,
} from "/@/generated/performance-course-learning.generated";

export type CoursePracticeFetchInfoQuery = GeneratedCourseReciteFetchInfoQuery;
export type CoursePracticeFetchPageRequest = GeneratedCourseReciteFetchPageRequest;

export type CourseLearningTaskRecord = GeneratedCourseLearningTaskRecord & {
	submissionText?: string | null;
};
export type CourseLearningTaskPageResult = Omit<
	ApiResponseData<ApiResponse_CourseLearningPageResult>,
	"list" | "pagination"
> & {
	list: CourseLearningTaskRecord[];
	pagination: PagePagination;
};
export type CourseExamSummary = ApiResponseData<ApiResponse_CourseExamSummary>;

export function canCourseTaskSubmit(task?: CourseLearningTaskRecord | null) {
	return !!task?.id && String(task.status || "") !== "evaluated";
}
