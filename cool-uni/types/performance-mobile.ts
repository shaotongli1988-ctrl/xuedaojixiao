/**
 * cool-uni 首批移动端页面与权限纯前端规则。
 * 这里只负责首批页面白名单、路由映射、角色推断和显隐辅助，不负责后端鉴权或页面数据请求。
 */
export type MobileRoleKind = "employee" | "manager" | "unsupported";
export type MobileWorkbenchPageId =
	| "my-assessment"
	| "pending-approval"
	| "goal"
	| "feedback";

const PAGE_PERMS = {
	myAssessment: "performance:assessment:myPage",
	pendingApproval: "performance:assessment:pendingPage",
	goal: "performance:goal:page",
	feedback: "performance:feedback:page",
	hrScope: "performance:salary:page",
} as const;

export const MOBILE_PAGE_PERMS = PAGE_PERMS;

export const workbenchCards = {
	"my-assessment": {
		id: "my-assessment" as const,
		title: "我的考核",
		description: "查看本人考核、补充自评并提交",
		path: "/pages/performance/assessment/list",
	},
	"pending-approval": {
		id: "pending-approval" as const,
		title: "待我审批",
		description: "处理本部门树范围内的待审批记录",
		path: "/pages/performance/approval/list",
	},
	goal: {
		id: "goal" as const,
		title: "目标",
		description: "查看目标、编辑目标并更新进度",
		path: "/pages/performance/goal/list",
	},
	feedback: {
		id: "feedback" as const,
		title: "360 环评",
		description: "查看任务、提交反馈和查看汇总",
		path: "/pages/performance/feedback/list",
	},
};

function hasPermValue(perms: string[], target: string) {
	return (perms || []).some((item) => {
		const normalizedItem = String(item || "").replace(/\s/g, "");
		const normalizedTarget = target.replace(/\s/g, "");

		return (
			normalizedItem === normalizedTarget ||
			normalizedItem.includes(normalizedTarget.replace(/:/g, "/"))
		);
	});
}

const ROUTE_RULES = [
	{
		prefix: "/pages/index/home",
		roles: ["employee", "manager", "unsupported"] as MobileRoleKind[],
	},
	{
		prefix: "/pages/performance/assessment/list",
		roles: ["employee"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.myAssessment],
	},
	{
		prefix: "/pages/performance/assessment/detail",
		roles: ["employee", "manager"] as MobileRoleKind[],
		requiredPerms: ["performance:assessment:info"],
	},
	{
		prefix: "/pages/performance/assessment/edit",
		roles: ["employee"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.myAssessment, "performance:assessment:update"],
	},
	{
		prefix: "/pages/performance/approval/list",
		roles: ["manager"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.pendingApproval],
	},
	{
		prefix: "/pages/performance/goal/list",
		roles: ["employee", "manager"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.goal],
	},
	{
		prefix: "/pages/performance/goal/detail",
		roles: ["employee", "manager"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.goal, "performance:goal:info"],
	},
	{
		prefix: "/pages/performance/goal/edit",
		roles: ["employee", "manager"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.goal, "performance:goal:update"],
	},
	{
		prefix: "/pages/performance/goal/progress",
		roles: ["employee", "manager"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.goal, "performance:goal:progressUpdate"],
	},
	{
		prefix: "/pages/performance/feedback/list",
		roles: ["employee", "manager"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.feedback],
	},
	{
		prefix: "/pages/performance/feedback/detail",
		roles: ["employee", "manager"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.feedback, "performance:feedback:info"],
	},
	{
		prefix: "/pages/performance/feedback/submit",
		roles: ["employee", "manager"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.feedback, "performance:feedback:submit"],
	},
	{
		prefix: "/pages/performance/feedback/summary",
		roles: ["employee", "manager"] as MobileRoleKind[],
		requiredPerms: [PAGE_PERMS.feedback, "performance:feedback:summary"],
	},
];

export function resolveMobileRoleKind(perms: string[]): MobileRoleKind {
	if (hasPermValue(perms, PAGE_PERMS.hrScope)) {
		return "unsupported";
	}

	if (hasPermValue(perms, PAGE_PERMS.pendingApproval)) {
		return "manager";
	}

	if (hasPermValue(perms, PAGE_PERMS.myAssessment)) {
		return "employee";
	}

	return "unsupported";
}

export function resolveWorkbenchPages(perms: string[]) {
	const roleKind = resolveMobileRoleKind(perms);
	const next: MobileWorkbenchPageId[] = [];

	if (roleKind === "employee" && hasPermValue(perms, PAGE_PERMS.myAssessment)) {
		next.push("my-assessment");
	}

	if (roleKind === "manager" && hasPermValue(perms, PAGE_PERMS.pendingApproval)) {
		next.push("pending-approval");
	}

	if (roleKind !== "unsupported" && hasPermValue(perms, PAGE_PERMS.goal)) {
		next.push("goal");
	}

	if (roleKind !== "unsupported" && hasPermValue(perms, PAGE_PERMS.feedback)) {
		next.push("feedback");
	}

	return Array.from(new Set(next));
}

export function isFirstBatchRoute(path: string) {
	return ROUTE_RULES.some(item => path.startsWith(item.prefix));
}

export function canAccessMobileRoute(path: string, perms: string[]) {
	const roleKind = resolveMobileRoleKind(perms);
	const match = ROUTE_RULES.find(item => path.startsWith(item.prefix));

	if (!match) {
		return false;
	}

	if (!match.roles.includes(roleKind)) {
		return false;
	}

	return (match.requiredPerms || []).every((item) => hasPermValue(perms, item));
}
