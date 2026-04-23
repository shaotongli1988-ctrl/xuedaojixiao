/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance dashboard.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ApiResponse_DashboardCrossSummary {
	code: number;
	message: string;
	data: Record<string, unknown> & {
  metricCards: Array<DashboardCrossMetricCard>;
};
}

export type DashboardCrossMetricCard = {
  unit: string;
  periodValue: string;
  periodType: string;
  metricCode: DashboardCrossMetricCode;
  metricLabel: string;
  sourceDomain: DashboardCrossSourceDomain;
  scopeType: DashboardCrossScopeType;
  dataStatus: DashboardCrossDataStatus;
  statusText: string;
} & {
  metricValue: number;
  departmentId: number;
  updatedAt: string;
};

export type DashboardCrossMetricCode = "recruitment_completion_rate" | "training_pass_rate" | "meeting_effectiveness_index";

export type DashboardCrossSourceDomain = "recruitment" | "training" | "meeting";

export type DashboardCrossScopeType = "global" | "department_tree";

export type DashboardCrossDataStatus = "ready" | "delayed" | "unavailable";

export interface DashboardCrossSummaryQuery {
	periodType?: string;
	periodValue?: string;
	departmentId?: number;
	metricCodes?: Array<DashboardCrossMetricCode>;
}

export interface ApiResponse_DashboardFetchSummaryResult {
	code: number;
	message: string;
	data: {
  averageScore: number;
  pendingApprovalCount: number;
  goalCompletionRate: number;
  stageProgress: Array<DashboardStageProgressItem>;
  departmentDistribution: Array<DashboardDepartmentDistributionItem>;
  gradeDistribution: Array<DashboardGradeDistributionItem>;
};
}

export interface DashboardStageProgressItem {
	stageKey: string;
	stageLabel: string;
	completedCount: number;
	totalCount: number;
	completionRate: number;
	sort: number;
}

export interface DashboardDepartmentDistributionItem {
	departmentId: number;
	departmentName: string;
	averageScore: number;
	assessmentCount: number;
}

export interface DashboardGradeDistributionItem {
	grade: "S" | "A" | "B" | "C";
	count: number;
	ratio: number;
}

export interface DashboardSummaryQuery {
	periodType?: string;
	periodValue?: string;
	departmentId?: number;
}
