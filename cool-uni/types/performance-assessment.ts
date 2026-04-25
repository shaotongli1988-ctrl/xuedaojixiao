/**
 * cool-uni 评估模块类型与前端守卫。
 * 这里只转发 OpenAPI 生成的评估领域模型，并补充移动端按钮条件判断。
 */
import type {
	ApiResponse_AssessmentRecord,
	AssessmentActionRequest,
	AssessmentExportQuery,
	AssessmentPageMode,
	AssessmentPageQuery,
	AssessmentReviewRequest,
	AssessmentSaveRequest,
	AssessmentScoreItem,
	AssessmentStatus,
	DeleteIdsRequest,
} from "/@/generated/performance-assessment.generated";

export type {
	AssessmentActionRequest,
	AssessmentExportQuery,
	AssessmentPageMode,
	AssessmentPageQuery,
	AssessmentReviewRequest,
	AssessmentSaveRequest,
	AssessmentScoreItem,
	AssessmentStatus,
	DeleteIdsRequest,
};

export interface PagePagination {
	page: number;
	size: number;
	total: number;
}

export type AssessmentRecord = ApiResponse_AssessmentRecord["data"];
export interface AssessmentExportRow {
	code: string;
	employeeName: string;
	departmentName: string;
	periodType: string;
	periodValue: string;
	assessorName: string;
	status: AssessmentStatus;
	targetCompletion: number;
	totalScore: number;
	grade: string;
	submitTime?: string;
	approveTime?: string;
}
export type AssessmentExportRows = AssessmentExportRow[];
export type AssessmentPageResult = {
	list: AssessmentRecord[];
	pagination: PagePagination;
};

export type AssessmentInfoQuery =
	import("/@/generated/performance-assessment.generated").AssessmentActionRequest;
export type AssessmentSubmitRequest =
	import("/@/generated/performance-assessment.generated").AssessmentActionRequest;
export type AssessmentUpdatePayload =
	import("/@/generated/performance-assessment.generated").AssessmentSaveRequest;

export function canAssessmentEdit(item?: AssessmentRecord) {
	return ["draft", "rejected"].includes(String(item?.status || ""));
}

export function canAssessmentSubmit(item?: AssessmentRecord) {
	return String(item?.status || "") === "draft";
}

export function canAssessmentReview(item?: AssessmentRecord) {
	return String(item?.status || "") === "submitted";
}
