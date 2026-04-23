/**
 * 文件职责：统一 cool-uni 对 performance access context 的角色展示解析；
 * 不负责权限判断、路由裁剪或后端 access context 请求；
 * 维护重点：移动端不能只靠 roleKind 丢失 persona 语义，必须优先消费后端 activePersonaKey。
 */
export type MobilePerformanceRoleKind =
	| "employee"
	| "manager"
	| "hr"
	| "readonly"
	| "unsupported";

type MobilePerformanceRoleFactInput = {
	activePersonaKey?: string | null;
	roleKind?: MobilePerformanceRoleKind | null;
};

export type MobilePerformanceRoleFact = {
	roleLabel: string;
	scopeLabel: string;
};

export function resolveMobilePerformanceRoleFact(
	input: MobilePerformanceRoleFactInput = {}
): MobilePerformanceRoleFact {
	switch (input.activePersonaKey) {
		case "org.hrbp":
			return {
				roleLabel: "HRBP 视角",
				scopeLabel: "HRBP 组织视角",
			};
		case "fn.performance_operator":
			return {
				roleLabel: "绩效运营视角",
				scopeLabel: "运营全量视角",
			};
		case "org.line_manager":
			return {
				roleLabel: "主管视角",
				scopeLabel: "主管范围视角",
			};
		case "fn.analysis_viewer":
			return {
				roleLabel: "分析视角",
				scopeLabel: "分析只读视角",
			};
		case "org.employee":
			return {
				roleLabel: "员工视角",
				scopeLabel: "员工本人视角",
			};
		default:
			break;
	}

	switch (input.roleKind) {
		case "hr":
			return {
				roleLabel: "HR / 运营视角",
				scopeLabel: "HR 全量视角",
			};
		case "manager":
			return {
				roleLabel: "主管 / 负责人视角",
				scopeLabel: "主管范围视角",
			};
		case "readonly":
			return {
				roleLabel: "只读视角",
				scopeLabel: "只读视角",
			};
		case "employee":
			return {
				roleLabel: "员工视角",
				scopeLabel: "员工本人视角",
			};
		default:
			return {
				roleLabel: "未开放视角",
				scopeLabel: "未开放视角",
			};
	}
}
