/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance recruit-plan.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface RecruitPlanSaveRequest {
	id?: number;
	title: string;
	targetDepartmentId: number;
	positionName: string;
	headcount: number;
	startDate: string;
	endDate: string;
	recruiterId?: number;
	requirementSummary?: string;
	jobStandardId?: number;
	status?: RecruitPlanStatus;
}

export type RecruitPlanStatus = "draft" | "closed" | "active" | "voided";

export interface ApiResponse_RecruitPlanRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  createTime?: string;
  updateTime?: string;
  title: string;
  startDate: string;
  endDate: string;
  positionName: string;
  headcount: number;
} & {
  targetDepartmentId: number;
  targetDepartmentName?: string;
  requirementSummary?: string;
  recruiterId?: number;
  recruiterName?: string;
  jobStandardId?: number;
  jobStandardPositionName?: string;
  jobStandardSummary?: RecruitmentSourceSnapshot;
  jobStandardSnapshot?: RecruitmentSourceSnapshot;
  sourceSnapshot?: RecruitmentSourceSnapshot;
  status?: RecruitPlanStatus;
};
}

export interface RecruitmentSourceSnapshot {
	id?: number;
	title?: string;
	status?: string;
	positionName?: string;
	sourceResource?: RecruitmentSourceResource;
	jobStandardId?: number;
	jobStandardPositionName?: string;
	jobStandardRequirementSummary?: string;
	talentAssetId?: number;
	recruitPlanId?: number;
	recruitPlanTitle?: string;
	recruitPlanStatus?: RecruitPlanStatus;
	resumePoolId?: number;
	interviewId?: number;
	candidateName?: string;
	targetDepartmentId?: number;
	targetDepartmentName?: string;
	targetPosition?: string;
	interviewStatus?: InterviewStatus;
	sourceStatusSnapshot?: string;
}

export type RecruitmentSourceResource = "resumePool" | "talentAsset" | "interview" | "jobStandard" | "recruitPlan";

export type InterviewStatus = "cancelled" | "completed" | "scheduled";

export interface RecruitPlanActionRequest {
	id: number;
}

export interface ApiResponse_RecruitPlanDeleteResult {
	code: number;
	message: string;
	data: {
  id: number;
  deleted: boolean;
};
}

export interface RecruitPlanExportQuery {
	keyword?: string;
	targetDepartmentId?: number;
	status?: RecruitPlanStatus;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_RecruitPlanExportRecruitPlanSummaryResult {
	code: number;
	message: string;
	data: Array<RecruitPlanExportRow>;
}

export interface RecruitPlanExportRow {
	id?: number;
	title: string;
	targetDepartmentId?: number;
	targetDepartmentName?: string;
	positionName: string;
	headcount: number;
	startDate: string;
	endDate: string;
	recruiterId?: number;
	recruiterName?: string;
	status?: RecruitPlanStatus;
	createTime?: string;
	updateTime?: string;
}

export interface RecruitPlanImportRequest {
	fileId: number;
	rows: Array<RecruitPlanImportRow>;
}

export interface RecruitPlanImportRow {
	title?: RecruitPlanImportCellValue;
	targetDepartmentId?: RecruitPlanImportCellValue;
	positionName?: RecruitPlanImportCellValue;
	headcount?: RecruitPlanImportCellValue;
	startDate?: RecruitPlanImportCellValue;
	endDate?: RecruitPlanImportCellValue;
	recruiterId?: RecruitPlanImportCellValue;
	requirementSummary?: RecruitPlanImportCellValue;
	jobStandardId?: RecruitPlanImportCellValue;
}

export type RecruitPlanImportCellValue = string | number;

export interface ApiResponse_RecruitPlanImportResult {
	code: number;
	message: string;
	data: {
  fileId: number;
  importedCount: number;
  skippedCount: number;
};
}

export interface RecruitPlanInfoQuery {
	id: number;
}

export interface RecruitPlanPageQuery {
	page: number;
	size: number;
	keyword?: string;
	targetDepartmentId?: number;
	status?: RecruitPlanStatus;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_RecruitPlanPageResult {
	code: number;
	message: string;
	data: {
  pagination: PagePagination;
} & {
  list: Array<RecruitPlanRecord>;
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

export type RecruitPlanRecord = {
  id?: number;
  createTime?: string;
  updateTime?: string;
  title: string;
  startDate: string;
  endDate: string;
  positionName: string;
  headcount: number;
} & {
  targetDepartmentId: number;
  targetDepartmentName?: string;
  requirementSummary?: string;
  recruiterId?: number;
  recruiterName?: string;
  jobStandardId?: number;
  jobStandardPositionName?: string;
  jobStandardSummary?: RecruitmentSourceSnapshot;
  jobStandardSnapshot?: RecruitmentSourceSnapshot;
  sourceSnapshot?: RecruitmentSourceSnapshot;
  status?: RecruitPlanStatus;
};

export type RecruitPlanUpdateRecruitPlanRequest = RecruitPlanSaveRequest & {
  id: number;
};
