/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance supplier.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface SupplierCreateSupplierRequest {
	id?: number;
	status?: SupplierStatus;
	createTime?: string;
	updateTime?: string;
	name?: string;
	code?: string;
	category?: string;
	contactName?: string;
	contactPhone?: string;
	contactEmail?: string;
	bankAccount?: string;
	taxNo?: string;
	remark?: string;
}

export type SupplierStatus = "active" | "inactive";

export interface ApiResponse_SupplierRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  status?: SupplierStatus;
  createTime?: string;
  updateTime?: string;
  name: string;
} & {
  code?: string;
  category?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bankAccount?: string;
  taxNo?: string;
  remark?: string;
};
}

export interface SupplierRemoveSupplierRequest {
	ids: Array<number>;
}

export interface ApiResponse_SupplierRemoveSupplierResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface SupplierFetchInfoQuery {
	id: number;
}

export interface SupplierFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	category?: string;
	status?: string;
}

export interface ApiResponse_SupplierPageResult {
	code: number;
	message: string;
	data: Record<string, unknown> & {
  list: Array<SupplierRecord>;
};
}

export type SupplierRecord = {
  id?: number;
  status?: SupplierStatus;
  createTime?: string;
  updateTime?: string;
  name: string;
} & {
  code?: string;
  category?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bankAccount?: string;
  taxNo?: string;
  remark?: string;
};

export type SupplierUpdatePayload = {
  id?: number;
  status?: SupplierStatus;
  createTime?: string;
  updateTime?: string;
  name?: string;
  code?: string;
  category?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bankAccount?: string;
  taxNo?: string;
  remark?: string;
} & {
  id: number;
};
