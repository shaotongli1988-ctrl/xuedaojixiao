/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance job-standard.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface JobStandardSaveRequest {
	id?: number;
	positionName: string;
	targetDepartmentId: number;
	jobLevel?: string;
	profileSummary?: string;
	requirementSummary?: string;
	skillTagList?: Array<string>;
	interviewTemplateSummary?: string;
	status?: JobStandardStatus;
}

export type JobStandardStatus = "draft" | "active" | "inactive";

export interface ApiResponse_JobStandardRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  createTime?: string;
  updateTime?: string;
  positionName: string;
  skillTagList?: Array<string>;
} & {
  targetDepartmentId: number;
  targetDepartmentName?: string;
  jobLevel?: string;
  profileSummary?: string;
  requirementSummary?: string;
  interviewTemplateSummary?: string;
  status?: JobStandardStatus;
};
}

export interface JobStandardInfoQuery {
	id: number;
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
	data: {
  pagination: PagePagination;
} & {
  list: Array<JobStandardRecord>;
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

export type JobStandardRecord = {
  id?: number;
  createTime?: string;
  updateTime?: string;
  positionName: string;
  skillTagList?: Array<string>;
} & {
  targetDepartmentId: number;
  targetDepartmentName?: string;
  jobLevel?: string;
  profileSummary?: string;
  requirementSummary?: string;
  interviewTemplateSummary?: string;
  status?: JobStandardStatus;
};

export interface JobStandardStatusUpdateRequest {
	id: number;
	status: JobStandardStatus;
}

export type JobStandardUpdateJobStandardRequest = JobStandardSaveRequest & {
  id: number;
};
