/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance hiring.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface HiringSaveRequest {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetPosition?: string;
	sourceType?: HiringSourceType;
	sourceId?: number;
	sourceStatusSnapshot?: string;
	sourceSnapshot?: string | HiringSourceSnapshot;
	interviewId?: number;
	resumePoolId?: number;
	recruitPlanId?: number;
	hiringDecision?: string;
	decisionContent?: string;
	status?: HiringStatus;
}

export type HiringSourceType = "manual" | "resumePool" | "talentAsset" | "interview";

export interface HiringSourceSnapshot {
	sourceResource?: HiringSourceType;
	interviewId?: number;
	resumePoolId?: number;
	recruitPlanId?: number;
	recruitPlanTitle?: string;
	candidateName?: string;
	targetDepartmentId?: number;
	targetDepartmentName?: string;
	targetPosition?: string;
	interviewStatus?: InterviewStatus;
	sourceStatusSnapshot?: string;
}

export type InterviewStatus = "cancelled" | "completed" | "scheduled";

export type HiringStatus = "rejected" | "closed" | "offered" | "accepted";

export interface ApiResponse_HiringTransportRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  createTime?: string;
  updateTime?: string;
  candidateName: string;
  targetDepartmentId: number;
} & {
  targetDepartmentName?: string;
  targetPosition?: string;
  sourceType?: HiringSourceType;
  sourceId?: number;
  sourceStatusSnapshot?: string;
  sourceSnapshot?: string | HiringSourceSnapshot;
  interviewId?: number;
  resumePoolId?: number;
  recruitPlanId?: number;
  hiringDecision?: string;
  decisionContent?: string;
  status?: HiringStatus;
  offeredAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  closedAt?: string;
  closeReason?: string;
  interviewSnapshot?: HiringSourceSnapshot;
  resumePoolSnapshot?: HiringSourceSnapshot;
  recruitPlanSnapshot?: HiringSourceSnapshot;
};
}

export interface HiringCloseRequest {
	id: number;
	closeReason: string;
}

export interface HiringInfoQuery {
	id: number;
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
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<HiringTransportRecord>;
};
}

export type HiringTransportRecord = {
  id?: number;
  createTime?: string;
  updateTime?: string;
  candidateName: string;
  targetDepartmentId: number;
} & {
  targetDepartmentName?: string;
  targetPosition?: string;
  sourceType?: HiringSourceType;
  sourceId?: number;
  sourceStatusSnapshot?: string;
  sourceSnapshot?: string | HiringSourceSnapshot;
  interviewId?: number;
  resumePoolId?: number;
  recruitPlanId?: number;
  hiringDecision?: string;
  decisionContent?: string;
  status?: HiringStatus;
  offeredAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  closedAt?: string;
  closeReason?: string;
  interviewSnapshot?: HiringSourceSnapshot;
  resumePoolSnapshot?: HiringSourceSnapshot;
  recruitPlanSnapshot?: HiringSourceSnapshot;
};

export interface HiringStatusUpdateRequest {
	id: number;
	status: HiringUpdateStatus;
}

export type HiringUpdateStatus = "rejected" | "accepted";
