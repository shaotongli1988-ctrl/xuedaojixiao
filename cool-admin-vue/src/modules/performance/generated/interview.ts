/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance interview.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface InterviewSaveRequest {
	id?: number;
	candidateName: string;
	position: string;
	departmentId?: number | null;
	interviewerId: number;
	interviewDate: string;
	interviewType?: InterviewType | null;
	score?: number | null;
	resumePoolId?: number | null;
	recruitPlanId?: number | null;
	sourceSnapshot?: InterviewSourceSnapshot | null;
	status?: InterviewStatus;
}

export type InterviewType = "technical" | "behavioral" | "manager" | "hr";

export interface InterviewSourceSnapshot {
	sourceResource?: InterviewSourceResource | null;
	talentAssetId?: number | null;
	jobStandardId?: number | null;
	jobStandardPositionName?: string | null;
	jobStandardRequirementSummary?: string | null;
	recruitPlanId?: number | null;
	recruitPlanTitle?: string | null;
	recruitPlanStatus?: RecruitPlanStatus | null;
	resumePoolId?: number | null;
	interviewId?: number | null;
	candidateName?: string | null;
	targetDepartmentId?: number | null;
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	interviewStatus?: InterviewStatus | null;
	sourceStatusSnapshot?: string | null;
}

export type InterviewSourceResource = "jobStandard" | "recruitPlan" | "resumePool" | "interview" | "talentAsset";

export type RecruitPlanStatus = "draft" | "active" | "voided" | "closed";

export type InterviewStatus = "scheduled" | "completed" | "cancelled";

export interface ApiResponse_InterviewRecord {
	code: number;
	message: string;
	data: InterviewRecord;
}

export interface InterviewRecord {
	id?: number;
	candidateName: string;
	position: string;
	departmentId?: number | null;
	interviewerId: number;
	interviewerName?: string;
	interviewDate: string;
	interviewType?: InterviewType | null;
	score?: number | null;
	resumePoolId?: number | null;
	recruitPlanId?: number | null;
	sourceSnapshot?: InterviewSourceSnapshot | null;
	resumePoolSummary?: InterviewResumePoolSummary | null;
	resumePoolSnapshot?: InterviewResumePoolSummary | null;
	recruitPlanSummary?: InterviewRecruitPlanSummary | null;
	recruitPlanSnapshot?: InterviewRecruitPlanSummary | null;
	status: InterviewStatus;
	createTime?: string;
	updateTime?: string;
}

export interface InterviewResumePoolSummary {
	id: number;
	candidateName: string;
	targetDepartmentId: number;
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	status: ResumePoolStatus;
	recruitPlanId?: number | null;
	jobStandardId?: number | null;
}

export type ResumePoolStatus = "new" | "screening" | "interviewing" | "archived";

export interface InterviewRecruitPlanSummary {
	id: number;
	title: string;
	positionName?: string | null;
	targetDepartmentId: number;
	targetDepartmentName?: string | null;
	headcount?: number | null;
	startDate?: string | null;
	endDate?: string | null;
	status?: RecruitPlanStatus | null;
	jobStandardId?: number | null;
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface InterviewPageQuery {
	page: number;
	size: number;
	candidateName?: string;
	position?: string;
	status?: InterviewStatus;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_InterviewPageResult {
	code: number;
	message: string;
	data: InterviewPageResult;
}

export interface InterviewPageResult {
	list: Array<InterviewRecord>;
	pagination: PagePagination;
}

export interface PagePagination {
	/**
	 * 页码
	 */
	page: number;
	/**
	 * 页大小
	 */
	size: number;
	/**
	 * 总数
	 */
	total: number;
}
