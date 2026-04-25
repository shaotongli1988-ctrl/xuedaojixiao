/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-depreciation.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface AssetDepreciationFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	depreciationMonth?: string;
	departmentId?: number;
}

export interface ApiResponse_AssetDepreciationPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<AssetDepreciationRecord>;
};
}

export interface AssetDepreciationRecord {
	id?: number;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	departmentId?: number;
	departmentName?: string;
	depreciationMonth: string;
	originalAmount: number;
	residualValue: number;
	monthlyDepreciation: number;
	accumulatedDepreciation: number;
	netValue: number;
	updateTime?: string;
}

export type AssetStatus = "assigned" | "lost" | "pendingInbound" | "available" | "maintenance" | "inTransfer" | "inventorying" | "scrapped";

export interface AssetDepreciationRecalculateRequest {
	depreciationMonth: string;
	departmentId?: number;
}

export interface ApiResponse_AssetDepreciationRecalculateResult {
	code: number;
	message: string;
	data: {
  month?: string;
  assetCount: number;
  totalOriginalAmount: number;
  totalAccumulatedDepreciation: number;
  totalNetValue: number;
  currentMonthDepreciation: number;
  lastRecalculatedAt?: string;
};
}

export interface ApiResponse_AssetDepreciationFetchSummaryResult {
	code: number;
	message: string;
	data: {
  month?: string;
  assetCount: number;
  totalOriginalAmount: number;
  totalAccumulatedDepreciation: number;
  totalNetValue: number;
  currentMonthDepreciation: number;
  lastRecalculatedAt?: string;
};
}

export interface AssetDepreciationFetchSummaryQuery {
	depreciationMonth?: string;
	departmentId?: number;
}
