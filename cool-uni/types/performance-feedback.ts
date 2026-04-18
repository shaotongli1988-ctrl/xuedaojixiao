/**
 * cool-uni 360 环评模块类型与纯前端规则。
 * 这里只定义任务、反馈和汇总页复用结构，不处理请求发送、角色判定或脱敏裁剪。
 */
export type FeedbackTaskStatus = "draft" | "running" | "closed";
export type FeedbackRecordStatus = "draft" | "submitted";

export interface FeedbackRecord {
	id?: number;
	feedbackUserId?: number;
	feedbackUserName?: string;
	relationType: string;
	score?: number;
	content?: string;
	status?: FeedbackRecordStatus | string;
	submitTime?: string;
}

export interface FeedbackTaskRecord {
	id?: number;
	assessmentId?: number | null;
	employeeId: number | undefined;
	employeeName?: string;
	departmentId?: number;
	departmentName?: string;
	title: string;
	deadline?: string;
	status?: FeedbackTaskStatus | string;
	submittedCount?: number;
	totalCount?: number;
	averageScore?: number;
	currentUserRecordStatus?: string;
	currentUserRelationType?: string;
	currentUserSubmitTime?: string;
	currentUserRecord?: {
		id: number;
		status?: string;
		relationType?: string;
		submitTime?: string;
	} | null;
	feedbackUsers?: FeedbackRecord[];
	createTime?: string;
	updateTime?: string;
}

export interface FeedbackSummary {
	taskId: number;
	averageScore: number;
	submittedCount: number;
	totalCount: number;
	records: FeedbackRecord[];
}

export interface FeedbackPageResult {
	list: FeedbackTaskRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export function feedbackStatusLabel(status?: string) {
	switch (status) {
		case "draft":
			return "草稿";
		case "running":
			return "进行中";
		case "closed":
			return "已关闭";
		case "submitted":
			return "已提交";
		default:
			return "未知";
	}
}

export function feedbackStatusTone(status?: string) {
	switch (status) {
		case "draft":
			return "info";
		case "running":
			return "warning";
		case "closed":
			return "success";
		case "submitted":
			return "success";
		default:
			return "info";
	}
}

export function canFeedbackSubmit(task?: FeedbackTaskRecord) {
	return (
		!!task?.id &&
		!["submitted", "closed"].includes(String(task.currentUserRecordStatus || "")) &&
		String(task.status || "") !== "closed"
	);
}
