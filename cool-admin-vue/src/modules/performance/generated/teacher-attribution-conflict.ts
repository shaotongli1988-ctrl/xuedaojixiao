/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-attribution-conflict.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface TeacherAttributionConflictCreatePayload {
	teacherId: number;
	agentId?: number;
	sourceRemark?: string;
}

export interface ApiResponse_TeacherAttributionConflictRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  status?: TeacherAttributionConflictStatus;
  candidateAgentIds?: Array<number>;
} & {
  teacherId?: number;
  teacherName?: string;
  resolution?: string;
  resolutionRemark?: string;
  resolvedBy?: number;
  resolvedTime?: string;
  currentAgentId?: number;
  requestedAgentId?: number;
  requestedById?: number;
  createTime?: string;
  updateTime?: string;
};
}

export type TeacherAttributionConflictStatus = "cancelled" | "open" | "resolved";

export interface ApiResponse_TeacherAttributionConflictDetail {
	code: number;
	message: string;
	data: {
  status?: TeacherAttributionConflictStatus;
  candidateAgents?: Array<{
  id: number;
  name: string;
}>;
  candidateAgentIds?: Array<number>;
} & {
  currentAgentName?: string;
  requestedAgentName?: string;
  id?: number;
  teacherId?: number;
  teacherName?: string;
  resolution?: string;
  resolutionRemark?: string;
  resolvedBy?: number;
  resolvedTime?: string;
  currentAgentId?: number;
  requestedAgentId?: number;
  requestedById?: number;
  createTime?: string;
  updateTime?: string;
};
}

export interface TeacherAttributionConflictFetchInfoQuery {
	id: number;
}

export type TeacherAttributionConflictPageQuery = TeacherAttributionConflictFetchPageRequest & {
  page: number;
  size: number;
  status?: string;
};

export interface TeacherAttributionConflictFetchPageRequest {

}

export interface ApiResponse_TeacherAttributionConflictPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<TeacherAttributionConflictRecord>;
};
}

export type TeacherAttributionConflictRecord = {
  id?: number;
  status?: TeacherAttributionConflictStatus;
  candidateAgentIds?: Array<number>;
} & {
  teacherId?: number;
  teacherName?: string;
  resolution?: string;
  resolutionRemark?: string;
  resolvedBy?: number;
  resolvedTime?: string;
  currentAgentId?: number;
  requestedAgentId?: number;
  requestedById?: number;
  createTime?: string;
  updateTime?: string;
};

export interface TeacherAttributionConflictResolvePayload {
	id: number;
	resolution: "cancelled" | "resolved";
	agentId?: number;
	resolutionRemark?: string;
}

export interface ApiResponse_TeacherAttributionConflictResolveResult {
	code: number;
	message: string;
	data: TeacherAttributionInfo | TeacherAttributionConflictDetail;
}

export type TeacherAttributionInfo = {
  teacherId: number;
  openConflictCount?: number;
} & {
  teacherName?: string;
  currentAttribution?: TeacherAttributionRecord;
  openConflicts?: Array<TeacherAttributionConflictRecord>;
  history?: Array<TeacherAttributionRecord>;
};

export type TeacherAttributionRecord = {
  id?: number;
  status?: TeacherAttributionStatus;
} & {
  teacherId?: number;
  teacherName?: string;
  agentId?: number;
  agentName?: string;
  attributionType?: string;
  sourceType?: string;
  sourceRemark?: string;
  effectiveTime?: string;
  operatorId?: number;
  operatorName?: string;
  createTime?: string;
  updateTime?: string;
};

export type TeacherAttributionStatus = "pending" | "active" | "removed" | "conflicted";

export type TeacherAttributionConflictDetail = {
  status?: TeacherAttributionConflictStatus;
  candidateAgents?: Array<{
  id: number;
  name: string;
}>;
  candidateAgentIds?: Array<number>;
} & {
  currentAgentName?: string;
  requestedAgentName?: string;
  id?: number;
  teacherId?: number;
  teacherName?: string;
  resolution?: string;
  resolutionRemark?: string;
  resolvedBy?: number;
  resolvedTime?: string;
  currentAgentId?: number;
  requestedAgentId?: number;
  requestedById?: number;
  createTime?: string;
  updateTime?: string;
};
