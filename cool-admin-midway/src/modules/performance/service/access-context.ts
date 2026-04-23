/**
 * 绩效域角色事实源解析服务。
 * 这里只负责把现有 token/perms/department scope 收敛成第一批可用的 persona、capability、scope 与 workbench 上下文，
 * 并持久化当前选中的 persona 偏好；不负责菜单生成、前端卡片渲染或全量权限体系重写。
 * 维护重点是后端必须成为 assessment / approval-flow / dashboard / workbench 的角色真相来源，避免前端继续猜测 hr/manager/staff。
 */
import {
  App,
  ASYNC_CONTEXT_KEY,
  ASYNC_CONTEXT_MANAGER_KEY,
  AsyncContextManager,
  IMidwayApplication,
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain';
import {
  PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS,
  PERFORMANCE_PERSONA_INFERENCE_RULES,
  PERFORMANCE_PERSONA_KEYS,
  PERFORMANCE_PERSONA_OPTIONS_BY_KEY,
  PERFORMANCE_PERSONA_PRIORITY,
  PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY,
  PERFORMANCE_SURFACE_ACCESS_RULES,
  PERFORMANCE_PERSONA_WORKBENCH_PAGES,
  PERFORMANCE_WORKBENCH_PAGE_ACCESS_RULES,
  type PerformanceCapabilityScopePresetKey,
  type PerformanceLegacyCapabilityScopeRule,
  type PerformanceLegacyPermissionAlias,
  type PerformancePersonaInferenceRule,
  type PerformancePersonaOption as PerformanceRegisteredPersonaOption,
  PerformanceRegisteredPersonaKey,
  type PerformanceRegisteredRoleKind,
  PerformanceRegisteredScopeKey,
  type PerformanceSurfaceAccessKey,
  type PerformanceWorkbenchPageId as PerformanceRegisteredWorkbenchPageId,
} from '../domain/roles/catalog';
import {
  hasPermissionKey,
  isSuperAdminPermission,
} from '../../base/service/sys/permission-ssot';
import { resolveUserAdminRuntimeContext } from '../../user/domain';

type PerformancePersonaOption = PerformanceRegisteredPersonaOption;
type PerformanceWorkbenchPageId = PerformanceRegisteredWorkbenchPageId;

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

type PerformanceLegacyHelperDeps = {
  ctx?: any;
  app?: IMidwayApplication;
  baseSysMenuService?: Pick<BaseSysMenuService, 'getPerms'>;
  baseSysPermsService?: Pick<BaseSysPermsService, 'departmentIds'>;
};

type PerformanceLegacyPermOptions = {
  allowEmptyRoleIds?: boolean;
  missingAuthMessage?: string;
};

export type PerformanceAccessContextResolveOptions =
  PerformanceLegacyPermOptions;

export type PerformanceLegacyAdmin = {
  userId?: number;
  roleIds?: number[];
  permissionMask?: string | null;
  isAdmin?: boolean;
  name?: string;
  nickName?: string;
  username?: string;
  tenantId?: number | null;
};

export function resolvePerformanceRuntimeContext({
  ctx,
  app,
}: PerformanceLegacyHelperDeps) {
  if (ctx?.admin) {
    return ctx;
  }

  try {
    const contextManager: AsyncContextManager = app
      ?.getApplicationContext()
      ?.get?.(ASYNC_CONTEXT_MANAGER_KEY);
    const runtimeContext = contextManager?.active?.().getValue(ASYNC_CONTEXT_KEY) as any;
    return runtimeContext || ctx;
  } catch (error) {
    return ctx;
  }
}

export function resolvePerformanceCurrentAdmin({
  ctx,
  app,
}: PerformanceLegacyHelperDeps): PerformanceLegacyAdmin | undefined {
  const runtimeContext = resolvePerformanceRuntimeContext({ ctx, app });

  if (runtimeContext?.admin) {
    return runtimeContext.admin;
  }

  const token =
    runtimeContext?.get?.('Authorization') || runtimeContext?.headers?.authorization;

  if (!token) {
    return undefined;
  }

  try {
    return jwt.verify(token, resolveBaseJwtConfig(app).secret) as PerformanceLegacyAdmin;
  } catch (error) {
    return undefined;
  }
}

export async function resolvePerformanceLegacyPerms(
  deps: PerformanceLegacyHelperDeps,
  options: PerformanceLegacyPermOptions = {}
) {
  const admin = resolvePerformanceCurrentAdmin(deps);
  const roleIds = admin?.roleIds;

  if (!Array.isArray(roleIds) || !roleIds.length) {
    if (options.allowEmptyRoleIds) {
      return [];
    }
    throw new CoolCommException(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.authContextMissing,
        options.missingAuthMessage
      )
    );
  }

  if (!deps.baseSysMenuService) {
    throw new CoolCommException(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.permissionServiceMissing
      )
    );
  }

  return deps.baseSysMenuService.getPerms(roleIds);
}

export async function resolvePerformanceLegacyDepartmentIds(
  deps: PerformanceLegacyHelperDeps,
  userId: number
) {
  if (!deps.baseSysPermsService) {
    throw new CoolCommException(
      resolvePerformanceDomainErrorMessage(
        PERFORMANCE_DOMAIN_ERROR_CODES.departmentScopeServiceMissing
      )
    );
  }

  const ids = await deps.baseSysPermsService.departmentIds(userId);
  return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
}

export function hasPerformanceLegacyPermission(
  input: {
    perms: string[];
    admin?: PerformanceLegacyAdmin;
  },
  permissionKey: string
) {
  return hasPermissionKey(
    {
      perms: input.perms,
      permissionMask: input.admin?.permissionMask,
      isAdmin: input.admin?.isAdmin === true,
    },
    permissionKey
  );
}

export type PerformancePersonaKey = PerformanceRegisteredPersonaKey;

export type PerformanceRoleKind =
  | PerformanceRegisteredRoleKind
  | 'unsupported';

export type PerformanceScopeKind = PerformanceRegisteredScopeKey;

export type PerformanceCapabilityKey =
  | 'assessment.self.read'
  | 'assessment.self.edit'
  | 'assessment.submit'
  | 'assessment.manage.read'
  | 'assessment.manage.create'
  | 'assessment.manage.update'
  | 'assessment.manage.delete'
  | 'assessment.export'
  | 'assessment.review.read'
  | 'assessment.review.approve'
  | 'assessment.review.reject'
  | 'approval.config.read'
  | 'approval.config.write'
  | 'approval.instance.read'
  | 'approval.instance.approve'
  | 'approval.instance.reject'
  | 'approval.instance.transfer'
  | 'approval.instance.withdraw'
  | 'approval.instance.remind'
  | 'approval.instance.resolve'
  | 'approval.instance.fallback'
  | 'approval.instance.terminate'
  | 'dashboard.summary.read'
  | 'dashboard.cross_summary.read'
  | 'feedback.task.read'
  | 'feedback.task.create'
  | 'feedback.record.submit'
  | 'feedback.summary.read'
  | 'feedback.export'
  | 'course.recite.read'
  | 'course.recite.submit'
  | 'course.practice.read'
  | 'course.practice.submit'
  | 'course.exam.summary'
  | 'capability.model.read'
  | 'capability.model.create'
  | 'capability.model.update'
  | 'capability.item.read'
  | 'capability.portrait.read'
  | 'certificate.read'
  | 'certificate.create'
  | 'certificate.update'
  | 'certificate.issue'
  | 'certificate.record.read'
  | 'job_standard.read'
  | 'job_standard.create'
  | 'job_standard.update'
  | 'job_standard.set_status'
  | 'purchase_report.summary.read'
  | 'purchase_report.trend.read'
  | 'purchase_report.supplier_stats.read'
  | 'talent_asset.read'
  | 'talent_asset.create'
  | 'talent_asset.update'
  | 'talent_asset.delete'
  | 'course.read'
  | 'course.create'
  | 'course.update'
  | 'course.delete'
  | 'course.enrollment.read'
  | 'contract.read'
  | 'contract.create'
  | 'contract.update'
  | 'contract.delete'
  | 'indicator.read'
  | 'indicator.create'
  | 'indicator.update'
  | 'indicator.delete'
  | 'intellectual_property.read'
  | 'intellectual_property.stats'
  | 'intellectual_property.create'
  | 'intellectual_property.update'
  | 'intellectual_property.delete'
  | 'material.catalog.read'
  | 'material.catalog.create'
  | 'material.catalog.update'
  | 'material.catalog.delete'
  | 'material.catalog.update_status'
  | 'material.stock.read'
  | 'material.stock.summary'
  | 'material.inbound.read'
  | 'material.inbound.create'
  | 'material.inbound.update'
  | 'material.inbound.submit'
  | 'material.inbound.receive'
  | 'material.inbound.cancel'
  | 'material.issue.read'
  | 'material.issue.create'
  | 'material.issue.update'
  | 'material.issue.submit'
  | 'material.issue.issue'
  | 'material.issue.cancel'
  | 'material.stocklog.read'
  | 'supplier.read'
  | 'supplier.create'
  | 'supplier.update'
  | 'supplier.delete'
  | 'vehicle.read'
  | 'vehicle.stats'
  | 'vehicle.create'
  | 'vehicle.update'
  | 'vehicle.delete'
  | 'document.read'
  | 'document.stats'
  | 'document.create'
  | 'document.update'
  | 'document.delete'
  | 'knowledge_base.read'
  | 'knowledge_base.stats'
  | 'knowledge_base.create'
  | 'knowledge_base.update'
  | 'knowledge_base.delete'
  | 'knowledge_base.graph'
  | 'knowledge_base.search'
  | 'knowledge_base.qa_read'
  | 'knowledge_base.qa_create'
  | 'office.annual_inspection.read'
  | 'office.annual_inspection.stats'
  | 'office.annual_inspection.create'
  | 'office.annual_inspection.update'
  | 'office.annual_inspection.delete'
  | 'office.honor.read'
  | 'office.honor.stats'
  | 'office.honor.create'
  | 'office.honor.update'
  | 'office.honor.delete'
  | 'office.publicity_material.read'
  | 'office.publicity_material.stats'
  | 'office.publicity_material.create'
  | 'office.publicity_material.update'
  | 'office.publicity_material.delete'
  | 'office.design_collab.read'
  | 'office.design_collab.stats'
  | 'office.design_collab.create'
  | 'office.design_collab.update'
  | 'office.design_collab.delete'
  | 'office.express_collab.read'
  | 'office.express_collab.stats'
  | 'office.express_collab.create'
  | 'office.express_collab.update'
  | 'office.express_collab.delete'
  | 'suggestion.read'
  | 'suggestion.accept'
  | 'suggestion.ignore'
  | 'suggestion.reject'
  | 'suggestion.revoke'
  | 'promotion.read'
  | 'promotion.create'
  | 'promotion.update'
  | 'promotion.submit'
  | 'promotion.review'
  | 'pip.read'
  | 'pip.create'
  | 'pip.update'
  | 'pip.start'
  | 'pip.track'
  | 'pip.complete'
  | 'pip.close'
  | 'pip.export'
  | 'workplan.read'
  | 'workplan.create'
  | 'workplan.update'
  | 'workplan.delete'
  | 'workplan.start'
  | 'workplan.complete'
  | 'workplan.cancel'
  | 'workplan.sync'
  | 'meeting.page'
  | 'meeting.read'
  | 'meeting.create'
  | 'meeting.update'
  | 'meeting.delete'
  | 'meeting.checkin'
  | 'salary.read'
  | 'salary.create'
  | 'salary.update'
  | 'salary.confirm'
  | 'salary.archive'
  | 'salary.change_add'
  | 'interview.read'
  | 'interview.create'
  | 'interview.update'
  | 'interview.delete'
  | 'recruit_plan.read'
  | 'recruit_plan.create'
  | 'recruit_plan.update'
  | 'recruit_plan.delete'
  | 'recruit_plan.import'
  | 'recruit_plan.export'
  | 'recruit_plan.submit'
  | 'recruit_plan.close'
  | 'recruit_plan.void'
  | 'recruit_plan.reopen'
  | 'resume_pool.read'
  | 'resume_pool.create'
  | 'resume_pool.update'
  | 'resume_pool.import'
  | 'resume_pool.export'
  | 'resume_pool.upload_attachment'
  | 'resume_pool.download_attachment'
  | 'resume_pool.convert_to_talent_asset'
  | 'resume_pool.create_interview'
  | 'hiring.read'
  | 'hiring.create'
  | 'hiring.update_status'
  | 'hiring.close'
  | 'goal.page_read'
  | 'goal.detail.read'
  | 'goal.create'
  | 'goal.update'
  | 'goal.delete'
  | 'goal.progress_update'
  | 'goal.export'
  | 'goal.ops.read'
  | 'goal.ops.personal_write'
  | 'goal.ops.manage'
  | 'goal.ops.global'
  | 'purchase_order.read'
  | 'purchase_order.create'
  | 'purchase_order.update'
  | 'purchase_order.delete'
  | 'purchase_order.submit_inquiry'
  | 'purchase_order.submit_approval'
  | 'purchase_order.approve'
  | 'purchase_order.reject'
  | 'purchase_order.receive'
  | 'purchase_order.close'
  | 'asset_info.read'
  | 'asset_info.create'
  | 'asset_info.update'
  | 'asset_info.delete'
  | 'asset_info.update_status'
  | 'asset_assignment.read'
  | 'asset_assignment.create'
  | 'asset_assignment.update'
  | 'asset_assignment.delete'
  | 'asset_assignment.return'
  | 'asset_assignment.mark_lost'
  | 'asset_assignment_request.read'
  | 'asset_assignment_request.create'
  | 'asset_assignment_request.update'
  | 'asset_assignment_request.submit'
  | 'asset_assignment_request.withdraw'
  | 'asset_assignment_request.assign'
  | 'asset_assignment_request.cancel'
  | 'asset_dashboard.summary'
  | 'asset_depreciation.read'
  | 'asset_depreciation.summary'
  | 'asset_depreciation.recalculate'
  | 'asset_disposal.read'
  | 'asset_disposal.create'
  | 'asset_disposal.update'
  | 'asset_disposal.submit'
  | 'asset_disposal.approve'
  | 'asset_disposal.execute'
  | 'asset_disposal.cancel'
  | 'asset_inventory.read'
  | 'asset_inventory.create'
  | 'asset_inventory.update'
  | 'asset_inventory.start'
  | 'asset_inventory.complete'
  | 'asset_inventory.close'
  | 'asset_maintenance.read'
  | 'asset_maintenance.create'
  | 'asset_maintenance.update'
  | 'asset_maintenance.complete'
  | 'asset_maintenance.cancel'
  | 'asset_maintenance.delete'
  | 'asset_procurement.read'
  | 'asset_procurement.create'
  | 'asset_procurement.update'
  | 'asset_procurement.submit'
  | 'asset_procurement.receive'
  | 'asset_procurement.cancel'
  | 'asset_report.read'
  | 'asset_report.summary'
  | 'asset_report.export'
  | 'asset_transfer.read'
  | 'asset_transfer.create'
  | 'asset_transfer.update'
  | 'asset_transfer.submit'
  | 'asset_transfer.complete'
  | 'asset_transfer.cancel'
  | 'teacher_agent.read'
  | 'teacher_agent.create'
  | 'teacher_agent.update'
  | 'teacher_agent.update_status'
  | 'teacher_agent.blacklist'
  | 'teacher_agent.unblacklist'
  | 'teacher_agent_audit.read'
  | 'teacher_agent_relation.read'
  | 'teacher_agent_relation.create'
  | 'teacher_agent_relation.update'
  | 'teacher_agent_relation.delete'
  | 'teacher_attribution.read'
  | 'teacher_attribution.assign'
  | 'teacher_attribution.change'
  | 'teacher_attribution.remove'
  | 'teacher_attribution_conflict.read'
  | 'teacher_attribution_conflict.create'
  | 'teacher_attribution_conflict.resolve'
  | 'teacher_class.read'
  | 'teacher_class.create'
  | 'teacher_class.update'
  | 'teacher_class.delete'
  | 'teacher_cooperation.mark'
  | 'teacher_dashboard.summary'
  | 'teacher_follow.read'
  | 'teacher_follow.create'
  | 'teacher_info.read'
  | 'teacher_info.create'
  | 'teacher_info.update'
  | 'teacher_info.assign'
  | 'teacher_info.update_status'
  | 'teacher_info.attribution_history'
  | 'teacher_info.attribution_info'
  | 'teacher_todo.read';

export interface PerformancePublicAccessContext {
  availablePersonas: PerformancePersonaOption[];
  defaultPersonaKey: PerformancePersonaKey | null;
  activePersonaKey: PerformancePersonaKey | null;
  roleKind: PerformanceRoleKind;
  canSwitchPersona: boolean;
  workbenchPages: PerformanceWorkbenchPageId[];
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

export interface PerformanceResolvedAccessContext
  extends PerformancePublicAccessContext {
  userId: number;
  departmentIds: number[];
  perms: string[];
  capabilityScopes: Partial<
    Record<PerformanceCapabilityKey, PerformanceScopeKind[]>
  >;
}

type ScopeTarget = {
  subjectUserId?: number | null;
  ownerUserId?: number | null;
  departmentId?: number | null;
};

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceAccessContextService extends BaseService {
  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly legacyPerms = {
    assessmentMyPage: PERMISSIONS.performance.assessment.myPage,
    assessmentPage: PERMISSIONS.performance.assessment.page,
    assessmentPendingPage: PERMISSIONS.performance.assessment.pendingPage,
    assessmentInfo: PERMISSIONS.performance.assessment.info,
    assessmentAdd: PERMISSIONS.performance.assessment.add,
    assessmentUpdate: PERMISSIONS.performance.assessment.update,
    assessmentDelete: PERMISSIONS.performance.assessment.delete,
    assessmentSubmit: PERMISSIONS.performance.assessment.submit,
    assessmentApprove: PERMISSIONS.performance.assessment.approve,
    assessmentReject: PERMISSIONS.performance.assessment.reject,
    assessmentExport: PERMISSIONS.performance.assessment.export,
    approvalConfigInfo: PERMISSIONS.performance.approvalFlow.configInfo,
    approvalConfigSave: PERMISSIONS.performance.approvalFlow.configSave,
    approvalInfo: PERMISSIONS.performance.approvalFlow.info,
    approvalApprove: PERMISSIONS.performance.approvalFlow.approve,
    approvalReject: PERMISSIONS.performance.approvalFlow.reject,
    approvalTransfer: PERMISSIONS.performance.approvalFlow.transfer,
    approvalWithdraw: PERMISSIONS.performance.approvalFlow.withdraw,
    approvalRemind: PERMISSIONS.performance.approvalFlow.remind,
    approvalResolve: PERMISSIONS.performance.approvalFlow.resolve,
    approvalFallback: PERMISSIONS.performance.approvalFlow.fallback,
    approvalTerminate: PERMISSIONS.performance.approvalFlow.terminate,
    dashboardSummary: PERMISSIONS.performance.dashboard.summary,
    dashboardCrossSummary: PERMISSIONS.performance.dashboard.crossSummary,
    feedbackPage: PERMISSIONS.performance.feedback.page,
    feedbackInfo: PERMISSIONS.performance.feedback.info,
    feedbackAdd: PERMISSIONS.performance.feedback.add,
    feedbackSubmit: PERMISSIONS.performance.feedback.submit,
    feedbackSummary: PERMISSIONS.performance.feedback.summary,
    feedbackExport: PERMISSIONS.performance.feedback.export,
    capabilityModelPage: PERMISSIONS.performance.capabilityModel.page,
    capabilityModelInfo: PERMISSIONS.performance.capabilityModel.info,
    capabilityModelAdd: PERMISSIONS.performance.capabilityModel.add,
    capabilityModelUpdate: PERMISSIONS.performance.capabilityModel.update,
    capabilityItemInfo: PERMISSIONS.performance.capabilityItem.info,
    capabilityPortraitInfo: PERMISSIONS.performance.capabilityPortrait.info,
    certificatePage: PERMISSIONS.performance.certificate.page,
    certificateInfo: PERMISSIONS.performance.certificate.info,
    certificateAdd: PERMISSIONS.performance.certificate.add,
    certificateUpdate: PERMISSIONS.performance.certificate.update,
    certificateIssue: PERMISSIONS.performance.certificate.issue,
    certificateRecordPage: PERMISSIONS.performance.certificate.recordPage,
    jobStandardPage: PERMISSIONS.performance.jobStandard.page,
    jobStandardInfo: PERMISSIONS.performance.jobStandard.info,
    jobStandardAdd: PERMISSIONS.performance.jobStandard.add,
    jobStandardUpdate: PERMISSIONS.performance.jobStandard.update,
    jobStandardSetStatus: PERMISSIONS.performance.jobStandard.setStatus,
    purchaseReportSummary: PERMISSIONS.performance.purchaseReport.summary,
    purchaseReportTrend: PERMISSIONS.performance.purchaseReport.trend,
    purchaseReportSupplierStats:
      PERMISSIONS.performance.purchaseReport.supplierStats,
    purchaseOrderPage: PERMISSIONS.performance.purchaseOrder.page,
    purchaseOrderInfo: PERMISSIONS.performance.purchaseOrder.info,
    purchaseOrderAdd: PERMISSIONS.performance.purchaseOrder.add,
    purchaseOrderUpdate: PERMISSIONS.performance.purchaseOrder.update,
    purchaseOrderDelete: PERMISSIONS.performance.purchaseOrder.delete,
    purchaseOrderSubmitInquiry:
      PERMISSIONS.performance.purchaseOrder.submitInquiry,
    purchaseOrderSubmitApproval:
      PERMISSIONS.performance.purchaseOrder.submitApproval,
    purchaseOrderApprove: PERMISSIONS.performance.purchaseOrder.approve,
    purchaseOrderReject: PERMISSIONS.performance.purchaseOrder.reject,
    purchaseOrderReceive: PERMISSIONS.performance.purchaseOrder.receive,
    purchaseOrderClose: PERMISSIONS.performance.purchaseOrder.close,
    talentAssetPage: PERMISSIONS.performance.talentAsset.page,
    talentAssetInfo: PERMISSIONS.performance.talentAsset.info,
    talentAssetAdd: PERMISSIONS.performance.talentAsset.add,
    talentAssetUpdate: PERMISSIONS.performance.talentAsset.update,
    talentAssetDelete: PERMISSIONS.performance.talentAsset.delete,
    suggestionPage: PERMISSIONS.performance.suggestion.page,
    suggestionInfo: PERMISSIONS.performance.suggestion.info,
    suggestionAccept: PERMISSIONS.performance.suggestion.accept,
    suggestionIgnore: PERMISSIONS.performance.suggestion.ignore,
    suggestionReject: PERMISSIONS.performance.suggestion.reject,
    suggestionRevoke: PERMISSIONS.performance.suggestion.revoke,
    contractPage: PERMISSIONS.performance.contract.page,
    contractInfo: PERMISSIONS.performance.contract.info,
    contractAdd: PERMISSIONS.performance.contract.add,
    contractUpdate: PERMISSIONS.performance.contract.update,
    contractDelete: PERMISSIONS.performance.contract.delete,
    promotionPage: PERMISSIONS.performance.promotion.page,
    promotionInfo: PERMISSIONS.performance.promotion.info,
    promotionAdd: PERMISSIONS.performance.promotion.add,
    promotionUpdate: PERMISSIONS.performance.promotion.update,
    promotionSubmit: PERMISSIONS.performance.promotion.submit,
    promotionReview: PERMISSIONS.performance.promotion.review,
    pipPage: PERMISSIONS.performance.pip.page,
    pipInfo: PERMISSIONS.performance.pip.info,
    pipAdd: PERMISSIONS.performance.pip.add,
    pipUpdate: PERMISSIONS.performance.pip.update,
    pipStart: PERMISSIONS.performance.pip.start,
    pipTrack: PERMISSIONS.performance.pip.track,
    pipComplete: PERMISSIONS.performance.pip.complete,
    pipClose: PERMISSIONS.performance.pip.close,
    pipExport: PERMISSIONS.performance.pip.export,
    goalPage: PERMISSIONS.performance.goal.page,
    goalInfo: PERMISSIONS.performance.goal.info,
    goalAdd: PERMISSIONS.performance.goal.add,
    goalUpdate: PERMISSIONS.performance.goal.update,
    goalDelete: PERMISSIONS.performance.goal.delete,
    goalProgressUpdate: PERMISSIONS.performance.goal.progressUpdate,
    goalExport: PERMISSIONS.performance.goal.export,
    goalOpsManage: PERMISSIONS.performance.goal.opsManage,
    goalOpsGlobalScope: PERMISSIONS.performance.goal.opsGlobalScope,
    courseRecitePage: PERMISSIONS.performance.courseRecite.page,
    courseReciteInfo: PERMISSIONS.performance.courseRecite.info,
    courseReciteSubmit: PERMISSIONS.performance.courseRecite.submit,
    coursePracticePage: PERMISSIONS.performance.coursePractice.page,
    coursePracticeInfo: PERMISSIONS.performance.coursePractice.info,
    coursePracticeSubmit: PERMISSIONS.performance.coursePractice.submit,
    courseExamSummary: PERMISSIONS.performance.courseExam.summary,
    coursePage: PERMISSIONS.performance.course.page,
    courseInfo: PERMISSIONS.performance.course.info,
    courseAdd: PERMISSIONS.performance.course.add,
    courseUpdate: PERMISSIONS.performance.course.update,
    courseDelete: PERMISSIONS.performance.course.delete,
    courseEnrollmentPage: PERMISSIONS.performance.course.enrollmentPage,
    meetingPage: PERMISSIONS.performance.meeting.page,
    meetingInfo: PERMISSIONS.performance.meeting.info,
    meetingAdd: PERMISSIONS.performance.meeting.add,
    meetingUpdate: PERMISSIONS.performance.meeting.update,
    meetingDelete: PERMISSIONS.performance.meeting.delete,
    meetingCheckIn: PERMISSIONS.performance.meeting.checkIn,
    workPlanPage: PERMISSIONS.performance.workPlan.page,
    workPlanInfo: PERMISSIONS.performance.workPlan.info,
    workPlanAdd: PERMISSIONS.performance.workPlan.add,
    workPlanUpdate: PERMISSIONS.performance.workPlan.update,
    workPlanDelete: PERMISSIONS.performance.workPlan.delete,
    workPlanStart: PERMISSIONS.performance.workPlan.start,
    workPlanComplete: PERMISSIONS.performance.workPlan.complete,
    workPlanCancel: PERMISSIONS.performance.workPlan.cancel,
    workPlanSync: PERMISSIONS.performance.workPlan.sync,
    teacherAgentPage: PERMISSIONS.performance.teacherAgent.page,
    teacherAgentInfo: PERMISSIONS.performance.teacherAgent.info,
    teacherAgentAdd: PERMISSIONS.performance.teacherAgent.add,
    teacherAgentUpdate: PERMISSIONS.performance.teacherAgent.update,
    teacherAgentUpdateStatus:
      PERMISSIONS.performance.teacherAgent.updateStatus,
    teacherAgentBlacklist: PERMISSIONS.performance.teacherAgent.blacklist,
    teacherAgentUnblacklist: PERMISSIONS.performance.teacherAgent.unblacklist,
    teacherAgentAuditPage: PERMISSIONS.performance.teacherAgentAudit.page,
    teacherAgentAuditInfo: PERMISSIONS.performance.teacherAgentAudit.info,
    teacherAgentRelationPage: PERMISSIONS.performance.teacherAgentRelation.page,
    teacherAgentRelationAdd: PERMISSIONS.performance.teacherAgentRelation.add,
    teacherAgentRelationUpdate:
      PERMISSIONS.performance.teacherAgentRelation.update,
    teacherAgentRelationDelete:
      PERMISSIONS.performance.teacherAgentRelation.delete,
    teacherAttributionPage: PERMISSIONS.performance.teacherAttribution.page,
    teacherAttributionInfo: PERMISSIONS.performance.teacherAttribution.info,
    teacherAttributionAssign:
      PERMISSIONS.performance.teacherAttribution.assign,
    teacherAttributionChange:
      PERMISSIONS.performance.teacherAttribution.change,
    teacherAttributionRemove:
      PERMISSIONS.performance.teacherAttribution.remove,
    teacherAttributionConflictPage:
      PERMISSIONS.performance.teacherAttributionConflict.page,
    teacherAttributionConflictInfo:
      PERMISSIONS.performance.teacherAttributionConflict.info,
    teacherAttributionConflictCreate:
      PERMISSIONS.performance.teacherAttributionConflict.create,
    teacherAttributionConflictResolve:
      PERMISSIONS.performance.teacherAttributionConflict.resolve,
    teacherClassPage: PERMISSIONS.performance.teacherClass.page,
    teacherClassInfo: PERMISSIONS.performance.teacherClass.info,
    teacherClassAdd: PERMISSIONS.performance.teacherClass.add,
    teacherClassUpdate: PERMISSIONS.performance.teacherClass.update,
    teacherClassDelete: PERMISSIONS.performance.teacherClass.delete,
    teacherCooperationMark: PERMISSIONS.performance.teacherCooperation.mark,
    teacherDashboardSummary: PERMISSIONS.performance.teacherDashboard.summary,
    teacherFollowPage: PERMISSIONS.performance.teacherFollow.page,
    teacherFollowAdd: PERMISSIONS.performance.teacherFollow.add,
    teacherInfoPage: PERMISSIONS.performance.teacherInfo.page,
    teacherInfoInfo: PERMISSIONS.performance.teacherInfo.info,
    teacherInfoAdd: PERMISSIONS.performance.teacherInfo.add,
    teacherInfoUpdate: PERMISSIONS.performance.teacherInfo.update,
    teacherInfoAssign: PERMISSIONS.performance.teacherInfo.assign,
    teacherInfoUpdateStatus:
      PERMISSIONS.performance.teacherInfo.updateStatus,
    teacherInfoAttributionHistory:
      PERMISSIONS.performance.teacherInfo.attributionHistory,
    teacherInfoAttributionInfo:
      PERMISSIONS.performance.teacherInfo.attributionInfo,
    teacherTodoPage: PERMISSIONS.performance.teacherTodo.page,
    salaryPage: PERMISSIONS.performance.salary.page,
    salaryInfo: PERMISSIONS.performance.salary.info,
    salaryAdd: PERMISSIONS.performance.salary.add,
    salaryUpdate: PERMISSIONS.performance.salary.update,
    salaryConfirm: PERMISSIONS.performance.salary.confirm,
    salaryArchive: PERMISSIONS.performance.salary.archive,
    salaryChangeAdd: PERMISSIONS.performance.salary.changeAdd,
    indicatorPage: PERMISSIONS.performance.indicator.page,
    indicatorInfo: PERMISSIONS.performance.indicator.info,
    indicatorAdd: PERMISSIONS.performance.indicator.add,
    indicatorUpdate: PERMISSIONS.performance.indicator.update,
    indicatorDelete: PERMISSIONS.performance.indicator.delete,
    intellectualPropertyPage: PERMISSIONS.performance.intellectualProperty.page,
    intellectualPropertyInfo: PERMISSIONS.performance.intellectualProperty.info,
    intellectualPropertyStats: PERMISSIONS.performance.intellectualProperty.stats,
    intellectualPropertyAdd: PERMISSIONS.performance.intellectualProperty.add,
    intellectualPropertyUpdate: PERMISSIONS.performance.intellectualProperty.update,
    intellectualPropertyDelete: PERMISSIONS.performance.intellectualProperty.delete,
    materialCatalogPage: PERMISSIONS.performance.materialCatalog.page,
    materialCatalogInfo: PERMISSIONS.performance.materialCatalog.info,
    materialCatalogAdd: PERMISSIONS.performance.materialCatalog.add,
    materialCatalogUpdate: PERMISSIONS.performance.materialCatalog.update,
    materialCatalogDelete: PERMISSIONS.performance.materialCatalog.delete,
    materialCatalogUpdateStatus: PERMISSIONS.performance.materialCatalog.updateStatus,
    materialStockPage: PERMISSIONS.performance.materialStock.page,
    materialStockInfo: PERMISSIONS.performance.materialStock.info,
    materialStockSummary: PERMISSIONS.performance.materialStock.summary,
    materialInboundPage: PERMISSIONS.performance.materialInbound.page,
    materialInboundInfo: PERMISSIONS.performance.materialInbound.info,
    materialInboundAdd: PERMISSIONS.performance.materialInbound.add,
    materialInboundUpdate: PERMISSIONS.performance.materialInbound.update,
    materialInboundSubmit: PERMISSIONS.performance.materialInbound.submit,
    materialInboundReceive: PERMISSIONS.performance.materialInbound.receive,
    materialInboundCancel: PERMISSIONS.performance.materialInbound.cancel,
    materialIssuePage: PERMISSIONS.performance.materialIssue.page,
    materialIssueInfo: PERMISSIONS.performance.materialIssue.info,
    materialIssueAdd: PERMISSIONS.performance.materialIssue.add,
    materialIssueUpdate: PERMISSIONS.performance.materialIssue.update,
    materialIssueSubmit: PERMISSIONS.performance.materialIssue.submit,
    materialIssueIssue: PERMISSIONS.performance.materialIssue.issue,
    materialIssueCancel: PERMISSIONS.performance.materialIssue.cancel,
    materialStockLogPage: PERMISSIONS.performance.materialStockLog.page,
    supplierPage: PERMISSIONS.performance.supplier.page,
    supplierInfo: PERMISSIONS.performance.supplier.info,
    supplierAdd: PERMISSIONS.performance.supplier.add,
    supplierUpdate: PERMISSIONS.performance.supplier.update,
    supplierDelete: PERMISSIONS.performance.supplier.delete,
    vehiclePage: PERMISSIONS.performance.vehicle.page,
    vehicleInfo: PERMISSIONS.performance.vehicle.info,
    vehicleStats: PERMISSIONS.performance.vehicle.stats,
    vehicleAdd: PERMISSIONS.performance.vehicle.add,
    vehicleUpdate: PERMISSIONS.performance.vehicle.update,
    vehicleDelete: PERMISSIONS.performance.vehicle.delete,
    documentCenterPage: PERMISSIONS.performance.documentCenter.page,
    documentCenterInfo: PERMISSIONS.performance.documentCenter.info,
    documentCenterStats: PERMISSIONS.performance.documentCenter.stats,
    documentCenterAdd: PERMISSIONS.performance.documentCenter.add,
    documentCenterUpdate: PERMISSIONS.performance.documentCenter.update,
    documentCenterDelete: PERMISSIONS.performance.documentCenter.delete,
    knowledgeBasePage: PERMISSIONS.performance.knowledgeBase.page,
    knowledgeBaseStats: PERMISSIONS.performance.knowledgeBase.stats,
    knowledgeBaseAdd: PERMISSIONS.performance.knowledgeBase.add,
    knowledgeBaseUpdate: PERMISSIONS.performance.knowledgeBase.update,
    knowledgeBaseDelete: PERMISSIONS.performance.knowledgeBase.delete,
    knowledgeBaseGraph: PERMISSIONS.performance.knowledgeBase.graph,
    knowledgeBaseSearch: PERMISSIONS.performance.knowledgeBase.search,
    knowledgeBaseQaList: PERMISSIONS.performance.knowledgeBase.qaList,
    knowledgeBaseQaAdd: PERMISSIONS.performance.knowledgeBase.qaAdd,
    annualInspectionPage: PERMISSIONS.performance.annualInspection.page,
    annualInspectionInfo: PERMISSIONS.performance.annualInspection.info,
    annualInspectionStats: PERMISSIONS.performance.annualInspection.stats,
    annualInspectionAdd: PERMISSIONS.performance.annualInspection.add,
    annualInspectionUpdate: PERMISSIONS.performance.annualInspection.update,
    annualInspectionDelete: PERMISSIONS.performance.annualInspection.delete,
    honorPage: PERMISSIONS.performance.honor.page,
    honorInfo: PERMISSIONS.performance.honor.info,
    honorStats: PERMISSIONS.performance.honor.stats,
    honorAdd: PERMISSIONS.performance.honor.add,
    honorUpdate: PERMISSIONS.performance.honor.update,
    honorDelete: PERMISSIONS.performance.honor.delete,
    publicityMaterialPage: PERMISSIONS.performance.publicityMaterial.page,
    publicityMaterialInfo: PERMISSIONS.performance.publicityMaterial.info,
    publicityMaterialStats: PERMISSIONS.performance.publicityMaterial.stats,
    publicityMaterialAdd: PERMISSIONS.performance.publicityMaterial.add,
    publicityMaterialUpdate: PERMISSIONS.performance.publicityMaterial.update,
    publicityMaterialDelete: PERMISSIONS.performance.publicityMaterial.delete,
    designCollabPage: PERMISSIONS.performance.designCollab.page,
    designCollabInfo: PERMISSIONS.performance.designCollab.info,
    designCollabStats: PERMISSIONS.performance.designCollab.stats,
    designCollabAdd: PERMISSIONS.performance.designCollab.add,
    designCollabUpdate: PERMISSIONS.performance.designCollab.update,
    designCollabDelete: PERMISSIONS.performance.designCollab.delete,
    expressCollabPage: PERMISSIONS.performance.expressCollab.page,
    expressCollabInfo: PERMISSIONS.performance.expressCollab.info,
    expressCollabStats: PERMISSIONS.performance.expressCollab.stats,
    expressCollabAdd: PERMISSIONS.performance.expressCollab.add,
    expressCollabUpdate: PERMISSIONS.performance.expressCollab.update,
    expressCollabDelete: PERMISSIONS.performance.expressCollab.delete,
    interviewPage: PERMISSIONS.performance.interview.page,
    interviewInfo: PERMISSIONS.performance.interview.info,
    interviewAdd: PERMISSIONS.performance.interview.add,
    interviewUpdate: PERMISSIONS.performance.interview.update,
    interviewDelete: PERMISSIONS.performance.interview.delete,
    recruitPlanPage: PERMISSIONS.performance.recruitPlan.page,
    recruitPlanInfo: PERMISSIONS.performance.recruitPlan.info,
    recruitPlanAdd: PERMISSIONS.performance.recruitPlan.add,
    recruitPlanUpdate: PERMISSIONS.performance.recruitPlan.update,
    recruitPlanDelete: PERMISSIONS.performance.recruitPlan.delete,
    recruitPlanImport: PERMISSIONS.performance.recruitPlan.import,
    recruitPlanExport: PERMISSIONS.performance.recruitPlan.export,
    recruitPlanSubmit: PERMISSIONS.performance.recruitPlan.submit,
    recruitPlanClose: PERMISSIONS.performance.recruitPlan.close,
    recruitPlanVoid: PERMISSIONS.performance.recruitPlan.void,
    recruitPlanReopen: PERMISSIONS.performance.recruitPlan.reopen,
    resumePoolPage: PERMISSIONS.performance.resumePool.page,
    resumePoolInfo: PERMISSIONS.performance.resumePool.info,
    resumePoolAdd: PERMISSIONS.performance.resumePool.add,
    resumePoolUpdate: PERMISSIONS.performance.resumePool.update,
    resumePoolImport: PERMISSIONS.performance.resumePool.import,
    resumePoolExport: PERMISSIONS.performance.resumePool.export,
    resumePoolUploadAttachment:
      PERMISSIONS.performance.resumePool.uploadAttachment,
    resumePoolDownloadAttachment:
      PERMISSIONS.performance.resumePool.downloadAttachment,
    resumePoolConvertToTalentAsset:
      PERMISSIONS.performance.resumePool.convertToTalentAsset,
    resumePoolCreateInterview:
      PERMISSIONS.performance.resumePool.createInterview,
    hiringPage: PERMISSIONS.performance.hiring.page,
    hiringInfo: PERMISSIONS.performance.hiring.info,
    hiringAdd: PERMISSIONS.performance.hiring.add,
    hiringUpdateStatus: PERMISSIONS.performance.hiring.updateStatus,
    hiringClose: PERMISSIONS.performance.hiring.close,
    hiringAll: PERMISSIONS.performance.hiring.all,
    assetInfoPage: PERMISSIONS.performance.assetInfo.page,
    assetInfoInfo: PERMISSIONS.performance.assetInfo.info,
    assetInfoAdd: PERMISSIONS.performance.assetInfo.add,
    assetInfoUpdate: PERMISSIONS.performance.assetInfo.update,
    assetInfoDelete: PERMISSIONS.performance.assetInfo.delete,
    assetInfoUpdateStatus: PERMISSIONS.performance.assetInfo.updateStatus,
    assetAssignmentPage: PERMISSIONS.performance.assetAssignment.page,
    assetAssignmentAdd: PERMISSIONS.performance.assetAssignment.add,
    assetAssignmentUpdate: PERMISSIONS.performance.assetAssignment.update,
    assetAssignmentDelete: PERMISSIONS.performance.assetAssignment.delete,
    assetAssignmentReturn: PERMISSIONS.performance.assetAssignment.return,
    assetAssignmentMarkLost: PERMISSIONS.performance.assetAssignment.markLost,
    assetAssignmentRequestPage:
      PERMISSIONS.performance.assetAssignmentRequest.page,
    assetAssignmentRequestInfo:
      PERMISSIONS.performance.assetAssignmentRequest.info,
    assetAssignmentRequestAdd: PERMISSIONS.performance.assetAssignmentRequest.add,
    assetAssignmentRequestUpdate:
      PERMISSIONS.performance.assetAssignmentRequest.update,
    assetAssignmentRequestSubmit:
      PERMISSIONS.performance.assetAssignmentRequest.submit,
    assetAssignmentRequestWithdraw:
      PERMISSIONS.performance.assetAssignmentRequest.withdraw,
    assetAssignmentRequestAssign:
      PERMISSIONS.performance.assetAssignmentRequest.assign,
    assetAssignmentRequestCancel:
      PERMISSIONS.performance.assetAssignmentRequest.cancel,
    assetDashboardSummary: PERMISSIONS.performance.assetDashboard.summary,
    assetDepreciationPage: PERMISSIONS.performance.assetDepreciation.page,
    assetDepreciationSummary: PERMISSIONS.performance.assetDepreciation.summary,
    assetDepreciationRecalculate:
      PERMISSIONS.performance.assetDepreciation.recalculate,
    assetDisposalPage: PERMISSIONS.performance.assetDisposal.page,
    assetDisposalInfo: PERMISSIONS.performance.assetDisposal.info,
    assetDisposalAdd: PERMISSIONS.performance.assetDisposal.add,
    assetDisposalUpdate: PERMISSIONS.performance.assetDisposal.update,
    assetDisposalSubmit: PERMISSIONS.performance.assetDisposal.submit,
    assetDisposalApprove: PERMISSIONS.performance.assetDisposal.approve,
    assetDisposalExecute: PERMISSIONS.performance.assetDisposal.execute,
    assetDisposalCancel: PERMISSIONS.performance.assetDisposal.cancel,
    assetInventoryPage: PERMISSIONS.performance.assetInventory.page,
    assetInventoryInfo: PERMISSIONS.performance.assetInventory.info,
    assetInventoryAdd: PERMISSIONS.performance.assetInventory.add,
    assetInventoryUpdate: PERMISSIONS.performance.assetInventory.update,
    assetInventoryStart: PERMISSIONS.performance.assetInventory.start,
    assetInventoryComplete: PERMISSIONS.performance.assetInventory.complete,
    assetInventoryClose: PERMISSIONS.performance.assetInventory.close,
    assetMaintenancePage: PERMISSIONS.performance.assetMaintenance.page,
    assetMaintenanceAdd: PERMISSIONS.performance.assetMaintenance.add,
    assetMaintenanceUpdate: PERMISSIONS.performance.assetMaintenance.update,
    assetMaintenanceComplete:
      PERMISSIONS.performance.assetMaintenance.complete,
    assetMaintenanceCancel: PERMISSIONS.performance.assetMaintenance.cancel,
    assetMaintenanceDelete: PERMISSIONS.performance.assetMaintenance.delete,
    assetProcurementPage: PERMISSIONS.performance.assetProcurement.page,
    assetProcurementInfo: PERMISSIONS.performance.assetProcurement.info,
    assetProcurementAdd: PERMISSIONS.performance.assetProcurement.add,
    assetProcurementUpdate: PERMISSIONS.performance.assetProcurement.update,
    assetProcurementSubmit: PERMISSIONS.performance.assetProcurement.submit,
    assetProcurementReceive: PERMISSIONS.performance.assetProcurement.receive,
    assetProcurementCancel: PERMISSIONS.performance.assetProcurement.cancel,
    assetReportPage: PERMISSIONS.performance.assetReport.page,
    assetReportSummary: PERMISSIONS.performance.assetReport.summary,
    assetReportExport: PERMISSIONS.performance.assetReport.export,
    assetTransferPage: PERMISSIONS.performance.assetTransfer.page,
    assetTransferInfo: PERMISSIONS.performance.assetTransfer.info,
    assetTransferAdd: PERMISSIONS.performance.assetTransfer.add,
    assetTransferUpdate: PERMISSIONS.performance.assetTransfer.update,
    assetTransferSubmit: PERMISSIONS.performance.assetTransfer.submit,
    assetTransferComplete: PERMISSIONS.performance.assetTransfer.complete,
    assetTransferCancel: PERMISSIONS.performance.assetTransfer.cancel,
  } as const;

  private get currentCtx() {
    if (this.ctx?.admin) {
      return this.ctx;
    }
    try {
      const contextManager: AsyncContextManager = this.app
        .getApplicationContext()
        .get(ASYNC_CONTEXT_MANAGER_KEY);
      return contextManager.active().getValue(ASYNC_CONTEXT_KEY) as any;
    } catch (error) {
      return this.ctx;
    }
  }

  private get currentAdmin() {
    if (this.currentCtx?.admin) {
      return this.currentCtx.admin;
    }
    const token =
      this.currentCtx?.get?.('Authorization') ||
      this.currentCtx?.headers?.authorization;
    if (!token) {
      return undefined;
    }
    try {
      return jwt.verify(token, resolveBaseJwtConfig(this.app).secret) as any;
    } catch (error) {
      return undefined;
    }
  }

  async resolveAccessContext(
    requestedActivePersonaKey?: string | null,
    options: PerformanceAccessContextResolveOptions = {}
  ): Promise<PerformanceResolvedAccessContext> {
    const userId = Number(this.currentAdmin?.userId || 0);

    if (!userId && !options.allowEmptyRoleIds) {
      throw new CoolCommException(
        resolvePerformanceDomainErrorMessage(
          PERFORMANCE_DOMAIN_ERROR_CODES.authContextMissing,
          options.missingAuthMessage
        )
      );
    }

    const perms = await this.currentPerms(options);
    const departmentIds = userId ? await this.resolveDepartmentIds(userId) : [];
    const capabilityScopes = this.resolveCapabilityScopes(perms, departmentIds);
    const personas = this.resolvePersonas(capabilityScopes);
    const defaultPersonaKey = this.resolveDefaultPersonaKey(personas);
    const normalizedRequestedPersonaKey = this.normalizePersonaKey(
      requestedActivePersonaKey
    );
    const persistedActivePersonaKey = userId
      ? await this.resolvePersistedActivePersonaKey(userId)
      : null;
    const activePersonaKey = this.resolveActivePersonaKey({
      personas,
      defaultPersonaKey,
      requestedActivePersonaKey: normalizedRequestedPersonaKey,
      persistedActivePersonaKey,
    });
    const workbenchPages = this.resolveWorkbenchPages(activePersonaKey, perms);
    const roleKind = this.resolveRoleKind(activePersonaKey);

    return {
      userId,
      departmentIds,
      perms,
      capabilityScopes,
      availablePersonas: personas,
      defaultPersonaKey,
      activePersonaKey,
      roleKind,
      canSwitchPersona: personas.length > 1,
      workbenchPages,
      surfaceAccess: this.resolveSurfaceAccess(personas, capabilityScopes),
    };
  }

  async resolvePublicContext(
    requestedActivePersonaKey?: string | null,
    options: PerformanceAccessContextResolveOptions = {}
  ) {
    const context = await this.resolveAccessContext(
      requestedActivePersonaKey,
      options
    );
    return {
      availablePersonas: context.availablePersonas,
      defaultPersonaKey: context.defaultPersonaKey,
      activePersonaKey: context.activePersonaKey,
      roleKind: context.roleKind,
      canSwitchPersona: context.canSwitchPersona,
      workbenchPages: context.workbenchPages,
      surfaceAccess: context.surfaceAccess,
    } as PerformancePublicAccessContext;
  }

  async savePublicContextPreference(requestedActivePersonaKey?: string | null) {
    const currentAdmin = resolveUserAdminRuntimeContext(this.currentAdmin);
    if (!currentAdmin.userId) {
      throw new CoolCommException('登录状态已失效，请重新登录');
    }

    const normalizedRequestedPersonaKey = this.normalizePersonaKey(
      requestedActivePersonaKey
    );
    const currentContext = await this.resolveAccessContext(undefined);

    if (
      normalizedRequestedPersonaKey &&
      !currentContext.availablePersonas.some(
        item => item.key === normalizedRequestedPersonaKey
      )
    ) {
      throw new CoolCommException('当前账号不可切换到该绩效视角');
    }

    await this.baseSysUserEntity.update(
      { id: currentAdmin.userId },
      {
        activePerformancePersonaKey: normalizedRequestedPersonaKey,
      }
    );

    return this.resolvePublicContext();
  }

  hasCapability(
    contextOrScopes:
      | PerformanceResolvedAccessContext['capabilityScopes']
      | PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const capabilityScopes = this.extractCapabilityScopes(contextOrScopes);
    return Array.isArray(capabilityScopes[capabilityKey]);
  }

  hasAnyCapability(
    contextOrScopes:
      | PerformanceResolvedAccessContext['capabilityScopes']
      | PerformanceResolvedAccessContext,
    capabilityKeys: readonly PerformanceCapabilityKey[]
  ) {
    return capabilityKeys.some(item => this.hasCapability(contextOrScopes, item));
  }

  capabilityScopes(
    contextOrScopes:
      | PerformanceResolvedAccessContext['capabilityScopes']
      | PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const capabilityScopes = this.extractCapabilityScopes(contextOrScopes);
    return capabilityScopes[capabilityKey] || [];
  }

  hasCapabilityInScopes(
    contextOrScopes:
      | PerformanceResolvedAccessContext['capabilityScopes']
      | PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    scopes: readonly PerformanceScopeKind[]
  ) {
    return this.capabilityScopes(contextOrScopes, capabilityKey).some(scope =>
      scopes.includes(scope)
    );
  }

  hasAnyCapabilityInScopes(
    contextOrScopes:
      | PerformanceResolvedAccessContext['capabilityScopes']
      | PerformanceResolvedAccessContext,
    capabilityKeys: readonly PerformanceCapabilityKey[],
    scopes: readonly PerformanceScopeKind[]
  ) {
    return capabilityKeys.some(item =>
      this.hasCapabilityInScopes(contextOrScopes, item, scopes)
    );
  }

  matchesScope(
    context: PerformanceResolvedAccessContext,
    scopes: readonly PerformanceScopeKind[],
    target: ScopeTarget
  ) {
    if (scopes.includes('company')) {
      return true;
    }

    if (
      scopes.includes('self') &&
      Number(target.subjectUserId || 0) === Number(context.userId)
    ) {
      return true;
    }

    if (
      scopes.includes('assigned_domain') &&
      Number(target.ownerUserId || 0) === Number(context.userId)
    ) {
      return true;
    }

    if (
      (scopes.includes('department') || scopes.includes('department_tree')) &&
      Number(target.departmentId || 0) > 0 &&
      context.departmentIds.includes(Number(target.departmentId))
    ) {
      return true;
    }

    return false;
  }

  private extractCapabilityScopes(
    contextOrScopes:
      | PerformanceResolvedAccessContext['capabilityScopes']
      | PerformanceResolvedAccessContext
  ) {
    if ('capabilityScopes' in contextOrScopes) {
      return contextOrScopes.capabilityScopes;
    }
    return contextOrScopes;
  }

  private async currentPerms(
    options: PerformanceAccessContextResolveOptions = {}
  ) {
    const roleIds = this.currentAdmin?.roleIds;

    if (!Array.isArray(roleIds) || !roleIds.length) {
      if (options.allowEmptyRoleIds) {
        return [];
      }
      throw new CoolCommException(
        resolvePerformanceDomainErrorMessage(
          PERFORMANCE_DOMAIN_ERROR_CODES.authContextMissing,
          options.missingAuthMessage
        )
      );
    }

    return this.baseSysMenuService.getPerms(roleIds);
  }

  private async resolveDepartmentIds(userId: number) {
    const ids = await this.baseSysPermsService.departmentIds(userId);
    return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
  }

  private async resolvePersistedActivePersonaKey(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    if (!this.baseSysUserEntity?.findOne) {
      return null;
    }

    const user = await this.baseSysUserEntity.findOne({
      select: ['id', 'activePerformancePersonaKey'],
      where: {
        id: userId,
      },
    });

    return this.normalizePersonaKey(user?.activePerformancePersonaKey || null);
  }

  private hasPerm(perms: string[], permissionKey: string) {
    return hasPermissionKey(
      {
        perms,
        permissionMask: this.currentAdmin?.permissionMask,
        isAdmin: this.currentAdmin?.isAdmin === true,
      },
      permissionKey
    );
  }

  private resolveCapabilityScopes(
    perms: string[],
    departmentIds: number[]
  ): PerformanceResolvedAccessContext['capabilityScopes'] {
    const scopes: PerformanceResolvedAccessContext['capabilityScopes'] = {};
    const isSuperAdmin = isSuperAdminPermission({
      permissionMask: this.currentAdmin?.permissionMask,
      isAdmin: this.currentAdmin?.isAdmin === true,
    });
    const isGlobalOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.assessmentExport) ||
      this.hasPerm(perms, this.legacyPerms.approvalConfigSave) ||
      this.hasPerm(perms, this.legacyPerms.approvalResolve) ||
      this.hasPerm(perms, this.legacyPerms.approvalFallback) ||
      this.hasPerm(perms, this.legacyPerms.approvalTerminate);
    const isHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.salaryPage);
    const isCapabilityHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.capabilityModelAdd) ||
      this.hasPerm(perms, this.legacyPerms.capabilityModelUpdate);
    const isCertificateHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.certificateAdd) ||
      this.hasPerm(perms, this.legacyPerms.certificateUpdate) ||
      this.hasPerm(perms, this.legacyPerms.certificateIssue);
    const isJobStandardHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.jobStandardAdd) ||
      this.hasPerm(perms, this.legacyPerms.jobStandardUpdate) ||
      this.hasPerm(perms, this.legacyPerms.jobStandardSetStatus);
    const isPurchaseReportHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.purchaseOrderDelete);
    const isTalentAssetHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.talentAssetDelete);
    const isInterviewHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.interviewDelete);
    const isResumePoolHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.resumePoolExport) ||
      this.hasPerm(perms, this.legacyPerms.resumePoolDownloadAttachment);
    const isHiringHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.legacyPerms.hiringAll);
    const isGoalHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, PERMISSIONS.performance.salary.page);
    const isGoalOpsHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, PERMISSIONS.performance.goal.opsGlobalScope);
    const isPurchaseOrderHrOperator =
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, PERMISSIONS.performance.purchaseOrder.delete);
    const isAssetGlobalOperator =
      isSuperAdmin ||
      this.hasPerm(perms, PERMISSIONS.performance.assetInfo.add) ||
      this.hasPerm(perms, PERMISSIONS.performance.assetProcurement.receive) ||
      this.hasPerm(perms, PERMISSIONS.performance.assetDepreciation.recalculate);
    const teacherWritePermKeys = [
      PERMISSIONS.performance.teacherAgent.add,
      PERMISSIONS.performance.teacherAgent.update,
      PERMISSIONS.performance.teacherAgent.updateStatus,
      PERMISSIONS.performance.teacherAgent.blacklist,
      PERMISSIONS.performance.teacherAgent.unblacklist,
      PERMISSIONS.performance.teacherAgentRelation.add,
      PERMISSIONS.performance.teacherAgentRelation.update,
      PERMISSIONS.performance.teacherAgentRelation.delete,
      PERMISSIONS.performance.teacherAttribution.assign,
      PERMISSIONS.performance.teacherAttribution.change,
      PERMISSIONS.performance.teacherAttribution.remove,
      PERMISSIONS.performance.teacherAttributionConflict.create,
      PERMISSIONS.performance.teacherAttributionConflict.resolve,
      PERMISSIONS.performance.teacherClass.add,
      PERMISSIONS.performance.teacherClass.update,
      PERMISSIONS.performance.teacherClass.delete,
      PERMISSIONS.performance.teacherCooperation.mark,
      PERMISSIONS.performance.teacherFollow.add,
      PERMISSIONS.performance.teacherInfo.add,
      PERMISSIONS.performance.teacherInfo.assign,
      PERMISSIONS.performance.teacherInfo.update,
      PERMISSIONS.performance.teacherInfo.updateStatus,
    ] as const;
    const teacherReadPermKeys = [
      PERMISSIONS.performance.teacherAgent.page,
      PERMISSIONS.performance.teacherAgent.info,
      PERMISSIONS.performance.teacherAgentAudit.page,
      PERMISSIONS.performance.teacherAgentAudit.info,
      PERMISSIONS.performance.teacherAgentRelation.page,
      PERMISSIONS.performance.teacherAttribution.page,
      PERMISSIONS.performance.teacherAttribution.info,
      PERMISSIONS.performance.teacherAttributionConflict.page,
      PERMISSIONS.performance.teacherAttributionConflict.info,
      PERMISSIONS.performance.teacherClass.page,
      PERMISSIONS.performance.teacherClass.info,
      PERMISSIONS.performance.teacherDashboard.summary,
      PERMISSIONS.performance.teacherFollow.page,
      PERMISSIONS.performance.teacherInfo.page,
      PERMISSIONS.performance.teacherInfo.info,
      PERMISSIONS.performance.teacherInfo.attributionHistory,
      PERMISSIONS.performance.teacherInfo.attributionInfo,
      PERMISSIONS.performance.teacherTodo.page,
    ] as const;
    const hasTeacherWritePerm = teacherWritePermKeys.some(permissionKey =>
      this.hasPerm(perms, permissionKey)
    );
    const hasTeacherReadPerm = teacherReadPermKeys.some(permissionKey =>
      this.hasPerm(perms, permissionKey)
    );
    const hasTeacherAssignPerm = this.hasPerm(
      perms,
      PERMISSIONS.performance.teacherInfo.assign
    );
    const teacherReadScopes: PerformanceScopeKind[] = isSuperAdmin
      ? ['company']
      : hasTeacherWritePerm
      ? hasTeacherAssignPerm && departmentIds.length
        ? ['department_tree']
        : ['self']
      : departmentIds.length
      ? ['department_tree']
      : hasTeacherReadPerm
      ? ['self']
      : [];
    const teacherWriteScopes: PerformanceScopeKind[] = isSuperAdmin
      ? ['company']
      : hasTeacherWritePerm
      ? hasTeacherAssignPerm && departmentIds.length
        ? ['department_tree']
        : ['self']
      : [];
    const teacherAssignScopes: PerformanceScopeKind[] = isSuperAdmin
      ? ['company']
      : hasTeacherAssignPerm && departmentIds.length
      ? ['department_tree']
      : [];

    const managerScopes: PerformanceScopeKind[] = departmentIds.length
      ? ['assigned_domain', 'department_tree']
      : ['assigned_domain'];
    const manageScopes: PerformanceScopeKind[] = isGlobalOperator
      ? ['company']
      : ['assigned_domain'];
    const dashboardScopes: PerformanceScopeKind[] = isGlobalOperator
      ? ['company']
      : departmentIds.length
      ? ['department_tree']
      : ['assigned_domain'];
    const departmentTreeScopes: PerformanceScopeKind[] = departmentIds.length
      ? ['department_tree']
      : [];
    const hrManagedScopes: PerformanceScopeKind[] = isHrOperator
      ? ['company']
      : departmentTreeScopes;
    const selfScopes: PerformanceScopeKind[] = ['self'];
    const promotionScopes: PerformanceScopeKind[] = isSuperAdmin
      ? ['company']
      : departmentTreeScopes;
    const pipManageScopes: PerformanceScopeKind[] = hrManagedScopes;
    const pipReadScopes: PerformanceScopeKind[] = this.mergeScopes(
      (this.hasPerm(perms, this.legacyPerms.pipPage) ||
        this.hasPerm(perms, this.legacyPerms.pipInfo))
        ? selfScopes
        : [],
      (this.hasPerm(perms, this.legacyPerms.pipAdd) ||
        this.hasPerm(perms, this.legacyPerms.pipUpdate) ||
        this.hasPerm(perms, this.legacyPerms.pipStart) ||
        this.hasPerm(perms, this.legacyPerms.pipTrack) ||
        this.hasPerm(perms, this.legacyPerms.pipComplete) ||
        this.hasPerm(perms, this.legacyPerms.pipClose))
        ? pipManageScopes
        : [],
      isHrOperator &&
        (this.hasPerm(perms, this.legacyPerms.pipPage) ||
          this.hasPerm(perms, this.legacyPerms.pipInfo))
        ? ['company']
        : []
    );
    const pipExportScopes: PerformanceScopeKind[] = isHrOperator
      ? ['company']
      : pipManageScopes;
    const feedbackManagedScopes: PerformanceScopeKind[] = hrManagedScopes;
    const feedbackReadScopes: PerformanceScopeKind[] = this.mergeScopes(
      (this.hasPerm(perms, this.legacyPerms.feedbackPage) ||
        this.hasPerm(perms, this.legacyPerms.feedbackInfo) ||
        this.hasPerm(perms, this.legacyPerms.feedbackSummary) ||
        this.hasPerm(perms, this.legacyPerms.feedbackSubmit))
        ? selfScopes
        : [],
      this.hasPerm(perms, this.legacyPerms.feedbackAdd)
        ? feedbackManagedScopes
        : [],
      isHrOperator &&
        (this.hasPerm(perms, this.legacyPerms.feedbackPage) ||
          this.hasPerm(perms, this.legacyPerms.feedbackInfo) ||
          this.hasPerm(perms, this.legacyPerms.feedbackSummary) ||
          this.hasPerm(perms, this.legacyPerms.feedbackExport))
        ? ['company']
        : []
    );
    const feedbackSummaryScopes: PerformanceScopeKind[] = this.mergeScopes(
      this.hasPerm(perms, this.legacyPerms.feedbackSummary) ? selfScopes : [],
      this.hasPerm(perms, this.legacyPerms.feedbackAdd)
        ? feedbackManagedScopes
        : [],
      isHrOperator && this.hasPerm(perms, this.legacyPerms.feedbackSummary)
        ? ['company']
        : []
    );
    const feedbackExportScopes: PerformanceScopeKind[] = isHrOperator
      ? ['company']
      : feedbackManagedScopes;
    const suggestionManagedScopes: PerformanceScopeKind[] = hrManagedScopes;
    const workPlanManageScopes: PerformanceScopeKind[] = hrManagedScopes;
    const workPlanReadScopes: PerformanceScopeKind[] = this.mergeScopes(
      (this.hasPerm(perms, this.legacyPerms.workPlanPage) ||
        this.hasPerm(perms, this.legacyPerms.workPlanInfo))
        ? selfScopes
        : [],
      (this.hasPerm(perms, this.legacyPerms.workPlanPage) ||
        this.hasPerm(perms, this.legacyPerms.workPlanInfo))
        ? workPlanManageScopes
        : []
    );
    const workPlanStartCompleteScopes: PerformanceScopeKind[] = this.mergeScopes(
      selfScopes,
      workPlanManageScopes
    );
    const meetingManagedScopes: PerformanceScopeKind[] = isHrOperator
      ? ['company']
      : departmentIds.length
      ? ['department_tree']
      : ['assigned_domain'];
    const goalManagerScopes: PerformanceScopeKind[] = isGoalHrOperator
      ? ['company']
      : departmentTreeScopes;
    const goalPageScopes: PerformanceScopeKind[] = isGoalHrOperator
      ? ['company']
      : this.hasPerm(perms, this.legacyPerms.goalAdd) ||
        this.hasPerm(perms, this.legacyPerms.goalUpdate) ||
        this.hasPerm(perms, this.legacyPerms.goalDelete)
      ? departmentTreeScopes
      : ['self'];
    const goalDetailScopes: PerformanceScopeKind[] = isGoalHrOperator
      ? ['company']
      : this.mergeScopes(['self'], departmentTreeScopes);
    const goalProgressScopes: PerformanceScopeKind[] = isGoalHrOperator
      ? ['company']
      : this.mergeScopes(['self'], departmentTreeScopes);
    const goalOpsReadScopes: PerformanceScopeKind[] = isGoalOpsHrOperator
      ? ['company']
      : this.mergeScopes(['self'], departmentTreeScopes);
    const goalOpsManageScopes: PerformanceScopeKind[] = isGoalOpsHrOperator
      ? ['company']
      : departmentTreeScopes;
    const purchaseOrderScopes: PerformanceScopeKind[] = isPurchaseOrderHrOperator
      ? ['company']
      : departmentTreeScopes;
    const capabilityScopePresets: Record<
      PerformanceCapabilityScopePresetKey,
      PerformanceScopeKind[]
    > = {
      self: selfScopes,
      company: ['company'],
      department_tree: departmentTreeScopes,
      manage_scopes: manageScopes,
      manager_scopes: managerScopes,
      dashboard_scopes: dashboardScopes,
      global_operator_or_manager_scopes: isGlobalOperator
        ? ['company']
        : managerScopes,
      global_operator_or_self_scopes: isGlobalOperator ? ['company'] : ['self'],
      capability_hr_or_department_tree_scopes: isCapabilityHrOperator
        ? ['company']
        : departmentTreeScopes,
      certificate_hr_or_department_tree_scopes: isCertificateHrOperator
        ? ['company']
        : departmentTreeScopes,
      job_standard_hr_or_department_tree_scopes: isJobStandardHrOperator
        ? ['company']
        : departmentTreeScopes,
      purchase_report_hr_or_department_tree_scopes: isPurchaseReportHrOperator
        ? ['company']
        : departmentTreeScopes,
      talent_asset_hr_or_department_tree_scopes: isTalentAssetHrOperator
        ? ['company']
        : departmentTreeScopes,
      interview_hr_or_department_tree_scopes: isInterviewHrOperator
        ? ['company']
        : departmentTreeScopes,
      resume_pool_hr_or_department_tree_scopes: isResumePoolHrOperator
        ? ['company']
        : departmentTreeScopes,
      hiring_hr_or_department_tree_scopes: isHiringHrOperator
        ? ['company']
        : departmentTreeScopes,
      asset_global_or_department_tree_scopes: isAssetGlobalOperator
        ? ['company']
        : departmentTreeScopes,
      hr_managed_scopes: hrManagedScopes,
      hr_company_scopes: isHrOperator ? ['company'] : [],
      promotion_scopes: promotionScopes,
      meeting_managed_scopes: meetingManagedScopes,
      pip_read_scopes: pipReadScopes,
      pip_export_scopes: pipExportScopes,
      workplan_read_scopes: workPlanReadScopes,
      workplan_start_complete_scopes: workPlanStartCompleteScopes,
      feedback_task_read_scopes: feedbackReadScopes,
      feedback_summary_scopes: feedbackSummaryScopes,
      feedback_export_scopes: feedbackExportScopes,
      goal_manager_scopes: goalManagerScopes,
      goal_page_scopes: goalPageScopes,
      goal_detail_scopes: goalDetailScopes,
      goal_progress_scopes: goalProgressScopes,
      goal_ops_read_scopes: goalOpsReadScopes,
      goal_ops_manage_scopes: goalOpsManageScopes,
      purchase_order_scopes: purchaseOrderScopes,
      teacher_read_scopes: teacherReadScopes,
      teacher_write_scopes: teacherWriteScopes,
      teacher_assign_scopes: teacherAssignScopes,
    };

    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.assessment,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.approval_flow,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.dashboard,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.capability_domain,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.certificate_domain,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.job_standard,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.purchase_report,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.goal,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.purchase_order,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.teacher_domain,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.talent_asset,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.course_learning,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.course_catalog,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.contract,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.indicator,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.intellectual_property,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.interview,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.recruit_plan,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.resume_pool,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.hiring,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.asset_domain,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.material_domain,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.salary_domain,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.feedback,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.suggestion,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.promotion,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.pip,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.workplan,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.meeting,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.supplier_vehicle,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.document_center,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.knowledge_base,
      capabilityScopePresets
    );
    this.applyLegacyCapabilityScopeRules(
      scopes,
      perms,
      PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS.office_collab,
      capabilityScopePresets
    );

    return scopes;
  }

  private resolvePersonas(
    capabilityScopes: PerformanceResolvedAccessContext['capabilityScopes']
  ) {
    const personas = new Set<PerformancePersonaKey>();
    for (const personaKey of PERFORMANCE_PERSONA_PRIORITY) {
      if (
        this.matchesPersonaInferenceRule(
          capabilityScopes,
          PERFORMANCE_PERSONA_INFERENCE_RULES[personaKey]
        )
      ) {
        personas.add(personaKey);
      }
    }

    return PERFORMANCE_PERSONA_PRIORITY.filter(item => personas.has(item)).map(
      item => PERFORMANCE_PERSONA_OPTIONS_BY_KEY[item]
    );
  }

  private matchesPersonaInferenceRule(
    capabilityScopes: PerformanceResolvedAccessContext['capabilityScopes'],
    rule: PerformancePersonaInferenceRule
  ) {
    const capabilityKeys =
      rule.capabilityKeys as readonly PerformanceCapabilityKey[];
    const scopeKeys = rule.scopeKeys as readonly PerformanceScopeKind[] | undefined;

    if (Array.isArray(scopeKeys) && scopeKeys.length) {
      if (
        Array.isArray(rule.scopedCapabilityKeys) &&
        rule.scopedCapabilityKeys.length
      ) {
        return (
          this.hasAnyCapability(capabilityScopes, capabilityKeys) &&
          rule.scopedCapabilityKeys.some(capabilityKey =>
            this.hasCapabilityInScopes(
              capabilityScopes,
              capabilityKey as PerformanceCapabilityKey,
              scopeKeys
            )
          )
        );
      }

      return this.hasAnyCapabilityInScopes(
        capabilityScopes,
        capabilityKeys,
        scopeKeys
      );
    }

    return this.hasAnyCapability(capabilityScopes, capabilityKeys);
  }

  private resolveDefaultPersonaKey(
    personas: PerformancePersonaOption[]
  ): PerformancePersonaKey | null {
    return personas[0]?.key || null;
  }

  private resolveActivePersonaKey(input: {
    personas: readonly PerformancePersonaOption[];
    defaultPersonaKey: PerformancePersonaKey | null;
    requestedActivePersonaKey?: PerformancePersonaKey | null;
    persistedActivePersonaKey?: PerformancePersonaKey | null;
  }) {
    const {
      personas,
      defaultPersonaKey,
      requestedActivePersonaKey,
      persistedActivePersonaKey,
    } = input;

    if (requestedActivePersonaKey) {
      return personas.some(item => item.key === requestedActivePersonaKey)
        ? requestedActivePersonaKey
        : defaultPersonaKey;
    }

    if (persistedActivePersonaKey) {
      return personas.some(item => item.key === persistedActivePersonaKey)
        ? persistedActivePersonaKey
        : defaultPersonaKey;
    }

    return defaultPersonaKey;
  }

  private mergeScopes(
    ...groups: Array<readonly PerformanceScopeKind[] | undefined>
  ): PerformanceScopeKind[] {
    return Array.from(
      new Set(groups.flatMap(group => (Array.isArray(group) ? group : [])))
    );
  }

  private normalizePersonaKey(
    personaKey?: string | null
  ): PerformancePersonaKey | null {
    if (
      !personaKey ||
      !PERFORMANCE_PERSONA_KEYS.has(personaKey as PerformancePersonaKey)
    ) {
      return null;
    }
    return personaKey as PerformancePersonaKey;
  }

  private resolveRoleKind(
    activePersonaKey: PerformancePersonaKey | null
  ): PerformanceRoleKind {
    if (!activePersonaKey) {
      return 'unsupported';
    }
    return PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY[activePersonaKey];
  }

  private resolveSurfaceAccess(
    personas: readonly PerformancePersonaOption[],
    capabilityScopes: PerformanceResolvedAccessContext['capabilityScopes']
  ): PerformanceResolvedAccessContext['surfaceAccess'] {
    return {
      workbench: personas.length > 0,
      assessmentMy: this.matchesSurfaceAccessRule(
        capabilityScopes,
        PERFORMANCE_SURFACE_ACCESS_RULES.assessmentMy
      ),
      assessmentInitiated: this.matchesSurfaceAccessRule(
        capabilityScopes,
        PERFORMANCE_SURFACE_ACCESS_RULES.assessmentInitiated
      ),
      assessmentPending: this.matchesSurfaceAccessRule(
        capabilityScopes,
        PERFORMANCE_SURFACE_ACCESS_RULES.assessmentPending
      ),
      approvalConfig: this.matchesSurfaceAccessRule(
        capabilityScopes,
        PERFORMANCE_SURFACE_ACCESS_RULES.approvalConfig
      ),
      approvalInstance: this.matchesSurfaceAccessRule(
        capabilityScopes,
        PERFORMANCE_SURFACE_ACCESS_RULES.approvalInstance
      ),
      dashboardSummary: this.matchesSurfaceAccessRule(
        capabilityScopes,
        PERFORMANCE_SURFACE_ACCESS_RULES.dashboardSummary
      ),
      dashboardCrossSummary: this.matchesSurfaceAccessRule(
        capabilityScopes,
        PERFORMANCE_SURFACE_ACCESS_RULES.dashboardCrossSummary
      ),
    };
  }

  private matchesSurfaceAccessRule(
    capabilityScopes: PerformanceResolvedAccessContext['capabilityScopes'],
    rule: { capabilityKeys: readonly string[] }
  ) {
    return this.hasAnyCapability(
      capabilityScopes,
      rule.capabilityKeys as readonly PerformanceCapabilityKey[]
    );
  }

  private applyLegacyCapabilityScopeRules(
    scopes: PerformanceResolvedAccessContext['capabilityScopes'],
    perms: string[],
    rules: readonly PerformanceLegacyCapabilityScopeRule[],
    scopePresets: Record<
      PerformanceCapabilityScopePresetKey,
      PerformanceScopeKind[]
    >
  ) {
    for (const rule of rules) {
      if (
        rule.legacyPermissionAliases.some(alias =>
          this.hasPerm(
            perms,
            this.legacyPerms[alias as keyof typeof this.legacyPerms]
          )
        )
      ) {
        const resolvedScopes = scopePresets[rule.scopePreset];
        if (rule.requireNonEmptyScope && !resolvedScopes.length) {
          continue;
        }
        scopes[rule.capabilityKey as PerformanceCapabilityKey] =
          resolvedScopes;
      }
    }
  }

  private resolveWorkbenchPages(
    activePersonaKey: PerformancePersonaKey | null,
    perms: string[]
  ) {
    if (!activePersonaKey) {
      return [];
    }

    return PERFORMANCE_PERSONA_WORKBENCH_PAGES[activePersonaKey].filter(item =>
      this.isWorkbenchPageAllowed(item, perms)
    );
  }

  private isWorkbenchPageAllowed(
    pageId: PerformanceWorkbenchPageId,
    perms: string[]
  ) {
    return PERFORMANCE_WORKBENCH_PAGE_ACCESS_RULES[
      pageId
    ].legacyPermissionAliases.some(alias =>
      this.hasPerm(
        perms,
        this.legacyPerms[alias as keyof typeof this.legacyPerms]
      )
    );
  }
}
