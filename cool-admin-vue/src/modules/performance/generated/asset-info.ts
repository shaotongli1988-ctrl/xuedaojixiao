/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-info.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface AssetInfoCreateAssetRequest {
	id?: number;
	assetNo?: string;
	name?: string;
	category?: string;
	assetStatus?: AssetStatus;
	assetType?: string;
	brand?: string;
	model?: string;
	serialNo?: string;
	location?: string;
	departmentId?: number;
	departmentName?: string;
	managerId?: number;
	managerName?: string;
	purchaseDate?: string;
	purchaseAmount?: number;
	supplierName?: string;
	warrantyExpiry?: string;
	residualValue?: number;
	depreciationMonths?: number;
	depreciationStartMonth?: string;
	remark?: string;
	createTime?: string;
	updateTime?: string;
	supplierId?: number;
	purchaseOrderId?: number;
}

export type AssetStatus = "assigned" | "lost" | "pendingInbound" | "available" | "maintenance" | "inTransfer" | "inventorying" | "scrapped";

export interface ApiResponse_AssetInfoRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  assetNo: string;
  name: string;
  category: string;
  assetStatus?: AssetStatus;
  assetType?: string;
  brand?: string;
  model?: string;
  serialNo?: string;
  location?: string;
  departmentId?: number;
  departmentName?: string;
  managerId?: number;
  managerName?: string;
  purchaseDate?: string;
  purchaseAmount?: number;
  supplierName?: string;
  warrantyExpiry?: string;
  residualValue?: number;
  depreciationMonths?: number;
  depreciationStartMonth?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
} & {
  supplierId?: number;
  purchaseOrderId?: number;
};
}

export interface AssetInfoRemoveAssetRequest {
	ids: Array<number>;
}

export interface ApiResponse_AssetInfoRemoveAssetResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface AssetInfoFetchInfoQuery {
	id: number;
}

export interface AssetInfoFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	category?: string;
	assetStatus?: AssetStatus;
	departmentId?: number;
	managerId?: number;
}

export interface ApiResponse_AssetInfoPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<AssetInfoRecord>;
};
}

export type AssetInfoRecord = {
  id?: number;
  assetNo: string;
  name: string;
  category: string;
  assetStatus?: AssetStatus;
  assetType?: string;
  brand?: string;
  model?: string;
  serialNo?: string;
  location?: string;
  departmentId?: number;
  departmentName?: string;
  managerId?: number;
  managerName?: string;
  purchaseDate?: string;
  purchaseAmount?: number;
  supplierName?: string;
  warrantyExpiry?: string;
  residualValue?: number;
  depreciationMonths?: number;
  depreciationStartMonth?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
} & {
  supplierId?: number;
  purchaseOrderId?: number;
};

export type AssetInfoUpdatePayload = {
  id?: number;
  assetNo?: string;
  name?: string;
  category?: string;
  assetStatus?: AssetStatus;
  assetType?: string;
  brand?: string;
  model?: string;
  serialNo?: string;
  location?: string;
  departmentId?: number;
  departmentName?: string;
  managerId?: number;
  managerName?: string;
  purchaseDate?: string;
  purchaseAmount?: number;
  supplierName?: string;
  warrantyExpiry?: string;
  residualValue?: number;
  depreciationMonths?: number;
  depreciationStartMonth?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  supplierId?: number;
  purchaseOrderId?: number;
} & {
  id: number;
};

export interface AssetInfoUpdateAssetStatusRequest {
	id: number;
	assetStatus: AssetStatus;
	remark?: string;
}
