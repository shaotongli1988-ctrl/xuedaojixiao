/**
 * 招聘面试领域服务。
 * 这里只负责主题8首批的面试分页、详情和标准 CRUD，不负责简历池、职位标准、录用管理或招聘驾驶舱。
 * 维护重点是部门经理范围按 departmentId 判定、completed/cancelled 终态不可编辑、删除仅 HR 可执行。
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
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceInterviewEntity } from '../entity/interview';
import * as jwt from 'jsonwebtoken';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

const INTERVIEW_STATUS = ['scheduled', 'completed', 'cancelled'];
const INTERVIEW_TYPES = ['technical', 'behavioral', 'manager', 'hr'];

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceInterviewService extends BaseService {
  @InjectEntityModel(PerformanceInterviewEntity)
  performanceInterviewEntity: Repository<PerformanceInterviewEntity>;

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
    page: 'performance:interview:page',
    info: 'performance:interview:info',
    add: 'performance:interview:add',
    update: 'performance:interview:update',
    delete: 'performance:interview:delete',
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

    if (!this.hasPerm(perms, this.perms.page)) {
      throw new CoolCommException('无权限查看面试列表');
    }

    const page = Number(query.page || 1);
    const size = Number(query.size || 20);
    const departmentIds = await this.departmentScopeIds(perms);
    const qb = this.performanceInterviewEntity
      .createQueryBuilder('interview')
      .leftJoin(BaseSysUserEntity, 'interviewer', 'interviewer.id = interview.interviewerId')
      .select([
        'interview.id as id',
        'interview.candidateName as candidateName',
        'interview.position as position',
        'interview.departmentId as departmentId',
        'interview.interviewerId as interviewerId',
        'interviewer.name as interviewerName',
        'interview.interviewDate as interviewDate',
        'interview.interviewType as interviewType',
        'interview.score as score',
        'interview.status as status',
        'interview.createTime as createTime',
        'interview.updateTime as updateTime',
      ]);

    this.applyScope(qb, departmentIds);

    if (query.candidateName) {
      const candidateName = `%${String(query.candidateName).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where.where('interview.candidateName like :candidateName', {
            candidateName,
          });
        })
      );
    }

    if (query.position) {
      qb.andWhere('interview.position like :position', {
        position: `%${String(query.position).trim()}%`,
      });
    }

    if (query.status) {
      qb.andWhere('interview.status = :status', {
        status: String(query.status).trim(),
      });
    }

    if (query.startDate) {
      qb.andWhere('interview.interviewDate >= :startDate', {
        startDate: this.normalizeStartDate(query.startDate),
      });
    }

    if (query.endDate) {
      qb.andWhere('interview.interviewDate <= :endDate', {
        endDate: this.normalizeEndDate(query.endDate),
      });
    }

    qb.orderBy('interview.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeInterview(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.info)) {
      throw new CoolCommException('无权限查看面试详情');
    }

    const interview = await this.requireInterview(id);
    await this.assertInterviewInScope(interview, perms);
    return this.buildInterviewDetail(interview);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.add)) {
      throw new CoolCommException('无权限新增面试');
    }

    const normalized = await this.normalizePayload(payload, perms, 'add');
    const saved = await this.performanceInterviewEntity.save(
      this.performanceInterviewEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateInterview(payload: any) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.update)) {
      throw new CoolCommException('无权限修改面试');
    }

    const interview = await this.requireInterview(Number(payload.id));
    await this.assertInterviewInScope(interview, perms);

    if (this.isTerminal(interview.status)) {
      throw new CoolCommException('当前状态不允许编辑');
    }

    const normalized = await this.normalizePayload(
      {
        ...interview,
        ...payload,
        id: interview.id,
      },
      perms,
      'update'
    );

    await this.performanceInterviewEntity.update({ id: interview.id }, normalized);
    return this.info(interview.id);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.delete)) {
      throw new CoolCommException('无权限删除面试');
    }

    const validIds = (ids || [])
      .map(item => Number(item))
      .filter(item => Number.isInteger(item) && item > 0);

    if (!validIds.length) {
      return;
    }

    const interviews = await this.performanceInterviewEntity.findBy({
      id: In(validIds),
    });

    if (interviews.length !== validIds.length) {
      throw new CoolCommException('数据不存在');
    }

    interviews.forEach(item => {
      if (item.status !== 'scheduled') {
        throw new CoolCommException('当前状态不允许删除');
      }
    });

    await this.performanceInterviewEntity.delete(validIds);
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

  private hasGlobalScope(perms: string[]) {
    return this.currentAdmin?.username === 'admin' || this.hasPerm(perms, this.perms.delete);
  }

  private async departmentScopeIds(perms: string[]) {
    if (this.hasGlobalScope(perms)) {
      return null;
    }

    const userId = Number(this.currentAdmin?.userId || 0);

    if (!userId) {
      throw new CoolCommException('登录上下文缺失');
    }

    const ids = await this.baseSysPermsService.departmentIds(userId);
    return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
  }

  private applyScope(qb: any, departmentIds: number[] | null) {
    if (departmentIds === null) {
      return;
    }

    if (!departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('interview.departmentId in (:...departmentIds)', { departmentIds });
  }

  private async assertInterviewInScope(
    interview: PerformanceInterviewEntity,
    perms: string[]
  ) {
    if (this.hasGlobalScope(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);
    const departmentId = this.normalizeNullableNumber(interview.departmentId);

    if (!departmentId || !departmentIds?.includes(departmentId)) {
      throw new CoolCommException('无权访问该面试');
    }
  }

  private async assertCanManageDepartment(
    departmentId: number | null,
    perms: string[]
  ) {
    if (this.hasGlobalScope(perms)) {
      return;
    }

    if (!departmentId) {
      throw new CoolCommException('部门经理必须选择归属部门');
    }

    const departmentIds = await this.departmentScopeIds(perms);

    if (!departmentIds?.includes(departmentId)) {
      throw new CoolCommException('无权操作该面试');
    }
  }

  private async normalizePayload(payload: any, perms: string[], mode: 'add' | 'update') {
    const candidateName = String(payload.candidateName || '').trim();
    const position = String(payload.position || '').trim();
    const interviewerId = Number(payload.interviewerId || 0);
    const interviewDate = String(payload.interviewDate || '').trim();
    const departmentId = this.normalizeNullableNumber(payload.departmentId);
    const interviewer = await this.baseSysUserEntity.findOneBy({ id: interviewerId });

    if (!candidateName) {
      throw new CoolCommException('候选人姓名不能为空');
    }

    if (!position) {
      throw new CoolCommException('职位不能为空');
    }

    if (!interviewerId) {
      throw new CoolCommException('面试官不能为空');
    }

    if (!interviewer) {
      throw new CoolCommException('面试官不存在');
    }

    if (!interviewDate) {
      throw new CoolCommException('面试时间不能为空');
    }

    const interviewType = this.normalizeInterviewType(payload.interviewType);
    const status = this.normalizeStatus(
      mode === 'add' ? payload.status || 'scheduled' : payload.status
    );
    const score = this.normalizeScore(payload.score);

    await this.assertCanManageDepartment(departmentId, perms);

    return {
      candidateName,
      position,
      departmentId,
      interviewerId,
      interviewDate,
      interviewType,
      score,
      status,
    };
  }

  private async requireInterview(id: number) {
    const interview = await this.performanceInterviewEntity.findOneBy({ id });

    if (!interview) {
      throw new CoolCommException('数据不存在');
    }

    return interview;
  }

  private async buildInterviewDetail(interview: PerformanceInterviewEntity) {
    const interviewer = await this.baseSysUserEntity.findOneBy({
      id: interview.interviewerId,
    });

    return this.normalizeInterview({
      ...interview,
      interviewerName: interviewer?.name || '',
    });
  }

  private normalizeInterview(item: any) {
    return {
      id: Number(item.id),
      candidateName: item.candidateName || '',
      position: item.position || '',
      departmentId: this.normalizeNullableNumber(item.departmentId),
      interviewerId: Number(item.interviewerId),
      interviewerName: item.interviewerName || '',
      interviewDate: item.interviewDate || '',
      interviewType: item.interviewType || null,
      score: this.normalizeScore(item.score),
      status: item.status,
      createTime: item.createTime,
      updateTime: item.updateTime,
    };
  }

  private normalizeNullableNumber(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  private normalizeScore(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = Number(value);

    if (!Number.isFinite(normalized)) {
      throw new CoolCommException('面试分数不合法');
    }

    return normalized;
  }

  private normalizeInterviewType(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const interviewType = String(value).trim();

    if (!INTERVIEW_TYPES.includes(interviewType)) {
      throw new CoolCommException('面试类型不合法');
    }

    return interviewType;
  }

  private normalizeStatus(value: any) {
    const status = String(value || 'scheduled').trim();

    if (!INTERVIEW_STATUS.includes(status)) {
      throw new CoolCommException('面试状态不合法');
    }

    return status;
  }

  private normalizeStartDate(value: any) {
    const date = String(value || '').trim();
    if (date.length === 10) {
      return `${date} 00:00:00`;
    }
    return date;
  }

  private normalizeEndDate(value: any) {
    const date = String(value || '').trim();
    if (date.length === 10) {
      return `${date} 23:59:59`;
    }
    return date;
  }

  private isTerminal(status: string) {
    return status === 'completed' || status === 'cancelled';
  }
}
