/**
 * 文件职责：封装 cool-uni 对绩效驾驶舱移动页的 summary 汇总读取；
 * 不负责图表适配、部门树筛选或其他绩效子模块请求；
 * 维护重点是只复用 dashboard summary 既有接口，不扩展移动端私有契约。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type { DashboardSummary, DashboardSummaryPayload } from "/@/types/performance-dashboard";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceDashboardService {
	private requester = createServiceRequester("admin/performance/dashboard");

	permission = {
		summary: PERMISSIONS.performance.dashboard.summary,
	};

	fetchSummary(params?: DashboardSummaryPayload) {
		return this.requester.request({
			url: "/summary",
			method: "GET",
			params,
		}) as Promise<DashboardSummary>;
	}
}

export const performanceDashboardService = new PerformanceDashboardService();
