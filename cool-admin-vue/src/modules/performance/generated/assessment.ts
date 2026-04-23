/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance assessment.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface AssessmentSaveRequest {
	id?: number;
	code?: string;
	employeeId: number;
	assessorId: number;
	departmentId?: number;
	periodType: string;
	periodValue: string;
	targetCompletion: number;
	selfEvaluation: string;
	scoreItems: Array<AssessmentScoreItem>;
}

export interface AssessmentScoreItem {
	id?: number;
	indicatorId?: number | null;
	indicatorName: string;
	score: number;
	weight: number;
	comment?: string;
	weightedScore?: number;
}

export interface ApiResponse_AssessmentRecord {
	code: number;
	message: string;
	data: AssessmentRecord;
}

export interface AssessmentRecord {
	id?: number;
	code?: string;
	employeeId?: number;
	employeeName?: string;
	assessorId?: number;
	assessorName?: string;
	departmentId?: number;
	departmentName?: string;
	periodType?: string;
	periodValue?: string;
	targetCompletion?: number;
	totalScore?: number;
	grade?: string;
	selfEvaluation?: string;
	managerFeedback?: string;
	status?: AssessmentStatus;
	submitTime?: string;
	approveTime?: string;
	createTime?: string;
	updateTime?: string;
	scoreItems?: Array<AssessmentScoreItem>;
}

export type AssessmentStatus = "draft" | "submitted" | "approved" | "rejected";

export interface AssessmentReviewRequest {
	id: number;
	comment?: string;
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface AssessmentExportQuery {
	employeeId?: number;
	assessorId?: number;
	periodValue?: string;
	status?: AssessmentStatus;
}

export interface ApiResponse_AssessmentExportRows {
	code: number;
	message: string;
	data: AssessmentExportRows;
}

export type AssessmentExportRows = Array<AssessmentExportRow>;

export interface AssessmentExportRow {
	code: string;
	employeeName: string;
	departmentName: string;
	periodType: string;
	periodValue: string;
	assessorName: string;
	status: AssessmentStatus;
	targetCompletion: number;
	totalScore: number;
	grade: string;
	submitTime?: string;
	approveTime?: string;
}

export interface AssessmentPageQuery {
	page: number;
	size: number;
	employeeId?: number;
	assessorId?: number;
	periodValue?: string;
	status?: AssessmentStatus;
	mode?: AssessmentPageMode;
}

export type AssessmentPageMode = "initiated" | "my" | "pending";

export interface ApiResponse_AssessmentPageResult {
	code: number;
	message: string;
	data: AssessmentPageResult;
}

export interface AssessmentPageResult {
	list: Array<AssessmentRecord>;
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

export interface AssessmentActionRequest {
	id: number;
}
