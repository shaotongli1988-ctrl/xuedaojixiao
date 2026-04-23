/**
 * 目标运营台后端领域服务。
 * 这里只负责部门配置、周/月/日计划项、结果填报、自动补零、榜单汇总和日报记录主链，
 * 不负责旧版目标地图 CRUD、本地菜单 seed 或前端页面编排。
 * 维护重点是公共目标与个人补充目标的可解释拆分必须稳定，且不能破坏现有 goal API 兼容性。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceGoalOpsDepartmentConfigEntity } from '../entity/goal-ops-department-config';
import { PerformanceGoalOpsPlanEntity } from '../entity/goal-ops-plan';
import { PerformanceGoalOpsReportEntity } from '../entity/goal-ops-report';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  assertGoalOpsPeriod,
  assertGoalOpsSourceType,
  assertGoalOpsTime,
  buildGoalOpsDailyReportSummary,
  buildGoalOpsDepartmentSummary,
  buildGoalOpsLeaderboard,
  buildGoalOpsOverviewRows,
  calculateGoalOpsCompletionRate,
  GoalOpsPeriodType,
  GoalOpsSourceType,
  normalizeGoalOpsNumber,
} from './goal-operations-helper';
import { GOAL_REPORT_STATUS_VALUES } from './goal-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

const DEFAULT_CONFIG = {
  assignTime: '09:00',
  submitDeadline: '18:00',
  reportSendTime: '18:30',
  reportPushMode: 'system_and_group',
  reportPushTarget: null,
};
const PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound
  );
const PERFORMANCE_GOAL_OPS_REPORT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsReportNotFound
  );
const PERFORMANCE_GOAL_TITLE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalTitleRequired
  );
const PERFORMANCE_TARGET_VALUE_POSITIVE_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.targetValuePositive
  );
const PERFORMANCE_GOAL_OPS_REPORT_DATE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsReportDateRequired
  );
const PERFORMANCE_GOAL_OPS_AUTO_ZERO_DATE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsAutoZeroDateRequired
  );
const PERFORMANCE_GOAL_OPS_QUERY_DATE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsQueryDateRequired
  );
const PERFORMANCE_GOAL_OPS_RESULT_SUBMIT_STATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalOpsResultSubmitStateDenied
  );

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceGoalOperationsService extends BaseService {
  @InjectEntityModel(PerformanceGoalOpsDepartmentConfigEntity)
  performanceGoalOpsDepartmentConfigEntity: Repository<PerformanceGoalOpsDepartmentConfigEntity>;

  @InjectEntityModel(PerformanceGoalOpsPlanEntity)
  performanceGoalOpsPlanEntity: Repository<PerformanceGoalOpsPlanEntity>;

  @InjectEntityModel(PerformanceGoalOpsReportEntity)
  performanceGoalOpsReportEntity: Repository<PerformanceGoalOpsReportEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  ctx;

  private readonly perms = {
    page: PERMISSIONS.performance.goal.page,
    info: PERMISSIONS.performance.goal.info,
    add: PERMISSIONS.performance.goal.add,
    update: PERMISSIONS.performance.goal.update,
    delete: PERMISSIONS.performance.goal.delete,
    progressUpdate: PERMISSIONS.performance.goal.progressUpdate,
    opsManage: PERMISSIONS.performance.goal.opsManage,
    opsGlobalScope: PERMISSIONS.performance.goal.opsGlobalScope,
    export: PERMISSIONS.performance.goal.export,
  };

  private readonly managerPerms = [PERMISSIONS.performance.goal.opsManage];

  private get currentCtx() {
    return this.ctx || {};
  }

  private get currentAdmin() {
    return this.currentCtx.admin || {};
  }

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.goal.page]: 'goal.ops.read',
    [PERMISSIONS.performance.goal.info]: 'goal.ops.read',
    [PERMISSIONS.performance.goal.add]: 'goal.create',
    [PERMISSIONS.performance.goal.update]: 'goal.ops.personal_write',
    [PERMISSIONS.performance.goal.progressUpdate]: 'goal.ops.personal_write',
    [PERMISSIONS.performance.goal.opsManage]: 'goal.ops.manage',
    [PERMISSIONS.performance.goal.opsGlobalScope]: 'goal.ops.global',
    [PERMISSIONS.performance.goal.export]: 'goal.export',
  };

  async getDepartmentConfig(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.page, '无权限查看目标运营台配置');
    const departmentId = await this.resolveTargetDepartmentId(
      Number(query?.departmentId)
    );

    if (!this.isHr(perms)) {
      this.assertCanManageDepartment(departmentId, perms);
    }

    const config = await this.performanceGoalOpsDepartmentConfigEntity.findOneBy({
      departmentId,
    });
    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: departmentId,
    });

    return {
      departmentId,
      departmentName: department?.name || '',
      assignTime: config?.assignTime || DEFAULT_CONFIG.assignTime,
      submitDeadline: config?.submitDeadline || DEFAULT_CONFIG.submitDeadline,
      reportSendTime: config?.reportSendTime || DEFAULT_CONFIG.reportSendTime,
      reportPushMode: config?.reportPushMode || DEFAULT_CONFIG.reportPushMode,
      reportPushTarget: config?.reportPushTarget || DEFAULT_CONFIG.reportPushTarget,
      updatedBy: config?.updatedBy || null,
      updateTime: config?.updateTime || null,
    };
  }

  async accessProfile(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.page, '无权限查看目标运营台权限画像');
    const departmentId = await this.resolveTargetDepartmentId(
      Number(query?.departmentId)
    );
    const isHr = this.isHr(perms);
    const manageableDepartmentIds = Array.isArray(this.currentCtx.goalDepartmentIds)
      ? this.currentCtx.goalDepartmentIds.map(item => Number(item))
      : [];

    let canManageDepartment = false;
    try {
      this.assertCanManageDepartment(departmentId, perms);
      canManageDepartment = true;
    } catch (error) {
      canManageDepartment = false;
    }
    const activePersonaKey =
      perms.activePersonaKey ||
      (isHr
        ? 'org.hrbp'
        : canManageDepartment
        ? 'org.line_manager'
        : 'org.employee');
    const roleKind =
      perms.roleKind && perms.roleKind !== 'unsupported'
        ? perms.roleKind
        : isHr
        ? 'hr'
        : canManageDepartment
        ? 'manager'
        : 'employee';

    return {
      departmentId,
      activePersonaKey,
      roleKind,
      scopeKey: isHr ? 'company' : canManageDepartment ? 'department' : 'self',
      isHr,
      canManageDepartment,
      canMaintainPersonalPlan:
        isHr ||
        this.hasAnyPerm(perms, [this.perms.update, this.perms.progressUpdate]),
      manageableDepartmentIds,
    };
  }

  async saveDepartmentConfig(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasAnyPerm(
      perms,
      [this.perms.add, this.perms.update],
      '无权限维护目标运营台配置'
    );

    const departmentId = await this.resolveTargetDepartmentId(
      Number(payload?.departmentId)
    );
    this.assertCanManageDepartment(departmentId, perms);

    const assignTime = assertGoalOpsTime(
      payload?.assignTime || DEFAULT_CONFIG.assignTime,
      '日目标下发时间'
    );
    const submitDeadline = assertGoalOpsTime(
      payload?.submitDeadline || DEFAULT_CONFIG.submitDeadline,
      '结果填报截止时间'
    );
    const reportSendTime = assertGoalOpsTime(
      payload?.reportSendTime || DEFAULT_CONFIG.reportSendTime,
      '日报发送时间'
    );

    const pushMode = String(
      payload?.reportPushMode || DEFAULT_CONFIG.reportPushMode
    ).trim();
    const pushTarget = String(payload?.reportPushTarget || '').trim() || null;

    const current = await this.performanceGoalOpsDepartmentConfigEntity.findOneBy({
      departmentId,
    });

    if (current) {
      await this.performanceGoalOpsDepartmentConfigEntity.update(
        { id: current.id },
        {
          assignTime,
          submitDeadline,
          reportSendTime,
          reportPushMode: pushMode,
          reportPushTarget: pushTarget,
          updatedBy: this.currentAdmin.userId,
        }
      );
    } else {
      await this.performanceGoalOpsDepartmentConfigEntity.save(
        this.performanceGoalOpsDepartmentConfigEntity.create({
          departmentId,
          assignTime,
          submitDeadline,
          reportSendTime,
          reportPushMode: pushMode,
          reportPushTarget: pushTarget,
          updatedBy: this.currentAdmin.userId,
        })
      );
    }

    return this.getDepartmentConfig({ departmentId });
  }

  async pagePlans(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.page, '无权限查看目标运营台计划');

    const page = this.normalizePageNumber(query?.page, 1);
    const size = this.normalizePageNumber(query?.size, 20);
    const plans = await this.findScopedPlans(query, perms);
    const total = plans.length;
    const users = await this.loadUserMap(plans.map(item => Number(item.employeeId)));
    const departments = await this.loadDepartmentMap(
      plans.map(item => Number(item.departmentId))
    );
    const list = plans.slice((page - 1) * size, page * size).map(item => {
      return this.normalizePlanRow(item, users, departments);
    });

    return {
      list,
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async savePlan(payload: any) {
    const perms = await this.currentPerms();
    const current = payload?.id
      ? await this.performanceGoalOpsPlanEntity.findOneBy({
          id: Number(payload.id),
        })
      : null;
    const mode = current ? 'update' : 'add';
    const normalized = await this.normalizePlanPayload(payload, current);

    const actionLabel = mode === 'add' ? '创建' : '修改';
    if (current && String(current.sourceType) !== String(normalized.sourceType)) {
      throw new CoolCommException('不允许修改目标来源');
    }

    if (normalized.sourceType === 'public') {
      this.assertHasAnyPerm(
        perms,
        [this.perms.add, this.perms.update],
        `无权限${actionLabel}公共目标`
      );
      this.assertCanManageDepartment(normalized.departmentId, perms);
    } else if (!this.isHr(perms)) {
      this.assertCanMaintainPersonalPlan(normalized.employeeId, perms);
    }

    if (!current) {
      const saved = await this.performanceGoalOpsPlanEntity.save(
        this.performanceGoalOpsPlanEntity.create(normalized)
      );
      return this.infoPlan(Number(saved.id));
    }

    await this.performanceGoalOpsPlanEntity.update(
      { id: current.id },
      {
        ...normalized,
        actualValue: normalizeGoalOpsNumber(current.actualValue),
        submittedBy: current.submittedBy,
        submittedAt: current.submittedAt,
        status: current.status,
      }
    );

    return this.infoPlan(Number(current.id));
  }

  async infoPlan(id: number) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.info, '无权限查看目标运营台计划详情');

    const plan = await this.requirePlan(id);
    this.assertCanViewPlan(plan, perms);

    const users = await this.loadUserMap([Number(plan.employeeId)]);
    const departments = await this.loadDepartmentMap([Number(plan.departmentId)]);

    return this.normalizePlanRow(plan, users, departments);
  }

  async deletePlans(ids: number[]) {
    const perms = await this.currentPerms();
    const validIds = this.normalizeIds(ids);
    if (validIds.length === 0) {
      return;
    }

    for (const id of validIds) {
      const plan = await this.requirePlan(id);
      if (plan.sourceType === 'personal' && !this.isHr(perms)) {
        this.assertCanMaintainPersonalPlan(Number(plan.employeeId), perms);
      } else {
        this.assertHasAnyPerm(
          perms,
          [this.perms.delete, this.perms.update],
          '无权限删除目标运营台计划'
        );
        this.assertCanManageDepartment(Number(plan.departmentId), perms);
      }
    }

    await this.performanceGoalOpsPlanEntity.delete(validIds);
  }

  async submitDailyResults(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasAnyPerm(
      perms,
      [this.perms.progressUpdate, this.perms.update],
      '无权限填报目标结果'
    );

    const planDate = String(payload?.planDate || '').trim();
    if (!planDate) {
      throw new CoolCommException('填报日期不能为空');
    }

    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (!items.length) {
      throw new CoolCommException('填报数据不能为空');
    }

    for (const item of items) {
      const plan = await this.requirePlan(Number(item.planId));
      if (plan.periodType !== 'day') {
        throw new CoolCommException('只有日目标允许填报结果');
      }
      if (String(plan.planDate || '') !== planDate) {
        throw new CoolCommException('计划日期与填报日期不一致');
      }

      this.assertCanSubmitPlan(plan, perms);
      if (plan.status !== 'assigned') {
        throw new CoolCommException(
          PERFORMANCE_GOAL_OPS_RESULT_SUBMIT_STATE_DENIED_MESSAGE
        );
      }

      const actualValue = normalizeGoalOpsNumber(item.actualValue);
      if (actualValue < 0) {
        throw new CoolCommException('实际值不能小于 0');
      }

      await this.performanceGoalOpsPlanEntity.update(
        { id: plan.id },
        {
          actualValue,
          status: 'submitted',
          submittedBy: this.currentAdmin.userId,
          submittedAt: this.nowDateTime(),
        }
      );
    }

    return this.overview({
      planDate,
      departmentId: payload?.departmentId,
    });
  }

  async finalizeDailyMissing(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasAnyPerm(
      perms,
      [this.perms.update, this.perms.export],
      '无权限执行自动补零'
    );

    const departmentId = await this.resolveTargetDepartmentId(
      Number(payload?.departmentId)
    );
    this.assertCanManageDepartment(departmentId, perms);

    const planDate = String(payload?.planDate || '').trim();
    if (!planDate) {
      throw new CoolCommException(
        PERFORMANCE_GOAL_OPS_AUTO_ZERO_DATE_REQUIRED_MESSAGE
      );
    }

    const plans = await this.performanceGoalOpsPlanEntity.find({
      where: {
        departmentId,
        periodType: 'day',
        planDate,
      } as any,
      order: { id: 'ASC' } as any,
    });

    const pendingPlans = plans.filter(item => item.status === 'assigned');

    for (const plan of pendingPlans) {
      await this.performanceGoalOpsPlanEntity.update(
        { id: plan.id },
        {
          actualValue: 0,
          status: 'auto_zero',
          submittedBy: this.currentAdmin.userId,
          submittedAt: this.nowDateTime(),
        }
      );
    }

    return {
      departmentId,
      planDate,
      autoZeroCount: pendingPlans.length,
    };
  }

  async overview(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.page, '无权限查看目标运营台总览');

    const planDate = String(query?.planDate || '').trim();
    if (!planDate) {
      throw new CoolCommException(PERFORMANCE_GOAL_OPS_QUERY_DATE_REQUIRED_MESSAGE);
    }

    const plans = await this.findScopedPlans(
      {
        ...query,
        planDate,
        periodType: 'day',
      },
      perms
    );

    const users = await this.loadUserMap(plans.map(item => Number(item.employeeId)));
    const normalizedPlans = plans.map(item => {
      return {
        id: Number(item.id),
        employeeId: Number(item.employeeId),
        employeeName: users.get(Number(item.employeeId))?.name || '',
        departmentId: Number(item.departmentId),
        planDate: item.planDate,
        periodType: item.periodType as GoalOpsPeriodType,
        sourceType: item.sourceType as GoalOpsSourceType,
        title: item.title,
        targetValue: normalizeGoalOpsNumber(item.targetValue),
        actualValue: normalizeGoalOpsNumber(item.actualValue),
        status: item.status as any,
      };
    });

    const rows = buildGoalOpsOverviewRows(normalizedPlans);
    const requestedDepartmentId = query?.departmentId
      ? Number(query.departmentId)
      : rows[0]?.departmentId || null;
    const leaderboard = buildGoalOpsLeaderboard(rows);
    const departmentSummary = buildGoalOpsDepartmentSummary(
      planDate,
      Number(requestedDepartmentId || 0),
      rows
    );

    return {
      planDate,
      departmentId: requestedDepartmentId,
      departmentSummary,
      leaderboard,
      rows,
    };
  }

  async generateDailyReport(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasAnyPerm(
      perms,
      [this.perms.export, this.perms.update],
      '无权限生成部门日报'
    );

    const departmentId = await this.resolveTargetDepartmentId(
      Number(payload?.departmentId)
    );
    this.assertCanManageDepartment(departmentId, perms);

    const planDate = String(payload?.planDate || '').trim();
    if (!planDate) {
      throw new CoolCommException(PERFORMANCE_GOAL_OPS_REPORT_DATE_REQUIRED_MESSAGE);
    }

    await this.finalizeDailyMissing({
      departmentId,
      planDate,
    });

    const overview = await this.overview({
      departmentId,
      planDate,
    });
    const summary = buildGoalOpsDailyReportSummary(
      planDate,
      departmentId,
      overview.rows
    );
    const config = await this.getDepartmentConfig({ departmentId });
    const current = await this.performanceGoalOpsReportEntity.findOneBy({
      departmentId,
      reportDate: planDate,
    });
    const now = this.nowDateTime();
    const nextPayload = {
      departmentId,
      reportDate: planDate,
      status: 'generated',
      summaryJson: JSON.stringify(summary),
      generatedAt: now,
      sentAt: null,
      pushMode: String(config.reportPushMode || DEFAULT_CONFIG.reportPushMode),
      pushTarget: config.reportPushTarget || null,
      generatedBy: this.currentAdmin.userId,
      operatedBy: this.currentAdmin.userId,
      operationRemark: null,
    };

    if (current) {
      await this.performanceGoalOpsReportEntity.update(
        { id: current.id },
        nextPayload
      );
    } else {
      await this.performanceGoalOpsReportEntity.save(
        this.performanceGoalOpsReportEntity.create(nextPayload)
      );
    }

    return this.reportInfo({
      departmentId,
      reportDate: planDate,
    });
  }

  async reportInfo(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.page, '无权限查看目标运营台日报');

    const departmentId = await this.resolveTargetDepartmentId(
      Number(query?.departmentId)
    );
    const reportDate = String(query?.reportDate || '').trim();
    if (!reportDate) {
      throw new CoolCommException(PERFORMANCE_GOAL_OPS_REPORT_DATE_REQUIRED_MESSAGE);
    }

    const report = await this.performanceGoalOpsReportEntity.findOneBy({
      departmentId,
      reportDate,
    });
    if (!report) {
      throw new CoolCommException(PERFORMANCE_GOAL_OPS_REPORT_NOT_FOUND_MESSAGE);
    }

    if (!this.isHr(perms)) {
      this.assertCanManageDepartment(departmentId, perms);
    }

    return {
      ...report,
      departmentId: Number(report.departmentId),
      generatedBy: report.generatedBy ? Number(report.generatedBy) : null,
      operatedBy: report.operatedBy ? Number(report.operatedBy) : null,
      summary: this.parseJson(report.summaryJson),
    };
  }

  async updateReportStatus(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasAnyPerm(
      perms,
      [this.perms.export, this.perms.update],
      '无权限更新日报状态'
    );

    const departmentId = await this.resolveTargetDepartmentId(
      Number(payload?.departmentId)
    );
    this.assertCanManageDepartment(departmentId, perms);

    const reportDate = String(payload?.reportDate || '').trim();
    if (!reportDate) {
      throw new CoolCommException(PERFORMANCE_GOAL_OPS_REPORT_DATE_REQUIRED_MESSAGE);
    }

    const nextStatus = String(payload?.status || '').trim();
    if (!GOAL_REPORT_STATUS_VALUES.some(item => item === nextStatus)) {
      throw new CoolCommException('日报状态不合法');
    }

    const report = await this.performanceGoalOpsReportEntity.findOneBy({
      departmentId,
      reportDate,
    });
    if (!report) {
      throw new CoolCommException(PERFORMANCE_GOAL_OPS_REPORT_NOT_FOUND_MESSAGE);
    }

    await this.performanceGoalOpsReportEntity.update(
      { id: report.id },
      {
        status: nextStatus,
        sentAt: nextStatus === 'sent' ? this.nowDateTime() : report.sentAt,
        operatedBy: this.currentAdmin.userId,
        operationRemark: String(payload?.remark || '').trim() || null,
      }
    );

    return this.reportInfo({
      departmentId,
      reportDate,
    });
  }

  private async normalizePlanPayload(
    payload: any,
    current?: PerformanceGoalOpsPlanEntity | null
  ) {
    const employeeId = Number(payload?.employeeId || current?.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      throw new CoolCommException('员工ID不能为空');
    }

    const departmentId = await this.resolvePlanDepartmentId(
      employeeId,
      Number(payload?.departmentId || current?.departmentId)
    );
    const sourceType = String(
      payload?.sourceType || current?.sourceType || 'public'
    ).trim() as GoalOpsSourceType;
    assertGoalOpsSourceType(sourceType);

    const periodType = String(
      payload?.periodType || current?.periodType || 'day'
    ).trim() as GoalOpsPeriodType;
    const periodStartDate = String(
      payload?.periodStartDate || current?.periodStartDate || ''
    ).trim();
    const periodEndDate = String(
      payload?.periodEndDate || current?.periodEndDate || ''
    ).trim();
    const planDate =
      payload?.planDate !== undefined
        ? String(payload?.planDate || '').trim() || null
        : current?.planDate || null;
    assertGoalOpsPeriod(periodType, periodStartDate, periodEndDate, planDate);

    const title = String(payload?.title || current?.title || '').trim();
    if (!title) {
      throw new CoolCommException(PERFORMANCE_GOAL_TITLE_REQUIRED_MESSAGE);
    }

    const targetValue = normalizeGoalOpsNumber(
      payload?.targetValue ?? current?.targetValue
    );
    if (targetValue <= 0) {
      throw new CoolCommException(PERFORMANCE_TARGET_VALUE_POSITIVE_MESSAGE);
    }

    const unit =
      payload?.unit !== undefined
        ? String(payload?.unit || '').trim() || null
        : current?.unit || null;
    const description =
      payload?.description !== undefined
        ? String(payload?.description || '').trim() || null
        : current?.description || null;
    const parentPlanId =
      payload?.parentPlanId !== undefined
        ? Number(payload?.parentPlanId) || null
        : current?.parentPlanId || null;
    const isSystemGenerated =
      payload?.isSystemGenerated !== undefined
        ? Number(Boolean(payload?.isSystemGenerated))
        : current?.isSystemGenerated || 0;

    return {
      departmentId,
      employeeId,
      periodType,
      planDate,
      periodStartDate,
      periodEndDate,
      sourceType,
      title,
      description,
      targetValue,
      actualValue: normalizeGoalOpsNumber(current?.actualValue || 0),
      unit,
      status: current?.status || 'assigned',
      parentPlanId,
      isSystemGenerated,
      assignedBy: current?.assignedBy || this.currentAdmin.userId,
      submittedBy: current?.submittedBy || null,
      submittedAt: current?.submittedAt || null,
      extJson: current?.extJson || null,
    };
  }

  private async findScopedPlans(
    query: any,
    perms: PerformanceResolvedAccessContext
  ) {
    const repositoryQuery: any = {};

    if (query?.periodType) {
      repositoryQuery.periodType = String(query.periodType).trim();
    }

    if (query?.departmentId) {
      repositoryQuery.departmentId = Number(query.departmentId);
    }

    if (query?.employeeId) {
      repositoryQuery.employeeId = Number(query.employeeId);
    }

    if (query?.planDate) {
      repositoryQuery.planDate = String(query.planDate).trim();
    }

    if (query?.sourceType) {
      repositoryQuery.sourceType = String(query.sourceType).trim();
    }

    const plans = await this.performanceGoalOpsPlanEntity.find({
      where: repositoryQuery,
      order: {
        planDate: 'DESC',
        updateTime: 'DESC',
        id: 'DESC',
      } as any,
    });

    return plans.filter(item => {
      if (query?.keyword) {
        const keyword = String(query.keyword).trim().toLowerCase();
        if (!String(item.title || '').toLowerCase().includes(keyword)) {
          return false;
        }
      }

      if (query?.periodStartDate && item.periodStartDate < query.periodStartDate) {
        return false;
      }

      if (query?.periodEndDate && item.periodEndDate > query.periodEndDate) {
        return false;
      }

      return this.canViewPlan(item, perms);
    });
  }

  private normalizePlanRow(
    plan: PerformanceGoalOpsPlanEntity,
    users: Map<number, BaseSysUserEntity>,
    departments: Map<number, BaseSysDepartmentEntity>
  ) {
    return {
      ...plan,
      id: Number(plan.id),
      departmentId: Number(plan.departmentId),
      departmentName: departments.get(Number(plan.departmentId))?.name || '',
      employeeId: Number(plan.employeeId),
      employeeName: users.get(Number(plan.employeeId))?.name || '',
      targetValue: normalizeGoalOpsNumber(plan.targetValue),
      actualValue: normalizeGoalOpsNumber(plan.actualValue),
      completionRate: calculateGoalOpsCompletionRate(
        Number(plan.actualValue || 0),
        Number(plan.targetValue || 0)
      ),
      isSystemGenerated: Boolean(Number(plan.isSystemGenerated || 0)),
    };
  }

  private async requirePlan(id: number) {
    const plan = await this.performanceGoalOpsPlanEntity.findOneBy({ id });
    if (!plan) {
      throw new CoolCommException('目标计划不存在');
    }
    return plan;
  }

  private canViewPlan(
    plan: PerformanceGoalOpsPlanEntity,
    perms: PerformanceResolvedAccessContext
  ) {
    if (this.isHr(perms)) {
      return true;
    }

    const currentUserId = Number(this.currentAdmin.userId);
    if (Number(plan.employeeId) === currentUserId) {
      return true;
    }

    const departmentIds = this.currentCtx.goalDepartmentIds || [];
    return departmentIds.includes(Number(plan.departmentId));
  }

  private assertCanViewPlan(
    plan: PerformanceGoalOpsPlanEntity,
    perms: PerformanceResolvedAccessContext
  ) {
    if (!this.canViewPlan(plan, perms)) {
      throw new CoolCommException('无权查看该目标计划');
    }
  }

  private assertCanSubmitPlan(
    plan: PerformanceGoalOpsPlanEntity,
    perms: PerformanceResolvedAccessContext
  ) {
    if (this.isHr(perms)) {
      return;
    }

    const currentUserId = Number(this.currentAdmin.userId);
    if (Number(plan.employeeId) === currentUserId) {
      return;
    }

    this.assertCanManageDepartment(Number(plan.departmentId), perms);
  }

  private assertCanMaintainPersonalPlan(
    employeeId: number,
    perms: PerformanceResolvedAccessContext
  ) {
    if (this.isHr(perms)) {
      return;
    }

    if (!this.hasAnyPerm(perms, [this.perms.update, this.perms.progressUpdate])) {
      throw new CoolCommException('无权限维护个人补充目标');
    }

    if (Number(this.currentAdmin.userId) !== Number(employeeId)) {
      throw new CoolCommException('只能维护自己的个人补充目标');
    }
  }

  private async resolvePlanDepartmentId(employeeId: number, departmentId?: number) {
    if (departmentId) {
      return departmentId;
    }

    const user = await this.baseSysUserEntity.findOneBy({ id: employeeId });
    if (!user?.departmentId) {
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE);
    }

    return Number(user.departmentId);
  }

  private async resolveTargetDepartmentId(requestedDepartmentId?: number) {
    if (requestedDepartmentId && requestedDepartmentId > 0) {
      return requestedDepartmentId;
    }

    const departmentIds = await this.departmentScopeIds();
    if (departmentIds.length > 0) {
      return Number(departmentIds[0]);
    }

    const currentUser = await this.baseSysUserEntity.findOneBy({
      id: Number(this.currentAdmin.userId),
    });
    if (!currentUser?.departmentId) {
      throw new CoolCommException('当前账号未关联部门');
    }
    return Number(currentUser.departmentId);
  }

  private normalizePageNumber(value: any, fallback: number) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private normalizeIds(value: any) {
    const list = Array.isArray(value) ? value : [value];
    return Array.from(
      new Set(
        list
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );
  }

  private nowDateTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  private parseJson(value: any) {
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(String(value));
    } catch (error) {
      return null;
    }
  }

  private async loadUserMap(userIds: number[]) {
    const uniqueIds = this.normalizeIds(userIds);
    const users = uniqueIds.length
      ? await this.baseSysUserEntity.findBy({ id: In(uniqueIds) } as any)
      : [];
    return new Map(users.map(item => [Number(item.id), item]));
  }

  private async loadDepartmentMap(departmentIds: number[]) {
    const uniqueIds = this.normalizeIds(departmentIds);
    const departments = uniqueIds.length
      ? await this.baseSysDepartmentEntity.findBy({ id: In(uniqueIds) } as any)
      : [];
    return new Map(departments.map(item => [Number(item.id), item]));
  }

  private async currentPerms() {
    const access = await this.performanceAccessContextService.resolveAccessContext(
      undefined,
      {
        allowEmptyRoleIds: false,
        missingAuthMessage: '登录状态已失效',
      }
    );
    this.currentCtx.goalDepartmentIds = Array.from(
      new Set(
        (Array.isArray(access.departmentIds) ? access.departmentIds : [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );
    this.currentCtx.goalIsHr = this.performanceAccessContextService.hasCapabilityInScopes(
      access,
      'goal.ops.global',
      ['company']
    );
    if (!this.currentCtx.admin) {
      this.currentCtx.admin = { userId: access.userId };
    } else if (!this.currentCtx.admin.userId) {
      this.currentCtx.admin.userId = access.userId;
    }
    return access;
  }

  private resolveCapabilityKey(perm: string): PerformanceCapabilityKey {
    const capabilityKey = this.capabilityByPerm[perm];
    if (!capabilityKey) {
      throw new CoolCommException(`未映射的目标运营台权限: ${perm}`);
    }
    return capabilityKey;
  }

  private hasPerm(access: PerformanceResolvedAccessContext, perm: string) {
    return this.performanceAccessContextService.hasCapability(
      access,
      this.resolveCapabilityKey(perm)
    );
  }

  private hasAnyPerm(
    access: PerformanceResolvedAccessContext,
    expectedPerms: string[]
  ) {
    return expectedPerms.some(item => this.hasPerm(access, item));
  }

  private assertHasPerm(
    access: PerformanceResolvedAccessContext,
    perm: string,
    message: string
  ) {
    if (!this.hasPerm(access, perm)) {
      throw new CoolCommException(message);
    }
  }

  private assertHasAnyPerm(
    access: PerformanceResolvedAccessContext,
    expectedPerms: string[],
    message: string
  ) {
    if (!this.hasAnyPerm(access, expectedPerms)) {
      throw new CoolCommException(message);
    }
  }

  private isHr(_access: PerformanceResolvedAccessContext) {
    return this.currentCtx.goalIsHr === true;
  }

  private async departmentScopeIds() {
    return Array.isArray(this.currentCtx.goalDepartmentIds)
      ? this.currentCtx.goalDepartmentIds.map(item => Number(item))
      : [];
  }

  async initGoalScope() {
    return this.currentPerms();
  }

  private assertCanManageDepartment(
    departmentId: number,
    perms: PerformanceResolvedAccessContext
  ) {
    if (this.isHr(perms)) {
      return;
    }

    if (!this.hasAnyPerm(perms, this.managerPerms)) {
      throw new CoolCommException('仅主管或 HR 可管理部门目标运营台数据');
    }

    const departmentIds = this.currentCtx.goalDepartmentIds || [];
    if (!departmentIds.includes(Number(departmentId))) {
      throw new CoolCommException('无权管理该部门目标运营台数据');
    }
  }

  private async resolveGoalOpsHrRole() {
    const access = await this.currentPerms();
    return this.isHr(access);
  }
}
