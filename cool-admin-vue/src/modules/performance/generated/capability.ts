/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance capability.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface CapabilityModelSaveRequest {
	id?: number;
	name: string;
	code?: string;
	category?: string;
	description?: string;
	status?: CapabilityModelStatus;
}

export type CapabilityModelStatus = "draft" | "active" | "archived";

export interface ApiResponse_CapabilityModelRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  name: string;
  code?: string;
  category?: string;
  description?: string;
  status?: CapabilityModelStatus;
  itemCount?: number;
  createTime?: string;
  updateTime?: string;
};
}

export interface CapabilityModelInfoQuery {
	id: number;
}

export interface CapabilityModelPageQuery {
	page: number;
	size: number;
	keyword?: string;
	category?: string;
	status?: CapabilityModelStatus;
}

export interface ApiResponse_CapabilityModelFetchPageResult {
	code: number;
	message: string;
	data: {
  list: Array<CapabilityModelRecord>;
  pagination: PagePagination;
};
}

export interface CapabilityModelRecord {
	id?: number;
	name: string;
	code?: string;
	category?: string;
	description?: string;
	status?: CapabilityModelStatus;
	itemCount?: number;
	createTime?: string;
	updateTime?: string;
}

export interface PagePagination {
	/**
	 * 页码
	 */
	page: number;
	/**
	 * 页大小
	 */
	size: number;
	/**
	 * 总数
	 */
	total: number;
}

export type CapabilityModelUpdateModelRequest = CapabilityModelSaveRequest & {
  id: number;
};

export interface ApiResponse_CapabilityItemRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  modelId?: number;
  name: string;
  level?: string;
  description?: string;
  evidenceHint?: string;
  updateTime?: string;
};
}

export interface CapabilityItemInfoQuery {
	id: number;
}

export interface ApiResponse_CapabilityPortraitRecord {
	code: number;
	message: string;
	data: {
  employeeId: number;
  employeeName?: string;
  departmentId?: number;
  departmentName?: string;
  capabilityTags?: Array<string>;
  levelSummary?: Array<string>;
  certificateCount?: number;
  lastCertifiedAt?: string;
  updatedAt?: string;
};
}

export interface CapabilityPortraitInfoQuery {
	employeeId: number;
}
