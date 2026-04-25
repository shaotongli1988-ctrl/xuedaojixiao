/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance talent-asset.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface TalentAssetSaveRequest {
	id?: number;
	candidateName: string;
	code?: string;
	targetDepartmentId: number;
	targetPosition?: string;
	source: string;
	tagList?: Array<string>;
	followUpSummary?: string;
	nextFollowUpDate?: string;
	status?: TalentAssetStatus;
}

export type TalentAssetStatus = "archived" | "new" | "tracking";

export interface ApiResponse_TalentAssetRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  createTime?: string;
  updateTime?: string;
  candidateName: string;
  source: string;
  tagList?: Array<string>;
} & {
  code?: string;
  targetDepartmentId: number;
  targetDepartmentName?: string;
  targetPosition?: string;
  followUpSummary?: string;
  nextFollowUpDate?: string;
  status?: TalentAssetStatus;
};
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_TalentAssetRemoveTalentAssetResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface TalentAssetInfoQuery {
	id: number;
}

export interface TalentAssetPageQuery {
	page: number;
	size: number;
	keyword?: string;
	targetDepartmentId?: number;
	source?: string;
	tag?: string;
	status?: TalentAssetStatus;
}

export interface ApiResponse_TalentAssetPageResult {
	code: number;
	message: string;
	data: {
  pagination: PagePagination;
} & {
  list: Array<TalentAssetRecord>;
};
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

export type TalentAssetRecord = {
  id?: number;
  createTime?: string;
  updateTime?: string;
  candidateName: string;
  source: string;
  tagList?: Array<string>;
} & {
  code?: string;
  targetDepartmentId: number;
  targetDepartmentName?: string;
  targetPosition?: string;
  followUpSummary?: string;
  nextFollowUpDate?: string;
  status?: TalentAssetStatus;
};

export type TalentAssetUpdateTalentAssetRequest = TalentAssetSaveRequest & {
  id: number;
};
