/**
 * Performance 领域错误目录。
 * 这里只负责声明稳定错误码、分类与默认消息，不负责直接抛异常或决定 HTTP 状态码。
 * 关键依赖是后续 service、OpenAPI 错误语义和前端错误处理都能从同一目录读取一致定义。
 * 维护重点是错误码必须稳定唯一，避免 message 字符串继续成为隐式契约。
 */

export type PerformanceDomainErrorCategory =
  | 'auth'
  | 'permission'
  | 'validation'
  | 'not_found'
  | 'state'
  | 'dependency';

export interface PerformanceDomainErrorDefinition {
  code: string;
  category: PerformanceDomainErrorCategory;
  defaultMessage: string;
}

export const PERFORMANCE_DOMAIN_ERROR_CODES = Object.freeze({
  authContextMissing: 'PERF_AUTH_CONTEXT_MISSING',
  permissionServiceMissing: 'PERF_PERMISSION_SERVICE_MISSING',
  departmentScopeServiceMissing: 'PERF_DEPARTMENT_SCOPE_SERVICE_MISSING',
  assessmentPermissionDenied: 'PERF_ASSESSMENT_PERMISSION_DENIED',
  assessmentInvalidTransition: 'PERF_ASSESSMENT_INVALID_TRANSITION',
  stateActionNotAllowed: 'PERF_STATE_ACTION_NOT_ALLOWED',
  stateEditNotAllowed: 'PERF_STATE_EDIT_NOT_ALLOWED',
  stateDeleteNotAllowed: 'PERF_STATE_DELETE_NOT_ALLOWED',
  stateDraftEditOnly: 'PERF_STATE_DRAFT_EDIT_ONLY',
  stateDraftSubmitOnly: 'PERF_STATE_DRAFT_SUBMIT_ONLY',
  stateCancelNotAllowed: 'PERF_STATE_CANCEL_NOT_ALLOWED',
  stateSubmittedReceiveOnly: 'PERF_STATE_SUBMITTED_RECEIVE_ONLY',
  stateSubmittedApproveOnly: 'PERF_STATE_SUBMITTED_APPROVE_ONLY',
  stateApprovedExecuteOnly: 'PERF_STATE_APPROVED_EXECUTE_ONLY',
  stateCloseNotAllowed: 'PERF_STATE_CLOSE_NOT_ALLOWED',
  stateMissing: 'PERF_STATE_MISSING',
  targetDepartmentRequired: 'PERF_TARGET_DEPARTMENT_REQUIRED',
  goalTitleRequired: 'PERF_GOAL_TITLE_REQUIRED',
  ownerRequired: 'PERF_OWNER_REQUIRED',
  employeeRequired: 'PERF_EMPLOYEE_REQUIRED',
  sourceTypeInvalid: 'PERF_SOURCE_TYPE_INVALID',
  suggestionActionUnsupported: 'PERF_SUGGESTION_ACTION_UNSUPPORTED',
  targetValuePositive: 'PERF_TARGET_VALUE_POSITIVE',
  dateRangeRequired: 'PERF_DATE_RANGE_REQUIRED',
  dateRangeInvalid: 'PERF_DATE_RANGE_INVALID',
  goalCurrentValueNonNegative: 'PERF_GOAL_CURRENT_VALUE_NON_NEGATIVE',
  goalCompletedRollbackDenied: 'PERF_GOAL_COMPLETED_ROLLBACK_DENIED',
  goalCompletedProgressUpdateDenied:
    'PERF_GOAL_COMPLETED_PROGRESS_UPDATE_DENIED',
  goalCancelledProgressUpdateDenied:
    'PERF_GOAL_CANCELLED_PROGRESS_UPDATE_DENIED',
  goalEditStateDenied: 'PERF_GOAL_EDIT_STATE_DENIED',
  importFileNotFound: 'PERF_IMPORT_FILE_NOT_FOUND',
  idRequired: 'PERF_ID_REQUIRED',
  numericFieldInvalid: 'PERF_NUMERIC_FIELD_INVALID',
  jsonFieldInvalid: 'PERF_JSON_FIELD_INVALID',
  pipActionUnsupported: 'PERF_PIP_ACTION_UNSUPPORTED',
  invalidRelatedFiles: 'PERF_INVALID_RELATED_FILES',
  stateTargetUpdateNotAllowed: 'PERF_STATE_TARGET_UPDATE_NOT_ALLOWED',
  importFileRequired: 'PERF_IMPORT_FILE_REQUIRED',
  employeeIdInvalid: 'PERF_EMPLOYEE_ID_INVALID',
  stateInterviewCreateNotAllowed: 'PERF_STATE_INTERVIEW_CREATE_NOT_ALLOWED',
  stateInterviewRecreateNotAllowed: 'PERF_STATE_INTERVIEW_RECREATE_NOT_ALLOWED',
  invalidRelatedKnowledge: 'PERF_INVALID_RELATED_KNOWLEDGE',
  qaQuestionRequired: 'PERF_QA_QUESTION_REQUIRED',
  qaAnswerRequired: 'PERF_QA_ANSWER_REQUIRED',
  meetingStatusInvalid: 'PERF_MEETING_STATUS_INVALID',
  capabilityModelStatusInvalid: 'PERF_CAPABILITY_MODEL_STATUS_INVALID',
  capabilityModelAddDraftOnly: 'PERF_CAPABILITY_MODEL_ADD_DRAFT_ONLY',
  pipTitleRequired: 'PERF_PIP_TITLE_REQUIRED',
  pipImprovementGoalRequired: 'PERF_PIP_IMPROVEMENT_GOAL_REQUIRED',
  pipSourceReasonRequired: 'PERF_PIP_SOURCE_REASON_REQUIRED',
  pipStartDraftOnly: 'PERF_PIP_START_DRAFT_ONLY',
  pipTrackActiveOnly: 'PERF_PIP_TRACK_ACTIVE_ONLY',
  pipCompleteActiveOnly: 'PERF_PIP_COMPLETE_ACTIVE_ONLY',
  pipCloseActiveOnly: 'PERF_PIP_CLOSE_ACTIVE_ONLY',
  pipEditNotAllowed: 'PERF_PIP_EDIT_NOT_ALLOWED',
  suggestionRevokeHrOnly: 'PERF_SUGGESTION_REVOKE_HR_ONLY',
  meetingCancelRoleDenied: 'PERF_MEETING_CANCEL_ROLE_DENIED',
  stateTransitionTargetNotAllowed:
    'PERF_STATE_TRANSITION_TARGET_NOT_ALLOWED',
  courseStatusInvalid: 'PERF_COURSE_STATUS_INVALID',
  courseTitleRequired: 'PERF_COURSE_TITLE_REQUIRED',
  courseAddDraftOnly: 'PERF_COURSE_ADD_DRAFT_ONLY',
  coursePublishedTitleEditDenied:
    'PERF_COURSE_PUBLISHED_TITLE_EDIT_DENIED',
  coursePublishedCodeEditDenied: 'PERF_COURSE_PUBLISHED_CODE_EDIT_DENIED',
  coursePublishedCategoryEditDenied:
    'PERF_COURSE_PUBLISHED_CATEGORY_EDIT_DENIED',
  coursePublishedStartDateEditDenied:
    'PERF_COURSE_PUBLISHED_START_DATE_EDIT_DENIED',
  courseEvaluatedTaskResubmitDenied:
    'PERF_COURSE_EVALUATED_TASK_RESUBMIT_DENIED',
  certificateIdInvalid: 'PERF_CERTIFICATE_ID_INVALID',
  certificateStatusInvalid: 'PERF_CERTIFICATE_STATUS_INVALID',
  certificateRecordStatusInvalid: 'PERF_CERTIFICATE_RECORD_STATUS_INVALID',
  certificateAddDraftOnly: 'PERF_CERTIFICATE_ADD_DRAFT_ONLY',
  purchaseOrderOperateDenied: 'PERF_PURCHASE_ORDER_OPERATE_DENIED',
  purchaseOrderSubmitInquiryStateDenied:
    'PERF_PURCHASE_ORDER_SUBMIT_INQUIRY_STATE_DENIED',
  purchaseOrderSubmitApprovalStateDenied:
    'PERF_PURCHASE_ORDER_SUBMIT_APPROVAL_STATE_DENIED',
  purchaseOrderApproveStateDenied:
    'PERF_PURCHASE_ORDER_APPROVE_STATE_DENIED',
  purchaseOrderRejectStateDenied:
    'PERF_PURCHASE_ORDER_REJECT_STATE_DENIED',
  purchaseOrderReceiveStateDenied:
    'PERF_PURCHASE_ORDER_RECEIVE_STATE_DENIED',
  purchaseOrderStatusInvalid: 'PERF_PURCHASE_ORDER_STATUS_INVALID',
  purchaseOrderCurrencyInvalid: 'PERF_PURCHASE_ORDER_CURRENCY_INVALID',
  purchaseOrderTotalAmountInvalid:
    'PERF_PURCHASE_ORDER_TOTAL_AMOUNT_INVALID',
  purchaseOrderItemsInvalid: 'PERF_PURCHASE_ORDER_ITEMS_INVALID',
  purchaseOrderOrderNoDuplicate: 'PERF_PURCHASE_ORDER_ORDER_NO_DUPLICATE',
  purchaseOrderRequesterNotFound: 'PERF_PURCHASE_ORDER_REQUESTER_NOT_FOUND',
  purchaseOrderStatusActionRequired:
    'PERF_PURCHASE_ORDER_STATUS_ACTION_REQUIRED',
  purchaseOrderReceiptQuantityExceeded:
    'PERF_PURCHASE_ORDER_RECEIPT_QUANTITY_EXCEEDED',
  teacherClassClosedEditDenied: 'PERF_TEACHER_CLASS_CLOSED_EDIT_DENIED',
  teacherClassCreatePartneredOnly:
    'PERF_TEACHER_CLASS_CREATE_PARTNERED_ONLY',
  teacherClassDeleteDraftOnly: 'PERF_TEACHER_CLASS_DELETE_DRAFT_ONLY',
  teacherClassDraftTransitionOnly:
    'PERF_TEACHER_CLASS_DRAFT_TRANSITION_ONLY',
  teacherClassActionNotAllowed: 'PERF_TEACHER_CLASS_ACTION_NOT_ALLOWED',
  teacherNegotiatingTransitionDenied:
    'PERF_TEACHER_NEGOTIATING_TRANSITION_DENIED',
  teacherTerminateRoleDenied: 'PERF_TEACHER_TERMINATE_ROLE_DENIED',
  teacherTerminatePartneredOnly:
    'PERF_TEACHER_TERMINATE_PARTNERED_ONLY',
  teacherStatusActionUnsupported:
    'PERF_TEACHER_STATUS_ACTION_UNSUPPORTED',
  teacherCooperationMarkFollowRequired:
    'PERF_TEACHER_COOPERATION_MARK_FOLLOW_REQUIRED',
  teacherCooperationMarkStateDenied:
    'PERF_TEACHER_COOPERATION_MARK_STATE_DENIED',
  teacherClassCreateTerminatedDenied:
    'PERF_TEACHER_CLASS_CREATE_TERMINATED_DENIED',
  teacherCooperationStatusInvalid:
    'PERF_TEACHER_COOPERATION_STATUS_INVALID',
  teacherClassStatusInvalid: 'PERF_TEACHER_CLASS_STATUS_INVALID',
  teacherCooperationStatusPresetDenied:
    'PERF_TEACHER_COOPERATION_STATUS_PRESET_DENIED',
  teacherAssignDenied: 'PERF_TEACHER_ASSIGN_DENIED',
  teacherAssignTargetDepartmentDenied:
    'PERF_TEACHER_ASSIGN_TARGET_DEPARTMENT_DENIED',
  teacherClassCloseRoleDenied: 'PERF_TEACHER_CLASS_CLOSE_ROLE_DENIED',
  teacherAgentStatusInvalid: 'PERF_TEACHER_AGENT_STATUS_INVALID',
  teacherAgentBlacklistStatusInvalid:
    'PERF_TEACHER_AGENT_BLACKLIST_STATUS_INVALID',
  teacherAgentRelationStatusInvalid:
    'PERF_TEACHER_AGENT_RELATION_STATUS_INVALID',
  teacherAgentAuditViewDenied: 'PERF_TEACHER_AGENT_AUDIT_VIEW_DENIED',
  teacherAgentRelationSelfLoopDenied:
    'PERF_TEACHER_AGENT_RELATION_SELF_LOOP_DENIED',
  teacherAgentRelationTargetInactive:
    'PERF_TEACHER_AGENT_RELATION_TARGET_INACTIVE',
  teacherAgentCycleDenied: 'PERF_TEACHER_AGENT_CYCLE_DENIED',
  teacherAttributionStatusInvalid:
    'PERF_TEACHER_ATTRIBUTION_STATUS_INVALID',
  teacherAttributionConflictResolveDenied:
    'PERF_TEACHER_ATTRIBUTION_CONFLICT_RESOLVE_DENIED',
  teacherAttributionCreateTerminatedDenied:
    'PERF_TEACHER_ATTRIBUTION_CREATE_TERMINATED_DENIED',
  teacherAttributionAssignExistingDenied:
    'PERF_TEACHER_ATTRIBUTION_ASSIGN_EXISTING_DENIED',
  teacherAttributionAgentInactive:
    'PERF_TEACHER_ATTRIBUTION_AGENT_INACTIVE',
  teacherAttributionAgentBlacklisted:
    'PERF_TEACHER_ATTRIBUTION_AGENT_BLACKLISTED',
  teacherAttributionConflictStatusInvalid:
    'PERF_TEACHER_ATTRIBUTION_CONFLICT_STATUS_INVALID',
  teacherAttributionConflictClosed:
    'PERF_TEACHER_ATTRIBUTION_CONFLICT_CLOSED',
  teacherAttributionConflictResolutionInvalid:
    'PERF_TEACHER_ATTRIBUTION_CONFLICT_RESOLUTION_INVALID',
  teacherCurrentAttributionMissing:
    'PERF_TEACHER_CURRENT_ATTRIBUTION_MISSING',
  goalOpsReportDateRequired: 'PERF_GOAL_OPS_REPORT_DATE_REQUIRED',
  goalOpsAutoZeroDateRequired: 'PERF_GOAL_OPS_AUTO_ZERO_DATE_REQUIRED',
  goalOpsQueryDateRequired: 'PERF_GOAL_OPS_QUERY_DATE_REQUIRED',
  goalOpsResultSubmitStateDenied:
    'PERF_GOAL_OPS_RESULT_SUBMIT_STATE_DENIED',
  goalOpsPeriodTypeInvalid: 'PERF_GOAL_OPS_PERIOD_TYPE_INVALID',
  goalOpsPeriodRangeRequired: 'PERF_GOAL_OPS_PERIOD_RANGE_REQUIRED',
  goalOpsPeriodRangeInvalid: 'PERF_GOAL_OPS_PERIOD_RANGE_INVALID',
  goalOpsDailyPlanDateRequired:
    'PERF_GOAL_OPS_DAILY_PLAN_DATE_REQUIRED',
  goalOpsPlanDateOutOfRange: 'PERF_GOAL_OPS_PLAN_DATE_OUT_OF_RANGE',
  goalOpsSourceTypeInvalid: 'PERF_GOAL_OPS_SOURCE_TYPE_INVALID',
  feedbackTaskViewDenied: 'PERF_FEEDBACK_TASK_VIEW_DENIED',
  feedbackSummaryDraftDenied: 'PERF_FEEDBACK_SUMMARY_DRAFT_DENIED',
  feedbackTaskClosed: 'PERF_FEEDBACK_TASK_CLOSED',
  assetNoDuplicate: 'PERF_ASSET_NO_DUPLICATE',
  resumeImportOverwriteStateDenied:
    'PERF_RESUME_IMPORT_OVERWRITE_STATE_DENIED',
  resumeUploadAttachmentStateDenied:
    'PERF_RESUME_UPLOAD_ATTACHMENT_STATE_DENIED',
  resumeConvertTalentAssetStateDenied:
    'PERF_RESUME_CONVERT_TALENT_ASSET_STATE_DENIED',
  resumeAttachmentFileNotFound: 'PERF_RESUME_ATTACHMENT_FILE_NOT_FOUND',
  resumeStatusInvalid: 'PERF_RESUME_STATUS_INVALID',
  resumeSourceTypeInvalid: 'PERF_RESUME_SOURCE_TYPE_INVALID',
  resumeExternalLinkExternalOnly:
    'PERF_RESUME_EXTERNAL_LINK_EXTERNAL_ONLY',
  resumeCreateNewOnly: 'PERF_RESUME_CREATE_NEW_ONLY',
  resumeInterviewTransitionActionRequired:
    'PERF_RESUME_INTERVIEW_TRANSITION_ACTION_REQUIRED',
  resumeInterviewPositionRequired:
    'PERF_RESUME_INTERVIEW_POSITION_REQUIRED',
  resumeRecruitPlanDepartmentMismatch:
    'PERF_RESUME_RECRUIT_PLAN_DEPARTMENT_MISMATCH',
  resumeJobStandardDepartmentMismatch:
    'PERF_RESUME_JOB_STANDARD_DEPARTMENT_MISMATCH',
  resumeOperateDenied: 'PERF_RESUME_OPERATE_DENIED',
  suggestionLinkedEntityTypeMismatch:
    'PERF_SUGGESTION_LINKED_ENTITY_TYPE_MISMATCH',
  suggestionAcceptedOnly: 'PERF_SUGGESTION_ACCEPTED_ONLY',
  suggestionEmployeeMismatch: 'PERF_SUGGESTION_EMPLOYEE_MISMATCH',
  suggestionAssessmentMismatch: 'PERF_SUGGESTION_ASSESSMENT_MISMATCH',
  suggestionAlreadyLinked: 'PERF_SUGGESTION_ALREADY_LINKED',
  approvalObjectInvalid: 'PERF_APPROVAL_OBJECT_INVALID',
  approvalInvalidTransition: 'PERF_APPROVAL_INVALID_TRANSITION',
  approvalInstanceEnded: 'PERF_APPROVAL_INSTANCE_ENDED',
  readonlyWriteDenied: 'PERF_READONLY_WRITE_DENIED',
  resourceNotFound: 'PERF_RESOURCE_NOT_FOUND',
  employeeNotFound: 'PERF_EMPLOYEE_NOT_FOUND',
  ownerNotFound: 'PERF_OWNER_NOT_FOUND',
  assessmentNotFound: 'PERF_ASSESSMENT_NOT_FOUND',
  resumeNotFound: 'PERF_RESUME_NOT_FOUND',
  recruitPlanNotFound: 'PERF_RECRUIT_PLAN_NOT_FOUND',
  jobStandardNotFound: 'PERF_JOB_STANDARD_NOT_FOUND',
  jobStandardInactiveEditDenied:
    'PERF_JOB_STANDARD_INACTIVE_EDIT_DENIED',
  jobStandardIdInvalid: 'PERF_JOB_STANDARD_ID_INVALID',
  jobStandardTransitionDenied: 'PERF_JOB_STANDARD_TRANSITION_DENIED',
  jobStandardPositionNameRequired:
    'PERF_JOB_STANDARD_POSITION_NAME_REQUIRED',
  jobStandardCreateDraftOnly: 'PERF_JOB_STANDARD_CREATE_DRAFT_ONLY',
  jobStandardStatusActionRequired:
    'PERF_JOB_STANDARD_STATUS_ACTION_REQUIRED',
  jobStandardStatusInvalid: 'PERF_JOB_STANDARD_STATUS_INVALID',
  contractCreateDraftOnly: 'PERF_CONTRACT_CREATE_DRAFT_ONLY',
  contractTypeInvalid: 'PERF_CONTRACT_TYPE_INVALID',
  contractStatusInvalid: 'PERF_CONTRACT_STATUS_INVALID',
  contractProbationInvalid: 'PERF_CONTRACT_PROBATION_INVALID',
  contractSalaryInvalid: 'PERF_CONTRACT_SALARY_INVALID',
  contractDateRangeInvalid: 'PERF_CONTRACT_DATE_RANGE_INVALID',
  knowledgeDeleteSelectionRequired:
    'PERF_KNOWLEDGE_DELETE_SELECTION_REQUIRED',
  knowledgeDeletePartialMissing:
    'PERF_KNOWLEDGE_DELETE_PARTIAL_MISSING',
  knowledgeIdInvalid: 'PERF_KNOWLEDGE_ID_INVALID',
  knowledgeNotFound: 'PERF_KNOWLEDGE_NOT_FOUND',
  knowledgeKbNoRequired: 'PERF_KNOWLEDGE_KB_NO_REQUIRED',
  knowledgeTitleRequired: 'PERF_KNOWLEDGE_TITLE_REQUIRED',
  knowledgeCategoryRequired: 'PERF_KNOWLEDGE_CATEGORY_REQUIRED',
  knowledgeSummaryRequired: 'PERF_KNOWLEDGE_SUMMARY_REQUIRED',
  knowledgeStatusInvalid: 'PERF_KNOWLEDGE_STATUS_INVALID',
  knowledgeKbNoDuplicate: 'PERF_KNOWLEDGE_KB_NO_DUPLICATE',
  salaryConfirmedEditDenied: 'PERF_SALARY_CONFIRMED_EDIT_DENIED',
  salaryChangeReasonRequired: 'PERF_SALARY_CHANGE_REASON_REQUIRED',
  salaryPeriodRequired: 'PERF_SALARY_PERIOD_REQUIRED',
  salaryEffectiveDateRequired: 'PERF_SALARY_EFFECTIVE_DATE_REQUIRED',
  promotionSponsorRequired: 'PERF_PROMOTION_SPONSOR_REQUIRED',
  promotionFromPositionRequired: 'PERF_PROMOTION_FROM_POSITION_REQUIRED',
  promotionToPositionRequired: 'PERF_PROMOTION_TO_POSITION_REQUIRED',
  promotionIndependentReasonRequired:
    'PERF_PROMOTION_INDEPENDENT_REASON_REQUIRED',
  promotionDecisionInvalid: 'PERF_PROMOTION_DECISION_INVALID',
  talentAssetNotFound: 'PERF_TALENT_ASSET_NOT_FOUND',
  sourceSuggestionNotFound: 'PERF_SOURCE_SUGGESTION_NOT_FOUND',
  attachmentNotFound: 'PERF_ATTACHMENT_NOT_FOUND',
  departmentNotFound: 'PERF_DEPARTMENT_NOT_FOUND',
  targetDepartmentNotFound: 'PERF_TARGET_DEPARTMENT_NOT_FOUND',
  supplierNotFound: 'PERF_SUPPLIER_NOT_FOUND',
  assetNotFound: 'PERF_ASSET_NOT_FOUND',
  purchaseOrderNotFound: 'PERF_PURCHASE_ORDER_NOT_FOUND',
  employeeDepartmentNotFound: 'PERF_EMPLOYEE_DEPARTMENT_NOT_FOUND',
  assetAssignmentRequestNotFound: 'PERF_ASSET_ASSIGNMENT_REQUEST_NOT_FOUND',
  assetAssignmentRecordNotFound: 'PERF_ASSET_ASSIGNMENT_RECORD_NOT_FOUND',
  assetMaintenanceRecordNotFound: 'PERF_ASSET_MAINTENANCE_RECORD_NOT_FOUND',
  materialCatalogNotFound: 'PERF_MATERIAL_CATALOG_NOT_FOUND',
  approvalInstanceNotFound: 'PERF_APPROVAL_INSTANCE_NOT_FOUND',
  assetProcurementNotFound: 'PERF_ASSET_PROCUREMENT_NOT_FOUND',
  assetTransferNotFound: 'PERF_ASSET_TRANSFER_NOT_FOUND',
  assetInventoryNotFound: 'PERF_ASSET_INVENTORY_NOT_FOUND',
  assetDisposalNotFound: 'PERF_ASSET_DISPOSAL_NOT_FOUND',
  materialInboundNotFound: 'PERF_MATERIAL_INBOUND_NOT_FOUND',
  materialIssueNotFound: 'PERF_MATERIAL_ISSUE_NOT_FOUND',
  goalOpsReportNotFound: 'PERF_GOAL_OPS_REPORT_NOT_FOUND',
} as const);

export type PerformanceDomainErrorCode =
  (typeof PERFORMANCE_DOMAIN_ERROR_CODES)[keyof typeof PERFORMANCE_DOMAIN_ERROR_CODES];

export const PERFORMANCE_DOMAIN_ERRORS = [
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.authContextMissing,
    category: 'auth',
    defaultMessage: '登录上下文缺失',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.permissionServiceMissing,
    category: 'dependency',
    defaultMessage: '权限服务缺失',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.departmentScopeServiceMissing,
    category: 'dependency',
    defaultMessage: '部门权限服务缺失',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assessmentPermissionDenied,
    category: 'permission',
    defaultMessage: '无权限访问评估单',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assessmentInvalidTransition,
    category: 'state',
    defaultMessage: '当前状态不允许执行该操作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateActionNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许执行该操作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许编辑',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateDeleteNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许删除',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftEditOnly,
    category: 'state',
    defaultMessage: '仅 draft 状态允许编辑',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftSubmitOnly,
    category: 'state',
    defaultMessage: '仅 draft 状态允许提交',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateCancelNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许取消',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateSubmittedReceiveOnly,
    category: 'state',
    defaultMessage: '仅 submitted 状态允许确认入库',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateSubmittedApproveOnly,
    category: 'state',
    defaultMessage: '仅 submitted 状态允许审批',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateApprovedExecuteOnly,
    category: 'state',
    defaultMessage: '仅 approved 状态允许执行报废',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateCloseNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许关闭',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateMissing,
    category: 'state',
    defaultMessage: '当前状态缺失',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired,
    category: 'validation',
    defaultMessage: '目标部门不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalTitleRequired,
    category: 'validation',
    defaultMessage: '目标标题不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.ownerRequired,
    category: 'validation',
    defaultMessage: '负责人不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.employeeRequired,
    category: 'validation',
    defaultMessage: '员工不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.sourceTypeInvalid,
    category: 'validation',
    defaultMessage: '来源类型不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.suggestionActionUnsupported,
    category: 'validation',
    defaultMessage: '不支持的建议动作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.targetValuePositive,
    category: 'validation',
    defaultMessage: '目标值必须大于 0',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeRequired,
    category: 'validation',
    defaultMessage: '开始日期和结束日期不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeInvalid,
    category: 'validation',
    defaultMessage: '开始日期不能晚于结束日期',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalCurrentValueNonNegative,
    category: 'validation',
    defaultMessage: '当前值不能小于 0',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalCompletedRollbackDenied,
    category: 'state',
    defaultMessage: '已完成目标不能回退为进行中',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalCompletedProgressUpdateDenied,
    category: 'state',
    defaultMessage: '已完成目标不能继续更新进度',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalCancelledProgressUpdateDenied,
    category: 'state',
    defaultMessage: '已取消目标不能继续更新进度',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalEditStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许编辑目标',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.importFileNotFound,
    category: 'not_found',
    defaultMessage: '导入文件不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.idRequired,
    category: 'validation',
    defaultMessage: 'ID不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.numericFieldInvalid,
    category: 'validation',
    defaultMessage: '数字字段不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.jsonFieldInvalid,
    category: 'validation',
    defaultMessage: 'JSON 字段格式不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.pipActionUnsupported,
    category: 'validation',
    defaultMessage: '不支持的 PIP 动作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.invalidRelatedFiles,
    category: 'validation',
    defaultMessage: '存在无效的关联文件',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateTargetUpdateNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许更新到目标状态',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.importFileRequired,
    category: 'validation',
    defaultMessage: '导入文件不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.employeeIdInvalid,
    category: 'validation',
    defaultMessage: '员工 ID 不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateInterviewCreateNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许发起面试',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateInterviewRecreateNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许再次发起面试',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.invalidRelatedKnowledge,
    category: 'validation',
    defaultMessage: '存在无效的关联知识条目',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.qaQuestionRequired,
    category: 'validation',
    defaultMessage: '问题不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.qaAnswerRequired,
    category: 'validation',
    defaultMessage: '答案不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.meetingStatusInvalid,
    category: 'validation',
    defaultMessage: '会议状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.capabilityModelStatusInvalid,
    category: 'validation',
    defaultMessage: '能力模型状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.capabilityModelAddDraftOnly,
    category: 'state',
    defaultMessage: '新增能力模型状态只能为 draft',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.pipTitleRequired,
    category: 'validation',
    defaultMessage: 'PIP 标题不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.pipImprovementGoalRequired,
    category: 'validation',
    defaultMessage: '改进目标不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.pipSourceReasonRequired,
    category: 'validation',
    defaultMessage: '独立创建必须填写来源原因',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.pipStartDraftOnly,
    category: 'state',
    defaultMessage: '只有草稿状态的 PIP 可以启动',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.pipTrackActiveOnly,
    category: 'state',
    defaultMessage: '只有进行中的 PIP 可以提交跟进',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.pipCompleteActiveOnly,
    category: 'state',
    defaultMessage: '只有进行中的 PIP 可以完成',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.pipCloseActiveOnly,
    category: 'state',
    defaultMessage: '只有进行中的 PIP 可以关闭',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.pipEditNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许编辑 PIP',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.suggestionRevokeHrOnly,
    category: 'permission',
    defaultMessage: '只有 HR 可以撤销建议',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.meetingCancelRoleDenied,
    category: 'permission',
    defaultMessage: '当前角色不允许取消进行中的会议',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.stateTransitionTargetNotAllowed,
    category: 'state',
    defaultMessage: '当前状态不允许流转到目标状态',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.courseStatusInvalid,
    category: 'validation',
    defaultMessage: '课程状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.courseTitleRequired,
    category: 'validation',
    defaultMessage: '课程标题不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.courseAddDraftOnly,
    category: 'state',
    defaultMessage: '新建课程默认保存为草稿',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedTitleEditDenied,
    category: 'state',
    defaultMessage: '已发布课程不允许修改标题',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedCodeEditDenied,
    category: 'state',
    defaultMessage: '已发布课程不允许修改编码',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedCategoryEditDenied,
    category: 'state',
    defaultMessage: '已发布课程不允许修改分类',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedStartDateEditDenied,
    category: 'state',
    defaultMessage: '已发布课程不允许修改开始日期',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.courseEvaluatedTaskResubmitDenied,
    category: 'state',
    defaultMessage: '已评估任务不可再次提交',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.certificateIdInvalid,
    category: 'validation',
    defaultMessage: '证书 ID 不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.certificateStatusInvalid,
    category: 'validation',
    defaultMessage: '证书状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.certificateRecordStatusInvalid,
    category: 'validation',
    defaultMessage: '证书记录状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.certificateAddDraftOnly,
    category: 'state',
    defaultMessage: '新增证书状态只能为 draft',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderOperateDenied,
    category: 'permission',
    defaultMessage: '无权操作该采购订单',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderSubmitInquiryStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许提交询价',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderSubmitApprovalStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许提交采购审批',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderApproveStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许审批',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderRejectStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许驳回',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderReceiveStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许收货',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderStatusInvalid,
    category: 'validation',
    defaultMessage: '采购订单状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderCurrencyInvalid,
    category: 'validation',
    defaultMessage: '币种不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderTotalAmountInvalid,
    category: 'validation',
    defaultMessage: '订单总金额不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderItemsInvalid,
    category: 'validation',
    defaultMessage: '采购明细格式不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderOrderNoDuplicate,
    category: 'validation',
    defaultMessage: '订单编号已存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderRequesterNotFound,
    category: 'not_found',
    defaultMessage: '申请人不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderStatusActionRequired,
    category: 'state',
    defaultMessage: '请通过流程动作更新采购状态',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderReceiptQuantityExceeded,
    category: 'validation',
    defaultMessage: '累计收货数量不能超过明细数量',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassClosedEditDenied,
    category: 'state',
    defaultMessage: '已关闭班级不可编辑',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCreatePartneredOnly,
    category: 'state',
    defaultMessage: '仅已合作班主任可创建班级',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassDeleteDraftOnly,
    category: 'state',
    defaultMessage: '仅草稿班级允许删除',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassDraftTransitionOnly,
    category: 'state',
    defaultMessage: '草稿班级仅允许更新为 draft 或 active',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassActionNotAllowed,
    category: 'state',
    defaultMessage: '当前班级状态不允许执行该操作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherNegotiatingTransitionDenied,
    category: 'state',
    defaultMessage: '当前状态不允许推进到洽谈中',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherTerminateRoleDenied,
    category: 'permission',
    defaultMessage: '仅管理层或部门负责人可终止合作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherTerminatePartneredOnly,
    category: 'state',
    defaultMessage: '仅已合作班主任可终止合作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherStatusActionUnsupported,
    category: 'validation',
    defaultMessage: '当前接口仅支持 negotiating 或 terminated',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationMarkFollowRequired,
    category: 'validation',
    defaultMessage: '至少存在一条跟进记录后才允许标记合作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationMarkStateDenied,
    category: 'state',
    defaultMessage: '当前合作状态不允许标记为已合作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCreateTerminatedDenied,
    category: 'state',
    defaultMessage: '已终止合作的班主任不可新建班级',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationStatusInvalid,
    category: 'validation',
    defaultMessage: '班主任合作状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassStatusInvalid,
    category: 'validation',
    defaultMessage: '班级状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationStatusPresetDenied,
    category: 'validation',
    defaultMessage: '新增或编辑班主任资源不可直接指定合作状态',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAssignDenied,
    category: 'permission',
    defaultMessage: '无权限分配班主任资源',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAssignTargetDepartmentDenied,
    category: 'permission',
    defaultMessage: '无权分配到目标归属部门',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCloseRoleDenied,
    category: 'permission',
    defaultMessage: '仅管理层或部门负责人可关闭班级',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentStatusInvalid,
    category: 'validation',
    defaultMessage: '代理主体状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentBlacklistStatusInvalid,
    category: 'validation',
    defaultMessage: '代理主体黑名单状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationStatusInvalid,
    category: 'validation',
    defaultMessage: '代理关系状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentAuditViewDenied,
    category: 'permission',
    defaultMessage: '无权查看该代理审计',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationSelfLoopDenied,
    category: 'validation',
    defaultMessage: '代理关系不允许指向自身',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationTargetInactive,
    category: 'state',
    defaultMessage: '停用代理不能作为新的关系目标',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentCycleDenied,
    category: 'state',
    defaultMessage: '不允许形成循环代理树',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionStatusInvalid,
    category: 'validation',
    defaultMessage: '归因状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictResolveDenied,
    category: 'permission',
    defaultMessage: '无权限处理归因冲突',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionCreateTerminatedDenied,
    category: 'state',
    defaultMessage: '已终止合作班主任不可新建代理归因',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAssignExistingDenied,
    category: 'state',
    defaultMessage: '当前班主任已存在有效归因，请使用归因调整或冲突处理',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAgentInactive,
    category: 'state',
    defaultMessage: '停用代理不可新增归因',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAgentBlacklisted,
    category: 'state',
    defaultMessage: '黑名单代理不可新增归因',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictStatusInvalid,
    category: 'validation',
    defaultMessage: '归因冲突状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictClosed,
    category: 'state',
    defaultMessage: '当前归因冲突已关闭',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictResolutionInvalid,
    category: 'validation',
    defaultMessage: '归因冲突处理结果不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.teacherCurrentAttributionMissing,
    category: 'state',
    defaultMessage: '当前班主任不存在有效归因',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsReportDateRequired,
    category: 'validation',
    defaultMessage: '日报日期不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsAutoZeroDateRequired,
    category: 'validation',
    defaultMessage: '补零日期不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsQueryDateRequired,
    category: 'validation',
    defaultMessage: '查询日期不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsResultSubmitStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许填报结果',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodTypeInvalid,
    category: 'validation',
    defaultMessage: '周期类型不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodRangeRequired,
    category: 'validation',
    defaultMessage: '周期开始和结束日期不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodRangeInvalid,
    category: 'validation',
    defaultMessage: '周期开始日期不能晚于结束日期',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsDailyPlanDateRequired,
    category: 'validation',
    defaultMessage: '日目标必须指定计划日期',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPlanDateOutOfRange,
    category: 'validation',
    defaultMessage: '计划日期必须落在周期内',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsSourceTypeInvalid,
    category: 'validation',
    defaultMessage: '目标来源不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.feedbackTaskViewDenied,
    category: 'permission',
    defaultMessage: '无权查看该环评任务',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.feedbackSummaryDraftDenied,
    category: 'state',
    defaultMessage: '草稿状态不允许查看汇总结果',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.feedbackTaskClosed,
    category: 'state',
    defaultMessage: '当前环评任务已关闭',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assetNoDuplicate,
    category: 'validation',
    defaultMessage: '资产编号已存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeImportOverwriteStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许导入覆盖',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeUploadAttachmentStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许上传附件',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeConvertTalentAssetStateDenied,
    category: 'state',
    defaultMessage: '当前状态不允许转人才资产',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeAttachmentFileNotFound,
    category: 'not_found',
    defaultMessage: '附件文件不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeStatusInvalid,
    category: 'validation',
    defaultMessage: '简历状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeSourceTypeInvalid,
    category: 'validation',
    defaultMessage: '简历来源类型不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeExternalLinkExternalOnly,
    category: 'validation',
    defaultMessage: '仅 external 来源允许填写外部简历链接',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeCreateNewOnly,
    category: 'state',
    defaultMessage: '新增简历状态只能为 new',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeInterviewTransitionActionRequired,
    category: 'state',
    defaultMessage: '请通过发起面试动作进入 interviewing',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeInterviewPositionRequired,
    category: 'validation',
    defaultMessage: '目标岗位不能为空，无法发起面试',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeRecruitPlanDepartmentMismatch,
    category: 'validation',
    defaultMessage: '招聘计划所属部门与简历目标部门不一致',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeJobStandardDepartmentMismatch,
    category: 'validation',
    defaultMessage: '职位标准所属部门与简历目标部门不一致',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeOperateDenied,
    category: 'permission',
    defaultMessage: '无权操作该简历',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.suggestionLinkedEntityTypeMismatch,
    category: 'validation',
    defaultMessage: '建议类型与正式单据类型不一致',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAcceptedOnly,
    category: 'validation',
    defaultMessage: '仅允许关联已采用的建议',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.suggestionEmployeeMismatch,
    category: 'validation',
    defaultMessage: '建议员工与正式单据员工不一致',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAssessmentMismatch,
    category: 'validation',
    defaultMessage: '建议来源评估单与正式单据不一致',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAlreadyLinked,
    category: 'validation',
    defaultMessage: '该建议已关联正式单据',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.approvalObjectInvalid,
    category: 'validation',
    defaultMessage: '审批对象不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.approvalInvalidTransition,
    category: 'state',
    defaultMessage: '当前状态不允许执行该操作',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.approvalInstanceEnded,
    category: 'state',
    defaultMessage: '当前审批实例已结束',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.readonlyWriteDenied,
    category: 'permission',
    defaultMessage: '只读账号无写权限',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound,
    category: 'not_found',
    defaultMessage: '数据不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.employeeNotFound,
    category: 'not_found',
    defaultMessage: '员工不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.ownerNotFound,
    category: 'not_found',
    defaultMessage: '负责人不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assessmentNotFound,
    category: 'not_found',
    defaultMessage: '评估单不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.resumeNotFound,
    category: 'not_found',
    defaultMessage: '简历不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.recruitPlanNotFound,
    category: 'not_found',
    defaultMessage: '招聘计划不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardNotFound,
    category: 'not_found',
    defaultMessage: '职位标准不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardInactiveEditDenied,
    category: 'state',
    defaultMessage: '停用中的职位标准不可直接编辑',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardIdInvalid,
    category: 'validation',
    defaultMessage: '职位标准 ID 不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardTransitionDenied,
    category: 'state',
    defaultMessage: '当前状态不允许切换到目标状态',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardPositionNameRequired,
    category: 'validation',
    defaultMessage: '岗位名称不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardCreateDraftOnly,
    category: 'validation',
    defaultMessage: '新增职位标准默认保存为草稿',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardStatusActionRequired,
    category: 'validation',
    defaultMessage: '请使用启停用动作更新状态',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardStatusInvalid,
    category: 'validation',
    defaultMessage: '职位标准状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.contractCreateDraftOnly,
    category: 'validation',
    defaultMessage: '新增合同状态只能为 draft',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.contractTypeInvalid,
    category: 'validation',
    defaultMessage: '合同类型不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.contractStatusInvalid,
    category: 'validation',
    defaultMessage: '合同状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.contractProbationInvalid,
    category: 'validation',
    defaultMessage: '试用期不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.contractSalaryInvalid,
    category: 'validation',
    defaultMessage: '薪资金额不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.contractDateRangeInvalid,
    category: 'validation',
    defaultMessage: '结束日期必须晚于开始日期',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeDeleteSelectionRequired,
    category: 'validation',
    defaultMessage: '请选择需要删除的知识条目',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeDeletePartialMissing,
    category: 'not_found',
    defaultMessage: '部分知识条目不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeIdInvalid,
    category: 'validation',
    defaultMessage: '知识条目 ID 不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeNotFound,
    category: 'not_found',
    defaultMessage: '知识条目不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeKbNoRequired,
    category: 'validation',
    defaultMessage: '知识编号不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeTitleRequired,
    category: 'validation',
    defaultMessage: '知识标题不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeCategoryRequired,
    category: 'validation',
    defaultMessage: '知识分类不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeSummaryRequired,
    category: 'validation',
    defaultMessage: '知识摘要不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeStatusInvalid,
    category: 'validation',
    defaultMessage: '知识状态不合法',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeKbNoDuplicate,
    category: 'validation',
    defaultMessage: '知识编号已存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.salaryConfirmedEditDenied,
    category: 'state',
    defaultMessage: '已确认薪资不允许直接修改金额',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.salaryChangeReasonRequired,
    category: 'validation',
    defaultMessage: '调整原因不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.salaryPeriodRequired,
    category: 'validation',
    defaultMessage: '期间不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.salaryEffectiveDateRequired,
    category: 'validation',
    defaultMessage: '生效日期不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.promotionSponsorRequired,
    category: 'validation',
    defaultMessage: '发起人不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.promotionFromPositionRequired,
    category: 'validation',
    defaultMessage: '当前岗位不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.promotionToPositionRequired,
    category: 'validation',
    defaultMessage: '目标岗位不能为空',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.promotionIndependentReasonRequired,
    category: 'validation',
    defaultMessage: '独立创建时必须填写原因说明',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.promotionDecisionInvalid,
    category: 'validation',
    defaultMessage: '评审结论不正确',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.talentAssetNotFound,
    category: 'not_found',
    defaultMessage: '人才资产不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.sourceSuggestionNotFound,
    category: 'not_found',
    defaultMessage: '来源建议不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.attachmentNotFound,
    category: 'not_found',
    defaultMessage: '附件不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.departmentNotFound,
    category: 'not_found',
    defaultMessage: '部门不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentNotFound,
    category: 'not_found',
    defaultMessage: '目标部门不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.supplierNotFound,
    category: 'not_found',
    defaultMessage: '供应商不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assetNotFound,
    category: 'not_found',
    defaultMessage: '资产不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderNotFound,
    category: 'not_found',
    defaultMessage: '采购订单不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound,
    category: 'not_found',
    defaultMessage: '员工所属部门不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRequestNotFound,
    category: 'not_found',
    defaultMessage: '领用申请不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRecordNotFound,
    category: 'not_found',
    defaultMessage: '领用记录不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assetMaintenanceRecordNotFound,
    category: 'not_found',
    defaultMessage: '维护记录不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.materialCatalogNotFound,
    category: 'not_found',
    defaultMessage: '物资目录不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.approvalInstanceNotFound,
    category: 'not_found',
    defaultMessage: '审批实例不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assetProcurementNotFound,
    category: 'not_found',
    defaultMessage: '采购入库单不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assetTransferNotFound,
    category: 'not_found',
    defaultMessage: '调拨单不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assetInventoryNotFound,
    category: 'not_found',
    defaultMessage: '盘点单不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.assetDisposalNotFound,
    category: 'not_found',
    defaultMessage: '报废单不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.materialInboundNotFound,
    category: 'not_found',
    defaultMessage: '物资入库单不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.materialIssueNotFound,
    category: 'not_found',
    defaultMessage: '物资领用单不存在',
  },
  {
    code: PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsReportNotFound,
    category: 'not_found',
    defaultMessage: '日报不存在',
  },
] as const satisfies readonly PerformanceDomainErrorDefinition[];

export const PERFORMANCE_DOMAIN_ERROR_BY_CODE = Object.freeze(
  PERFORMANCE_DOMAIN_ERRORS.reduce<
    Record<string, PerformanceDomainErrorDefinition>
  >((result, errorDefinition) => {
    result[errorDefinition.code] = errorDefinition;
    return result;
  }, {})
);

export function resolvePerformanceDomainErrorMessage(
  code: PerformanceDomainErrorCode,
  fallbackMessage?: string | null
) {
  const defaultMessage = PERFORMANCE_DOMAIN_ERROR_BY_CODE[code]?.defaultMessage;
  return String(fallbackMessage || defaultMessage || '').trim();
}
