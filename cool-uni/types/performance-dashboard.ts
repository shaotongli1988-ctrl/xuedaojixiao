/**
 * cool-uni 绩效驾驶舱移动页类型。
 * 这里只转发 OpenAPI 生成的驾驶舱聚合契约，并为响应 data 提供消费别名。
 */
import type {
	ApiResponse_DashboardCrossSummary,
	ApiResponse_DashboardFetchSummaryResult,
} from "/@/generated/performance-dashboard.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	DashboardCrossDataStatus,
	DashboardCrossMetricCard,
	DashboardCrossMetricCode,
	DashboardCrossScopeType,
	DashboardCrossSourceDomain,
	DashboardCrossSummaryQuery,
	DashboardDepartmentDistributionItem,
	DashboardGradeDistributionItem,
	DashboardStageProgressItem,
	DashboardSummaryQuery,
} from "/@/generated/performance-dashboard.generated";

export type DashboardCrossSummary = ApiResponseData<ApiResponse_DashboardCrossSummary>;
export type DashboardSummary = ApiResponseData<ApiResponse_DashboardFetchSummaryResult>;
export type DashboardSummaryPayload = import("/@/generated/performance-dashboard.generated").DashboardSummaryQuery;
