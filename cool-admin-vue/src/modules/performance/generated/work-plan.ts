/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance work-plan.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface WorkPlanCreateWorkPlanRequest {
	id?: number;
	createTime?: string;
	updateTime?: string;
	title?: string;
	status?: WorkPlanStatus;
	workNo?: string;
	assigneeIds?: Array<number>;
	assigneeList?: Array<WorkPlanAssignee>;
	assigneeNames?: Array<string>;
	priority?: WorkPlanPriority;
	description?: string;
	ownerDepartmentId?: number;
	ownerDepartmentName?: string;
	ownerId?: number;
	ownerName?: string;
	plannedStartDate?: string;
	plannedEndDate?: string;
	startedAt?: string;
	completedAt?: string;
	progressSummary?: string;
	resultSummary?: string;
	sourceType?: string;
	sourceBizType?: string;
	sourceBizId?: string;
	sourceTitle?: string;
	sourceStatus?: string;
	externalInstanceId?: string;
	externalProcessCode?: string;
	approvalFinishedAt?: string;
	sourceSnapshot?: Record<string, unknown>;
}

export type WorkPlanStatus = "draft" | "cancelled" | "completed" | "inProgress" | "planned";

export interface WorkPlanAssignee {
	id: number;
	name: string;
}

export type WorkPlanPriority = "low" | "medium" | "high" | "urgent";

export interface ApiResponse_WorkPlanRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  status?: WorkPlanStatus;
  createTime?: string;
  updateTime?: string;
  title: string;
  workNo?: string;
  assigneeIds?: Array<number>;
  assigneeList?: Array<WorkPlanAssignee>;
  assigneeNames?: Array<string>;
  priority?: WorkPlanPriority;
} & {
  description?: string;
  ownerDepartmentId: number;
  ownerDepartmentName?: string;
  ownerId: number;
  ownerName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  startedAt?: string;
  completedAt?: string;
  progressSummary?: string;
  resultSummary?: string;
  sourceType?: string;
  sourceBizType?: string;
  sourceBizId?: string;
  sourceTitle?: string;
  sourceStatus?: string;
  externalInstanceId?: string;
  externalProcessCode?: string;
  approvalFinishedAt?: string;
  sourceSnapshot?: JsonObject;
};
}

export interface JsonObject {

}

export interface WorkPlanCancelRequest {
	id: number;
	progressSummary?: string;
}

export interface WorkPlanCompleteRequest {
	id: number;
	completedAt?: string;
	resultSummary?: string;
}

export interface WorkPlanDeleteWorkPlanRequest {
	ids: Array<number>;
}

export interface ApiResponse_WorkPlanDeleteWorkPlanResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface WorkPlanFetchInfoQuery {
	id: number;
}

export type WorkPlanPageQuery = WorkPlanFetchPageRequest & {
  page: number;
  size: number;
  keyword?: string;
  departmentId?: number;
  status?: string;
  sourceStatus?: string;
};

export interface WorkPlanFetchPageRequest {

}

export interface ApiResponse_WorkPlanPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<WorkPlanRecord>;
};
}

export type WorkPlanRecord = {
  id?: number;
  status?: WorkPlanStatus;
  createTime?: string;
  updateTime?: string;
  title: string;
  workNo?: string;
  assigneeIds?: Array<number>;
  assigneeList?: Array<WorkPlanAssignee>;
  assigneeNames?: Array<string>;
  priority?: WorkPlanPriority;
} & {
  description?: string;
  ownerDepartmentId: number;
  ownerDepartmentName?: string;
  ownerId: number;
  ownerName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  startedAt?: string;
  completedAt?: string;
  progressSummary?: string;
  resultSummary?: string;
  sourceType?: string;
  sourceBizType?: string;
  sourceBizId?: string;
  sourceTitle?: string;
  sourceStatus?: string;
  externalInstanceId?: string;
  externalProcessCode?: string;
  approvalFinishedAt?: string;
  sourceSnapshot?: JsonObject;
};

export interface WorkPlanStartRequest {
	id: number;
	startedAt?: string;
	progressSummary?: string;
}

export type WorkPlanSyncPayload = WorkPlanSyncDingtalkApprovalRequest & {
  sourceTitle: string;
  sourceBizType: string;
  sourceBizId?: string;
  externalInstanceId: string;
  externalProcessCode?: string;
  sourceStatus: string;
  planTitle?: string;
  planDescription?: string;
  ownerDepartmentId?: number;
  ownerId?: number;
  assigneeIds: Array<number>;
  priority: WorkPlanPriority;
  plannedStartDate?: string;
  plannedEndDate?: string;
  sourceSnapshot?: Record<string, unknown>;
};

export interface WorkPlanSyncDingtalkApprovalRequest {

}

export interface WorkPlanUpdateWorkPlanRequest {
	id?: number;
	createTime?: string;
	updateTime?: string;
	title?: string;
	status?: WorkPlanStatus;
	workNo?: string;
	assigneeIds?: Array<number>;
	assigneeList?: Array<WorkPlanAssignee>;
	assigneeNames?: Array<string>;
	priority?: WorkPlanPriority;
	description?: string;
	ownerDepartmentId?: number;
	ownerDepartmentName?: string;
	ownerId?: number;
	ownerName?: string;
	plannedStartDate?: string;
	plannedEndDate?: string;
	startedAt?: string;
	completedAt?: string;
	progressSummary?: string;
	resultSummary?: string;
	sourceType?: string;
	sourceBizType?: string;
	sourceBizId?: string;
	sourceTitle?: string;
	sourceStatus?: string;
	externalInstanceId?: string;
	externalProcessCode?: string;
	approvalFinishedAt?: string;
	sourceSnapshot?: Record<string, unknown>;
}
