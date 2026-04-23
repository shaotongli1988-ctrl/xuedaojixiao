/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance recruitPlan.
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
	recruiterId?: number | null;
	requirementSummary?: string | null;
	jobStandardId?: number | null;
	status?: RecruitPlanStatus;
}

export type RecruitPlanStatus = "draft" | "active" | "voided" | "closed";

export interface ApiResponse_RecruitPlanRecord {
	code: number;
	message: string;
	data: RecruitPlanRecord;
}

export interface RecruitPlanRecord {
	id?: number;
	title: string;
	targetDepartmentId: number;
	targetDepartmentName?: string | null;
	positionName: string;
	headcount: number;
	startDate: string;
	endDate: string;
	recruiterId?: number | null;
	recruiterName?: string | null;
	requirementSummary?: string | null;
	jobStandardId?: number | null;
	jobStandardSummary?: RecruitPlanSourceSnapshot | null;
	jobStandardSnapshot?: RecruitPlanSourceSnapshot | null;
	status: RecruitPlanStatus;
	createTime?: string;
	updateTime?: string;
}

export interface RecruitPlanSourceSnapshot {
	id?: number | null;
	positionName?: string;
	jobLevel?: string | null;
	targetDepartmentId?: number | null;
	targetDepartmentName?: string | null;
	status?: JobStandardStatus | null;
	requirementSummary?: string | null;
}

export type JobStandardStatus = "draft" | "active" | "inactive";

export interface RecruitPlanActionRequest {
	id: number;
}

export interface ApiResponse_RecruitPlanDeleteResult {
	code: number;
	message: string;
	data: RecruitPlanDeleteResult;
}

export interface RecruitPlanDeleteResult {
	id: number;
	deleted: boolean;
}

export interface RecruitPlanExportQuery {
	keyword?: string;
	targetDepartmentId?: number;
	status?: RecruitPlanStatus;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_RecruitPlanExportRows {
	code: number;
	message: string;
	data: RecruitPlanExportRows;
}

export type RecruitPlanExportRows = Array<RecruitPlanExportRow>;

export interface RecruitPlanExportRow {
	id?: number;
	title: string;
	targetDepartmentId: number;
	targetDepartmentName?: string | null;
	positionName: string;
	headcount: number;
	startDate: string;
	endDate: string;
	recruiterId?: number | null;
	recruiterName?: string | null;
	requirementSummary?: string | null;
	jobStandardId?: number | null;
	jobStandardSummary?: RecruitPlanSourceSnapshot | null;
	jobStandardSnapshot?: RecruitPlanSourceSnapshot | null;
	status: RecruitPlanStatus;
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

export type RecruitPlanImportCellValue = string | number | null;

export interface ApiResponse_RecruitPlanImportResult {
	code: number;
	message: string;
	data: RecruitPlanImportResult;
}

export interface RecruitPlanImportResult {
	fileId: number;
	importedCount: number;
	skippedCount: number;
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
	data: RecruitPlanPageResult;
}

export interface RecruitPlanPageResult {
	list: Array<RecruitPlanRecord>;
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
