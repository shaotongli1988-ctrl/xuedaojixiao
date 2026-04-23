/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance material-issue.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface MaterialIssueCreateIssueRequest {
	id?: number;
	departmentId?: number;
	departmentName?: string;
	status?: MaterialIssueStatus;
	createTime?: string;
	updateTime?: string;
	title?: string;
	quantity?: number;
	unit?: string;
	materialNo?: string;
	catalogId?: number;
	materialId?: number;
	materialCode?: string;
	materialName?: string;
	issueNo?: string;
	assigneeId?: number;
	assigneeName?: string;
	issuedByName?: string;
	category?: string;
	specification?: string;
	purpose?: string;
	issueDate?: string;
	submittedAt?: string;
	issuedBy?: number;
	issuedAt?: string;
	remark?: string;
}

export type MaterialIssueStatus = "draft" | "submitted" | "issued" | "cancelled";

export interface ApiResponse_MaterialIssueRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  status?: MaterialIssueStatus;
  createTime?: string;
  updateTime?: string;
  title?: string;
  quantity: number;
  unit?: string;
  materialNo?: string;
  catalogId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  issueNo?: string;
  assigneeId?: number;
  assigneeName?: string;
  issuedByName?: string;
} & {
  category?: string;
  specification?: string;
  purpose?: string;
  issueDate?: string;
  submittedAt?: string;
  issuedBy?: number;
  issuedAt?: string;
  remark?: string;
};
}

export interface MaterialIssueCancelIssueRequest {
	id: number;
	remark?: string;
}

export interface MaterialIssueFetchInfoQuery {
	id: number;
}

export interface MaterialIssueIssueMaterialRequest {
	id: number;
	issuedAt?: string;
	remark?: string;
}

export interface MaterialIssueFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: MaterialIssueStatus;
	departmentId?: number;
	catalogId?: number;
}

export interface ApiResponse_MaterialIssuePageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<MaterialIssueRecord>;
};
}

export type MaterialIssueRecord = {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  status?: MaterialIssueStatus;
  createTime?: string;
  updateTime?: string;
  title?: string;
  quantity: number;
  unit?: string;
  materialNo?: string;
  catalogId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  issueNo?: string;
  assigneeId?: number;
  assigneeName?: string;
  issuedByName?: string;
} & {
  category?: string;
  specification?: string;
  purpose?: string;
  issueDate?: string;
  submittedAt?: string;
  issuedBy?: number;
  issuedAt?: string;
  remark?: string;
};

export interface MaterialIssueSubmitIssueRequest {
	id: number;
}

export type MaterialIssueUpdatePayload = {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  status?: MaterialIssueStatus;
  createTime?: string;
  updateTime?: string;
  title?: string;
  quantity?: number;
  unit?: string;
  materialNo?: string;
  catalogId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  issueNo?: string;
  assigneeId?: number;
  assigneeName?: string;
  issuedByName?: string;
  category?: string;
  specification?: string;
  purpose?: string;
  issueDate?: string;
  submittedAt?: string;
  issuedBy?: number;
  issuedAt?: string;
  remark?: string;
} & {
  id: number;
};
