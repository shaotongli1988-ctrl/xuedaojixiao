/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-maintenance.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface AssetMaintenanceCreateMaintenanceRequest {
	id?: number;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	maintenanceType?: string;
	vendorName?: string;
	cost?: number;
	planDate?: string;
	startDate?: string;
	completeDate?: string;
	description?: string;
	resultSummary?: string;
	status?: AssetMaintenanceStatus;
	createTime?: string;
	updateTime?: string;
}

export type AssetStatus = "assigned" | "lost" | "pendingInbound" | "available" | "maintenance" | "inTransfer" | "inventorying" | "scrapped";

export type AssetMaintenanceStatus = "cancelled" | "completed" | "scheduled" | "inProgress";

export interface ApiResponse_AssetMaintenanceRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  assetId?: number;
  assetNo?: string;
  assetName?: string;
  assetStatus?: AssetStatus;
  maintenanceType?: string;
  vendorName?: string;
  cost?: number;
  planDate?: string;
  startDate?: string;
  completeDate?: string;
  description?: string;
  resultSummary?: string;
  status?: AssetMaintenanceStatus;
  createTime?: string;
  updateTime?: string;
};
}

export interface AssetMaintenanceCancelMaintenanceRequest {
	id: number;
	resultSummary?: string;
}

export interface AssetMaintenanceCompleteMaintenanceRequest {
	id: number;
	completeDate?: string;
	resultSummary?: string;
}

export interface AssetMaintenanceRemoveMaintenanceRequest {
	ids: Array<number>;
}

export interface ApiResponse_AssetMaintenanceRemoveMaintenanceResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface AssetMaintenanceFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: AssetMaintenanceStatus;
	assetId?: number;
}

export interface ApiResponse_AssetMaintenancePageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<AssetMaintenanceRecord>;
};
}

export interface AssetMaintenanceRecord {
	id?: number;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	maintenanceType?: string;
	vendorName?: string;
	cost?: number;
	planDate?: string;
	startDate?: string;
	completeDate?: string;
	description?: string;
	resultSummary?: string;
	status?: AssetMaintenanceStatus;
	createTime?: string;
	updateTime?: string;
}

export type AssetMaintenanceUpdateMaintenanceRequest = {
  id?: number;
  assetId?: number;
  assetNo?: string;
  assetName?: string;
  assetStatus?: AssetStatus;
  maintenanceType?: string;
  vendorName?: string;
  cost?: number;
  planDate?: string;
  startDate?: string;
  completeDate?: string;
  description?: string;
  resultSummary?: string;
  status?: AssetMaintenanceStatus;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};
