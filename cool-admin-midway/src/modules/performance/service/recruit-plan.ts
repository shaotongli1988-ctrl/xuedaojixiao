/**
 * 招聘计划领域服务。
 * 这里只负责主题16备案制扩展版的 recruitPlan 主链接口，不负责审批流、跨主题自动联动或招聘驾驶舱。
 * 维护重点是部门树权限、摘要字段边界、delete/import/export/void/reopen 行为和状态机必须由服务端硬兜底。
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
import { Brackets, Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { SpaceInfoEntity } from '../../space/entity/info';
import { PerformanceRecruitPlanEntity } from '../entity/recruit-plan';
import { PerformanceJobStandardEntity } from '../entity/job-standard';
import { PerformanceResumePoolEntity } from '../entity/resumePool';
import { PerformanceInterviewEntity } from '../entity/interview';
import { PerformanceHiringEntity } from '../entity/hiring';
import * as jwt from 'jsonwebtoken';

type RecruitPlanStatus = 'draft' | 'active' | 'voided' | 'closed';

const RECRUIT_PLAN_STATUS: RecruitPlanStatus[] = [
  'draft',
  'active',
  'voided',
  'closed',
];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EXPORT_LIMIT = 5000;

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

function normalizeRequiredDate(value: any, message: string) {
  const text = String(value || '').trim();
  if (!DATE_PATTERN.test(text)) {
    throw new CoolCommException(message);
  }
  return text;
}

function normalizeJsonObject(value: any) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  return typeof value === 'object' ? value : null;
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceRecruitPlanService extends BaseService {
  @InjectEntityModel(PerformanceRecruitPlanEntity)
  performanceRecruitPlanEntity: Repository<PerformanceRecruitPlanEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(SpaceInfoEntity)
  spaceInfoEntity: Repository<SpaceInfoEntity>;

  @InjectEntityModel(PerformanceJobStandardEntity)
  performanceJobStandardEntity: Repository<PerformanceJobStandardEntity>;

  @InjectEntityModel(PerformanceResumePoolEntity)
  performanceResumePoolEntity: Repository<PerformanceResumePoolEntity>;

  @InjectEntityModel(PerformanceInterviewEntity)
  performanceInterviewEntity: Repository<PerformanceInterviewEntity>;

  @InjectEntityModel(PerformanceHiringEntity)
  performanceHiringEntity: Repository<PerformanceHiringEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:recruitPlan:page',
    info: 'performance:recruitPlan:info',
    add: 'performance:recruitPlan:add',
    update: 'performance:recruitPlan:update',
    delete: 'performance:recruitPlan:delete',
    import: 'performance:recruitPlan:import',
    export: 'performance:recruitPlan:export',
    submit: 'performance:recruitPlan:submit',
    close: 'performance:recruitPlan:close',
    void: 'performance:recruitPlan:void',
    reopen: 'performance:recruitPlan:reopen',
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
    this.assertPerm(perms, this.perms.page, '无权限查看招聘计划列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const qb = await this.createScopedQuery(query);
    qb.orderBy('plan.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizePlanRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看招聘计划详情');

    const plan = await this.requirePlan(id);
    await this.assertPlanInScope(plan, '无权查看该招聘计划');
    return this.buildPlanDetail(plan);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增招聘计划');

    const normalized = await this.normalizePayload(payload, null, 'add');
    const saved = await this.performanceRecruitPlanEntity.save(
      this.performanceRecruitPlanEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updatePlan(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改招聘计划');

    const plan = await this.requirePlan(Number(payload.id));
    await this.assertPlanInScope(plan, '无权修改该招聘计划');
    this.assertEditable(plan.status);

    const normalized = await this.normalizePayload(
      {
        ...plan,
        ...payload,
      },
      plan,
      'update'
    );

    await this.performanceRecruitPlanEntity.update(
      { id: plan.id },
      normalized as any
    );
    return this.info(plan.id);
  }

  async deletePlan(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.delete, '无权限删除招聘计划');

    const plan = await this.requirePlan(Number(payload.id));
    await this.assertPlanInScope(plan, '无权删除该招聘计划');

    if (plan.status !== 'draft') {
      throw new CoolCommException('当前状态不允许删除');
    }

    await this.assertPlanNoDownstreamRef(plan);
    await this.performanceRecruitPlanEntity.delete({ id: plan.id });

    return {
      id: plan.id,
      deleted: true,
    };
  }

  async importPlans(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.import, '无权限导入招聘计划');

    const fileId = normalizeRequiredPositiveInt(payload.fileId, '导入文件不能为空');
    const fileInfo = await this.spaceInfoEntity.findOneBy({ id: fileId });
    if (!fileInfo) {
      throw new CoolCommException('导入文件不存在');
    }

    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    if (!rows.length) {
      throw new CoolCommException('导入内容不能为空');
    }

    let importedCount = 0;
    for (const row of rows) {
      const normalized = await this.normalizePayload(
        {
          ...row,
          status: 'draft',
        },
        null,
        'add'
      );

      await this.performanceRecruitPlanEntity.save(
        this.performanceRecruitPlanEntity.create(normalized)
      );
      importedCount += 1;
    }

    return {
      fileId,
      importedCount,
      skippedCount: 0,
    };
  }

  async exportPlans(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.export, '无权限导出招聘计划');

    const qb = await this.createScopedQuery(query);
    qb.orderBy('plan.updateTime', 'DESC').limit(EXPORT_LIMIT);
    const list = await qb.getRawMany();
    return list.map(item => this.normalizePlanRow(item));
  }

  async submitPlan(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.submit, '无权限提交招聘计划');

    const plan = await this.requirePlan(Number(payload.id));
    await this.assertPlanInScope(plan, '无权提交该招聘计划');

    if (plan.status !== 'draft') {
      throw new CoolCommException('当前状态不允许提交');
    }

    await this.performanceRecruitPlanEntity.update(
      { id: plan.id },
      { status: 'active' }
    );
    return this.info(plan.id);
  }

  async closePlan(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.close, '无权限关闭招聘计划');

    const plan = await this.requirePlan(Number(payload.id));
    await this.assertPlanInScope(plan, '无权关闭该招聘计划');

    if (plan.status !== 'active') {
      throw new CoolCommException('当前状态不允许关闭');
    }

    await this.performanceRecruitPlanEntity.update(
      { id: plan.id },
      { status: 'closed' }
    );
    return this.info(plan.id);
  }

  async voidPlan(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.void, '无权限作废招聘计划');

    const plan = await this.requirePlan(Number(payload.id));
    await this.assertPlanInScope(plan, '无权作废该招聘计划');

    if (plan.status !== 'active') {
      throw new CoolCommException('当前状态不允许作废');
    }

    await this.performanceRecruitPlanEntity.update(
      { id: plan.id },
      { status: 'voided' }
    );
    return this.info(plan.id);
  }

  async reopenPlan(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.reopen, '无权限重新开启招聘计划');

    const plan = await this.requirePlan(Number(payload.id));
    await this.assertPlanInScope(plan, '无权重新开启该招聘计划');

    if (!['closed', 'voided'].includes(String(plan.status))) {
      throw new CoolCommException('当前状态不允许重新开启');
    }

    await this.performanceRecruitPlanEntity.update(
      { id: plan.id },
      { status: 'active' }
    );
    return this.info(plan.id);
  }

  private async createScopedQuery(query: any) {
    const departmentIds = await this.departmentScopeIds();
    const qb = this.performanceRecruitPlanEntity
      .createQueryBuilder('plan')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = plan.targetDepartmentId'
      )
      .leftJoin(BaseSysUserEntity, 'recruiter', 'recruiter.id = plan.recruiterId')
      .select([
        'plan.id as id',
        'plan.title as title',
        'plan.targetDepartmentId as targetDepartmentId',
        'department.name as targetDepartmentName',
        'plan.positionName as positionName',
        'plan.headcount as headcount',
        'plan.startDate as startDate',
        'plan.endDate as endDate',
        'plan.recruiterId as recruiterId',
        'recruiter.name as recruiterName',
        'plan.requirementSummary as requirementSummary',
        'plan.jobStandardId as jobStandardId',
        'plan.jobStandardSnapshot as jobStandardSnapshot',
        'plan.status as status',
        'plan.createTime as createTime',
        'plan.updateTime as updateTime',
      ]);

    this.applyDepartmentScope(qb, departmentIds);
    this.applyQueryFilters(qb, query);
    return qb;
  }

  private async normalizePayload(
    payload: any,
    current: PerformanceRecruitPlanEntity | null,
    mode: 'add' | 'update'
  ) {
    const title = normalizeRequiredText(
      payload.title,
      200,
      '招聘计划标题不能为空且长度不能超过 200'
    );
    const targetDepartmentId = normalizeRequiredPositiveInt(
      payload.targetDepartmentId,
      '目标部门不能为空'
    );
    const positionName = normalizeRequiredText(
      payload.positionName,
      100,
      '目标岗位不能为空且长度不能超过 100'
    );
    const headcount = normalizeRequiredPositiveInt(
      payload.headcount,
      '计划招聘人数必须为正整数'
    );
    const startDate = normalizeRequiredDate(payload.startDate, '计划开始日期格式不正确');
    const endDate = normalizeRequiredDate(payload.endDate, '计划结束日期格式不正确');
    const recruiterId = normalizeOptionalPositiveInt(
      payload.recruiterId,
      '招聘负责人不合法'
    );
    const requirementSummary = normalizeOptionalText(payload.requirementSummary, 2000);
    const jobStandardId = normalizeOptionalPositiveInt(
      payload.jobStandardId ?? current?.jobStandardId,
      '职位标准不合法'
    );

    if (endDate < startDate) {
      throw new CoolCommException('结束日期不能早于开始日期');
    }

    await this.assertCanManageDepartment(targetDepartmentId);
    await this.assertDepartmentExists(targetDepartmentId);
    await this.assertRecruiterExists(recruiterId);
    const jobStandardSnapshot = await this.buildJobStandardSnapshot(jobStandardId);
    this.assertPayloadStatus(payload.status, current, mode);

    return {
      title,
      targetDepartmentId,
      positionName,
      headcount,
      startDate,
      endDate,
      recruiterId,
      requirementSummary,
      jobStandardId,
      jobStandardSnapshot,
      status: current?.status || 'draft',
    };
  }

  private assertPayloadStatus(
    rawStatus: any,
    current: PerformanceRecruitPlanEntity | null,
    mode: 'add' | 'update'
  ) {
    if (rawStatus === undefined || rawStatus === null || rawStatus === '') {
      return;
    }

    const status = String(rawStatus).trim() as RecruitPlanStatus;
    if (!RECRUIT_PLAN_STATUS.includes(status)) {
      throw new CoolCommException('招聘计划状态不合法');
    }

    if (mode === 'add' && status !== 'draft') {
      throw new CoolCommException('新增仅允许保存为 draft');
    }

    if (mode === 'update' && current) {
      if (status === current.status) {
        return;
      }

      if (status === 'active') {
        throw new CoolCommException('请通过提交动作进入 active');
      }
      if (status === 'closed') {
        throw new CoolCommException('请通过关闭动作进入 closed');
      }
      if (status === 'voided') {
        throw new CoolCommException('请通过作废动作进入 voided');
      }
      throw new CoolCommException('当前状态不允许回退为 draft');
    }
  }

  private async buildPlanDetail(plan: PerformanceRecruitPlanEntity) {
    const [department, recruiter] = await Promise.all([
      this.baseSysDepartmentEntity.findOneBy({ id: Number(plan.targetDepartmentId) }),
      plan.recruiterId
        ? this.baseSysUserEntity.findOneBy({ id: Number(plan.recruiterId) })
        : Promise.resolve(null),
    ]);
    const jobStandardSnapshot = this.normalizeJobStandardSnapshot(
      plan.jobStandardSnapshot
    );

    return {
      id: plan.id,
      title: plan.title,
      targetDepartmentId: plan.targetDepartmentId,
      targetDepartmentName: department?.name || null,
      positionName: plan.positionName,
      headcount: Number(plan.headcount),
      startDate: plan.startDate,
      endDate: plan.endDate,
      recruiterId: plan.recruiterId ?? null,
      recruiterName: recruiter?.name || null,
      requirementSummary: plan.requirementSummary ?? null,
      jobStandardId: this.normalizeNullableId(plan.jobStandardId),
      jobStandardSummary: jobStandardSnapshot,
      jobStandardSnapshot,
      status: plan.status,
      createTime: plan.createTime,
      updateTime: plan.updateTime,
    };
  }

  private normalizePlanRow(item: any) {
    const jobStandardSnapshot = this.normalizeJobStandardSnapshot(
      item.jobStandardSnapshot
    );
    return {
      id: Number(item.id),
      title: item.title,
      targetDepartmentId: Number(item.targetDepartmentId),
      targetDepartmentName: item.targetDepartmentName || null,
      positionName: item.positionName,
      headcount: Number(item.headcount),
      startDate: item.startDate,
      endDate: item.endDate,
      recruiterId:
        item.recruiterId == null || item.recruiterId === ''
          ? null
          : Number(item.recruiterId),
      recruiterName: item.recruiterName || null,
      requirementSummary: item.requirementSummary || null,
      jobStandardId: this.normalizeNullableId(item.jobStandardId),
      jobStandardSummary: jobStandardSnapshot,
      jobStandardSnapshot,
      status: item.status,
      createTime: item.createTime,
      updateTime: item.updateTime,
    };
  }

  private applyQueryFilters(qb: any, query: any) {
    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('plan.title like :keyword', { keyword })
            .orWhere('plan.positionName like :keyword', { keyword });
        })
      );
    }

    if (query.targetDepartmentId) {
      qb.andWhere('plan.targetDepartmentId = :targetDepartmentId', {
        targetDepartmentId: Number(query.targetDepartmentId),
      });
    }

    if (query.status) {
      qb.andWhere('plan.status = :status', {
        status: String(query.status).trim(),
      });
    }

    if (query.startDate) {
      qb.andWhere('plan.startDate >= :startDate', {
        startDate: String(query.startDate).trim(),
      });
    }

    if (query.endDate) {
      qb.andWhere('plan.endDate <= :endDate', {
        endDate: String(query.endDate).trim(),
      });
    }
  }

  private async assertDepartmentExists(targetDepartmentId: number) {
    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: targetDepartmentId,
    });

    if (!department) {
      throw new CoolCommException('目标部门不存在');
    }
  }

  private async assertRecruiterExists(recruiterId: number | null) {
    if (!recruiterId) {
      return;
    }

    const recruiter = await this.baseSysUserEntity.findOneBy({ id: recruiterId });
    if (!recruiter) {
      throw new CoolCommException('招聘负责人不存在');
    }
  }

  private assertEditable(status?: string) {
    if (status !== 'draft') {
      throw new CoolCommException('当前状态不允许编辑');
    }
  }

  private async assertPlanNoDownstreamRef(_plan: PerformanceRecruitPlanEntity) {
    const planId = Number(_plan.id);
    const [resumeCount, interviewCount, hiringCount] = await Promise.all([
      this.performanceResumePoolEntity.count({
        where: { recruitPlanId: planId },
      }),
      this.performanceInterviewEntity.count({
        where: { recruitPlanId: planId },
      }),
      this.performanceHiringEntity.count({
        where: { recruitPlanId: planId },
      }),
    ]);

    if (resumeCount || interviewCount || hiringCount) {
      throw new CoolCommException('当前招聘计划已被下游引用，不允许删除');
    }
  }

  private async requirePlan(id: number) {
    const validId = Number(id);
    if (!Number.isInteger(validId) || validId <= 0) {
      throw new CoolCommException('招聘计划不存在');
    }

    const plan = await this.performanceRecruitPlanEntity.findOneBy({ id: validId });
    if (!plan) {
      throw new CoolCommException('数据不存在');
    }
    return plan;
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

  private async departmentScopeIds() {
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

  private applyDepartmentScope(qb: any, departmentIds: number[]) {
    if (!departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('plan.targetDepartmentId in (:...departmentIds)', {
      departmentIds,
    });
  }

  private async assertPlanInScope(
    plan: PerformanceRecruitPlanEntity,
    message: string
  ) {
    const departmentIds = await this.departmentScopeIds();
    if (!departmentIds.includes(Number(plan.targetDepartmentId || 0))) {
      throw new CoolCommException(message);
    }
  }

  private async assertCanManageDepartment(targetDepartmentId: number) {
    const departmentIds = await this.departmentScopeIds();
    if (!departmentIds.includes(targetDepartmentId)) {
      throw new CoolCommException('无权操作该招聘计划');
    }
  }

  private normalizeNullableId(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private normalizeJobStandardSnapshot(value: any) {
    const snapshot = normalizeJsonObject(value);
    if (!snapshot) {
      return null;
    }

    return {
      id: this.normalizeNullableId(snapshot.id),
      positionName: snapshot.positionName || '',
      jobLevel: snapshot.jobLevel || null,
      targetDepartmentId: this.normalizeNullableId(snapshot.targetDepartmentId),
      targetDepartmentName: snapshot.targetDepartmentName || null,
      status: snapshot.status || null,
      requirementSummary: snapshot.requirementSummary || null,
    };
  }

  private async buildJobStandardSnapshot(jobStandardId: number | null) {
    if (!jobStandardId) {
      return null;
    }

    const record = await this.performanceJobStandardEntity.findOneBy({
      id: jobStandardId,
    });
    if (!record) {
      throw new CoolCommException('职位标准不存在');
    }

    const departmentIds = await this.departmentScopeIds();
    if (!departmentIds.includes(Number(record.targetDepartmentId || 0))) {
      throw new CoolCommException('无权引用该职位标准');
    }

    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: Number(record.targetDepartmentId),
    });

    return {
      id: Number(record.id),
      positionName: record.positionName || '',
      jobLevel: record.jobLevel || null,
      targetDepartmentId: Number(record.targetDepartmentId || 0),
      targetDepartmentName: department?.name || null,
      status: record.status || null,
      requirementSummary: record.requirementSummary || null,
    };
  }
}
