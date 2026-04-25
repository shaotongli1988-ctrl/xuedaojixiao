/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-agent-audit.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

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
