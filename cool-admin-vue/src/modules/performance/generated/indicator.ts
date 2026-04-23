/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance indicator.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface IndicatorSaveRequest {
	id?: number;
	name: string;
	code: string;
	category: IndicatorCategory;
	weight: number;
	scoreScale: number;
	applyScope: IndicatorApplyScope;
	description?: string | null;
	status: IndicatorStatus;
}

export type IndicatorCategory = "assessment" | "goal" | "feedback";

export type IndicatorApplyScope = "all" | "department" | "employee";

export type IndicatorStatus = 0 | 1;

export interface ApiResponse_IndicatorRecord {
	code: number;
	message: string;
	data: IndicatorRecord;
}

export interface IndicatorRecord {
	id?: number;
	name: string;
	code: string;
	category: IndicatorCategory;
	weight: number;
	scoreScale: number;
	applyScope: IndicatorApplyScope;
	description?: string | null;
	status: IndicatorStatus;
	createTime?: string;
	updateTime?: string;
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_Void {
	code: number;
	message: string;
	data?: null;
}

export interface IndicatorPageQuery {
	page: number;
	size: number;
	keyword?: string;
	category?: IndicatorCategory;
	status?: IndicatorStatus;
}

export interface ApiResponse_IndicatorPageResult {
	code: number;
	message: string;
	data: IndicatorPageResult;
}

export interface IndicatorPageResult {
	list: Array<IndicatorRecord>;
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
