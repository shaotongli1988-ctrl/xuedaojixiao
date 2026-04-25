/**
 * 文件职责：封装 cool-uni 对工作计划移动页的列表、详情和执行动作访问；
 * 不负责部门/人员选项装载、钉钉同步或页面级状态机编排；
 * 维护重点是动作名和权限键必须与 workPlan 资源既有契约保持一致。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	WorkPlanCancelRequest,
	WorkPlanCompleteRequest,
	WorkPlanFetchInfoQuery,
	WorkPlanPageQuery,
	WorkPlanPageResult,
	WorkPlanRecord,
	WorkPlanStartRequest,
} from "/@/types/performance-work-plan";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceWorkPlanService {
	private requester = createServiceRequester("admin/performance/workPlan");

	permission = {
		page: PERMISSIONS.performance.workPlan.page,
		info: PERMISSIONS.performance.workPlan.info,
		start: PERMISSIONS.performance.workPlan.start,
		complete: PERMISSIONS.performance.workPlan.complete,
		cancel: PERMISSIONS.performance.workPlan.cancel,
	};

	fetchPage(data: WorkPlanPageQuery) {
		return this.requester.request({
			url: "/page",
			method: "POST",
			data,
		}) as Promise<WorkPlanPageResult>;
	}

	fetchInfo(params: WorkPlanFetchInfoQuery) {
		return this.requester.request({
			url: "/info",
			method: "GET",
			params,
		}) as Promise<WorkPlanRecord>;
	}

	start(data: WorkPlanStartRequest) {
		return this.requester.request({
			url: "/start",
			method: "POST",
			data,
		}) as Promise<WorkPlanRecord>;
	}

	complete(data: WorkPlanCompleteRequest) {
		return this.requester.request({
			url: "/complete",
			method: "POST",
			data,
		}) as Promise<WorkPlanRecord>;
	}

	cancel(data: WorkPlanCancelRequest) {
		return this.requester.request({
			url: "/cancel",
			method: "POST",
			data,
		}) as Promise<WorkPlanRecord>;
	}
}

export const performanceWorkPlanService = new PerformanceWorkPlanService();
