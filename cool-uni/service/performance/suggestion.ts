/**
 * 文件职责：封装 cool-uni 对自动建议移动页的列表与高频处理动作；
 * 不负责正式 PIP/晋升单据创建或撤销原因复杂表单；
 * 维护重点是动作名和权限键保持与 suggestion 资源既有契约一致。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	SuggestionAcceptRequest,
	SuggestionAcceptResult,
	SuggestionFetchInfoQuery,
	SuggestionFetchPageRequest,
	SuggestionIgnoreRequest,
	SuggestionPageResult,
	SuggestionRecord,
	SuggestionRejectRequest,
} from "/@/types/performance-suggestion";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceSuggestionService {
	private requester = createServiceRequester("admin/performance/suggestion");

	permission = {
		page: PERMISSIONS.performance.suggestion.page,
		info: PERMISSIONS.performance.suggestion.info,
		accept: PERMISSIONS.performance.suggestion.accept,
		ignore: PERMISSIONS.performance.suggestion.ignore,
		reject: PERMISSIONS.performance.suggestion.reject,
	};

	fetchPage(data: SuggestionFetchPageRequest) {
		return this.requester.page(data) as Promise<SuggestionPageResult>;
	}

	fetchInfo(params: SuggestionFetchInfoQuery) {
		return this.requester.info(params) as Promise<SuggestionRecord>;
	}

	accept(data: SuggestionAcceptRequest) {
		return this.requester.request({
			url: "/accept",
			method: "POST",
			data,
		}) as Promise<SuggestionAcceptResult>;
	}

	ignore(data: SuggestionIgnoreRequest) {
		return this.requester.request({
			url: "/ignore",
			method: "POST",
			data,
		}) as Promise<SuggestionRecord>;
	}

	reject(data: SuggestionRejectRequest) {
		return this.requester.request({
			url: "/reject",
			method: "POST",
			data,
		}) as Promise<SuggestionRecord>;
	}
}

export const performanceSuggestionService = new PerformanceSuggestionService();
