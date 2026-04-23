/**
 * 绩效模块前端类型。
 * 这里只定义评估单、目标地图等模块内复用结构，不负责接口请求实现。
 */
import type {
	ApiResponse_AssessmentRecord as GeneratedAssessmentRecordResponse,
	AssessmentActionRequest,
	AssessmentExportQuery,
	AssessmentPageMode,
	AssessmentPageQuery,
	AssessmentReviewRequest,
	AssessmentSaveRequest,
	AssessmentScoreItem as GeneratedAssessmentScoreItem,
	AssessmentStatus,
	DeleteIdsRequest
} from './generated/assessment';
import type {
	ApiResponse_GoalOpsPlanRecord as GeneratedGoalOpsPlanRecordResponse,
	GoalCreateRequest,
	GoalExportQuery,
	GoalExportRow,
	GoalOpsDailyFinalizeRequest,
	GoalOpsDailyResultItem,
	GoalOpsDailySubmitRequest,
	GoalOpsDepartmentConfig as GeneratedGoalOpsDepartmentConfig,
	GoalOpsDepartmentScopeQuery,
	GoalOpsOverviewQuery,
	GoalOpsPeriodType,
	GoalOpsPlanPageQuery,
	GoalOpsPlanSaveRequest,
	GoalOpsPlanStatus,
	GoalOpsReportGenerateRequest,
	GoalOpsReportQuery,
	GoalOpsReportStatus,
	GoalOpsReportStatusUpdateRequest,
	GoalOpsSourceType,
	GoalPageQuery,
	GoalProgressUpdateRequest,
	GoalStatus,
	GoalUpdateRequest
} from './generated/goal';
import type {
	ApiResponse_DashboardFetchSummaryResult as GeneratedDashboardSummaryResponse,
	ApiResponse_DashboardCrossSummary as GeneratedDashboardCrossSummaryResponse,
	DashboardCrossDataStatus as GeneratedDashboardCrossDataStatus,
	DashboardCrossMetricCard as GeneratedDashboardCrossMetricCard,
	DashboardCrossMetricCode as GeneratedDashboardCrossMetricCode,
	DashboardCrossScopeType as GeneratedDashboardCrossScopeType,
	DashboardCrossSourceDomain as GeneratedDashboardCrossSourceDomain,
	DashboardDepartmentDistributionItem as GeneratedDashboardDepartmentDistributionItem,
	DashboardGradeDistributionItem as GeneratedDashboardGradeDistributionItem,
	DashboardStageProgressItem as GeneratedDashboardStageProgressItem,
	DashboardSummaryQuery as GeneratedDashboardSummaryQuery,
	DashboardCrossSummaryQuery as GeneratedDashboardCrossSummaryQuery
} from './generated/dashboard';
import type {
	ApiResponse_CapabilityModelPageResult as GeneratedCapabilityModelPageResponse,
	CapabilityModelRecord as GeneratedCapabilityModelRecord,
	CapabilityModelStatus as GeneratedCapabilityModelStatus
} from './generated/capability';
import type {
	CapabilityItemRecord as GeneratedCapabilityItemRecord,
	CapabilityPortraitRecord as GeneratedCapabilityPortraitRecord,
	CertificateLedgerPageResult as GeneratedCertificateLedgerPageResponse,
	CertificateLedgerRecord as GeneratedCertificateLedgerRecord,
	CertificatePageResult as GeneratedCertificatePageResponse,
	CertificateRecord as GeneratedCertificateRecord,
	CertificateRecordStatus as GeneratedCertificateRecordStatus,
	CertificateStatus as GeneratedCertificateStatus
} from './generated/talent-development';
import type {
	ApiResponse_AssetAssignmentPageResult as GeneratedAssetAssignmentPageResponse,
	AssetAssignmentRecord as GeneratedAssetAssignmentRecord,
	AssetAssignmentStatus as GeneratedAssetAssignmentStatus
} from './generated/asset-assignment';
import type {
	ApiResponse_AssetAssignmentRequestPageResult as GeneratedAssetAssignmentRequestPageResponse,
	AssetAssignmentRequestLevel as GeneratedAssetAssignmentRequestLevel,
	AssetAssignmentRequestRecord as GeneratedAssetAssignmentRequestRecord,
	AssetAssignmentRequestStatus as GeneratedAssetAssignmentRequestStatus,
	AssetAssignmentRequestType as GeneratedAssetAssignmentRequestType
} from './generated/asset-assignment-request';
import type {
	ApiResponse_AssetDashboardSummary as GeneratedAssetDashboardSummaryResponse,
	AssetCategoryDistributionItem as GeneratedAssetCategoryDistributionItem,
	AssetDashboardActionSummaryItem as GeneratedAssetDashboardActionSummaryItem,
	AssetDashboardActivityItem as GeneratedAssetDashboardActivityItem,
	AssetStatusDistributionItem as GeneratedAssetStatusDistributionItem
} from './generated/asset-dashboard';
import type {
	ApiResponse_AssetDepreciationPageResult as GeneratedAssetDepreciationPageResponse,
	ApiResponse_AssetDepreciationFetchSummaryResult as GeneratedAssetDepreciationSummaryResponse,
	AssetDepreciationRecord as GeneratedAssetDepreciationRecord
} from './generated/asset-depreciation';
import type {
	ApiResponse_AssetDisposalPageResult as GeneratedAssetDisposalPageResponse,
	AssetDisposalRecord as GeneratedAssetDisposalRecord,
	AssetDisposalStatus as GeneratedAssetDisposalStatus
} from './generated/asset-disposal';
import type {
	ApiResponse_AssetInfoPageResult as GeneratedAssetInfoPageResponse,
	AssetInfoRecord as GeneratedAssetInfoRecord,
	AssetStatus as GeneratedAssetStatus
} from './generated/asset-info';
import type {
	ApiResponse_AssetInventoryPageResult as GeneratedAssetInventoryPageResponse,
	AssetInventoryRecord as GeneratedAssetInventoryRecord,
	AssetInventoryStatus as GeneratedAssetInventoryStatus
} from './generated/asset-inventory';
import type {
	ApiResponse_AssetMaintenancePageResult as GeneratedAssetMaintenancePageResponse,
	AssetMaintenanceRecord as GeneratedAssetMaintenanceRecord,
	AssetMaintenanceStatus as GeneratedAssetMaintenanceStatus
} from './generated/asset-maintenance';
import type {
	ApiResponse_AssetProcurementPageResult as GeneratedAssetProcurementPageResponse,
	AssetProcurementRecord as GeneratedAssetProcurementRecord,
	AssetProcurementStatus as GeneratedAssetProcurementStatus
} from './generated/asset-procurement';
import type {
	ApiResponse_AssetReportPageResult as GeneratedAssetReportPageResponse,
	ApiResponse_AssetReportFetchSummaryResult as GeneratedAssetReportSummaryResponse,
	AssetReportRecord as GeneratedAssetReportRecord
} from './generated/asset-report';
import type {
	ApiResponse_AssetTransferPageResult as GeneratedAssetTransferPageResponse,
	AssetTransferRecord as GeneratedAssetTransferRecord,
	AssetTransferStatus as GeneratedAssetTransferStatus
} from './generated/asset-transfer';
import type {
	ApiResponse_ContractPageResult as GeneratedContractPageResponse,
	ContractRecord as GeneratedContractRecord,
	ContractStatus as GeneratedContractStatus,
	ContractType as GeneratedContractType
} from './generated/contract';
import type {
	ApiResponse_CourseEnrollmentPageResult as GeneratedCourseEnrollmentPageResponse,
	ApiResponse_CoursePageResult as GeneratedCoursePageResponse,
	CourseEnrollmentRecord as GeneratedCourseEnrollmentRecord,
	CourseRecord as GeneratedCourseRecord,
	CourseStatus as GeneratedCourseStatus
} from './generated/course';
import type {
	ApiResponse_DocumentCenterPageResult as GeneratedDocumentCenterPageResponse,
	ApiResponse_DocumentCenterFetchStatsResult as GeneratedDocumentCenterStatsResponse,
	DocumentCenterCategory as GeneratedDocumentCenterCategory,
	DocumentCenterConfidentiality as GeneratedDocumentCenterConfidentiality,
	DocumentCenterFileType as GeneratedDocumentCenterFileType,
	DocumentCenterRecord as GeneratedDocumentCenterRecord,
	DocumentCenterStatus as GeneratedDocumentCenterStatus,
	DocumentCenterStorage as GeneratedDocumentCenterStorage
} from './generated/document-center';
import type {
	ApiResponse_FeedbackPageResult as GeneratedFeedbackPageResponse,
	ApiResponse_FeedbackSummary as GeneratedFeedbackSummaryResponse,
	FeedbackExportRow as GeneratedFeedbackExportRow,
	FeedbackRecord as GeneratedFeedbackRecord,
	FeedbackTaskRecord as GeneratedFeedbackTaskRecord,
	FeedbackTaskRelationItem as GeneratedFeedbackTaskRelationItem
} from './generated/feedback';
import type {
	ApiResponse_HiringPageResult as GeneratedHiringPageResponse,
	HiringSourceType as GeneratedHiringSourceType,
	HiringStatus as GeneratedHiringStatus
} from './generated/hiring';
import type {
	ApiResponse_PipPageResult as GeneratedPipPageResponse,
	PipExportRow as GeneratedPipExportRow,
	PipRecord as GeneratedPipRecord,
	PipTrackRecord as GeneratedPipTrackRecord
} from './generated/pip';
import type {
	ApiResponse_InterviewPageResult as GeneratedInterviewPageResponse,
	InterviewRecord as GeneratedInterviewRecord,
	InterviewStatus as GeneratedInterviewStatus,
	InterviewType as GeneratedInterviewType
} from './generated/interview';
import type {
	ApiResponse_IndicatorPageResult as GeneratedIndicatorPageResponse,
	IndicatorApplyScope as GeneratedIndicatorApplyScope,
	IndicatorCategory as GeneratedIndicatorCategory,
	IndicatorRecord as GeneratedIndicatorRecord,
	IndicatorStatus as GeneratedIndicatorStatus
} from './generated/indicator';
import type {
	ApiResponse_JobStandardPageResult as GeneratedJobStandardPageResponse,
	JobStandardRecord as GeneratedJobStandardRecord,
	JobStandardStatus as GeneratedJobStandardStatus
} from './generated/job-standard';
import type {
	ApiResponse_KnowledgeBaseFetchQaListResult as GeneratedKnowledgeQaListResponse,
	ApiResponse_KnowledgeBasePageResult as GeneratedKnowledgeBasePageResponse,
	ApiResponse_KnowledgeBaseFetchStatsResult as GeneratedKnowledgeBaseStatsResponse,
	ApiResponse_KnowledgeGraphSummary as GeneratedKnowledgeGraphSummaryResponse,
	ApiResponse_KnowledgeSearchResult as GeneratedKnowledgeSearchResultResponse,
	KnowledgeBaseRecord as GeneratedKnowledgeBaseRecord,
	KnowledgeBaseStatus as GeneratedKnowledgeBaseStatus,
	KnowledgeGraphLink as GeneratedKnowledgeGraphLink,
	KnowledgeGraphNode as GeneratedKnowledgeGraphNode,
	KnowledgeQaRecord as GeneratedKnowledgeQaRecord
} from './generated/knowledge-base';
import type {
	ApiResponse_MaterialCatalogPageResult as GeneratedMaterialCatalogPageResponse,
	MaterialCatalogRecord as GeneratedMaterialCatalogRecord,
	MaterialCatalogStatus as GeneratedMaterialCatalogStatus
} from './generated/material-catalog';
import type {
	ApiResponse_MaterialInboundPageResult as GeneratedMaterialInboundPageResponse,
	MaterialInboundRecord as GeneratedMaterialInboundRecord,
	MaterialInboundStatus as GeneratedMaterialInboundStatus
} from './generated/material-inbound';
import type {
	ApiResponse_MaterialIssuePageResult as GeneratedMaterialIssuePageResponse,
	MaterialIssueRecord as GeneratedMaterialIssueRecord,
	MaterialIssueStatus as GeneratedMaterialIssueStatus
} from './generated/material-issue';
import type {
	ApiResponse_MaterialStockPageResult as GeneratedMaterialStockPageResponse,
	MaterialStockRecord as GeneratedMaterialStockRecord,
	MaterialStockStatus as GeneratedMaterialStockStatus
} from './generated/material-stock';
import type {
	ApiResponse_MeetingPageResult as GeneratedMeetingPageResponse,
	MeetingRecord as GeneratedMeetingRecord,
	MeetingStatus as GeneratedMeetingStatus
} from './generated/meeting';
import type {
	ApiResponse_PromotionPageResult as GeneratedPromotionPageResponse,
	PromotionRecord as GeneratedPromotionRecord,
	PromotionReviewRecord as GeneratedPromotionReviewRecord
} from './generated/promotion';
import type {
	ApiResponse_PurchaseOrderPageResult as GeneratedPurchaseOrderPageResponse,
	PurchaseOrderApprovalLog as GeneratedPurchaseOrderApprovalLog,
	PurchaseOrderInquiryRecord as GeneratedPurchaseOrderInquiryRecord,
	PurchaseOrderItemRecord as GeneratedPurchaseOrderItemRecord,
	PurchaseOrderReceiptRecord as GeneratedPurchaseOrderReceiptRecord,
	PurchaseOrderRecord as GeneratedPurchaseOrderRecord,
	PurchaseOrderStatus as GeneratedPurchaseOrderStatus
} from './generated/purchase-order';
import type {
	ApiResponse_PurchaseReportFetchSupplierStatsResult as GeneratedPurchaseReportSupplierStatsResponse,
	ApiResponse_PurchaseReportFetchSummaryResult as GeneratedPurchaseReportSummaryResponse,
	ApiResponse_PurchaseReportFetchTrendResult as GeneratedPurchaseReportTrendResponse,
	PurchaseReportQuery as GeneratedPurchaseReportQuery,
	PurchaseReportSupplierStat as GeneratedPurchaseReportSupplierStat,
	PurchaseReportTrendPoint as GeneratedPurchaseReportTrendPoint
} from './generated/purchase-report';
import type {
	ApiResponse_RecruitPlanPageResult as GeneratedRecruitPlanPageResponse,
	RecruitPlanRecord as GeneratedRecruitPlanRecord,
	RecruitPlanStatus as GeneratedRecruitPlanStatus
} from './generated/recruit-plan';
import type {
	ApiResponse_ResumePoolPageResult as GeneratedResumePoolPageResponse,
	ResumePoolAttachmentSummary as GeneratedResumePoolAttachmentSummary,
	ResumePoolRecord as GeneratedResumePoolRecord,
	ResumePoolSourceType as GeneratedResumePoolSourceType,
	ResumePoolStatus as GeneratedResumePoolStatus
} from './generated/resume-pool';
import type {
	ApiResponse_SalaryPageResult as GeneratedSalaryPageResponse,
	SalaryChangeRecord as GeneratedSalaryChangeRecord,
	SalaryRecord as GeneratedSalaryRecord
} from './generated/salary';
import type {
	ApiResponse_SuggestionAcceptResult as GeneratedSuggestionAcceptResponse,
	ApiResponse_SuggestionPageResult as GeneratedSuggestionPageResponse,
	SuggestionRecord as GeneratedSuggestionRecord,
	SuggestionRevokeReasonCode as GeneratedSuggestionRevokeReasonCode,
	SuggestionStatus as GeneratedSuggestionStatus,
	SuggestionType as GeneratedSuggestionType
} from './generated/suggestion';
import type {
	ApiResponse_SupplierPageResult as GeneratedSupplierPageResponse,
	SupplierRecord as GeneratedSupplierRecord,
	SupplierStatus as GeneratedSupplierStatus
} from './generated/supplier';
import type {
	ApiResponse_TalentAssetPageResult as GeneratedTalentAssetPageResponse,
	TalentAssetRecord as GeneratedTalentAssetRecord,
	TalentAssetStatus as GeneratedTalentAssetStatus
} from './generated/talent-asset';
import type {
	ApiResponse_TeacherAgentAuditPageResult as GeneratedTeacherAgentAuditPageResponse,
	TeacherAgentAuditRecord as GeneratedTeacherAgentAuditRecord
} from './generated/teacher-agent-audit';
import type {
	ApiResponse_TeacherAgentRelationPageResult as GeneratedTeacherAgentRelationPageResponse,
	TeacherAgentRelationRecord as GeneratedTeacherAgentRelationRecord,
	TeacherAgentRelationStatus as GeneratedTeacherAgentRelationStatus
} from './generated/teacher-agent-relation';
import type {
	ApiResponse_TeacherAgentPageResult as GeneratedTeacherAgentPageResponse,
	TeacherAgentBlacklistStatus as GeneratedTeacherAgentBlacklistStatus,
	TeacherAgentRecord as GeneratedTeacherAgentRecord,
	TeacherAgentStatus as GeneratedTeacherAgentStatus
} from './generated/teacher-agent';
import type {
	ApiResponse_TeacherAttributionConflictDetail as GeneratedTeacherAttributionConflictDetailResponse,
	ApiResponse_TeacherAttributionConflictPageResult as GeneratedTeacherAttributionConflictPageResponse,
	TeacherAttributionConflictRecord as GeneratedTeacherAttributionConflictRecord,
	TeacherAttributionConflictStatus as GeneratedTeacherAttributionConflictStatus
} from './generated/teacher-attribution-conflict';
import type {
	ApiResponse_TeacherAttributionPageResult as GeneratedTeacherAttributionPageResponse,
	TeacherAttributionInfo as GeneratedTeacherAttributionInfo,
	TeacherAttributionRecord as GeneratedTeacherAttributionRecord,
	TeacherAttributionStatus as GeneratedTeacherAttributionStatus
} from './generated/teacher-attribution';
import type {
	ApiResponse_TeacherClassPageResult as GeneratedTeacherClassPageResponse,
	TeacherClassRecord as GeneratedTeacherClassRecord,
	TeacherClassStatus as GeneratedTeacherClassStatus
} from './generated/teacher-class';
import type {
	ApiResponse_TeacherDashboardSummary as GeneratedTeacherDashboardSummaryResponse,
	TeacherDashboardDistributionItem as GeneratedTeacherDashboardDistributionItem
} from './generated/teacher-dashboard';
import type {
	ApiResponse_TeacherFollowPageResult as GeneratedTeacherFollowPageResponse,
	TeacherFollowRecord as GeneratedTeacherFollowRecord
} from './generated/teacher-follow';
import type {
	ApiResponse_TeacherInfoPageResult as GeneratedTeacherInfoPageResponse,
	TeacherCooperationStatus as GeneratedTeacherCooperationStatus,
	TeacherInfoRecord as GeneratedTeacherInfoRecord
} from './generated/teacher-info';
import type {
	ApiResponse_TeacherTodoPageResult as GeneratedTeacherTodoPageResponse,
	TeacherTodoBucket as GeneratedTeacherTodoBucket,
	TeacherTodoRecord as GeneratedTeacherTodoRecord
} from './generated/teacher-todo';
import type {
	ApiResponse_WorkPlanPageResult as GeneratedWorkPlanPageResponse,
	WorkPlanAssignee as GeneratedWorkPlanAssignee,
	WorkPlanPriority as GeneratedWorkPlanPriority,
	WorkPlanRecord as GeneratedWorkPlanRecord,
	WorkPlanStatus as GeneratedWorkPlanStatus
} from './generated/work-plan';

export type {
	AssessmentActionRequest,
	AssessmentExportQuery,
	AssessmentPageQuery,
	AssessmentReviewRequest,
	AssessmentSaveRequest,
	AssessmentStatus,
	DeleteIdsRequest
} from './generated/assessment';
export type {
	GoalCreateRequest,
	GoalExportQuery,
	GoalExportRow,
	GoalOpsDailyFinalizeRequest,
	GoalOpsDailyResultItem,
	GoalOpsDailySubmitRequest,
	GoalOpsDepartmentScopeQuery,
	GoalOpsOverviewQuery,
	GoalOpsPeriodType,
	GoalOpsPlanPageQuery,
	GoalOpsPlanSaveRequest,
	GoalOpsPlanStatus,
	GoalOpsReportGenerateRequest,
	GoalOpsReportQuery,
	GoalOpsReportStatus,
	GoalOpsReportStatusUpdateRequest,
	GoalOpsSourceType,
	GoalPageQuery,
	GoalProgressUpdateRequest,
	GoalStatus,
	GoalUpdateRequest
} from './generated/goal';
export interface GoalOpsTrendRow {
	planDate: string;
	publicActualValue: number;
	personalActualValue: number;
	totalActualValue: number;
	totalTargetValue: number;
	completionRate: number;
}
export type { ContractPageQuery, ContractSaveRequest } from './generated/contract';
export type {
	CapabilityModelPageQuery,
	CapabilityModelSaveRequest,
	CertificateIssueRequest,
	CertificatePageQuery,
	CertificateRecordPageQuery
} from './generated/talent-development';
export type {
	HiringCloseRequest,
	HiringPageQuery,
	HiringSaveRequest,
	HiringStatusUpdateRequest,
	HiringUpdateStatus
} from './generated/hiring';
export type { IndicatorPageQuery, IndicatorSaveRequest } from './generated/indicator';
export type { InterviewPageQuery, InterviewSaveRequest } from './generated/interview';
export type {
	JobStandardPageQuery,
	JobStandardSaveRequest,
	JobStandardStatusUpdateRequest
} from './generated/job-standard';
export type {
	MeetingCheckInRequest,
	MeetingPageQuery,
	MeetingSaveRequest
} from './generated/meeting';
export type {
	RecruitPlanActionRequest,
	RecruitPlanExportQuery,
	RecruitPlanImportRequest,
	RecruitPlanPageQuery,
	RecruitPlanSaveRequest
} from './generated/recruit-plan';
export type {
	ResumePoolActionRequest,
	ResumePoolDownloadAttachmentRequest,
	ResumePoolExportQuery,
	ResumePoolImportRequest,
	ResumePoolPageQuery,
	ResumePoolSaveRequest,
	ResumePoolUploadAttachmentRequest
} from './generated/resume-pool';
export type { TalentAssetPageQuery, TalentAssetSaveRequest } from './generated/talent-asset';

export type AssessmentMode = AssessmentPageMode;
export type AssessmentDraft = Omit<AssessmentSaveRequest, 'employeeId' | 'assessorId'> & {
	id?: number;
	employeeId?: number;
	assessorId?: number;
	departmentName?: string;
};
export interface AssessmentInfoQuery {
	id: number;
}
export type GoalDraft = Omit<GoalCreateRequest, 'employeeId'> & {
	employeeId?: number;
	departmentId?: number;
};
export interface GoalInfoQuery {
	id: number;
}
export interface GoalOpsPlanInfoQuery {
	id: number;
}
type ApiResponseData<T extends { data: unknown }> = T['data'];
type StripIndexSignature<T> = {
	[K in keyof T as string extends K
		? never
		: number extends K
			? never
			: symbol extends K
				? never
				: K]: T[K];
};
export interface PerformanceListPageResult<T> {
	list: T[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
	[key: string]: JsonValue | undefined;
}

export type AssessmentScoreItem = Omit<GeneratedAssessmentScoreItem, 'indicatorId'> & {
	indicatorId?: number | null;
};

export type AssessmentRecord = Omit<
	ApiResponseData<GeneratedAssessmentRecordResponse>,
	'scoreItems'
> & {
	scoreItems?: AssessmentScoreItem[];
};

export interface AssessmentExportRow {
	code: string;
	employeeName: string;
	departmentName: string;
	periodType: string;
	periodValue: string;
	assessorName: string;
	status: AssessmentStatus;
	targetCompletion: number;
	totalScore: number;
	grade: string;
	submitTime?: string;
	approveTime?: string;
}

export type AssessmentExportRows = AssessmentExportRow[];
export type AssessmentPageResult = PerformanceListPageResult<AssessmentRecord>;

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
	description?: string | null;
	targetValue?: number;
	currentValue?: number;
	unit?: string | null;
	weight?: number;
	startDate?: string;
	endDate?: string;
	progressRate?: number;
	status?: GoalStatus;
	createTime?: string;
	updateTime?: string;
	progressRecords?: GoalProgressRecord[];
}

export type GoalPageResult = PerformanceListPageResult<GoalRecord>;

export interface GoalOpsAccessProfile {
	departmentId: number | null;
	activePersonaKey: string | null;
	roleKind: PerformanceAccessContext['roleKind'];
	scopeKey: 'company' | 'department' | 'self';
	isHr: boolean;
	canManageDepartment: boolean;
	canMaintainPersonalPlan: boolean;
	manageableDepartmentIds: number[];
}

export type GoalOpsDepartmentConfig = Omit<
	GeneratedGoalOpsDepartmentConfig,
	'reportPushTarget' | 'updatedBy' | 'updateTime'
> & {
	reportPushTarget?: string | null;
	updatedBy?: number | null;
	updateTime?: string | null;
};

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
	completionRate: GoalOpsOverviewRow[];
	output: GoalOpsOverviewRow[];
}

export interface GoalOpsOverview {
	planDate: string;
	departmentId?: number | null;
	departmentSummary: GoalOpsDepartmentSummary;
	leaderboard: GoalOpsLeaderboard;
	rows: GoalOpsOverviewRow[];
}

export type GoalOpsPlanRecord = Omit<
	ApiResponseData<GeneratedGoalOpsPlanRecordResponse>,
	| 'planDate'
	| 'description'
	| 'actualValue'
	| 'completionRate'
	| 'unit'
	| 'status'
	| 'parentPlanId'
	| 'assignedBy'
	| 'submittedBy'
	| 'submittedAt'
> & {
	planDate?: string | null;
	description?: string | null;
	actualValue?: number | null;
	completionRate?: number | null;
	unit?: string | null;
	status?: GoalOpsPlanStatus;
	parentPlanId?: number | null;
	assignedBy?: number | null;
	submittedBy?: number | null;
	submittedAt?: string | null;
};

export type GoalOpsPlanPageResult = PerformanceListPageResult<GoalOpsPlanRecord>;

export interface GoalOpsReportAutoZeroEmployee {
	employeeId: number;
	employeeName: string;
	autoZeroCount: number;
}

export interface GoalOpsReportSummary {
	planDate: string;
	departmentId: number;
	departmentSummary: GoalOpsDepartmentSummary;
	topCompletionEmployees: GoalOpsOverviewRow[];
	topOutputEmployees: GoalOpsOverviewRow[];
	autoZeroEmployees: GoalOpsReportAutoZeroEmployee[];
}

export interface GoalOpsReportInfo {
	id?: number;
	departmentId: number;
	reportDate: string;
	status: GoalOpsReportStatus;
	summary?: GoalOpsReportSummary | null;
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

export interface GoalOpsDailyFinalizeResult {
	departmentId: number;
	planDate: string;
	autoZeroCount: number;
}

export interface RecruitPlanDeleteResult {
	id: number;
	deleted: boolean;
}

export interface RecruitPlanImportResult {
	fileId: number;
	importedCount: number;
	skippedCount: number;
}

export interface ResumePoolImportResult {
	fileId: number;
	importedCount: number;
	overwrittenCount: number;
	skippedCount: number;
}

export interface ResumePoolAttachmentDownloadResult {
	id: number;
	name: string;
	size: number;
	uploadTime: string;
	url: string;
	downloadUrl: string;
	fileId: string;
}

export interface ResumePoolTalentAssetConvertResult {
	talentAssetId: number;
	created: boolean;
}

export interface ResumePoolCreateInterviewResult {
	interviewId: number;
	status: ResumePoolStatus;
	resumePoolId: number;
	recruitPlanId?: number | null;
	jobStandardId?: number | null;
	sourceSnapshot?: RecruitmentSourceSnapshot;
	snapshot?: RecruitmentSourceSnapshot;
	resumePoolSummary?: RecruitmentSourceSnapshot;
	resumePoolSnapshot?: RecruitmentSourceSnapshot;
	recruitPlanSummary?: RecruitmentSourceSnapshot | null;
	recruitPlanSnapshot?: RecruitmentSourceSnapshot | null;
	jobStandardSummary?: RecruitmentSourceSnapshot | null;
	jobStandardSnapshot?: RecruitmentSourceSnapshot | null;
}

export interface ResumePoolExportRow {
	id?: number;
	candidateName: string;
	targetDepartmentId: number;
	targetDepartmentName?: string;
	targetPosition?: string | null;
	phone: string;
	email?: string | null;
	resumeText: string;
	sourceType: ResumePoolSourceType;
	sourceRemark?: string | null;
	externalLink?: string | null;
	status: ResumePoolStatus;
	linkedTalentAssetId?: number | null;
	latestInterviewId?: number | null;
	createTime?: string;
	updateTime?: string;
}

export type DashboardCrossMetricCode = GeneratedDashboardCrossMetricCode;
export type DashboardCrossSourceDomain = GeneratedDashboardCrossSourceDomain;
export type DashboardCrossScopeType = GeneratedDashboardCrossScopeType;
export type DashboardCrossDataStatus = GeneratedDashboardCrossDataStatus;
export type DashboardSummaryQuery = GeneratedDashboardSummaryQuery;
export type DashboardStageProgressItem = GeneratedDashboardStageProgressItem;
export type DashboardDepartmentDistributionItem = GeneratedDashboardDepartmentDistributionItem;
export type DashboardGradeDistributionItem = GeneratedDashboardGradeDistributionItem;
export type RecruitPlanStatus = GeneratedRecruitPlanStatus;
export type ContractStatus = GeneratedContractStatus;
export type ContractType = GeneratedContractType;
export type PurchaseOrderStatus = GeneratedPurchaseOrderStatus;
export type SupplierStatus = GeneratedSupplierStatus;
export type CapabilityModelStatus = GeneratedCapabilityModelStatus;
export type CourseStatus = GeneratedCourseStatus;
export type CertificateRecordStatus = GeneratedCertificateRecordStatus;
export type CertificateStatus = GeneratedCertificateStatus;
export type InterviewStatus = GeneratedInterviewStatus;
export type InterviewType = GeneratedInterviewType;
export type ResumePoolStatus = GeneratedResumePoolStatus;
export type ResumePoolSourceType = GeneratedResumePoolSourceType;
export type DocumentCenterStatus = GeneratedDocumentCenterStatus;
export type DocumentCenterCategory = GeneratedDocumentCenterCategory;
export type DocumentCenterFileType = GeneratedDocumentCenterFileType;
export type DocumentCenterStorage = GeneratedDocumentCenterStorage;
export type DocumentCenterConfidentiality = GeneratedDocumentCenterConfidentiality;
export type KnowledgeBaseStatus = GeneratedKnowledgeBaseStatus;
export type MeetingStatus = GeneratedMeetingStatus;
export type TalentAssetStatus = GeneratedTalentAssetStatus;
export type JobStandardStatus = GeneratedJobStandardStatus;
export type WorkPlanStatus = GeneratedWorkPlanStatus;
export type WorkPlanPriority = GeneratedWorkPlanPriority;
export type WorkPlanSourceType = 'manual' | 'dingtalkApproval';
export type WorkPlanSourceStatus =
	| 'none'
	| 'processing'
	| 'approved'
	| 'rejected'
	| 'withdrawn'
	| 'terminated';
export type RecruitmentSourceResource =
	| 'jobStandard'
	| 'recruitPlan'
	| 'resumePool'
	| 'interview'
	| 'talentAsset';
export type TeacherCooperationStatus = GeneratedTeacherCooperationStatus;
export type TeacherClassStatus = GeneratedTeacherClassStatus;
export type TeacherTodoBucket = GeneratedTeacherTodoBucket;
export type TeacherAgentStatus = GeneratedTeacherAgentStatus;
export type TeacherAgentBlacklistStatus = GeneratedTeacherAgentBlacklistStatus;
export type TeacherAgentRelationStatus = GeneratedTeacherAgentRelationStatus;
export type TeacherAttributionStatus = GeneratedTeacherAttributionStatus;
export type TeacherAttributionConflictStatus = GeneratedTeacherAttributionConflictStatus;

export type DashboardCrossSummaryQuery = GeneratedDashboardCrossSummaryQuery;
export type DashboardCrossMetricCard = Omit<
	GeneratedDashboardCrossMetricCard,
	'metricValue' | 'departmentId' | 'updatedAt'
> & {
	metricValue: number | null;
	departmentId: number | null;
	updatedAt: string | null;
};
export type DashboardCrossSummary = Omit<
	ApiResponseData<GeneratedDashboardCrossSummaryResponse>,
	'metricCards'
> & {
	metricCards: DashboardCrossMetricCard[];
};
export type DashboardSummary = ApiResponseData<GeneratedDashboardSummaryResponse>;

export interface UserOption {
	id: number;
	name: string;
	departmentId?: number | null;
	departmentName?: string;
}

export interface DepartmentOption {
	id: number;
	label: string;
}

export interface PerformancePersonaOption {
	key: string;
	label: string;
	category: 'org' | 'fn';
}

export interface PerformanceAccessContext {
	availablePersonas: PerformancePersonaOption[];
	defaultPersonaKey: string | null;
	activePersonaKey: string | null;
	roleKind: 'employee' | 'manager' | 'hr' | 'readonly' | 'unsupported';
	canSwitchPersona: boolean;
	workbenchPages: string[];
	surfaceAccess: {
		workbench: boolean;
		assessmentMy: boolean;
		assessmentInitiated: boolean;
		assessmentPending: boolean;
		approvalConfig: boolean;
		approvalInstance: boolean;
		dashboardSummary: boolean;
		dashboardCrossSummary: boolean;
	};
}

export type RecruitPlanRecord = Omit<
	GeneratedRecruitPlanRecord,
	| 'targetDepartmentId'
	| 'targetDepartmentName'
	| 'requirementSummary'
	| 'recruiterId'
	| 'recruiterName'
	| 'jobStandardId'
	| 'jobStandardPositionName'
	| 'sourceSnapshot'
	| 'jobStandardSummary'
	| 'jobStandardSnapshot'
	| 'status'
> & {
	targetDepartmentId: number | undefined;
	targetDepartmentName?: string | null;
	requirementSummary?: string | null;
	recruiterId?: number | null;
	recruiterName?: string | null;
	jobStandardId?: number | null;
	jobStandardPositionName?: string | null;
	jobStandardSummary?: RecruitmentSourceSnapshot | null;
	jobStandardSnapshot?: RecruitmentSourceSnapshot | null;
	sourceSnapshot?: RecruitmentSourceSnapshot | null;
	status?: RecruitPlanStatus;
};

export type RecruitPlanPageResult = Omit<
	ApiResponseData<GeneratedRecruitPlanPageResponse>,
	'list'
> & {
	list: RecruitPlanRecord[];
};
export interface RecruitPlanInfoQuery {
	id: number;
}

export type RecruitPlanImportCellValue = string | number | null | undefined;

export interface RecruitPlanImportRow {
	[key: string]: RecruitPlanImportCellValue;
}

export interface RecruitPlanExportRow {
	id?: number;
	title: string;
	targetDepartmentId?: number | null;
	targetDepartmentName?: string | null;
	positionName: string;
	headcount: number;
	startDate: string;
	endDate: string;
	recruiterId?: number | null;
	recruiterName?: string | null;
	status?: RecruitPlanStatus;
	createTime?: string;
	updateTime?: string;
}

export type ContractRecord = Omit<
	GeneratedContractRecord,
	| 'employeeId'
	| 'departmentId'
	| 'departmentName'
	| 'title'
	| 'employeeName'
	| 'contractNumber'
	| 'probationPeriod'
	| 'salary'
	| 'position'
> & {
	employeeId: number | undefined;
	departmentId?: number | null;
	departmentName?: string | null;
	title?: string | null;
	employeeName?: string | null;
	contractNumber?: string | null;
	probationPeriod?: number | null;
	salary?: number | null;
	position?: string | null;
};

export type ContractPageResult = Omit<ApiResponseData<GeneratedContractPageResponse>, 'list'> & {
	list: ContractRecord[];
};
export interface ContractInfoQuery {
	id: number;
}
export type ContractRemovePayload = import('./generated/assessment').DeleteIdsRequest;

export type PurchaseOrderItemRecord = Omit<
	GeneratedPurchaseOrderItemRecord,
	'specification' | 'unit' | 'unitPrice' | 'amount' | 'remark'
> & {
	specification?: string | null;
	unit?: string | null;
	unitPrice?: number | null;
	amount?: number | null;
	remark?: string | null;
};

export type PurchaseOrderInquiryRecord = Omit<
	GeneratedPurchaseOrderInquiryRecord,
	'supplierId' | 'supplierName' | 'quotedAmount' | 'inquiryRemark' | 'createdBy' | 'createdAt'
> & {
	supplierId?: number | null;
	supplierName?: string | null;
	quotedAmount?: number | null;
	inquiryRemark?: string | null;
	createdBy?: string | null;
	createdAt?: string | null;
};

export type PurchaseOrderApprovalLog = Omit<
	GeneratedPurchaseOrderApprovalLog,
	'approverId' | 'approverName' | 'remark' | 'createdAt'
> & {
	action?: 'submitted' | 'approved' | 'rejected' | 'closed' | string;
	approverId?: number | null;
	approverName?: string | null;
	remark?: string | null;
	createdAt?: string | null;
};

export type PurchaseOrderReceiptRecord = Omit<
	GeneratedPurchaseOrderReceiptRecord,
	'receivedQuantity' | 'receivedAt' | 'receiverId' | 'receiverName' | 'remark'
> & {
	receivedQuantity?: number | null;
	receivedAt?: string | null;
	receiverId?: number | null;
	receiverName?: string | null;
	remark?: string | null;
};

export type PurchaseOrderRecord = Omit<
	GeneratedPurchaseOrderRecord,
	| 'supplierId'
	| 'departmentId'
	| 'requesterId'
	| 'expectedDeliveryDate'
	| 'approvedBy'
	| 'approvedAt'
	| 'approvalRemark'
	| 'closedReason'
	| 'receivedQuantity'
	| 'receivedAt'
	| 'items'
	| 'inquiryRecords'
	| 'approvalLogs'
	| 'receiptRecords'
	| 'remark'
> & {
	supplierId: number | undefined;
	departmentId: number | undefined;
	requesterId: number | undefined;
	expectedDeliveryDate?: string | null;
	approvedBy?: string | null;
	approvedAt?: string | null;
	approvalRemark?: string | null;
	closedReason?: string | null;
	receivedQuantity?: number | null;
	receivedAt?: string | null;
	items?: PurchaseOrderItemRecord[];
	inquiryRecords?: PurchaseOrderInquiryRecord[];
	approvalLogs?: PurchaseOrderApprovalLog[];
	receiptRecords?: PurchaseOrderReceiptRecord[];
	remark?: string | null;
};

export type PurchaseOrderPageResult = Omit<
	ApiResponseData<GeneratedPurchaseOrderPageResponse>,
	'list'
> & {
	list: PurchaseOrderRecord[];
};
export type PurchaseOrderPageQuery =
	import('./generated/purchase-order').PurchaseOrderFetchPageRequest;
export type PurchaseOrderInfoQuery =
	import('./generated/purchase-order').PurchaseOrderFetchInfoQuery;
export type PurchaseOrderCreatePayload = Partial<PurchaseOrderRecord>;
export type PurchaseOrderUpdatePayload = Partial<PurchaseOrderRecord> & {
	id: number;
};
export type PurchaseOrderRemovePayload =
	import('./generated/purchase-order').PurchaseOrderRemovePurchaseOrderRequest;
export type PurchaseOrderSubmitInquiryPayload =
	import('./generated/purchase-order').PurchaseOrderSubmitInquiryRequest;
export type PurchaseOrderSubmitApprovalPayload =
	import('./generated/purchase-order').PurchaseOrderSubmitApprovalRequest;
export type PurchaseOrderApprovePayload =
	import('./generated/purchase-order').PurchaseOrderApproveRequest;
export type PurchaseOrderRejectPayload =
	import('./generated/purchase-order').PurchaseOrderRejectRequest;
export type PurchaseOrderReceivePayload =
	import('./generated/purchase-order').PurchaseOrderReceiveRequest;
export type PurchaseOrderClosePayload =
	import('./generated/purchase-order').PurchaseOrderCloseRequest;

/**
 * 统一采购单及其子表在 page/info 接口下的弱类型字段，避免页面层重复兜底。
 */
export function normalizePurchaseOrderDomainRecord(
	record: PurchaseOrderRecord
): PurchaseOrderRecord {
	return {
		...record,
		status: normalizePurchaseOrderStatus(record.status),
		orderNo: String(record.orderNo || ''),
		expectedDeliveryDate: normalizeOptionalString(record.expectedDeliveryDate),
		currency: normalizeOptionalString(record.currency) || 'CNY',
		totalAmount: Number(record.totalAmount || 0),
		receivedQuantity: Number(record.receivedQuantity || 0),
		items: normalizePurchaseOrderItemList(record.items),
		inquiryRecords: normalizePurchaseOrderInquiryList(record.inquiryRecords),
		approvalLogs: normalizePurchaseOrderApprovalList(record.approvalLogs),
		receiptRecords: normalizePurchaseOrderReceiptList(record.receiptRecords)
	};
}

function normalizePurchaseOrderStatus(status?: string | null): PurchaseOrderStatus | undefined {
	switch (status) {
		case 'draft':
		case 'cancelled':
		case 'approved':
		case 'closed':
		case 'received':
		case 'inquiring':
		case 'pendingApproval':
			return status;
		default:
			return undefined;
	}
}

function normalizePurchaseOrderItemList(
	items?: PurchaseOrderItemRecord[] | null
): PurchaseOrderItemRecord[] {
	if (!Array.isArray(items)) {
		return [];
	}

	return items.map(item => ({
		...item,
		itemName: String(item?.itemName || ''),
		specification: normalizeOptionalString(item?.specification),
		unit: normalizeOptionalString(item?.unit),
		quantity: Number(item?.quantity || 0),
		unitPrice: Number(item?.unitPrice || 0),
		amount: Number(item?.amount || Number(item?.quantity || 0) * Number(item?.unitPrice || 0)),
		remark: normalizeOptionalString(item?.remark)
	}));
}

function normalizePurchaseOrderInquiryList(
	records?: PurchaseOrderInquiryRecord[] | null
): PurchaseOrderInquiryRecord[] {
	if (!Array.isArray(records)) {
		return [];
	}

	return records.map(item => ({
		...item,
		supplierId: normalizePositiveIntegerOrUndefined(item?.supplierId),
		supplierName: String(item?.supplierName || ''),
		quotedAmount: Number(item?.quotedAmount || 0),
		inquiryRemark: normalizeOptionalString(item?.inquiryRemark),
		createdBy: String(item?.createdBy || ''),
		createdAt: String(item?.createdAt || '')
	}));
}

function normalizePurchaseOrderApprovalList(
	records?: PurchaseOrderApprovalLog[] | null
): PurchaseOrderApprovalLog[] {
	if (!Array.isArray(records)) {
		return [];
	}

	return records.map(item => ({
		...item,
		action: String(item?.action || ''),
		approverId: normalizePositiveIntegerOrUndefined(item?.approverId),
		approverName: String(item?.approverName || ''),
		remark: normalizeOptionalString(item?.remark),
		createdAt: String(item?.createdAt || '')
	}));
}

function normalizePurchaseOrderReceiptList(
	records?: PurchaseOrderReceiptRecord[] | null
): PurchaseOrderReceiptRecord[] {
	if (!Array.isArray(records)) {
		return [];
	}

	return records.map(item => ({
		...item,
		receivedQuantity: Number(item?.receivedQuantity || 0),
		receivedAt: String(item?.receivedAt || ''),
		receiverId: normalizePositiveIntegerOrUndefined(item?.receiverId),
		receiverName: String(item?.receiverName || ''),
		remark: normalizeOptionalString(item?.remark)
	}));
}

export type PurchaseReportSummary = ApiResponseData<GeneratedPurchaseReportSummaryResponse>;
export type PurchaseReportQuery = GeneratedPurchaseReportQuery;

export type PurchaseReportTrendPoint = GeneratedPurchaseReportTrendPoint;

export type PurchaseReportSupplierStat = Omit<
	GeneratedPurchaseReportSupplierStat,
	'supplierId' | 'lastOrderDate'
> & {
	supplierId?: number | null;
	lastOrderDate?: string | null;
};

export type SupplierRecord = Omit<
	GeneratedSupplierRecord,
	| 'code'
	| 'category'
	| 'contactName'
	| 'contactPhone'
	| 'contactEmail'
	| 'bankAccount'
	| 'taxNo'
	| 'remark'
> & {
	code?: string | null;
	category?: string | null;
	contactName?: string | null;
	contactPhone?: string | null;
	contactEmail?: string | null;
	bankAccount?: string | null;
	taxNo?: string | null;
	remark?: string | null;
};

export interface SupplierOption {
	id: number;
	name: string;
	status?: SupplierRecord['status'];
}

export interface AssetOption {
	id: number;
	name: string;
	assetNo?: string;
	assetStatus?: AssetInfoRecord['assetStatus'];
}

export interface MaterialOption {
	id: number;
	name: string;
	code?: string;
	category?: string | null;
	specification?: string | null;
	unit?: string;
	status?: MaterialCatalogRecord['status'];
}

export type LookupErrorHandler = (error: unknown) => void;

export type SupplierPageResult = Omit<ApiResponseData<GeneratedSupplierPageResponse>, 'list'> & {
	list: SupplierRecord[];
};
export type SupplierPageQuery = import('./generated/supplier').SupplierFetchPageRequest;
export type SupplierInfoQuery = import('./generated/supplier').SupplierFetchInfoQuery;
export type SupplierCreatePayload = Partial<SupplierRecord>;
export type SupplierUpdatePayload = Partial<SupplierRecord> & {
	id: number;
};
export type SupplierRemovePayload = import('./generated/supplier').SupplierRemoveSupplierRequest;

export type CapabilityModelRecord = GeneratedCapabilityModelRecord;
export interface CapabilityModelInfoQuery {
	id: number;
}
export interface CapabilityItemInfoQuery {
	id: number;
}
export interface CapabilityPortraitInfoQuery {
	employeeId: number;
}

export type CapabilityModelPageResult = ApiResponseData<GeneratedCapabilityModelPageResponse>;

export type CapabilityItemRecord = GeneratedCapabilityItemRecord;

export type CapabilityPortraitRecord = GeneratedCapabilityPortraitRecord;

export type CertificateRecord = GeneratedCertificateRecord;
export interface CertificateInfoQuery {
	id: number;
}

export type CertificatePageResult = GeneratedCertificatePageResponse;

export type CertificateLedgerRecord = GeneratedCertificateLedgerRecord;

export type CertificateLedgerPageResult = GeneratedCertificateLedgerPageResponse;

export type CourseRecord = Omit<GeneratedCourseRecord, 'startDate' | 'endDate'> & {
	startDate?: string | null;
	endDate?: string | null;
};

export type CoursePageResult = Omit<ApiResponseData<GeneratedCoursePageResponse>, 'list'> & {
	list: CourseRecord[];
};
export type CoursePageQuery = import('./generated/course').CourseFetchPageRequest & {
	page: number;
	size: number;
	keyword?: string;
	category?: string;
	status?: string;
};
export type CourseInfoQuery = import('./generated/course').CourseFetchInfoQuery;
export type CourseCreatePayload = Partial<CourseRecord>;
export type CourseUpdatePayload = Partial<CourseRecord> & { id: number };
export type CourseRemovePayload = import('./generated/course').CourseRemoveCourseRequest;

export type CourseEnrollmentRecord = Omit<GeneratedCourseEnrollmentRecord, 'score'> & {
	score?: number | null;
};

export type CourseEnrollmentPageResult = Omit<
	ApiResponseData<GeneratedCourseEnrollmentPageResponse>,
	'list'
> & {
	list: CourseEnrollmentRecord[];
};
export type CourseEnrollmentPageQuery =
	import('./generated/course').CourseFetchEnrollmentPageRequest;

export type DocumentCenterRecord = Omit<GeneratedDocumentCenterRecord, 'sizeMb' | 'expireDate'> & {
	sizeMb?: number | null;
	expireDate?: string | null;
};

export type DocumentCenterPageResult = Omit<
	ApiResponseData<GeneratedDocumentCenterPageResponse>,
	'list'
> & {
	list: DocumentCenterRecord[];
};
export type DocumentCenterPageQuery =
	import('./generated/document-center').DocumentCenterFetchPageRequest;
export type DocumentCenterInfoQuery =
	import('./generated/document-center').DocumentCenterFetchInfoQuery;
export type DocumentCenterStatsQuery =
	import('./generated/document-center').DocumentCenterFetchStatsQuery;
export type DocumentCenterCreatePayload = Partial<DocumentCenterRecord>;
export type DocumentCenterUpdatePayload = Partial<DocumentCenterRecord> & {
	id: number;
};
export type DocumentCenterRemovePayload =
	import('./generated/document-center').DocumentCenterRemoveDocumentRequest;

export type DocumentCenterStats = ApiResponseData<GeneratedDocumentCenterStatsResponse>;

export interface DocumentCenterFormModel {
	fileNo: string;
	fileName: string;
	category: DocumentCenterCategory;
	fileType: DocumentCenterFileType;
	storage: DocumentCenterStorage;
	confidentiality: DocumentCenterConfidentiality;
	ownerName: string;
	department: string;
	status: DocumentCenterStatus;
	version: string;
	sizeMb: number;
	expireDate: string;
	tagsText: string;
	notes: string;
}

export interface KnowledgeBaseRelatedFileSummary {
	id: number;
	fileNo?: string;
	fileName?: string;
}

export type KnowledgeBaseRecord = GeneratedKnowledgeBaseRecord;

export type KnowledgeBasePageResult = Omit<
	ApiResponseData<GeneratedKnowledgeBasePageResponse>,
	'list'
> & {
	list: KnowledgeBaseRecord[];
};
export type KnowledgeBasePageQuery =
	import('./generated/knowledge-base').KnowledgeBaseFetchPageRequest;
export type KnowledgeBaseStatsQuery =
	import('./generated/knowledge-base').KnowledgeBaseFetchStatsQuery;
export type KnowledgeBaseCreatePayload =
	import('./generated/knowledge-base').KnowledgeBaseCreateKnowledgeRequest;
export type KnowledgeBaseUpdatePayload =
	import('./generated/knowledge-base').KnowledgeBaseUpdateKnowledgeRequest;
export type KnowledgeBaseRemovePayload =
	import('./generated/knowledge-base').KnowledgeBaseRemoveKnowledgeRequest;

export type KnowledgeBaseStats = ApiResponseData<GeneratedKnowledgeBaseStatsResponse>;

export type KnowledgeGraphNode = GeneratedKnowledgeGraphNode;

export type KnowledgeGraphLink = GeneratedKnowledgeGraphLink;

export type KnowledgeGraphSummary = Omit<
	ApiResponseData<GeneratedKnowledgeGraphSummaryResponse>,
	'nodes' | 'links'
> & {
	nodes: KnowledgeGraphNode[];
	links: KnowledgeGraphLink[];
};

export type KnowledgeQaRecord = GeneratedKnowledgeQaRecord;
export type KnowledgeQaListQuery =
	import('./generated/knowledge-base').KnowledgeBaseFetchQaListQuery;
export type KnowledgeQaListResult = ApiResponseData<GeneratedKnowledgeQaListResponse>;
export type KnowledgeQaCreatePayload =
	import('./generated/knowledge-base').KnowledgeBaseCreateQaRequest;
export type KnowledgeSearchQuery =
	import('./generated/knowledge-base').KnowledgeBaseFetchSearchQuery;

export interface KnowledgeBaseFormModel {
	kbNo: string;
	title: string;
	category: string;
	summary: string;
	ownerName: string;
	status: KnowledgeBaseStatus;
	importance: number;
	tagsText: string;
	relatedTopicsText: string;
	relatedFileIds: number[];
}

export interface KnowledgeQaFormModel {
	question: string;
	answer: string;
	relatedKnowledgeIds: number[];
	relatedFileIds: number[];
}

export type KnowledgeSearchResult = Omit<
	ApiResponseData<GeneratedKnowledgeSearchResultResponse>,
	'knowledge' | 'files' | 'qas'
> & {
	knowledge: KnowledgeBaseRecord[];
	files: DocumentCenterRecord[];
	qas: KnowledgeQaRecord[];
};

export type HiringSourceType = GeneratedHiringSourceType;

export type HiringStatus = GeneratedHiringStatus;

export type HiringSourceSnapshot = {
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
};
export interface HiringInfoQuery {
	id: number;
}

type GeneratedHiringRecord = StripIndexSignature<
	ApiResponseData<GeneratedHiringPageResponse>['list'][number]
>;

export type HiringTransportRecord = Omit<
	GeneratedHiringRecord,
	| 'targetDepartmentName'
	| 'targetPosition'
	| 'sourceType'
	| 'sourceId'
	| 'sourceStatusSnapshot'
	| 'sourceSnapshot'
	| 'interviewId'
	| 'resumePoolId'
	| 'recruitPlanId'
	| 'hiringDecision'
	| 'decisionContent'
	| 'status'
	| 'offeredAt'
	| 'acceptedAt'
	| 'rejectedAt'
	| 'closedAt'
	| 'closeReason'
	| 'interviewSnapshot'
	| 'resumePoolSnapshot'
	| 'recruitPlanSnapshot'
> & {
	targetDepartmentName?: string | null;
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
	offeredAt?: string | null;
	acceptedAt?: string | null;
	rejectedAt?: string | null;
	closedAt?: string | null;
	closeReason?: string | null;
	interviewSnapshot?: HiringSourceSnapshot | null;
	resumePoolSnapshot?: HiringSourceSnapshot | null;
	recruitPlanSnapshot?: HiringSourceSnapshot | null;
};

export type HiringRecord = Omit<
	GeneratedHiringRecord,
	| 'targetDepartmentName'
	| 'targetPosition'
	| 'sourceType'
	| 'sourceId'
	| 'sourceStatusSnapshot'
	| 'sourceSnapshot'
	| 'interviewId'
	| 'resumePoolId'
	| 'recruitPlanId'
	| 'hiringDecision'
	| 'decisionContent'
	| 'status'
	| 'offeredAt'
	| 'acceptedAt'
	| 'rejectedAt'
	| 'closedAt'
	| 'closeReason'
	| 'interviewSnapshot'
	| 'resumePoolSnapshot'
	| 'recruitPlanSnapshot'
> & {
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	sourceType?: HiringSourceType | null;
	sourceId?: number | null;
	sourceStatusSnapshot?: string | null;
	sourceSnapshot?: HiringSourceSnapshot | null;
	interviewId?: number | null;
	resumePoolId?: number | null;
	recruitPlanId?: number | null;
	hiringDecision?: string | null;
	decisionContent?: string | null;
	status?: HiringStatus;
	offeredAt?: string | null;
	acceptedAt?: string | null;
	rejectedAt?: string | null;
	closedAt?: string | null;
	closeReason?: string | null;
	interviewSnapshot?: HiringSourceSnapshot | null;
	resumePoolSnapshot?: HiringSourceSnapshot | null;
	recruitPlanSnapshot?: HiringSourceSnapshot | null;
};

export type HiringFormRecord = Omit<HiringRecord, 'targetDepartmentId'> & {
	targetDepartmentId?: number;
};

export type HiringPageResult = Omit<ApiResponseData<GeneratedHiringPageResponse>, 'list'> & {
	list: HiringTransportRecord[];
};

/**
 * 统一录用记录 transport -> domain 的来源快照和关联 ID 字段。
 */
export function normalizeHiringDomainRecord(record: HiringTransportRecord): HiringRecord {
	const sourceSnapshot =
		record.sourceSnapshot && typeof record.sourceSnapshot === 'object'
			? record.sourceSnapshot
			: null;

	return {
		...record,
		interviewId: normalizePositiveIntegerOrUndefined(
			record.interviewId ?? sourceSnapshot?.interviewId
		),
		resumePoolId: normalizePositiveIntegerOrUndefined(
			record.resumePoolId ?? sourceSnapshot?.resumePoolId
		),
		recruitPlanId: normalizePositiveIntegerOrUndefined(
			record.recruitPlanId ?? sourceSnapshot?.recruitPlanId
		),
		sourceSnapshot
	};
}

export type InterviewRecord = Omit<
	GeneratedInterviewRecord,
	| 'departmentId'
	| 'interviewerId'
	| 'interviewType'
	| 'score'
	| 'resumePoolId'
	| 'recruitPlanId'
	| 'sourceSnapshot'
	| 'resumePoolSummary'
	| 'resumePoolSnapshot'
	| 'recruitPlanSummary'
	| 'recruitPlanSnapshot'
	| 'status'
> & {
	departmentId?: number | null | undefined;
	interviewerId: number | undefined;
	interviewType?: InterviewType | null;
	score?: number | null;
	resumePoolId?: number | null | undefined;
	recruitPlanId?: number | null | undefined;
	sourceSnapshot?: RecruitmentSourceSnapshot | null;
	resumePoolSummary?: RecruitmentSourceSnapshot | null;
	resumePoolSnapshot?: RecruitmentSourceSnapshot | null;
	recruitPlanSummary?: RecruitmentSourceSnapshot | null;
	recruitPlanSnapshot?: RecruitmentSourceSnapshot | null;
	status?: InterviewStatus;
};

export type InterviewPageResult = Omit<ApiResponseData<GeneratedInterviewPageResponse>, 'list'> & {
	list: InterviewRecord[];
};
export interface InterviewInfoQuery {
	id: number;
}

export type ResumePoolAttachmentSummary = GeneratedResumePoolAttachmentSummary;
export type ResumePoolInterviewSourceSnapshot = RecruitmentSourceSnapshot;
export type ResumePoolReferenceSnapshot = RecruitmentSourceSnapshot;
export type ResumePoolRecruitPlanSnapshot = RecruitmentSourceSnapshot;
export type ResumePoolJobStandardSnapshot = RecruitmentSourceSnapshot;

export type ResumePoolRecord = Omit<
	GeneratedResumePoolRecord,
	| 'targetDepartmentId'
	| 'targetPosition'
	| 'email'
	| 'sourceRemark'
	| 'externalLink'
	| 'recruitPlanId'
	| 'recruitPlanTitle'
	| 'jobStandardId'
	| 'jobStandardPositionName'
	| 'linkedTalentAssetId'
	| 'latestInterviewId'
	| 'resumeText'
	| 'sourceSnapshot'
	| 'recruitPlanSummary'
	| 'recruitPlanSnapshot'
	| 'jobStandardSummary'
	| 'jobStandardSnapshot'
	| 'status'
> & {
	targetDepartmentId: number | undefined;
	targetPosition?: string | null;
	email?: string | null;
	sourceRemark?: string | null;
	externalLink?: string | null;
	recruitPlanId?: number | null;
	recruitPlanTitle?: string | null;
	jobStandardId?: number | null;
	jobStandardPositionName?: string | null;
	linkedTalentAssetId?: number | null;
	latestInterviewId?: number | null;
	resumeText: string;
	sourceSnapshot?: RecruitmentSourceSnapshot | null;
	recruitPlanSnapshot?: RecruitmentSourceSnapshot | null;
	jobStandardSnapshot?: RecruitmentSourceSnapshot | null;
	status?: ResumePoolStatus;
};

export type ResumePoolPageResult = Omit<
	ApiResponseData<GeneratedResumePoolPageResponse>,
	'list'
> & {
	list: ResumePoolRecord[];
};
export interface ResumePoolInfoQuery {
	id: number;
}

export type MeetingRecord = Omit<
	GeneratedMeetingRecord,
	| 'code'
	| 'type'
	| 'description'
	| 'location'
	| 'organizerId'
	| 'organizerName'
	| 'status'
> & {
	code?: string | null;
	type?: string | null;
	description?: string | null;
	location?: string | null;
	organizerId: number | undefined;
	organizerName?: string | null;
	participantIds?: number[];
	status?: MeetingStatus;
};

export type MeetingPageResult = Omit<ApiResponseData<GeneratedMeetingPageResponse>, 'list'> & {
	list: MeetingRecord[];
};
export interface MeetingInfoQuery {
	id: number;
}
export type MeetingRemovePayload = import('./generated/assessment').DeleteIdsRequest;

export type TalentAssetRecord = Omit<
	GeneratedTalentAssetRecord,
	| 'code'
	| 'targetDepartmentId'
	| 'targetDepartmentName'
	| 'targetPosition'
	| 'followUpSummary'
	| 'nextFollowUpDate'
	| 'status'
> & {
	code?: string | null;
	targetDepartmentId: number | undefined;
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	followUpSummary?: string | null;
	nextFollowUpDate?: string | null;
	status?: TalentAssetStatus;
};

export type TalentAssetPageResult = Omit<
	ApiResponseData<GeneratedTalentAssetPageResponse>,
	'list'
> & {
	list: TalentAssetRecord[];
};
export interface TalentAssetInfoQuery {
	id: number;
}

export type WorkPlanAssignee = GeneratedWorkPlanAssignee;

export type WorkPlanRecord = Omit<
	GeneratedWorkPlanRecord,
	| 'description'
	| 'ownerDepartmentId'
	| 'ownerDepartmentName'
	| 'ownerId'
	| 'ownerName'
	| 'plannedStartDate'
	| 'plannedEndDate'
	| 'startedAt'
	| 'completedAt'
	| 'progressSummary'
	| 'resultSummary'
	| 'sourceType'
	| 'sourceBizType'
	| 'sourceBizId'
	| 'sourceTitle'
	| 'sourceStatus'
	| 'externalInstanceId'
	| 'externalProcessCode'
	| 'approvalFinishedAt'
	| 'sourceSnapshot'
> & {
	description?: string | null;
	ownerDepartmentId: number | undefined;
	ownerDepartmentName?: string | null;
	ownerId: number | undefined;
	ownerName?: string | null;
	plannedStartDate?: string | null;
	plannedEndDate?: string | null;
	startedAt?: string | null;
	completedAt?: string | null;
	progressSummary?: string | null;
	resultSummary?: string | null;
	sourceType?: WorkPlanSourceType | string | null;
	sourceBizType?: string | null;
	sourceBizId?: string | null;
	sourceTitle?: string | null;
	sourceStatus?: WorkPlanSourceStatus | string | null;
	externalInstanceId?: string | null;
	externalProcessCode?: string | null;
	approvalFinishedAt?: string | null;
	sourceSnapshot?: JsonObject | null;
};

export type WorkPlanPageResult = Omit<ApiResponseData<GeneratedWorkPlanPageResponse>, 'list'> & {
	list: WorkPlanRecord[];
};
export type WorkPlanPageQuery = import('./generated/work-plan').WorkPlanFetchPageRequest & {
	page: number;
	size: number;
	keyword?: string;
	departmentId?: number;
	status?: string;
	sourceStatus?: string;
};
export type WorkPlanInfoQuery = import('./generated/work-plan').WorkPlanFetchInfoQuery;
export type WorkPlanCreatePayload = import('./generated/work-plan').WorkPlanCreateWorkPlanRequest;
export type WorkPlanUpdatePayload = import('./generated/work-plan').WorkPlanUpdateWorkPlanRequest;
export type WorkPlanDeletePayload = import('./generated/work-plan').WorkPlanDeleteWorkPlanRequest;
export type WorkPlanStartPayload = import('./generated/work-plan').WorkPlanStartRequest;
export type WorkPlanCompletePayload = import('./generated/work-plan').WorkPlanCompleteRequest;
export type WorkPlanCancelPayload = import('./generated/work-plan').WorkPlanCancelRequest;
export type WorkPlanSyncPayload =
	import('./generated/work-plan').WorkPlanSyncDingtalkApprovalRequest & {
		sourceTitle: string;
		sourceBizType: string;
		sourceBizId?: string;
		externalInstanceId: string;
		externalProcessCode?: string;
		sourceStatus: string;
		planTitle?: string;
		planDescription?: string;
		ownerDepartmentId?: number;
		ownerId?: number;
		assigneeIds: number[];
		priority: WorkPlanPriority;
		plannedStartDate?: string;
		plannedEndDate?: string;
		sourceSnapshot?: Record<string, unknown>;
	};

/**
 * 统一工作计划默认结构和数组字段，避免页面层自己补空数组和默认值。
 */
export function normalizeWorkPlanDomainRecord(
	record: WorkPlanRecord | null | undefined
): WorkPlanRecord {
	return {
		...createEmptyWorkPlan(),
		...record,
		assigneeIds: Array.isArray(record?.assigneeIds) ? record.assigneeIds : [],
		assigneeList: Array.isArray(record?.assigneeList) ? record.assigneeList : [],
		assigneeNames: Array.isArray(record?.assigneeNames) ? record.assigneeNames : []
	};
}

export type TeacherAgentRecord = Omit<
	GeneratedTeacherAgentRecord,
	| 'level'
	| 'region'
	| 'cooperationStatus'
	| 'remark'
	| 'ownerEmployeeId'
	| 'ownerDepartmentId'
	| 'createTime'
	| 'updateTime'
> & {
	level?: string | null;
	region?: string | null;
	cooperationStatus?: string | null;
	remark?: string | null;
	ownerEmployeeId?: number | null;
	ownerDepartmentId?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
};

export type TeacherAgentPageResult = Omit<
	ApiResponseData<GeneratedTeacherAgentPageResponse>,
	'list'
> & {
	list: TeacherAgentRecord[];
};
export type TeacherAgentPageQuery =
	import('./generated/teacher-agent').TeacherAgentFetchPageRequest & {
		page: number;
		size: number;
	};
export type TeacherAgentInfoQuery = import('./generated/teacher-agent').TeacherAgentFetchInfoQuery;
export type TeacherAgentCreatePayload = Partial<TeacherAgentRecord>;
export type TeacherAgentUpdatePayload = Partial<TeacherAgentRecord> & { id: number };
export type TeacherAgentUpdateStatusPayload =
	import('./generated/teacher-agent').TeacherAgentUpdateStatusRequest;
export type TeacherAgentBlacklistPayload =
	import('./generated/teacher-agent').TeacherAgentBlacklistRequest;
export type TeacherAgentUnblacklistPayload =
	import('./generated/teacher-agent').TeacherAgentUnblacklistRequest;

export type TeacherAgentRelationRecord = Omit<
	GeneratedTeacherAgentRelationRecord,
	| 'parentAgentId'
	| 'parentAgentName'
	| 'childAgentId'
	| 'childAgentName'
	| 'effectiveTime'
	| 'remark'
	| 'ownerEmployeeId'
	| 'ownerDepartmentId'
	| 'createTime'
	| 'updateTime'
> & {
	parentAgentId: number | undefined;
	parentAgentName?: string | null;
	childAgentId: number | undefined;
	childAgentName?: string | null;
	effectiveTime?: string | null;
	remark?: string | null;
	ownerEmployeeId?: number | null;
	ownerDepartmentId?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
};

export type TeacherAgentRelationPageResult = Omit<
	ApiResponseData<GeneratedTeacherAgentRelationPageResponse>,
	'list'
> & {
	list: TeacherAgentRelationRecord[];
};
export type TeacherAgentRelationPageQuery =
	import('./generated/teacher-agent-relation').TeacherAgentRelationFetchPageRequest & {
		page: number;
		size: number;
	};
export type TeacherAgentRelationCreatePayload = Partial<TeacherAgentRelationRecord>;
export type TeacherAgentRelationUpdatePayload = Partial<TeacherAgentRelationRecord> & {
	id: number;
};
export type TeacherAgentRelationRemovePayload =
	import('./generated/teacher-agent-relation').TeacherAgentRelationRemoveTeacherAgentRelationRequest;

export type TeacherAttributionRecord = Omit<
	GeneratedTeacherAttributionRecord,
	| 'teacherId'
	| 'teacherName'
	| 'agentId'
	| 'agentName'
	| 'attributionType'
	| 'sourceType'
	| 'sourceRemark'
	| 'effectiveTime'
	| 'operatorId'
	| 'operatorName'
	| 'createTime'
	| 'updateTime'
> & {
	teacherId?: number | null;
	teacherName?: string | null;
	agentId?: number | null;
	agentName?: string | null;
	attributionType?: string | null;
	sourceType?: string | null;
	sourceRemark?: string | null;
	effectiveTime?: string | null;
	operatorId?: number | null;
	operatorName?: string | null;
	createTime?: string | null;
	updateTime?: string | null;
};

export type TeacherAttributionPageResult = Omit<
	ApiResponseData<GeneratedTeacherAttributionPageResponse>,
	'list'
> & {
	list: TeacherAttributionRecord[];
};
export type TeacherAttributionPageQuery =
	import('./generated/teacher-attribution').TeacherAttributionFetchPageRequest & {
		page: number;
		size: number;
		status?: TeacherAttributionStatus | string;
		teacherId?: number;
	};
export type TeacherAttributionInfoQuery =
	import('./generated/teacher-attribution').TeacherAttributionFetchInfoQuery;
export interface TeacherAttributionAssignPayload {
	teacherId: number;
	agentId?: number | null;
	sourceRemark?: string;
}
export type TeacherAttributionChangePayload = TeacherAttributionAssignPayload;
export type TeacherAttributionRemovePayload =
	import('./generated/teacher-attribution').TeacherAttributionRemoveRequest;

export type TeacherAttributionConflictRecord = Omit<
	GeneratedTeacherAttributionConflictRecord,
	| 'teacherId'
	| 'teacherName'
	| 'resolution'
	| 'resolutionRemark'
	| 'resolvedBy'
	| 'resolvedTime'
	| 'currentAgentId'
	| 'requestedAgentId'
	| 'requestedById'
	| 'createTime'
	| 'updateTime'
> & {
	teacherId?: number | null;
	teacherName?: string | null;
	resolution?: string | null;
	resolutionRemark?: string | null;
	resolvedBy?: number | null;
	resolvedTime?: string | null;
	currentAgentId?: number | null;
	requestedAgentId?: number | null;
	requestedById?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
};

export type TeacherAttributionConflictDetail = Omit<
	ApiResponseData<GeneratedTeacherAttributionConflictDetailResponse>,
	| 'currentAgentName'
	| 'requestedAgentName'
	| 'id'
	| 'teacherId'
	| 'teacherName'
	| 'resolution'
	| 'resolutionRemark'
	| 'resolvedBy'
	| 'resolvedTime'
	| 'currentAgentId'
	| 'requestedAgentId'
	| 'requestedById'
	| 'createTime'
	| 'updateTime'
> & {
	currentAgentName?: string | null;
	requestedAgentName?: string | null;
	id?: number;
	teacherId?: number | null;
	teacherName?: string | null;
	resolution?: string | null;
	resolutionRemark?: string | null;
	resolvedBy?: number | null;
	resolvedTime?: string | null;
	currentAgentId?: number | null;
	requestedAgentId?: number | null;
	requestedById?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
};

export type TeacherAttributionConflictPageResult = Omit<
	ApiResponseData<GeneratedTeacherAttributionConflictPageResponse>,
	'list'
> & {
	list: TeacherAttributionConflictRecord[];
};
export type TeacherAttributionConflictPageQuery =
	import('./generated/teacher-attribution-conflict').TeacherAttributionConflictFetchPageRequest & {
		page: number;
		size: number;
		status?: TeacherAttributionConflictStatus | string;
	};
export type TeacherAttributionConflictInfoQuery =
	import('./generated/teacher-attribution-conflict').TeacherAttributionConflictFetchInfoQuery;
export interface TeacherAttributionConflictCreatePayload {
	teacherId: number;
	agentId?: number | null;
	sourceRemark?: string;
}
export interface TeacherAttributionConflictResolvePayload {
	id: number;
	resolution: 'resolved' | 'cancelled';
	agentId?: number | null;
	resolutionRemark?: string;
}
export type TeacherAttributionConflictResolveResult =
	| TeacherAttributionConflictDetail
	| TeacherAttributionInfo;

export type TeacherAttributionInfo = Omit<
	GeneratedTeacherAttributionInfo,
	'teacherName' | 'currentAttribution' | 'openConflicts' | 'history'
> & {
	teacherName?: string | null;
	currentAttribution?: TeacherAttributionRecord | null;
	openConflicts?: TeacherAttributionConflictRecord[];
	history?: TeacherAttributionRecord[];
};

export type TeacherAgentAuditRecord = Omit<
	GeneratedTeacherAgentAuditRecord,
	| 'resourceType'
	| 'resourceId'
	| 'action'
	| 'beforeSnapshot'
	| 'afterSnapshot'
	| 'operatorId'
	| 'operatorName'
	| 'createTime'
	| 'updateTime'
> & {
	resourceType?: string | null;
	resourceId?: number | null;
	action?: string | null;
	beforeSnapshot?: JsonObject | null;
	afterSnapshot?: JsonObject | null;
	operatorId?: number | null;
	operatorName?: string | null;
	createTime?: string | null;
	updateTime?: string | null;
};

export type TeacherAgentAuditPageResult = Omit<
	ApiResponseData<GeneratedTeacherAgentAuditPageResponse>,
	'list'
> & {
	list: TeacherAgentAuditRecord[];
};
export type TeacherAgentAuditPageQuery =
	import('./generated/teacher-agent-audit').TeacherAgentAuditFetchPageRequest & {
		page: number;
		size: number;
	};
export type TeacherAgentAuditInfoQuery =
	import('./generated/teacher-agent-audit').TeacherAgentAuditFetchInfoQuery;

export type TeacherInfoRecord = Omit<
	GeneratedTeacherInfoRecord,
	| 'phone'
	| 'wechat'
	| 'schoolName'
	| 'schoolRegion'
	| 'schoolType'
	| 'grade'
	| 'className'
	| 'subject'
	| 'projectTags'
	| 'intentionLevel'
	| 'communicationStyle'
	| 'ownerEmployeeId'
	| 'ownerEmployeeName'
	| 'ownerDepartmentId'
	| 'ownerDepartmentName'
	| 'lastFollowTime'
	| 'nextFollowTime'
	| 'cooperationTime'
	| 'classCount'
	| 'createTime'
	| 'updateTime'
> & {
	phone?: string | null;
	wechat?: string | null;
	schoolName?: string | null;
	schoolRegion?: string | null;
	schoolType?: string | null;
	grade?: string | null;
	className?: string | null;
	subject?: string | null;
	projectTags?: string[] | string | null;
	intentionLevel?: string | null;
	communicationStyle?: string | null;
	ownerEmployeeId?: number | null;
	ownerEmployeeName?: string | null;
	ownerDepartmentId?: number | null;
	ownerDepartmentName?: string | null;
	lastFollowTime?: string | null;
	nextFollowTime?: string | null;
	cooperationTime?: string | null;
	classCount?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
	[key: string]: unknown;
};

export type TeacherInfoPageResult = Omit<
	ApiResponseData<GeneratedTeacherInfoPageResponse>,
	'list'
> & {
	list: TeacherInfoRecord[];
};
export type TeacherInfoPageQuery =
	import('./generated/teacher-info').TeacherInfoFetchPageRequest & {
		page: number;
		size: number;
		keyword?: string;
		cooperationStatus?: TeacherCooperationStatus | string;
		ownerDepartmentId?: number;
	};
export type TeacherInfoInfoQuery = import('./generated/teacher-info').TeacherInfoFetchInfoQuery;
export type TeacherInfoCreatePayload = Partial<TeacherInfoRecord>;
export type TeacherInfoUpdatePayload = Partial<TeacherInfoRecord> & { id: number };
export type TeacherInfoAssignPayload = import('./generated/teacher-info').TeacherInfoAssignRequest;
export type TeacherInfoUpdateStatusPayload =
	import('./generated/teacher-info').TeacherInfoUpdateStatusRequest;
export type TeacherInfoAttributionInfoQuery =
	import('./generated/teacher-info').TeacherInfoFetchAttributionInfoQuery;
export type TeacherInfoAttributionHistoryQuery =
	import('./generated/teacher-info').TeacherInfoFetchAttributionHistoryQuery;

/**
 * 统一班主任资源的标签字段，避免页面层各自兼容 string/string[]/null。
 */
export function normalizeTeacherInfoDomainRecord(record: TeacherInfoRecord): TeacherInfoRecord {
	return {
		...record,
		projectTags: normalizeUnknownStringArray(record.projectTags)
	};
}

export type TeacherFollowRecord = Omit<
	GeneratedTeacherFollowRecord,
	| 'teacherId'
	| 'followTime'
	| 'followMethod'
	| 'content'
	| 'followContent'
	| 'remark'
	| 'nextFollowTime'
	| 'createTime'
	| 'operatorName'
	| 'creatorEmployeeName'
	| 'creatorName'
> & {
	teacherId?: number | null;
	followTime?: string | null;
	followMethod?: string | null;
	content?: string | null;
	followContent?: string | null;
	remark?: string | null;
	nextFollowTime?: string | null;
	createTime?: string | null;
	operatorName?: string | null;
	creatorEmployeeName?: string | null;
	creatorName?: string | null;
	[key: string]: unknown;
};

export type TeacherFollowPageResult = Omit<
	ApiResponseData<GeneratedTeacherFollowPageResponse>,
	'list'
> & {
	list: TeacherFollowRecord[];
};
export type TeacherFollowPageQuery =
	import('./generated/teacher-follow').TeacherFollowFetchPageRequest & {
		page: number;
		size: number;
		teacherId: number;
	};
export type TeacherFollowCreatePayload =
	import('./generated/teacher-follow').TeacherFollowCreateTeacherFollowRequest;

export type TeacherClassRecord = Omit<
	GeneratedTeacherClassRecord,
	| 'teacherId'
	| 'teacherName'
	| 'schoolName'
	| 'grade'
	| 'projectTag'
	| 'studentCount'
	| 'ownerEmployeeId'
	| 'ownerDepartmentId'
	| 'createTime'
	| 'updateTime'
> & {
	teacherId: number | undefined;
	teacherName?: string | null;
	schoolName?: string | null;
	grade?: string | null;
	projectTag?: string | null;
	studentCount?: number | null;
	ownerEmployeeId?: number | null;
	ownerDepartmentId?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
	[key: string]: unknown;
};

export type TeacherClassPageResult = Omit<
	ApiResponseData<GeneratedTeacherClassPageResponse>,
	'list'
> & {
	list: TeacherClassRecord[];
};
export type TeacherClassPageQuery =
	import('./generated/teacher-class').TeacherClassFetchPageRequest & {
		page: number;
		size: number;
		keyword?: string;
		status?: TeacherClassStatus | string;
	};
export type TeacherClassInfoQuery = import('./generated/teacher-class').TeacherClassFetchInfoQuery;
export type TeacherClassCreatePayload = Partial<TeacherClassRecord>;
export type TeacherClassUpdatePayload = Partial<TeacherClassRecord> & { id: number };
export type TeacherClassRemovePayload =
	import('./generated/teacher-class').TeacherClassRemoveTeacherClassRequest;

export type TeacherDashboardDistributionItem = Omit<
	GeneratedTeacherDashboardDistributionItem,
	'key' | 'label' | 'name' | 'status' | 'value' | 'count'
> & {
	key?: string | null;
	label?: string | null;
	name?: string | null;
	status?: string | null;
	value?: number | null;
	count?: number | null;
	[key: string]: unknown;
};

export type TeacherDashboardSummary = Omit<
	ApiResponseData<GeneratedTeacherDashboardSummaryResponse>,
	| 'resourceTotal'
	| 'pendingFollowCount'
	| 'overdueFollowCount'
	| 'partneredCount'
	| 'classCount'
	| 'memberDistribution'
	| 'cooperationDistribution'
	| 'classStatusDistribution'
> & {
	resourceTotal?: number | null;
	pendingFollowCount?: number | null;
	overdueFollowCount?: number | null;
	partneredCount?: number | null;
	classCount?: number | null;
	memberDistribution?: TeacherDashboardDistributionItem[];
	cooperationDistribution?: TeacherDashboardDistributionItem[];
	classStatusDistribution?: TeacherDashboardDistributionItem[];
	[key: string]: unknown;
};
export type TeacherDashboardSummaryQuery =
	import('./generated/teacher-dashboard').TeacherDashboardFetchSummaryQuery;

export type TeacherTodoRecord = Omit<
	GeneratedTeacherTodoRecord,
	| 'teacherId'
	| 'teacherName'
	| 'phone'
	| 'wechat'
	| 'schoolName'
	| 'schoolRegion'
	| 'subject'
	| 'ownerEmployeeName'
	| 'lastFollowTime'
	| 'nextFollowTime'
> & {
	teacherId?: number | null;
	teacherName?: string | null;
	phone?: string | null;
	wechat?: string | null;
	schoolName?: string | null;
	schoolRegion?: string | null;
	subject?: string | null;
	ownerEmployeeName?: string | null;
	lastFollowTime?: string | null;
	nextFollowTime?: string | null;
	[key: string]: unknown;
};

export type TeacherTodoPageResult = Omit<
	ApiResponseData<GeneratedTeacherTodoPageResponse>,
	'list'
> & {
	list: TeacherTodoRecord[];
};
export type TeacherTodoPageQuery =
	import('./generated/teacher-todo').TeacherTodoFetchPageRequest & {
		page: number;
		size: number;
		keyword?: string;
		todoBucket?: TeacherTodoBucket | string;
	};

export type JobStandardRecord = Omit<
	GeneratedJobStandardRecord,
	| 'targetDepartmentId'
	| 'targetDepartmentName'
	| 'jobLevel'
	| 'profileSummary'
	| 'requirementSummary'
	| 'interviewTemplateSummary'
	| 'status'
> & {
	targetDepartmentId: number | undefined;
	targetDepartmentName?: string | null;
	jobLevel?: string | null;
	profileSummary?: string | null;
	requirementSummary?: string | null;
	interviewTemplateSummary?: string | null;
	status?: JobStandardStatus;
};

export type JobStandardPageResult = Omit<
	ApiResponseData<GeneratedJobStandardPageResponse>,
	'list'
> & {
	list: JobStandardRecord[];
};
export interface JobStandardInfoQuery {
	id: number;
}

export interface RecruitmentSourceSnapshot {
	id?: number | null;
	title?: string | null;
	status?: string | null;
	positionName?: string | null;
	phone?: string | null;
	email?: string | null;
	headcount?: number | null;
	startDate?: string | null;
	endDate?: string | null;
	jobLevel?: string | null;
	requirementSummary?: string | null;
	sourceResource?: RecruitmentSourceResource | null;
	jobStandardId?: number | null;
	jobStandardPositionName?: string | null;
	jobStandardRequirementSummary?: string | null;
	talentAssetId?: number | null;
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

function normalizePositiveIntegerOrUndefined(value: unknown): number | undefined {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizePositiveIntegerOrNull(value: unknown): number | null {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeOptionalString(value: unknown): string | null {
	const text = typeof value === 'string' ? value.trim() : String(value || '').trim();
	return text || null;
}

function normalizeUnknownStringArray(value: unknown): string[] {
	const source = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
	return Array.from(new Set(source.map(item => String(item || '').trim()).filter(Boolean)));
}

function normalizeRecruitPlanStatusValue(value: unknown): RecruitPlanStatus | null {
	switch (value) {
		case 'draft':
		case 'active':
		case 'voided':
		case 'closed':
			return value;
		default:
			return null;
	}
}

function normalizeInterviewStatusValue(value: unknown): InterviewStatus | null {
	switch (value) {
		case 'scheduled':
		case 'completed':
		case 'cancelled':
			return value;
		default:
			return null;
	}
}

/**
 * 统一招聘计划的来源快照，避免页面层分别兼容 source/jobStandard summary/snapshot。
 */
export function normalizeRecruitPlanDomainRecord(record: RecruitPlanRecord): RecruitPlanRecord {
	const rawSourceSnapshot =
		record.sourceSnapshot || record.jobStandardSummary || record.jobStandardSnapshot || null;
	const sourceSnapshot =
		rawSourceSnapshot && typeof rawSourceSnapshot === 'object'
			? {
					...rawSourceSnapshot,
					sourceResource: rawSourceSnapshot.sourceResource || 'jobStandard',
					jobStandardId: normalizePositiveIntegerOrNull(
						record.jobStandardId ??
							rawSourceSnapshot.jobStandardId ??
							rawSourceSnapshot.id
					),
					jobStandardPositionName:
						normalizeOptionalString(
							rawSourceSnapshot.jobStandardPositionName ??
								rawSourceSnapshot.positionName ??
								record.jobStandardPositionName ??
								record.positionName
						) || null,
					jobStandardRequirementSummary:
						normalizeOptionalString(
							rawSourceSnapshot.jobStandardRequirementSummary ??
								record.requirementSummary
						) || null,
					targetDepartmentId: normalizePositiveIntegerOrNull(
						rawSourceSnapshot.targetDepartmentId ?? record.targetDepartmentId
					),
					targetPosition:
						normalizeOptionalString(
							rawSourceSnapshot.targetPosition ??
								rawSourceSnapshot.jobStandardPositionName ??
								rawSourceSnapshot.positionName ??
								record.positionName
						) || null
				}
			: null;

	return {
		...record,
		jobStandardId: normalizePositiveIntegerOrUndefined(record.jobStandardId),
		jobStandardPositionName:
			sourceSnapshot?.jobStandardPositionName ??
			normalizeOptionalString(record.jobStandardPositionName),
		jobStandardSummary: sourceSnapshot,
		jobStandardSnapshot: sourceSnapshot,
		sourceSnapshot
	};
}

/**
 * 统一简历池的招聘来源快照，保留招聘计划和职位标准两个来源分支的同一语义。
 */
export function normalizeResumePoolDomainRecord(record: ResumePoolRecord): ResumePoolRecord {
	const rawSourceSnapshot =
		record.sourceSnapshot && typeof record.sourceSnapshot === 'object'
			? record.sourceSnapshot
			: null;
	const recruitPlanSnapshot =
		record.recruitPlanSnapshot && typeof record.recruitPlanSnapshot === 'object'
			? record.recruitPlanSnapshot
			: null;
	const jobStandardSnapshot =
		record.jobStandardSnapshot && typeof record.jobStandardSnapshot === 'object'
			? record.jobStandardSnapshot
			: null;
	const recruitPlanTitle =
		normalizeOptionalString(
			record.recruitPlanTitle ??
				rawSourceSnapshot?.recruitPlanTitle ??
				recruitPlanSnapshot?.recruitPlanTitle ??
				recruitPlanSnapshot?.title
		) || null;
	const jobStandardPositionName =
		normalizeOptionalString(
			record.jobStandardPositionName ??
				rawSourceSnapshot?.jobStandardPositionName ??
				jobStandardSnapshot?.jobStandardPositionName ??
				jobStandardSnapshot?.positionName
		) || null;
	const recruitPlanId = normalizePositiveIntegerOrUndefined(record.recruitPlanId);
	const jobStandardId = normalizePositiveIntegerOrUndefined(record.jobStandardId);
	const sourceSnapshot =
		rawSourceSnapshot ||
		recruitPlanSnapshot ||
		jobStandardSnapshot ||
		recruitPlanTitle ||
		jobStandardPositionName
			? {
					...(rawSourceSnapshot || {}),
					sourceResource:
						rawSourceSnapshot?.sourceResource ||
						(recruitPlanId ? 'recruitPlan' : jobStandardId ? 'jobStandard' : null),
					recruitPlanId: normalizePositiveIntegerOrNull(
						record.recruitPlanId ??
							rawSourceSnapshot?.recruitPlanId ??
							recruitPlanSnapshot?.recruitPlanId ??
							recruitPlanSnapshot?.id
					),
					recruitPlanTitle,
					recruitPlanStatus: normalizeRecruitPlanStatusValue(
						rawSourceSnapshot?.recruitPlanStatus ??
							recruitPlanSnapshot?.recruitPlanStatus ??
							recruitPlanSnapshot?.status
					),
					jobStandardId: normalizePositiveIntegerOrNull(
						record.jobStandardId ??
							rawSourceSnapshot?.jobStandardId ??
							jobStandardSnapshot?.jobStandardId ??
							jobStandardSnapshot?.id
					),
					jobStandardPositionName,
					jobStandardRequirementSummary:
						normalizeOptionalString(
							rawSourceSnapshot?.jobStandardRequirementSummary ??
								jobStandardSnapshot?.jobStandardRequirementSummary
						) || null,
					targetDepartmentId: normalizePositiveIntegerOrNull(
						rawSourceSnapshot?.targetDepartmentId ??
							recruitPlanSnapshot?.targetDepartmentId ??
							jobStandardSnapshot?.targetDepartmentId ??
							record.targetDepartmentId
					),
					targetDepartmentName:
						normalizeOptionalString(
							rawSourceSnapshot?.targetDepartmentName ??
								recruitPlanSnapshot?.targetDepartmentName ??
								jobStandardSnapshot?.targetDepartmentName
						) || null,
					targetPosition:
						normalizeOptionalString(
							rawSourceSnapshot?.targetPosition ??
								record.targetPosition ??
								jobStandardPositionName
						) || null
				}
			: null;

	return {
		...record,
		targetDepartmentId: normalizePositiveIntegerOrUndefined(record.targetDepartmentId),
		resumeText: typeof record.resumeText === 'string' ? record.resumeText : '',
		recruitPlanId,
		jobStandardId,
		recruitPlanTitle,
		jobStandardPositionName,
		sourceSnapshot
	};
}

/**
 * 统一面试记录来源快照，兼容 sourceSnapshot 和招聘链 summary/snapshot 的混合返回。
 */
export function normalizeInterviewDomainRecord(record: InterviewRecord): InterviewRecord {
	const rawSourceSnapshot =
		record.sourceSnapshot && typeof record.sourceSnapshot === 'object'
			? record.sourceSnapshot
			: null;
	const sourceSnapshot = rawSourceSnapshot
		? {
				...rawSourceSnapshot,
				sourceResource:
					rawSourceSnapshot.sourceResource ||
					(rawSourceSnapshot.talentAssetId
						? 'talentAsset'
						: rawSourceSnapshot.resumePoolId
							? 'resumePool'
							: rawSourceSnapshot.recruitPlanId
								? 'recruitPlan'
								: null),
				talentAssetId: normalizePositiveIntegerOrNull(rawSourceSnapshot.talentAssetId),
				resumePoolId: normalizePositiveIntegerOrNull(
					record.resumePoolId ?? rawSourceSnapshot.resumePoolId
				),
				recruitPlanId: normalizePositiveIntegerOrNull(
					record.recruitPlanId ?? rawSourceSnapshot.recruitPlanId
				),
				recruitPlanStatus: normalizeRecruitPlanStatusValue(
					rawSourceSnapshot.recruitPlanStatus
				),
				candidateName:
					normalizeOptionalString(
						rawSourceSnapshot.candidateName ?? record.candidateName
					) || null,
				targetDepartmentId: normalizePositiveIntegerOrNull(
					rawSourceSnapshot.targetDepartmentId ?? record.departmentId
				),
				targetPosition:
					normalizeOptionalString(rawSourceSnapshot.targetPosition ?? record.position) ||
					null,
				interviewStatus: normalizeInterviewStatusValue(
					rawSourceSnapshot.interviewStatus ?? record.status
				)
			}
		: normalizeInterviewSourceSummary(record);

	return {
		...record,
		departmentId: normalizePositiveIntegerOrUndefined(record.departmentId),
		interviewerId: normalizePositiveIntegerOrUndefined(record.interviewerId),
		resumePoolId: normalizePositiveIntegerOrUndefined(
			record.resumePoolId ?? sourceSnapshot?.resumePoolId
		),
		recruitPlanId: normalizePositiveIntegerOrUndefined(
			record.recruitPlanId ?? sourceSnapshot?.recruitPlanId
		),
		sourceSnapshot
	};
}

function normalizeInterviewSourceSummary(
	record: InterviewRecord
): RecruitmentSourceSnapshot | null {
	const resumePoolSummary =
		record.resumePoolSummary && typeof record.resumePoolSummary === 'object'
			? record.resumePoolSummary
			: record.resumePoolSnapshot && typeof record.resumePoolSnapshot === 'object'
				? record.resumePoolSnapshot
				: null;
	if (resumePoolSummary) {
		return {
			sourceResource: 'resumePool',
			resumePoolId: normalizePositiveIntegerOrNull(
				record.resumePoolId ?? resumePoolSummary.resumePoolId ?? resumePoolSummary.id
			),
			recruitPlanId: normalizePositiveIntegerOrNull(
				record.recruitPlanId ?? resumePoolSummary.recruitPlanId
			),
			recruitPlanTitle:
				normalizeOptionalString(
					record.recruitPlanSummary?.title ??
						record.recruitPlanSnapshot?.title ??
						resumePoolSummary.recruitPlanTitle
				) || null,
			candidateName:
				normalizeOptionalString(resumePoolSummary.candidateName ?? record.candidateName) ||
				null,
			targetDepartmentId: normalizePositiveIntegerOrNull(
				resumePoolSummary.targetDepartmentId ?? record.departmentId
			),
			targetDepartmentName:
				normalizeOptionalString(resumePoolSummary.targetDepartmentName) || null,
			targetPosition:
				normalizeOptionalString(resumePoolSummary.targetPosition ?? record.position) || null
		};
	}

	const recruitPlanSummary =
		record.recruitPlanSummary && typeof record.recruitPlanSummary === 'object'
			? record.recruitPlanSummary
			: record.recruitPlanSnapshot && typeof record.recruitPlanSnapshot === 'object'
				? record.recruitPlanSnapshot
				: null;
	if (recruitPlanSummary) {
		return {
			sourceResource: 'recruitPlan',
			recruitPlanId: normalizePositiveIntegerOrNull(
				record.recruitPlanId ?? recruitPlanSummary.recruitPlanId ?? recruitPlanSummary.id
			),
			recruitPlanTitle:
				normalizeOptionalString(
					recruitPlanSummary.recruitPlanTitle ?? recruitPlanSummary.title
				) || null,
			recruitPlanStatus: normalizeRecruitPlanStatusValue(
				recruitPlanSummary.recruitPlanStatus ?? recruitPlanSummary.status
			),
			candidateName: normalizeOptionalString(record.candidateName) || null,
			targetDepartmentId: normalizePositiveIntegerOrNull(
				recruitPlanSummary.targetDepartmentId ?? record.departmentId
			),
			targetDepartmentName:
				normalizeOptionalString(recruitPlanSummary.targetDepartmentName) || null,
			targetPosition:
				normalizeOptionalString(
					recruitPlanSummary.positionName ??
						recruitPlanSummary.targetPosition ??
						record.position
				) || null
		};
	}

	return null;
}

export type PipTrackRecord = GeneratedPipTrackRecord;

export type PipRecord = Omit<
	GeneratedPipRecord,
	'assessmentId' | 'employeeId' | 'ownerId' | 'trackRecords'
> & {
	assessmentId?: number | null;
	employeeId: number | undefined;
	ownerId: number | undefined;
	trackRecords?: PipTrackRecord[];
};

export type PipPageResult = Omit<ApiResponseData<GeneratedPipPageResponse>, 'list'> & {
	list: PipRecord[];
};
export type PipPageQuery = import('./generated/pip').PipFetchPageRequest & {
	page: number;
	size: number;
	keyword?: string;
	employeeId?: number;
	ownerId?: number;
	status?: string;
	assessmentId?: number;
};
export type PipInfoQuery = import('./generated/pip').PipFetchInfoQuery;
export type PipCreatePayload = Partial<PipRecord>;
export type PipUpdatePayload = Partial<PipRecord> & {
	id: number;
};
export type PipStartPayload = import('./generated/pip').PipStartRequest;
export type PipTrackPayload = import('./generated/pip').PipTrackRequest;
export type PipCompletePayload = import('./generated/pip').PipCompleteRequest;
export type PipClosePayload = import('./generated/pip').PipCloseRequest;
export type PipExportQuery = import('./generated/pip').PipExportSummaryRequest & {
	keyword?: string;
	employeeId?: number;
	ownerId?: number;
	status?: string;
	assessmentId?: number;
};

export type PipExportRow = Omit<GeneratedPipExportRow, 'assessmentId'> & {
	assessmentId?: number | null;
};

export type IndicatorCategory = GeneratedIndicatorCategory;
export type IndicatorApplyScope = GeneratedIndicatorApplyScope;
export type IndicatorStatus = GeneratedIndicatorStatus;

export type IndicatorRecord = Omit<GeneratedIndicatorRecord, 'description'> & {
	description?: string | null;
};

export type IndicatorPageResult = Omit<ApiResponseData<GeneratedIndicatorPageResponse>, 'list'> & {
	list: IndicatorRecord[];
};
export interface IndicatorInfoQuery {
	id: number;
}
export type IndicatorRemovePayload = import('./generated/assessment').DeleteIdsRequest;

export type FeedbackRelationType = '上级' | '同级' | '下级' | '协作人';

export type FeedbackTaskRelationItem = Omit<GeneratedFeedbackTaskRelationItem, 'relationType'> & {
	relationType: FeedbackRelationType | string;
};

export type FeedbackRecord = Omit<GeneratedFeedbackRecord, 'relationType'> & {
	relationType: FeedbackRelationType | string;
};

export type FeedbackSummary = Omit<ApiResponseData<GeneratedFeedbackSummaryResponse>, 'records'> & {
	records: FeedbackRecord[];
};

export type FeedbackTaskRecord = Omit<
	GeneratedFeedbackTaskRecord,
	'assessmentId' | 'employeeId' | 'relationTypes'
> & {
	assessmentId?: number | null;
	employeeId: number | undefined;
	relationTypes?: FeedbackTaskRelationItem[];
};

export type FeedbackPageResult = Omit<ApiResponseData<GeneratedFeedbackPageResponse>, 'list'> & {
	list: FeedbackTaskRecord[];
};
export type FeedbackPageQuery = import('./generated/feedback').FeedbackFetchPageRequest & {
	page: number;
	size: number;
	keyword?: string;
	employeeId?: number;
	status?: string;
};
export type FeedbackInfoQuery = import('./generated/feedback').FeedbackFetchInfoQuery;
export type FeedbackSubmitPayload = import('./generated/feedback').FeedbackSubmitFeedbackRequest;
export type FeedbackSummaryQuery = import('./generated/feedback').FeedbackFetchSummaryQuery;

export type FeedbackExportRow = Omit<GeneratedFeedbackExportRow, 'assessmentId'> & {
	assessmentId?: number | null;
};
export type FeedbackExportQuery = import('./generated/feedback').FeedbackExportSummaryRequest & {
	keyword?: string;
	employeeId?: number;
	status?: string;
};

export type SalaryChangeRecord = GeneratedSalaryChangeRecord;

export type SalaryRecord = Omit<
	GeneratedSalaryRecord,
	'employeeId' | 'assessmentId' | 'changeRecords'
> & {
	employeeId: number | undefined;
	assessmentId?: number | null;
	changeRecords?: SalaryChangeRecord[];
};

export type SalaryPageResult = Omit<ApiResponseData<GeneratedSalaryPageResponse>, 'list'> & {
	list: SalaryRecord[];
};
export type SalaryPageQuery = import('./generated/salary').SalaryFetchPageRequest & {
	page: number;
	size: number;
	employeeId?: number;
	status?: string;
	periodValue?: string;
	effectiveDateStart?: string;
	effectiveDateEnd?: string;
};
export type SalaryInfoQuery = import('./generated/salary').SalaryFetchInfoQuery;
export type SalaryCreatePayload = Partial<SalaryRecord>;
export type SalaryUpdatePayload = Partial<SalaryRecord> & {
	id: number;
};
export type SalaryConfirmPayload = import('./generated/salary').SalaryConfirmSalaryRequest;
export type SalaryArchivePayload = import('./generated/salary').SalaryArchiveSalaryRequest;
export type SalaryAddChangePayload = import('./generated/salary').SalaryAddChangeRequest;

export type PromotionReviewRecord = GeneratedPromotionReviewRecord;

export type PromotionRecord = Omit<
	GeneratedPromotionRecord,
	'assessmentId' | 'employeeId' | 'sponsorId' | 'reviewRecords'
> & {
	assessmentId?: number | null | undefined;
	employeeId: number | undefined;
	sponsorId: number | undefined;
	reviewRecords?: PromotionReviewRecord[];
};

export type PromotionPageResult = Omit<ApiResponseData<GeneratedPromotionPageResponse>, 'list'> & {
	list: PromotionRecord[];
};
export type PromotionPageQuery = import('./generated/promotion').PromotionFetchPageRequest & {
	page: number;
	size: number;
	employeeId?: number;
	assessmentId?: number;
	status?: string;
	toPosition?: string;
};
export type PromotionInfoQuery = import('./generated/promotion').PromotionFetchInfoQuery;
export type PromotionCreatePayload = Partial<PromotionRecord>;
export type PromotionUpdatePayload = Partial<PromotionRecord> & {
	id: number;
};
export type PromotionSubmitPayload = import('./generated/promotion').PromotionSubmitRequest;
export type PromotionReviewPayload = import('./generated/promotion').PromotionReviewRequest;

export type SuggestionType = GeneratedSuggestionType;
export type SuggestionStatus = GeneratedSuggestionStatus;
export type SuggestionRevokeReasonCode = GeneratedSuggestionRevokeReasonCode;

export type SuggestionRecord = Omit<
	GeneratedSuggestionRecord,
	'handlerId' | 'handlerName' | 'linkedEntityType' | 'linkedEntityId'
> & {
	handlerId?: number | null;
	handlerName?: string | null;
	linkedEntityType?: string | null;
	linkedEntityId?: number | null;
};

export type SuggestionPageResult = Omit<
	ApiResponseData<GeneratedSuggestionPageResponse>,
	'list'
> & {
	list: SuggestionRecord[];
};
export type SuggestionPageQuery = import('./generated/suggestion').SuggestionFetchPageRequest & {
	page: number;
	size: number;
	suggestionType?: SuggestionType | string;
	status?: SuggestionStatus | string;
	employeeId?: number;
	departmentId?: number;
	assessmentId?: number;
	periodValue?: string;
};
export type SuggestionInfoQuery = import('./generated/suggestion').SuggestionFetchInfoQuery;
export type SuggestionAcceptPayload = import('./generated/suggestion').SuggestionAcceptRequest;
export type SuggestionIgnorePayload = import('./generated/suggestion').SuggestionIgnoreRequest;
export type SuggestionRejectPayload = import('./generated/suggestion').SuggestionRejectRequest;
export type SuggestionRevokePayload = import('./generated/suggestion').SuggestionRevokeRequest;

export type SuggestionAcceptResult = Omit<
	ApiResponseData<GeneratedSuggestionAcceptResponse>,
	'suggestion'
> & {
	suggestion?: SuggestionRecord;
};

export type AssetStatus = GeneratedAssetStatus;
export type AssetAssignmentStatus = GeneratedAssetAssignmentStatus;
export type AssetAssignmentRequestStatus = GeneratedAssetAssignmentRequestStatus;
export type AssetAssignmentRequestLevel = GeneratedAssetAssignmentRequestLevel;
export type AssetAssignmentRequestType = GeneratedAssetAssignmentRequestType;
export type AssetMaintenanceStatus = GeneratedAssetMaintenanceStatus;
export type AssetProcurementStatus = GeneratedAssetProcurementStatus;
export type AssetTransferStatus = GeneratedAssetTransferStatus;
export type AssetInventoryStatus = GeneratedAssetInventoryStatus;
export type AssetDisposalStatus = GeneratedAssetDisposalStatus;

export type AssetStatusDistributionItem = GeneratedAssetStatusDistributionItem;

export type AssetCategoryDistributionItem = GeneratedAssetCategoryDistributionItem;

export type AssetDashboardActivityItem = Omit<
	GeneratedAssetDashboardActivityItem,
	'assetId' | 'departmentId' | 'documentKey'
> & {
	assetId?: number | null;
	departmentId?: number | null;
	documentKey?: string | null;
};

export type AssetDashboardActionSummaryItem = GeneratedAssetDashboardActionSummaryItem;

export type AssetDashboardSummary = Omit<
	ApiResponseData<GeneratedAssetDashboardSummaryResponse>,
	| 'statusDistribution'
	| 'categoryDistribution'
	| 'actionOverview'
	| 'actionTimeline'
	| 'recentActivities'
> & {
	statusDistribution: AssetStatusDistributionItem[];
	categoryDistribution: AssetCategoryDistributionItem[];
	actionOverview: {
		today: AssetDashboardActionSummaryItem;
		thisWeek: AssetDashboardActionSummaryItem;
		thisMonth: AssetDashboardActionSummaryItem;
	};
	actionTimeline: AssetDashboardActivityItem[];
	recentActivities: AssetDashboardActivityItem[];
};

export type AssetInfoRecord = Omit<GeneratedAssetInfoRecord, 'supplierId' | 'purchaseOrderId'> & {
	supplierId?: number | null | undefined;
	purchaseOrderId?: number | null | undefined;
};

export type AssetInfoPageResult = Omit<ApiResponseData<GeneratedAssetInfoPageResponse>, 'list'> & {
	list: AssetInfoRecord[];
};
export type AssetInfoPageQuery = import('./generated/asset-info').AssetInfoFetchPageRequest;
export type AssetInfoInfoQuery = import('./generated/asset-info').AssetInfoFetchInfoQuery;
export type AssetInfoCreatePayload = Partial<AssetInfoRecord>;
export type AssetInfoUpdatePayload = Partial<AssetInfoRecord> & {
	id: number;
};
export type AssetInfoRemovePayload = import('./generated/asset-info').AssetInfoRemoveAssetRequest;
export type AssetInfoUpdateStatusPayload =
	import('./generated/asset-info').AssetInfoUpdateAssetStatusRequest;

export type AssetAssignmentRecord = GeneratedAssetAssignmentRecord;

export type AssetAssignmentPageResult = Omit<
	ApiResponseData<GeneratedAssetAssignmentPageResponse>,
	'list'
> & {
	list: AssetAssignmentRecord[];
};
export type AssetAssignmentPageQuery =
	import('./generated/asset-assignment').AssetAssignmentFetchPageRequest;
export type AssetAssignmentCreatePayload =
	import('./generated/asset-assignment').AssetAssignmentCreateAssignmentRequest;
export type AssetAssignmentUpdatePayload =
	import('./generated/asset-assignment').AssetAssignmentUpdateAssignmentRequest;
export type AssetAssignmentReturnPayload =
	import('./generated/asset-assignment').AssetAssignmentReturnAssetRequest;
export type AssetAssignmentMarkLostPayload =
	import('./generated/asset-assignment').AssetAssignmentMarkLostRequest;
export type AssetAssignmentRemovePayload =
	import('./generated/asset-assignment').AssetAssignmentRemoveAssignmentRequest;

export type AssetAssignmentRequestRecord = GeneratedAssetAssignmentRequestRecord;

export type AssetAssignmentRequestPageResult = Omit<
	ApiResponseData<GeneratedAssetAssignmentRequestPageResponse>,
	'list'
> & {
	list: AssetAssignmentRequestRecord[];
};
export type AssetAssignmentRequestPageQuery =
	import('./generated/asset-assignment-request').AssetAssignmentRequestFetchPageRequest;
export type AssetAssignmentRequestInfoQuery =
	import('./generated/asset-assignment-request').AssetAssignmentRequestFetchInfoQuery;
export type AssetAssignmentRequestCreatePayload =
	import('./generated/asset-assignment-request').AssetAssignmentRequestCreateDraftRequest;
export type AssetAssignmentRequestUpdatePayload =
	import('./generated/asset-assignment-request').AssetAssignmentRequestUpdateDraftRequest;
export type AssetAssignmentRequestSubmitPayload =
	import('./generated/asset-assignment-request').AssetAssignmentRequestSubmitRequestRequest;
export type AssetAssignmentRequestWithdrawPayload =
	import('./generated/asset-assignment-request').AssetAssignmentRequestWithdrawRequestRequest;
export type AssetAssignmentRequestAssignPayload =
	import('./generated/asset-assignment-request').AssetAssignmentRequestAssignAssetRequest;
export type AssetAssignmentRequestCancelPayload =
	import('./generated/asset-assignment-request').AssetAssignmentRequestCancelRequestRequest;

export type AssetMaintenanceRecord = GeneratedAssetMaintenanceRecord;

export type AssetMaintenancePageResult = Omit<
	ApiResponseData<GeneratedAssetMaintenancePageResponse>,
	'list'
> & {
	list: AssetMaintenanceRecord[];
};
export type AssetMaintenancePageQuery =
	import('./generated/asset-maintenance').AssetMaintenanceFetchPageRequest;
export type AssetMaintenanceCreatePayload =
	import('./generated/asset-maintenance').AssetMaintenanceCreateMaintenanceRequest;
export type AssetMaintenanceUpdatePayload =
	import('./generated/asset-maintenance').AssetMaintenanceUpdateMaintenanceRequest;
export type AssetMaintenanceCompletePayload =
	import('./generated/asset-maintenance').AssetMaintenanceCompleteMaintenanceRequest;
export type AssetMaintenanceCancelPayload =
	import('./generated/asset-maintenance').AssetMaintenanceCancelMaintenanceRequest;
export type AssetMaintenanceRemovePayload =
	import('./generated/asset-maintenance').AssetMaintenanceRemoveMaintenanceRequest;

export type AssetProcurementRecord = Omit<
	GeneratedAssetProcurementRecord,
	'supplierId' | 'purchaseOrderId'
> & {
	supplierId?: number | null | undefined;
	purchaseOrderId?: number | null | undefined;
};

export type AssetProcurementPageResult = Omit<
	ApiResponseData<GeneratedAssetProcurementPageResponse>,
	'list'
> & {
	list: AssetProcurementRecord[];
};
export type AssetProcurementPageQuery =
	import('./generated/asset-procurement').AssetProcurementFetchPageRequest;
export type AssetProcurementInfoQuery =
	import('./generated/asset-procurement').AssetProcurementFetchInfoQuery;
export type AssetProcurementCreatePayload = Partial<AssetProcurementRecord>;
export type AssetProcurementUpdatePayload = Partial<AssetProcurementRecord> & {
	id: number;
};
export type AssetProcurementSubmitPayload =
	import('./generated/asset-procurement').AssetProcurementSubmitProcurementRequest;
export type AssetProcurementReceivePayload =
	import('./generated/asset-procurement').AssetProcurementReceiveProcurementRequest;
export type AssetProcurementCancelPayload =
	import('./generated/asset-procurement').AssetProcurementCancelProcurementRequest;

export type AssetTransferRecord = GeneratedAssetTransferRecord;

export type AssetTransferPageResult = Omit<
	ApiResponseData<GeneratedAssetTransferPageResponse>,
	'list'
> & {
	list: AssetTransferRecord[];
};
export type AssetTransferPageQuery =
	import('./generated/asset-transfer').AssetTransferFetchPageRequest;
export type AssetTransferInfoQuery =
	import('./generated/asset-transfer').AssetTransferFetchInfoQuery;
export type AssetTransferCreatePayload =
	import('./generated/asset-transfer').AssetTransferCreateTransferRequest;
export type AssetTransferUpdatePayload =
	import('./generated/asset-transfer').AssetTransferUpdateTransferRequest;
export type AssetTransferSubmitPayload =
	import('./generated/asset-transfer').AssetTransferSubmitTransferRequest;
export type AssetTransferCompletePayload =
	import('./generated/asset-transfer').AssetTransferCompleteTransferRequest;
export type AssetTransferCancelPayload =
	import('./generated/asset-transfer').AssetTransferCancelTransferRequest;

export type AssetInventoryRecord = GeneratedAssetInventoryRecord;

export type AssetInventoryPageResult = Omit<
	ApiResponseData<GeneratedAssetInventoryPageResponse>,
	'list'
> & {
	list: AssetInventoryRecord[];
};
export type AssetInventoryPageQuery =
	import('./generated/asset-inventory').AssetInventoryFetchPageRequest;
export type AssetInventoryInfoQuery =
	import('./generated/asset-inventory').AssetInventoryFetchInfoQuery;
export type AssetInventoryCreatePayload =
	import('./generated/asset-inventory').AssetInventoryCreateInventoryRequest;
export type AssetInventoryUpdatePayload =
	import('./generated/asset-inventory').AssetInventoryUpdateInventoryRequest;
export type AssetInventoryStartPayload =
	import('./generated/asset-inventory').AssetInventoryStartInventoryRequest;
export type AssetInventoryCompletePayload =
	import('./generated/asset-inventory').AssetInventoryCompleteInventoryRequest;
export type AssetInventoryClosePayload =
	import('./generated/asset-inventory').AssetInventoryCloseInventoryRequest;

export type AssetDepreciationSummary = ApiResponseData<GeneratedAssetDepreciationSummaryResponse>;

export type AssetDepreciationRecord = GeneratedAssetDepreciationRecord;

export type AssetDepreciationPageResult = Omit<
	ApiResponseData<GeneratedAssetDepreciationPageResponse>,
	'list'
> & {
	list: AssetDepreciationRecord[];
};
export type AssetDepreciationPageQuery =
	import('./generated/asset-depreciation').AssetDepreciationFetchPageRequest;
export type AssetDepreciationSummaryQuery =
	import('./generated/asset-depreciation').AssetDepreciationFetchSummaryQuery;
export type AssetDepreciationRecalculatePayload =
	import('./generated/asset-depreciation').AssetDepreciationRecalculateRequest;

export type AssetDisposalRecord = GeneratedAssetDisposalRecord;

export type AssetDisposalPageResult = Omit<
	ApiResponseData<GeneratedAssetDisposalPageResponse>,
	'list'
> & {
	list: AssetDisposalRecord[];
};
export type AssetDisposalPageQuery =
	import('./generated/asset-disposal').AssetDisposalFetchPageRequest;
export type AssetDisposalInfoQuery =
	import('./generated/asset-disposal').AssetDisposalFetchInfoQuery;
export type AssetDisposalCreatePayload =
	import('./generated/asset-disposal').AssetDisposalCreateDisposalRequest;
export type AssetDisposalUpdatePayload =
	import('./generated/asset-disposal').AssetDisposalUpdateDisposalRequest;
export type AssetDisposalSubmitPayload =
	import('./generated/asset-disposal').AssetDisposalSubmitDisposalRequest;
export type AssetDisposalApprovePayload =
	import('./generated/asset-disposal').AssetDisposalApproveDisposalRequest;
export type AssetDisposalExecutePayload =
	import('./generated/asset-disposal').AssetDisposalExecuteDisposalRequest;
export type AssetDisposalCancelPayload =
	import('./generated/asset-disposal').AssetDisposalCancelDisposalRequest;

export type AssetReportSummary = ApiResponseData<GeneratedAssetReportSummaryResponse>;
export type AssetReportSummaryQuery =
	import('./generated/asset-report').AssetReportFetchSummaryQuery & {
		keyword?: string;
	};

export type AssetReportRecord = GeneratedAssetReportRecord;

export type AssetReportPageResult = Omit<
	ApiResponseData<GeneratedAssetReportPageResponse>,
	'list'
> & {
	list: AssetReportRecord[];
};
export type AssetReportPageQuery = import('./generated/asset-report').AssetReportFetchPageRequest;
export type AssetReportExportQuery =
	import('./generated/asset-report').AssetReportExportReportQuery & {
		keyword?: string;
	};
export type AssetReportExportResult = AssetReportRecord[];

export type MaterialCatalogStatus = GeneratedMaterialCatalogStatus;
export type MaterialStockStatus = GeneratedMaterialStockStatus;
export type MaterialInboundStatus = GeneratedMaterialInboundStatus;
export type MaterialIssueStatus = GeneratedMaterialIssueStatus;

export type MaterialCatalogRecord = Omit<
	GeneratedMaterialCatalogRecord,
	'category' | 'specification' | 'remark'
> & {
	category?: string | null;
	specification?: string | null;
	remark?: string | null;
};

export type MaterialCatalogPageResult = Omit<
	ApiResponseData<GeneratedMaterialCatalogPageResponse>,
	'list'
> & {
	list: MaterialCatalogRecord[];
};
export type MaterialCatalogPageQuery =
	import('./generated/material-catalog').MaterialCatalogFetchPageRequest;
export type MaterialCatalogInfoQuery =
	import('./generated/material-catalog').MaterialCatalogFetchInfoQuery;
export type MaterialCatalogCreatePayload = Partial<MaterialCatalogRecord>;
export type MaterialCatalogUpdatePayload = Partial<MaterialCatalogRecord> & {
	id: number;
};
export type MaterialCatalogRemovePayload =
	import('./generated/material-catalog').MaterialCatalogRemoveMaterialRequest;

export type MaterialStockRecord = Omit<
	GeneratedMaterialStockRecord,
	'category' | 'specification' | 'lastInboundTime' | 'lastIssueTime'
> & {
	category?: string | null;
	specification?: string | null;
	lastInboundTime?: string | null;
	lastIssueTime?: string | null;
};

export type MaterialStockPageResult = Omit<
	ApiResponseData<GeneratedMaterialStockPageResponse>,
	'list'
> & {
	list: MaterialStockRecord[];
};
export type MaterialStockPageQuery =
	import('./generated/material-stock').MaterialStockFetchPageRequest;
export type MaterialStockInfoQuery =
	import('./generated/material-stock').MaterialStockFetchInfoQuery;

export type MaterialInboundRecord = Omit<
	GeneratedMaterialInboundRecord,
	| 'category'
	| 'specification'
	| 'sourceType'
	| 'sourceBizId'
	| 'submittedAt'
	| 'receivedBy'
	| 'receivedAt'
	| 'remark'
> & {
	category?: string | null;
	specification?: string | null;
	sourceType?: string | null;
	sourceBizId?: string | null;
	submittedAt?: string | null;
	receivedBy?: number | null;
	receivedAt?: string | null;
	remark?: string | null;
};

export type MaterialInboundPageResult = Omit<
	ApiResponseData<GeneratedMaterialInboundPageResponse>,
	'list'
> & {
	list: MaterialInboundRecord[];
};
export type MaterialInboundPageQuery =
	import('./generated/material-inbound').MaterialInboundFetchPageRequest;
export type MaterialInboundInfoQuery =
	import('./generated/material-inbound').MaterialInboundFetchInfoQuery;
export type MaterialInboundCreatePayload = Partial<MaterialInboundRecord>;
export type MaterialInboundUpdatePayload = Partial<MaterialInboundRecord> & {
	id: number;
};
export type MaterialInboundSubmitPayload =
	import('./generated/material-inbound').MaterialInboundSubmitInboundRequest;
export type MaterialInboundReceivePayload =
	import('./generated/material-inbound').MaterialInboundReceiveInboundRequest;
export type MaterialInboundCancelPayload =
	import('./generated/material-inbound').MaterialInboundCancelInboundRequest;

export type MaterialIssueRecord = Omit<
	GeneratedMaterialIssueRecord,
	| 'category'
	| 'specification'
	| 'purpose'
	| 'issueDate'
	| 'submittedAt'
	| 'issuedBy'
	| 'issuedAt'
	| 'remark'
> & {
	category?: string | null;
	specification?: string | null;
	purpose?: string | null;
	issueDate?: string | null;
	submittedAt?: string | null;
	issuedBy?: number | null;
	issuedAt?: string | null;
	remark?: string | null;
};

export type MaterialIssuePageResult = Omit<
	ApiResponseData<GeneratedMaterialIssuePageResponse>,
	'list'
> & {
	list: MaterialIssueRecord[];
};
export type MaterialIssuePageQuery =
	import('./generated/material-issue').MaterialIssueFetchPageRequest;
export type MaterialIssueInfoQuery =
	import('./generated/material-issue').MaterialIssueFetchInfoQuery;
export type MaterialIssueCreatePayload = Partial<MaterialIssueRecord>;
export type MaterialIssueUpdatePayload = Partial<MaterialIssueRecord> & {
	id: number;
};
export type MaterialIssueSubmitPayload =
	import('./generated/material-issue').MaterialIssueSubmitIssueRequest;
export type MaterialIssueActionPayload =
	import('./generated/material-issue').MaterialIssueIssueMaterialRequest;
export type MaterialIssueCancelPayload =
	import('./generated/material-issue').MaterialIssueCancelIssueRequest;

export function createEmptyMaterialCatalog(): MaterialCatalogRecord {
	return {
		code: '',
		materialNo: '',
		name: '',
		category: '',
		specification: '',
		unit: '',
		safetyStock: 0,
		referenceUnitCost: 0,
		status: 'active',
		remark: ''
	};
}

export function createEmptyMaterialStock(): MaterialStockRecord {
	return {
		stockId: undefined,
		catalogId: undefined,
		materialId: undefined,
		departmentId: undefined,
		materialCode: '',
		materialNo: '',
		materialName: '',
		category: '',
		specification: '',
		unit: '',
		currentQty: 0,
		availableQty: 0,
		reservedQty: 0,
		issuedQty: 0,
		safetyStock: 0,
		status: 'active',
		stockStatus: 'sufficient',
		lastUnitCost: 0,
		stockAmount: 0,
		isLowStock: false,
		lastInboundTime: '',
		lastIssueTime: ''
	};
}

export function createEmptyMaterialInbound(): MaterialInboundRecord {
	return {
		title: '',
		catalogId: undefined,
		materialId: undefined,
		departmentId: undefined,
		materialCode: '',
		materialNo: '',
		materialName: '',
		category: '',
		specification: '',
		unit: '',
		quantity: 1,
		unitCost: 0,
		unitPrice: 0,
		amount: 0,
		totalAmount: 0,
		sourceType: '',
		sourceBizId: '',
		remark: '',
		status: 'draft'
	};
}

export function createEmptyMaterialIssue(): MaterialIssueRecord {
	return {
		title: '',
		catalogId: undefined,
		materialId: undefined,
		departmentId: undefined,
		materialCode: '',
		materialNo: '',
		materialName: '',
		category: '',
		specification: '',
		unit: '',
		quantity: 1,
		assigneeId: undefined,
		assigneeName: '',
		issueDate: '',
		submittedAt: '',
		issuedBy: null,
		issuedByName: '',
		issuedAt: '',
		purpose: '',
		remark: '',
		status: 'draft'
	};
}

export function createEmptyAssessment(): AssessmentDraft {
	return {
		employeeId: undefined,
		assessorId: undefined,
		departmentId: undefined,
		periodType: 'quarter',
		periodValue: '',
		targetCompletion: 0,
		selfEvaluation: '',
		scoreItems: [
			{
				indicatorName: '',
				score: 0,
				weight: 100,
				comment: ''
			}
		]
	};
}

export function createEmptyGoal(): GoalDraft {
	return {
		employeeId: undefined,
		departmentId: undefined,
		title: '',
		description: '',
		targetValue: 0,
		currentValue: 0,
		unit: '',
		weight: 0,
		startDate: '',
		endDate: ''
	};
}

export function createEmptyGoalOpsDepartmentConfig(): GoalOpsDepartmentConfig {
	return {
		departmentId: undefined,
		departmentName: '',
		assignTime: '09:00',
		submitDeadline: '18:00',
		reportSendTime: '18:30',
		reportPushMode: 'system_and_group',
		reportPushTarget: ''
	};
}

export function createEmptyGoalOpsAccessProfile(): GoalOpsAccessProfile {
	return {
		departmentId: null,
		activePersonaKey: null,
		roleKind: 'unsupported',
		scopeKey: 'self',
		isHr: false,
		canManageDepartment: false,
		canMaintainPersonalPlan: false,
		manageableDepartmentIds: []
	};
}

export function createEmptyGoalOpsPlan(currentUserId?: number): GoalOpsPlanRecord {
	return {
		employeeId: currentUserId,
		departmentId: undefined,
		periodType: 'day',
		planDate: '',
		periodStartDate: '',
		periodEndDate: '',
		sourceType: 'public',
		title: '',
		description: '',
		targetValue: 0,
		actualValue: 0,
		unit: '',
		status: 'assigned',
		parentPlanId: null,
		isSystemGenerated: false
	};
}

export function createEmptyRecruitPlan(): RecruitPlanRecord {
	return {
		title: '',
		targetDepartmentId: undefined,
		positionName: '',
		headcount: 1,
		startDate: '',
		endDate: '',
		recruiterId: undefined,
		requirementSummary: '',
		jobStandardId: undefined,
		jobStandardPositionName: '',
		jobStandardSummary: null,
		jobStandardSnapshot: null,
		sourceSnapshot: null,
		status: 'draft'
	};
}

export function createEmptyContract(): ContractRecord {
	return {
		employeeId: undefined,
		type: 'full-time',
		title: '',
		contractNumber: '',
		startDate: '',
		endDate: '',
		probationPeriod: null,
		salary: null,
		position: '',
		departmentId: undefined,
		status: 'draft'
	};
}

export function createEmptyPurchaseOrder(): PurchaseOrderRecord {
	return {
		orderNo: '',
		title: '',
		supplierId: undefined,
		departmentId: undefined,
		requesterId: undefined,
		orderDate: '',
		expectedDeliveryDate: '',
		totalAmount: 0,
		currency: 'CNY',
		approvedBy: '',
		approvedAt: '',
		approvalRemark: '',
		closedReason: '',
		receivedQuantity: 0,
		receivedAt: '',
		items: [createEmptyPurchaseOrderItem()],
		inquiryRecords: [],
		approvalLogs: [],
		receiptRecords: [],
		remark: '',
		status: 'draft'
	};
}

export function createEmptyPurchaseOrderItem(): PurchaseOrderItemRecord {
	return {
		itemName: '',
		specification: '',
		unit: '',
		quantity: 1,
		unitPrice: 0,
		amount: 0,
		remark: ''
	};
}

export function createEmptySupplier(): SupplierRecord {
	return {
		name: '',
		code: '',
		category: '',
		contactName: '',
		contactPhone: '',
		contactEmail: '',
		bankAccount: '',
		taxNo: '',
		remark: '',
		status: 'active'
	};
}

export function createEmptyCapabilityModel(): CapabilityModelRecord {
	return {
		name: '',
		code: '',
		category: '',
		description: '',
		status: 'draft',
		itemCount: 0
	};
}

export function createEmptyCertificate(): CertificateRecord {
	return {
		name: '',
		code: '',
		category: '',
		issuer: '',
		description: '',
		validityMonths: null,
		sourceCourseId: null,
		status: 'draft',
		issuedCount: 0
	};
}

export function createEmptyCourse(): CourseRecord {
	return {
		title: '',
		code: '',
		category: '',
		description: '',
		startDate: '',
		endDate: '',
		status: 'draft',
		enrollmentCount: 0
	};
}

export function createEmptyDocumentCenter(): DocumentCenterRecord {
	return {
		fileNo: '',
		fileName: '',
		category: 'policy',
		fileType: 'pdf',
		storage: 'local',
		confidentiality: 'internal',
		ownerName: '',
		department: '',
		status: 'draft',
		version: 'v1.0.0',
		sizeMb: 0,
		downloadCount: 0,
		expireDate: '',
		tags: [],
		notes: ''
	};
}

export function createEmptyDocumentCenterForm(): DocumentCenterFormModel {
	const record = createEmptyDocumentCenter();
	return {
		fileNo: record.fileNo,
		fileName: record.fileName,
		category: record.category,
		fileType: record.fileType,
		storage: record.storage,
		confidentiality: record.confidentiality,
		ownerName: record.ownerName,
		department: record.department,
		status: record.status || 'draft',
		version: record.version,
		sizeMb: Number(record.sizeMb || 0),
		expireDate: record.expireDate || '',
		tagsText: '',
		notes: record.notes || ''
	};
}

export function createEmptyDocumentCenterStats(): DocumentCenterStats {
	return {
		total: 0,
		publishedCount: 0,
		reviewCount: 0,
		archivedCount: 0,
		totalSizeMb: 0,
		totalDownloads: 0
	};
}

export function createEmptyKnowledgeBase(): KnowledgeBaseRecord {
	return {
		kbNo: '',
		title: '',
		category: '',
		summary: '',
		ownerName: '',
		status: 'draft',
		tags: [],
		relatedFileIds: [],
		relatedTopics: [],
		importance: 60,
		viewCount: 0
	};
}

export function createEmptyKnowledgeBaseForm(): KnowledgeBaseFormModel {
	const record = createEmptyKnowledgeBase();
	return {
		kbNo: record.kbNo,
		title: record.title,
		category: record.category,
		summary: record.summary,
		ownerName: record.ownerName,
		status: record.status || 'draft',
		importance: Number(record.importance || 0),
		tagsText: '',
		relatedTopicsText: '',
		relatedFileIds: []
	};
}

export function createEmptyKnowledgeBaseStats(): KnowledgeBaseStats {
	return {
		total: 0,
		publishedCount: 0,
		draftCount: 0,
		fileLinkedCount: 0,
		avgImportance: 0,
		topicCount: 0
	};
}

export function createEmptyKnowledgeQa(): KnowledgeQaRecord {
	return {
		question: '',
		answer: '',
		relatedKnowledgeIds: [],
		relatedFileIds: []
	};
}

export function createEmptyKnowledgeQaForm(): KnowledgeQaFormModel {
	const record = createEmptyKnowledgeQa();
	return {
		question: record.question,
		answer: record.answer,
		relatedKnowledgeIds: record.relatedKnowledgeIds || [],
		relatedFileIds: record.relatedFileIds || []
	};
}

export function createEmptyKnowledgeSearchResult(): KnowledgeSearchResult {
	return {
		total: 0,
		knowledge: [],
		files: [],
		qas: []
	};
}

export function createEmptyHiring(): HiringFormRecord {
	return {
		candidateName: '',
		targetDepartmentId: undefined,
		targetPosition: '',
		sourceType: 'manual',
		sourceId: undefined,
		interviewId: undefined,
		resumePoolId: undefined,
		recruitPlanId: undefined,
		sourceStatusSnapshot: '',
		sourceSnapshot: null,
		interviewSnapshot: null,
		resumePoolSnapshot: null,
		recruitPlanSnapshot: null,
		hiringDecision: '',
		decisionContent: '',
		status: 'offered',
		closeReason: ''
	};
}

export function createEmptyInterview(): InterviewRecord {
	return {
		candidateName: '',
		position: '',
		departmentId: undefined,
		interviewerId: undefined,
		interviewDate: '',
		interviewType: 'technical',
		score: null,
		resumePoolId: undefined,
		recruitPlanId: undefined,
		sourceSnapshot: null,
		resumePoolSnapshot: null,
		recruitPlanSnapshot: null,
		status: 'scheduled'
	};
}

export function createEmptyResumePool(): ResumePoolRecord {
	return {
		candidateName: '',
		targetDepartmentId: undefined,
		targetPosition: '',
		phone: '',
		email: '',
		resumeText: '',
		sourceType: 'manual',
		sourceRemark: '',
		externalLink: '',
		recruitPlanId: undefined,
		recruitPlanTitle: '',
		jobStandardId: undefined,
		jobStandardPositionName: '',
		sourceSnapshot: null,
		recruitPlanSnapshot: null,
		jobStandardSnapshot: null,
		attachmentIdList: [],
		attachmentSummaryList: [],
		status: 'new'
	};
}

export function createEmptyMeeting(currentUserId?: number): MeetingRecord {
	return {
		title: '',
		code: '',
		type: '',
		description: '',
		startDate: '',
		endDate: '',
		location: '',
		organizerId: currentUserId || undefined,
		participantIds: [],
		participantCount: 0,
		status: 'scheduled'
	};
}

export function createEmptyTalentAsset(): TalentAssetRecord {
	return {
		candidateName: '',
		code: '',
		targetDepartmentId: undefined,
		targetPosition: '',
		source: '',
		tagList: [],
		followUpSummary: '',
		nextFollowUpDate: '',
		status: 'new'
	};
}

export function createEmptyWorkPlan(): WorkPlanRecord {
	return {
		title: '',
		description: '',
		ownerDepartmentId: undefined,
		ownerId: undefined,
		assigneeIds: [],
		assigneeList: [],
		assigneeNames: [],
		priority: 'medium',
		plannedStartDate: '',
		plannedEndDate: '',
		status: 'draft',
		progressSummary: '',
		resultSummary: '',
		sourceType: 'manual',
		sourceBizType: '',
		sourceBizId: '',
		sourceTitle: '',
		sourceStatus: 'none',
		externalInstanceId: '',
		externalProcessCode: '',
		approvalFinishedAt: '',
		sourceSnapshot: null
	};
}

export function createEmptyTeacherInfo(): TeacherInfoRecord {
	return {
		teacherName: '',
		phone: '',
		wechat: '',
		schoolName: '',
		schoolRegion: '',
		schoolType: '',
		grade: '',
		className: '',
		subject: '',
		projectTags: [],
		intentionLevel: '',
		communicationStyle: '',
		cooperationStatus: 'uncontacted',
		ownerEmployeeId: undefined,
		nextFollowTime: ''
	};
}

export function createEmptyTeacherFollow(): TeacherFollowRecord {
	return {
		teacherId: undefined,
		content: '',
		nextFollowTime: ''
	};
}

export function createEmptyTeacherClass(): TeacherClassRecord {
	return {
		teacherId: undefined,
		className: '',
		schoolName: '',
		grade: '',
		projectTag: '',
		studentCount: 0,
		status: 'draft'
	};
}

export function createEmptyTeacherAgent(): TeacherAgentRecord {
	return {
		name: '',
		agentType: 'institution',
		level: '',
		region: '',
		cooperationStatus: '',
		status: 'active',
		blacklistStatus: 'normal',
		remark: ''
	};
}

export function createEmptyTeacherAgentRelation(): TeacherAgentRelationRecord {
	return {
		parentAgentId: undefined,
		childAgentId: undefined,
		status: 'active',
		effectiveTime: '',
		remark: ''
	};
}

export function createEmptyTeacherAttribution(): TeacherAttributionRecord {
	return {
		teacherId: undefined,
		teacherName: '',
		agentId: undefined,
		agentName: '',
		attributionType: 'manual',
		status: 'pending',
		sourceType: 'manual',
		sourceRemark: '',
		effectiveTime: ''
	};
}

export function createEmptyJobStandard(): JobStandardRecord {
	return {
		positionName: '',
		targetDepartmentId: undefined,
		jobLevel: '',
		profileSummary: '',
		requirementSummary: '',
		skillTagList: [],
		interviewTemplateSummary: '',
		status: 'draft'
	};
}

export function createEmptyPip(): PipRecord {
	return {
		suggestionId: undefined,
		assessmentId: null,
		employeeId: undefined,
		ownerId: undefined,
		title: '',
		improvementGoal: '',
		sourceReason: '',
		startDate: '',
		endDate: '',
		status: 'draft',
		resultSummary: '',
		trackRecords: []
	};
}

export function createEmptyIndicator(): IndicatorRecord {
	return {
		name: '',
		code: '',
		category: 'assessment',
		weight: 0,
		scoreScale: 100,
		applyScope: 'all',
		description: '',
		status: 1
	};
}

export function createEmptyFeedbackTask(): FeedbackTaskRecord {
	return {
		assessmentId: null,
		employeeId: undefined,
		title: '',
		deadline: '',
		feedbackUserIds: [],
		relationTypes: []
	};
}

export function createEmptySalary(): SalaryRecord {
	return {
		employeeId: undefined,
		assessmentId: null,
		periodValue: '',
		baseSalary: 0,
		performanceBonus: 0,
		adjustAmount: 0,
		finalAmount: 0,
		effectiveDate: '',
		changeRecords: []
	};
}

export function createEmptyPromotion(currentUserId?: number): PromotionRecord {
	return {
		suggestionId: undefined,
		assessmentId: undefined,
		employeeId: undefined,
		sponsorId: currentUserId,
		fromPosition: '',
		toPosition: '',
		reason: '',
		sourceReason: '',
		reviewRecords: []
	};
}

export function createEmptyAssetInfo(): AssetInfoRecord {
	return {
		assetNo: '',
		name: '',
		category: '',
		assetStatus: 'available',
		assetType: '',
		brand: '',
		model: '',
		serialNo: '',
		location: '',
		departmentId: undefined,
		managerId: undefined,
		purchaseDate: '',
		purchaseAmount: 0,
		supplierId: undefined,
		purchaseOrderId: undefined,
		warrantyExpiry: '',
		residualValue: 0,
		depreciationMonths: 0,
		depreciationStartMonth: '',
		remark: ''
	};
}

export function createEmptyAssetAssignment(): AssetAssignmentRecord {
	return {
		assetId: undefined,
		assigneeId: undefined,
		departmentId: undefined,
		assignDate: '',
		expectedReturnDate: '',
		actualReturnDate: '',
		purpose: '',
		returnRemark: '',
		status: 'assigned'
	};
}

export function createEmptyAssetAssignmentRequest(): AssetAssignmentRequestRecord {
	return {
		requestType: 'standard',
		assetCategory: '',
		assetModelRequest: '',
		quantity: 1,
		unitPriceEstimate: 0,
		usageReason: '',
		expectedUseStartDate: '',
		targetDepartmentId: undefined,
		exceptionReason: '',
		originalAssetId: undefined,
		originalAssignmentId: undefined,
		status: 'draft'
	};
}

export function createEmptyAssetMaintenance(): AssetMaintenanceRecord {
	return {
		assetId: undefined,
		maintenanceType: '保养',
		vendorName: '',
		cost: 0,
		planDate: '',
		startDate: '',
		completeDate: '',
		description: '',
		resultSummary: '',
		status: 'scheduled'
	};
}

export function createEmptyAssetProcurement(): AssetProcurementRecord {
	return {
		title: '',
		assetCategory: '',
		quantity: 1,
		amount: 0,
		departmentId: undefined,
		requesterId: undefined,
		supplierId: undefined,
		purchaseOrderId: undefined,
		expectedArrivalDate: '',
		receiveDate: '',
		remark: '',
		status: 'draft'
	};
}

export function createEmptyAssetTransfer(): AssetTransferRecord {
	return {
		assetId: undefined,
		fromDepartmentId: undefined,
		toDepartmentId: undefined,
		fromLocation: '',
		toLocation: '',
		applicantId: undefined,
		remark: '',
		status: 'draft'
	};
}

export function createEmptyAssetInventory(): AssetInventoryRecord {
	return {
		scopeLabel: '',
		departmentId: undefined,
		location: '',
		ownerId: undefined,
		plannedDate: '',
		completedDate: '',
		assetCount: 0,
		matchedCount: 0,
		differenceCount: 0,
		remark: '',
		status: 'draft'
	};
}

export function createEmptyAssetDisposal(): AssetDisposalRecord {
	return {
		assetId: undefined,
		departmentId: undefined,
		applicantId: undefined,
		reason: '',
		estimatedResidualAmount: 0,
		remark: '',
		status: 'draft'
	};
}

export type AnnualInspectionStatus =
	| 'draft'
	| 'preparing'
	| 'submitted'
	| 'approved'
	| 'rejected'
	| 'expired';

export type AnnualInspectionCategory = 'safety' | 'equipment' | 'license' | 'compliance' | 'other';

export interface AnnualInspectionRecord {
	[key: string]: unknown;
	id?: number;
	title: string;
	status: AnnualInspectionStatus;
	notes: string;
	createTime: string;
	updateTime: string;
	materialNo: string;
	category: AnnualInspectionCategory;
	department: string;
	ownerName: string;
	dueDate: string;
	completeness: number;
	version: string;
	reminderDays: number;
}

export interface AnnualInspectionStats {
	[key: string]: unknown;
	total: number;
	overdueCount: number;
	approvedCount: number;
	avgCompleteness: number;
}

export type HonorStatus = 'draft' | 'published' | 'archived';

export type HonorType = 'individual' | 'team' | 'organization';

export type HonorLevel = 'departmental' | 'city' | 'provincial' | 'national' | 'international';

export interface HonorRecord {
	[key: string]: unknown;
	id?: number;
	title: string;
	status: HonorStatus;
	notes: string;
	createTime: string;
	updateTime: string;
	honorNo: string;
	honorType: HonorType;
	level: HonorLevel;
	winnerName: string;
	department: string;
	awardedAt: string;
	issuer: string;
	impactScore: number;
	evidenceUrl: string | null;
}

export interface HonorStats {
	[key: string]: unknown;
	total: number;
	publishedCount: number;
	thisYearCount: number;
	avgImpactScore: number;
}

export type PublicityMaterialStatus = 'draft' | 'review' | 'approved' | 'published' | 'offline';

export type PublicityMaterialType = 'poster' | 'video' | 'article' | 'ppt' | 'brochure';

export type PublicityMaterialChannel = 'website' | 'wechat' | 'weibo' | 'offline' | 'all';

export interface PublicityMaterialDocumentSummary {
	[key: string]: unknown;
	id: number;
	fileNo: string;
	fileName: string;
}

export interface PublicityMaterialRecord {
	[key: string]: unknown;
	id?: number;
	title: string;
	status: PublicityMaterialStatus;
	notes: string;
	createTime: string;
	updateTime: string;
	materialNo: string;
	materialType: PublicityMaterialType;
	channel: PublicityMaterialChannel;
	ownerName: string;
	publishDate: string;
	views: number;
	downloads: number;
	designOwner: string;
	relatedDocumentId: number | null;
	relatedDocumentSummary?: PublicityMaterialDocumentSummary;
}

export interface PublicityMaterialStats {
	[key: string]: unknown;
	total: number;
	reviewingCount: number;
	publishedCount: number;
	totalViews: number;
}

export type DesignCollabStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';

export type DesignCollabPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface DesignCollabRecord {
	[key: string]: unknown;
	id?: number;
	title: string;
	status: DesignCollabStatus;
	notes: string;
	createTime: string;
	updateTime: string;
	taskNo: string;
	requesterName: string;
	assigneeName: string;
	priority: DesignCollabPriority;
	dueDate: string;
	progress: number;
	workload: number;
	relatedMaterialNo: string | null;
}

export interface DesignCollabStats {
	[key: string]: unknown;
	total: number;
	doneCount: number;
	inProgressCount: number;
	overdueCount: number;
}

export type ExpressCollabStatus = 'created' | 'in_transit' | 'delivered' | 'exception' | 'returned';

export type ExpressCollabServiceLevel = 'standard' | 'express' | 'same_day';

export type ExpressCollabSyncStatus = 'synced' | 'pending' | 'failed';

export interface ExpressCollabRecord {
	[key: string]: unknown;
	id?: number;
	title: string;
	status: ExpressCollabStatus;
	notes: string;
	createTime: string;
	updateTime: string;
	trackingNo: string;
	orderNo: string;
	courierCompany: string;
	serviceLevel: ExpressCollabServiceLevel;
	origin: string;
	destination: string;
	senderName: string;
	receiverName: string;
	sourceSystem: string;
	syncStatus: ExpressCollabSyncStatus;
	lastEvent: string;
	lastUpdate: string;
	etaDate: string;
}

export interface ExpressCollabStats {
	[key: string]: unknown;
	total: number;
	inTransitCount: number;
	deliveredCount: number;
	exceptionCount: number;
	pendingSyncCount: number;
}

export type VehicleType = 'sedan' | 'suv' | 'mpv' | 'bus' | 'truck' | 'other';

export type VehicleStatus = 'idle' | 'in_use' | 'maintenance' | 'inspection_due' | 'retired';

export interface VehicleRecord {
	[key: string]: unknown;
	id?: number;
	vehicleNo: string;
	plateNo: string;
	brand: string;
	model: string;
	vehicleType: VehicleType;
	ownerDepartment: string;
	managerName: string;
	seats: number;
	registerDate: string;
	inspectionDueDate: string | null;
	insuranceDueDate: string | null;
	status: VehicleStatus;
	usageScope: string | null;
	notes: string | null;
	createTime: string;
	updateTime: string;
}

export interface VehicleStats {
	[key: string]: unknown;
	total: number;
	inUseCount: number;
	maintenanceCount: number;
	inspectionDueCount: number;
}

export type IntellectualPropertyType = 'patent' | 'trademark' | 'copyright' | 'softwareCopyright';

export type IntellectualPropertyStatus =
	| 'drafting'
	| 'applying'
	| 'registered'
	| 'expired'
	| 'invalidated';

export type IntellectualPropertyRiskLevel = 'low' | 'medium' | 'high';

export interface IntellectualPropertyRecord {
	[key: string]: unknown;
	id?: number;
	ipNo: string;
	title: string;
	ipType: IntellectualPropertyType;
	ownerDepartment: string;
	ownerName: string;
	applicantName: string;
	applyDate: string;
	grantDate: string | null;
	expiryDate: string | null;
	status: IntellectualPropertyStatus;
	registryNo: string | null;
	usageScope: string | null;
	riskLevel: IntellectualPropertyRiskLevel | null;
	notes: string | null;
	createTime: string;
	updateTime: string;
}

export interface IntellectualPropertyStats {
	[key: string]: unknown;
	total: number;
	registeredCount: number;
	expiringCount: number;
	expiredCount: number;
}
