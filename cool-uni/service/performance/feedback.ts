/**
 * 文件职责：封装 cool-uni 对 360 环评任务、详情、提交和汇总接口的复用访问；不负责页面状态编排、角色判断或本地脱敏补算；依赖现有 admin/performance/feedback 接口；维护重点是所有任务范围、提交校验和汇总裁剪都以服务端返回为准。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import { PERMISSIONS } from "/@/generated/permissions.generated";
import type {
	FeedbackFetchInfoQuery,
	FeedbackFetchPagePayload,
	FeedbackPageResult,
	FeedbackSubmitPayload,
	FeedbackSummary,
	FeedbackSummaryQuery,
	FeedbackTaskRecord,
} from "/@/types/performance-feedback";

export default class PerformanceFeedbackService {
	private requester = createServiceRequester("admin/performance/feedback");

	permission = {
		page: PERMISSIONS.performance.feedback.page,
		info: PERMISSIONS.performance.feedback.info,
		submit: PERMISSIONS.performance.feedback.submit,
		summary: PERMISSIONS.performance.feedback.summary,
	};

	constructor() {
		this.requester = createServiceRequester("admin/performance/feedback");
	}

	fetchPage(data: FeedbackFetchPagePayload) {
		return this.requester.request({
			url: "/page",
			method: "POST",
			data,
		}) as Promise<FeedbackPageResult>;
	}

	fetchInfo(params: FeedbackFetchInfoQuery) {
		return this.requester.request({
			url: "/info",
			method: "GET",
			params,
		}) as Promise<FeedbackTaskRecord>;
	}

	submitFeedback(data: FeedbackSubmitPayload) {
		return this.requester.request({
			url: "/submit",
			method: "POST",
			data,
		}) as Promise<FeedbackSummary>;
	}

	fetchSummary(params: FeedbackSummaryQuery) {
		return this.requester.request({
			url: "/summary",
			method: "GET",
			params,
		}) as Promise<FeedbackSummary>;
	}
}

export const performanceFeedbackService = new PerformanceFeedbackService();
