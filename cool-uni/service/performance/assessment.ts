/**
 * 文件职责：封装 cool-uni 对评估单列表、详情、自评编辑和审批动作的复用访问；不负责页面权限显隐或状态文案；依赖现有 admin/performance/assessment 接口；维护重点是只复用既有 page/info/update/submit/approve/reject 契约，不新增移动端接口。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import { PERMISSIONS } from "/@/generated/permissions.generated";
import type {
	AssessmentInfoQuery,
	AssessmentPageQuery,
	AssessmentPageResult,
	AssessmentRecord,
	AssessmentReviewRequest,
	AssessmentSubmitRequest,
	AssessmentUpdatePayload,
} from "/@/types/performance-assessment";

export default class PerformanceAssessmentService {
	private requester = createServiceRequester("admin/performance/assessment");

	permission = {
		myPage: PERMISSIONS.performance.assessment.myPage,
		pendingPage: PERMISSIONS.performance.assessment.pendingPage,
		info: PERMISSIONS.performance.assessment.info,
		update: PERMISSIONS.performance.assessment.update,
		submit: PERMISSIONS.performance.assessment.submit,
		approve: PERMISSIONS.performance.assessment.approve,
		reject: PERMISSIONS.performance.assessment.reject,
	};

	constructor() {
		this.requester = createServiceRequester("admin/performance/assessment");
	}

	fetchPage(data: AssessmentPageQuery) {
		return this.requester.page(data) as Promise<AssessmentPageResult>;
	}

	fetchInfo(params: AssessmentInfoQuery) {
		return this.requester.info(params) as Promise<AssessmentRecord>;
	}

	updateAssessment(data: AssessmentUpdatePayload) {
		return this.requester.update(data) as Promise<AssessmentRecord>;
	}

	submit(data: AssessmentSubmitRequest) {
		return this.requester.request({
			url: "/submit",
			method: "POST",
			data,
		}) as Promise<AssessmentRecord>;
	}

	approve(data: AssessmentReviewRequest) {
		return this.requester.request({
			url: "/approve",
			method: "POST",
			data,
		}) as Promise<AssessmentRecord>;
	}

	reject(data: AssessmentReviewRequest) {
		return this.requester.request({
			url: "/reject",
			method: "POST",
			data,
		}) as Promise<AssessmentRecord>;
	}
}

export const performanceAssessmentService = new PerformanceAssessmentService();
