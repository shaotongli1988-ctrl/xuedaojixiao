/**
 * cool-uni 工作计划移动页类型与动作守卫。
 * 这里只转发 OpenAPI 生成的工作计划契约，并保留页面使用的来源状态约束与动作判断。
 */
import type {
	ApiResponse_WorkPlanPageResult,
	WorkPlanRecord,
} from "/@/generated/performance-work-plan.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	WorkPlanAssignee,
	WorkPlanCancelRequest,
	WorkPlanCompleteRequest,
	WorkPlanCreateWorkPlanRequest,
	WorkPlanDeleteWorkPlanRequest,
	WorkPlanFetchInfoQuery,
	WorkPlanFetchPageRequest,
	WorkPlanPriority,
	WorkPlanRecord,
	WorkPlanStartRequest,
	WorkPlanStatus,
	WorkPlanSyncDingtalkApprovalRequest,
	WorkPlanUpdateWorkPlanRequest,
} from "/@/generated/performance-work-plan.generated";

export type WorkPlanPageResult = ApiResponseData<ApiResponse_WorkPlanPageResult>;
export type WorkPlanPageQuery = import("/@/generated/performance-work-plan.generated").WorkPlanFetchPageRequest & {
	page: number;
	size: number;
	keyword?: string;
	status?: string;
	sourceStatus?: string;
};
export type WorkPlanSourceStatus =
	| "none"
	| "processing"
	| "approved"
	| "rejected"
	| "withdrawn"
	| "terminated";

export function canStartWorkPlan(record?: WorkPlanRecord | null) {
	return Boolean(
		record?.id &&
			["draft", "planned"].includes(String(record?.status || "")) &&
			!(
				record?.sourceType === "dingtalkApproval" &&
				record?.sourceStatus &&
				record.sourceStatus !== "approved"
			)
	);
}

export function canCompleteWorkPlan(record?: WorkPlanRecord | null) {
	return Boolean(record?.id && String(record?.status || "") === "inProgress");
}

export function canCancelWorkPlan(record?: WorkPlanRecord | null) {
	return Boolean(record?.id && ["draft", "planned", "inProgress"].includes(String(record?.status || "")));
}
