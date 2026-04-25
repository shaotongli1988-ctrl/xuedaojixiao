/**
 * Performance 角色与能力注册目录。
 * 这里只负责定义 persona、capability、scope 和 state guard 的结构化清单，不负责运行时解析 token 或菜单显隐。
 * 关键依赖是 access-context、权限兼容层和后续工作台/驾驶舱接线都能共享同一份主源。
 * 维护重点是 key 命名必须稳定，避免新旧 capability 命名再次漂移。
 */

export interface PerformancePersonaDefinition {
  key: string;
  label: string;
}

export interface PerformanceCapabilityDefinition {
  key: string;
  label: string;
}

export interface PerformanceScopeDefinition {
  key: string;
  label: string;
}

export type PerformancePersonaCategory = 'org' | 'fn';
export type PerformanceRegisteredRoleKind =
  | 'employee'
  | 'manager'
  | 'hr'
  | 'readonly';

export type PerformanceSurfaceAccessKey =
  | 'assessmentMy'
  | 'assessmentInitiated'
  | 'assessmentPending'
  | 'approvalConfig'
  | 'approvalInstance'
  | 'dashboardSummary'
  | 'dashboardCrossSummary';

export type PerformanceLegacyPermissionAlias =
  | 'assessmentInfo'
  | 'assessmentAdd'
  | 'assessmentMyPage'
  | 'assessmentUpdate'
  | 'assessmentDelete'
  | 'assessmentSubmit'
  | 'assessmentPendingPage'
  | 'assessmentApprove'
  | 'assessmentReject'
  | 'assessmentExport'
  | 'approvalConfigInfo'
  | 'approvalConfigSave'
  | 'approvalInfo'
  | 'approvalApprove'
  | 'approvalReject'
  | 'approvalTransfer'
  | 'approvalWithdraw'
  | 'approvalRemind'
  | 'approvalResolve'
  | 'approvalFallback'
  | 'approvalTerminate'
  | 'goalPage'
  | 'goalInfo'
  | 'goalAdd'
  | 'goalUpdate'
  | 'goalDelete'
  | 'goalProgressUpdate'
  | 'goalExport'
  | 'goalOpsManage'
  | 'goalOpsGlobalScope'
  | 'feedbackPage'
  | 'feedbackInfo'
  | 'feedbackAdd'
  | 'feedbackSubmit'
  | 'feedbackSummary'
  | 'feedbackExport'
  | 'courseRecitePage'
  | 'coursePracticePage'
  | 'courseExamSummary'
  | 'dashboardSummary'
  | 'dashboardCrossSummary'
  | 'capabilityModelPage'
  | 'capabilityModelInfo'
  | 'capabilityModelAdd'
  | 'capabilityModelUpdate'
  | 'capabilityItemInfo'
  | 'capabilityPortraitInfo'
  | 'certificatePage'
  | 'certificateInfo'
  | 'certificateAdd'
  | 'certificateUpdate'
  | 'certificateIssue'
  | 'certificateRecordPage'
  | 'jobStandardPage'
  | 'jobStandardInfo'
  | 'jobStandardAdd'
  | 'jobStandardUpdate'
  | 'jobStandardSetStatus'
  | 'purchaseReportSummary'
  | 'purchaseReportTrend'
  | 'purchaseReportSupplierStats'
  | 'purchaseOrderPage'
  | 'purchaseOrderInfo'
  | 'purchaseOrderAdd'
  | 'purchaseOrderUpdate'
  | 'purchaseOrderDelete'
  | 'purchaseOrderSubmitInquiry'
  | 'purchaseOrderSubmitApproval'
  | 'purchaseOrderApprove'
  | 'purchaseOrderReject'
  | 'purchaseOrderReceive'
  | 'purchaseOrderClose'
  | 'talentAssetPage'
  | 'talentAssetInfo'
  | 'talentAssetAdd'
  | 'talentAssetUpdate'
  | 'talentAssetDelete'
  | 'courseReciteInfo'
  | 'courseReciteSubmit'
  | 'coursePracticeInfo'
  | 'coursePracticeSubmit'
  | 'coursePage'
  | 'courseInfo'
  | 'courseAdd'
  | 'courseUpdate'
  | 'courseDelete'
  | 'courseEnrollmentPage'
  | 'contractPage'
  | 'contractInfo'
  | 'contractAdd'
  | 'contractUpdate'
  | 'contractDelete'
  | 'indicatorInfo'
  | 'indicatorAdd'
  | 'indicatorUpdate'
  | 'indicatorDelete'
  | 'intellectualPropertyPage'
  | 'intellectualPropertyInfo'
  | 'intellectualPropertyStats'
  | 'intellectualPropertyAdd'
  | 'intellectualPropertyUpdate'
  | 'intellectualPropertyDelete'
  | 'materialCatalogPage'
  | 'materialCatalogInfo'
  | 'materialCatalogAdd'
  | 'materialCatalogUpdate'
  | 'materialCatalogDelete'
  | 'materialCatalogUpdateStatus'
  | 'materialStockPage'
  | 'materialStockInfo'
  | 'materialStockSummary'
  | 'materialInboundPage'
  | 'materialInboundInfo'
  | 'materialInboundAdd'
  | 'materialInboundUpdate'
  | 'materialInboundSubmit'
  | 'materialInboundReceive'
  | 'materialInboundCancel'
  | 'materialIssuePage'
  | 'materialIssueInfo'
  | 'materialIssueAdd'
  | 'materialIssueUpdate'
  | 'materialIssueSubmit'
  | 'materialIssueIssue'
  | 'materialIssueCancel'
  | 'materialStockLogPage'
  | 'supplierPage'
  | 'supplierInfo'
  | 'supplierAdd'
  | 'supplierUpdate'
  | 'supplierDelete'
  | 'vehiclePage'
  | 'vehicleInfo'
  | 'vehicleStats'
  | 'vehicleAdd'
  | 'vehicleUpdate'
  | 'vehicleDelete'
  | 'documentCenterPage'
  | 'documentCenterInfo'
  | 'documentCenterStats'
  | 'documentCenterAdd'
  | 'documentCenterUpdate'
  | 'documentCenterDelete'
  | 'knowledgeBasePage'
  | 'knowledgeBaseStats'
  | 'knowledgeBaseAdd'
  | 'knowledgeBaseUpdate'
  | 'knowledgeBaseDelete'
  | 'knowledgeBaseGraph'
  | 'knowledgeBaseSearch'
  | 'knowledgeBaseQaList'
  | 'knowledgeBaseQaAdd'
  | 'annualInspectionPage'
  | 'annualInspectionInfo'
  | 'annualInspectionStats'
  | 'annualInspectionAdd'
  | 'annualInspectionUpdate'
  | 'annualInspectionDelete'
  | 'honorPage'
  | 'honorInfo'
  | 'honorStats'
  | 'honorAdd'
  | 'honorUpdate'
  | 'honorDelete'
  | 'publicityMaterialPage'
  | 'publicityMaterialInfo'
  | 'publicityMaterialStats'
  | 'publicityMaterialAdd'
  | 'publicityMaterialUpdate'
  | 'publicityMaterialDelete'
  | 'designCollabPage'
  | 'designCollabInfo'
  | 'designCollabStats'
  | 'designCollabAdd'
  | 'designCollabUpdate'
  | 'designCollabDelete'
  | 'expressCollabPage'
  | 'expressCollabInfo'
  | 'expressCollabStats'
  | 'expressCollabAdd'
  | 'expressCollabUpdate'
  | 'expressCollabDelete'
  | 'workPlanPage'
  | 'workPlanInfo'
  | 'workPlanAdd'
  | 'workPlanUpdate'
  | 'workPlanDelete'
  | 'workPlanStart'
  | 'workPlanComplete'
  | 'workPlanCancel'
  | 'workPlanSync'
  | 'assessmentPage'
  | 'salaryPage'
  | 'salaryInfo'
  | 'salaryAdd'
  | 'salaryUpdate'
  | 'salaryConfirm'
  | 'salaryArchive'
  | 'salaryChangeAdd'
  | 'suggestionPage'
  | 'suggestionInfo'
  | 'suggestionAccept'
  | 'suggestionIgnore'
  | 'suggestionReject'
  | 'suggestionRevoke'
  | 'promotionPage'
  | 'promotionInfo'
  | 'promotionAdd'
  | 'promotionUpdate'
  | 'promotionSubmit'
  | 'promotionReview'
  | 'pipPage'
  | 'pipInfo'
  | 'pipAdd'
  | 'pipUpdate'
  | 'pipStart'
  | 'pipTrack'
  | 'pipComplete'
  | 'pipClose'
  | 'pipExport'
  | 'meetingPage'
  | 'meetingInfo'
  | 'meetingAdd'
  | 'meetingUpdate'
  | 'meetingDelete'
  | 'meetingCheckIn'
  | 'indicatorPage'
  | 'interviewPage'
  | 'interviewInfo'
  | 'interviewAdd'
  | 'interviewUpdate'
  | 'interviewDelete'
  | 'recruitPlanInfo'
  | 'recruitPlanAdd'
  | 'recruitPlanUpdate'
  | 'recruitPlanDelete'
  | 'recruitPlanImport'
  | 'recruitPlanExport'
  | 'recruitPlanSubmit'
  | 'recruitPlanClose'
  | 'recruitPlanVoid'
  | 'recruitPlanReopen'
  | 'recruitPlanPage'
  | 'resumePoolPage'
  | 'resumePoolInfo'
  | 'resumePoolAdd'
  | 'resumePoolUpdate'
  | 'resumePoolImport'
  | 'resumePoolExport'
  | 'resumePoolUploadAttachment'
  | 'resumePoolDownloadAttachment'
  | 'resumePoolConvertToTalentAsset'
  | 'resumePoolCreateInterview'
  | 'hiringPage'
  | 'hiringInfo'
  | 'hiringAdd'
  | 'hiringUpdateStatus'
  | 'hiringClose'
  | 'hiringAll'
  | 'assetInfoPage'
  | 'assetInfoInfo'
  | 'assetInfoAdd'
  | 'assetInfoUpdate'
  | 'assetInfoDelete'
  | 'assetInfoUpdateStatus'
  | 'assetAssignmentPage'
  | 'assetAssignmentAdd'
  | 'assetAssignmentUpdate'
  | 'assetAssignmentDelete'
  | 'assetAssignmentReturn'
  | 'assetAssignmentMarkLost'
  | 'assetAssignmentRequestPage'
  | 'assetAssignmentRequestInfo'
  | 'assetAssignmentRequestAdd'
  | 'assetAssignmentRequestUpdate'
  | 'assetAssignmentRequestSubmit'
  | 'assetAssignmentRequestWithdraw'
  | 'assetAssignmentRequestAssign'
  | 'assetAssignmentRequestCancel'
  | 'assetDashboardSummary'
  | 'assetDepreciationPage'
  | 'assetDepreciationSummary'
  | 'assetDepreciationRecalculate'
  | 'assetDisposalPage'
  | 'assetDisposalInfo'
  | 'assetDisposalAdd'
  | 'assetDisposalUpdate'
  | 'assetDisposalSubmit'
  | 'assetDisposalApprove'
  | 'assetDisposalExecute'
  | 'assetDisposalCancel'
  | 'assetInventoryPage'
  | 'assetInventoryInfo'
  | 'assetInventoryAdd'
  | 'assetInventoryUpdate'
  | 'assetInventoryStart'
  | 'assetInventoryComplete'
  | 'assetInventoryClose'
  | 'assetMaintenancePage'
  | 'assetMaintenanceAdd'
  | 'assetMaintenanceUpdate'
  | 'assetMaintenanceComplete'
  | 'assetMaintenanceCancel'
  | 'assetMaintenanceDelete'
  | 'assetProcurementPage'
  | 'assetProcurementInfo'
  | 'assetProcurementAdd'
  | 'assetProcurementUpdate'
  | 'assetProcurementSubmit'
  | 'assetProcurementReceive'
  | 'assetProcurementCancel'
  | 'assetReportPage'
  | 'assetReportSummary'
  | 'assetReportExport'
  | 'assetTransferPage'
  | 'assetTransferInfo'
  | 'assetTransferAdd'
  | 'assetTransferUpdate'
  | 'assetTransferSubmit'
  | 'assetTransferComplete'
  | 'assetTransferCancel'
  | 'teacherAgentPage'
  | 'teacherAgentInfo'
  | 'teacherAgentAdd'
  | 'teacherAgentUpdate'
  | 'teacherAgentUpdateStatus'
  | 'teacherAgentBlacklist'
  | 'teacherAgentUnblacklist'
  | 'teacherAgentAuditPage'
  | 'teacherAgentAuditInfo'
  | 'teacherAgentRelationPage'
  | 'teacherAgentRelationAdd'
  | 'teacherAgentRelationUpdate'
  | 'teacherAgentRelationDelete'
  | 'teacherAttributionPage'
  | 'teacherAttributionInfo'
  | 'teacherAttributionAssign'
  | 'teacherAttributionChange'
  | 'teacherAttributionRemove'
  | 'teacherAttributionConflictPage'
  | 'teacherAttributionConflictInfo'
  | 'teacherAttributionConflictCreate'
  | 'teacherAttributionConflictResolve'
  | 'teacherClassPage'
  | 'teacherClassInfo'
  | 'teacherClassAdd'
  | 'teacherClassUpdate'
  | 'teacherClassDelete'
  | 'teacherCooperationMark'
  | 'teacherDashboardSummary'
  | 'teacherFollowPage'
  | 'teacherFollowAdd'
  | 'teacherInfoPage'
  | 'teacherInfoInfo'
  | 'teacherInfoAdd'
  | 'teacherInfoUpdate'
  | 'teacherInfoAssign'
  | 'teacherInfoUpdateStatus'
  | 'teacherInfoAttributionHistory'
  | 'teacherInfoAttributionInfo'
  | 'teacherTodoPage';

export type PerformanceCapabilityScopePresetKey =
  | 'self'
  | 'company'
  | 'department_tree'
  | 'manage_scopes'
  | 'manager_scopes'
  | 'dashboard_scopes'
  | 'global_operator_or_manager_scopes'
  | 'global_operator_or_self_scopes'
  | 'capability_hr_or_department_tree_scopes'
  | 'certificate_hr_or_department_tree_scopes'
  | 'job_standard_hr_or_department_tree_scopes'
  | 'purchase_report_hr_or_department_tree_scopes'
  | 'talent_asset_hr_or_department_tree_scopes'
  | 'interview_hr_or_department_tree_scopes'
  | 'resume_pool_hr_or_department_tree_scopes'
  | 'hiring_hr_or_department_tree_scopes'
  | 'asset_global_or_department_tree_scopes'
  | 'hr_managed_scopes'
  | 'hr_company_scopes'
  | 'promotion_scopes'
  | 'meeting_managed_scopes'
  | 'pip_read_scopes'
  | 'pip_export_scopes'
  | 'workplan_read_scopes'
  | 'workplan_start_complete_scopes'
  | 'feedback_task_read_scopes'
  | 'feedback_summary_scopes'
  | 'feedback_export_scopes'
  | 'goal_manager_scopes'
  | 'goal_page_scopes'
  | 'goal_detail_scopes'
  | 'goal_progress_scopes'
  | 'goal_ops_read_scopes'
  | 'goal_ops_manage_scopes'
  | 'purchase_order_scopes'
  | 'teacher_read_scopes'
  | 'teacher_write_scopes'
  | 'teacher_assign_scopes';

export type PerformanceCapabilityScopeRuleGroupKey =
  | 'assessment'
  | 'approval_flow'
  | 'dashboard'
  | 'capability_domain'
  | 'certificate_domain'
  | 'job_standard'
  | 'purchase_report'
  | 'talent_asset'
  | 'goal'
  | 'purchase_order'
  | 'teacher_domain'
  | 'course_learning'
  | 'course_catalog'
  | 'contract'
  | 'indicator'
  | 'intellectual_property'
  | 'interview'
  | 'recruit_plan'
  | 'resume_pool'
  | 'hiring'
  | 'asset_domain'
  | 'material_domain'
  | 'salary_domain'
  | 'feedback'
  | 'suggestion'
  | 'promotion'
  | 'pip'
  | 'workplan'
  | 'meeting'
  | 'supplier_vehicle'
  | 'document_center'
  | 'knowledge_base'
  | 'office_collab';

export interface PerformancePersonaInferenceRule {
  capabilityKeys: readonly string[];
  scopeKeys?: readonly PerformanceRegisteredScopeKey[];
  scopedCapabilityKeys?: readonly string[];
}

export interface PerformanceSurfaceAccessRule {
  capabilityKeys: readonly string[];
}

export interface PerformanceWorkbenchPageAccessRule {
  legacyPermissionAliases: readonly PerformanceLegacyPermissionAlias[];
}

export interface PerformanceLegacyCapabilityScopeRule {
  capabilityKey: string;
  legacyPermissionAliases: readonly PerformanceLegacyPermissionAlias[];
  scopePreset: PerformanceCapabilityScopePresetKey;
  requireNonEmptyScope?: boolean;
}

export type PerformanceWorkbenchPageId =
  | 'my-assessment'
  | 'pending-approval'
  | 'goal'
  | 'feedback'
  | 'course-learning'
  | 'dashboard'
  | 'work-plan'
  | 'initiated'
  | 'salary'
  | 'indicator-library'
  | 'recruit-plan'
  | 'resume-pool';

export interface PerformanceStateGuardDefinition {
  key: string;
  aggregate: string;
  capabilityKey: string;
  allowedStatuses: readonly string[];
}

export const PERFORMANCE_PERSONAS = [
  { key: 'org.employee', label: '员工' },
  { key: 'org.line_manager', label: '直属主管' },
  { key: 'org.hrbp', label: 'HRBP' },
  { key: 'fn.performance_operator', label: '绩效运营' },
  { key: 'fn.analysis_viewer', label: '分析查看者' },
] as const satisfies readonly PerformancePersonaDefinition[];

export type PerformanceRegisteredPersonaKey =
  typeof PERFORMANCE_PERSONAS[number]['key'];

export interface PerformancePersonaOption {
  key: PerformanceRegisteredPersonaKey;
  label: string;
  category: PerformancePersonaCategory;
}

export const PERFORMANCE_PERSONA_OPTIONS_BY_KEY = {
  'org.employee': {
    key: 'org.employee',
    label: '员工视角',
    category: 'org',
  },
  'org.line_manager': {
    key: 'org.line_manager',
    label: '主管视角',
    category: 'org',
  },
  'org.hrbp': {
    key: 'org.hrbp',
    label: 'HRBP 视角',
    category: 'org',
  },
  'fn.performance_operator': {
    key: 'fn.performance_operator',
    label: '绩效运营视角',
    category: 'fn',
  },
  'fn.analysis_viewer': {
    key: 'fn.analysis_viewer',
    label: '分析视角',
    category: 'fn',
  },
} as const satisfies Readonly<
  Record<PerformanceRegisteredPersonaKey, PerformancePersonaOption>
>;

export const PERFORMANCE_PERSONA_PRIORITY = [
  'org.hrbp',
  'fn.performance_operator',
  'org.line_manager',
  'org.employee',
  'fn.analysis_viewer',
] as const satisfies readonly PerformanceRegisteredPersonaKey[];

export const PERFORMANCE_PERSONA_KEYS = new Set<PerformanceRegisteredPersonaKey>(
  PERFORMANCE_PERSONA_PRIORITY
);

export const PERFORMANCE_PERSONA_WORKBENCH_PAGES = {
  'org.employee': [
    'my-assessment',
    'goal',
    'feedback',
    'course-learning',
    'work-plan',
  ],
  'org.line_manager': [
    'pending-approval',
    'initiated',
    'goal',
    'feedback',
    'dashboard',
    'work-plan',
  ],
  'org.hrbp': [
    'dashboard',
    'initiated',
    'feedback',
    'salary',
    'recruit-plan',
    'resume-pool',
  ],
  'fn.performance_operator': [
    'initiated',
    'feedback',
    'dashboard',
    'salary',
    'indicator-library',
    'recruit-plan',
  ],
  'fn.analysis_viewer': ['dashboard'],
} as const satisfies Readonly<
  Record<PerformanceRegisteredPersonaKey, readonly PerformanceWorkbenchPageId[]>
>;

export const PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY = {
  'org.employee': 'employee',
  'org.line_manager': 'manager',
  'org.hrbp': 'hr',
  'fn.performance_operator': 'hr',
  'fn.analysis_viewer': 'readonly',
} as const satisfies Readonly<
  Record<PerformanceRegisteredPersonaKey, PerformanceRegisteredRoleKind>
>;

export const PERFORMANCE_PERSONA_INFERENCE_RULES = {
  'org.employee': {
    capabilityKeys: [
      'assessment.self.read',
      'assessment.self.edit',
      'assessment.submit',
      'feedback.record.submit',
      'course.recite.read',
      'course.recite.submit',
      'course.practice.read',
      'course.practice.submit',
      'course.exam.summary',
    ],
  },
  'org.line_manager': {
    capabilityKeys: [
      'assessment.review.read',
      'assessment.review.approve',
      'assessment.review.reject',
      'feedback.task.create',
      'workplan.create',
      'workplan.update',
      'workplan.delete',
      'workplan.start',
      'workplan.complete',
      'workplan.cancel',
      'suggestion.read',
      'promotion.read',
      'interview.read',
      'interview.create',
      'interview.update',
      'recruit_plan.read',
      'recruit_plan.create',
      'recruit_plan.update',
      'recruit_plan.delete',
      'recruit_plan.import',
      'recruit_plan.export',
      'recruit_plan.submit',
      'recruit_plan.close',
      'recruit_plan.void',
      'recruit_plan.reopen',
      'resume_pool.read',
      'resume_pool.create',
      'resume_pool.update',
      'resume_pool.import',
      'resume_pool.upload_attachment',
      'resume_pool.convert_to_talent_asset',
      'resume_pool.create_interview',
      'hiring.read',
      'hiring.create',
      'hiring.update_status',
      'hiring.close',
      'pip.create',
      'pip.update',
      'pip.start',
      'pip.track',
      'pip.complete',
      'pip.close',
    ],
    scopeKeys: ['assigned_domain', 'department', 'department_tree'],
  },
  'org.hrbp': {
    capabilityKeys: [
      'assessment.export',
      'approval.config.read',
      'approval.config.write',
      'approval.instance.resolve',
      'approval.instance.fallback',
      'approval.instance.terminate',
      'contract.read',
      'contract.create',
      'contract.update',
      'contract.delete',
      'feedback.export',
      'indicator.read',
      'indicator.create',
      'indicator.update',
      'indicator.delete',
      'vehicle.read',
      'vehicle.stats',
      'vehicle.create',
      'vehicle.update',
      'vehicle.delete',
      'document.read',
      'document.stats',
      'document.create',
      'document.update',
      'document.delete',
      'suggestion.revoke',
      'salary.read',
      'salary.create',
      'salary.update',
      'salary.confirm',
      'salary.archive',
      'salary.change_add',
      'workplan.sync',
      'interview.read',
      'interview.create',
      'interview.update',
      'interview.delete',
      'resume_pool.read',
      'resume_pool.create',
      'resume_pool.update',
      'resume_pool.import',
      'resume_pool.export',
      'resume_pool.upload_attachment',
      'resume_pool.download_attachment',
      'resume_pool.convert_to_talent_asset',
      'resume_pool.create_interview',
      'hiring.read',
      'hiring.create',
      'hiring.update_status',
      'hiring.close',
    ],
    scopeKeys: ['company'],
  },
  'fn.performance_operator': {
    capabilityKeys: [
      'assessment.manage.read',
      'assessment.manage.create',
      'assessment.manage.update',
      'assessment.manage.delete',
      'contract.read',
      'contract.create',
      'contract.update',
      'contract.delete',
      'document.read',
      'document.stats',
      'document.create',
      'document.update',
      'document.delete',
      'feedback.task.create',
      'indicator.read',
      'indicator.create',
      'indicator.update',
      'indicator.delete',
      'vehicle.read',
      'vehicle.stats',
      'vehicle.create',
      'vehicle.update',
      'vehicle.delete',
      'workplan.create',
      'workplan.update',
      'workplan.delete',
      'workplan.sync',
      'suggestion.accept',
      'suggestion.ignore',
      'suggestion.reject',
      'promotion.create',
      'promotion.update',
      'promotion.submit',
      'promotion.review',
      'pip.create',
      'pip.update',
      'pip.start',
      'pip.track',
      'pip.complete',
      'pip.close',
      'salary.create',
      'salary.update',
      'salary.confirm',
      'salary.archive',
      'salary.change_add',
    ],
    scopeKeys: ['company'],
    scopedCapabilityKeys: [
      'assessment.manage.read',
      'contract.read',
      'document.read',
      'feedback.task.create',
      'indicator.read',
      'suggestion.accept',
      'promotion.create',
      'pip.create',
      'vehicle.read',
      'salary.read',
    ],
  },
  'fn.analysis_viewer': {
    capabilityKeys: ['dashboard.summary.read', 'dashboard.cross_summary.read'],
  },
} as const satisfies Readonly<
  Record<PerformanceRegisteredPersonaKey, PerformancePersonaInferenceRule>
>;

export const PERFORMANCE_SURFACE_ACCESS_RULES = {
  assessmentMy: {
    capabilityKeys: ['assessment.self.read'],
  },
  assessmentInitiated: {
    capabilityKeys: ['assessment.manage.read'],
  },
  assessmentPending: {
    capabilityKeys: ['assessment.review.read'],
  },
  approvalConfig: {
    capabilityKeys: ['approval.config.read', 'approval.config.write'],
  },
  approvalInstance: {
    capabilityKeys: ['approval.instance.read'],
  },
  dashboardSummary: {
    capabilityKeys: ['dashboard.summary.read'],
  },
  dashboardCrossSummary: {
    capabilityKeys: ['dashboard.cross_summary.read'],
  },
} as const satisfies Readonly<
  Record<PerformanceSurfaceAccessKey, PerformanceSurfaceAccessRule>
>;

export const PERFORMANCE_WORKBENCH_PAGE_ACCESS_RULES = {
  'my-assessment': {
    legacyPermissionAliases: ['assessmentMyPage'],
  },
  'pending-approval': {
    legacyPermissionAliases: ['assessmentPendingPage'],
  },
  goal: {
    legacyPermissionAliases: ['goalPage'],
  },
  feedback: {
    legacyPermissionAliases: ['feedbackPage'],
  },
  'course-learning': {
    legacyPermissionAliases: [
      'courseRecitePage',
      'coursePracticePage',
      'courseExamSummary',
    ],
  },
  dashboard: {
    legacyPermissionAliases: ['dashboardSummary'],
  },
  'work-plan': {
    legacyPermissionAliases: ['workPlanPage'],
  },
  initiated: {
    legacyPermissionAliases: ['assessmentPage'],
  },
  salary: {
    legacyPermissionAliases: ['salaryPage'],
  },
  'indicator-library': {
    legacyPermissionAliases: ['indicatorPage'],
  },
  'recruit-plan': {
    legacyPermissionAliases: ['recruitPlanPage'],
  },
  'resume-pool': {
    legacyPermissionAliases: ['resumePoolPage'],
  },
} as const satisfies Readonly<
  Record<PerformanceWorkbenchPageId, PerformanceWorkbenchPageAccessRule>
>;

export const PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS = {
  assessment: [
    {
      capabilityKey: 'assessment.self.read',
      legacyPermissionAliases: ['assessmentMyPage', 'assessmentInfo'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'assessment.self.edit',
      legacyPermissionAliases: ['assessmentUpdate'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'assessment.submit',
      legacyPermissionAliases: ['assessmentSubmit'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'assessment.manage.read',
      legacyPermissionAliases: ['assessmentPage'],
      scopePreset: 'manage_scopes',
    },
    {
      capabilityKey: 'assessment.manage.create',
      legacyPermissionAliases: ['assessmentAdd'],
      scopePreset: 'manage_scopes',
    },
    {
      capabilityKey: 'assessment.manage.update',
      legacyPermissionAliases: ['assessmentUpdate'],
      scopePreset: 'manage_scopes',
    },
    {
      capabilityKey: 'assessment.manage.delete',
      legacyPermissionAliases: ['assessmentDelete'],
      scopePreset: 'manage_scopes',
    },
    {
      capabilityKey: 'assessment.export',
      legacyPermissionAliases: ['assessmentExport'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'assessment.review.read',
      legacyPermissionAliases: ['assessmentPendingPage'],
      scopePreset: 'manager_scopes',
    },
    {
      capabilityKey: 'assessment.review.approve',
      legacyPermissionAliases: ['assessmentApprove'],
      scopePreset: 'manager_scopes',
    },
    {
      capabilityKey: 'assessment.review.reject',
      legacyPermissionAliases: ['assessmentReject'],
      scopePreset: 'manager_scopes',
    },
  ],
  approval_flow: [
    {
      capabilityKey: 'approval.config.read',
      legacyPermissionAliases: ['approvalConfigInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'approval.config.write',
      legacyPermissionAliases: ['approvalConfigSave'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'approval.instance.read',
      legacyPermissionAliases: ['approvalInfo'],
      scopePreset: 'global_operator_or_manager_scopes',
    },
    {
      capabilityKey: 'approval.instance.approve',
      legacyPermissionAliases: ['approvalApprove'],
      scopePreset: 'manager_scopes',
    },
    {
      capabilityKey: 'approval.instance.reject',
      legacyPermissionAliases: ['approvalReject'],
      scopePreset: 'manager_scopes',
    },
    {
      capabilityKey: 'approval.instance.transfer',
      legacyPermissionAliases: ['approvalTransfer'],
      scopePreset: 'global_operator_or_manager_scopes',
    },
    {
      capabilityKey: 'approval.instance.withdraw',
      legacyPermissionAliases: ['approvalWithdraw'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'approval.instance.remind',
      legacyPermissionAliases: ['approvalRemind'],
      scopePreset: 'global_operator_or_self_scopes',
    },
    {
      capabilityKey: 'approval.instance.resolve',
      legacyPermissionAliases: ['approvalResolve'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'approval.instance.fallback',
      legacyPermissionAliases: ['approvalFallback'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'approval.instance.terminate',
      legacyPermissionAliases: ['approvalTerminate'],
      scopePreset: 'company',
    },
  ],
  dashboard: [
    {
      capabilityKey: 'dashboard.summary.read',
      legacyPermissionAliases: ['dashboardSummary'],
      scopePreset: 'dashboard_scopes',
    },
    {
      capabilityKey: 'dashboard.cross_summary.read',
      legacyPermissionAliases: ['dashboardCrossSummary'],
      scopePreset: 'dashboard_scopes',
    },
  ],
  capability_domain: [
    {
      capabilityKey: 'capability.model.read',
      legacyPermissionAliases: ['capabilityModelPage', 'capabilityModelInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'capability.model.create',
      legacyPermissionAliases: ['capabilityModelAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'capability.model.update',
      legacyPermissionAliases: ['capabilityModelUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'capability.item.read',
      legacyPermissionAliases: ['capabilityItemInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'capability.portrait.read',
      legacyPermissionAliases: ['capabilityPortraitInfo'],
      scopePreset: 'capability_hr_or_department_tree_scopes',
    },
  ],
  certificate_domain: [
    {
      capabilityKey: 'certificate.read',
      legacyPermissionAliases: ['certificatePage', 'certificateInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'certificate.create',
      legacyPermissionAliases: ['certificateAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'certificate.update',
      legacyPermissionAliases: ['certificateUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'certificate.issue',
      legacyPermissionAliases: ['certificateIssue'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'certificate.record.read',
      legacyPermissionAliases: ['certificateRecordPage'],
      scopePreset: 'certificate_hr_or_department_tree_scopes',
    },
  ],
  job_standard: [
    {
      capabilityKey: 'job_standard.read',
      legacyPermissionAliases: ['jobStandardPage', 'jobStandardInfo'],
      scopePreset: 'job_standard_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'job_standard.create',
      legacyPermissionAliases: ['jobStandardAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'job_standard.update',
      legacyPermissionAliases: ['jobStandardUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'job_standard.set_status',
      legacyPermissionAliases: ['jobStandardSetStatus'],
      scopePreset: 'company',
    },
  ],
  purchase_report: [
    {
      capabilityKey: 'purchase_report.summary.read',
      legacyPermissionAliases: ['purchaseReportSummary'],
      scopePreset: 'purchase_report_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'purchase_report.trend.read',
      legacyPermissionAliases: ['purchaseReportTrend'],
      scopePreset: 'purchase_report_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'purchase_report.supplier_stats.read',
      legacyPermissionAliases: ['purchaseReportSupplierStats'],
      scopePreset: 'purchase_report_hr_or_department_tree_scopes',
    },
  ],
  goal: [
    {
      capabilityKey: 'goal.page_read',
      legacyPermissionAliases: ['goalPage'],
      scopePreset: 'goal_page_scopes',
    },
    {
      capabilityKey: 'goal.ops.read',
      legacyPermissionAliases: ['goalPage'],
      scopePreset: 'goal_ops_read_scopes',
    },
    {
      capabilityKey: 'goal.detail.read',
      legacyPermissionAliases: ['goalInfo'],
      scopePreset: 'goal_detail_scopes',
    },
    {
      capabilityKey: 'goal.create',
      legacyPermissionAliases: ['goalAdd'],
      scopePreset: 'goal_manager_scopes',
    },
    {
      capabilityKey: 'goal.update',
      legacyPermissionAliases: ['goalUpdate'],
      scopePreset: 'goal_manager_scopes',
    },
    {
      capabilityKey: 'goal.delete',
      legacyPermissionAliases: ['goalDelete'],
      scopePreset: 'goal_manager_scopes',
    },
    {
      capabilityKey: 'goal.progress_update',
      legacyPermissionAliases: ['goalProgressUpdate'],
      scopePreset: 'goal_progress_scopes',
    },
    {
      capabilityKey: 'goal.export',
      legacyPermissionAliases: ['goalExport'],
      scopePreset: 'goal_page_scopes',
    },
    {
      capabilityKey: 'goal.ops.personal_write',
      legacyPermissionAliases: ['goalUpdate', 'goalProgressUpdate'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'goal.ops.manage',
      legacyPermissionAliases: ['goalOpsManage'],
      scopePreset: 'goal_ops_manage_scopes',
    },
    {
      capabilityKey: 'goal.ops.global',
      legacyPermissionAliases: ['goalOpsGlobalScope'],
      scopePreset: 'company',
    },
  ],
  purchase_order: [
    {
      capabilityKey: 'purchase_order.read',
      legacyPermissionAliases: ['purchaseOrderPage', 'purchaseOrderInfo'],
      scopePreset: 'purchase_order_scopes',
    },
    {
      capabilityKey: 'purchase_order.create',
      legacyPermissionAliases: ['purchaseOrderAdd'],
      scopePreset: 'purchase_order_scopes',
    },
    {
      capabilityKey: 'purchase_order.update',
      legacyPermissionAliases: ['purchaseOrderUpdate'],
      scopePreset: 'purchase_order_scopes',
    },
    {
      capabilityKey: 'purchase_order.delete',
      legacyPermissionAliases: ['purchaseOrderDelete'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'purchase_order.submit_inquiry',
      legacyPermissionAliases: ['purchaseOrderSubmitInquiry'],
      scopePreset: 'purchase_order_scopes',
    },
    {
      capabilityKey: 'purchase_order.submit_approval',
      legacyPermissionAliases: ['purchaseOrderSubmitApproval'],
      scopePreset: 'purchase_order_scopes',
    },
    {
      capabilityKey: 'purchase_order.approve',
      legacyPermissionAliases: ['purchaseOrderApprove'],
      scopePreset: 'purchase_order_scopes',
    },
    {
      capabilityKey: 'purchase_order.reject',
      legacyPermissionAliases: ['purchaseOrderReject'],
      scopePreset: 'purchase_order_scopes',
    },
    {
      capabilityKey: 'purchase_order.receive',
      legacyPermissionAliases: ['purchaseOrderReceive'],
      scopePreset: 'purchase_order_scopes',
    },
    {
      capabilityKey: 'purchase_order.close',
      legacyPermissionAliases: ['purchaseOrderClose'],
      scopePreset: 'purchase_order_scopes',
    },
  ],
  teacher_domain: [
    {
      capabilityKey: 'teacher_agent.read',
      legacyPermissionAliases: ['teacherAgentPage', 'teacherAgentInfo'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_agent.create',
      legacyPermissionAliases: ['teacherAgentAdd'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_agent.update',
      legacyPermissionAliases: ['teacherAgentUpdate'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_agent.update_status',
      legacyPermissionAliases: ['teacherAgentUpdateStatus'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_agent.blacklist',
      legacyPermissionAliases: ['teacherAgentBlacklist'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_agent.unblacklist',
      legacyPermissionAliases: ['teacherAgentUnblacklist'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_agent_audit.read',
      legacyPermissionAliases: ['teacherAgentAuditPage', 'teacherAgentAuditInfo'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_agent_relation.read',
      legacyPermissionAliases: ['teacherAgentRelationPage'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_agent_relation.create',
      legacyPermissionAliases: ['teacherAgentRelationAdd'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_agent_relation.update',
      legacyPermissionAliases: ['teacherAgentRelationUpdate'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_agent_relation.delete',
      legacyPermissionAliases: ['teacherAgentRelationDelete'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_attribution.read',
      legacyPermissionAliases: ['teacherAttributionPage', 'teacherAttributionInfo'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_attribution.assign',
      legacyPermissionAliases: ['teacherAttributionAssign'],
      scopePreset: 'teacher_assign_scopes',
    },
    {
      capabilityKey: 'teacher_attribution.change',
      legacyPermissionAliases: ['teacherAttributionChange'],
      scopePreset: 'teacher_assign_scopes',
    },
    {
      capabilityKey: 'teacher_attribution.remove',
      legacyPermissionAliases: ['teacherAttributionRemove'],
      scopePreset: 'teacher_assign_scopes',
    },
    {
      capabilityKey: 'teacher_attribution_conflict.read',
      legacyPermissionAliases: [
        'teacherAttributionConflictPage',
        'teacherAttributionConflictInfo',
      ],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_attribution_conflict.create',
      legacyPermissionAliases: ['teacherAttributionConflictCreate'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_attribution_conflict.resolve',
      legacyPermissionAliases: ['teacherAttributionConflictResolve'],
      scopePreset: 'teacher_assign_scopes',
    },
    {
      capabilityKey: 'teacher_class.read',
      legacyPermissionAliases: ['teacherClassPage', 'teacherClassInfo'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_class.create',
      legacyPermissionAliases: ['teacherClassAdd'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_class.update',
      legacyPermissionAliases: ['teacherClassUpdate'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_class.delete',
      legacyPermissionAliases: ['teacherClassDelete'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_cooperation.mark',
      legacyPermissionAliases: ['teacherCooperationMark'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_dashboard.summary',
      legacyPermissionAliases: ['teacherDashboardSummary'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_follow.read',
      legacyPermissionAliases: ['teacherFollowPage'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_follow.create',
      legacyPermissionAliases: ['teacherFollowAdd'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_info.read',
      legacyPermissionAliases: ['teacherInfoPage', 'teacherInfoInfo'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_info.create',
      legacyPermissionAliases: ['teacherInfoAdd'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_info.update',
      legacyPermissionAliases: ['teacherInfoUpdate'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_info.assign',
      legacyPermissionAliases: ['teacherInfoAssign'],
      scopePreset: 'teacher_assign_scopes',
    },
    {
      capabilityKey: 'teacher_info.update_status',
      legacyPermissionAliases: ['teacherInfoUpdateStatus'],
      scopePreset: 'teacher_write_scopes',
    },
    {
      capabilityKey: 'teacher_info.attribution_history',
      legacyPermissionAliases: ['teacherInfoAttributionHistory'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_info.attribution_info',
      legacyPermissionAliases: ['teacherInfoAttributionInfo'],
      scopePreset: 'teacher_read_scopes',
    },
    {
      capabilityKey: 'teacher_todo.read',
      legacyPermissionAliases: ['teacherTodoPage'],
      scopePreset: 'teacher_read_scopes',
    },
  ],
  talent_asset: [
    {
      capabilityKey: 'talent_asset.read',
      legacyPermissionAliases: ['talentAssetPage', 'talentAssetInfo'],
      scopePreset: 'talent_asset_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'talent_asset.create',
      legacyPermissionAliases: ['talentAssetAdd'],
      scopePreset: 'talent_asset_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'talent_asset.update',
      legacyPermissionAliases: ['talentAssetUpdate'],
      scopePreset: 'talent_asset_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'talent_asset.delete',
      legacyPermissionAliases: ['talentAssetDelete'],
      scopePreset: 'company',
    },
  ],
  course_learning: [
    {
      capabilityKey: 'course.recite.read',
      legacyPermissionAliases: ['courseRecitePage', 'courseReciteInfo'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'course.recite.submit',
      legacyPermissionAliases: ['courseReciteSubmit'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'course.practice.read',
      legacyPermissionAliases: ['coursePracticePage', 'coursePracticeInfo'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'course.practice.submit',
      legacyPermissionAliases: ['coursePracticeSubmit'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'course.exam.summary',
      legacyPermissionAliases: ['courseExamSummary'],
      scopePreset: 'self',
    },
  ],
  course_catalog: [
    {
      capabilityKey: 'course.read',
      legacyPermissionAliases: ['coursePage', 'courseInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'course.create',
      legacyPermissionAliases: ['courseAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'course.update',
      legacyPermissionAliases: ['courseUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'course.delete',
      legacyPermissionAliases: ['courseDelete'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'course.enrollment.read',
      legacyPermissionAliases: ['courseEnrollmentPage'],
      scopePreset: 'company',
    },
  ],
  contract: [
    {
      capabilityKey: 'contract.read',
      legacyPermissionAliases: ['contractPage', 'contractInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'contract.create',
      legacyPermissionAliases: ['contractAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'contract.update',
      legacyPermissionAliases: ['contractUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'contract.delete',
      legacyPermissionAliases: ['contractDelete'],
      scopePreset: 'company',
    },
  ],
  indicator: [
    {
      capabilityKey: 'indicator.read',
      legacyPermissionAliases: ['indicatorPage', 'indicatorInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'indicator.create',
      legacyPermissionAliases: ['indicatorAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'indicator.update',
      legacyPermissionAliases: ['indicatorUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'indicator.delete',
      legacyPermissionAliases: ['indicatorDelete'],
      scopePreset: 'company',
    },
  ],
  intellectual_property: [
    {
      capabilityKey: 'intellectual_property.read',
      legacyPermissionAliases: [
        'intellectualPropertyPage',
        'intellectualPropertyInfo',
      ],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'intellectual_property.stats',
      legacyPermissionAliases: ['intellectualPropertyStats'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'intellectual_property.create',
      legacyPermissionAliases: ['intellectualPropertyAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'intellectual_property.update',
      legacyPermissionAliases: ['intellectualPropertyUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'intellectual_property.delete',
      legacyPermissionAliases: ['intellectualPropertyDelete'],
      scopePreset: 'company',
    },
  ],
  interview: [
    {
      capabilityKey: 'interview.read',
      legacyPermissionAliases: ['interviewPage', 'interviewInfo'],
      scopePreset: 'interview_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'interview.create',
      legacyPermissionAliases: ['interviewAdd'],
      scopePreset: 'interview_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'interview.update',
      legacyPermissionAliases: ['interviewUpdate'],
      scopePreset: 'interview_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'interview.delete',
      legacyPermissionAliases: ['interviewDelete'],
      scopePreset: 'company',
    },
  ],
  recruit_plan: [
    {
      capabilityKey: 'recruit_plan.read',
      legacyPermissionAliases: ['recruitPlanPage', 'recruitPlanInfo'],
      scopePreset: 'department_tree',
    },
    {
      capabilityKey: 'recruit_plan.create',
      legacyPermissionAliases: ['recruitPlanAdd'],
      scopePreset: 'department_tree',
    },
    {
      capabilityKey: 'recruit_plan.update',
      legacyPermissionAliases: ['recruitPlanUpdate'],
      scopePreset: 'department_tree',
    },
    {
      capabilityKey: 'recruit_plan.delete',
      legacyPermissionAliases: ['recruitPlanDelete'],
      scopePreset: 'department_tree',
    },
    {
      capabilityKey: 'recruit_plan.import',
      legacyPermissionAliases: ['recruitPlanImport'],
      scopePreset: 'department_tree',
    },
    {
      capabilityKey: 'recruit_plan.export',
      legacyPermissionAliases: ['recruitPlanExport'],
      scopePreset: 'department_tree',
    },
    {
      capabilityKey: 'recruit_plan.submit',
      legacyPermissionAliases: ['recruitPlanSubmit'],
      scopePreset: 'department_tree',
    },
    {
      capabilityKey: 'recruit_plan.close',
      legacyPermissionAliases: ['recruitPlanClose'],
      scopePreset: 'department_tree',
    },
    {
      capabilityKey: 'recruit_plan.void',
      legacyPermissionAliases: ['recruitPlanVoid'],
      scopePreset: 'department_tree',
    },
    {
      capabilityKey: 'recruit_plan.reopen',
      legacyPermissionAliases: ['recruitPlanReopen'],
      scopePreset: 'department_tree',
    },
  ],
  resume_pool: [
    {
      capabilityKey: 'resume_pool.read',
      legacyPermissionAliases: ['resumePoolPage', 'resumePoolInfo'],
      scopePreset: 'resume_pool_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'resume_pool.create',
      legacyPermissionAliases: ['resumePoolAdd'],
      scopePreset: 'resume_pool_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'resume_pool.update',
      legacyPermissionAliases: ['resumePoolUpdate'],
      scopePreset: 'resume_pool_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'resume_pool.import',
      legacyPermissionAliases: ['resumePoolImport'],
      scopePreset: 'resume_pool_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'resume_pool.export',
      legacyPermissionAliases: ['resumePoolExport'],
      scopePreset: 'resume_pool_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'resume_pool.upload_attachment',
      legacyPermissionAliases: ['resumePoolUploadAttachment'],
      scopePreset: 'resume_pool_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'resume_pool.download_attachment',
      legacyPermissionAliases: ['resumePoolDownloadAttachment'],
      scopePreset: 'resume_pool_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'resume_pool.convert_to_talent_asset',
      legacyPermissionAliases: ['resumePoolConvertToTalentAsset'],
      scopePreset: 'resume_pool_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'resume_pool.create_interview',
      legacyPermissionAliases: ['resumePoolCreateInterview'],
      scopePreset: 'resume_pool_hr_or_department_tree_scopes',
    },
  ],
  hiring: [
    {
      capabilityKey: 'hiring.read',
      legacyPermissionAliases: ['hiringPage', 'hiringInfo'],
      scopePreset: 'hiring_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'hiring.create',
      legacyPermissionAliases: ['hiringAdd'],
      scopePreset: 'hiring_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'hiring.update_status',
      legacyPermissionAliases: ['hiringUpdateStatus'],
      scopePreset: 'hiring_hr_or_department_tree_scopes',
    },
    {
      capabilityKey: 'hiring.close',
      legacyPermissionAliases: ['hiringClose'],
      scopePreset: 'hiring_hr_or_department_tree_scopes',
    },
  ],
  asset_domain: [
    {
      capabilityKey: 'asset_info.read',
      legacyPermissionAliases: ['assetInfoPage', 'assetInfoInfo'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_info.create',
      legacyPermissionAliases: ['assetInfoAdd'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_info.update',
      legacyPermissionAliases: ['assetInfoUpdate'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_info.delete',
      legacyPermissionAliases: ['assetInfoDelete'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_info.update_status',
      legacyPermissionAliases: ['assetInfoUpdateStatus'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment.read',
      legacyPermissionAliases: ['assetAssignmentPage'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment.create',
      legacyPermissionAliases: ['assetAssignmentAdd'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment.update',
      legacyPermissionAliases: ['assetAssignmentUpdate'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment.delete',
      legacyPermissionAliases: ['assetAssignmentDelete'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment.return',
      legacyPermissionAliases: ['assetAssignmentReturn'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment.mark_lost',
      legacyPermissionAliases: ['assetAssignmentMarkLost'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment_request.read',
      legacyPermissionAliases: [
        'assetAssignmentRequestPage',
        'assetAssignmentRequestInfo',
      ],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment_request.create',
      legacyPermissionAliases: ['assetAssignmentRequestAdd'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment_request.update',
      legacyPermissionAliases: ['assetAssignmentRequestUpdate'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment_request.submit',
      legacyPermissionAliases: ['assetAssignmentRequestSubmit'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment_request.withdraw',
      legacyPermissionAliases: ['assetAssignmentRequestWithdraw'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment_request.assign',
      legacyPermissionAliases: ['assetAssignmentRequestAssign'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_assignment_request.cancel',
      legacyPermissionAliases: ['assetAssignmentRequestCancel'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_dashboard.summary',
      legacyPermissionAliases: ['assetDashboardSummary'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_depreciation.read',
      legacyPermissionAliases: ['assetDepreciationPage'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_depreciation.summary',
      legacyPermissionAliases: ['assetDepreciationSummary'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_depreciation.recalculate',
      legacyPermissionAliases: ['assetDepreciationRecalculate'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_disposal.read',
      legacyPermissionAliases: ['assetDisposalPage', 'assetDisposalInfo'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_disposal.create',
      legacyPermissionAliases: ['assetDisposalAdd'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_disposal.update',
      legacyPermissionAliases: ['assetDisposalUpdate'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_disposal.submit',
      legacyPermissionAliases: ['assetDisposalSubmit'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_disposal.approve',
      legacyPermissionAliases: ['assetDisposalApprove'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_disposal.execute',
      legacyPermissionAliases: ['assetDisposalExecute'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_disposal.cancel',
      legacyPermissionAliases: ['assetDisposalCancel'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_inventory.read',
      legacyPermissionAliases: ['assetInventoryPage', 'assetInventoryInfo'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_inventory.create',
      legacyPermissionAliases: ['assetInventoryAdd'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_inventory.update',
      legacyPermissionAliases: ['assetInventoryUpdate'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_inventory.start',
      legacyPermissionAliases: ['assetInventoryStart'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_inventory.complete',
      legacyPermissionAliases: ['assetInventoryComplete'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_inventory.close',
      legacyPermissionAliases: ['assetInventoryClose'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_maintenance.read',
      legacyPermissionAliases: ['assetMaintenancePage'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_maintenance.create',
      legacyPermissionAliases: ['assetMaintenanceAdd'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_maintenance.update',
      legacyPermissionAliases: ['assetMaintenanceUpdate'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_maintenance.complete',
      legacyPermissionAliases: ['assetMaintenanceComplete'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_maintenance.cancel',
      legacyPermissionAliases: ['assetMaintenanceCancel'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_maintenance.delete',
      legacyPermissionAliases: ['assetMaintenanceDelete'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_procurement.read',
      legacyPermissionAliases: ['assetProcurementPage', 'assetProcurementInfo'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_procurement.create',
      legacyPermissionAliases: ['assetProcurementAdd'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_procurement.update',
      legacyPermissionAliases: ['assetProcurementUpdate'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_procurement.submit',
      legacyPermissionAliases: ['assetProcurementSubmit'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_procurement.receive',
      legacyPermissionAliases: ['assetProcurementReceive'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_procurement.cancel',
      legacyPermissionAliases: ['assetProcurementCancel'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_report.read',
      legacyPermissionAliases: ['assetReportPage'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_report.summary',
      legacyPermissionAliases: ['assetReportSummary'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_report.export',
      legacyPermissionAliases: ['assetReportExport'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_transfer.read',
      legacyPermissionAliases: ['assetTransferPage', 'assetTransferInfo'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_transfer.create',
      legacyPermissionAliases: ['assetTransferAdd'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_transfer.update',
      legacyPermissionAliases: ['assetTransferUpdate'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_transfer.submit',
      legacyPermissionAliases: ['assetTransferSubmit'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_transfer.complete',
      legacyPermissionAliases: ['assetTransferComplete'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
    {
      capabilityKey: 'asset_transfer.cancel',
      legacyPermissionAliases: ['assetTransferCancel'],
      scopePreset: 'asset_global_or_department_tree_scopes',
    },
  ],
  material_domain: [
    {
      capabilityKey: 'material.catalog.read',
      legacyPermissionAliases: ['materialCatalogPage', 'materialCatalogInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.catalog.create',
      legacyPermissionAliases: ['materialCatalogAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.catalog.update',
      legacyPermissionAliases: ['materialCatalogUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.catalog.delete',
      legacyPermissionAliases: ['materialCatalogDelete'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.catalog.update_status',
      legacyPermissionAliases: ['materialCatalogUpdateStatus'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.stock.read',
      legacyPermissionAliases: ['materialStockPage', 'materialStockInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.stock.summary',
      legacyPermissionAliases: ['materialStockSummary'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.inbound.read',
      legacyPermissionAliases: ['materialInboundPage', 'materialInboundInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.inbound.create',
      legacyPermissionAliases: ['materialInboundAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.inbound.update',
      legacyPermissionAliases: ['materialInboundUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.inbound.submit',
      legacyPermissionAliases: ['materialInboundSubmit'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.inbound.receive',
      legacyPermissionAliases: ['materialInboundReceive'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.inbound.cancel',
      legacyPermissionAliases: ['materialInboundCancel'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.issue.read',
      legacyPermissionAliases: ['materialIssuePage', 'materialIssueInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.issue.create',
      legacyPermissionAliases: ['materialIssueAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.issue.update',
      legacyPermissionAliases: ['materialIssueUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.issue.submit',
      legacyPermissionAliases: ['materialIssueSubmit'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.issue.issue',
      legacyPermissionAliases: ['materialIssueIssue'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.issue.cancel',
      legacyPermissionAliases: ['materialIssueCancel'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'material.stocklog.read',
      legacyPermissionAliases: ['materialStockLogPage'],
      scopePreset: 'company',
    },
  ],
  salary_domain: [
    {
      capabilityKey: 'salary.read',
      legacyPermissionAliases: ['salaryPage', 'salaryInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'salary.create',
      legacyPermissionAliases: ['salaryAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'salary.update',
      legacyPermissionAliases: ['salaryUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'salary.confirm',
      legacyPermissionAliases: ['salaryConfirm'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'salary.archive',
      legacyPermissionAliases: ['salaryArchive'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'salary.change_add',
      legacyPermissionAliases: ['salaryChangeAdd'],
      scopePreset: 'company',
    },
  ],
  feedback: [
    {
      capabilityKey: 'feedback.task.read',
      legacyPermissionAliases: [
        'feedbackPage',
        'feedbackInfo',
        'feedbackSummary',
        'feedbackSubmit',
      ],
      scopePreset: 'feedback_task_read_scopes',
      requireNonEmptyScope: true,
    },
    {
      capabilityKey: 'feedback.task.create',
      legacyPermissionAliases: ['feedbackAdd'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'feedback.record.submit',
      legacyPermissionAliases: ['feedbackSubmit'],
      scopePreset: 'self',
    },
    {
      capabilityKey: 'feedback.summary.read',
      legacyPermissionAliases: ['feedbackSummary'],
      scopePreset: 'feedback_summary_scopes',
      requireNonEmptyScope: true,
    },
    {
      capabilityKey: 'feedback.export',
      legacyPermissionAliases: ['feedbackExport'],
      scopePreset: 'feedback_export_scopes',
    },
  ],
  suggestion: [
    {
      capabilityKey: 'suggestion.read',
      legacyPermissionAliases: ['suggestionPage', 'suggestionInfo'],
      scopePreset: 'hr_managed_scopes',
      requireNonEmptyScope: true,
    },
    {
      capabilityKey: 'suggestion.accept',
      legacyPermissionAliases: ['suggestionAccept'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'suggestion.ignore',
      legacyPermissionAliases: ['suggestionIgnore'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'suggestion.reject',
      legacyPermissionAliases: ['suggestionReject'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'suggestion.revoke',
      legacyPermissionAliases: ['suggestionRevoke'],
      scopePreset: 'hr_company_scopes',
      requireNonEmptyScope: true,
    },
  ],
  promotion: [
    {
      capabilityKey: 'promotion.read',
      legacyPermissionAliases: ['promotionPage', 'promotionInfo'],
      scopePreset: 'promotion_scopes',
      requireNonEmptyScope: true,
    },
    {
      capabilityKey: 'promotion.create',
      legacyPermissionAliases: ['promotionAdd'],
      scopePreset: 'promotion_scopes',
    },
    {
      capabilityKey: 'promotion.update',
      legacyPermissionAliases: ['promotionUpdate'],
      scopePreset: 'promotion_scopes',
    },
    {
      capabilityKey: 'promotion.submit',
      legacyPermissionAliases: ['promotionSubmit'],
      scopePreset: 'promotion_scopes',
    },
    {
      capabilityKey: 'promotion.review',
      legacyPermissionAliases: ['promotionReview'],
      scopePreset: 'promotion_scopes',
    },
  ],
  pip: [
    {
      capabilityKey: 'pip.read',
      legacyPermissionAliases: ['pipPage', 'pipInfo'],
      scopePreset: 'pip_read_scopes',
      requireNonEmptyScope: true,
    },
    {
      capabilityKey: 'pip.create',
      legacyPermissionAliases: ['pipAdd'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'pip.update',
      legacyPermissionAliases: ['pipUpdate'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'pip.start',
      legacyPermissionAliases: ['pipStart'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'pip.track',
      legacyPermissionAliases: ['pipTrack'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'pip.complete',
      legacyPermissionAliases: ['pipComplete'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'pip.close',
      legacyPermissionAliases: ['pipClose'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'pip.export',
      legacyPermissionAliases: ['pipExport'],
      scopePreset: 'pip_export_scopes',
    },
  ],
  workplan: [
    {
      capabilityKey: 'workplan.read',
      legacyPermissionAliases: ['workPlanPage', 'workPlanInfo'],
      scopePreset: 'workplan_read_scopes',
      requireNonEmptyScope: true,
    },
    {
      capabilityKey: 'workplan.create',
      legacyPermissionAliases: ['workPlanAdd'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'workplan.update',
      legacyPermissionAliases: ['workPlanUpdate'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'workplan.delete',
      legacyPermissionAliases: ['workPlanDelete'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'workplan.start',
      legacyPermissionAliases: ['workPlanStart'],
      scopePreset: 'workplan_start_complete_scopes',
    },
    {
      capabilityKey: 'workplan.complete',
      legacyPermissionAliases: ['workPlanComplete'],
      scopePreset: 'workplan_start_complete_scopes',
    },
    {
      capabilityKey: 'workplan.cancel',
      legacyPermissionAliases: ['workPlanCancel'],
      scopePreset: 'hr_managed_scopes',
    },
    {
      capabilityKey: 'workplan.sync',
      legacyPermissionAliases: ['workPlanSync'],
      scopePreset: 'hr_managed_scopes',
    },
  ],
  meeting: [
    {
      capabilityKey: 'meeting.page',
      legacyPermissionAliases: ['meetingPage'],
      scopePreset: 'meeting_managed_scopes',
    },
    {
      capabilityKey: 'meeting.read',
      legacyPermissionAliases: ['meetingInfo'],
      scopePreset: 'meeting_managed_scopes',
    },
    {
      capabilityKey: 'meeting.create',
      legacyPermissionAliases: ['meetingAdd'],
      scopePreset: 'meeting_managed_scopes',
    },
    {
      capabilityKey: 'meeting.update',
      legacyPermissionAliases: ['meetingUpdate'],
      scopePreset: 'meeting_managed_scopes',
    },
    {
      capabilityKey: 'meeting.delete',
      legacyPermissionAliases: ['meetingDelete'],
      scopePreset: 'meeting_managed_scopes',
    },
    {
      capabilityKey: 'meeting.checkin',
      legacyPermissionAliases: ['meetingCheckIn'],
      scopePreset: 'meeting_managed_scopes',
    },
  ],
  supplier_vehicle: [
    {
      capabilityKey: 'supplier.read',
      legacyPermissionAliases: ['supplierPage', 'supplierInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'supplier.create',
      legacyPermissionAliases: ['supplierAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'supplier.update',
      legacyPermissionAliases: ['supplierUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'supplier.delete',
      legacyPermissionAliases: ['supplierDelete'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'vehicle.read',
      legacyPermissionAliases: ['vehiclePage', 'vehicleInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'vehicle.stats',
      legacyPermissionAliases: ['vehicleStats'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'vehicle.create',
      legacyPermissionAliases: ['vehicleAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'vehicle.update',
      legacyPermissionAliases: ['vehicleUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'vehicle.delete',
      legacyPermissionAliases: ['vehicleDelete'],
      scopePreset: 'company',
    },
  ],
  document_center: [
    {
      capabilityKey: 'document.read',
      legacyPermissionAliases: ['documentCenterPage', 'documentCenterInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'document.stats',
      legacyPermissionAliases: ['documentCenterStats'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'document.create',
      legacyPermissionAliases: ['documentCenterAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'document.update',
      legacyPermissionAliases: ['documentCenterUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'document.delete',
      legacyPermissionAliases: ['documentCenterDelete'],
      scopePreset: 'company',
    },
  ],
  knowledge_base: [
    {
      capabilityKey: 'knowledge_base.read',
      legacyPermissionAliases: ['knowledgeBasePage'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'knowledge_base.stats',
      legacyPermissionAliases: ['knowledgeBaseStats'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'knowledge_base.create',
      legacyPermissionAliases: ['knowledgeBaseAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'knowledge_base.update',
      legacyPermissionAliases: ['knowledgeBaseUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'knowledge_base.delete',
      legacyPermissionAliases: ['knowledgeBaseDelete'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'knowledge_base.graph',
      legacyPermissionAliases: ['knowledgeBaseGraph'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'knowledge_base.search',
      legacyPermissionAliases: ['knowledgeBaseSearch'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'knowledge_base.qa_read',
      legacyPermissionAliases: ['knowledgeBaseQaList'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'knowledge_base.qa_create',
      legacyPermissionAliases: ['knowledgeBaseQaAdd'],
      scopePreset: 'company',
    },
  ],
  office_collab: [
    {
      capabilityKey: 'office.annual_inspection.read',
      legacyPermissionAliases: ['annualInspectionPage', 'annualInspectionInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.annual_inspection.stats',
      legacyPermissionAliases: ['annualInspectionStats'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.annual_inspection.create',
      legacyPermissionAliases: ['annualInspectionAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.annual_inspection.update',
      legacyPermissionAliases: ['annualInspectionUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.annual_inspection.delete',
      legacyPermissionAliases: ['annualInspectionDelete'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.honor.read',
      legacyPermissionAliases: ['honorPage', 'honorInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.honor.stats',
      legacyPermissionAliases: ['honorStats'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.honor.create',
      legacyPermissionAliases: ['honorAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.honor.update',
      legacyPermissionAliases: ['honorUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.honor.delete',
      legacyPermissionAliases: ['honorDelete'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.publicity_material.read',
      legacyPermissionAliases: ['publicityMaterialPage', 'publicityMaterialInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.publicity_material.stats',
      legacyPermissionAliases: ['publicityMaterialStats'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.publicity_material.create',
      legacyPermissionAliases: ['publicityMaterialAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.publicity_material.update',
      legacyPermissionAliases: ['publicityMaterialUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.publicity_material.delete',
      legacyPermissionAliases: ['publicityMaterialDelete'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.design_collab.read',
      legacyPermissionAliases: ['designCollabPage', 'designCollabInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.design_collab.stats',
      legacyPermissionAliases: ['designCollabStats'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.design_collab.create',
      legacyPermissionAliases: ['designCollabAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.design_collab.update',
      legacyPermissionAliases: ['designCollabUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.design_collab.delete',
      legacyPermissionAliases: ['designCollabDelete'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.express_collab.read',
      legacyPermissionAliases: ['expressCollabPage', 'expressCollabInfo'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.express_collab.stats',
      legacyPermissionAliases: ['expressCollabStats'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.express_collab.create',
      legacyPermissionAliases: ['expressCollabAdd'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.express_collab.update',
      legacyPermissionAliases: ['expressCollabUpdate'],
      scopePreset: 'company',
    },
    {
      capabilityKey: 'office.express_collab.delete',
      legacyPermissionAliases: ['expressCollabDelete'],
      scopePreset: 'company',
    },
  ],
} as const satisfies Readonly<
  Record<
    PerformanceCapabilityScopeRuleGroupKey,
    readonly PerformanceLegacyCapabilityScopeRule[]
  >
>;

export const PERFORMANCE_CAPABILITIES = [
  { key: 'assessment.self.read', label: '查看本人评估单' },
  { key: 'assessment.self.edit', label: '编辑本人评估单' },
  { key: 'assessment.submit', label: '提交评估单' },
  { key: 'assessment.manage.read', label: '查看发起评估单' },
  { key: 'assessment.manage.create', label: '创建发起评估单' },
  { key: 'assessment.manage.update', label: '更新发起评估单' },
  { key: 'assessment.manage.delete', label: '删除发起评估单' },
  { key: 'assessment.export', label: '导出评估单' },
  { key: 'assessment.review.read', label: '查看待审批评估单' },
  { key: 'assessment.review.approve', label: '审批通过评估单' },
  { key: 'assessment.review.reject', label: '驳回评估单' },
  { key: 'approval.config.read', label: '查看审批配置' },
  { key: 'approval.config.write', label: '维护审批配置' },
  { key: 'approval.instance.read', label: '查看审批实例' },
  { key: 'approval.instance.approve', label: '审批通过审批实例' },
  { key: 'approval.instance.reject', label: '驳回审批实例' },
  { key: 'approval.instance.transfer', label: '转交审批实例' },
  { key: 'approval.instance.withdraw', label: '撤回审批实例' },
  { key: 'approval.instance.remind', label: '催办审批实例' },
  { key: 'approval.instance.resolve', label: '处理异常审批实例' },
  { key: 'approval.instance.fallback', label: '回退审批实例' },
  { key: 'approval.instance.terminate', label: '终止审批实例' },
  { key: 'dashboard.summary.read', label: '查看绩效驾驶舱摘要' },
  { key: 'dashboard.cross_summary.read', label: '查看跨模块驾驶舱摘要' },
  { key: 'capability.model.read', label: '查看能力模型' },
  { key: 'capability.model.create', label: '创建能力模型' },
  { key: 'capability.model.update', label: '更新能力模型' },
  { key: 'capability.item.read', label: '查看能力项' },
  { key: 'capability.portrait.read', label: '查看能力画像' },
  { key: 'certificate.read', label: '查看证书' },
  { key: 'certificate.create', label: '创建证书' },
  { key: 'certificate.update', label: '更新证书' },
  { key: 'certificate.issue', label: '发放证书' },
  { key: 'certificate.record.read', label: '查看证书台账' },
  { key: 'job_standard.read', label: '查看岗位标准' },
  { key: 'job_standard.create', label: '创建岗位标准' },
  { key: 'job_standard.update', label: '更新岗位标准' },
  { key: 'job_standard.set_status', label: '变更岗位标准状态' },
  { key: 'purchase_report.summary.read', label: '查看采购报表汇总' },
  { key: 'purchase_report.trend.read', label: '查看采购趋势报表' },
  { key: 'purchase_report.supplier_stats.read', label: '查看供应商统计报表' },
  { key: 'goal.page_read', label: '查看目标页面' },
  { key: 'goal.detail.read', label: '查看目标详情' },
  { key: 'goal.create', label: '创建目标' },
  { key: 'goal.update', label: '更新目标' },
  { key: 'goal.delete', label: '删除目标' },
  { key: 'goal.progress_update', label: '更新目标进度' },
  { key: 'goal.export', label: '导出目标' },
  { key: 'goal.ops.read', label: '查看目标运营视图' },
  { key: 'goal.ops.personal_write', label: '写入个人目标运营信息' },
  { key: 'goal.ops.manage', label: '管理目标运营' },
  { key: 'goal.ops.global', label: '查看全局目标运营范围' },
  { key: 'purchase_order.read', label: '查看采购单' },
  { key: 'purchase_order.create', label: '创建采购单' },
  { key: 'purchase_order.update', label: '更新采购单' },
  { key: 'purchase_order.delete', label: '删除采购单' },
  { key: 'purchase_order.submit_inquiry', label: '提交询价' },
  { key: 'purchase_order.submit_approval', label: '提交审批' },
  { key: 'purchase_order.approve', label: '审批采购单' },
  { key: 'purchase_order.reject', label: '驳回采购单' },
  { key: 'purchase_order.receive', label: '采购收货' },
  { key: 'purchase_order.close', label: '关闭采购单' },
  { key: 'teacher_agent.read', label: '查看代理老师' },
  { key: 'teacher_agent.create', label: '创建代理老师' },
  { key: 'teacher_agent.update', label: '更新代理老师' },
  { key: 'teacher_agent.update_status', label: '更新代理老师状态' },
  { key: 'teacher_agent.blacklist', label: '拉黑代理老师' },
  { key: 'teacher_agent.unblacklist', label: '解除代理老师拉黑' },
  { key: 'teacher_agent_audit.read', label: '查看代理老师审核记录' },
  { key: 'teacher_agent_relation.read', label: '查看代理老师关系' },
  { key: 'teacher_agent_relation.create', label: '创建代理老师关系' },
  { key: 'teacher_agent_relation.update', label: '更新代理老师关系' },
  { key: 'teacher_agent_relation.delete', label: '删除代理老师关系' },
  { key: 'teacher_attribution.read', label: '查看老师归属' },
  { key: 'teacher_attribution.assign', label: '分配老师归属' },
  { key: 'teacher_attribution.change', label: '变更老师归属' },
  { key: 'teacher_attribution.remove', label: '移除老师归属' },
  {
    key: 'teacher_attribution_conflict.read',
    label: '查看老师归属冲突',
  },
  {
    key: 'teacher_attribution_conflict.create',
    label: '创建老师归属冲突',
  },
  {
    key: 'teacher_attribution_conflict.resolve',
    label: '处理老师归属冲突',
  },
  { key: 'teacher_class.read', label: '查看老师班级' },
  { key: 'teacher_class.create', label: '创建老师班级' },
  { key: 'teacher_class.update', label: '更新老师班级' },
  { key: 'teacher_class.delete', label: '删除老师班级' },
  { key: 'teacher_cooperation.mark', label: '标记老师合作' },
  { key: 'teacher_dashboard.summary', label: '查看老师驾驶舱摘要' },
  { key: 'teacher_follow.read', label: '查看老师跟进' },
  { key: 'teacher_follow.create', label: '创建老师跟进' },
  { key: 'teacher_info.read', label: '查看老师信息' },
  { key: 'teacher_info.create', label: '创建老师信息' },
  { key: 'teacher_info.update', label: '更新老师信息' },
  { key: 'teacher_info.assign', label: '指派老师信息' },
  { key: 'teacher_info.update_status', label: '更新老师信息状态' },
  {
    key: 'teacher_info.attribution_history',
    label: '查看老师归属历史',
  },
  { key: 'teacher_info.attribution_info', label: '查看老师归属信息' },
  { key: 'teacher_todo.read', label: '查看老师待办' },
  { key: 'talent_asset.read', label: '查看人才资产' },
  { key: 'talent_asset.create', label: '创建人才资产' },
  { key: 'talent_asset.update', label: '更新人才资产' },
  { key: 'talent_asset.delete', label: '删除人才资产' },
  { key: 'course.recite.read', label: '查看背诵课程' },
  { key: 'course.recite.submit', label: '提交背诵课程' },
  { key: 'course.practice.read', label: '查看练习课程' },
  { key: 'course.practice.submit', label: '提交练习课程' },
  { key: 'course.exam.summary', label: '查看课程考试结果' },
  { key: 'course.read', label: '查看课程目录' },
  { key: 'course.create', label: '创建课程目录' },
  { key: 'course.update', label: '更新课程目录' },
  { key: 'course.delete', label: '删除课程目录' },
  { key: 'course.enrollment.read', label: '查看课程报名' },
  { key: 'contract.read', label: '查看合同档案' },
  { key: 'contract.create', label: '创建合同档案' },
  { key: 'contract.update', label: '更新合同档案' },
  { key: 'contract.delete', label: '删除合同档案' },
  { key: 'indicator.read', label: '查看指标库' },
  { key: 'indicator.create', label: '创建指标库' },
  { key: 'indicator.update', label: '更新指标库' },
  { key: 'indicator.delete', label: '删除指标库' },
  { key: 'intellectual_property.read', label: '查看知识产权台账' },
  { key: 'intellectual_property.stats', label: '查看知识产权统计' },
  { key: 'intellectual_property.create', label: '创建知识产权记录' },
  { key: 'intellectual_property.update', label: '更新知识产权记录' },
  { key: 'intellectual_property.delete', label: '删除知识产权记录' },
  { key: 'interview.read', label: '查看面试记录' },
  { key: 'interview.create', label: '创建面试记录' },
  { key: 'interview.update', label: '更新面试记录' },
  { key: 'interview.delete', label: '删除面试记录' },
  { key: 'recruit_plan.read', label: '查看招聘计划' },
  { key: 'recruit_plan.create', label: '创建招聘计划' },
  { key: 'recruit_plan.update', label: '更新招聘计划' },
  { key: 'recruit_plan.delete', label: '删除招聘计划' },
  { key: 'recruit_plan.import', label: '导入招聘计划' },
  { key: 'recruit_plan.export', label: '导出招聘计划' },
  { key: 'recruit_plan.submit', label: '提交招聘计划' },
  { key: 'recruit_plan.close', label: '关闭招聘计划' },
  { key: 'recruit_plan.void', label: '作废招聘计划' },
  { key: 'recruit_plan.reopen', label: '重新开启招聘计划' },
  { key: 'resume_pool.read', label: '查看简历库' },
  { key: 'resume_pool.create', label: '创建简历' },
  { key: 'resume_pool.update', label: '更新简历' },
  { key: 'resume_pool.import', label: '导入简历' },
  { key: 'resume_pool.export', label: '导出简历' },
  { key: 'resume_pool.upload_attachment', label: '上传简历附件' },
  { key: 'resume_pool.download_attachment', label: '下载简历附件' },
  { key: 'resume_pool.convert_to_talent_asset', label: '转人才资产' },
  { key: 'resume_pool.create_interview', label: '创建面试安排' },
  { key: 'hiring.read', label: '查看招聘需求' },
  { key: 'hiring.create', label: '创建招聘需求' },
  { key: 'hiring.update_status', label: '更新招聘需求状态' },
  { key: 'hiring.close', label: '关闭招聘需求' },
  { key: 'asset_info.read', label: '查看资产台账' },
  { key: 'asset_info.create', label: '创建资产台账' },
  { key: 'asset_info.update', label: '更新资产台账' },
  { key: 'asset_info.delete', label: '删除资产台账' },
  { key: 'asset_info.update_status', label: '更新资产状态' },
  { key: 'asset_assignment.read', label: '查看资产领用' },
  { key: 'asset_assignment.create', label: '创建资产领用' },
  { key: 'asset_assignment.update', label: '更新资产领用' },
  { key: 'asset_assignment.delete', label: '删除资产领用' },
  { key: 'asset_assignment.return', label: '归还资产' },
  { key: 'asset_assignment.mark_lost', label: '标记资产丢失' },
  { key: 'asset_assignment_request.read', label: '查看资产申领' },
  { key: 'asset_assignment_request.create', label: '创建资产申领' },
  { key: 'asset_assignment_request.update', label: '更新资产申领' },
  { key: 'asset_assignment_request.submit', label: '提交资产申领' },
  { key: 'asset_assignment_request.withdraw', label: '撤回资产申领' },
  { key: 'asset_assignment_request.assign', label: '分配资产申领' },
  { key: 'asset_assignment_request.cancel', label: '取消资产申领' },
  { key: 'asset_dashboard.summary', label: '查看资产首页摘要' },
  { key: 'asset_depreciation.read', label: '查看资产折旧' },
  { key: 'asset_depreciation.summary', label: '查看资产折旧汇总' },
  { key: 'asset_depreciation.recalculate', label: '重算资产折旧' },
  { key: 'asset_disposal.read', label: '查看资产处置' },
  { key: 'asset_disposal.create', label: '创建资产处置' },
  { key: 'asset_disposal.update', label: '更新资产处置' },
  { key: 'asset_disposal.submit', label: '提交资产处置' },
  { key: 'asset_disposal.approve', label: '审批资产处置' },
  { key: 'asset_disposal.execute', label: '执行资产处置' },
  { key: 'asset_disposal.cancel', label: '取消资产处置' },
  { key: 'asset_inventory.read', label: '查看资产盘点' },
  { key: 'asset_inventory.create', label: '创建资产盘点' },
  { key: 'asset_inventory.update', label: '更新资产盘点' },
  { key: 'asset_inventory.start', label: '启动资产盘点' },
  { key: 'asset_inventory.complete', label: '完成资产盘点' },
  { key: 'asset_inventory.close', label: '关闭资产盘点' },
  { key: 'asset_maintenance.read', label: '查看资产维修' },
  { key: 'asset_maintenance.create', label: '创建资产维修' },
  { key: 'asset_maintenance.update', label: '更新资产维修' },
  { key: 'asset_maintenance.complete', label: '完成资产维修' },
  { key: 'asset_maintenance.cancel', label: '取消资产维修' },
  { key: 'asset_maintenance.delete', label: '删除资产维修' },
  { key: 'asset_procurement.read', label: '查看资产采购' },
  { key: 'asset_procurement.create', label: '创建资产采购' },
  { key: 'asset_procurement.update', label: '更新资产采购' },
  { key: 'asset_procurement.submit', label: '提交资产采购' },
  { key: 'asset_procurement.receive', label: '确认资产入库' },
  { key: 'asset_procurement.cancel', label: '取消资产采购' },
  { key: 'asset_report.read', label: '查看资产报表' },
  { key: 'asset_report.summary', label: '查看资产报表汇总' },
  { key: 'asset_report.export', label: '导出资产报表' },
  { key: 'asset_transfer.read', label: '查看资产调拨' },
  { key: 'asset_transfer.create', label: '创建资产调拨' },
  { key: 'asset_transfer.update', label: '更新资产调拨' },
  { key: 'asset_transfer.submit', label: '提交资产调拨' },
  { key: 'asset_transfer.complete', label: '完成资产调拨' },
  { key: 'asset_transfer.cancel', label: '取消资产调拨' },
  { key: 'material.catalog.read', label: '查看物料目录' },
  { key: 'material.catalog.create', label: '创建物料目录' },
  { key: 'material.catalog.update', label: '更新物料目录' },
  { key: 'material.catalog.delete', label: '删除物料目录' },
  { key: 'material.catalog.update_status', label: '更新物料目录状态' },
  { key: 'material.stock.read', label: '查看物料库存' },
  { key: 'material.stock.summary', label: '查看物料库存汇总' },
  { key: 'material.inbound.read', label: '查看物料入库单' },
  { key: 'material.inbound.create', label: '创建物料入库单' },
  { key: 'material.inbound.update', label: '更新物料入库单' },
  { key: 'material.inbound.submit', label: '提交物料入库单' },
  { key: 'material.inbound.receive', label: '确认物料入库' },
  { key: 'material.inbound.cancel', label: '取消物料入库单' },
  { key: 'material.issue.read', label: '查看物料领用单' },
  { key: 'material.issue.create', label: '创建物料领用单' },
  { key: 'material.issue.update', label: '更新物料领用单' },
  { key: 'material.issue.submit', label: '提交物料领用单' },
  { key: 'material.issue.issue', label: '执行物料出库' },
  { key: 'material.issue.cancel', label: '取消物料领用单' },
  { key: 'material.stocklog.read', label: '查看物料库存流水' },
  { key: 'salary.read', label: '查看薪酬档案' },
  { key: 'salary.create', label: '创建薪酬档案' },
  { key: 'salary.update', label: '更新薪酬档案' },
  { key: 'salary.confirm', label: '确认薪酬档案' },
  { key: 'salary.archive', label: '归档薪酬档案' },
  { key: 'salary.change_add', label: '新增调薪记录' },
  { key: 'feedback.task.read', label: '查看反馈任务' },
  { key: 'feedback.task.create', label: '创建反馈任务' },
  { key: 'feedback.record.submit', label: '提交反馈记录' },
  { key: 'feedback.summary.read', label: '查看反馈汇总' },
  { key: 'feedback.export', label: '导出反馈记录' },
  { key: 'suggestion.read', label: '查看建议记录' },
  { key: 'suggestion.accept', label: '采纳建议' },
  { key: 'suggestion.ignore', label: '忽略建议' },
  { key: 'suggestion.reject', label: '驳回建议' },
  { key: 'suggestion.revoke', label: '撤销建议' },
  { key: 'promotion.read', label: '查看晋升记录' },
  { key: 'promotion.create', label: '创建晋升记录' },
  { key: 'promotion.update', label: '更新晋升记录' },
  { key: 'promotion.submit', label: '提交晋升记录' },
  { key: 'promotion.review', label: '审核晋升记录' },
  { key: 'pip.read', label: '查看 PIP 记录' },
  { key: 'pip.create', label: '创建 PIP 记录' },
  { key: 'pip.update', label: '更新 PIP 记录' },
  { key: 'pip.start', label: '启动 PIP 记录' },
  { key: 'pip.track', label: '跟进 PIP 记录' },
  { key: 'pip.complete', label: '完成 PIP 记录' },
  { key: 'pip.close', label: '关闭 PIP 记录' },
  { key: 'pip.export', label: '导出 PIP 记录' },
  { key: 'workplan.read', label: '查看工作计划' },
  { key: 'workplan.create', label: '创建工作计划' },
  { key: 'workplan.update', label: '更新工作计划' },
  { key: 'workplan.delete', label: '删除工作计划' },
  { key: 'workplan.start', label: '启动工作计划' },
  { key: 'workplan.complete', label: '完成工作计划' },
  { key: 'workplan.cancel', label: '取消工作计划' },
  { key: 'workplan.sync', label: '同步工作计划' },
  { key: 'meeting.page', label: '查看会议页面' },
  { key: 'meeting.read', label: '查看会议记录' },
  { key: 'meeting.create', label: '创建会议记录' },
  { key: 'meeting.update', label: '更新会议记录' },
  { key: 'meeting.delete', label: '删除会议记录' },
  { key: 'meeting.checkin', label: '会议签到' },
  { key: 'supplier.read', label: '查看供应商' },
  { key: 'supplier.create', label: '创建供应商' },
  { key: 'supplier.update', label: '更新供应商' },
  { key: 'supplier.delete', label: '删除供应商' },
  { key: 'vehicle.read', label: '查看车辆台账' },
  { key: 'vehicle.stats', label: '查看车辆统计' },
  { key: 'vehicle.create', label: '创建车辆台账' },
  { key: 'vehicle.update', label: '更新车辆台账' },
  { key: 'vehicle.delete', label: '删除车辆台账' },
  { key: 'document.read', label: '查看文档中心' },
  { key: 'document.stats', label: '查看文档中心统计' },
  { key: 'document.create', label: '创建文档记录' },
  { key: 'document.update', label: '更新文档记录' },
  { key: 'document.delete', label: '删除文档记录' },
  { key: 'knowledge_base.read', label: '查看知识库' },
  { key: 'knowledge_base.stats', label: '查看知识库统计' },
  { key: 'knowledge_base.create', label: '创建知识库记录' },
  { key: 'knowledge_base.update', label: '更新知识库记录' },
  { key: 'knowledge_base.delete', label: '删除知识库记录' },
  { key: 'knowledge_base.graph', label: '查看知识图谱' },
  { key: 'knowledge_base.search', label: '执行知识检索' },
  { key: 'knowledge_base.qa_read', label: '查看知识问答' },
  { key: 'knowledge_base.qa_create', label: '创建知识问答' },
  { key: 'office.annual_inspection.read', label: '查看年检台账' },
  { key: 'office.annual_inspection.stats', label: '查看年检统计' },
  { key: 'office.annual_inspection.create', label: '创建年检记录' },
  { key: 'office.annual_inspection.update', label: '更新年检记录' },
  { key: 'office.annual_inspection.delete', label: '删除年检记录' },
  { key: 'office.honor.read', label: '查看荣誉台账' },
  { key: 'office.honor.stats', label: '查看荣誉统计' },
  { key: 'office.honor.create', label: '创建荣誉记录' },
  { key: 'office.honor.update', label: '更新荣誉记录' },
  { key: 'office.honor.delete', label: '删除荣誉记录' },
  { key: 'office.publicity_material.read', label: '查看宣传物料' },
  { key: 'office.publicity_material.stats', label: '查看宣传物料统计' },
  { key: 'office.publicity_material.create', label: '创建宣传物料' },
  { key: 'office.publicity_material.update', label: '更新宣传物料' },
  { key: 'office.publicity_material.delete', label: '删除宣传物料' },
  { key: 'office.design_collab.read', label: '查看设计协作' },
  { key: 'office.design_collab.stats', label: '查看设计协作统计' },
  { key: 'office.design_collab.create', label: '创建设计协作' },
  { key: 'office.design_collab.update', label: '更新设计协作' },
  { key: 'office.design_collab.delete', label: '删除设计协作' },
  { key: 'office.express_collab.read', label: '查看快递协作' },
  { key: 'office.express_collab.stats', label: '查看快递协作统计' },
  { key: 'office.express_collab.create', label: '创建快递协作' },
  { key: 'office.express_collab.update', label: '更新快递协作' },
  { key: 'office.express_collab.delete', label: '删除快递协作' },
  { key: 'workbench.persona.switch', label: '切换工作台视角' },
] as const satisfies readonly PerformanceCapabilityDefinition[];

export const PERFORMANCE_SCOPES = [
  { key: 'self', label: '本人' },
  { key: 'assigned_domain', label: '负责域' },
  { key: 'department', label: '部门' },
  { key: 'department_tree', label: '部门树' },
  { key: 'company', label: '公司级' },
] as const satisfies readonly PerformanceScopeDefinition[];

export type PerformanceRegisteredScopeKey =
  typeof PERFORMANCE_SCOPES[number]['key'];

export const PERFORMANCE_STATE_GUARDS = [
  {
    key: 'assessment.submit',
    aggregate: 'assessment',
    capabilityKey: 'assessment.submit',
    allowedStatuses: ['draft', 'rejected'],
  },
  {
    key: 'assessment.review.approve',
    aggregate: 'assessment',
    capabilityKey: 'assessment.review.approve',
    allowedStatuses: ['submitted'],
  },
  {
    key: 'approval.instance.approve',
    aggregate: 'approval-flow',
    capabilityKey: 'approval.instance.approve',
    allowedStatuses: ['pending'],
  },
  {
    key: 'approval.instance.reject',
    aggregate: 'approval-flow',
    capabilityKey: 'approval.instance.reject',
    allowedStatuses: ['pending'],
  },
] as const satisfies readonly PerformanceStateGuardDefinition[];
