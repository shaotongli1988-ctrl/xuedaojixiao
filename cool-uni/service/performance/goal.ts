/**
 * 文件职责：封装 cool-uni 对目标列表、详情、编辑和进度更新接口的复用访问；不负责页面级权限显隐或状态机判断；依赖现有 admin/performance/goal 接口；维护重点是只复用 page/info/update/progressUpdate 既有契约。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	GoalInfoQuery,
	GoalPageQuery,
	GoalPageResult,
	GoalProgressPayload,
	GoalRecord,
	GoalUpdatePayload,
} from "/@/types/performance-goal";

export default class PerformanceGoalService {
	private requester = createServiceRequester("admin/performance/goal");

	constructor() {
		this.requester = createServiceRequester("admin/performance/goal");
	}

	fetchPage(data: GoalPageQuery) {
		return this.requester.page(data) as Promise<GoalPageResult>;
	}

	fetchInfo(params: GoalInfoQuery) {
		return this.requester.info(params) as Promise<GoalRecord>;
	}

	updateGoal(data: GoalUpdatePayload) {
		return this.requester.update(data) as Promise<GoalRecord>;
	}

	progressUpdate(data: GoalProgressPayload) {
		return this.requester.request({
			url: "/progressUpdate",
			method: "POST",
			data,
		}) as Promise<GoalRecord>;
	}
}

export const performanceGoalService = new PerformanceGoalService();
