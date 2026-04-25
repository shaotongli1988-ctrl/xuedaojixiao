/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-dashboard.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ApiResponse_TeacherDashboardSummary {
	code: number;
	message: string;
	data: Record<string, unknown> & {
  resourceTotal?: number;
  pendingFollowCount?: number;
  overdueFollowCount?: number;
  partneredCount?: number;
  classCount?: number;
  memberDistribution?: Array<TeacherDashboardDistributionItem>;
  cooperationDistribution?: Array<TeacherDashboardDistributionItem>;
  classStatusDistribution?: Array<TeacherDashboardDistributionItem>;
};
}

export type TeacherDashboardDistributionItem = Record<string, unknown> & {
  key?: string;
  label?: string;
  name?: string;
  status?: string;
  value?: number;
  count?: number;
};

export interface TeacherDashboardFetchSummaryQuery {

}
