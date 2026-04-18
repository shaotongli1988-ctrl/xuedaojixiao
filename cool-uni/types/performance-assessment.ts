/**
 * cool-uni 评估模块类型与纯前端规则。
 * 这里只定义移动端首批评估页需要的结构、状态文案和按钮条件，不处理请求发送或服务端鉴权。
 */
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

export interface AssessmentRecord {
	id?: number;
	code?: string;
	employeeId: number | undefined;
	employeeName?: string;
	assessorId: number | undefined;
	assessorName?: string;
	departmentId: number | undefined;
	departmentName?: string;
	periodType: string;
	periodValue: string;
	targetCompletion: number;
	totalScore?: number;
	grade?: string;
	selfEvaluation: string;
	managerFeedback?: string;
	status?: AssessmentStatus | string;
	submitTime?: string;
	approveTime?: string;
	createTime?: string;
	updateTime?: string;
	scoreItems: AssessmentScoreItem[];
}

export interface AssessmentPageResult {
	list: AssessmentRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export function assessmentStatusLabel(status?: string) {
	switch (status) {
		case "draft":
			return "草稿";
		case "submitted":
			return "待审批";
		case "approved":
			return "已通过";
		case "rejected":
			return "已驳回";
		default:
			return "未知";
	}
}

export function assessmentStatusTone(status?: string) {
	switch (status) {
		case "draft":
			return "info";
		case "submitted":
			return "warning";
		case "approved":
			return "success";
		case "rejected":
			return "error";
		default:
			return "info";
	}
}

export function canAssessmentEdit(item?: AssessmentRecord) {
	return ["draft", "rejected"].includes(String(item?.status || ""));
}

export function canAssessmentSubmit(item?: AssessmentRecord) {
	return String(item?.status || "") === "draft";
}

export function canAssessmentReview(item?: AssessmentRecord) {
	return String(item?.status || "") === "submitted";
}
