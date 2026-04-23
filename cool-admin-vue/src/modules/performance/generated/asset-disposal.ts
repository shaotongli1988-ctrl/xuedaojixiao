/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-disposal.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface AssetDisposalCreateDisposalRequest {
	id?: number;
	disposalNo?: string;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	departmentId?: number;
	departmentName?: string;
	applicantId?: number;
	applicantName?: string;
	reason?: string;
	estimatedResidualAmount?: number;
	submitTime?: string;
	approveTime?: string;
	executeTime?: string;
	remark?: string;
	status?: AssetDisposalStatus;
	createTime?: string;
	updateTime?: string;
}

export type AssetStatus = "assigned" | "lost" | "pendingInbound" | "available" | "maintenance" | "inTransfer" | "inventorying" | "scrapped";

export type AssetDisposalStatus = "draft" | "submitted" | "approved" | "scrapped" | "cancelled";

export interface ApiResponse_AssetDisposalRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  disposalNo?: string;
  assetId?: number;
  assetNo?: string;
  assetName?: string;
  assetStatus?: AssetStatus;
  departmentId?: number;
  departmentName?: string;
  applicantId?: number;
  applicantName?: string;
  reason: string;
  estimatedResidualAmount?: number;
  submitTime?: string;
  approveTime?: string;
  executeTime?: string;
  remark?: string;
  status?: AssetDisposalStatus;
  createTime?: string;
  updateTime?: string;
};
}

export interface AssetDisposalApproveDisposalRequest {
	id: number;
	remark?: string;
}

export interface AssetDisposalCancelDisposalRequest {
	id: number;
	remark?: string;
}

export interface AssetDisposalExecuteDisposalRequest {
	id: number;
	executeTime?: string;
}

export interface AssetDisposalFetchInfoQuery {
	id: number;
}

export interface AssetDisposalFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: AssetDisposalStatus;
	departmentId?: number;
	applicantId?: number;
}

export interface ApiResponse_AssetDisposalPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<AssetDisposalRecord>;
};
}

export interface AssetDisposalRecord {
	id?: number;
	disposalNo?: string;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	departmentId?: number;
	departmentName?: string;
	applicantId?: number;
	applicantName?: string;
	reason: string;
	estimatedResidualAmount?: number;
	submitTime?: string;
	approveTime?: string;
	executeTime?: string;
	remark?: string;
	status?: AssetDisposalStatus;
	createTime?: string;
	updateTime?: string;
}

export interface AssetDisposalSubmitDisposalRequest {
	id: number;
}

export type AssetDisposalUpdateDisposalRequest = {
  id?: number;
  disposalNo?: string;
  assetId?: number;
  assetNo?: string;
  assetName?: string;
  assetStatus?: AssetStatus;
  departmentId?: number;
  departmentName?: string;
  applicantId?: number;
  applicantName?: string;
  reason?: string;
  estimatedResidualAmount?: number;
  submitTime?: string;
  approveTime?: string;
  executeTime?: string;
  remark?: string;
  status?: AssetDisposalStatus;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};
