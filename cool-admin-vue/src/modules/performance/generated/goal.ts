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
	data: GoalRecord;
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

export type GoalStatus = "draft" | "in-progress" | "completed" | "cancelled";

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

export interface GoalExportQuery {
	keyword?: string;
	employeeId?: number;
	departmentId?: number;
	status?: GoalStatus;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_GoalExportRows {
	code: number;
	message: string;
	data: GoalExportRows;
}

export type GoalExportRows = Array<GoalExportRow>;

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

export interface ApiResponse_GoalOpsAccessProfile {
	code: number;
	message: string;
	data: GoalOpsAccessProfile;
}

export interface GoalOpsAccessProfile {
	departmentId: number | null;
	isHr: boolean;
	canManageDepartment: boolean;
	canMaintainPersonalPlan: boolean;
	manageableDepartmentIds: Array<number>;
}

export interface GoalOpsDailyFinalizeRequest {
	planDate: string;
	departmentId?: number;
}

export interface ApiResponse_GoalOpsDailyFinalizeResult {
	code: number;
	message: string;
	data: GoalOpsDailyFinalizeResult;
}

export interface GoalOpsDailyFinalizeResult {
	departmentId: number;
	planDate: string;
	autoZeroCount: number;
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
	data: GoalOpsOverview;
}

export interface GoalOpsOverview {
	planDate: string;
	departmentId?: number | null;
	departmentSummary: GoalOpsDepartmentSummary;
	leaderboard: GoalOpsLeaderboard;
	rows: Array<GoalOpsOverviewRow>;
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
	data: GoalOpsDepartmentConfig;
}

export interface GoalOpsDepartmentConfig {
	departmentId?: number;
	departmentName?: string;
	assignTime: string;
	submitDeadline: string;
	reportSendTime: string;
	reportPushMode: string;
	reportPushTarget?: string | null;
	updatedBy?: number | null;
	updateTime?: string | null;
}

export interface GoalOpsOverviewQuery {
	planDate: string;
	departmentId?: number;
	employeeId?: number;
}

export interface ApiResponse_GoalOpsPlanRecord {
	code: number;
	message: string;
	data: GoalOpsPlanRecord;
}

export interface GoalOpsPlanRecord {
	id?: number;
	departmentId?: number;
	departmentName?: string;
	employeeId?: number;
	employeeName?: string;
	periodType: GoalOpsPeriodType;
	planDate?: string | null;
	periodStartDate: string;
	periodEndDate: string;
	sourceType: GoalOpsSourceType;
	title: string;
	description?: string | null;
	targetValue: number;
	actualValue?: number;
	completionRate?: number;
	unit?: string | null;
	status?: GoalOpsPlanStatus;
	parentPlanId?: number | null;
	isSystemGenerated?: boolean;
	assignedBy?: number | null;
	submittedBy?: number | null;
	submittedAt?: string | null;
	createTime?: string;
	updateTime?: string;
}

export type GoalOpsPeriodType = "day" | "week" | "month";

export type GoalOpsSourceType = "public" | "personal";

export type GoalOpsPlanStatus = "assigned" | "submitted" | "auto_zero";

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
	data: GoalOpsPlanPageResult;
}

export interface GoalOpsPlanPageResult {
	list: Array<GoalOpsPlanRecord>;
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

export interface GoalOpsPlanSaveRequest {
	id?: number;
	departmentId?: number;
	employeeId?: number;
	periodType: GoalOpsPeriodType;
	planDate?: string | null;
	periodStartDate: string;
	periodEndDate: string;
	sourceType: GoalOpsSourceType;
	title: string;
	description?: string | null;
	targetValue: number;
	unit?: string | null;
	parentPlanId?: number | null;
	isSystemGenerated?: boolean;
}

export interface GoalOpsReportGenerateRequest {
	planDate: string;
	departmentId?: number;
}

export interface ApiResponse_GoalOpsReportInfo {
	code: number;
	message: string;
	data: GoalOpsReportInfo;
}

export interface GoalOpsReportInfo {
	id?: number;
	departmentId: number;
	reportDate: string;
	status: GoalOpsReportStatus;
	summary: GoalOpsReportSummary | null;
	generatedAt?: string | null;
	sentAt?: string | null;
	pushMode?: string;
	pushTarget?: string | null;
	generatedBy?: number | null;
	operatedBy?: number | null;
	operationRemark?: string | null;
	createTime?: string;
	updateTime?: string;
}

export type GoalOpsReportStatus = "generated" | "sent" | "intercepted" | "delayed";

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
	data: GoalPageResult;
}

export interface GoalPageResult {
	list: Array<GoalRecord>;
	pagination: PagePagination;
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

export interface GoalOpsDepartmentScopeQuery {
	departmentId?: number;
}

export interface GoalOpsReportQuery {
	reportDate: string;
	departmentId?: number;
}
