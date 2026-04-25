/**
 * cool-uni 课程管理移动页类型。
 * 这里只转发 OpenAPI 生成的课程模型，并为列表页补齐响应 data 的别名。
 */
import type {
	ApiResponse_CourseEnrollmentPageResult,
	ApiResponse_CoursePageResult,
	CourseUpdatePayload,
} from "/@/generated/performance-course.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	CourseCreateCourseRequest,
	CourseEnrollmentRecord,
	CourseExamFetchSummaryQuery,
	CourseExamResultStatus,
	CourseFetchEnrollmentPageRequest,
	CourseFetchInfoQuery,
	CourseFetchPageRequest,
	CourseRecord,
	CourseRemoveCourseRequest,
	CourseStatus,
} from "/@/generated/performance-course.generated";

export type CourseUpdateCourseRequest = CourseUpdatePayload;
export type CoursePageResult = ApiResponseData<ApiResponse_CoursePageResult>;
export type CourseEnrollmentPageResult = ApiResponseData<ApiResponse_CourseEnrollmentPageResult>;
