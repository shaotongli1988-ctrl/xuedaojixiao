/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance talent-asset.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface TalentAssetSaveRequest {
	id?: number;
	candidateName: string;
	code?: string | null;
	targetDepartmentId: number;
	targetPosition?: string | null;
	source: string;
	tagList?: Array<string>;
	followUpSummary?: string | null;
	nextFollowUpDate?: string | null;
	status?: TalentAssetStatus;
}

export type TalentAssetStatus = "new" | "tracking" | "archived";

export interface ApiResponse_TalentAssetRecord {
	code: number;
	message: string;
	data: TalentAssetRecord;
}

export interface TalentAssetRecord {
	id?: number;
	candidateName: string;
	code?: string | null;
	targetDepartmentId: number;
	targetDepartmentName?: string;
	targetPosition?: string | null;
	source: string;
	tagList?: Array<string>;
	followUpSummary?: string | null;
	nextFollowUpDate?: string | null;
	status: TalentAssetStatus;
	createTime?: string;
	updateTime?: string;
}

export interface DeleteIdsRequest {
	ids: Array<number>;
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
	data: TalentAssetPageResult;
}

export interface TalentAssetPageResult {
	list: Array<TalentAssetRecord>;
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
