/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance indicator.
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
	description?: string;
	status: IndicatorStatus;
}

export type IndicatorCategory = "assessment" | "goal" | "feedback";

export type IndicatorApplyScope = "department" | "employee" | "all";

export type IndicatorStatus = 0 | 1;

export interface ApiResponse_IndicatorRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  code: string;
  status: IndicatorStatus;
  createTime?: string;
  updateTime?: string;
  name: string;
  category: IndicatorCategory;
  weight: number;
  scoreScale: number;
  applyScope: IndicatorApplyScope;
} & {
  description?: string;
};
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_IndicatorRemoveIndicatorResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface IndicatorInfoQuery {
	id: number;
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
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<IndicatorRecord>;
};
}

export type IndicatorRecord = {
  id?: number;
  code: string;
  status: IndicatorStatus;
  createTime?: string;
  updateTime?: string;
  name: string;
  category: IndicatorCategory;
  weight: number;
  scoreScale: number;
  applyScope: IndicatorApplyScope;
} & {
  description?: string;
};

export type IndicatorUpdateIndicatorRequest = IndicatorSaveRequest & {
  id: number;
};
