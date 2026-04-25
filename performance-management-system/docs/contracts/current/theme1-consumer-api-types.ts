/**
 * 主题1开发前评审的 consumer 契约快照。
 * 这里只固化前端调用的最小类型和接口路径，作为 schema drift 与 endpoint drift 的消费侧证据，不负责真实页面实现。
 * 维护重点是评估列表、详情、表单、审批和导出只消费冻结字段，不额外扩出自动审批流或相邻主题数据。
 */

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

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export type AssessmentPageMode = "initiated" | "my" | "pending";

export type AssessmentStatus = "draft" | "submitted" | "approved" | "rejected";

export interface AssessmentScoreItem {
	id?: number;
	indicatorId?: number | null;
	indicatorName: string;
	score: number;
	weight: number;
	comment?: string;
	weightedScore?: number;
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

export interface AssessmentActionRequest {
	id: number;
}

export interface AssessmentReviewRequest {
	id: number;
	comment?: string;
}

export interface AssessmentExportQuery {
	employeeId?: number;
	assessorId?: number;
	periodValue?: string;
	status?: AssessmentStatus;
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

export type AssessmentExportRows = Array<AssessmentExportRow>;

export interface AssessmentPageResult {
	list: Array<AssessmentRecord>;
	pagination: PagePagination;
}

const assessmentBaseUrl = "/admin/performance/assessment";

declare function request(config: {
  url: string;
  method: "GET" | "POST";
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchAssessmentPage(data: AssessmentPageQuery) {
  return request({
    url: `${assessmentBaseUrl}/page`,
    method: "POST",
    data,
  });
}

export function fetchAssessmentInfo(params: { id: number }) {
  return request({
    url: `${assessmentBaseUrl}/info`,
    method: "GET",
    params,
  });
}

export function createAssessment(data: AssessmentSaveRequest) {
  return request({
    url: `${assessmentBaseUrl}/add`,
    method: "POST",
    data,
  });
}

export function updateAssessment(data: AssessmentSaveRequest & { id: number }) {
  return request({
    url: `${assessmentBaseUrl}/update`,
    method: "POST",
    data,
  });
}

export function deleteAssessment(data: DeleteIdsRequest) {
  return request({
    url: `${assessmentBaseUrl}/delete`,
    method: "POST",
    data,
  });
}

export function submitAssessment(data: AssessmentActionRequest) {
  return request({
    url: `${assessmentBaseUrl}/submit`,
    method: "POST",
    data,
  });
}

export function approveAssessment(data: AssessmentReviewRequest) {
  return request({
    url: `${assessmentBaseUrl}/approve`,
    method: "POST",
    data,
  });
}

export function rejectAssessment(data: AssessmentReviewRequest) {
  return request({
    url: `${assessmentBaseUrl}/reject`,
    method: "POST",
    data,
  });
}

export function exportAssessment(data: AssessmentExportQuery) {
  return request({
    url: `${assessmentBaseUrl}/export`,
    method: "POST",
    data,
  });
}
