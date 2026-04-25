/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance goal.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface GoalCreateRequest {
	employeeId: number;
	departmentId?: number;
	title: string;
	description?: string;
	targetValue: number;
	currentValue?: number;
	unit?: string;
	weight?: number;
	startDate: string;
	endDate: string;
}

export interface ApiResponse_GoalRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  employeeId?: number;
  employeeName?: string;
  departmentId?: number;
  departmentName?: string;
  title?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  weight?: number;
  startDate?: string;
  endDate?: string;
  progressRate?: number;
  status?: GoalStatus;
  createTime?: string;
  updateTime?: string;
  progressRecords?: Array<GoalProgressRecord>;
};
}

export type GoalStatus = "draft" | "cancelled" | "completed" | "in-progress";

export interface GoalProgressRecord {
	id?: number;
	goalId?: number;
	beforeValue?: number;
	afterValue?: number;
	progressRate?: number;
	remark?: string;
	operatorId?: number;
	operatorName?: string;
	createTime?: string;
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_GoalRemoveGoalResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface GoalExportQuery {
	keyword?: string;
	employeeId?: number;
	departmentId?: number;
	status?: GoalStatus;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_GoalExportSummaryResult {
	code: number;
	message: string;
	data: Array<GoalExportRow>;
}

export interface GoalExportRow {
	employeeName: string;
	departmentName: string;
	title: string;
	targetValue: number;
	currentValue: number;
	unit: string;
	weight: number;
	status: GoalStatus;
	startDate: string;
	endDate: string;
	updateTime?: string;
}

export interface GoalInfoQuery {
	id: number;
}

export interface ApiResponse_GoalOpsAccessProfile {
	code: number;
	message: string;
	data: {
  departmentId: number;
  activePersonaKey: string;
  roleKind: "employee" | "manager" | "hr" | "readonly" | "unsupported";
  scopeKey: "department" | "company" | "self";
  isHr: boolean;
  canManageDepartment: boolean;
  canMaintainPersonalPlan: boolean;
  manageableDepartmentIds: Array<number>;
};
}

export interface GoalOpsDepartmentScopeQuery {
	departmentId?: number;
}

export interface GoalOpsDailyFinalizeRequest {
	planDate: string;
	departmentId?: number;
}

export interface ApiResponse_GoalOpsDailyFinalizeResult {
	code: number;
	message: string;
	data: {
  departmentId: number;
  planDate: string;
  autoZeroCount: number;
};
}

export interface GoalOpsDailySubmitRequest {
	planDate: string;
	departmentId?: number;
	items: Array<GoalOpsDailyResultItem>;
}

export interface GoalOpsDailyResultItem {
	planId: number;
	actualValue: number;
}

export interface ApiResponse_GoalOpsOverview {
	code: number;
	message: string;
	data: {
  planDate: string;
  departmentId?: number;
  departmentSummary: GoalOpsDepartmentSummary;
  leaderboard: GoalOpsLeaderboard;
  rows: Array<GoalOpsOverviewRow>;
};
}

export interface GoalOpsDepartmentSummary {
	planDate: string;
	departmentId: number;
	employeeCount: number;
	publicTargetValue: number;
	publicActualValue: number;
	personalTargetValue: number;
	personalActualValue: number;
	totalTargetValue: number;
	totalActualValue: number;
	completionRate: number;
	assignedCount: number;
	submittedCount: number;
	autoZeroCount: number;
}

export interface GoalOpsLeaderboard {
	completionRate: Array<GoalOpsOverviewRow>;
	output: Array<GoalOpsOverviewRow>;
}

export interface GoalOpsOverviewRow {
	employeeId: number;
	employeeName: string;
	departmentId: number;
	publicTargetValue: number;
	publicActualValue: number;
	personalTargetValue: number;
	personalActualValue: number;
	totalTargetValue: number;
	totalActualValue: number;
	completionRate: number;
	assignedCount: number;
	submittedCount: number;
	autoZeroCount: number;
}

export interface ApiResponse_GoalOpsDepartmentConfig {
	code: number;
	message: string;
	data: {
  departmentId?: number;
  departmentName?: string;
  assignTime: string;
  submitDeadline: string;
  reportSendTime: string;
  reportPushMode: string;
} & {
  reportPushTarget?: string;
  updatedBy?: number;
  updateTime?: string;
};
}

export type GoalOpsDepartmentConfig = {
  departmentId?: number;
  departmentName?: string;
  assignTime: string;
  submitDeadline: string;
  reportSendTime: string;
  reportPushMode: string;
} & {
  reportPushTarget?: string;
  updatedBy?: number;
  updateTime?: string;
};

export interface GoalOpsOverviewQuery {
	planDate: string;
	departmentId?: number;
	employeeId?: number;
}

export interface ApiResponse_GoalDeleteOpsPlanResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface ApiResponse_GoalOpsPlanRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  employeeId?: number;
  employeeName?: string;
  departmentId?: number;
  departmentName?: string;
  periodType: GoalOpsPeriodType;
  createTime?: string;
  updateTime?: string;
  title: string;
  periodStartDate: string;
  periodEndDate: string;
  sourceType: GoalOpsSourceType;
  targetValue: number;
  isSystemGenerated?: boolean;
} & {
  planDate?: string;
  description?: string;
  actualValue?: number;
  completionRate?: number;
  unit?: string;
  status?: GoalOpsPlanStatus;
  parentPlanId?: number;
  assignedBy?: number;
  submittedBy?: number;
  submittedAt?: string;
};
}

export type GoalOpsPeriodType = "day" | "week" | "month";

export type GoalOpsSourceType = "public" | "personal";

export type GoalOpsPlanStatus = "submitted" | "assigned" | "auto_zero";

export interface GoalOpsPlanInfoQuery {
	id: number;
}

export interface GoalOpsPlanPageQuery {
	page: number;
	size: number;
	periodType?: GoalOpsPeriodType;
	planDate?: string;
	departmentId?: number;
	employeeId?: number;
	sourceType?: GoalOpsSourceType;
	keyword?: string;
	periodStartDate?: string;
	periodEndDate?: string;
}

export interface ApiResponse_GoalOpsPlanPageResult {
	code: number;
	message: string;
	data: {
  list: Array<GoalOpsPlanRecord>;
  pagination: {
  page: number;
  size: number;
  total: number;
};
};
}

export type GoalOpsPlanRecord = {
  id?: number;
  employeeId?: number;
  employeeName?: string;
  departmentId?: number;
  departmentName?: string;
  periodType: GoalOpsPeriodType;
  createTime?: string;
  updateTime?: string;
  title: string;
  periodStartDate: string;
  periodEndDate: string;
  sourceType: GoalOpsSourceType;
  targetValue: number;
  isSystemGenerated?: boolean;
} & {
  planDate?: string;
  description?: string;
  actualValue?: number;
  completionRate?: number;
  unit?: string;
  status?: GoalOpsPlanStatus;
  parentPlanId?: number;
  assignedBy?: number;
  submittedBy?: number;
  submittedAt?: string;
};

export interface GoalOpsPlanSaveRequest {
	id?: number;
	departmentId?: number;
	employeeId?: number;
	periodType: GoalOpsPeriodType;
	planDate?: string;
	periodStartDate: string;
	periodEndDate: string;
	sourceType: GoalOpsSourceType;
	title: string;
	description?: string;
	targetValue: number;
	unit?: string;
	parentPlanId?: number;
	isSystemGenerated?: boolean;
}

export interface GoalOpsReportGenerateRequest {
	planDate: string;
	departmentId?: number;
}

export interface ApiResponse_GoalOpsReportInfo {
	code: number;
	message: string;
	data: {
  id?: number;
  departmentId: number;
  reportDate: string;
  status: GoalOpsReportStatus;
  summary?: GoalOpsReportSummary;
  generatedAt?: string;
  sentAt?: string;
  pushMode?: string;
  pushTarget?: string;
  generatedBy?: number;
  operatedBy?: number;
  operationRemark?: string;
  createTime?: string;
  updateTime?: string;
};
}

export type GoalOpsReportStatus = "delayed" | "generated" | "sent" | "intercepted";

export interface GoalOpsReportSummary {
	planDate: string;
	departmentId: number;
	departmentSummary: GoalOpsDepartmentSummary;
	topCompletionEmployees: Array<GoalOpsOverviewRow>;
	topOutputEmployees: Array<GoalOpsOverviewRow>;
	autoZeroEmployees: Array<GoalOpsReportAutoZeroEmployee>;
}

export interface GoalOpsReportAutoZeroEmployee {
	employeeId: number;
	employeeName: string;
	autoZeroCount: number;
}

export interface GoalOpsReportQuery {
	reportDate: string;
	departmentId?: number;
}

export interface GoalOpsReportStatusUpdateRequest {
	reportDate: string;
	departmentId?: number;
	status: GoalOpsReportStatus;
	remark?: string;
}

export interface GoalPageQuery {
	page: number;
	size: number;
	keyword?: string;
	employeeId?: number;
	departmentId?: number;
	status?: GoalStatus;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_GoalPageResult {
	code: number;
	message: string;
	data: {
  list: Array<GoalRecord>;
  pagination: {
  page: number;
  size: number;
  total: number;
};
};
}

export interface GoalRecord {
	id?: number;
	employeeId?: number;
	employeeName?: string;
	departmentId?: number;
	departmentName?: string;
	title?: string;
	description?: string;
	targetValue?: number;
	currentValue?: number;
	unit?: string;
	weight?: number;
	startDate?: string;
	endDate?: string;
	progressRate?: number;
	status?: GoalStatus;
	createTime?: string;
	updateTime?: string;
	progressRecords?: Array<GoalProgressRecord>;
}

export interface GoalProgressUpdateRequest {
	id: number;
	currentValue: number;
	remark?: string;
}

export interface GoalUpdateRequest {
	id: number;
	employeeId?: number;
	departmentId?: number;
	title?: string;
	description?: string;
	targetValue?: number;
	currentValue?: number;
	unit?: string;
	weight?: number;
	startDate?: string;
	endDate?: string;
}
