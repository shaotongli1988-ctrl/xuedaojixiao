/**
 * cool-uni 目标模块类型与纯前端规则。
 * 这里只复用 OpenAPI 生成类型并补充页面级纯前端判断，不处理请求发送、页面路由或业务状态展示文案。
 */
import type {
	GoalProgressUpdateRequest,
	GoalRecord,
	GoalUpdateRequest,
} from "/@/generated/performance-goal.generated";

export type {
	GoalCreateRequest,
	GoalExportQuery,
	GoalExportRow,
	GoalExportRows,
	GoalPageQuery,
	GoalPageResult,
	GoalProgressRecord,
	GoalProgressUpdateRequest,
	GoalRecord,
	GoalStatus,
	GoalUpdateRequest,
} from "/@/generated/performance-goal.generated";

export type GoalUpdatePayload = GoalUpdateRequest;
export type GoalProgressPayload = GoalProgressUpdateRequest;

export interface GoalInfoQuery {
	id: number;
}

export function canGoalEdit(goal?: GoalRecord) {
	return !!goal?.id && ["draft", "in-progress"].includes(String(goal.status || ""));
}

export function canGoalProgressUpdate(goal?: GoalRecord) {
	return !!goal?.id && !["completed", "cancelled"].includes(String(goal?.status || ""));
}

export function isPermissionDeniedError(message?: string) {
	return /无权限|无权/.test(String(message || ""));
}

export function isMissingGoalError(message?: string) {
	return /不存在|失效/.test(String(message || ""));
}
