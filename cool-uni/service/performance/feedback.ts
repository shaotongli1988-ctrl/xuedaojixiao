/**
 * 文件职责：封装 cool-uni 对 360 环评任务、详情、提交和汇总接口的复用访问；不负责页面状态编排、角色判断或本地脱敏补算；依赖现有 admin/performance/feedback 接口；维护重点是所有任务范围、提交校验和汇总裁剪都以服务端返回为准。
 */
import { createServiceRequester } from "/@/cool/service/requester";

export type FeedbackTaskStatus = "draft" | "running" | "closed";
export type FeedbackRecordStatus = "draft" | "submitted";
export type FeedbackRelationType = "上级" | "同级" | "下级" | "协作人";

export interface FeedbackCurrentUserRecord {
	id: number;
	status: FeedbackRecordStatus | string;
	relationType: FeedbackRelationType | string;
	submitTime?: string;
}

export interface FeedbackUserRecord {
	id: number;
	feedbackUserId: number;
	feedbackUserName?: string;
	relationType: FeedbackRelationType | string;
	status?: FeedbackRecordStatus | string;
	score?: number;
	content?: string;
	submitTime?: string;
}

export interface FeedbackTaskRecord {
	id: number;
	assessmentId?: number | null;
	employeeId: number;
	employeeName?: string;
	departmentId?: number;
	departmentName?: string;
	title: string;
	deadline?: string;
	creatorId?: number;
	creatorName?: string;
	status: FeedbackTaskStatus | string;
	submittedCount?: number;
	totalCount?: number;
	averageScore?: number;
	currentUserRecordStatus?: FeedbackRecordStatus | string;
	currentUserRelationType?: FeedbackRelationType | string;
	currentUserSubmitTime?: string;
	currentUserRecord?: FeedbackCurrentUserRecord | null;
	feedbackUsers?: FeedbackUserRecord[];
	createTime?: string;
	updateTime?: string;
}

export interface FeedbackSummary {
	taskId: number;
	averageScore: number;
	submittedCount: number;
	totalCount: number;
	records: FeedbackUserRecord[];
}

export interface FeedbackPageResult {
	list: FeedbackTaskRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export default class PerformanceFeedbackService {
	private requester = createServiceRequester("admin/performance/feedback");

	permission = {
		page: "performance:feedback:page",
		info: "performance:feedback:info",
		submit: "performance:feedback:submit",
		summary: "performance:feedback:summary",
	};

	constructor() {
		this.requester = createServiceRequester("admin/performance/feedback");
	}

	fetchPage(data: {
		page?: number;
		size?: number;
		keyword?: string;
		status?: string;
		employeeId?: number;
	}) {
		return this.requester.request({
			url: "/page",
			method: "POST",
			data,
		}) as Promise<FeedbackPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return this.requester.request({
			url: "/info",
			method: "GET",
			params,
		}) as Promise<FeedbackTaskRecord>;
	}

	submitFeedback(data: {
		taskId: number;
		score: number;
		content?: string;
		relationType: FeedbackRelationType | string;
	}) {
		return this.requester.request({
			url: "/submit",
			method: "POST",
			data,
		}) as Promise<FeedbackSummary>;
	}

	fetchSummary(params: { id: number }) {
		return this.requester.request({
			url: "/summary",
			method: "GET",
			params,
		}) as Promise<FeedbackSummary>;
	}
}

export const performanceFeedbackService = new PerformanceFeedbackService();
