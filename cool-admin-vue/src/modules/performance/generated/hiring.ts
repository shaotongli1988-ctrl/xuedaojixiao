/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance hiring.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface HiringSaveRequest {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetPosition?: string | null;
	sourceType?: HiringSourceType | null;
	sourceId?: number | null;
	sourceStatusSnapshot?: string | null;
	sourceSnapshot?: HiringSourceSnapshot | string | null;
	interviewId?: number | null;
	resumePoolId?: number | null;
	recruitPlanId?: number | null;
	hiringDecision?: string | null;
	decisionContent?: string | null;
	status?: HiringStatus;
}

export type HiringSourceType = "manual" | "resumePool" | "talentAsset" | "interview";

export interface HiringSourceSnapshot {
	sourceResource?: HiringSourceType | null;
	interviewId?: number | null;
	resumePoolId?: number | null;
	recruitPlanId?: number | null;
	recruitPlanTitle?: string | null;
	candidateName?: string | null;
	targetDepartmentId?: number | null;
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	interviewStatus?: InterviewStatus | null;
	sourceStatusSnapshot?: string | null;
}

export type InterviewStatus = "scheduled" | "completed" | "cancelled";

export type HiringStatus = "offered" | "accepted" | "rejected" | "closed";

export interface ApiResponse_HiringRecord {
	code: number;
	message: string;
	data: HiringRecord;
}

export interface HiringRecord {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	sourceType?: HiringSourceType | null;
	sourceId?: number | null;
	sourceStatusSnapshot?: string | null;
	sourceSnapshot?: HiringSourceSnapshot | string | null;
	interviewId?: number | null;
	resumePoolId?: number | null;
	recruitPlanId?: number | null;
	interviewSummary?: HiringInterviewSummary | null;
	interviewSnapshot?: HiringInterviewSummary | null;
	resumePoolSummary?: HiringResumePoolSummary | null;
	resumePoolSnapshot?: HiringResumePoolSummary | null;
	recruitPlanSummary?: HiringRecruitPlanSummary | null;
	recruitPlanSnapshot?: HiringRecruitPlanSummary | null;
	hiringDecision?: string | null;
	decisionContent?: string | null;
	status: HiringStatus;
	offeredAt?: string | null;
	acceptedAt?: string | null;
	rejectedAt?: string | null;
	closedAt?: string | null;
	closeReason?: string | null;
	createTime?: string;
	updateTime?: string;
}

export interface HiringInterviewSummary {
	id: number;
	candidateName: string;
	position: string;
	departmentId?: number | null;
	interviewDate?: string | null;
	interviewType?: InterviewType | null;
	interviewerId?: number | null;
	interviewerName?: string | null;
	score?: number | null;
	status?: InterviewStatus | null;
	resumePoolId?: number | null;
	recruitPlanId?: number | null;
}

export type InterviewType = "technical" | "behavioral" | "manager" | "hr";

export interface HiringResumePoolSummary {
	id: number;
	candidateName: string;
	targetDepartmentId: number;
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	status?: ResumePoolStatus | null;
	recruitPlanId?: number | null;
	jobStandardId?: number | null;
}

export type ResumePoolStatus = "new" | "screening" | "interviewing" | "archived";

export interface HiringRecruitPlanSummary {
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

export type RecruitPlanStatus = "draft" | "active" | "voided" | "closed";

export interface HiringCloseRequest {
	id: number;
	closeReason: string;
}

export interface HiringPageQuery {
	page: number;
	size: number;
	keyword?: string;
	targetDepartmentId?: number;
	status?: HiringStatus;
	sourceType?: HiringSourceType;
}

export interface ApiResponse_HiringPageResult {
	code: number;
	message: string;
	data: HiringPageResult;
}

export interface HiringPageResult {
	list: Array<HiringRecord>;
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

export interface HiringStatusUpdateRequest {
	id: number;
	status: HiringUpdateStatus;
}

export type HiringUpdateStatus = "accepted" | "rejected";
