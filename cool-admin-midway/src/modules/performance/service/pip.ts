/**
 * PIP 领域服务。
 * 这里负责 PIP 主链查询、创建、状态流转与跟进记录，不负责评估模块既有流程或共享鉴权基础层。
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
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformancePipEntity } from '../entity/pip';
import { PerformancePipRecordEntity } from '../entity/pip-record';
import * as jwt from 'jsonwebtoken';

export type PipStatus = 'draft' | 'active' | 'completed' | 'closed';
export type PipAction = 'start' | 'track' | 'complete' | 'close';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

export function assertPipEditable(status?: string) {
  if ((status || 'draft') !== 'draft') {
    throw new CoolCommException('当前状态不允许编辑 PIP');
  }
}

export function validatePipPayload(payload: {
  assessmentId?: number | null;
  title?: string;
  improvementGoal?: string;
  sourceReason?: string;
  startDate?: string;
  endDate?: string;
}) {
  if (!String(payload.title || '').trim()) {
    throw new CoolCommException('PIP 标题不能为空');
  }

  if (!String(payload.improvementGoal || '').trim()) {
    throw new CoolCommException('改进目标不能为空');
  }

  if (!payload.assessmentId && !String(payload.sourceReason || '').trim()) {
    throw new CoolCommException('独立创建必须填写来源原因');
  }

  if (!payload.startDate || !payload.endDate) {
    throw new CoolCommException('开始日期和结束日期不能为空');
  }

  if (payload.startDate > payload.endDate) {
    throw new CoolCommException('开始日期不能晚于结束日期');
  }
}

export function resolvePipStatusTransition(
  currentStatus: PipStatus,
  action: PipAction
): PipStatus {
  switch (action) {
    case 'start':
      if (currentStatus !== 'draft') {
        throw new CoolCommException('只有草稿状态的 PIP 可以启动');
      }
      return 'active';
    case 'track':
      if (currentStatus !== 'active') {
        throw new CoolCommException('只有进行中的 PIP 可以提交跟进');
      }
      return 'active';
    case 'complete':
      if (currentStatus !== 'active') {
        throw new CoolCommException('只有进行中的 PIP 可以完成');
      }
      return 'completed';
    case 'close':
      if (currentStatus !== 'active') {
        throw new CoolCommException('只有进行中的 PIP 可以关闭');
      }
      return 'closed';
    default:
      throw new CoolCommException('不支持的 PIP 动作');
  }
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformancePipService extends BaseService {
  @InjectEntityModel(PerformancePipEntity)
  performancePipEntity: Repository<PerformancePipEntity>;

  @InjectEntityModel(PerformancePipRecordEntity)
  performancePipRecordEntity: Repository<PerformancePipRecordEntity>;

  @InjectEntityModel(PerformanceAssessmentEntity)
  performanceAssessmentEntity: Repository<PerformanceAssessmentEntity>;

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

  private readonly perms = {
    page: 'performance:pip:page',
    info: 'performance:pip:info',
    add: 'performance:pip:add',
    update: 'performance:pip:update',
    start: 'performance:pip:start',
    track: 'performance:pip:track',
    complete: 'performance:pip:complete',
    close: 'performance:pip:close',
    hrPage: 'performance:salary:page',
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
    const page = Number(query.page || 1);
    const size = Number(query.size || 20);

    if (!this.hasPerm(perms, this.perms.page)) {
      throw new CoolCommException('无权限查看 PIP');
    }

    const qb = this.performancePipEntity
      .createQueryBuilder('pip')
      .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = pip.employeeId')
      .leftJoin(BaseSysUserEntity, 'owner', 'owner.id = pip.ownerId')
      .select([
        'pip.id as id',
        'pip.assessmentId as assessmentId',
        'pip.employeeId as employeeId',
        'pip.ownerId as ownerId',
        'pip.title as title',
        'pip.improvementGoal as improvementGoal',
        'pip.sourceReason as sourceReason',
        'pip.startDate as startDate',
        'pip.endDate as endDate',
        'pip.status as status',
        'pip.resultSummary as resultSummary',
        'pip.createTime as createTime',
        'pip.updateTime as updateTime',
        'employee.name as employeeName',
        'owner.name as ownerName',
      ]);

    await this.applyPipScope(qb, perms);

    if (query.employeeId) {
      qb.andWhere('pip.employeeId = :employeeId', {
        employeeId: Number(query.employeeId),
      });
    }

    if (query.ownerId) {
      qb.andWhere('pip.ownerId = :ownerId', {
        ownerId: Number(query.ownerId),
      });
    }

    if (query.assessmentId) {
      qb.andWhere('pip.assessmentId = :assessmentId', {
        assessmentId: Number(query.assessmentId),
      });
    }

    if (query.status) {
      qb.andWhere('pip.status = :status', { status: query.status });
    }

    if (query.keyword) {
      qb.andWhere('(pip.title like :keyword or pip.sourceReason like :keyword)', {
        keyword: `%${query.keyword}%`,
      });
    }

    qb.orderBy('pip.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizePipRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    const pip = await this.requirePip(id);

    await this.assertCanViewPip(pip, perms);

    return this.buildPipDetail(pip);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.add)) {
      throw new CoolCommException('无权限新建 PIP');
    }

    const normalized = await this.normalizePipPayload(payload);
    await this.assertCanManageEmployee(normalized.employeeId, perms);

    const pip = await this.performancePipEntity.save(
      this.performancePipEntity.create({
        assessmentId: normalized.assessmentId || null,
        employeeId: normalized.employeeId,
        ownerId: normalized.ownerId,
        title: normalized.title,
        improvementGoal: normalized.improvementGoal,
        sourceReason: normalized.sourceReason,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        status: 'draft',
        resultSummary: '',
      })
    );

    return this.info(pip.id);
  }

  async updatePip(payload: any) {
    const perms = await this.currentPerms();
    const pip = await this.requirePip(Number(payload.id));

    if (!this.hasPerm(perms, this.perms.update)) {
      throw new CoolCommException('无权限修改 PIP');
    }

    assertPipEditable(pip.status);
    await this.assertCanManagePip(pip, perms);

    const normalized = await this.normalizePipPayload({
      ...pip,
      ...payload,
    });

    await this.assertCanManageEmployee(normalized.employeeId, perms);

    await this.performancePipEntity.update(
      { id: pip.id },
      {
        assessmentId: normalized.assessmentId || null,
        employeeId: normalized.employeeId,
        ownerId: normalized.ownerId,
        title: normalized.title,
        improvementGoal: normalized.improvementGoal,
        sourceReason: normalized.sourceReason,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
      }
    );

    return this.info(pip.id);
  }

  async start(payload: { id: number }) {
    return this.updateStatus(Number(payload.id), 'start');
  }

  async track(payload: any) {
    const perms = await this.currentPerms();
    const pip = await this.requirePip(Number(payload.id));

    if (!this.hasPerm(perms, this.perms.track)) {
      throw new CoolCommException('无权限提交 PIP 跟进');
    }

    await this.assertCanManagePip(pip, perms);
    resolvePipStatusTransition(pip.status as PipStatus, 'track');

    if (!payload.recordDate) {
      throw new CoolCommException('跟进日期不能为空');
    }

    if (!String(payload.progress || '').trim()) {
      throw new CoolCommException('跟进内容不能为空');
    }

    await this.performancePipRecordEntity.save(
      this.performancePipRecordEntity.create({
        pipId: pip.id,
        recordDate: String(payload.recordDate),
        progress: String(payload.progress || '').trim(),
        nextPlan: payload.nextPlan ? String(payload.nextPlan).trim() : '',
        operatorId: this.currentAdmin.userId,
      })
    );

    return this.info(pip.id);
  }

  async complete(payload: { id: number; resultSummary?: string }) {
    return this.updateStatus(Number(payload.id), 'complete', payload.resultSummary);
  }

  async close(payload: { id: number; resultSummary?: string }) {
    return this.updateStatus(Number(payload.id), 'close', payload.resultSummary);
  }

  private async updateStatus(
    id: number,
    action: Exclude<PipAction, 'track'>,
    resultSummary?: string
  ) {
    const perms = await this.currentPerms();
    const pip = await this.requirePip(id);
    const actionPerm = this.perms[action];

    if (!this.hasPerm(perms, actionPerm)) {
      throw new CoolCommException(`无权限执行 PIP ${action} 动作`);
    }

    await this.assertCanManagePip(pip, perms);

    const nextStatus = resolvePipStatusTransition(pip.status as PipStatus, action);

    await this.performancePipEntity.update(
      { id: pip.id },
      {
        status: nextStatus,
        resultSummary:
          resultSummary !== undefined
            ? String(resultSummary || '').trim()
            : pip.resultSummary || '',
      }
    );

    return this.info(pip.id);
  }

  private async buildPipDetail(pip: PerformancePipEntity) {
    const [employee, owner, trackRecords] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: pip.employeeId }),
      this.baseSysUserEntity.findOneBy({ id: pip.ownerId }),
      this.performancePipRecordEntity.find({
        where: { pipId: pip.id },
        order: { recordDate: 'DESC', createTime: 'DESC' },
      }),
    ]);

    const operatorIds = trackRecords.map(item => Number(item.operatorId));
    const operators = operatorIds.length
      ? await this.baseSysUserEntity.findBy({ id: In(operatorIds) } as any)
      : [];

    return {
      ...pip,
      id: Number(pip.id),
      assessmentId: pip.assessmentId ? Number(pip.assessmentId) : null,
      employeeId: Number(pip.employeeId),
      ownerId: Number(pip.ownerId),
      employeeName: employee?.name || '',
      ownerName: owner?.name || '',
      sourceReason: pip.sourceReason || '',
      resultSummary: pip.resultSummary || '',
      trackRecords: trackRecords.map(item => {
        const operator = operators.find(
          operatorItem => Number(operatorItem.id) === Number(item.operatorId)
        );

        return {
          id: Number(item.id),
          pipId: Number(item.pipId),
          recordDate: item.recordDate,
          progress: item.progress || '',
          nextPlan: item.nextPlan || '',
          operatorId: Number(item.operatorId),
          operatorName: operator?.name || '',
          createTime: item.createTime,
        };
      }),
    };
  }

  private normalizePipRow(item: any) {
    return {
      ...item,
      id: Number(item.id),
      assessmentId: item.assessmentId ? Number(item.assessmentId) : null,
      employeeId: Number(item.employeeId),
      ownerId: Number(item.ownerId),
      sourceReason: item.sourceReason || '',
      resultSummary: item.resultSummary || '',
    };
  }

  private async normalizePipPayload(payload: any) {
    const assessment = await this.resolveLinkedAssessment(payload.assessmentId);
    const employeeId = assessment
      ? Number(assessment.employeeId)
      : Number(payload.employeeId);
    const ownerId = assessment ? Number(assessment.assessorId) : Number(payload.ownerId);

    if (!employeeId) {
      throw new CoolCommException('员工不能为空');
    }

    if (!ownerId) {
      throw new CoolCommException('负责人不能为空');
    }

    const [employee, owner] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: employeeId }),
      this.baseSysUserEntity.findOneBy({ id: ownerId }),
    ]);

    if (!employee) {
      throw new CoolCommException('员工不存在');
    }

    if (!owner) {
      throw new CoolCommException('负责人不存在');
    }

    const normalized = {
      assessmentId: assessment ? Number(assessment.id) : payload.assessmentId ? Number(payload.assessmentId) : null,
      employeeId,
      ownerId,
      title: String(payload.title || '').trim(),
      improvementGoal: String(payload.improvementGoal || '').trim(),
      sourceReason: assessment
        ? String(payload.sourceReason || '').trim()
        : String(payload.sourceReason || '').trim(),
      startDate: String(payload.startDate || ''),
      endDate: String(payload.endDate || ''),
    };

    validatePipPayload(normalized);

    return normalized;
  }

  private async resolveLinkedAssessment(assessmentId?: number | string | null) {
    const id = Number(assessmentId || 0);

    if (!id) {
      return null;
    }

    const assessment = await this.performanceAssessmentEntity.findOneBy({ id });

    if (!assessment) {
      throw new CoolCommException('来源评估单不存在');
    }

    return assessment;
  }

  private async requirePip(id: number) {
    const pip = await this.performancePipEntity.findOneBy({ id });

    if (!pip) {
      throw new CoolCommException('数据不存在');
    }

    return pip;
  }

  private async currentPerms() {
    return this.baseSysMenuService.getPerms(this.currentAdmin.roleIds);
  }

  private hasPerm(perms: string[], perm: string) {
    return perms.includes(perm);
  }

  private isHr(perms: string[]) {
    return (
      this.currentAdmin.isAdmin === true ||
      this.hasPerm(perms, this.perms.hrPage)
    );
  }

  private async departmentScopeIds() {
    const ids = await this.baseSysPermsService.departmentIds(
      this.currentAdmin.userId
    );
    return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
  }

  private async applyPipScope(qb: any, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    const userId = this.currentAdmin.userId;

    if (
      !this.hasPerm(perms, this.perms.add) &&
      !this.hasPerm(perms, this.perms.update) &&
      !this.hasPerm(perms, this.perms.start) &&
      !this.hasPerm(perms, this.perms.track) &&
      !this.hasPerm(perms, this.perms.complete) &&
      !this.hasPerm(perms, this.perms.close)
    ) {
      qb.andWhere('pip.employeeId = :userId', { userId });
      return;
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    if (!departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('employee.departmentId in (:...departmentIds)', { departmentIds });
  }

  private async assertCanViewPip(pip: PerformancePipEntity, perms: string[]) {
    if (!this.hasPerm(perms, this.perms.info)) {
      throw new CoolCommException('无权限查看 PIP 详情');
    }

    if (this.isHr(perms)) {
      return;
    }

    const userId = this.currentAdmin.userId;
    const employee = await this.baseSysUserEntity.findOneBy({ id: pip.employeeId });

    if (!employee) {
      throw new CoolCommException('员工不存在');
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    if (
      Number(pip.employeeId) === Number(userId) ||
      departmentIds.includes(Number(employee.departmentId))
    ) {
      return;
    }

    throw new CoolCommException('无权查看该 PIP');
  }

  private async assertCanManagePip(pip: PerformancePipEntity, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    await this.assertCanManageEmployee(Number(pip.employeeId), perms);
  }

  private async assertCanManageEmployee(employeeId: number, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    const employee = await this.baseSysUserEntity.findOneBy({ id: employeeId });

    if (!employee?.departmentId) {
      throw new CoolCommException('员工所属部门不存在');
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    if (!departmentIds.includes(Number(employee.departmentId))) {
      throw new CoolCommException('无权管理该员工 PIP');
    }
  }

  private async resolveScopeDepartmentIds() {
    const cached = this.currentCtx?.pipDepartmentIds;

    if (Array.isArray(cached)) {
      return cached.map(item => Number(item));
    }

    const departmentIds = await this.departmentScopeIds();
    this.currentCtx.pipDepartmentIds = departmentIds;
    return departmentIds;
  }

  async initPipScope() {
    this.currentCtx.pipDepartmentIds = await this.departmentScopeIds();
  }
}
