import { PERMISSIONS } from "/@/generated/permissions.generated";
import {
	PERMISSION_BIT_BY_KEY,
	hasAnyPermissionBit,
	hasPermissionBit,
	resolvePermissionMask,
} from "/@/generated/permission-bits.generated";
/**
 * cool-uni 当前移动端页面与权限纯前端规则。
 * 这里只负责页面白名单、路由映射、角色推断和显隐辅助，不负责后端鉴权或页面数据请求。
 */
export type MobileRoleKind = "employee" | "manager" | "readonly" | "hr" | "unsupported";
export type MobileWorkbenchPageId =
	| "my-assessment"
	| "pending-approval"
	| "goal"
	| "feedback"
	| "course-learning"
	| "teacher-todo"
	| "dashboard"
	| "work-plan"
	| "teacher-dashboard"
	| "teacher-list"
	| "teacher-class"
	| "initiated"
	| "course"
	| "meeting"
	| "suggestion"
	| "capability"
	| "certificate"
	| "contract"
	| "job-standard"
	| "indicator-library"
	| "salary"
	| "supplier"
	| "pip"
	| "promotion"
	| "talent-asset"
	| "recruit-plan"
	| "resume-pool";

const PAGE_PERMS = {
	myAssessment: PERMISSIONS.performance.assessment.myPage,
	pendingApproval: PERMISSIONS.performance.assessment.pendingPage,
	goal: PERMISSIONS.performance.goal.page,
	feedback: PERMISSIONS.performance.feedback.page,
	assessmentPage: PERMISSIONS.performance.assessment.page,
	courseRecitePage: PERMISSIONS.performance.courseRecite.page,
	coursePracticePage: PERMISSIONS.performance.coursePractice.page,
	courseExamSummary: PERMISSIONS.performance.courseExam.summary,
	courseReciteInfo: PERMISSIONS.performance.courseRecite.info,
	coursePracticeInfo: PERMISSIONS.performance.coursePractice.info,
	courseReciteSubmit: PERMISSIONS.performance.courseRecite.submit,
	coursePracticeSubmit: PERMISSIONS.performance.coursePractice.submit,
	teacherTodoPage: PERMISSIONS.performance.teacherTodo.page,
	teacherInfoInfo: PERMISSIONS.performance.teacherInfo.info,
	teacherInfoPage: PERMISSIONS.performance.teacherInfo.page,
	teacherFollowPage: PERMISSIONS.performance.teacherFollow.page,
	teacherFollowAdd: PERMISSIONS.performance.teacherFollow.add,
	teacherClassPage: PERMISSIONS.performance.teacherClass.page,
	teacherClassInfo: PERMISSIONS.performance.teacherClass.info,
	teacherDashboardSummary: PERMISSIONS.performance.teacherDashboard.summary,
	dashboardSummary: PERMISSIONS.performance.dashboard.summary,
	workPlanPage: PERMISSIONS.performance.workPlan.page,
	workPlanInfo: PERMISSIONS.performance.workPlan.info,
	workPlanStart: PERMISSIONS.performance.workPlan.start,
	workPlanComplete: PERMISSIONS.performance.workPlan.complete,
	workPlanCancel: PERMISSIONS.performance.workPlan.cancel,
	coursePage: PERMISSIONS.performance.course.page,
	meetingPage: PERMISSIONS.performance.meeting.page,
	meetingCheckIn: PERMISSIONS.performance.meeting.checkIn,
	suggestionPage: PERMISSIONS.performance.suggestion.page,
	suggestionAccept: PERMISSIONS.performance.suggestion.accept,
	suggestionIgnore: PERMISSIONS.performance.suggestion.ignore,
	suggestionReject: PERMISSIONS.performance.suggestion.reject,
	capabilityPage: PERMISSIONS.performance.capabilityModel.page,
	certificatePage: PERMISSIONS.performance.certificate.page,
	contractPage: PERMISSIONS.performance.contract.page,
	jobStandardPage: PERMISSIONS.performance.jobStandard.page,
	indicatorPage: PERMISSIONS.performance.indicator.page,
	salaryPage: PERMISSIONS.performance.salary.page,
	supplierPage: PERMISSIONS.performance.supplier.page,
	pipPage: PERMISSIONS.performance.pip.page,
	promotionPage: PERMISSIONS.performance.promotion.page,
	talentAssetPage: PERMISSIONS.performance.talentAsset.page,
	recruitPlanPage: PERMISSIONS.performance.recruitPlan.page,
	resumePoolPage: PERMISSIONS.performance.resumePool.page,
	hrScope: PERMISSIONS.performance.salary.page,
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
	"course-learning": {
		id: "course-learning" as const,
		title: "课程学习",
		description: "输入课程 ID 后查看本人背诵、练习和考试摘要",
		path: "/pages/performance/course-learning/index",
	},
	"teacher-todo": {
		id: "teacher-todo" as const,
		title: "班主任待办",
		description: "查看 today / overdue 待跟进资源并进入详情跟进",
		path: "/pages/performance/teacher-channel/todo",
	},
	dashboard: {
		id: "dashboard" as const,
		title: "绩效驾驶舱",
		description: "查看绩效均分、待审批和目标完成率聚合摘要",
		path: "/pages/performance/dashboard/index",
	},
	"work-plan": {
		id: "work-plan" as const,
		title: "工作计划",
		description: "查看计划列表并在移动端执行开始、完成、取消动作",
		path: "/pages/performance/work-plan/index",
	},
	"teacher-dashboard": {
		id: "teacher-dashboard" as const,
		title: "班主任看板",
		description: "查看主题19聚合卡片和合作分布摘要",
		path: "/pages/performance/teacher-channel/dashboard",
	},
	"teacher-list": {
		id: "teacher-list" as const,
		title: "班主任资源",
		description: "查看资源列表并进入详情、跟进主链",
		path: "/pages/performance/teacher-channel/teacher",
	},
	"teacher-class": {
		id: "teacher-class" as const,
		title: "合作班级",
		description: "查看合作班级列表与状态摘要",
		path: "/pages/performance/teacher-channel/class",
	},
	initiated: {
		id: "initiated" as const,
		title: "已发起考核",
		description: "查看我发起的考核记录并进入详情",
		path: "/pages/performance/assessment/initiated",
	},
	course: {
		id: "course" as const,
		title: "课程管理",
		description: "查看课程列表、状态和报名摘要",
		path: "/pages/performance/course/index",
	},
	meeting: {
		id: "meeting" as const,
		title: "会议管理",
		description: "查看会议列表并处理进行中会议签到",
		path: "/pages/performance/meeting/index",
	},
	suggestion: {
		id: "suggestion" as const,
		title: "自动建议",
		description: "查看建议列表并在移动端做高频处理动作",
		path: "/pages/performance/suggestion/index",
	},
	capability: {
		id: "capability" as const,
		title: "能力地图",
		description: "查看能力模型列表与摘要字段",
		path: "/pages/performance/capability/index",
	},
	certificate: {
		id: "certificate" as const,
		title: "证书管理",
		description: "查看证书台账和发放数量摘要",
		path: "/pages/performance/certificate/index",
	},
	contract: {
		id: "contract" as const,
		title: "合同管理",
		description: "查看合同台账摘要与状态",
		path: "/pages/performance/contract/index",
	},
	"job-standard": {
		id: "job-standard" as const,
		title: "职位标准",
		description: "查看岗位画像、任职要求和状态摘要",
		path: "/pages/performance/job-standard/index",
	},
	"indicator-library": {
		id: "indicator-library" as const,
		title: "指标库",
		description: "查看指标列表、类型和启停状态",
		path: "/pages/performance/indicator-library/index",
	},
	salary: {
		id: "salary" as const,
		title: "薪资管理",
		description: "查看薪资记录、期间、金额和状态摘要",
		path: "/pages/performance/salary/index",
	},
	supplier: {
		id: "supplier" as const,
		title: "供应商管理",
		description: "查看供应商台账、联系人和启停状态摘要",
		path: "/pages/performance/supplier/index",
	},
	pip: {
		id: "pip" as const,
		title: "PIP 追踪",
		description: "查看 PIP 列表、负责人、时间范围和状态摘要",
		path: "/pages/performance/pip/index",
	},
	promotion: {
		id: "promotion" as const,
		title: "晋升管理",
		description: "查看晋升单、目标岗位和评审状态摘要",
		path: "/pages/performance/promotion/index",
	},
	"talent-asset": {
		id: "talent-asset" as const,
		title: "人才资产",
		description: "查看候选人台账、来源、标签和跟进状态摘要",
		path: "/pages/performance/talent-asset/index",
	},
	"recruit-plan": {
		id: "recruit-plan" as const,
		title: "招聘计划",
		description: "查看招聘计划、岗位、人头和状态摘要",
		path: "/pages/performance/recruit-plan/index",
	},
	"resume-pool": {
		id: "resume-pool" as const,
		title: "简历池",
		description: "查看简历池候选人、来源和状态摘要",
		path: "/pages/performance/resume-pool/index",
	},
};

function hasPermValue(perms: string[], target: string) {
	const permissionBit =
		PERMISSION_BIT_BY_KEY[String(target || "").trim() as keyof typeof PERMISSION_BIT_BY_KEY];

	if (permissionBit === undefined) {
		return false;
	}

	return hasPermissionBit(resolvePermissionMask(perms || []), permissionBit);
}

function hasAnyPerm(perms: string[], targets: string[]) {
	const bits = (targets || [])
		.map(
			(target) =>
				PERMISSION_BIT_BY_KEY[
					String(target || "").trim() as keyof typeof PERMISSION_BIT_BY_KEY
				],
		)
		.filter((bit): bit is bigint => bit !== undefined);

	if (!bits.length) {
		return false;
	}

	return hasAnyPermissionBit(resolvePermissionMask(perms || []), bits);
}

const ROUTE_RULES = [
	{
		prefix: "/pages/index/home",
	},
	{
		prefix: "/pages/performance/assessment/list",
		requiredPerms: [PAGE_PERMS.myAssessment],
	},
	{
		prefix: "/pages/performance/assessment/detail",
		requiredPerms: [PERMISSIONS.performance.assessment.info],
	},
	{
		prefix: "/pages/performance/assessment/edit",
		requiredPerms: [PAGE_PERMS.myAssessment, PERMISSIONS.performance.assessment.update],
	},
	{
		prefix: "/pages/performance/assessment/initiated",
		requiredPerms: [PAGE_PERMS.assessmentPage],
	},
	{
		prefix: "/pages/performance/approval/list",
		requiredPerms: [PAGE_PERMS.pendingApproval],
	},
	{
		prefix: "/pages/performance/goal/list",
		requiredPerms: [PAGE_PERMS.goal],
	},
	{
		prefix: "/pages/performance/goal/detail",
		requiredPerms: [PAGE_PERMS.goal, PERMISSIONS.performance.goal.info],
	},
	{
		prefix: "/pages/performance/goal/edit",
		requiredPerms: [PAGE_PERMS.goal, PERMISSIONS.performance.goal.update],
	},
	{
		prefix: "/pages/performance/goal/progress",
		requiredPerms: [PAGE_PERMS.goal, PERMISSIONS.performance.goal.progressUpdate],
	},
	{
		prefix: "/pages/performance/feedback/list",
		requiredPerms: [PAGE_PERMS.feedback],
	},
	{
		prefix: "/pages/performance/feedback/detail",
		requiredPerms: [PAGE_PERMS.feedback, PERMISSIONS.performance.feedback.info],
	},
	{
		prefix: "/pages/performance/feedback/submit",
		requiredPerms: [PAGE_PERMS.feedback, PERMISSIONS.performance.feedback.submit],
	},
	{
		prefix: "/pages/performance/feedback/summary",
		requiredPerms: [PAGE_PERMS.feedback, PERMISSIONS.performance.feedback.summary],
	},
	{
		prefix: "/pages/performance/course-learning/index",
		requiredAnyPerms: [
			PAGE_PERMS.courseRecitePage,
			PAGE_PERMS.coursePracticePage,
			PAGE_PERMS.courseExamSummary,
		],
	},
	{
		prefix: "/pages/performance/course-learning/detail",
		requiredAnyPerms: [PAGE_PERMS.courseReciteInfo, PAGE_PERMS.coursePracticeInfo],
	},
	{
		prefix: "/pages/performance/course-learning/submit",
		requiredAnyPerms: [PAGE_PERMS.courseReciteSubmit, PAGE_PERMS.coursePracticeSubmit],
	},
	{
		prefix: "/pages/performance/teacher-channel/todo",
		requiredPerms: [PAGE_PERMS.teacherTodoPage],
	},
	{
		prefix: "/pages/performance/teacher-channel/detail",
		requiredPerms: [PAGE_PERMS.teacherInfoInfo, PAGE_PERMS.teacherFollowPage],
	},
	{
		prefix: "/pages/performance/dashboard/index",
		requiredPerms: [PAGE_PERMS.dashboardSummary],
	},
	{
		prefix: "/pages/performance/work-plan/index",
		requiredPerms: [PAGE_PERMS.workPlanPage],
	},
	{
		prefix: "/pages/performance/course/index",
		requiredPerms: [PAGE_PERMS.coursePage],
	},
	{
		prefix: "/pages/performance/meeting/index",
		requiredPerms: [PAGE_PERMS.meetingPage],
	},
	{
		prefix: "/pages/performance/suggestion/index",
		requiredPerms: [PAGE_PERMS.suggestionPage],
	},
	{
		prefix: "/pages/performance/capability/index",
		requiredPerms: [PAGE_PERMS.capabilityPage],
	},
	{
		prefix: "/pages/performance/certificate/index",
		requiredPerms: [PAGE_PERMS.certificatePage],
	},
	{
		prefix: "/pages/performance/contract/index",
		requiredPerms: [PAGE_PERMS.contractPage],
	},
	{
		prefix: "/pages/performance/job-standard/index",
		requiredPerms: [PAGE_PERMS.jobStandardPage],
	},
	{
		prefix: "/pages/performance/indicator-library/index",
		requiredPerms: [PAGE_PERMS.indicatorPage],
	},
	{
		prefix: "/pages/performance/salary/index",
		requiredPerms: [PAGE_PERMS.salaryPage],
	},
	{
		prefix: "/pages/performance/supplier/index",
		requiredPerms: [PAGE_PERMS.supplierPage],
	},
	{
		prefix: "/pages/performance/pip/index",
		requiredPerms: [PAGE_PERMS.pipPage],
	},
	{
		prefix: "/pages/performance/promotion/index",
		requiredPerms: [PAGE_PERMS.promotionPage],
	},
	{
		prefix: "/pages/performance/talent-asset/index",
		requiredPerms: [PAGE_PERMS.talentAssetPage],
	},
	{
		prefix: "/pages/performance/recruit-plan/index",
		requiredPerms: [PAGE_PERMS.recruitPlanPage],
	},
	{
		prefix: "/pages/performance/resume-pool/index",
		requiredPerms: [PAGE_PERMS.resumePoolPage],
	},
	{
		prefix: "/pages/performance/teacher-channel/dashboard",
		requiredPerms: [PAGE_PERMS.teacherDashboardSummary],
	},
	{
		prefix: "/pages/performance/teacher-channel/teacher",
		requiredPerms: [PAGE_PERMS.teacherInfoPage],
	},
	{
		prefix: "/pages/performance/teacher-channel/class",
		requiredPerms: [PAGE_PERMS.teacherClassPage],
	},
];

export function resolveMobileRoleKind(perms: string[]): MobileRoleKind {
	const pages = resolveWorkbenchPages(perms);

	if (pages.includes("indicator-library") || pages.includes("salary")) {
		return "hr";
	}

	if (!pages.length) {
		return "unsupported";
	}

	if (
		pages.includes("pending-approval") ||
		pages.includes("dashboard") ||
		pages.includes("initiated") ||
		pages.includes("course") ||
		pages.includes("meeting") ||
		pages.includes("suggestion") ||
		pages.includes("capability") ||
		pages.includes("certificate") ||
		pages.includes("contract") ||
		pages.includes("job-standard") ||
		pages.includes("supplier") ||
		pages.includes("pip") ||
		pages.includes("promotion") ||
		pages.includes("talent-asset") ||
		pages.includes("recruit-plan") ||
		pages.includes("resume-pool")
	) {
		return "manager";
	}

	if (
		pages.every((pageId) =>
			["teacher-todo", "teacher-dashboard", "teacher-list", "teacher-class"].includes(pageId),
		) &&
		!hasPermValue(perms, PAGE_PERMS.teacherFollowAdd)
	) {
		return "readonly";
	}

	return "employee";
}

export function resolveWorkbenchPages(perms: string[]) {
	const next: MobileWorkbenchPageId[] = [];

	if (hasPermValue(perms, PAGE_PERMS.myAssessment)) {
		next.push("my-assessment");
	}

	if (hasPermValue(perms, PAGE_PERMS.pendingApproval)) {
		next.push("pending-approval");
	}

	if (hasPermValue(perms, PAGE_PERMS.goal)) {
		next.push("goal");
	}

	if (hasPermValue(perms, PAGE_PERMS.feedback)) {
		next.push("feedback");
	}

	if (
		hasAnyPerm(perms, [
			PAGE_PERMS.courseRecitePage,
			PAGE_PERMS.coursePracticePage,
			PAGE_PERMS.courseExamSummary,
		])
	) {
		next.push("course-learning");
	}

	if (hasPermValue(perms, PAGE_PERMS.teacherTodoPage)) {
		next.push("teacher-todo");
	}

	if (hasPermValue(perms, PAGE_PERMS.dashboardSummary)) {
		next.push("dashboard");
	}

	if (hasPermValue(perms, PAGE_PERMS.workPlanPage)) {
		next.push("work-plan");
	}

	if (hasPermValue(perms, PAGE_PERMS.teacherDashboardSummary)) {
		next.push("teacher-dashboard");
	}

	if (hasPermValue(perms, PAGE_PERMS.teacherInfoPage)) {
		next.push("teacher-list");
	}

	if (hasPermValue(perms, PAGE_PERMS.teacherClassPage)) {
		next.push("teacher-class");
	}

	if (hasPermValue(perms, PAGE_PERMS.assessmentPage)) {
		next.push("initiated");
	}

	if (hasPermValue(perms, PAGE_PERMS.coursePage)) {
		next.push("course");
	}

	if (hasPermValue(perms, PAGE_PERMS.meetingPage)) {
		next.push("meeting");
	}

	if (hasPermValue(perms, PAGE_PERMS.suggestionPage)) {
		next.push("suggestion");
	}

	if (hasPermValue(perms, PAGE_PERMS.capabilityPage)) {
		next.push("capability");
	}

	if (hasPermValue(perms, PAGE_PERMS.certificatePage)) {
		next.push("certificate");
	}

	if (hasPermValue(perms, PAGE_PERMS.contractPage)) {
		next.push("contract");
	}

	if (hasPermValue(perms, PAGE_PERMS.jobStandardPage)) {
		next.push("job-standard");
	}

	if (hasPermValue(perms, PAGE_PERMS.indicatorPage)) {
		next.push("indicator-library");
	}

	if (hasPermValue(perms, PAGE_PERMS.salaryPage)) {
		next.push("salary");
	}

	if (hasPermValue(perms, PAGE_PERMS.supplierPage)) {
		next.push("supplier");
	}

	if (hasPermValue(perms, PAGE_PERMS.pipPage)) {
		next.push("pip");
	}

	if (hasPermValue(perms, PAGE_PERMS.promotionPage)) {
		next.push("promotion");
	}

	if (hasPermValue(perms, PAGE_PERMS.talentAssetPage)) {
		next.push("talent-asset");
	}

	if (hasPermValue(perms, PAGE_PERMS.recruitPlanPage)) {
		next.push("recruit-plan");
	}

	if (hasPermValue(perms, PAGE_PERMS.resumePoolPage)) {
		next.push("resume-pool");
	}

	return Array.from(new Set(next));
}

export function isFirstBatchRoute(path: string) {
	return ROUTE_RULES.some((item) => path.startsWith(item.prefix));
}

export function canAccessMobileRoute(path: string, perms: string[]) {
	const match = ROUTE_RULES.find((item) => path.startsWith(item.prefix));

	if (!match) {
		return false;
	}

	if ((match.requiredPerms || []).some((item: string) => !hasPermValue(perms, item))) {
		return false;
	}

	if (match.requiredAnyPerms?.length) {
		return hasAnyPerm(perms, match.requiredAnyPerms);
	}

	return true;
}
