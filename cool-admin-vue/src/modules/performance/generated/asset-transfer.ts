/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-transfer.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface AssetTransferCreateTransferRequest {
	id?: number;
	transferNo?: string;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	fromDepartmentId?: number;
	fromDepartmentName?: string;
	toDepartmentId?: number;
	toDepartmentName?: string;
	fromLocation?: string;
	toLocation?: string;
	applicantId?: number;
	applicantName?: string;
	submitTime?: string;
	completeTime?: string;
	remark?: string;
	status?: AssetTransferStatus;
	createTime?: string;
	updateTime?: string;
}

export type AssetStatus = "assigned" | "lost" | "pendingInbound" | "available" | "maintenance" | "inTransfer" | "inventorying" | "scrapped";

export type AssetTransferStatus = "draft" | "cancelled" | "submitted" | "completed" | "inTransit";

export interface ApiResponse_AssetTransferRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  transferNo?: string;
  assetId?: number;
  assetNo?: string;
  assetName?: string;
  assetStatus?: AssetStatus;
  fromDepartmentId?: number;
  fromDepartmentName?: string;
  toDepartmentId?: number;
  toDepartmentName?: string;
  fromLocation?: string;
  toLocation?: string;
  applicantId?: number;
  applicantName?: string;
  submitTime?: string;
  completeTime?: string;
  remark?: string;
  status?: AssetTransferStatus;
  createTime?: string;
  updateTime?: string;
};
}

export interface AssetTransferCancelTransferRequest {
	id: number;
	remark?: string;
}

export interface AssetTransferCompleteTransferRequest {
	id: number;
	completeTime?: string;
}

export interface AssetTransferFetchInfoQuery {
	id: number;
}

export interface AssetTransferFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: AssetTransferStatus;
	fromDepartmentId?: number;
	toDepartmentId?: number;
}

export interface ApiResponse_AssetTransferPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<AssetTransferRecord>;
};
}

export interface AssetTransferRecord {
	id?: number;
	transferNo?: string;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	fromDepartmentId?: number;
	fromDepartmentName?: string;
	toDepartmentId?: number;
	toDepartmentName?: string;
	fromLocation?: string;
	toLocation?: string;
	applicantId?: number;
	applicantName?: string;
	submitTime?: string;
	completeTime?: string;
	remark?: string;
	status?: AssetTransferStatus;
	createTime?: string;
	updateTime?: string;
}

export interface AssetTransferSubmitTransferRequest {
	id: number;
}

export type AssetTransferUpdateTransferRequest = {
  id?: number;
  transferNo?: string;
  assetId?: number;
  assetNo?: string;
  assetName?: string;
  assetStatus?: AssetStatus;
  fromDepartmentId?: number;
  fromDepartmentName?: string;
  toDepartmentId?: number;
  toDepartmentName?: string;
  fromLocation?: string;
  toLocation?: string;
  applicantId?: number;
  applicantName?: string;
  submitTime?: string;
  completeTime?: string;
  remark?: string;
  status?: AssetTransferStatus;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};
