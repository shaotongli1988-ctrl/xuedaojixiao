/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance material-catalog.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface MaterialCatalogCreateMaterialRequest {
	id?: number;
	name?: string;
	createTime?: string;
	updateTime?: string;
	status?: MaterialCatalogStatus;
	code?: string;
	materialNo?: string;
	unit?: string;
	stockDepartmentCount?: number;
	departmentCount?: number;
	currentQty?: number;
	availableQty?: number;
	reservedQty?: number;
	issuedQty?: number;
	safetyStock?: number;
	referenceUnitCost?: number;
	category?: string;
	specification?: string;
	remark?: string;
}

export type MaterialCatalogStatus = "active" | "inactive";

export interface ApiResponse_MaterialCatalogRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  name: string;
  createTime?: string;
  updateTime?: string;
  status?: MaterialCatalogStatus;
  code: string;
  materialNo?: string;
  unit: string;
  stockDepartmentCount?: number;
  departmentCount?: number;
  currentQty?: number;
  availableQty?: number;
  reservedQty?: number;
  issuedQty?: number;
  safetyStock?: number;
  referenceUnitCost?: number;
} & {
  category?: string;
  specification?: string;
  remark?: string;
};
}

export interface MaterialCatalogRemoveMaterialRequest {
	ids: Array<number>;
}

export interface ApiResponse_MaterialCatalogRemoveMaterialResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface MaterialCatalogFetchInfoQuery {
	id: number;
}

export interface MaterialCatalogFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: MaterialCatalogStatus;
}

export interface ApiResponse_MaterialCatalogPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<MaterialCatalogRecord>;
};
}

export type MaterialCatalogRecord = {
  id?: number;
  name: string;
  createTime?: string;
  updateTime?: string;
  status?: MaterialCatalogStatus;
  code: string;
  materialNo?: string;
  unit: string;
  stockDepartmentCount?: number;
  departmentCount?: number;
  currentQty?: number;
  availableQty?: number;
  reservedQty?: number;
  issuedQty?: number;
  safetyStock?: number;
  referenceUnitCost?: number;
} & {
  category?: string;
  specification?: string;
  remark?: string;
};

export type MaterialCatalogUpdatePayload = {
  id?: number;
  name?: string;
  createTime?: string;
  updateTime?: string;
  status?: MaterialCatalogStatus;
  code?: string;
  materialNo?: string;
  unit?: string;
  stockDepartmentCount?: number;
  departmentCount?: number;
  currentQty?: number;
  availableQty?: number;
  reservedQty?: number;
  issuedQty?: number;
  safetyStock?: number;
  referenceUnitCost?: number;
  category?: string;
  specification?: string;
  remark?: string;
} & {
  id: number;
};
