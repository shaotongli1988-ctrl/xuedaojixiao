/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-procurement.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface AssetProcurementCreateProcurementRequest {
	id?: number;
	departmentId?: number;
	departmentName?: string;
	status?: AssetProcurementStatus;
	createTime?: string;
	updateTime?: string;
	supplierName?: string;
	remark?: string;
	procurementNo?: string;
	title?: string;
	assetCategory?: string;
	quantity?: number;
	amount?: number;
	requesterId?: number;
	requesterName?: string;
	expectedArrivalDate?: string;
	receiveDate?: string;
	supplierId?: number;
	purchaseOrderId?: number;
}

export type AssetProcurementStatus = "draft" | "submitted" | "cancelled" | "received";

export interface ApiResponse_AssetProcurementRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  status?: AssetProcurementStatus;
  createTime?: string;
  updateTime?: string;
  supplierName?: string;
  remark?: string;
  procurementNo?: string;
  title: string;
  assetCategory: string;
  quantity: number;
  amount: number;
  requesterId?: number;
  requesterName?: string;
  expectedArrivalDate?: string;
  receiveDate?: string;
} & {
  supplierId?: number;
  purchaseOrderId?: number;
};
}

export interface AssetProcurementCancelProcurementRequest {
	id: number;
	remark?: string;
}

export interface AssetProcurementFetchInfoQuery {
	id: number;
}

export interface AssetProcurementFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: AssetProcurementStatus;
	departmentId?: number;
	requesterId?: number;
}

export interface ApiResponse_AssetProcurementPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<AssetProcurementRecord>;
};
}

export type AssetProcurementRecord = {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  status?: AssetProcurementStatus;
  createTime?: string;
  updateTime?: string;
  supplierName?: string;
  remark?: string;
  procurementNo?: string;
  title: string;
  assetCategory: string;
  quantity: number;
  amount: number;
  requesterId?: number;
  requesterName?: string;
  expectedArrivalDate?: string;
  receiveDate?: string;
} & {
  supplierId?: number;
  purchaseOrderId?: number;
};

export interface AssetProcurementReceiveProcurementRequest {
	id: number;
	receiveDate?: string;
}

export interface AssetProcurementSubmitProcurementRequest {
	id: number;
}

export type AssetProcurementUpdatePayload = {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  status?: AssetProcurementStatus;
  createTime?: string;
  updateTime?: string;
  supplierName?: string;
  remark?: string;
  procurementNo?: string;
  title?: string;
  assetCategory?: string;
  quantity?: number;
  amount?: number;
  requesterId?: number;
  requesterName?: string;
  expectedArrivalDate?: string;
  receiveDate?: string;
  supplierId?: number;
  purchaseOrderId?: number;
} & {
  id: number;
};
