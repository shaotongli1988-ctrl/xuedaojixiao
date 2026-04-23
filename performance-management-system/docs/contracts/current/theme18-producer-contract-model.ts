/**
 * 主题18开发前评审的 producer 契约快照。
 * 这里只固化录用主链的最小资源、请求、状态动作和引用摘要字段，不负责入职、人事、合同或跨主题自动反写。
 * 维护重点是 page/info/add/updateStatus/close 五个接口、offered/accepted/rejected/closed 状态机和来源摘要边界必须与主题18冻结范围一致。
 */

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

export type HiringStatus = "offered" | "accepted" | "rejected" | "closed";

export type HiringSourceType = "manual" | "resumePool" | "talentAsset" | "interview";

export type HiringUpdateStatus = "accepted" | "rejected";

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

export interface HiringPageQuery {
	page: number;
	size: number;
	keyword?: string;
	targetDepartmentId?: number;
	status?: HiringStatus;
	sourceType?: HiringSourceType;
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

export interface HiringStatusUpdateRequest {
	id: number;
	status: HiringUpdateStatus;
}

export interface HiringCloseRequest {
	id: number;
	closeReason: string;
}

export interface HiringPageResult {
	list: Array<HiringRecord>;
	pagination: PagePagination;
}
