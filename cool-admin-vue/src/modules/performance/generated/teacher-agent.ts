/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-agent.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface TeacherAgentCreateTeacherAgentRequest {
	id?: number;
	status?: TeacherAgentStatus;
	name?: string;
	agentType?: string;
	blacklistStatus?: TeacherAgentBlacklistStatus;
	level?: string;
	region?: string;
	cooperationStatus?: string;
	remark?: string;
	ownerEmployeeId?: number;
	ownerDepartmentId?: number;
	createTime?: string;
	updateTime?: string;
}

export type TeacherAgentStatus = "active" | "inactive";

export type TeacherAgentBlacklistStatus = "normal" | "blacklisted";

export interface ApiResponse_TeacherAgentRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  status?: TeacherAgentStatus;
  name: string;
  agentType: string;
  blacklistStatus?: TeacherAgentBlacklistStatus;
} & {
  level?: string;
  region?: string;
  cooperationStatus?: string;
  remark?: string;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
};
}

export interface TeacherAgentBlacklistRequest {
	id: number;
}

export interface TeacherAgentFetchInfoQuery {
	id: number;
}

export type TeacherAgentPageQuery = TeacherAgentFetchPageRequest & {
  page: number;
  size: number;
};

export interface TeacherAgentFetchPageRequest {

}

export interface ApiResponse_TeacherAgentPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<TeacherAgentRecord>;
};
}

export type TeacherAgentRecord = {
  id?: number;
  status?: TeacherAgentStatus;
  name: string;
  agentType: string;
  blacklistStatus?: TeacherAgentBlacklistStatus;
} & {
  level?: string;
  region?: string;
  cooperationStatus?: string;
  remark?: string;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
};

export interface TeacherAgentUnblacklistRequest {
	id: number;
}

export type TeacherAgentUpdatePayload = {
  id?: number;
  status?: TeacherAgentStatus;
  name?: string;
  agentType?: string;
  blacklistStatus?: TeacherAgentBlacklistStatus;
  level?: string;
  region?: string;
  cooperationStatus?: string;
  remark?: string;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};

export interface TeacherAgentUpdateStatusRequest {
	id: number;
	status: string;
}

export interface ApiResponse_TeacherAgentAuditRecord {
	code: number;
	message: string;
	data: {
  id?: number;
} & {
  resourceType?: string;
  resourceId?: number;
  action?: string;
  beforeSnapshot?: JsonObject;
  afterSnapshot?: JsonObject;
  operatorId?: number;
  operatorName?: string;
  createTime?: string;
  updateTime?: string;
};
}

export interface JsonObject {

}

export interface TeacherAgentAuditFetchInfoQuery {
	id: number;
}

export type TeacherAgentAuditPageQuery = TeacherAgentAuditFetchPageRequest & {
  page: number;
  size: number;
};

export interface TeacherAgentAuditFetchPageRequest {

}

export interface ApiResponse_TeacherAgentAuditPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<TeacherAgentAuditRecord>;
};
}

export type TeacherAgentAuditRecord = {
  id?: number;
} & {
  resourceType?: string;
  resourceId?: number;
  action?: string;
  beforeSnapshot?: JsonObject;
  afterSnapshot?: JsonObject;
  operatorId?: number;
  operatorName?: string;
  createTime?: string;
  updateTime?: string;
};

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
