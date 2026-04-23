/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance capability.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface CapabilityModelSaveRequest {
	id?: number;
	name: string;
	code?: string | null;
	category?: string | null;
	description?: string | null;
	status?: CapabilityModelStatus;
}

export type CapabilityModelStatus = "draft" | "active" | "archived";

export interface ApiResponse_CapabilityModelRecord {
	code: number;
	message: string;
	data: CapabilityModelRecord;
}

export interface CapabilityModelRecord {
	id?: number;
	name: string;
	code?: string | null;
	category?: string | null;
	description?: string | null;
	status?: CapabilityModelStatus;
	itemCount?: number;
	createTime?: string;
	updateTime?: string;
}

export interface CapabilityModelPageQuery {
	page: number;
	size: number;
	keyword?: string;
	category?: string;
	status?: CapabilityModelStatus;
}

export interface ApiResponse_CapabilityModelPageResult {
	code: number;
	message: string;
	data: CapabilityModelPageResult;
}

export interface CapabilityModelPageResult {
	list: Array<CapabilityModelRecord>;
	pagination: PagePagination;
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
