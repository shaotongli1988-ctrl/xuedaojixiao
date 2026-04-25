/**
 * 工作计划领域服务。
 * 这里只负责工作计划主链、执行状态和钉钉审批来源承接，不负责真实钉钉鉴权 SDK、消息通知或复杂工时拆单。
 * 维护重点是来源审批状态与执行状态分离、部门范围与参与人范围硬兜底，以及外部审批同步只能做幂等 upsert。
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
import { In, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceWorkPlanEntity } from '../entity/workPlan';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  hasPermissionKey,
  isSuperAdminPermission,
} from '../../base/service/sys/permission-ssot';
import {
  WORK_PLAN_PRIORITY_VALUES,
  WORK_PLAN_SOURCE_STATUS_VALUES,
  WORK_PLAN_SOURCE_TYPE_VALUES,
  WORK_PLAN_STATUS_VALUES,
} from './work-plan-dict';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
  resolvePerformanceCurrentAdmin,
  resolvePerformanceRuntimeContext,
} from './access-context';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';

type WorkPlanStatus = (typeof WORK_PLAN_STATUS_VALUES)[number];
type WorkPlanPriority = (typeof WORK_PLAN_PRIORITY_VALUES)[number];
type WorkPlanSourceType = (typeof WORK_PLAN_SOURCE_TYPE_VALUES)[number];
type WorkPlanSourceStatus = (typeof WORK_PLAN_SOURCE_STATUS_VALUES)[number];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const PERFORMANCE_OWNER_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.ownerRequired
  );
const PERFORMANCE_SOURCE_TYPE_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.sourceTypeInvalid
  );

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

function formatDateTime(input: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    input.getFullYear(),
    '-',
    pad(input.getMonth() + 1),
    '-',
    pad(input.getDate()),
    ' ',
    pad(input.getHours()),
    ':',
    pad(input.getMinutes()),
    ':',
    pad(input.getSeconds()),
  ].join('');
}

function normalizePageNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeRequiredText(value: any, maxLength: number, message: string) {
  const text = String(value || '').trim();
  if (!text || text.length > maxLength) {
    throw new CoolCommException(message);
  }
  return text;
}

function normalizeOptionalText(value: any, maxLength: number) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeRequiredPositiveInt(value: any, message: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(message);
  }
  return parsed;
}

function normalizeOptionalPositiveInt(value: any, message: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(message);
  }
  return parsed;
}

function normalizeOptionalDate(value: any, message: string) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  if (!DATE_PATTERN.test(text)) {
    throw new CoolCommException(message);
  }
  return text;
}

function normalizeOptionalDateTime(value: any, message: string) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  if (!DATETIME_PATTERN.test(text)) {
    throw new CoolCommException(message);
  }
  return text;
}

function assertDateRange(
  startDate: string | null,
  endDate: string | null,
  message: string
) {
  if (startDate && endDate && startDate > endDate) {
    throw new CoolCommException(message);
  }
}

function normalizeJsonObject(value: any) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  return typeof value === 'object' ? value : null;
}

function uniquePositiveIntList(values: any[]) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    )
  );
}

function normalizeAssigneeIds(value: any) {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return uniquePositiveIntList(value);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? uniquePositiveIntList(parsed) : [];
    } catch (error) {
      return uniquePositiveIntList(String(value).split(','));
    }
  }

  return [];
}

function normalizeWorkPlanStatus(value: any, fallback: WorkPlanStatus = 'draft') {
  const text = String(value || '').trim() as WorkPlanStatus;
  if (!text) {
    return fallback;
  }
  if (!WORK_PLAN_STATUS_VALUES.includes(text)) {
    throw new CoolCommException('工作计划状态不合法');
  }
  return text;
}

function normalizeWorkPlanPriority(
  value: any,
  fallback: WorkPlanPriority = 'medium'
) {
  const text = String(value || '').trim() as WorkPlanPriority;
  if (!text) {
    return fallback;
  }
  if (!WORK_PLAN_PRIORITY_VALUES.includes(text)) {
    throw new CoolCommException('优先级不合法');
  }
  return text;
}

function normalizeWorkPlanSourceType(
  value: any,
  fallback: WorkPlanSourceType = 'manual'
) {
  const text = String(value || '').trim() as WorkPlanSourceType;
  if (!text) {
    return fallback;
  }
  if (!WORK_PLAN_SOURCE_TYPE_VALUES.includes(text)) {
    throw new CoolCommException(PERFORMANCE_SOURCE_TYPE_INVALID_MESSAGE);
  }
  return text;
}

function mapRawSourceStatus(value: any): WorkPlanSourceStatus {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return 'processing';
  }

  if (
    [
      'processing',
      'pending',
      'running',
      'new',
      'wait',
      'waiting',
      '审批中',
      '进行中',
    ].includes(normalized)
  ) {
    return 'processing';
  }

  if (
    [
      'approved',
      'agree',
      'agreed',
      'pass',
      'passed',
      'completed',
      'finish',
      'finished',
      '通过',
      '已通过',
    ].includes(normalized)
  ) {
    return 'approved';
  }

  if (
    ['rejected', 'refused', 'deny', 'denied', '驳回', '拒绝', '未通过'].includes(
      normalized
    )
  ) {
    return 'rejected';
  }

  if (
    ['withdrawn', 'withdraw', 'cancelled', 'canceled', '撤回', '撤销', '取消'].includes(
      normalized
    )
  ) {
    return 'withdrawn';
  }

  if (['terminated', 'stopped', '终止', '已终止'].includes(normalized)) {
    return 'terminated';
  }

  if (WORK_PLAN_SOURCE_STATUS_VALUES.includes(normalized as WorkPlanSourceStatus)) {
    return normalized as WorkPlanSourceStatus;
  }

  throw new CoolCommException('来源审批状态不合法');
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceWorkPlanService extends BaseService {
  @InjectEntityModel(PerformanceWorkPlanEntity)
  performanceWorkPlanEntity: Repository<PerformanceWorkPlanEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private get currentCtx() {
    return resolvePerformanceRuntimeContext({
      ctx: this.ctx,
      app: this.app,
    });
  }

  private get currentAdmin() {
    return resolvePerformanceCurrentAdmin({
      ctx: this.ctx,
      app: this.app,
    });
  }

  async page(query: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'workplan.read', '无权限查看工作计划');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const rows = await this.filterScopedRows(
      await this.performanceWorkPlanEntity.find(),
      access
    );
    const keyword = String(query.keyword || '').trim().toLowerCase();
    let filtered = rows;

    if (keyword) {
      filtered = filtered.filter(item =>
        [
          item.workNo,
          item.title,
          item.sourceTitle,
          item.externalInstanceId,
          item.sourceBizId,
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(keyword))
      );
    }

    if (query.status) {
      filtered = filtered.filter(item => item.status === String(query.status).trim());
    }

    if (query.sourceStatus) {
      filtered = filtered.filter(
        item => item.sourceStatus === String(query.sourceStatus).trim()
      );
    }

    if (query.departmentId) {
      filtered = filtered.filter(
        item => Number(item.ownerDepartmentId) === Number(query.departmentId)
      );
    }

    if (query.ownerId) {
      filtered = filtered.filter(item => Number(item.ownerId) === Number(query.ownerId));
    }

    if (query.assigneeId) {
      filtered = filtered.filter(item =>
        this.hasAssignee(item, Number(query.assigneeId))
      );
    }

    filtered.sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')));
    const list = await this.normalizeRows(filtered);
    const start = (page - 1) * size;

    return {
      list: list.slice(start, start + size),
      pagination: {
        page,
        size,
        total: list.length,
      },
    };
  }

  async info(id: number) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'workplan.read', '无权限查看工作计划详情');
    const current = await this.requireWorkPlan(id);
    await this.assertReadable(current, access, '无权查看该工作计划');
    const list = await this.normalizeRows([current]);
    return list[0];
  }

  async add(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'workplan.create', '无权限新增工作计划');
    const normalized = await this.normalizeUpsertPayload(
      payload,
      access,
      'workplan.create',
      'manual'
    );
    const saved = await this.performanceWorkPlanEntity.save(
      this.performanceWorkPlanEntity.create({
        ...normalized,
        workNo: await this.generateWorkNo(),
        sourceType: 'manual',
        sourceStatus: 'none',
        sourceBizType: null,
        sourceBizId: null,
        sourceTitle: null,
        externalInstanceId: null,
        externalProcessCode: null,
        approvalFinishedAt: null,
        sourceSnapshot: null,
      })
    );
    return this.info(saved.id);
  }

  async updateWorkPlan(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'workplan.update', '无权限编辑工作计划');
    const id = normalizeRequiredPositiveInt(payload.id, '工作计划不存在');
    const current = await this.requireWorkPlan(id);
    await this.assertManageable(
      current,
      access,
      'workplan.update',
      '无权编辑该工作计划'
    );

    if (['completed', 'cancelled'].includes(current.status)) {
      throw new CoolCommException('当前状态不允许编辑工作计划');
    }

    const normalized = await this.normalizeUpsertPayload(
      payload,
      access,
      'workplan.update',
      current.sourceType as WorkPlanSourceType,
      current
    );
    await this.performanceWorkPlanEntity.update({ id }, normalized);
    return this.info(id);
  }

  async delete(ids: number[]) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'workplan.delete', '无权限删除工作计划');
    for (const rawId of ids || []) {
      const id = normalizeRequiredPositiveInt(rawId, '工作计划不存在');
      const current = await this.requireWorkPlan(id);
      await this.assertManageable(
        current,
        access,
        'workplan.delete',
        '无权删除该工作计划'
      );
      if (!['draft', 'planned', 'cancelled'].includes(current.status)) {
        throw new CoolCommException('仅草稿、已计划或已取消的工作计划允许删除');
      }
      await this.performanceWorkPlanEntity.delete({ id } as any);
    }
  }

  async start(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'workplan.start', '无权限开始执行工作计划');
    const id = normalizeRequiredPositiveInt(payload.id, '工作计划不存在');
    const current = await this.requireWorkPlan(id);
    await this.assertExecutable(
      current,
      access,
      'workplan.start',
      '无权开始该工作计划'
    );

    if (!['draft', 'planned'].includes(current.status)) {
      throw new CoolCommException('当前状态不允许开始执行');
    }

    if (
      current.sourceType === 'dingtalkApproval' &&
      current.sourceStatus !== 'approved'
    ) {
      throw new CoolCommException('来源审批未通过，暂不能开始执行');
    }

    await this.performanceWorkPlanEntity.update(
      { id },
      {
        status: 'inProgress',
        startedAt: normalizeOptionalDateTime(payload.startedAt, '开始时间格式不正确') || formatDateTime(new Date()),
        progressSummary: normalizeOptionalText(
          payload.progressSummary ?? current.progressSummary,
          2000
        ),
      }
    );
    return this.info(id);
  }

  async complete(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'workplan.complete', '无权限完成工作计划');
    const id = normalizeRequiredPositiveInt(payload.id, '工作计划不存在');
    const current = await this.requireWorkPlan(id);
    await this.assertExecutable(
      current,
      access,
      'workplan.complete',
      '无权完成该工作计划'
    );

    if (current.status !== 'inProgress') {
      throw new CoolCommException('仅执行中的工作计划允许完成');
    }

    await this.performanceWorkPlanEntity.update(
      { id },
      {
        status: 'completed',
        completedAt: normalizeOptionalDateTime(payload.completedAt, '完成时间格式不正确') || formatDateTime(new Date()),
        resultSummary: normalizeOptionalText(
          payload.resultSummary ?? current.resultSummary,
          2000
        ),
      }
    );
    return this.info(id);
  }

  async cancel(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'workplan.cancel', '无权限取消工作计划');
    const id = normalizeRequiredPositiveInt(payload.id, '工作计划不存在');
    const current = await this.requireWorkPlan(id);
    await this.assertManageable(
      current,
      access,
      'workplan.cancel',
      '无权取消该工作计划'
    );

    if (current.status === 'completed') {
      throw new CoolCommException('已完成的工作计划不允许取消');
    }

    await this.performanceWorkPlanEntity.update(
      { id },
      {
        status: 'cancelled',
        progressSummary: normalizeOptionalText(
          payload.progressSummary ?? current.progressSummary,
          2000
        ),
      }
    );
    return this.info(id);
  }

  async syncDingtalkApproval(payload: any, options?: { bypassPerm?: boolean }) {
    let access: PerformanceResolvedAccessContext | null = null;
    if (options?.bypassPerm) {
      this.assertSyncToken(payload);
    } else {
      access = await this.performanceAccessContextService.resolveAccessContext();
      this.assertHasCapability(access, 'workplan.sync', '无权限同步钉钉审批来源');
    }

    const normalized = await this.normalizeSyncPayload(payload);
    const current = await this.findByExternalSource(normalized);

    if (!options?.bypassPerm && access) {
      const departmentId = current?.ownerDepartmentId || normalized.ownerDepartmentId;
      if (departmentId) {
        await this.assertDepartmentInScope(
          departmentId,
          access,
          'workplan.sync',
          '无权同步该工作计划来源'
        );
      }
    }

    const nextStatus = this.resolveStatusAfterSync(current?.status || 'draft', normalized.sourceStatus);
    const merged = {
      workNo: current?.workNo || (await this.generateWorkNo()),
      ownerDepartmentId: normalized.ownerDepartmentId ?? current?.ownerDepartmentId,
      ownerId: normalized.ownerId ?? current?.ownerId,
      title:
        normalized.title ||
        current?.title ||
        normalized.sourceTitle ||
        `${normalized.sourceBizType || 'proposal'}执行计划`,
      description: normalized.description ?? current?.description ?? null,
      assigneeIds:
        normalized.assigneeIds.length > 0
          ? normalized.assigneeIds
          : current?.assigneeIds || [],
      priority: normalized.priority || current?.priority || 'medium',
      plannedStartDate: normalized.plannedStartDate ?? current?.plannedStartDate ?? null,
      plannedEndDate: normalized.plannedEndDate ?? current?.plannedEndDate ?? null,
      startedAt: current?.startedAt || null,
      completedAt: current?.completedAt || null,
      status: nextStatus,
      progressSummary: normalized.progressSummary ?? current?.progressSummary ?? null,
      resultSummary: normalized.resultSummary ?? current?.resultSummary ?? null,
      sourceType: 'dingtalkApproval',
      sourceBizType: normalized.sourceBizType,
      sourceBizId: normalized.sourceBizId,
      sourceTitle: normalized.sourceTitle,
      sourceStatus: normalized.sourceStatus,
      externalInstanceId: normalized.externalInstanceId,
      externalProcessCode: normalized.externalProcessCode,
      approvalFinishedAt: normalized.approvalFinishedAt,
      sourceSnapshot: normalized.sourceSnapshot,
      tenantId: current?.tenantId ?? this.currentAdmin?.tenantId ?? null,
    };

    if (!merged.ownerDepartmentId || !merged.ownerId) {
      throw new CoolCommException('同步工作计划必须提供所属部门和负责人');
    }

    if (current?.id) {
      await this.performanceWorkPlanEntity.update({ id: current.id }, merged);
      if (options?.bypassPerm) {
        const updated = await this.requireWorkPlan(current.id);
        const list = await this.normalizeRows([updated]);
        return list[0];
      }
      return this.info(current.id);
    }

    const saved = await this.performanceWorkPlanEntity.save(
      this.performanceWorkPlanEntity.create(merged)
    );
    return this.normalizeRows([saved]).then(list => list[0]);
  }

  private assertSyncToken(payload: any) {
    const expected = normalizeOptionalText(
      process.env.WORK_PLAN_DINGTALK_SYNC_TOKEN,
      200
    );
    if (!expected) {
      throw new CoolCommException('未配置 WORK_PLAN_DINGTALK_SYNC_TOKEN');
    }

    const actual = normalizeOptionalText(
      payload?.syncToken ||
        this.currentCtx?.get?.('x-workplan-sync-token') ||
        this.currentCtx?.headers?.['x-workplan-sync-token'] ||
        this.currentCtx?.headers?.['x-sync-token'],
      200
    );

    if (!actual || actual !== expected) {
      throw new CoolCommException('工作计划来源同步令牌无效');
    }
  }

  private assertHasCapability(
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    if (!this.performanceAccessContextService.hasCapability(access, capabilityKey)) {
      throw new CoolCommException(message);
    }
  }

  private async assertDepartmentInScope(
    departmentId: number,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, capabilityKey),
        {
          departmentId: Number(departmentId),
        }
      )
    ) {
      return;
    }

    throw new CoolCommException(message);
  }

  private async filterScopedRows(
    rows: PerformanceWorkPlanEntity[],
    access: PerformanceResolvedAccessContext
  ) {
    return rows.filter(item => this.canReadItem(item, access));
  }

  private hasAssignee(item: PerformanceWorkPlanEntity, userId: number) {
    return normalizeAssigneeIds(item.assigneeIds).includes(Number(userId));
  }

  private async assertReadable(
    item: PerformanceWorkPlanEntity,
    access: PerformanceResolvedAccessContext,
    message: string
  ) {
    if (this.canReadItem(item, access)) {
      return;
    }

    throw new CoolCommException(message);
  }

  private async assertManageable(
    item: PerformanceWorkPlanEntity,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    await this.assertDepartmentInScope(
      item.ownerDepartmentId,
      access,
      capabilityKey,
      message
    );
  }

  private async assertExecutable(
    item: PerformanceWorkPlanEntity,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, capabilityKey),
        {
          subjectUserId: Number(item.ownerId),
          departmentId: Number(item.ownerDepartmentId),
        }
      )
    ) {
      return;
    }

    if (this.hasAssignee(item, access.userId)) {
      return;
    }

    throw new CoolCommException(message);
  }

  private canReadItem(
    item: PerformanceWorkPlanEntity,
    access: PerformanceResolvedAccessContext
  ) {
    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, 'workplan.read'),
        {
          subjectUserId: Number(item.ownerId),
          departmentId: Number(item.ownerDepartmentId),
        }
      )
    ) {
      return true;
    }

    return this.hasAssignee(item, access.userId);
  }

  private async requireWorkPlan(id: number) {
    const item = await this.performanceWorkPlanEntity.findOneBy({ id });
    if (!item) {
      throw new CoolCommException('工作计划不存在');
    }
    return item;
  }

  private async departmentMap(ids: number[]) {
    const rows = ids.length
      ? await this.baseSysDepartmentEntity.findBy({ id: In(ids) })
      : [];
    return new Map(rows.map(item => [Number(item.id), item]));
  }

  private async userMap(ids: number[]) {
    const rows = ids.length ? await this.baseSysUserEntity.findBy({ id: In(ids) }) : [];
    return new Map(rows.map(item => [Number(item.id), item]));
  }

  private async normalizeRows(rows: PerformanceWorkPlanEntity[]) {
    const departmentIds = uniquePositiveIntList(rows.map(item => item.ownerDepartmentId));
    const userIds = uniquePositiveIntList(
      rows.flatMap(item => [item.ownerId, ...normalizeAssigneeIds(item.assigneeIds)])
    );
    const [departmentMap, userMap] = await Promise.all([
      this.departmentMap(departmentIds),
      this.userMap(userIds),
    ]);

    return rows.map(item => {
      const assigneeIds = normalizeAssigneeIds(item.assigneeIds);
      const assigneeList = assigneeIds.map(id => ({
        id,
        name: userMap.get(Number(id))?.name || `用户${id}`,
      }));

      return {
        id: item.id,
        workNo: item.workNo,
        title: item.title,
        description: item.description || '',
        ownerDepartmentId: item.ownerDepartmentId,
        ownerDepartmentName:
          departmentMap.get(Number(item.ownerDepartmentId))?.name || '',
        ownerId: item.ownerId,
        ownerName: userMap.get(Number(item.ownerId))?.name || '',
        assigneeIds,
        assigneeList,
        assigneeNames: assigneeList.map(assignee => assignee.name),
        priority: item.priority,
        plannedStartDate: item.plannedStartDate || '',
        plannedEndDate: item.plannedEndDate || '',
        startedAt: item.startedAt || '',
        completedAt: item.completedAt || '',
        status: item.status,
        progressSummary: item.progressSummary || '',
        resultSummary: item.resultSummary || '',
        sourceType: item.sourceType,
        sourceBizType: item.sourceBizType || '',
        sourceBizId: item.sourceBizId || '',
        sourceTitle: item.sourceTitle || '',
        sourceStatus: item.sourceStatus,
        externalInstanceId: item.externalInstanceId || '',
        externalProcessCode: item.externalProcessCode || '',
        approvalFinishedAt: item.approvalFinishedAt || '',
        sourceSnapshot: normalizeJsonObject(item.sourceSnapshot),
        createTime: item.createTime,
        updateTime: item.updateTime,
      };
    });
  }

  private async normalizeUpsertPayload(
    payload: any,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    sourceType: WorkPlanSourceType,
    current?: PerformanceWorkPlanEntity
  ) {
    const ownerDepartmentId = normalizeRequiredPositiveInt(
      payload.ownerDepartmentId ?? current?.ownerDepartmentId,
      '所属部门不能为空'
    );
    await this.assertDepartmentInScope(
      ownerDepartmentId,
      access,
      capabilityKey,
      '无权操作该工作计划'
    );
    const ownerId = normalizeRequiredPositiveInt(
      payload.ownerId ?? current?.ownerId,
      PERFORMANCE_OWNER_REQUIRED_MESSAGE
    );
    const assigneeIds = normalizeAssigneeIds(payload.assigneeIds ?? current?.assigneeIds);
    const title = normalizeRequiredText(
      payload.title ?? current?.title,
      200,
      '工作计划标题不能为空且长度不能超过 200'
    );
    const plannedStartDate = normalizeOptionalDate(
      payload.plannedStartDate ?? current?.plannedStartDate,
      '计划开始日期格式不正确'
    );
    const plannedEndDate = normalizeOptionalDate(
      payload.plannedEndDate ?? current?.plannedEndDate,
      '计划结束日期格式不正确'
    );
    assertDateRange(plannedStartDate, plannedEndDate, '计划开始日期不能晚于结束日期');
    return {
      ownerDepartmentId,
      ownerId,
      title,
      description: normalizeOptionalText(payload.description ?? current?.description, 4000),
      assigneeIds,
      priority: normalizeWorkPlanPriority(payload.priority ?? current?.priority, 'medium'),
      plannedStartDate,
      plannedEndDate,
      progressSummary: normalizeOptionalText(
        payload.progressSummary ?? current?.progressSummary,
        2000
      ),
      resultSummary: normalizeOptionalText(
        payload.resultSummary ?? current?.resultSummary,
        2000
      ),
      sourceType: normalizeWorkPlanSourceType(sourceType, current?.sourceType as WorkPlanSourceType),
      tenantId: current?.tenantId ?? this.currentAdmin?.tenantId ?? null,
    };
  }

  private async normalizeSyncPayload(payload: any) {
    const sourceType = normalizeWorkPlanSourceType(
      payload.sourceType || 'dingtalkApproval',
      'dingtalkApproval'
    );
    if (sourceType !== 'dingtalkApproval') {
      throw new CoolCommException('当前仅支持钉钉审批来源同步');
    }

    const externalInstanceId = normalizeRequiredText(
      payload.externalInstanceId ?? payload.processInstanceId ?? payload.instanceId,
      100,
      '外部审批实例 ID 不能为空'
    );
    const sourceStatus = mapRawSourceStatus(
      payload.sourceStatus ?? payload.approvalStatus ?? payload.status ?? payload.result
    );

    const plannedStartDate = normalizeOptionalDate(
      payload.plannedStartDate,
      '计划开始日期格式不正确'
    );
    const plannedEndDate = normalizeOptionalDate(
      payload.plannedEndDate,
      '计划结束日期格式不正确'
    );
    assertDateRange(plannedStartDate, plannedEndDate, '计划开始日期不能晚于结束日期');

    return {
      sourceType,
      sourceBizType: normalizeOptionalText(
        payload.sourceBizType ?? payload.bizType ?? 'proposal',
        50
      ),
      sourceBizId: normalizeOptionalText(
        payload.sourceBizId ?? payload.bizId ?? payload.formBizId,
        100
      ),
      sourceTitle: normalizeOptionalText(
        payload.sourceTitle ?? payload.approvalTitle ?? payload.title,
        200
      ),
      externalInstanceId,
      externalProcessCode: normalizeOptionalText(
        payload.externalProcessCode ?? payload.processCode ?? payload.templateCode,
        100
      ),
      sourceStatus,
      approvalFinishedAt: normalizeOptionalDateTime(
        payload.approvalFinishedAt ?? payload.finishTime,
        '来源审批完成时间格式不正确'
      ),
      title: normalizeOptionalText(payload.planTitle ?? payload.title, 200),
      description: normalizeOptionalText(
        payload.planDescription ?? payload.description ?? payload.remark,
        4000
      ),
      ownerDepartmentId: normalizeOptionalPositiveInt(
        payload.ownerDepartmentId ?? payload.departmentId,
        '所属部门不合法'
      ),
      ownerId: normalizeOptionalPositiveInt(
        payload.ownerId ?? payload.responsibleUserId,
        '负责人不合法'
      ),
      assigneeIds: normalizeAssigneeIds(payload.assigneeIds),
      priority: normalizeWorkPlanPriority(payload.priority, 'medium'),
      plannedStartDate,
      plannedEndDate,
      progressSummary: normalizeOptionalText(payload.progressSummary, 2000),
      resultSummary: normalizeOptionalText(payload.resultSummary, 2000),
      sourceSnapshot: normalizeJsonObject(payload.sourceSnapshot ?? payload.rawPayload ?? payload),
    };
  }

  private async findByExternalSource(normalized: {
    externalInstanceId: string;
    sourceBizType: string | null;
    sourceBizId: string | null;
  }) {
    const byInstance = await this.performanceWorkPlanEntity.findOneBy({
      externalInstanceId: normalized.externalInstanceId,
    });
    if (byInstance) {
      return byInstance;
    }

    if (normalized.sourceBizType && normalized.sourceBizId) {
      return this.performanceWorkPlanEntity.findOneBy({
        sourceType: 'dingtalkApproval',
        sourceBizType: normalized.sourceBizType,
        sourceBizId: normalized.sourceBizId,
      });
    }

    return null;
  }

  private resolveStatusAfterSync(
    currentStatus: string,
    sourceStatus: WorkPlanSourceStatus
  ): WorkPlanStatus {
    if (currentStatus === 'completed') {
      return 'completed';
    }

    if (sourceStatus === 'approved') {
      return currentStatus === 'inProgress' ? 'inProgress' : 'planned';
    }

    if (['rejected', 'withdrawn', 'terminated'].includes(sourceStatus)) {
      return currentStatus === 'inProgress' ? 'inProgress' : 'cancelled';
    }

    return currentStatus === 'planned' || currentStatus === 'inProgress'
      ? (currentStatus as WorkPlanStatus)
      : 'draft';
  }

  private async generateWorkNo() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `WP-${Date.now()}${attempt}`;
      const existing = await this.performanceWorkPlanEntity.findOneBy({
        workNo: candidate,
      });
      if (!existing) {
        return candidate;
      }
    }
    throw new CoolCommException('生成工作计划单号失败，请重试');
  }
}
