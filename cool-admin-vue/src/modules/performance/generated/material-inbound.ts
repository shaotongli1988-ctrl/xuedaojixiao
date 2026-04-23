/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance material-inbound.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface MaterialInboundCreateInboundRequest {
	id?: number;
	departmentId?: number;
	departmentName?: string;
	createTime?: string;
	updateTime?: string;
	title?: string;
	quantity?: number;
	amount?: number;
	status?: MaterialInboundStatus;
	materialNo?: string;
	unit?: string;
	inboundNo?: string;
	catalogId?: number;
	materialId?: number;
	materialCode?: string;
	materialName?: string;
	unitCost?: number;
	unitPrice?: number;
	totalAmount?: number;
	receivedByName?: string;
	category?: string;
	specification?: string;
	sourceType?: string;
	sourceBizId?: string;
	submittedAt?: string;
	receivedBy?: number;
	receivedAt?: string;
	remark?: string;
}

export type MaterialInboundStatus = "draft" | "cancelled" | "submitted" | "received";

export interface ApiResponse_MaterialInboundRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  createTime?: string;
  updateTime?: string;
  title?: string;
  quantity: number;
  amount?: number;
  status?: MaterialInboundStatus;
  materialNo?: string;
  unit?: string;
  inboundNo?: string;
  catalogId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  unitCost?: number;
  unitPrice?: number;
  totalAmount: number;
  receivedByName?: string;
} & {
  category?: string;
  specification?: string;
  sourceType?: string;
  sourceBizId?: string;
  submittedAt?: string;
  receivedBy?: number;
  receivedAt?: string;
  remark?: string;
};
}

export interface MaterialInboundCancelInboundRequest {
	id: number;
	remark?: string;
}

export interface MaterialInboundFetchInfoQuery {
	id: number;
}

export interface MaterialInboundFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: MaterialInboundStatus;
	departmentId?: number;
	catalogId?: number;
}

export interface ApiResponse_MaterialInboundPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<MaterialInboundRecord>;
};
}

export type MaterialInboundRecord = {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  createTime?: string;
  updateTime?: string;
  title?: string;
  quantity: number;
  amount?: number;
  status?: MaterialInboundStatus;
  materialNo?: string;
  unit?: string;
  inboundNo?: string;
  catalogId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  unitCost?: number;
  unitPrice?: number;
  totalAmount: number;
  receivedByName?: string;
} & {
  category?: string;
  specification?: string;
  sourceType?: string;
  sourceBizId?: string;
  submittedAt?: string;
  receivedBy?: number;
  receivedAt?: string;
  remark?: string;
};

export interface MaterialInboundReceiveInboundRequest {
	id: number;
	receivedAt?: string;
	remark?: string;
}

export interface MaterialInboundSubmitInboundRequest {
	id: number;
}

export type MaterialInboundUpdatePayload = {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  createTime?: string;
  updateTime?: string;
  title?: string;
  quantity?: number;
  amount?: number;
  status?: MaterialInboundStatus;
  materialNo?: string;
  unit?: string;
  inboundNo?: string;
  catalogId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  unitCost?: number;
  unitPrice?: number;
  totalAmount?: number;
  receivedByName?: string;
  category?: string;
  specification?: string;
  sourceType?: string;
  sourceBizId?: string;
  submittedAt?: string;
  receivedBy?: number;
  receivedAt?: string;
  remark?: string;
} & {
  id: number;
};
