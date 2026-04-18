/**
 * 主题13能力地图领域服务。
 * 这里负责能力模型分页/详情/维护、能力项详情和能力画像摘要，不负责人才档案全文、简历主链、课程学习过程或移动端入口。
 * 维护重点是经理只能查看定义与部门树范围内画像摘要，员工无入口，且返回字段必须保持摘要裁剪。
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
import * as jwt from 'jsonwebtoken';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceCapabilityItemEntity } from '../entity/capability-item';
import { PerformanceCapabilityModelEntity } from '../entity/capability-model';
import { PerformanceCapabilityPortraitEntity } from '../entity/capability-portrait';
import { PerformanceCertificateRecordEntity } from '../entity/certificate-record';
import {
  assertCapabilityModelTransition,
  normalizeCapabilityArray,
  normalizeCapabilityModelPayload,
} from './capability-helper';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

const normalizePagination = (value: any, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceCapabilityService extends BaseService {
  @InjectEntityModel(PerformanceCapabilityModelEntity)
  performanceCapabilityModelEntity: Repository<PerformanceCapabilityModelEntity>;

  @InjectEntityModel(PerformanceCapabilityItemEntity)
  performanceCapabilityItemEntity: Repository<PerformanceCapabilityItemEntity>;

  @InjectEntityModel(PerformanceCapabilityPortraitEntity)
  performanceCapabilityPortraitEntity: Repository<PerformanceCapabilityPortraitEntity>;

  @InjectEntityModel(PerformanceCertificateRecordEntity)
  performanceCertificateRecordEntity: Repository<PerformanceCertificateRecordEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

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
    modelPage: 'performance:capabilityModel:page',
    modelInfo: 'performance:capabilityModel:info',
    modelAdd: 'performance:capabilityModel:add',
    modelUpdate: 'performance:capabilityModel:update',
    itemInfo: 'performance:capabilityItem:info',
    portraitInfo: 'performance:capabilityPortrait:info',
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

  async modelPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.modelPage, '无权限查看能力模型列表');

    const page = normalizePagination(query.page, 1);
    const size = normalizePagination(query.size, 20);
    const qb = this.performanceCapabilityModelEntity
      .createQueryBuilder('model')
      .select([
        'model.id as id',
        'model.name as name',
        'model.code as code',
        'model.category as category',
        'model.description as description',
        'model.status as status',
        'model.createTime as createTime',
        'model.updateTime as updateTime',
      ]);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('model.name like :keyword', { keyword })
            .orWhere('model.code like :keyword', { keyword });
        })
      );
    }

    if (query.category) {
      qb.andWhere('model.category = :category', {
        category: String(query.category).trim(),
      });
    }

    if (query.status) {
      qb.andWhere('model.status = :status', {
        status: String(query.status).trim(),
      });
    }

    qb.orderBy('model.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();
    const countMap = await this.loadItemCountMap(list.map(item => Number(item.id)));

    return {
      list: list.map(item => this.normalizeModelRow(item, countMap)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async modelInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.modelInfo, '无权限查看能力模型详情');

    const model = await this.requireModel(id);
    const countMap = await this.loadItemCountMap([model.id]);
    return this.normalizeModelRow(model, countMap);
  }

  async addModel(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.modelAdd, '无权限新增能力模型');

    const normalized = normalizeCapabilityModelPayload(payload);
    assertCapabilityModelTransition(undefined, normalized.status, 'add');
    await this.assertModelCodeUnique(normalized.code);

    const saved = await this.performanceCapabilityModelEntity.save(
      this.performanceCapabilityModelEntity.create(normalized)
    );

    return this.modelInfo(saved.id);
  }

  async updateModel(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.modelUpdate, '无权限修改能力模型');

    const model = await this.requireModel(Number(payload.id || 0));
    const normalized = normalizeCapabilityModelPayload({
      ...model,
      ...payload,
    });
    assertCapabilityModelTransition(model.status as any, normalized.status, 'update');
    await this.assertModelCodeUnique(normalized.code, model.id);

    await this.performanceCapabilityModelEntity.update({ id: model.id }, normalized);
    return this.modelInfo(model.id);
  }

  async itemInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.itemInfo, '无权限查看能力项详情');

    const item = await this.performanceCapabilityItemEntity.findOneBy({ id });

    if (!item) {
      throw new CoolCommException('能力项不存在');
    }

    return this.normalizeItem(item);
  }

  async portraitInfo(employeeId: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.portraitInfo, '无权限查看能力画像摘要');

    const normalizedEmployeeId = Number(employeeId || 0);

    if (!Number.isInteger(normalizedEmployeeId) || normalizedEmployeeId <= 0) {
      throw new CoolCommException('员工 ID 不合法');
    }

    const portrait = await this.performanceCapabilityPortraitEntity.findOneBy({
      employeeId: normalizedEmployeeId,
    });

    if (!portrait) {
      throw new CoolCommException('能力画像不存在');
    }

    const employee = await this.baseSysUserEntity.findOneBy({ id: normalizedEmployeeId });
    const departmentId = Number(portrait.departmentId || employee?.departmentId || 0) || null;
    await this.assertDepartmentScope(
      departmentId,
      perms,
      '无权限查看能力画像摘要'
    );

    const department = departmentId
      ? await this.baseSysDepartmentEntity.findOneBy({ id: departmentId })
      : null;
    const records = await this.performanceCertificateRecordEntity.findBy({
      employeeId: normalizedEmployeeId,
      status: 'issued',
    } as any);
    const issuedTimes = records
      .map(item => String(item.issuedAt || '').trim())
      .filter(Boolean)
      .sort();

    return {
      employeeId: normalizedEmployeeId,
      employeeName: employee?.name || '',
      departmentId,
      departmentName: department?.name || null,
      capabilityTags: normalizeCapabilityArray(portrait.capabilityTags),
      levelSummary: normalizeCapabilityArray(portrait.levelSummary),
      certificateCount: records.length,
      lastCertifiedAt: issuedTimes.length ? issuedTimes[issuedTimes.length - 1] : null,
      updatedAt: portrait.updatedAt,
    };
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

  private async requireModel(id: number) {
    const modelId = Number(id || 0);

    if (!Number.isInteger(modelId) || modelId <= 0) {
      throw new CoolCommException('能力模型 ID 不合法');
    }

    const model = await this.performanceCapabilityModelEntity.findOneBy({ id: modelId });

    if (!model) {
      throw new CoolCommException('能力模型不存在');
    }

    return model;
  }

  private async assertModelCodeUnique(code: string | null, excludeId?: number) {
    if (!code) {
      return;
    }

    const existing = await this.performanceCapabilityModelEntity.findOneBy({ code });

    if (existing && Number(existing.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('能力模型编码已存在');
    }
  }

  private async loadItemCountMap(ids: number[]) {
    const validIds = Array.from(
      new Set(ids.filter(item => Number.isInteger(item) && item > 0))
    );

    const result = new Map<number, number>();

    if (!validIds.length) {
      return result;
    }

    const items = await this.performanceCapabilityItemEntity.findBy({
      modelId: In(validIds),
    });

    items.forEach(item => {
      const modelId = Number(item.modelId);
      result.set(modelId, (result.get(modelId) || 0) + 1);
    });

    return result;
  }

  private normalizeModelRow(row: any, countMap: Map<number, number>) {
    const id = Number(row.id);
    return {
      id,
      name: row.name,
      code: row.code ?? null,
      category: row.category ?? null,
      description: row.description ?? null,
      status: row.status,
      itemCount: countMap.get(id) || 0,
      createTime: row.createTime,
      updateTime: row.updateTime,
    };
  }

  private normalizeItem(item: PerformanceCapabilityItemEntity) {
    return {
      id: item.id,
      modelId: Number(item.modelId),
      name: item.name,
      level: item.level ?? null,
      description: item.description ?? null,
      evidenceHint: item.evidenceHint ?? null,
      updateTime: item.updateTime,
    };
  }

  private hasHrScope(perms: string[]) {
    return (
      perms.includes(this.perms.modelAdd) ||
      perms.includes(this.perms.modelUpdate) ||
      Boolean(this.currentAdmin?.isAdmin) ||
      this.currentAdmin?.username === 'admin'
    );
  }

  private async departmentScopeIds(perms: string[]) {
    if (this.hasHrScope(perms)) {
      return null;
    }

    const userId = Number(this.currentAdmin?.userId || 0);

    if (!userId) {
      throw new CoolCommException('登录上下文缺失');
    }

    const ids = await this.baseSysPermsService.departmentIds(userId);
    return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
  }

  private async assertDepartmentScope(
    departmentId: number | null,
    perms: string[],
    message: string
  ) {
    const scopeIds = await this.departmentScopeIds(perms);

    if (scopeIds === null) {
      return;
    }

    if (!departmentId || !scopeIds.includes(Number(departmentId))) {
      throw new CoolCommException(message);
    }
  }
}
