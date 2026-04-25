/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-report.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ApiResponse_AssetReportExportResult {
	code: number;
	message: string;
	data: Array<AssetReportRecord>;
}

export interface AssetReportRecord {
	id?: number;
	reportDate?: string;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	category?: string;
	departmentId?: number;
	departmentName?: string;
	assetStatus?: AssetStatus;
	originalAmount?: number;
	netValue?: number;
	monthlyDepreciation?: number;
	disposalStatus?: AssetDisposalStatus;
	remark?: string;
}

export type AssetStatus = "assigned" | "lost" | "pendingInbound" | "available" | "maintenance" | "inTransfer" | "inventorying" | "scrapped";

export type AssetDisposalStatus = "draft" | "submitted" | "approved" | "scrapped" | "cancelled";

export type AssetReportExportQuery = AssetReportExportReportQuery & {
  keyword?: string;
};

export interface AssetReportExportReportQuery {
	departmentId?: number;
	category?: string;
	assetStatus?: string;
	reportDate?: string;
}

export interface AssetReportFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	departmentId?: number;
	category?: string;
	assetStatus?: string;
	reportDate?: string;
}

export interface ApiResponse_AssetReportPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<AssetReportRecord>;
};
}

export interface ApiResponse_AssetReportFetchSummaryResult {
	code: number;
	message: string;
	data: {
  assetCount: number;
  totalOriginalAmount: number;
  totalNetValue: number;
  assignedCount: number;
  maintenanceCount: number;
  scrappedCount: number;
  lostCount: number;
};
}

export type AssetReportSummaryQuery = AssetReportFetchSummaryQuery & {
  keyword?: string;
};

export interface AssetReportFetchSummaryQuery {
	departmentId?: number;
	category?: string;
	assetStatus?: string;
	reportDate?: string;
}
