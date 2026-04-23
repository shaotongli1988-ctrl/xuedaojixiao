/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance teacherChannel.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export type TeacherTodoPageQuery = TeacherTodoFetchPageRequest & {
  page: number;
  size: number;
  keyword?: string;
  todoBucket?: string;
};

export interface TeacherTodoFetchPageRequest {

}

export interface ApiResponse_TeacherTodoPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
  bucketSummary?: {
  today?: number;
  overdue?: number;
};
} & {
  list: Array<TeacherTodoRecord>;
};
}

export type TeacherTodoRecord = {
  id?: number;
  cooperationStatus?: TeacherCooperationStatus;
  todoBucket?: TeacherTodoBucket;
} & {
  teacherId?: number;
  teacherName?: string;
  phone?: string;
  wechat?: string;
  schoolName?: string;
  schoolRegion?: string;
  subject?: string;
  ownerEmployeeName?: string;
  lastFollowTime?: string;
  nextFollowTime?: string;
};

export type TeacherCooperationStatus = "uncontacted" | "contacted" | "negotiating" | "partnered" | "terminated";

export type TeacherTodoBucket = "today" | "overdue";

export interface ApiResponse_TeacherDashboardSummary {
	code: number;
	message: string;
	data: Record<string, unknown> & {
  resourceTotal?: number;
  pendingFollowCount?: number;
  overdueFollowCount?: number;
  partneredCount?: number;
  classCount?: number;
  memberDistribution?: Array<TeacherDashboardDistributionItem>;
  cooperationDistribution?: Array<TeacherDashboardDistributionItem>;
  classStatusDistribution?: Array<TeacherDashboardDistributionItem>;
};
}

export type TeacherDashboardDistributionItem = Record<string, unknown> & {
  key?: string;
  label?: string;
  name?: string;
  status?: string;
  value?: number;
  count?: number;
};

export interface TeacherDashboardFetchSummaryQuery {

}

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

export interface TeacherClassCreateTeacherClassRequest {
	id?: number;
	status?: TeacherClassStatus;
	classId?: number;
	className?: string;
	teacherId?: number;
	teacherName?: string;
	schoolName?: string;
	grade?: string;
	projectTag?: string;
	studentCount?: number;
	ownerEmployeeId?: number;
	ownerDepartmentId?: number;
	createTime?: string;
	updateTime?: string;
}

export type TeacherClassStatus = "draft" | "closed" | "active";

export interface ApiResponse_TeacherClassRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  status?: TeacherClassStatus;
  classId?: number;
  className: string;
} & {
  teacherId: number;
  teacherName?: string;
  schoolName?: string;
  grade?: string;
  projectTag?: string;
  studentCount?: number;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
};
}

export interface TeacherClassRemoveTeacherClassRequest {
	ids: Array<number>;
}

export interface ApiResponse_TeacherClassRemoveTeacherClassResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface TeacherClassFetchInfoQuery {
	id: number;
}

export type TeacherClassPageQuery = TeacherClassFetchPageRequest & {
  page: number;
  size: number;
  keyword?: string;
  status?: string;
};

export interface TeacherClassFetchPageRequest {

}

export interface ApiResponse_TeacherClassPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<TeacherClassRecord>;
};
}

export type TeacherClassRecord = {
  id?: number;
  status?: TeacherClassStatus;
  classId?: number;
  className: string;
} & {
  teacherId: number;
  teacherName?: string;
  schoolName?: string;
  grade?: string;
  projectTag?: string;
  studentCount?: number;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
};

export type TeacherClassUpdatePayload = {
  id?: number;
  status?: TeacherClassStatus;
  classId?: number;
  className?: string;
  teacherId?: number;
  teacherName?: string;
  schoolName?: string;
  grade?: string;
  projectTag?: string;
  studentCount?: number;
  ownerEmployeeId?: number;
  ownerDepartmentId?: number;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};

export interface TeacherFollowCreateTeacherFollowRequest {
	id?: number;
	teacherId?: number;
	followTime?: string;
	followMethod?: string;
	content?: string;
	followContent?: string;
	remark?: string;
	nextFollowTime?: string;
	createTime?: string;
	operatorName?: string;
	creatorEmployeeName?: string;
	creatorName?: string;
}

export interface ApiResponse_TeacherFollowRecord {
	code: number;
	message: string;
	data: {
  id?: number;
} & {
  teacherId?: number;
  followTime?: string;
  followMethod?: string;
  content?: string;
  followContent?: string;
  remark?: string;
  nextFollowTime?: string;
  createTime?: string;
  operatorName?: string;
  creatorEmployeeName?: string;
  creatorName?: string;
};
}

export type TeacherFollowPageQuery = TeacherFollowFetchPageRequest & {
  page: number;
  size: number;
  teacherId: number;
};

export interface TeacherFollowFetchPageRequest {

}

export interface ApiResponse_TeacherFollowPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<TeacherFollowRecord>;
};
}

export type TeacherFollowRecord = {
  id?: number;
} & {
  teacherId?: number;
  followTime?: string;
  followMethod?: string;
  content?: string;
  followContent?: string;
  remark?: string;
  nextFollowTime?: string;
  createTime?: string;
  operatorName?: string;
  creatorEmployeeName?: string;
  creatorName?: string;
};
