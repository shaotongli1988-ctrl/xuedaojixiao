/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance jobStandard.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface JobStandardSaveRequest {
	id?: number;
	positionName: string;
	targetDepartmentId: number;
	jobLevel?: string | null;
	profileSummary?: string | null;
	requirementSummary?: string | null;
	skillTagList?: Array<string>;
	interviewTemplateSummary?: string | null;
	status?: JobStandardStatus;
}

export type JobStandardStatus = "draft" | "active" | "inactive";

export interface ApiResponse_JobStandardRecord {
	code: number;
	message: string;
	data: JobStandardRecord;
}

export interface JobStandardRecord {
	id?: number;
	positionName: string;
	targetDepartmentId: number;
	targetDepartmentName?: string;
	jobLevel?: string | null;
	profileSummary?: string | null;
	requirementSummary?: string | null;
	skillTagList?: Array<string>;
	interviewTemplateSummary?: string | null;
	status: JobStandardStatus;
	createTime?: string;
	updateTime?: string;
}

export interface JobStandardPageQuery {
	page: number;
	size: number;
	keyword?: string;
	targetDepartmentId?: number;
	status?: JobStandardStatus;
}

export interface ApiResponse_JobStandardPageResult {
	code: number;
	message: string;
	data: JobStandardPageResult;
}

export interface JobStandardPageResult {
	list: Array<JobStandardRecord>;
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

export interface JobStandardStatusUpdateRequest {
	id: number;
	status: JobStandardStatus;
}
