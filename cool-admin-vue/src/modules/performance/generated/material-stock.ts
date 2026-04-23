/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance material-stock.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ApiResponse_MaterialStockRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  createTime?: string;
  updateTime?: string;
  status?: MaterialCatalogStatus;
  materialNo?: string;
  unit?: string;
  currentQty?: number;
  availableQty: number;
  reservedQty?: number;
  issuedQty?: number;
  safetyStock?: number;
  catalogId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  stockId?: number;
  stockStatus?: MaterialStockStatus;
  lastUnitCost?: number;
  stockAmount?: number;
  isLowStock?: boolean;
} & {
  category?: string;
  specification?: string;
  lastInboundTime?: string;
  lastIssueTime?: string;
};
}

export type MaterialCatalogStatus = "active" | "inactive";

export type MaterialStockStatus = "sufficient" | "lowStock" | "outOfStock";

export interface MaterialStockFetchInfoQuery {
	id: number;
}

export interface MaterialStockFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: MaterialCatalogStatus;
	onlyLowStock?: string | boolean | boolean;
	departmentId?: number;
	catalogId?: number;
}

export interface ApiResponse_MaterialStockPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<MaterialStockRecord>;
};
}

export type MaterialStockRecord = {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  createTime?: string;
  updateTime?: string;
  status?: MaterialCatalogStatus;
  materialNo?: string;
  unit?: string;
  currentQty?: number;
  availableQty: number;
  reservedQty?: number;
  issuedQty?: number;
  safetyStock?: number;
  catalogId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  stockId?: number;
  stockStatus?: MaterialStockStatus;
  lastUnitCost?: number;
  stockAmount?: number;
  isLowStock?: boolean;
} & {
  category?: string;
  specification?: string;
  lastInboundTime?: string;
  lastIssueTime?: string;
};

export interface ApiResponse_void {
	code: number;
	message: string;
	data: null;
}
