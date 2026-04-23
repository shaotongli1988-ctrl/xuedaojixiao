/**
 * cool-uni 360 环评模块类型与前端守卫。
 * 这里只转发 OpenAPI 生成的反馈任务契约，并补充移动端提交条件判断。
 */
import type {
	ApiResponse_FeedbackPageResult,
	ApiResponse_FeedbackSummary,
	FeedbackRecord as GeneratedFeedbackRecord,
	FeedbackTaskRecord as GeneratedFeedbackTaskRecord,
} from "/@/generated/performance-feedback.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	FeedbackExportRow,
	FeedbackFetchInfoQuery,
	FeedbackFetchPageRequest,
	FeedbackFetchSummaryQuery,
	FeedbackRecord,
	FeedbackSubmitFeedbackRequest,
	FeedbackTaskRelationItem,
} from "/@/generated/performance-feedback.generated";

export type FeedbackTaskStateValue = "draft" | "running" | "closed";
export type FeedbackRecordStateValue = "draft" | "submitted";
export type FeedbackRelationType = "上级" | "同级" | "下级" | "协作人";

export interface FeedbackCurrentUserEntry {
	id: number;
	status: FeedbackRecordStateValue | string;
	relationType: FeedbackRelationType | string;
	submitTime?: string;
}

export interface FeedbackUserEntry extends GeneratedFeedbackRecord {
	relationType: FeedbackRelationType | string;
	status?: FeedbackRecordStateValue | string;
}

export type FeedbackTaskRecord = Omit<GeneratedFeedbackTaskRecord, "status"> & {
	departmentId?: number;
	departmentName?: string;
	creatorId?: number;
	creatorName?: string;
	status: FeedbackTaskStateValue | string;
	averageScore?: number;
	currentUserRecordStatus?: FeedbackRecordStateValue | string;
	currentUserRelationType?: FeedbackRelationType | string;
	currentUserSubmitTime?: string;
	currentUserRecord?: FeedbackCurrentUserEntry | null;
	feedbackUsers?: FeedbackUserEntry[];
};

export type FeedbackSummary = Omit<ApiResponseData<ApiResponse_FeedbackSummary>, "records"> & {
	records: FeedbackUserEntry[];
};

export type FeedbackPageResult = Omit<ApiResponseData<ApiResponse_FeedbackPageResult>, "list"> & {
	list: FeedbackTaskRecord[];
};

export interface FeedbackFetchPagePayload {
	page?: number;
	size?: number;
	keyword?: string;
	status?: string;
	employeeId?: number;
}

export type FeedbackSummaryQuery =
	import("/@/generated/performance-feedback.generated").FeedbackFetchSummaryQuery;
export type FeedbackSubmitPayload =
	import("/@/generated/performance-feedback.generated").FeedbackSubmitFeedbackRequest & {
		relationType: FeedbackRelationType | string;
	};

export function canFeedbackSubmit(task?: FeedbackTaskRecord) {
	return (
		!!task?.id &&
		!["submitted", "closed"].includes(String(task.currentUserRecordStatus || "")) &&
		String(task.status || "") !== "closed"
	);
}
