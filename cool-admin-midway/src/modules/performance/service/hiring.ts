/**
 * 录用管理领域服务。
 * 这里只负责主题18冻结的 hiring 主链 `page/info/add/updateStatus/close`，不负责入职、人事、合同或跨主题自动改写。
 * 维护重点是 offered/accepted/rejected/closed 状态机、部门树范围和字段边界必须由服务端硬兜底。
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
import { Brackets, In, Repository } from 'typeorm';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysRoleEntity } from '../../base/entity/sys/role';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceHiringEntity } from '../entity/hiring';
import * as jwt from 'jsonwebtoken';

type HiringStatus = 'offered' | 'accepted' | 'rejected' | 'closed';
type HiringSourceType = 'manual' | 'resumePool' | 'talentAsset' | 'interview';

const HIRING_STATUS: HiringStatus[] = ['offered', 'accepted', 'rejected', 'closed'];
const HIRING_SOURCE_TYPES: HiringSourceType[] = [
  'manual',
  'resumePool',
  'talentAsset',
  'interview',
];
const HR_ROLE_HINTS = ['hr', 'human', '人力', '人事'];
const SOURCE_STATUS_SNAPSHOT_MAX_LENGTH = 4000;

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

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

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceHiringService extends BaseService {
  @InjectEntityModel(PerformanceHiringEntity)
  performanceHiringEntity: Repository<PerformanceHiringEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectEntityModel(BaseSysRoleEntity)
  baseSysRoleEntity: Repository<BaseSysRoleEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:hiring:page',
    info: 'performance:hiring:info',
    add: 'performance:hiring:add',
    updateStatus: 'performance:hiring:updateStatus',
    close: 'performance:hiring:close',
    hrScope: 'performance:salary:page',
    hrAll: 'performance:hiring:all',
  };

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
      return jwt.verify(token, resolveBaseJwtConfig(this.app).secret);
    } catch (error) {
      return undefined;
    }
  }

  async page(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.page, '无权限查看录用列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const departmentIds = await this.departmentScopeIds(perms);
    const qb = this.performanceHiringEntity
      .createQueryBuilder('hiring')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = hiring.targetDepartmentId'
      )
      .select([
        'hiring.id as id',
        'hiring.candidateName as candidateName',
        'hiring.targetDepartmentId as targetDepartmentId',
        'department.name as targetDepartmentName',
        'hiring.targetPosition as targetPosition',
        'hiring.decisionContent as decisionContent',
        'hiring.sourceType as sourceType',
        'hiring.sourceId as sourceId',
        'hiring.sourceSnapshot as sourceSnapshot',
        'hiring.status as status',
        'hiring.offeredAt as offeredAt',
        'hiring.acceptedAt as acceptedAt',
        'hiring.rejectedAt as rejectedAt',
        'hiring.closedAt as closedAt',
        'hiring.closeReason as closeReason',
        'hiring.createTime as createTime',
        'hiring.updateTime as updateTime',
      ]);

    this.applyScope(qb, departmentIds);
    this.applyFilters(qb, query);
    qb.orderBy('hiring.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeHiringRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看录用详情');

    const hiring = await this.requireHiring(id);
    await this.assertHiringInScope(hiring, perms, '无权访问该录用单');
    return this.buildHiringDetail(hiring);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增录用单');

    const normalized = await this.normalizePayload(payload, perms);
    const now = formatDateTime(new Date());
    const saved = await this.performanceHiringEntity.save(
      this.performanceHiringEntity.create({
        ...normalized,
        status: 'offered',
        offeredAt: now,
        acceptedAt: null,
        rejectedAt: null,
        closedAt: null,
        closeReason: null,
      })
    );

    return this.info(saved.id);
  }

  async updateStatus(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.updateStatus, '无权限更新录用状态');

    const id = normalizeRequiredPositiveInt(payload.id, '录用单 ID 不合法');
    const targetStatus = this.normalizeUpdatableStatus(payload.status);
    const hiring = await this.requireHiring(id);
    await this.assertHiringInScope(hiring, perms, '无权操作该录用单');

    if (hiring.status !== 'offered') {
      throw new CoolCommException('当前状态不允许更新录用状态');
    }

    const now = formatDateTime(new Date());
    await this.performanceHiringEntity.update(
      { id: hiring.id },
      {
        status: targetStatus,
        acceptedAt: targetStatus === 'accepted' ? now : null,
        rejectedAt: targetStatus === 'rejected' ? now : null,
      }
    );

    return this.info(hiring.id);
  }

  async close(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.close, '无权限关闭录用单');

    const id = normalizeRequiredPositiveInt(payload.id, '录用单 ID 不合法');
    const closeReason = normalizeRequiredText(
      payload.closeReason,
      2000,
      '关闭原因不能为空且长度不能超过 2000'
    );
    const hiring = await this.requireHiring(id);
    await this.assertHiringInScope(hiring, perms, '无权操作该录用单');

    if (hiring.status !== 'offered') {
      throw new CoolCommException('当前状态不允许关闭录用单');
    }

    await this.performanceHiringEntity.update(
      { id: hiring.id },
      {
        status: 'closed',
        closeReason,
        closedAt: formatDateTime(new Date()),
      }
    );

    return this.info(hiring.id);
  }

  private async normalizePayload(payload: any, perms: string[]) {
    const candidateName = normalizeRequiredText(payload.candidateName, 100, '候选人姓名不能为空');
    const targetDepartmentId = normalizeRequiredPositiveInt(
      payload.targetDepartmentId,
      '目标部门不能为空'
    );
    const targetPosition = normalizeOptionalText(payload.targetPosition, 100);
    const decisionContent = normalizeOptionalText(
      payload.hiringDecision ?? payload.decisionContent,
      10000
    );
    const sourceType = this.normalizeOptionalSourceType(payload.sourceType);
    const sourceId = normalizeOptionalPositiveInt(payload.sourceId, 'sourceId 不合法');
    const sourceSnapshot = this.normalizeSourceSnapshotInput(
      payload.sourceStatusSnapshot,
      payload.sourceSnapshot
    );

    await this.assertCanManageDepartment(targetDepartmentId, perms);

    if (payload.status !== undefined && payload.status !== null && payload.status !== '') {
      const status = this.normalizeStatus(payload.status);
      if (status !== 'offered') {
        throw new CoolCommException('新增录用状态只能为 offered');
      }
    }

    if (!sourceType && sourceId) {
      throw new CoolCommException('存在 sourceId 时必须提供 sourceType');
    }

    return {
      candidateName,
      targetDepartmentId,
      targetPosition,
      decisionContent,
      sourceType: sourceType || 'manual',
      sourceId,
      sourceSnapshot,
    };
  }

  private applyFilters(qb: any, query: any) {
    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('hiring.candidateName like :keyword', { keyword })
            .orWhere('hiring.targetPosition like :keyword', { keyword });
        })
      );
    }

    if (query.status) {
      qb.andWhere('hiring.status = :status', {
        status: this.normalizeStatus(query.status),
      });
    }

    if (query.targetDepartmentId !== undefined && query.targetDepartmentId !== null) {
      const targetDepartmentId = normalizeRequiredPositiveInt(
        query.targetDepartmentId,
        'targetDepartmentId 不合法'
      );
      qb.andWhere('hiring.targetDepartmentId = :targetDepartmentId', {
        targetDepartmentId,
      });
    }

    if (query.sourceType) {
      qb.andWhere('hiring.sourceType = :sourceType', {
        sourceType: this.normalizeOptionalSourceType(query.sourceType),
      });
    }
  }

  private normalizeStatus(value: any) {
    const status = String(value || '').trim() as HiringStatus;
    if (!HIRING_STATUS.includes(status)) {
      throw new CoolCommException('录用状态不合法');
    }
    return status;
  }

  private normalizeUpdatableStatus(value: any) {
    const status = this.normalizeStatus(value);
    if (status !== 'accepted' && status !== 'rejected') {
      throw new CoolCommException('updateStatus 仅支持 accepted 或 rejected');
    }
    return status;
  }

  private normalizeOptionalSourceType(value: any) {
    const sourceType = String(value ?? '').trim() as HiringSourceType;
    if (!sourceType) {
      return null;
    }
    if (!HIRING_SOURCE_TYPES.includes(sourceType)) {
      throw new CoolCommException('sourceType 不合法');
    }
    return sourceType;
  }

  private normalizeSourceSnapshot(value: any) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) {
        return null;
      }
      try {
        const parsed = JSON.parse(text);
        return typeof parsed === 'object' && parsed ? parsed : { value: String(parsed) };
      } catch (error) {
        return normalizeOptionalText(text, SOURCE_STATUS_SNAPSHOT_MAX_LENGTH);
      }
    }

    if (typeof value !== 'object') {
      throw new CoolCommException('sourceSnapshot 必须为对象');
    }

    return value;
  }

  private normalizeSourceSnapshotResponse(value: any) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    }

    return value;
  }

  private normalizeSourceSnapshotInput(sourceStatusSnapshot: any, sourceSnapshot: any) {
    const normalizedStatusSnapshot = normalizeOptionalText(
      sourceStatusSnapshot,
      SOURCE_STATUS_SNAPSHOT_MAX_LENGTH
    );

    if (normalizedStatusSnapshot) {
      return normalizedStatusSnapshot;
    }

    return this.normalizeSourceSnapshot(sourceSnapshot);
  }

  private extractSourceStatusSnapshot(value: any) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      return normalizeOptionalText(value, SOURCE_STATUS_SNAPSHOT_MAX_LENGTH);
    }

    if (typeof value === 'object') {
      const fromSourceStatusSnapshot = normalizeOptionalText(
        value.sourceStatusSnapshot,
        SOURCE_STATUS_SNAPSHOT_MAX_LENGTH
      );
      if (fromSourceStatusSnapshot) {
        return fromSourceStatusSnapshot;
      }

      const fromSummary = normalizeOptionalText(
        value.summary,
        SOURCE_STATUS_SNAPSHOT_MAX_LENGTH
      );
      if (fromSummary) {
        return fromSummary;
      }

      const fromStatus = normalizeOptionalText(
        value.status,
        SOURCE_STATUS_SNAPSHOT_MAX_LENGTH
      );
      if (fromStatus) {
        return fromStatus;
      }

      return normalizeOptionalText(
        JSON.stringify(value),
        SOURCE_STATUS_SNAPSHOT_MAX_LENGTH
      );
    }

    return normalizeOptionalText(String(value), SOURCE_STATUS_SNAPSHOT_MAX_LENGTH);
  }

  private normalizeHiringRow(item: any) {
    const hiringDecision = normalizeOptionalText(item.decisionContent, 10000);
    const sourceSnapshot = this.normalizeSourceSnapshotResponse(item.sourceSnapshot);

    return {
      id: Number(item.id),
      candidateName: item.candidateName || '',
      targetDepartmentId: Number(item.targetDepartmentId || 0),
      targetDepartmentName: item.targetDepartmentName || '',
      targetPosition: item.targetPosition || null,
      hiringDecision,
      decisionContent: hiringDecision,
      sourceType: item.sourceType || null,
      sourceId: normalizeOptionalPositiveInt(item.sourceId, 'sourceId 不合法'),
      sourceStatusSnapshot: this.extractSourceStatusSnapshot(sourceSnapshot),
      sourceSnapshot,
      status: item.status || 'offered',
      offeredAt: item.offeredAt || null,
      acceptedAt: item.acceptedAt || null,
      rejectedAt: item.rejectedAt || null,
      closedAt: item.closedAt || null,
      closeReason: item.closeReason || null,
      createTime: item.createTime,
      updateTime: item.updateTime,
    };
  }

  private async buildHiringDetail(hiring: PerformanceHiringEntity) {
    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: Number(hiring.targetDepartmentId),
    });

    return {
      ...this.normalizeHiringRow({
        ...hiring,
        targetDepartmentName: department?.name || '',
      }),
    };
  }

  private async requireHiring(id: number) {
    const validId = normalizeRequiredPositiveInt(id, '录用单 ID 不合法');
    const hiring = await this.performanceHiringEntity.findOneBy({ id: validId });

    if (!hiring) {
      throw new CoolCommException('数据不存在');
    }

    return hiring;
  }

  private async currentPerms() {
    const admin = this.currentAdmin;

    if (!admin?.roleIds) {
      throw new CoolCommException('登录状态已失效');
    }

    return this.baseSysMenuService.getPerms(admin.roleIds);
  }

  private hasPerm(perms: string[], perm: string) {
    return perms.includes(perm);
  }

  private assertPerm(perms: string[], perm: string, message: string) {
    if (!this.hasPerm(perms, perm)) {
      throw new CoolCommException(message);
    }
  }

  private async isHr(perms: string[]) {
    const cached = this.currentCtx?.hiringIsHr;
    if (typeof cached === 'boolean') {
      return cached;
    }

    let isHr =
      this.currentAdmin?.isAdmin === true ||
      this.currentAdmin?.username === 'admin' ||
      this.hasPerm(perms, this.perms.hrScope) ||
      this.hasPerm(perms, this.perms.hrAll);

    if (!isHr) {
      const roleIds = Array.from(
        new Set(
          (Array.isArray(this.currentAdmin?.roleIds) ? this.currentAdmin.roleIds : [])
            .map(item => Number(item))
            .filter(item => Number.isInteger(item) && item > 0)
        )
      );

      if (roleIds.length && this.baseSysRoleEntity?.findBy) {
        const roles = await this.baseSysRoleEntity.findBy({
          id: In(roleIds),
        });
        isHr = roles.some(role => this.isHrRole(role));
      }
    }

    if (this.currentCtx) {
      this.currentCtx.hiringIsHr = isHr;
    }

    return isHr;
  }

  private isHrRole(role: BaseSysRoleEntity) {
    const raw = `${role?.name || ''} ${role?.label || ''}`.trim();
    if (!raw) {
      return false;
    }

    const normalized = raw.toLowerCase();
    return HR_ROLE_HINTS.some(keyword => normalized.includes(keyword.toLowerCase()));
  }

  private async departmentScopeIds(perms: string[]) {
    if (await this.isHr(perms)) {
      return null;
    }

    const userId = Number(this.currentAdmin?.userId || 0);
    if (!userId) {
      throw new CoolCommException('登录上下文缺失');
    }

    const ids = await this.baseSysPermsService.departmentIds(userId);
    return Array.from(
      new Set(
        (Array.isArray(ids) ? ids : [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );
  }

  private applyScope(qb: any, departmentIds: number[] | null) {
    if (departmentIds === null) {
      return;
    }

    if (!departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('hiring.targetDepartmentId in (:...departmentIds)', {
      departmentIds,
    });
  }

  private async assertHiringInScope(
    hiring: PerformanceHiringEntity,
    perms: string[],
    message: string
  ) {
    if (await this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);
    const targetDepartmentId = Number(hiring.targetDepartmentId || 0);

    if (!targetDepartmentId || !departmentIds?.includes(targetDepartmentId)) {
      throw new CoolCommException(message);
    }
  }

  private async assertCanManageDepartment(targetDepartmentId: number, perms: string[]) {
    if (await this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);
    if (!departmentIds?.includes(targetDepartmentId)) {
      throw new CoolCommException('无权操作该录用单');
    }
  }
}
