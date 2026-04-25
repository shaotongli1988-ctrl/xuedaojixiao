/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-inventory.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface AssetInventoryCreateInventoryRequest {
	id?: number;
	inventoryNo?: string;
	scopeLabel?: string;
	departmentId?: number;
	departmentName?: string;
	location?: string;
	ownerId?: number;
	ownerName?: string;
	plannedDate?: string;
	completedDate?: string;
	assetCount?: number;
	matchedCount?: number;
	differenceCount?: number;
	remark?: string;
	status?: AssetInventoryStatus;
	createTime?: string;
	updateTime?: string;
}

export type AssetInventoryStatus = "draft" | "counting" | "completed" | "closed";

export interface ApiResponse_AssetInventoryRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  inventoryNo?: string;
  scopeLabel?: string;
  departmentId?: number;
  departmentName?: string;
  location?: string;
  ownerId?: number;
  ownerName?: string;
  plannedDate?: string;
  completedDate?: string;
  assetCount?: number;
  matchedCount?: number;
  differenceCount?: number;
  remark?: string;
  status?: AssetInventoryStatus;
  createTime?: string;
  updateTime?: string;
};
}

export interface AssetInventoryCloseInventoryRequest {
	id: number;
	remark?: string;
}

export interface AssetInventoryCompleteInventoryRequest {
	id: number;
	completedDate?: string;
}

export interface AssetInventoryFetchInfoQuery {
	id: number;
}

export interface AssetInventoryFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: AssetInventoryStatus;
	departmentId?: number;
	ownerId?: number;
}

export interface ApiResponse_AssetInventoryPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<AssetInventoryRecord>;
};
}

export interface AssetInventoryRecord {
	id?: number;
	inventoryNo?: string;
	scopeLabel?: string;
	departmentId?: number;
	departmentName?: string;
	location?: string;
	ownerId?: number;
	ownerName?: string;
	plannedDate?: string;
	completedDate?: string;
	assetCount?: number;
	matchedCount?: number;
	differenceCount?: number;
	remark?: string;
	status?: AssetInventoryStatus;
	createTime?: string;
	updateTime?: string;
}

export interface AssetInventoryStartInventoryRequest {
	id: number;
}

export type AssetInventoryUpdateInventoryRequest = {
  id?: number;
  inventoryNo?: string;
  scopeLabel?: string;
  departmentId?: number;
  departmentName?: string;
  location?: string;
  ownerId?: number;
  ownerName?: string;
  plannedDate?: string;
  completedDate?: string;
  assetCount?: number;
  matchedCount?: number;
  differenceCount?: number;
  remark?: string;
  status?: AssetInventoryStatus;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};
