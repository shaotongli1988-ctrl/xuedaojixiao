/**
 * 文件职责：封装 cool-uni 对招聘计划移动页的列表和详情读取；
 * 不负责导入导出、状态动作或职位标准联动；
 * 维护重点是只复用 recruitPlan 既有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	RecruitPlanInfoQuery,
	RecruitPlanPageQuery,
	RecruitPlanPageResult,
	RecruitPlanRecord
} from "/@/types/performance-recruit-plan";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceRecruitPlanService {
	private requester = createServiceRequester("admin/performance/recruitPlan");

	permission = {
		page: PERMISSIONS.performance.recruitPlan.page,
		info: PERMISSIONS.performance.recruitPlan.info,
	};

	fetchPage(data: RecruitPlanPageQuery) {
		return this.requester.page(data) as Promise<RecruitPlanPageResult>;
	}

	fetchInfo(params: RecruitPlanInfoQuery) {
		return this.requester.info(params) as Promise<RecruitPlanRecord>;
	}
}

export const performanceRecruitPlanService = new PerformanceRecruitPlanService();
