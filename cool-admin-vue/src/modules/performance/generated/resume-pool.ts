/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance resume-pool.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ResumePoolSaveRequest {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetPosition?: string | null;
	phone: string;
	email?: string | null;
	resumeText: string;
	sourceType: ResumePoolSourceType;
	sourceRemark?: string | null;
	externalLink?: string | null;
	attachmentIdList?: Array<number>;
	recruitPlanId?: number | null;
	jobStandardId?: number | null;
	status?: ResumePoolStatus;
}

export type ResumePoolSourceType = "manual" | "attachment" | "external" | "referral";

export type ResumePoolStatus = "new" | "screening" | "interviewing" | "archived";

export interface ApiResponse_ResumePoolRecord {
	code: number;
	message: string;
	data: ResumePoolRecord;
}

export interface ResumePoolRecord {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetDepartmentName?: string;
	targetPosition?: string | null;
	phone: string;
	email?: string | null;
	resumeText?: string;
	sourceType: ResumePoolSourceType;
	sourceRemark?: string | null;
	externalLink?: string | null;
	attachmentIdList?: Array<number>;
	attachmentSummaryList?: Array<ResumePoolAttachmentSummary>;
	status: ResumePoolStatus;
	linkedTalentAssetId?: number | null;
	latestInterviewId?: number | null;
	recruitPlanId?: number | null;
	jobStandardId?: number | null;
	recruitPlanSummary?: ResumePoolRecruitPlanSnapshot | null;
	recruitPlanSnapshot?: ResumePoolRecruitPlanSnapshot | null;
	jobStandardSummary?: ResumePoolJobStandardSnapshot | null;
	jobStandardSnapshot?: ResumePoolJobStandardSnapshot | null;
	createTime?: string;
	updateTime?: string;
}

export interface ResumePoolAttachmentSummary {
	id: number;
	name: string;
	size: number;
	uploadTime: string;
}

export interface ResumePoolRecruitPlanSnapshot {
	id?: number | null;
	title?: string;
	positionName?: string | null;
	targetDepartmentId?: number | null;
	targetDepartmentName?: string | null;
	headcount?: number | null;
	startDate?: string | null;
	endDate?: string | null;
	status?: RecruitPlanStatus | null;
	jobStandardId?: number | null;
}

export type RecruitPlanStatus = "draft" | "active" | "voided" | "closed";

export interface ResumePoolJobStandardSnapshot {
	id?: number | null;
	positionName?: string;
	jobLevel?: string | null;
	targetDepartmentId?: number | null;
	targetDepartmentName?: string | null;
	status?: JobStandardStatus | null;
	requirementSummary?: string | null;
}

export type JobStandardStatus = "draft" | "active" | "inactive";

export interface ResumePoolActionRequest {
	id: number;
}

export interface ApiResponse_ResumePoolTalentAssetConvertResult {
	code: number;
	message: string;
	data: ResumePoolTalentAssetConvertResult;
}

export interface ResumePoolTalentAssetConvertResult {
	talentAssetId: number;
	created: boolean;
}

export interface ApiResponse_ResumePoolCreateInterviewResult {
	code: number;
	message: string;
	data: ResumePoolCreateInterviewResult;
}

export interface ResumePoolCreateInterviewResult {
	interviewId: number;
	status: ResumePoolStatus;
	resumePoolId: number;
	recruitPlanId?: number | null;
	jobStandardId?: number | null;
	sourceSnapshot?: ResumePoolInterviewSourceSnapshot;
	snapshot?: ResumePoolReferenceSnapshot;
	resumePoolSummary?: ResumePoolReferenceSnapshot;
	resumePoolSnapshot?: ResumePoolReferenceSnapshot;
	recruitPlanSummary?: ResumePoolRecruitPlanSnapshot | null;
	recruitPlanSnapshot?: ResumePoolRecruitPlanSnapshot | null;
	jobStandardSummary?: ResumePoolJobStandardSnapshot | null;
	jobStandardSnapshot?: ResumePoolJobStandardSnapshot | null;
}

export interface ResumePoolInterviewSourceSnapshot {
	sourceResource: "resumePool";
	resumePoolId: number;
	recruitPlanId?: number | null;
	recruitPlanTitle?: string | null;
	candidateName?: string | null;
	targetDepartmentId: number;
	targetPosition?: string | null;
}

export interface ResumePoolReferenceSnapshot {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	phone: string;
	email?: string | null;
	status: ResumePoolStatus;
	recruitPlanId?: number | null;
	jobStandardId?: number | null;
}

export interface ResumePoolDownloadAttachmentRequest {
	id: number;
	attachmentId: number;
}

export interface ApiResponse_ResumePoolAttachmentDownloadResult {
	code: number;
	message: string;
	data: ResumePoolAttachmentDownloadResult;
}

export interface ResumePoolAttachmentDownloadResult {
	id: number;
	name: string;
	size: number;
	uploadTime: string;
	url: string;
	downloadUrl: string;
	fileId: string;
}

export interface ResumePoolExportQuery {
	keyword?: string;
	targetDepartmentId?: number;
	status?: ResumePoolStatus;
	sourceType?: ResumePoolSourceType;
}

export interface ApiResponse_ResumePoolExportRows {
	code: number;
	message: string;
	data: ResumePoolExportRows;
}

export type ResumePoolExportRows = Array<ResumePoolExportRow>;

export interface ResumePoolExportRow {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetDepartmentName?: string;
	targetPosition?: string | null;
	phone: string;
	email?: string | null;
	resumeText: string;
	sourceType: ResumePoolSourceType;
	sourceRemark?: string | null;
	externalLink?: string | null;
	status: ResumePoolStatus;
	linkedTalentAssetId?: number | null;
	latestInterviewId?: number | null;
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

export type ResumePoolImportCellValue = string | number | null;

export interface ResumePoolImportOverwriteRow {
	id: number;
	candidateName?: string;
	targetDepartmentId?: number;
	targetPosition?: string | null;
	phone?: string;
	email?: string | null;
	resumeText?: string;
	sourceType?: ResumePoolSourceType;
	sourceRemark?: string | null;
	externalLink?: string | null;
	attachmentIdList?: Array<number>;
	recruitPlanId?: number | null;
	jobStandardId?: number | null;
	status?: ResumePoolStatus;
}

export interface ApiResponse_ResumePoolImportResult {
	code: number;
	message: string;
	data: ResumePoolImportResult;
}

export interface ResumePoolImportResult {
	fileId: number;
	importedCount: number;
	overwrittenCount: number;
	skippedCount: number;
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
	data: ResumePoolPageResult;
}

export interface ResumePoolPageResult {
	list: Array<ResumePoolRecord>;
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

export interface ResumePoolUploadAttachmentRequest {
	id: number;
	fileId: number;
}
