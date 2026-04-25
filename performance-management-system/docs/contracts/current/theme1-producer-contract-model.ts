/**
 * 主题1开发前评审的 producer 契约快照。
 * 这里只固化评估单主链、动作请求与导出摘要字段，不负责目标、建议、PIP、晋升或自动审批流资源扩展。
 * 维护重点是 page/info/add/update/delete/submit/approve/reject/export 九个接口、draft/submitted/approved/rejected 状态机和评分摘要字段必须与模块1冻结范围一致。
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
