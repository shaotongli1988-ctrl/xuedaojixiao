/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance teacher-info.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface TeacherInfoCreateTeacherInfoRequest {
	id?: number;
	cooperationStatus?: TeacherCooperationStatus;
	teacherName?: string;
	phone?: string;
	wechat?: string;
	schoolName?: string;
	schoolRegion?: string;
	schoolType?: string;
	grade?: string;
	className?: string;
	subject?: string;
	projectTags?: string | Array<string>;
	intentionLevel?: string;
	communicationStyle?: string;
	ownerEmployeeId?: number;
	ownerEmployeeName?: string;
	ownerDepartmentId?: number;
	ownerDepartmentName?: string;
	lastFollowTime?: string;
	nextFollowTime?: string;
	cooperationTime?: string;
	classCount?: number;
	createTime?: string;
	updateTime?: string;
}

export type TeacherCooperationStatus = "uncontacted" | "contacted" | "negotiating" | "partnered" | "terminated";

export interface ApiResponse_TeacherInfoRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  cooperationStatus?: TeacherCooperationStatus;
  teacherName: string;
} & {
  phone?: string;
  wechat?: string;
  schoolName?: string;
  schoolRegion?: string;
  schoolType?: string;
  grade?: string;
  className?: string;
  subject?: string;
  projectTags?: string | Array<string>;
  intentionLevel?: string;
  communicationStyle?: string;
  ownerEmployeeId?: number;
  ownerEmployeeName?: string;
  ownerDepartmentId?: number;
  ownerDepartmentName?: string;
  lastFollowTime?: string;
  nextFollowTime?: string;
  cooperationTime?: string;
  classCount?: number;
  createTime?: string;
  updateTime?: string;
};
}

export interface TeacherInfoAssignRequest {
	id: number;
	ownerEmployeeId: number;
}

export interface ApiResponse_TeacherInfoFetchAttributionHistoryResult {
	code: number;
	message: string;
	data: Array<TeacherAttributionRecord>;
}

export type TeacherAttributionRecord = {
  id?: number;
  status?: TeacherAttributionStatus;
} & {
  teacherId?: number;
  teacherName?: string;
  agentId?: number;
  agentName?: string;
  attributionType?: string;
  sourceType?: string;
  sourceRemark?: string;
  effectiveTime?: string;
  operatorId?: number;
  operatorName?: string;
  createTime?: string;
  updateTime?: string;
};

export type TeacherAttributionStatus = "pending" | "active" | "removed" | "conflicted";

export interface TeacherInfoFetchAttributionHistoryQuery {
	id: number;
}

export interface ApiResponse_TeacherAttributionInfo {
	code: number;
	message: string;
	data: {
  teacherId: number;
  openConflictCount?: number;
} & {
  teacherName?: string;
  currentAttribution?: TeacherAttributionRecord;
  openConflicts?: Array<TeacherAttributionConflictRecord>;
  history?: Array<TeacherAttributionRecord>;
};
}

export type TeacherAttributionConflictRecord = {
  id?: number;
  status?: TeacherAttributionConflictStatus;
  candidateAgentIds?: Array<number>;
} & {
  teacherId?: number;
  teacherName?: string;
  resolution?: string;
  resolutionRemark?: string;
  resolvedBy?: number;
  resolvedTime?: string;
  currentAgentId?: number;
  requestedAgentId?: number;
  requestedById?: number;
  createTime?: string;
  updateTime?: string;
};

export type TeacherAttributionConflictStatus = "cancelled" | "open" | "resolved";

export interface TeacherInfoFetchAttributionInfoQuery {
	id: number;
}

export interface TeacherInfoFetchInfoQuery {
	id: number;
}

export type TeacherInfoPageQuery = TeacherInfoFetchPageRequest & {
  page: number;
  size: number;
  keyword?: string;
  cooperationStatus?: string;
  ownerDepartmentId?: number;
};

export interface TeacherInfoFetchPageRequest {

}

export interface ApiResponse_TeacherInfoPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<TeacherInfoRecord>;
};
}

export type TeacherInfoRecord = {
  id?: number;
  cooperationStatus?: TeacherCooperationStatus;
  teacherName: string;
} & {
  phone?: string;
  wechat?: string;
  schoolName?: string;
  schoolRegion?: string;
  schoolType?: string;
  grade?: string;
  className?: string;
  subject?: string;
  projectTags?: string | Array<string>;
  intentionLevel?: string;
  communicationStyle?: string;
  ownerEmployeeId?: number;
  ownerEmployeeName?: string;
  ownerDepartmentId?: number;
  ownerDepartmentName?: string;
  lastFollowTime?: string;
  nextFollowTime?: string;
  cooperationTime?: string;
  classCount?: number;
  createTime?: string;
  updateTime?: string;
};

export type TeacherInfoUpdatePayload = {
  id?: number;
  cooperationStatus?: TeacherCooperationStatus;
  teacherName?: string;
  phone?: string;
  wechat?: string;
  schoolName?: string;
  schoolRegion?: string;
  schoolType?: string;
  grade?: string;
  className?: string;
  subject?: string;
  projectTags?: string | Array<string>;
  intentionLevel?: string;
  communicationStyle?: string;
  ownerEmployeeId?: number;
  ownerEmployeeName?: string;
  ownerDepartmentId?: number;
  ownerDepartmentName?: string;
  lastFollowTime?: string;
  nextFollowTime?: string;
  cooperationTime?: string;
  classCount?: number;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};

export interface TeacherInfoUpdateStatusRequest {
	id: number;
	status: TeacherCooperationStatus;
}
