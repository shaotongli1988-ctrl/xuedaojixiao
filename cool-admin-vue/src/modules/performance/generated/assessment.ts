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

export type AssessmentScoreItem = {
  id?: number;
  weight: number;
  score: number;
  indicatorName: string;
  comment?: string;
  weightedScore?: number;
} & {
  indicatorId?: number;
};

export interface ApiResponse_AssessmentRecord {
	code: number;
	message: string;
	data: {
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
} & {
  scoreItems?: Array<AssessmentScoreItem>;
};
}

export type AssessmentStatus = "draft" | "submitted" | "approved" | "rejected";

export interface AssessmentReviewRequest {
	id: number;
	comment?: string;
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_AssessmentRemoveAssessmentResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
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
	data: Array<AssessmentExportRow>;
}

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

export interface AssessmentInfoQuery {
	id: number;
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
	data: {
  list: Array<AssessmentRecord>;
  pagination: {
  page: number;
  size: number;
  total: number;
};
};
}

export type AssessmentRecord = {
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
} & {
  scoreItems?: Array<AssessmentScoreItem>;
};

export interface AssessmentActionRequest {
	id: number;
}

export type AssessmentUpdateAssessmentRequest = AssessmentSaveRequest & {
  id: number;
};
