/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance interview.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface InterviewSaveRequest {
	id?: number;
	candidateName: string;
	position: string;
	departmentId?: number;
	interviewerId: number;
	interviewDate: string;
	interviewType?: InterviewType;
	score?: number;
	resumePoolId?: number;
	recruitPlanId?: number;
	sourceSnapshot?: InterviewSourceSnapshot;
	status?: InterviewStatus;
}

export type InterviewType = "manager" | "hr" | "technical" | "behavioral";

export interface InterviewSourceSnapshot {
	sourceResource?: InterviewSourceResource;
	talentAssetId?: number;
	jobStandardId?: number;
	jobStandardPositionName?: string;
	jobStandardRequirementSummary?: string;
	recruitPlanId?: number;
	recruitPlanTitle?: string;
	recruitPlanStatus?: RecruitPlanStatus;
	resumePoolId?: number;
	interviewId?: number;
	candidateName?: string;
	targetDepartmentId?: number;
	targetDepartmentName?: string;
	targetPosition?: string;
	interviewStatus?: InterviewStatus;
	sourceStatusSnapshot?: string;
}

export type InterviewSourceResource = "resumePool" | "talentAsset" | "interview" | "jobStandard" | "recruitPlan";

export type RecruitPlanStatus = "draft" | "closed" | "active" | "voided";

export type InterviewStatus = "cancelled" | "completed" | "scheduled";

export interface ApiResponse_InterviewRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  createTime?: string;
  updateTime?: string;
  position: string;
  candidateName: string;
  interviewerName?: string;
  interviewDate: string;
} & {
  departmentId?: number;
  interviewerId: number;
  interviewType?: InterviewType;
  score?: number;
  resumePoolId?: number;
  recruitPlanId?: number;
  sourceSnapshot?: RecruitmentSourceSnapshot;
  resumePoolSummary?: RecruitmentSourceSnapshot;
  resumePoolSnapshot?: RecruitmentSourceSnapshot;
  recruitPlanSummary?: RecruitmentSourceSnapshot;
  recruitPlanSnapshot?: RecruitmentSourceSnapshot;
  status?: InterviewStatus;
};
}

export interface RecruitmentSourceSnapshot {
	id?: number;
	title?: string;
	status?: string;
	positionName?: string;
	sourceResource?: RecruitmentSourceResource;
	jobStandardId?: number;
	jobStandardPositionName?: string;
	jobStandardRequirementSummary?: string;
	talentAssetId?: number;
	recruitPlanId?: number;
	recruitPlanTitle?: string;
	recruitPlanStatus?: RecruitPlanStatus;
	resumePoolId?: number;
	interviewId?: number;
	candidateName?: string;
	targetDepartmentId?: number;
	targetDepartmentName?: string;
	targetPosition?: string;
	interviewStatus?: InterviewStatus;
	sourceStatusSnapshot?: string;
}

export type RecruitmentSourceResource = "resumePool" | "talentAsset" | "interview" | "jobStandard" | "recruitPlan";

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_InterviewRemoveInterviewResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface InterviewInfoQuery {
	id: number;
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
	data: {
  pagination: PagePagination;
} & {
  list: Array<InterviewRecord>;
};
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

export type InterviewRecord = {
  id?: number;
  createTime?: string;
  updateTime?: string;
  position: string;
  candidateName: string;
  interviewerName?: string;
  interviewDate: string;
} & {
  departmentId?: number;
  interviewerId: number;
  interviewType?: InterviewType;
  score?: number;
  resumePoolId?: number;
  recruitPlanId?: number;
  sourceSnapshot?: RecruitmentSourceSnapshot;
  resumePoolSummary?: RecruitmentSourceSnapshot;
  resumePoolSnapshot?: RecruitmentSourceSnapshot;
  recruitPlanSummary?: RecruitmentSourceSnapshot;
  recruitPlanSnapshot?: RecruitmentSourceSnapshot;
  status?: InterviewStatus;
};

export type InterviewUpdateInterviewRequest = InterviewSaveRequest & {
  id: number;
};
