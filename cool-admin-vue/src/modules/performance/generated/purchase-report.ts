/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance purchase-report.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ApiResponse_PurchaseReportFetchSummaryResult {
	code: number;
	message: string;
	data: {
  totalOrders: number;
  totalAmount: number;
  inquiringCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  receivedCount: number;
  closedCount: number;
  cancelledCount: number;
  supplierCount: number;
};
}

export interface PurchaseReportQuery {
	departmentId?: number;
	supplierId?: number;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_PurchaseReportFetchSupplierStatsResult {
	code: number;
	message: string;
	data: Array<PurchaseReportSupplierStat>;
}

export type PurchaseReportSupplierStat = {
  supplierName: string;
  totalAmount: number;
  receivedQuantity: number;
  orderCount: number;
} & {
  supplierId?: number;
  lastOrderDate?: string;
};

export interface ApiResponse_PurchaseReportFetchTrendResult {
	code: number;
	message: string;
	data: Array<PurchaseReportTrendPoint>;
}

export interface PurchaseReportTrendPoint {
	period: string;
	orderCount: number;
	totalAmount: number;
	approvedCount: number;
	receivedQuantity: number;
}
