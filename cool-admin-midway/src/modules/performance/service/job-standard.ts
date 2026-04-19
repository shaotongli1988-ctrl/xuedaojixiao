/**
 * 职位标准领域服务。
 * 这里只负责主题17冻结的 page/info/add/update/setStatus 主链，不负责招聘计划、简历池、面试、录用或设计器扩展。
 * 维护重点是 HR 全量可写、经理部门树范围只读、员工拒绝，以及 draft/active/inactive 状态机必须由服务端硬兜底。
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
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceJobStandardEntity } from '../entity/job-standard';
import * as jwt from 'jsonwebtoken';

const JOB_STANDARD_STATUS = ['draft', 'active', 'inactive'];

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceJobStandardService extends BaseService {
  @InjectEntityModel(PerformanceJobStandardEntity)
  performanceJobStandardEntity: Repository<PerformanceJobStandardEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:jobStandard:page',
    info: 'performance:jobStandard:info',
    add: 'performance:jobStandard:add',
    update: 'performance:jobStandard:update',
    setStatus: 'performance:jobStandard:setStatus',
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
    this.assertPerm(perms, this.perms.page, '无权限查看职位标准列表');

    const page = this.normalizePageNumber(query.page, 1);
    const size = this.normalizePageNumber(query.size, 20);
    const departmentIds = await this.departmentScopeIds(perms);
    const qb = this.performanceJobStandardEntity
      .createQueryBuilder('jobStandard')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = jobStandard.targetDepartmentId'
      )
      .select([
        'jobStandard.id as id',
        'jobStandard.positionName as positionName',
        'jobStandard.targetDepartmentId as targetDepartmentId',
        'department.name as targetDepartmentName',
        'jobStandard.jobLevel as jobLevel',
        'jobStandard.profileSummary as profileSummary',
        'jobStandard.requirementSummary as requirementSummary',
        'jobStandard.skillTagList as skillTagList',
        'jobStandard.interviewTemplateSummary as interviewTemplateSummary',
        'jobStandard.status as status',
        'jobStandard.createTime as createTime',
        'jobStandard.updateTime as updateTime',
      ]);

    this.applyScope(qb, departmentIds);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('jobStandard.positionName like :keyword', { keyword })
            .orWhere('jobStandard.requirementSummary like :keyword', { keyword });
        })
      );
    }

    if (query.targetDepartmentId) {
      qb.andWhere('jobStandard.targetDepartmentId = :targetDepartmentId', {
        targetDepartmentId: Number(query.targetDepartmentId),
      });
    }

    if (query.status) {
      qb.andWhere('jobStandard.status = :status', {
        status: this.normalizeStatus(query.status),
      });
    }

    qb.orderBy('jobStandard.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeRecord(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看职位标准详情');

    const record = await this.requireJobStandard(id);
    await this.assertReadableInScope(record, perms, '无权查看该职位标准');
    return this.buildDetail(record);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增职位标准');

    const normalized = await this.normalizePayload(payload, null, 'add');
    const saved = await this.performanceJobStandardEntity.save(
      this.performanceJobStandardEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateJobStandard(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改职位标准');

    const record = await this.requireJobStandard(Number(payload.id));
    await this.assertReadableInScope(record, perms, '无权修改该职位标准');

    if (record.status === 'inactive') {
      throw new CoolCommException('停用中的职位标准不可直接编辑');
    }

    const normalized = await this.normalizePayload(payload, record, 'update');
    await this.performanceJobStandardEntity.update({ id: record.id }, normalized);

    return this.info(record.id);
  }

  async setStatus(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.setStatus, '无权限更新职位标准状态');

    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new CoolCommException('职位标准 ID 不合法');
    }

    const targetStatus = this.normalizeStatus(payload.status);
    const record = await this.requireJobStandard(id);
    const currentStatus = String(record.status || '').trim();

    if (!this.canTransit(currentStatus, targetStatus)) {
      throw new CoolCommException('当前状态不允许切换到目标状态');
    }

    await this.performanceJobStandardEntity.update(
      { id: record.id },
      { status: targetStatus }
    );

    return this.info(record.id);
  }

  private async currentPerms() {
    const admin = this.currentAdmin;

    if (!admin?.roleIds) {
      throw new CoolCommException('登录状态已失效');
    }

    return this.baseSysMenuService.getPerms(admin.roleIds);
  }

  private assertPerm(perms: string[], perm: string, message: string) {
    if (!perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }

  private hasGlobalScope(perms: string[]) {
    return (
      this.currentAdmin?.username === 'admin' ||
      perms.includes(this.perms.add) ||
      perms.includes(this.perms.update) ||
      perms.includes(this.perms.setStatus)
    );
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

    qb.andWhere('jobStandard.targetDepartmentId in (:...departmentIds)', {
      departmentIds,
    });
  }

  private async assertReadableInScope(
    record: PerformanceJobStandardEntity,
    perms: string[],
    message: string
  ) {
    if (this.hasGlobalScope(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);
    const targetDepartmentId = Number(record.targetDepartmentId || 0);

    if (!targetDepartmentId || !departmentIds?.includes(targetDepartmentId)) {
      throw new CoolCommException(message);
    }
  }

  private async requireJobStandard(id: number) {
    const record = await this.performanceJobStandardEntity.findOneBy({ id });

    if (!record) {
      throw new CoolCommException('数据不存在');
    }

    return record;
  }

  private async buildDetail(record: PerformanceJobStandardEntity) {
    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: Number(record.targetDepartmentId),
    });

    return this.normalizeRecord({
      ...record,
      targetDepartmentName: department?.name || '',
    });
  }

  private async normalizePayload(
    payload: any,
    existing: PerformanceJobStandardEntity | null,
    mode: 'add' | 'update'
  ) {
    const positionName = String(
      payload.positionName ?? existing?.positionName ?? ''
    ).trim();
    const targetDepartmentId = Number(
      payload.targetDepartmentId ?? existing?.targetDepartmentId ?? 0
    );

    if (!positionName) {
      throw new CoolCommException('岗位名称不能为空');
    }

    if (!Number.isInteger(targetDepartmentId) || targetDepartmentId <= 0) {
      throw new CoolCommException('目标部门不能为空');
    }

    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: targetDepartmentId,
    });
    if (!department) {
      throw new CoolCommException('目标部门不存在');
    }

    const jobLevel = this.normalizeOptionalText(
      payload.jobLevel ?? existing?.jobLevel
    );
    const profileSummary = this.normalizeOptionalText(
      payload.profileSummary ?? existing?.profileSummary
    );
    const requirementSummary = this.normalizeOptionalText(
      payload.requirementSummary ?? existing?.requirementSummary
    );
    const interviewTemplateSummary = this.normalizeOptionalText(
      payload.interviewTemplateSummary ?? existing?.interviewTemplateSummary
    );
    const skillTagList =
      payload.skillTagList !== undefined
        ? this.normalizeSkillTagList(payload.skillTagList)
        : this.normalizeSkillTagList(existing?.skillTagList ?? []);

    if (mode === 'add') {
      const inputStatus =
        payload.status === undefined || payload.status === null || payload.status === ''
          ? 'draft'
          : this.normalizeStatus(payload.status);

      if (inputStatus !== 'draft') {
        throw new CoolCommException('新增职位标准默认保存为草稿');
      }
    } else if (
      payload.status !== undefined &&
      payload.status !== null &&
      payload.status !== '' &&
      this.normalizeStatus(payload.status) !== existing?.status
    ) {
      throw new CoolCommException('请使用启停用动作更新状态');
    }

    return {
      positionName,
      targetDepartmentId,
      jobLevel,
      profileSummary,
      requirementSummary,
      skillTagList,
      interviewTemplateSummary,
      status: mode === 'add' ? 'draft' : existing?.status || 'draft',
    };
  }

  private normalizeRecord(item: any) {
    return {
      id: Number(item.id),
      positionName: item.positionName || '',
      targetDepartmentId: Number(item.targetDepartmentId || 0),
      targetDepartmentName: item.targetDepartmentName || '',
      jobLevel: this.normalizeOptionalText(item.jobLevel),
      profileSummary: this.normalizeOptionalText(item.profileSummary),
      requirementSummary: this.normalizeOptionalText(item.requirementSummary),
      skillTagList: this.normalizeSkillTagList(item.skillTagList),
      interviewTemplateSummary: this.normalizeOptionalText(
        item.interviewTemplateSummary
      ),
      status: this.normalizeStatus(item.status),
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private normalizeSkillTagList(value: any) {
    let list = value;

    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) {
        list = [];
      } else {
        try {
          list = JSON.parse(text);
        } catch (error) {
          list = text.split(',');
        }
      }
    }

    if (!Array.isArray(list)) {
      return [];
    }

    return Array.from(
      new Set(
        list
          .map(item => String(item || '').trim())
          .filter(item => !!item)
      )
    );
  }

  private normalizeOptionalText(value: any) {
    const text = String(value ?? '').trim();
    return text ? text : null;
  }

  private normalizeStatus(value: any) {
    const status = String(value || '').trim();

    if (!JOB_STANDARD_STATUS.includes(status)) {
      throw new CoolCommException('职位标准状态不合法');
    }

    return status;
  }

  private canTransit(currentStatus: string, targetStatus: string) {
    if (currentStatus === 'draft' && targetStatus === 'active') {
      return true;
    }
    if (currentStatus === 'active' && targetStatus === 'inactive') {
      return true;
    }
    if (currentStatus === 'inactive' && targetStatus === 'active') {
      return true;
    }
    return false;
  }

  private normalizePageNumber(value: any, fallback: number) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
