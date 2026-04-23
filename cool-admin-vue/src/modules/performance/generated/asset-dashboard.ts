/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-dashboard.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ApiResponse_AssetDashboardSummary {
	code: number;
	message: string;
	data: {
  totalAssetCount: number;
  pendingInboundCount: number;
  availableCount: number;
  assignedCount: number;
  maintenanceCount: number;
  inventoryingCount: number;
  scrappedCount: number;
  lostCount: number;
  totalOriginalAmount: number;
  monthlyDepreciationAmount: number;
  pendingDisposalCount: number;
  expiringWarrantyCount: number;
  updatedAt?: string;
} & {
  statusDistribution: Array<AssetStatusDistributionItem>;
  categoryDistribution: Array<AssetCategoryDistributionItem>;
  actionOverview: {
  today: AssetDashboardActionSummaryItem;
  thisWeek: AssetDashboardActionSummaryItem;
  thisMonth: AssetDashboardActionSummaryItem;
};
  actionTimeline: Array<AssetDashboardActivityItem>;
  recentActivities: Array<AssetDashboardActivityItem>;
};
}

export interface AssetStatusDistributionItem {
	status: AssetStatus;
	count: number;
	amount?: number;
}

export type AssetStatus = "assigned" | "lost" | "pendingInbound" | "available" | "maintenance" | "inTransfer" | "inventorying" | "scrapped";

export interface AssetCategoryDistributionItem {
	category: string;
	count: number;
	amount?: number;
}

export interface AssetDashboardActionSummaryItem {
	actionCount: number;
	assetCount: number;
	documentCount: number;
}

export type AssetDashboardActivityItem = {
  id?: number;
  departmentName?: string;
  title: string;
  status?: string;
  resultStatus?: string;
  operatorName?: string;
  module: "assetInfo" | "assetAssignment" | "assetMaintenance" | "assetProcurement" | "assetTransfer" | "assetInventory" | "assetDisposal" | "assetDepreciation";
  actionLabel?: string;
  objectNo?: string;
  objectName?: string;
  occurredAt?: string;
} & {
  assetId?: number;
  departmentId?: number;
  documentKey?: string;
};

export interface AssetDashboardFetchSummaryQuery {
	departmentId?: number;
	category?: string;
	keyword?: string;
}
