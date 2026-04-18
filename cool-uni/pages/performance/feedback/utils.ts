/**
 * 文件职责：提供环评页面共享的状态文案、来源校验和任务可操作判断；不负责接口请求、页面渲染或权限最终裁决；依赖反馈 service 类型；维护重点是二级页来源丢失时必须回工作台，提交与汇总可见性只做前端守卫而不替代后端校验。
 */
import type { FeedbackTaskRecord } from "/@/service/performance/feedback";

export const FEEDBACK_LIST_PATH = "/pages/performance/feedback/list";
export const FEEDBACK_DETAIL_PATH = "/pages/performance/feedback/detail";
export const FEEDBACK_SUBMIT_PATH = "/pages/performance/feedback/submit";
export const FEEDBACK_SUMMARY_PATH = "/pages/performance/feedback/summary";
export const PERFORMANCE_HOME_PATH = "/pages/index/home";

export const FEEDBACK_RELATION_OPTIONS = ["上级", "同级", "下级", "协作人"];

export function buildFeedbackDetailQuery(id: number) {
	return {
		id,
		source: "list",
	};
}

export function buildFeedbackSubmitQuery(id: number) {
	return {
		id,
		source: "detail",
	};
}

export function buildFeedbackSummaryQuery(id: number) {
	return {
		id,
		source: "detail",
	};
}

export function isRouteSourceValid(source: unknown, expected: string) {
	return String(source || "").trim() === expected;
}

export function isDeadlinePassed(deadline?: string) {
	if (!deadline) {
		return false;
	}

	return new Date(deadline).getTime() < Date.now();
}

export function canSubmitFeedbackTask(task?: Partial<FeedbackTaskRecord> | null) {
	if (!task?.id) {
		return false;
	}

	const hasCurrentRecord = Boolean(
		task.currentUserRecord?.id ||
			task.currentUserRecordStatus ||
			task.currentUserRelationType
	);

	if (!hasCurrentRecord) {
		return false;
	}

	if (String(task.status || "") === "closed") {
		return false;
	}

	if (isDeadlinePassed(task.deadline)) {
		return false;
	}

	const recordStatus =
		task.currentUserRecord?.status || task.currentUserRecordStatus || "draft";

	return String(recordStatus) !== "submitted";
}

export function canViewSummary(task?: Partial<FeedbackTaskRecord> | null) {
	if (!task?.id) {
		return false;
	}

	return String(task.status || "") !== "draft";
}

export function getSubmitDisabledReason(task?: Partial<FeedbackTaskRecord> | null) {
	if (!task?.id) {
		return "任务上下文缺失，请返回列表重试";
	}

	const hasCurrentRecord = Boolean(
		task.currentUserRecord?.id ||
			task.currentUserRecordStatus ||
			task.currentUserRelationType
	);

	if (!hasCurrentRecord) {
		return "当前账号不是该任务的反馈人";
	}

	if (String(task.status || "") === "closed") {
		return "当前环评任务已关闭";
	}

	if (isDeadlinePassed(task.deadline)) {
		return "当前环评任务已超过截止时间";
	}

	const recordStatus =
		task.currentUserRecord?.status || task.currentUserRecordStatus || "draft";

	if (String(recordStatus) === "submitted") {
		return "当前账号已提交过本次反馈";
	}

	return "";
}

export function formatRecordProgress(task?: Partial<FeedbackTaskRecord> | null) {
	return `${Number(task?.submittedCount || 0)} / ${Number(task?.totalCount || 0)}`;
}
