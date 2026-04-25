/**
 * 主题23开发前评审的 consumer 契约快照。
 * 这里只固化前端消费的目标与目标运营台最小类型及接口路径，作为 schema drift 与 endpoint drift 的消费侧证据。
 * 维护重点是只消费 goal / goal ops 冻结范围内的字段，不把 assessment / feedback / salary 等相邻主题字段混入契约。
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

export interface DeleteIdsRequest {
	ids: Array<number>;
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

export interface GoalProgressUpdateRequest {
	id: number;
	currentValue: number;
	remark?: string;
}

export interface GoalExportQuery {
	keyword?: string;
	employeeId?: number;
	departmentId?: number;
	status?: GoalStatus;
	startDate?: string;
	endDate?: string;
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

export type GoalExportRows = Array<GoalExportRow>;

export interface GoalPageResult {
	list: Array<GoalRecord>;
	pagination: PagePagination;
}

export type GoalOpsPeriodType = "day" | "week" | "month";

export type GoalOpsSourceType = "public" | "personal";

export type GoalOpsPlanStatus = "assigned" | "submitted" | "auto_zero";

export type GoalOpsReportStatus = "generated" | "sent" | "intercepted" | "delayed";

export interface GoalOpsDepartmentScopeQuery {
	departmentId?: number;
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

export interface GoalOpsAccessProfile {
	departmentId: number | null;
	activePersonaKey: string | null;
	roleKind: "employee" | "manager" | "hr" | "readonly" | "unsupported";
	scopeKey: "self" | "department" | "company";
	isHr: boolean;
	canManageDepartment: boolean;
	canMaintainPersonalPlan: boolean;
	manageableDepartmentIds: Array<number>;
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

export interface GoalOpsPlanPageResult {
	list: Array<GoalOpsPlanRecord>;
	pagination: PagePagination;
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

export interface GoalOpsOverview {
	planDate: string;
	departmentId?: number | null;
	departmentSummary: GoalOpsDepartmentSummary;
	leaderboard: GoalOpsLeaderboard;
	rows: Array<GoalOpsOverviewRow>;
}

export interface GoalOpsReportAutoZeroEmployee {
	employeeId: number;
	employeeName: string;
	autoZeroCount: number;
}

export interface GoalOpsReportSummary {
	planDate: string;
	departmentId: number;
	departmentSummary: GoalOpsDepartmentSummary;
	topCompletionEmployees: Array<GoalOpsOverviewRow>;
	topOutputEmployees: Array<GoalOpsOverviewRow>;
	autoZeroEmployees: Array<GoalOpsReportAutoZeroEmployee>;
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

export interface GoalOpsDailyResultItem {
	planId: number;
	actualValue: number;
}

export interface GoalOpsDailySubmitRequest {
	planDate: string;
	departmentId?: number;
	items: Array<GoalOpsDailyResultItem>;
}

export interface GoalOpsDailyFinalizeRequest {
	planDate: string;
	departmentId?: number;
}

export interface GoalOpsDailyFinalizeResult {
	departmentId: number;
	planDate: string;
	autoZeroCount: number;
}

export interface GoalOpsOverviewQuery {
	planDate: string;
	departmentId?: number;
	employeeId?: number;
}

export interface GoalOpsReportQuery {
	reportDate: string;
	departmentId?: number;
}

export interface GoalOpsReportGenerateRequest {
	planDate: string;
	departmentId?: number;
}

export interface GoalOpsReportStatusUpdateRequest {
	reportDate: string;
	departmentId?: number;
	status: GoalOpsReportStatus;
	remark?: string;
}

const goalBaseUrl = "/admin/performance/goal";

declare function request(config: {
  url: string;
  method: "GET" | "POST";
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchGoalPage(data: GoalPageQuery) {
  return request({ url: `${goalBaseUrl}/page`, method: "POST", data });
}

export function fetchGoalInfo(params: { id: number }) {
  return request({ url: `${goalBaseUrl}/info`, method: "GET", params });
}

export function createGoal(data: GoalCreateRequest) {
  return request({ url: `${goalBaseUrl}/add`, method: "POST", data });
}

export function updateGoal(data: GoalUpdateRequest) {
  return request({ url: `${goalBaseUrl}/update`, method: "POST", data });
}

export function deleteGoal(data: DeleteIdsRequest) {
  return request({ url: `${goalBaseUrl}/delete`, method: "POST", data });
}

export function updateGoalProgress(data: GoalProgressUpdateRequest) {
  return request({ url: `${goalBaseUrl}/progressUpdate`, method: "POST", data });
}

export function exportGoalSummary(data: GoalExportQuery) {
  return request({ url: `${goalBaseUrl}/export`, method: "POST", data });
}

export function fetchGoalOpsDepartmentConfig(params?: GoalOpsDepartmentScopeQuery) {
  return request({ url: `${goalBaseUrl}/opsDepartmentConfig`, method: "GET", params });
}

export function fetchGoalOpsAccessProfile(params?: GoalOpsDepartmentScopeQuery) {
  return request({ url: `${goalBaseUrl}/opsAccessProfile`, method: "GET", params });
}

export function saveGoalOpsDepartmentConfig(data: GoalOpsDepartmentConfig) {
  return request({ url: `${goalBaseUrl}/opsDepartmentConfigSave`, method: "POST", data });
}

export function fetchGoalOpsPlanPage(data: GoalOpsPlanPageQuery) {
  return request({ url: `${goalBaseUrl}/opsPlanPage`, method: "POST", data });
}

export function fetchGoalOpsPlanInfo(params: { id: number }) {
  return request({ url: `${goalBaseUrl}/opsPlanInfo`, method: "GET", params });
}

export function saveGoalOpsPlan(data: GoalOpsPlanSaveRequest) {
  return request({ url: `${goalBaseUrl}/opsPlanSave`, method: "POST", data });
}

export function deleteGoalOpsPlan(data: DeleteIdsRequest) {
  return request({ url: `${goalBaseUrl}/opsPlanDelete`, method: "POST", data });
}

export function submitGoalOpsDailyResults(data: GoalOpsDailySubmitRequest) {
  return request({ url: `${goalBaseUrl}/opsDailySubmit`, method: "POST", data });
}

export function finalizeGoalOpsDailyResults(data: GoalOpsDailyFinalizeRequest) {
  return request({ url: `${goalBaseUrl}/opsDailyFinalize`, method: "POST", data });
}

export function fetchGoalOpsOverview(data: GoalOpsOverviewQuery) {
  return request({ url: `${goalBaseUrl}/opsOverview`, method: "POST", data });
}

export function fetchGoalOpsReportInfo(params: GoalOpsReportQuery) {
  return request({ url: `${goalBaseUrl}/opsReportInfo`, method: "GET", params });
}

export function generateGoalOpsReport(data: GoalOpsReportGenerateRequest) {
  return request({ url: `${goalBaseUrl}/opsReportGenerate`, method: "POST", data });
}

export function updateGoalOpsReportStatus(data: GoalOpsReportStatusUpdateRequest) {
  return request({ url: `${goalBaseUrl}/opsReportStatusUpdate`, method: "POST", data });
}
