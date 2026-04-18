/**
 * cool-uni 目标模块类型与纯前端规则。
 * 这里只定义 goal 页面复用的数据结构和状态判断，不处理请求发送或页面路由。
 */
export type GoalStatus = "draft" | "in-progress" | "completed" | "cancelled";

export interface GoalProgressRecord {
	id?: number;
	goalId?: number;
	beforeValue: number;
	afterValue: number;
	progressRate: number;
	remark?: string;
	operatorId?: number;
	operatorName?: string;
	createTime?: string;
}

export interface GoalRecord {
	id?: number;
	employeeId: number | undefined;
	employeeName?: string;
	departmentId: number | undefined;
	departmentName?: string;
	title: string;
	description: string;
	targetValue: number;
	currentValue: number;
	unit: string;
	weight: number;
	startDate: string;
	endDate: string;
	progressRate?: number;
	status?: GoalStatus | string;
	createTime?: string;
	updateTime?: string;
	progressRecords?: GoalProgressRecord[];
}

export interface GoalPageResult {
	list: GoalRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface GoalPageQuery {
	page: number;
	size: number;
	keyword?: string;
	status?: string;
}

export interface GoalUpdatePayload {
	id: number;
	title: string;
	description: string;
	targetValue: number;
	unit: string;
	weight: number;
	startDate: string;
	endDate: string;
}

export interface GoalProgressPayload {
	id: number;
	currentValue: number;
	remark?: string;
}

export const goalStatusOptions = [
	{ label: "全部", value: "" },
	{ label: "草稿", value: "draft" },
	{ label: "进行中", value: "in-progress" },
	{ label: "已完成", value: "completed" },
];

export function goalStatusLabel(status?: string) {
	switch (status) {
		case "draft":
			return "草稿";
		case "in-progress":
			return "进行中";
		case "completed":
			return "已完成";
		case "cancelled":
			return "已取消";
		default:
			return "未知";
	}
}

export function goalStatusTone(status?: string) {
	switch (status) {
		case "draft":
			return "info";
		case "in-progress":
			return "warning";
		case "completed":
			return "success";
		case "cancelled":
			return "error";
		default:
			return "info";
	}
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

