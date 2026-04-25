/**
 * cool-uni 目标模块类型与纯前端规则。
 * 这里只复用 OpenAPI 生成类型并补充页面级纯前端判断，不处理请求发送、页面路由或业务状态展示文案。
 */
import type {
	ApiResponse_GoalPageResult,
	GoalProgressUpdateRequest,
	GoalUpdateRequest,
} from "/@/generated/performance-goal.generated";

export type {
	GoalCreateRequest,
	GoalExportQuery,
	GoalExportRow,
	GoalPageQuery,
	GoalProgressUpdateRequest,
	GoalStatus,
	GoalUpdateRequest,
} from "/@/generated/performance-goal.generated";

export interface PagePagination {
	page: number;
	size: number;
	total: number;
}

type GeneratedGoalRecordSource = ApiResponse_GoalPageResult["data"]["list"][number];

export type GoalProgressRecord = GeneratedGoalRecordSource & {
	id?: number;
	goalId?: number;
	beforeValue?: number;
	afterValue?: number;
	progressRate?: number;
	remark?: string;
	operatorId?: number;
	operatorName?: string;
	createTime?: string;
};

export type GoalRecord = GeneratedGoalRecordSource & {
	id?: number;
	employeeId?: number;
	employeeName?: string;
	departmentId?: number;
	departmentName?: string;
	title?: string;
	description?: string | null;
	targetValue?: number;
	currentValue?: number;
	unit?: string | null;
	weight?: number;
	startDate?: string;
	endDate?: string;
	progressRate?: number;
	status?: import("/@/generated/performance-goal.generated").GoalStatus;
	createTime?: string;
	updateTime?: string;
	progressRecords?: GoalProgressRecord[];
};

export type GoalExportRows = import("/@/generated/performance-goal.generated").GoalExportRow[];
export type GoalPageResult = {
	list: GoalRecord[];
	pagination: PagePagination;
};

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
