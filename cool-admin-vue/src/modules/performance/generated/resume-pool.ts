/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance resume-pool.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ResumePoolSaveRequest {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetPosition?: string;
	phone: string;
	email?: string;
	resumeText: string;
	sourceType: ResumePoolSourceType;
	sourceRemark?: string;
	externalLink?: string;
	attachmentIdList?: Array<number>;
	recruitPlanId?: number;
	jobStandardId?: number;
	status?: ResumePoolStatus;
}

export type ResumePoolSourceType = "manual" | "attachment" | "external" | "referral";

export type ResumePoolStatus = "archived" | "new" | "screening" | "interviewing";

export interface ApiResponse_ResumePoolRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  createTime?: string;
  updateTime?: string;
  sourceType: ResumePoolSourceType;
  targetDepartmentName?: string;
  candidateName: string;
  phone: string;
  attachmentIdList?: Array<number>;
  attachmentSummaryList?: Array<ResumePoolAttachmentSummary>;
} & {
  targetDepartmentId: number;
  targetPosition?: string;
  email?: string;
  sourceRemark?: string;
  externalLink?: string;
  recruitPlanId?: number;
  recruitPlanTitle?: string;
  jobStandardId?: number;
  jobStandardPositionName?: string;
  linkedTalentAssetId?: number;
  latestInterviewId?: number;
  resumeText: string;
  sourceSnapshot?: RecruitmentSourceSnapshot;
  recruitPlanSnapshot?: RecruitmentSourceSnapshot;
  jobStandardSnapshot?: RecruitmentSourceSnapshot;
  status?: ResumePoolStatus;
};
}

export interface ResumePoolAttachmentSummary {
	id: number;
	name: string;
	size: number;
	uploadTime: string;
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

export type RecruitPlanStatus = "draft" | "closed" | "active" | "voided";

export type InterviewStatus = "cancelled" | "completed" | "scheduled";

export interface ResumePoolActionRequest {
	id: number;
}

export interface ApiResponse_ResumePoolTalentAssetConvertResult {
	code: number;
	message: string;
	data: {
  talentAssetId: number;
  created: boolean;
};
}

export interface ApiResponse_ResumePoolCreateInterviewResult {
	code: number;
	message: string;
	data: {
  interviewId: number;
  status: ResumePoolStatus;
  resumePoolId: number;
  recruitPlanId?: number;
  jobStandardId?: number;
  sourceSnapshot?: RecruitmentSourceSnapshot;
  snapshot?: RecruitmentSourceSnapshot;
  resumePoolSummary?: RecruitmentSourceSnapshot;
  resumePoolSnapshot?: RecruitmentSourceSnapshot;
  recruitPlanSummary?: RecruitmentSourceSnapshot;
  recruitPlanSnapshot?: RecruitmentSourceSnapshot;
  jobStandardSummary?: RecruitmentSourceSnapshot;
  jobStandardSnapshot?: RecruitmentSourceSnapshot;
};
}

export interface ResumePoolDownloadAttachmentRequest {
	id: number;
	attachmentId: number;
}

export interface ApiResponse_ResumePoolAttachmentDownloadResult {
	code: number;
	message: string;
	data: {
  id: number;
  name: string;
  size: number;
  uploadTime: string;
  url: string;
  downloadUrl: string;
  fileId: string;
};
}

export interface ResumePoolExportQuery {
	keyword?: string;
	targetDepartmentId?: number;
	status?: ResumePoolStatus;
	sourceType?: ResumePoolSourceType;
}

export interface ApiResponse_ResumePoolExportResumeResult {
	code: number;
	message: string;
	data: Array<ResumePoolExportRow>;
}

export interface ResumePoolExportRow {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetDepartmentName?: string;
	targetPosition?: string;
	phone: string;
	email?: string;
	resumeText: string;
	sourceType: ResumePoolSourceType;
	sourceRemark?: string;
	externalLink?: string;
	status: ResumePoolStatus;
	linkedTalentAssetId?: number;
	latestInterviewId?: number;
	createTime?: string;
	updateTime?: string;
}

export interface ResumePoolImportRequest {
	fileId: number;
	rows?: Array<ResumePoolImportRow>;
	overwriteRows?: Array<ResumePoolImportOverwriteRow>;
}

export interface ResumePoolImportRow {
	candidateName?: ResumePoolImportCellValue;
	targetDepartmentId?: ResumePoolImportCellValue;
	targetPosition?: ResumePoolImportCellValue;
	phone?: ResumePoolImportCellValue;
	email?: ResumePoolImportCellValue;
	resumeText?: ResumePoolImportCellValue;
	sourceType?: ResumePoolImportCellValue;
	sourceRemark?: ResumePoolImportCellValue;
	externalLink?: ResumePoolImportCellValue;
	recruitPlanId?: ResumePoolImportCellValue;
	jobStandardId?: ResumePoolImportCellValue;
}

export type ResumePoolImportCellValue = string | number;

export interface ResumePoolImportOverwriteRow {
	id: number;
	candidateName?: string;
	targetDepartmentId?: number;
	targetPosition?: string;
	phone?: string;
	email?: string;
	resumeText?: string;
	sourceType?: ResumePoolSourceType;
	sourceRemark?: string;
	externalLink?: string;
	attachmentIdList?: Array<number>;
	recruitPlanId?: number;
	jobStandardId?: number;
	status?: ResumePoolStatus;
}

export interface ApiResponse_ResumePoolImportResult {
	code: number;
	message: string;
	data: {
  fileId: number;
  importedCount: number;
  overwrittenCount: number;
  skippedCount: number;
};
}

export interface ResumePoolInfoQuery {
	id: number;
}

export interface ResumePoolPageQuery {
	page: number;
	size: number;
	keyword?: string;
	targetDepartmentId?: number;
	status?: ResumePoolStatus;
	sourceType?: ResumePoolSourceType;
}

export interface ApiResponse_ResumePoolPageResult {
	code: number;
	message: string;
	data: {
  pagination: PagePagination;
} & {
  list: Array<ResumePoolRecord>;
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

export type ResumePoolRecord = {
  id?: number;
  createTime?: string;
  updateTime?: string;
  sourceType: ResumePoolSourceType;
  targetDepartmentName?: string;
  candidateName: string;
  phone: string;
  attachmentIdList?: Array<number>;
  attachmentSummaryList?: Array<ResumePoolAttachmentSummary>;
} & {
  targetDepartmentId: number;
  targetPosition?: string;
  email?: string;
  sourceRemark?: string;
  externalLink?: string;
  recruitPlanId?: number;
  recruitPlanTitle?: string;
  jobStandardId?: number;
  jobStandardPositionName?: string;
  linkedTalentAssetId?: number;
  latestInterviewId?: number;
  resumeText: string;
  sourceSnapshot?: RecruitmentSourceSnapshot;
  recruitPlanSnapshot?: RecruitmentSourceSnapshot;
  jobStandardSnapshot?: RecruitmentSourceSnapshot;
  status?: ResumePoolStatus;
};

export type ResumePoolUpdateResumeRequest = ResumePoolSaveRequest & {
  id: number;
};

export interface ResumePoolUploadAttachmentRequest {
	id: number;
	fileId: number;
}
