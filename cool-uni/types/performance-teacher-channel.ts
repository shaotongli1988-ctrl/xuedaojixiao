/**
 * cool-uni 班主任待办移动页类型与纯前端规则。
 * 这里只转发 OpenAPI 生成的班主任相关契约，并补齐分页与汇总响应 data 的别名。
 */
import type {
	ApiResponse_TeacherAttributionInfo,
	ApiResponse_TeacherClassPageResult,
	ApiResponse_TeacherDashboardSummary,
	ApiResponse_TeacherFollowPageResult,
	ApiResponse_TeacherInfoFetchAttributionHistoryResult,
	ApiResponse_TeacherInfoPageResult,
	ApiResponse_TeacherTodoPageResult,
	TeacherClassUpdatePayload,
} from "/@/generated/performance-teacher-channel.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	TeacherAttributionConflictRecord,
	TeacherAttributionConflictStatus,
	TeacherAttributionRecord,
	TeacherAttributionStatus,
	TeacherClassFetchInfoQuery,
	TeacherClassFetchPageRequest,
	TeacherClassRecord,
	TeacherClassStatus,
	TeacherCooperationStatus,
	TeacherDashboardFetchSummaryQuery,
	TeacherDashboardDistributionItem,
	TeacherFollowCreateTeacherFollowRequest,
	TeacherFollowFetchPageRequest,
	TeacherFollowRecord,
	TeacherInfoFetchAttributionHistoryQuery,
	TeacherInfoFetchAttributionInfoQuery,
	TeacherInfoFetchInfoQuery,
	TeacherInfoFetchPageRequest,
	TeacherInfoRecord,
	TeacherTodoBucket,
	TeacherTodoFetchPageRequest,
	TeacherTodoRecord,
} from "/@/generated/performance-teacher-channel.generated";

export type TeacherClassUpdateTeacherClassRequest = TeacherClassUpdatePayload;
export type TeacherAttributionInfo = ApiResponseData<ApiResponse_TeacherAttributionInfo>;
export type TeacherAttributionHistory =
	ApiResponseData<ApiResponse_TeacherInfoFetchAttributionHistoryResult>;
export type TeacherClassPageResult = ApiResponseData<ApiResponse_TeacherClassPageResult>;
export type TeacherDashboardSummary = ApiResponseData<ApiResponse_TeacherDashboardSummary>;
export type TeacherFollowPageResult = ApiResponseData<ApiResponse_TeacherFollowPageResult>;
export type TeacherInfoPageResult = ApiResponseData<ApiResponse_TeacherInfoPageResult>;
export type TeacherTodoPageResult = ApiResponseData<ApiResponse_TeacherTodoPageResult>;

export function resolveTeacherDashboardDistribution(summary?: TeacherDashboardSummary | null) {
	const candidates = [
		summary?.cooperationDistribution,
		summary?.classStatusDistribution,
		summary?.memberDistribution,
	];

	for (const list of candidates) {
		if (Array.isArray(list) && list.length) {
			return list;
		}
	}

	return [];
}
