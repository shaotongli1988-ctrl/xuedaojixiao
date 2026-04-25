/// <reference types="jest" />
/**
 * Performance 领域模型注册中心最小测试。
 * 这里只验证 Phase 1 骨架可以稳定导出、关键主键唯一且样例注册内容完整，不覆盖运行时 service 接线。
 */

import {
  APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS,
  APPROVAL_FLOW_ACTIONS,
  APPROVAL_FLOW_INSTANCE_STATUSES,
  PERFORMANCE_DOMAIN_ERROR_CODES,
  PERFORMANCE_DOMAIN_REGISTRY,
  PERFORMANCE_DOMAIN_REGISTRY_VERSION,
  resolvePerformanceDomainErrorMessage,
} from '../../src/modules/performance/domain';
import {
  PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS,
  PERFORMANCE_SURFACE_ACCESS_RULES,
  PERFORMANCE_PERSONA_INFERENCE_RULES,
  PERFORMANCE_PERSONA_OPTIONS_BY_KEY,
  PERFORMANCE_PERSONA_PRIORITY,
  PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY,
  PERFORMANCE_PERSONA_WORKBENCH_PAGES,
  PERFORMANCE_WORKBENCH_PAGE_ACCESS_RULES,
} from '../../src/modules/performance/domain/roles/catalog';

describe('performance domain registry', () => {
  test('should expose phase1 registry version and four core catalogs', () => {
    expect(PERFORMANCE_DOMAIN_REGISTRY.version).toBe(
      PERFORMANCE_DOMAIN_REGISTRY_VERSION
    );
    expect(PERFORMANCE_DOMAIN_REGISTRY.errors.length).toBeGreaterThan(0);
    expect(PERFORMANCE_DOMAIN_REGISTRY.stateMachines.length).toBeGreaterThan(0);
    expect(PERFORMANCE_DOMAIN_REGISTRY.businessDicts.length).toBeGreaterThan(0);
    expect(PERFORMANCE_DOMAIN_REGISTRY.personas.length).toBeGreaterThan(0);
    expect(
      Object.keys(PERFORMANCE_DOMAIN_REGISTRY.personaOptionsByKey).length
    ).toBeGreaterThan(0);
    expect(PERFORMANCE_DOMAIN_REGISTRY.personaPriority.length).toBeGreaterThan(0);
    expect(
      Object.keys(PERFORMANCE_DOMAIN_REGISTRY.personaInferenceRules).length
    ).toBeGreaterThan(0);
    expect(
      Object.keys(PERFORMANCE_DOMAIN_REGISTRY.personaRoleKindByKey).length
    ).toBeGreaterThan(0);
    expect(
      Object.keys(PERFORMANCE_DOMAIN_REGISTRY.personaWorkbenchPages).length
    ).toBeGreaterThan(0);
    expect(
      Object.keys(PERFORMANCE_DOMAIN_REGISTRY.surfaceAccessRules).length
    ).toBeGreaterThan(0);
    expect(
      Object.keys(PERFORMANCE_DOMAIN_REGISTRY.workbenchPageAccessRules).length
    ).toBeGreaterThan(0);
    expect(
      Object.keys(PERFORMANCE_DOMAIN_REGISTRY.capabilityScopeRuleGroups).length
    ).toBeGreaterThan(0);
    expect(PERFORMANCE_DOMAIN_REGISTRY.capabilities.length).toBeGreaterThan(0);
    expect(PERFORMANCE_DOMAIN_REGISTRY.scopes.length).toBeGreaterThan(0);
    expect(PERFORMANCE_DOMAIN_REGISTRY.stateGuards.length).toBeGreaterThan(0);
  });

  test('should keep error codes unique', () => {
    const errorCodes = PERFORMANCE_DOMAIN_REGISTRY.errors.map(item => item.code);
    expect(new Set(errorCodes).size).toBe(errorCodes.length);
  });

  test('should expose runtime-resolvable performance error messages', () => {
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.authContextMissing
      )
    ).toBe('登录上下文缺失');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.approvalInstanceEnded
      )
    ).toBe('当前审批实例已结束');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.readonlyWriteDenied
      )
    ).toBe('只读账号无写权限');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateActionNotAllowed
      )
    ).toBe('当前状态不允许执行该操作');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
      )
    ).toBe('当前状态不允许编辑');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateDeleteNotAllowed
      )
    ).toBe('当前状态不允许删除');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftEditOnly
      )
    ).toBe('仅 draft 状态允许编辑');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftSubmitOnly
      )
    ).toBe('仅 draft 状态允许提交');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateCancelNotAllowed
      )
    ).toBe('当前状态不允许取消');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateSubmittedReceiveOnly
      )
    ).toBe('仅 submitted 状态允许确认入库');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired
      )
    ).toBe('目标部门不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalTitleRequired
      )
    ).toBe('目标标题不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.ownerRequired
      )
    ).toBe('负责人不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.employeeRequired
      )
    ).toBe('员工不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.sourceTypeInvalid
      )
    ).toBe('来源类型不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.suggestionActionUnsupported
      )
    ).toBe('不支持的建议动作');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.targetValuePositive
      )
    ).toBe('目标值必须大于 0');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeRequired
      )
    ).toBe('开始日期和结束日期不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeInvalid
      )
    ).toBe('开始日期不能晚于结束日期');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalCurrentValueNonNegative
      )
    ).toBe('当前值不能小于 0');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalCompletedRollbackDenied
      )
    ).toBe('已完成目标不能回退为进行中');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalCompletedProgressUpdateDenied
      )
    ).toBe('已完成目标不能继续更新进度');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalCancelledProgressUpdateDenied
      )
    ).toBe('已取消目标不能继续更新进度');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalEditStateDenied
      )
    ).toBe('当前状态不允许编辑目标');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.importFileNotFound
      )
    ).toBe('导入文件不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.idRequired
      )
    ).toBe('ID不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.numericFieldInvalid
      )
    ).toBe('数字字段不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.jsonFieldInvalid
      )
    ).toBe('JSON 字段格式不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.pipActionUnsupported
      )
    ).toBe('不支持的 PIP 动作');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.invalidRelatedFiles
      )
    ).toBe('存在无效的关联文件');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateTargetUpdateNotAllowed
      )
    ).toBe('当前状态不允许更新到目标状态');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.importFileRequired
      )
    ).toBe('导入文件不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.employeeIdInvalid
      )
    ).toBe('员工 ID 不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateInterviewCreateNotAllowed
      )
    ).toBe('当前状态不允许发起面试');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateInterviewRecreateNotAllowed
      )
    ).toBe('当前状态不允许再次发起面试');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.invalidRelatedKnowledge
      )
    ).toBe('存在无效的关联知识条目');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.qaQuestionRequired
      )
    ).toBe('问题不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.qaAnswerRequired
      )
    ).toBe('答案不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.meetingStatusInvalid
      )
    ).toBe('会议状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.capabilityModelStatusInvalid
      )
    ).toBe('能力模型状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.capabilityModelAddDraftOnly
      )
    ).toBe('新增能力模型状态只能为 draft');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.pipTitleRequired
      )
    ).toBe('PIP 标题不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.pipImprovementGoalRequired
      )
    ).toBe('改进目标不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.pipSourceReasonRequired
      )
    ).toBe('独立创建必须填写来源原因');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.pipStartDraftOnly
      )
    ).toBe('只有草稿状态的 PIP 可以启动');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.pipTrackActiveOnly
      )
    ).toBe('只有进行中的 PIP 可以提交跟进');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.pipCompleteActiveOnly
      )
    ).toBe('只有进行中的 PIP 可以完成');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.pipCloseActiveOnly
      )
    ).toBe('只有进行中的 PIP 可以关闭');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.pipEditNotAllowed
      )
    ).toBe('当前状态不允许编辑 PIP');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.suggestionRevokeHrOnly
      )
    ).toBe('只有 HR 可以撤销建议');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.meetingCancelRoleDenied
      )
    ).toBe('当前角色不允许取消进行中的会议');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateTransitionTargetNotAllowed
      )
    ).toBe('当前状态不允许流转到目标状态');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.courseStatusInvalid
      )
    ).toBe('课程状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.courseTitleRequired
      )
    ).toBe('课程标题不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.courseAddDraftOnly
      )
    ).toBe('新建课程默认保存为草稿');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedTitleEditDenied
      )
    ).toBe('已发布课程不允许修改标题');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedCodeEditDenied
      )
    ).toBe('已发布课程不允许修改编码');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedCategoryEditDenied
      )
    ).toBe('已发布课程不允许修改分类');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.coursePublishedStartDateEditDenied
      )
    ).toBe('已发布课程不允许修改开始日期');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.courseEvaluatedTaskResubmitDenied
      )
    ).toBe('已评估任务不可再次提交');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.certificateIdInvalid
      )
    ).toBe('证书 ID 不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.certificateStatusInvalid
      )
    ).toBe('证书状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.certificateRecordStatusInvalid
      )
    ).toBe('证书记录状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.certificateAddDraftOnly
      )
    ).toBe('新增证书状态只能为 draft');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderOperateDenied
      )
    ).toBe('无权操作该采购订单');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderSubmitInquiryStateDenied
      )
    ).toBe('当前状态不允许提交询价');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderSubmitApprovalStateDenied
      )
    ).toBe('当前状态不允许提交采购审批');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderApproveStateDenied
      )
    ).toBe('当前状态不允许审批');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderRejectStateDenied
      )
    ).toBe('当前状态不允许驳回');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderReceiveStateDenied
      )
    ).toBe('当前状态不允许收货');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderStatusInvalid
      )
    ).toBe('采购订单状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderCurrencyInvalid
      )
    ).toBe('币种不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderTotalAmountInvalid
      )
    ).toBe('订单总金额不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderItemsInvalid
      )
    ).toBe('采购明细格式不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderOrderNoDuplicate
      )
    ).toBe('订单编号已存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderRequesterNotFound
      )
    ).toBe('申请人不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderStatusActionRequired
      )
    ).toBe('请通过流程动作更新采购状态');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderReceiptQuantityExceeded
      )
    ).toBe('累计收货数量不能超过明细数量');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassClosedEditDenied
      )
    ).toBe('已关闭班级不可编辑');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCreatePartneredOnly
      )
    ).toBe('仅已合作班主任可创建班级');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassDeleteDraftOnly
      )
    ).toBe('仅草稿班级允许删除');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassDraftTransitionOnly
      )
    ).toBe('草稿班级仅允许更新为 draft 或 active');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassActionNotAllowed
      )
    ).toBe('当前班级状态不允许执行该操作');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherNegotiatingTransitionDenied
      )
    ).toBe('当前状态不允许推进到洽谈中');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherTerminateRoleDenied
      )
    ).toBe('仅管理层或部门负责人可终止合作');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherTerminatePartneredOnly
      )
    ).toBe('仅已合作班主任可终止合作');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherStatusActionUnsupported
      )
    ).toBe('当前接口仅支持 negotiating 或 terminated');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationMarkFollowRequired
      )
    ).toBe('至少存在一条跟进记录后才允许标记合作');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationMarkStateDenied
      )
    ).toBe('当前合作状态不允许标记为已合作');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCreateTerminatedDenied
      )
    ).toBe('已终止合作的班主任不可新建班级');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationStatusInvalid
      )
    ).toBe('班主任合作状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassStatusInvalid
      )
    ).toBe('班级状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationStatusPresetDenied
      )
    ).toBe('新增或编辑班主任资源不可直接指定合作状态');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAssignDenied
      )
    ).toBe('无权限分配班主任资源');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAssignTargetDepartmentDenied
      )
    ).toBe('无权分配到目标归属部门');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCloseRoleDenied
      )
    ).toBe('仅管理层或部门负责人可关闭班级');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentStatusInvalid
      )
    ).toBe('代理主体状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentBlacklistStatusInvalid
      )
    ).toBe('代理主体黑名单状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationStatusInvalid
      )
    ).toBe('代理关系状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentAuditViewDenied
      )
    ).toBe('无权查看该代理审计');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationSelfLoopDenied
      )
    ).toBe('代理关系不允许指向自身');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationTargetInactive
      )
    ).toBe('停用代理不能作为新的关系目标');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentCycleDenied
      )
    ).toBe('不允许形成循环代理树');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionStatusInvalid
      )
    ).toBe('归因状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictResolveDenied
      )
    ).toBe('无权限处理归因冲突');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionCreateTerminatedDenied
      )
    ).toBe('已终止合作班主任不可新建代理归因');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAssignExistingDenied
      )
    ).toBe('当前班主任已存在有效归因，请使用归因调整或冲突处理');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAgentInactive
      )
    ).toBe('停用代理不可新增归因');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAgentBlacklisted
      )
    ).toBe('黑名单代理不可新增归因');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictStatusInvalid
      )
    ).toBe('归因冲突状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictClosed
      )
    ).toBe('当前归因冲突已关闭');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictResolutionInvalid
      )
    ).toBe('归因冲突处理结果不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.teacherCurrentAttributionMissing
      )
    ).toBe('当前班主任不存在有效归因');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsReportDateRequired
      )
    ).toBe('日报日期不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsAutoZeroDateRequired
      )
    ).toBe('补零日期不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsQueryDateRequired
      )
    ).toBe('查询日期不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsResultSubmitStateDenied
      )
    ).toBe('当前状态不允许填报结果');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodTypeInvalid
      )
    ).toBe('周期类型不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodRangeRequired
      )
    ).toBe('周期开始和结束日期不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPeriodRangeInvalid
      )
    ).toBe('周期开始日期不能晚于结束日期');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsDailyPlanDateRequired
      )
    ).toBe('日目标必须指定计划日期');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsPlanDateOutOfRange
      )
    ).toBe('计划日期必须落在周期内');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsSourceTypeInvalid
      )
    ).toBe('目标来源不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.feedbackTaskViewDenied
      )
    ).toBe('无权查看该环评任务');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.feedbackSummaryDraftDenied
      )
    ).toBe('草稿状态不允许查看汇总结果');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.feedbackTaskClosed
      )
    ).toBe('当前环评任务已关闭');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assetNoDuplicate
      )
    ).toBe('资产编号已存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeImportOverwriteStateDenied
      )
    ).toBe('当前状态不允许导入覆盖');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeUploadAttachmentStateDenied
      )
    ).toBe('当前状态不允许上传附件');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeConvertTalentAssetStateDenied
      )
    ).toBe('当前状态不允许转人才资产');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeAttachmentFileNotFound
      )
    ).toBe('附件文件不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeStatusInvalid
      )
    ).toBe('简历状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeSourceTypeInvalid
      )
    ).toBe('简历来源类型不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeExternalLinkExternalOnly
      )
    ).toBe('仅 external 来源允许填写外部简历链接');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeCreateNewOnly
      )
    ).toBe('新增简历状态只能为 new');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeInterviewTransitionActionRequired
      )
    ).toBe('请通过发起面试动作进入 interviewing');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeInterviewPositionRequired
      )
    ).toBe('目标岗位不能为空，无法发起面试');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeRecruitPlanDepartmentMismatch
      )
    ).toBe('招聘计划所属部门与简历目标部门不一致');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeJobStandardDepartmentMismatch
      )
    ).toBe('职位标准所属部门与简历目标部门不一致');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeOperateDenied
      )
    ).toBe('无权操作该简历');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.suggestionLinkedEntityTypeMismatch
      )
    ).toBe('建议类型与正式单据类型不一致');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAcceptedOnly
      )
    ).toBe('仅允许关联已采用的建议');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.suggestionEmployeeMismatch
      )
    ).toBe('建议员工与正式单据员工不一致');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAssessmentMismatch
      )
    ).toBe('建议来源评估单与正式单据不一致');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAlreadyLinked
      )
    ).toBe('该建议已关联正式单据');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateSubmittedApproveOnly
      )
    ).toBe('仅 submitted 状态允许审批');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateApprovedExecuteOnly
      )
    ).toBe('仅 approved 状态允许执行报废');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateCloseNotAllowed
      )
    ).toBe('当前状态不允许关闭');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.stateMissing
      )
    ).toBe('当前状态缺失');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
      )
    ).toBe('数据不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.employeeNotFound
      )
    ).toBe('员工不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.ownerNotFound
      )
    ).toBe('负责人不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assessmentNotFound
      )
    ).toBe('评估单不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.resumeNotFound
      )
    ).toBe('简历不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.recruitPlanNotFound
      )
    ).toBe('招聘计划不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardNotFound
      )
    ).toBe('职位标准不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardInactiveEditDenied
      )
    ).toBe('停用中的职位标准不可直接编辑');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardIdInvalid
      )
    ).toBe('职位标准 ID 不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardTransitionDenied
      )
    ).toBe('当前状态不允许切换到目标状态');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardPositionNameRequired
      )
    ).toBe('岗位名称不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardCreateDraftOnly
      )
    ).toBe('新增职位标准默认保存为草稿');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardStatusActionRequired
      )
    ).toBe('请使用启停用动作更新状态');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.jobStandardStatusInvalid
      )
    ).toBe('职位标准状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.contractCreateDraftOnly
      )
    ).toBe('新增合同状态只能为 draft');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.contractTypeInvalid
      )
    ).toBe('合同类型不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.contractStatusInvalid
      )
    ).toBe('合同状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.contractProbationInvalid
      )
    ).toBe('试用期不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.contractSalaryInvalid
      )
    ).toBe('薪资金额不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.contractDateRangeInvalid
      )
    ).toBe('结束日期必须晚于开始日期');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeDeleteSelectionRequired
      )
    ).toBe('请选择需要删除的知识条目');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeDeletePartialMissing
      )
    ).toBe('部分知识条目不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeIdInvalid
      )
    ).toBe('知识条目 ID 不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeNotFound
      )
    ).toBe('知识条目不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeKbNoRequired
      )
    ).toBe('知识编号不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeTitleRequired
      )
    ).toBe('知识标题不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeCategoryRequired
      )
    ).toBe('知识分类不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeSummaryRequired
      )
    ).toBe('知识摘要不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeStatusInvalid
      )
    ).toBe('知识状态不合法');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.knowledgeKbNoDuplicate
      )
    ).toBe('知识编号已存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.salaryConfirmedEditDenied
      )
    ).toBe('已确认薪资不允许直接修改金额');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.salaryChangeReasonRequired
      )
    ).toBe('调整原因不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.salaryPeriodRequired
      )
    ).toBe('期间不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.salaryEffectiveDateRequired
      )
    ).toBe('生效日期不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.promotionSponsorRequired
      )
    ).toBe('发起人不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.promotionFromPositionRequired
      )
    ).toBe('当前岗位不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.promotionToPositionRequired
      )
    ).toBe('目标岗位不能为空');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.promotionIndependentReasonRequired
      )
    ).toBe('独立创建时必须填写原因说明');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.promotionDecisionInvalid
      )
    ).toBe('评审结论不正确');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.talentAssetNotFound
      )
    ).toBe('人才资产不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.sourceSuggestionNotFound
      )
    ).toBe('来源建议不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.attachmentNotFound
      )
    ).toBe('附件不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.departmentNotFound
      )
    ).toBe('部门不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentNotFound
      )
    ).toBe('目标部门不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.supplierNotFound
      )
    ).toBe('供应商不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assetNotFound
      )
    ).toBe('资产不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderNotFound
      )
    ).toBe('采购订单不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRequestNotFound
      )
    ).toBe('领用申请不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRecordNotFound
      )
    ).toBe('领用记录不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assetMaintenanceRecordNotFound
      )
    ).toBe('维护记录不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.materialCatalogNotFound
      )
    ).toBe('物资目录不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.approvalInstanceNotFound
      )
    ).toBe('审批实例不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound
      )
    ).toBe('员工所属部门不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assetProcurementNotFound
      )
    ).toBe('采购入库单不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assetTransferNotFound
      )
    ).toBe('调拨单不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assetInventoryNotFound
      )
    ).toBe('盘点单不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.assetDisposalNotFound
      )
    ).toBe('报废单不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.materialInboundNotFound
      )
    ).toBe('物资入库单不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.materialIssueNotFound
      )
    ).toBe('物资领用单不存在');
    expect(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsReportNotFound
      )
    ).toBe('日报不存在');
  });

  test('should register assessment state machine as phase1 sample', () => {
    const assessmentMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'assessment'
    );

    expect(assessmentMachine).toBeDefined();
    expect(assessmentMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'submitted', 'approved', 'rejected'])
    );
    expect(assessmentMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'submit',
          to: 'submitted',
        }),
      ])
    );
  });

  test('should align approval-flow state machine with runtime helper statuses and actions', () => {
    const approvalFlowMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'approval-flow'
    );

    expect(approvalFlowMachine).toBeDefined();
    expect(approvalFlowMachine?.statuses).toEqual(
      expect.arrayContaining(APPROVAL_FLOW_INSTANCE_STATUSES)
    );
    expect(approvalFlowMachine?.actions).toEqual(
      expect.arrayContaining(APPROVAL_FLOW_ACTIONS)
    );
    expect(approvalFlowMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'in_review',
          action: 'timeout',
          to: 'manual_pending',
        }),
        expect.objectContaining({
          from: 'pending_resolution',
          action: 'resolve',
          to: 'in_review',
        }),
      ])
    );
    expect(APPROVAL_FLOW_ALLOWED_ACTIONS_BY_STATUS.in_review).toEqual(
      expect.arrayContaining(['approve', 'reject', 'transfer', 'timeout'])
    );
  });

  test('should register feedback state machine from feedback task lifecycle rules', () => {
    const feedbackMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'feedback'
    );

    expect(feedbackMachine).toBeDefined();
    expect(feedbackMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'running', 'closed'])
    );
    expect(feedbackMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'add',
          to: 'running',
        }),
        expect.objectContaining({
          from: 'running',
          action: 'submit',
          to: 'closed',
        }),
      ])
    );
  });

  test('should register job-standard state machine from the frozen theme17 contract', () => {
    const jobStandardMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'job-standard'
    );

    expect(jobStandardMachine).toBeDefined();
    expect(jobStandardMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'active', 'inactive'])
    );
    expect(jobStandardMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'activate',
          to: 'active',
        }),
        expect.objectContaining({
          from: 'active',
          action: 'deactivate',
          to: 'inactive',
        }),
        expect.objectContaining({
          from: 'inactive',
          action: 'reactivate',
          to: 'active',
        }),
      ])
    );
  });

  test('should register teacher-cooperation state machine from teacher-channel core transition rules', () => {
    const teacherCooperationMachine =
      PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
        item => item.aggregate === 'teacher-cooperation'
      );

    expect(teacherCooperationMachine).toBeDefined();
    expect(teacherCooperationMachine?.statuses).toEqual(
      expect.arrayContaining([
        'uncontacted',
        'contacted',
        'negotiating',
        'partnered',
        'terminated',
      ])
    );
    expect(teacherCooperationMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'uncontacted',
          action: 'firstFollow',
          to: 'contacted',
        }),
        expect.objectContaining({
          from: 'contacted',
          action: 'markNegotiating',
          to: 'negotiating',
        }),
        expect.objectContaining({
          from: 'contacted',
          action: 'markPartnered',
          to: 'partnered',
        }),
        expect.objectContaining({
          from: 'negotiating',
          action: 'markPartnered',
          to: 'partnered',
        }),
        expect.objectContaining({
          from: 'partnered',
          action: 'terminate',
          to: 'terminated',
        }),
      ])
    );
  });

  test('should register teacher-class state machine from teacher-channel class transition rules', () => {
    const teacherClassMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'teacher-class'
    );

    expect(teacherClassMachine).toBeDefined();
    expect(teacherClassMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'active', 'closed'])
    );
    expect(teacherClassMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'saveDraft',
          to: 'draft',
        }),
        expect.objectContaining({
          from: 'draft',
          action: 'activate',
          to: 'active',
        }),
        expect.objectContaining({
          from: 'active',
          action: 'keepActive',
          to: 'active',
        }),
        expect.objectContaining({
          from: 'active',
          action: 'close',
          to: 'closed',
        }),
      ])
    );
  });

  test('should register goal state machine from existing goal-helper flow rules', () => {
    const goalMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'goal'
    );

    expect(goalMachine).toBeDefined();
    expect(goalMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'in-progress', 'completed', 'cancelled'])
    );
    expect(goalMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'startProgress',
          to: 'in-progress',
        }),
        expect.objectContaining({
          from: 'draft',
          action: 'complete',
          to: 'completed',
        }),
        expect.objectContaining({
          from: 'in-progress',
          action: 'cancel',
          to: 'cancelled',
        }),
      ])
    );
  });

  test('should register promotion state machine from promotion-helper flow rules', () => {
    const promotionMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'promotion'
    );

    expect(promotionMachine).toBeDefined();
    expect(promotionMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'reviewing', 'approved', 'rejected'])
    );
    expect(promotionMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'submit',
          to: 'reviewing',
        }),
        expect.objectContaining({
          from: 'reviewing',
          action: 'approve',
          to: 'approved',
        }),
        expect.objectContaining({
          from: 'reviewing',
          action: 'reject',
          to: 'rejected',
        }),
      ])
    );
  });

  test('should register pip state machine from pip service transition rules', () => {
    const pipMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'pip'
    );

    expect(pipMachine).toBeDefined();
    expect(pipMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'active', 'completed', 'closed'])
    );
    expect(pipMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'start',
          to: 'active',
        }),
        expect.objectContaining({
          from: 'active',
          action: 'track',
          to: 'active',
        }),
        expect.objectContaining({
          from: 'active',
          action: 'complete',
          to: 'completed',
        }),
        expect.objectContaining({
          from: 'active',
          action: 'close',
          to: 'closed',
        }),
      ])
    );
  });

  test('should register suggestion state machine from suggestion helper flow rules', () => {
    const suggestionMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'suggestion'
    );

    expect(suggestionMachine).toBeDefined();
    expect(suggestionMachine?.statuses).toEqual(
      expect.arrayContaining([
        'pending',
        'accepted',
        'ignored',
        'rejected',
        'revoked',
      ])
    );
    expect(suggestionMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'pending',
          action: 'accept',
          to: 'accepted',
        }),
        expect.objectContaining({
          from: 'pending',
          action: 'ignore',
          to: 'ignored',
        }),
        expect.objectContaining({
          from: 'pending',
          action: 'reject',
          to: 'rejected',
        }),
        expect.objectContaining({
          from: 'pending',
          action: 'revoke',
          to: 'revoked',
        }),
        expect.objectContaining({
          from: 'accepted',
          action: 'revoke',
          to: 'revoked',
        }),
      ])
    );
  });

  test('should register purchase-order state machine from purchase-order service transition rules', () => {
    const purchaseOrderMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'purchase-order'
    );

    expect(purchaseOrderMachine).toBeDefined();
    expect(purchaseOrderMachine?.statuses).toEqual(
      expect.arrayContaining([
        'draft',
        'inquiring',
        'pendingApproval',
        'approved',
        'received',
        'closed',
        'cancelled',
      ])
    );
    expect(purchaseOrderMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'submitInquiry',
          to: 'inquiring',
        }),
        expect.objectContaining({
          from: 'inquiring',
          action: 'submitApproval',
          to: 'pendingApproval',
        }),
        expect.objectContaining({
          from: 'pendingApproval',
          action: 'approve',
          to: 'approved',
        }),
        expect.objectContaining({
          from: 'pendingApproval',
          action: 'reject',
          to: 'draft',
        }),
        expect.objectContaining({
          from: 'approved',
          action: 'receive',
          to: 'received',
        }),
        expect.objectContaining({
          from: 'received',
          action: 'receive',
          to: 'received',
        }),
        expect.objectContaining({
          from: 'approved',
          action: 'close',
          to: 'closed',
        }),
        expect.objectContaining({
          from: 'received',
          action: 'close',
          to: 'closed',
        }),
      ])
    );
  });

  test('should register work-plan state machine from workPlan service transition rules', () => {
    const workPlanMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'work-plan'
    );

    expect(workPlanMachine).toBeDefined();
    expect(workPlanMachine?.statuses).toEqual(
      expect.arrayContaining([
        'draft',
        'planned',
        'inProgress',
        'completed',
        'cancelled',
      ])
    );
    expect(workPlanMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'syncApproved',
          to: 'planned',
        }),
        expect.objectContaining({
          from: 'draft',
          action: 'syncRejected',
          to: 'cancelled',
        }),
        expect.objectContaining({
          from: 'planned',
          action: 'start',
          to: 'inProgress',
        }),
        expect.objectContaining({
          from: 'inProgress',
          action: 'complete',
          to: 'completed',
        }),
        expect.objectContaining({
          from: 'inProgress',
          action: 'cancel',
          to: 'cancelled',
        }),
      ])
    );
  });

  test('should register salary state machine from salary service transition rules', () => {
    const salaryMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'salary'
    );

    expect(salaryMachine).toBeDefined();
    expect(salaryMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'confirmed', 'archived'])
    );
    expect(salaryMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'confirm',
          to: 'confirmed',
        }),
        expect.objectContaining({
          from: 'confirmed',
          action: 'archive',
          to: 'archived',
        }),
        expect.objectContaining({
          from: 'confirmed',
          action: 'changeAdd',
          to: 'confirmed',
        }),
      ])
    );
  });

  test('should register asset-assignment-request state machine from asset-domain and approval-flow rules', () => {
    const assignmentRequestMachine =
      PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
        item => item.aggregate === 'asset-assignment-request'
      );

    expect(assignmentRequestMachine).toBeDefined();
    expect(assignmentRequestMachine?.statuses).toEqual(
      expect.arrayContaining([
        'draft',
        'inApproval',
        'rejected',
        'withdrawn',
        'approvedPendingAssignment',
        'issuing',
        'issued',
        'cancelled',
        'manualPending',
      ])
    );
    expect(assignmentRequestMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'submit',
          to: 'inApproval',
        }),
        expect.objectContaining({
          from: 'inApproval',
          action: 'approve',
          to: 'approvedPendingAssignment',
        }),
        expect.objectContaining({
          from: 'inApproval',
          action: 'reject',
          to: 'rejected',
        }),
        expect.objectContaining({
          from: 'inApproval',
          action: 'withdraw',
          to: 'withdrawn',
        }),
        expect.objectContaining({
          from: 'inApproval',
          action: 'fallback',
          to: 'manualPending',
        }),
        expect.objectContaining({
          from: 'approvedPendingAssignment',
          action: 'assign',
          to: 'issuing',
        }),
        expect.objectContaining({
          from: 'issuing',
          action: 'assign',
          to: 'issued',
        }),
        expect.objectContaining({
          from: 'manualPending',
          action: 'cancel',
          to: 'cancelled',
        }),
      ])
    );
  });

  test('should register asset-procurement state machine from asset-domain transition rules', () => {
    const assetProcurementMachine =
      PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
        item => item.aggregate === 'asset-procurement'
      );

    expect(assetProcurementMachine).toBeDefined();
    expect(assetProcurementMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'submitted', 'received', 'cancelled'])
    );
    expect(assetProcurementMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'submit',
          to: 'submitted',
        }),
        expect.objectContaining({
          from: 'submitted',
          action: 'receive',
          to: 'received',
        }),
        expect.objectContaining({
          from: 'submitted',
          action: 'cancel',
          to: 'cancelled',
        }),
      ])
    );
  });

  test('should register asset-transfer state machine from asset-domain transition rules', () => {
    const assetTransferMachine = PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
      item => item.aggregate === 'asset-transfer'
    );

    expect(assetTransferMachine).toBeDefined();
    expect(assetTransferMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'inTransit', 'completed', 'cancelled'])
    );
    expect(assetTransferMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'submit',
          to: 'inTransit',
        }),
        expect.objectContaining({
          from: 'inTransit',
          action: 'complete',
          to: 'completed',
        }),
        expect.objectContaining({
          from: 'inTransit',
          action: 'cancel',
          to: 'cancelled',
        }),
      ])
    );
  });

  test('should register asset-inventory state machine from asset-domain transition rules', () => {
    const assetInventoryMachine =
      PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
        item => item.aggregate === 'asset-inventory'
      );

    expect(assetInventoryMachine).toBeDefined();
    expect(assetInventoryMachine?.statuses).toEqual(
      expect.arrayContaining(['draft', 'counting', 'completed', 'closed'])
    );
    expect(assetInventoryMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'start',
          to: 'counting',
        }),
        expect.objectContaining({
          from: 'counting',
          action: 'complete',
          to: 'completed',
        }),
        expect.objectContaining({
          from: 'completed',
          action: 'close',
          to: 'closed',
        }),
      ])
    );
  });

  test('should register asset-disposal state machine from asset-domain transition rules', () => {
    const assetDisposalMachine =
      PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
        item => item.aggregate === 'asset-disposal'
      );

    expect(assetDisposalMachine).toBeDefined();
    expect(assetDisposalMachine?.statuses).toEqual(
      expect.arrayContaining([
        'draft',
        'submitted',
        'approved',
        'scrapped',
        'cancelled',
      ])
    );
    expect(assetDisposalMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'draft',
          action: 'submit',
          to: 'submitted',
        }),
        expect.objectContaining({
          from: 'submitted',
          action: 'approve',
          to: 'approved',
        }),
        expect.objectContaining({
          from: 'approved',
          action: 'execute',
          to: 'scrapped',
        }),
        expect.objectContaining({
          from: 'approved',
          action: 'cancel',
          to: 'cancelled',
        }),
      ])
    );
  });

  test('should register asset-maintenance state machine from asset-domain transition rules', () => {
    const assetMaintenanceMachine =
      PERFORMANCE_DOMAIN_REGISTRY.stateMachines.find(
        item => item.aggregate === 'asset-maintenance'
      );

    expect(assetMaintenanceMachine).toBeDefined();
    expect(assetMaintenanceMachine?.statuses).toEqual(
      expect.arrayContaining([
        'scheduled',
        'inProgress',
        'completed',
        'cancelled',
      ])
    );
    expect(assetMaintenanceMachine?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'scheduled',
          action: 'complete',
          to: 'completed',
        }),
        expect.objectContaining({
          from: 'inProgress',
          action: 'complete',
          to: 'completed',
        }),
        expect.objectContaining({
          from: 'scheduled',
          action: 'cancel',
          to: 'cancelled',
        }),
      ])
    );
  });

  test('should register first phase personas, capabilities and dict keys', () => {
    expect(
      PERFORMANCE_DOMAIN_REGISTRY.personas.map(item => item.key)
    ).toEqual(
      expect.arrayContaining([
        'org.employee',
        'org.line_manager',
        'org.hrbp',
      ])
    );
    expect(
      PERFORMANCE_DOMAIN_REGISTRY.capabilities.map(item => item.key)
    ).toEqual(
      expect.arrayContaining([
        'assessment.submit',
        'approval.instance.approve',
        'dashboard.summary.read',
      ])
    );
    expect(
      PERFORMANCE_DOMAIN_REGISTRY.businessDicts.map(item => item.key)
    ).toEqual(
      expect.arrayContaining([
        'performance.assessment.status',
        'performance.approvalFlow.status',
        ])
    );
  });

  test('should keep persona metadata aligned with registered persona keys', () => {
    const personaKeys = PERFORMANCE_DOMAIN_REGISTRY.personas.map(item => item.key);
    const workbenchPageIds = Array.from(
      new Set(
        Object.values(PERFORMANCE_PERSONA_WORKBENCH_PAGES).flatMap(item => item)
      )
    );

    expect(PERFORMANCE_PERSONA_PRIORITY).toEqual(
      expect.arrayContaining(personaKeys)
    );
    expect(Object.keys(PERFORMANCE_PERSONA_OPTIONS_BY_KEY)).toEqual(
      expect.arrayContaining(personaKeys)
    );
    expect(PERFORMANCE_DOMAIN_REGISTRY.personaPriority).toEqual(
      PERFORMANCE_PERSONA_PRIORITY
    );
    expect(PERFORMANCE_DOMAIN_REGISTRY.personaOptionsByKey).toEqual(
      PERFORMANCE_PERSONA_OPTIONS_BY_KEY
    );
    expect(Object.keys(PERFORMANCE_PERSONA_INFERENCE_RULES)).toEqual(
      expect.arrayContaining(personaKeys)
    );
    expect(PERFORMANCE_DOMAIN_REGISTRY.personaInferenceRules).toEqual(
      PERFORMANCE_PERSONA_INFERENCE_RULES
    );
    expect(Object.keys(PERFORMANCE_PERSONA_WORKBENCH_PAGES)).toEqual(
      expect.arrayContaining(personaKeys)
    );
    expect(PERFORMANCE_DOMAIN_REGISTRY.personaWorkbenchPages).toEqual(
      PERFORMANCE_PERSONA_WORKBENCH_PAGES
    );
    expect(PERFORMANCE_DOMAIN_REGISTRY.surfaceAccessRules).toEqual(
      PERFORMANCE_SURFACE_ACCESS_RULES
    );
    expect(
      Object.keys(PERFORMANCE_WORKBENCH_PAGE_ACCESS_RULES)
    ).toEqual(expect.arrayContaining(workbenchPageIds));
    expect(PERFORMANCE_DOMAIN_REGISTRY.workbenchPageAccessRules).toEqual(
      PERFORMANCE_WORKBENCH_PAGE_ACCESS_RULES
    );
    expect(PERFORMANCE_DOMAIN_REGISTRY.capabilityScopeRuleGroups).toEqual(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.assessment.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'assessment.self.read',
        'assessment.review.approve',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.capability_domain.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'capability.portrait.read',
        'capability.model.create',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.course_learning.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining(['course.recite.read', 'course.exam.summary'])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.recruit_plan.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining(['recruit_plan.read', 'recruit_plan.reopen'])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.resume_pool.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'resume_pool.read',
        'resume_pool.create_interview',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.knowledge_base.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'knowledge_base.read',
        'knowledge_base.qa_create',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.supplier_vehicle.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining(['supplier.read', 'vehicle.stats'])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.document_center.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining(['document.read', 'document.update'])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.asset_domain.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'asset_info.read',
        'asset_assignment_request.assign',
        'asset_transfer.complete',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.material_domain.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'material.catalog.read',
        'material.inbound.submit',
        'material.issue.issue',
        'material.stocklog.read',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.salary_domain.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'salary.read',
        'salary.confirm',
        'salary.change_add',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.goal.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'goal.page_read',
        'goal.ops.personal_write',
        'goal.ops.global',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.purchase_order.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'purchase_order.read',
        'purchase_order.submit_approval',
        'purchase_order.delete',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.teacher_domain.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'teacher_agent.read',
        'teacher_info.assign',
        'teacher_todo.read',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.feedback.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'feedback.task.read',
        'feedback.summary.read',
        'feedback.export',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.suggestion.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'suggestion.read',
        'suggestion.reject',
        'suggestion.revoke',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.promotion.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'promotion.read',
        'promotion.submit',
        'promotion.review',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.pip.map(item => item.capabilityKey)
    ).toEqual(
      expect.arrayContaining([
        'pip.read',
        'pip.start',
        'pip.export',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.workplan.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'workplan.read',
        'workplan.start',
        'workplan.sync',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.meeting.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'meeting.page',
        'meeting.update',
        'meeting.checkin',
      ])
    );
    expect(
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.office_collab.map(
        item => item.capabilityKey
      )
    ).toEqual(
      expect.arrayContaining([
        'office.annual_inspection.read',
        'office.express_collab.delete',
      ])
    );
    expect(Object.keys(PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY)).toEqual(
      expect.arrayContaining(personaKeys)
    );
    expect(PERFORMANCE_DOMAIN_REGISTRY.personaRoleKindByKey).toEqual(
      PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY
    );
  });
});
