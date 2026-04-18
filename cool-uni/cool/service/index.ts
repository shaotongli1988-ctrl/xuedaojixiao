import { BaseService } from "./base";
import AdminBaseCommService from "/@/service/admin/base/comm";
import AdminBaseOpenService from "/@/service/admin/base/open";
import PerformanceAssessmentService from "/@/service/performance/assessment";
import PerformanceFeedbackService from "/@/service/performance/feedback";
import PerformanceGoalService from "/@/service/performance/goal";

// service 数据集合
export const service: any = {
	request: new BaseService().request,
	admin: {
		base: {
			open: new AdminBaseOpenService(),
			comm: new AdminBaseCommService(),
		},
	},
	performance: {
		assessment: new PerformanceAssessmentService(),
		goal: new PerformanceGoalService(),
		feedback: new PerformanceFeedbackService(),
	},
};

export * from "./base";
