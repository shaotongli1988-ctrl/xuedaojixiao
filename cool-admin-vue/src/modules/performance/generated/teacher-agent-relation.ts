/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-agent-relation.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface TeacherAgentRelationCreateTeacherAgentRelationRequest {
	id?: number;
	status?: TeacherAgentRelationStatus;
	parentAgentId?: number;
	parentAgentName?: string;
	childAgentId?: number;
	childAgentName?: string;
	effectiveTime?: string;
	remark?: string;
	ownerEmployeeId?: number;
	ownerDepartmentId?: number;
	createTime?: string;
	updateTime?: string;
}

export type TeacherAgentRelationStatus = "active" | "inactive";

export interface ApiResponse_TeacherAgentRelationRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  status?: TeacherAgentRelationStatus;
} & {
  parentAgentId: number;
  parentAgentName?: string;
  childAgentId: number;
  childAgentName?: string;
  effectiveTime?: string;
  remark?: string;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
};
}

export interface TeacherAgentRelationRemoveTeacherAgentRelationRequest {
	id: number;
}

export type TeacherAgentRelationPageQuery = TeacherAgentRelationFetchPageRequest & {
  page: number;
  size: number;
};

export interface TeacherAgentRelationFetchPageRequest {

}

export interface ApiResponse_TeacherAgentRelationPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<TeacherAgentRelationRecord>;
};
}

export type TeacherAgentRelationRecord = {
  id?: number;
  status?: TeacherAgentRelationStatus;
} & {
  parentAgentId: number;
  parentAgentName?: string;
  childAgentId: number;
  childAgentName?: string;
  effectiveTime?: string;
  remark?: string;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
};

export type TeacherAgentRelationUpdatePayload = {
  id?: number;
  status?: TeacherAgentRelationStatus;
  parentAgentId?: number;
  parentAgentName?: string;
  childAgentId?: number;
  childAgentName?: string;
  effectiveTime?: string;
  remark?: string;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};
