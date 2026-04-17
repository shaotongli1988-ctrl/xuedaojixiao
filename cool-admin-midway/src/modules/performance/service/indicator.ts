/**
 * 指标库领域服务。
 * 这里只负责指标分页、详情和 CRUD 校验，不负责共享鉴权链路或其他绩效模块联动逻辑。
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
import { PerformanceIndicatorEntity } from '../entity/indicator';
import * as jwt from 'jsonwebtoken';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

const INDICATOR_CATEGORIES = ['assessment', 'goal', 'feedback'];
const INDICATOR_APPLY_SCOPES = ['all', 'department', 'employee'];
const INDICATOR_STATUS = [0, 1];

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceIndicatorService extends BaseService {
  @InjectEntityModel(PerformanceIndicatorEntity)
  performanceIndicatorEntity: Repository<PerformanceIndicatorEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:indicator:page',
    info: 'performance:indicator:info',
    add: 'performance:indicator:add',
    update: 'performance:indicator:update',
    delete: 'performance:indicator:delete',
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
    this.assertPerm(perms, this.perms.page, '无权限查看指标库');

    const page = Number(query.page || 1);
    const size = Number(query.size || 20);
    const qb = this.performanceIndicatorEntity
      .createQueryBuilder('indicator')
      .select([
        'indicator.id as id',
        'indicator.name as name',
        'indicator.code as code',
        'indicator.category as category',
        'indicator.weight as weight',
        'indicator.scoreScale as scoreScale',
        'indicator.applyScope as applyScope',
        'indicator.description as description',
        'indicator.status as status',
        'indicator.createTime as createTime',
        'indicator.updateTime as updateTime',
      ]);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('indicator.name like :keyword', { keyword })
            .orWhere('indicator.code like :keyword', { keyword });
        })
      );
    }

    if (query.category) {
      qb.andWhere('indicator.category = :category', {
        category: query.category,
      });
    }

    if (query.status !== undefined && query.status !== null && query.status !== '') {
      qb.andWhere('indicator.status = :status', {
        status: Number(query.status),
      });
    }

    qb.orderBy('indicator.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeIndicator(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看指标详情');

    return this.normalizeIndicator(await this.requireIndicator(id));
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增指标');

    const normalized = await this.normalizePayload(payload);
    await this.assertCodeUnique(normalized.code);

    const saved = await this.performanceIndicatorEntity.save(
      this.performanceIndicatorEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateIndicator(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改指标');

    const id = Number(payload.id);
    await this.requireIndicator(id);

    const normalized = await this.normalizePayload(payload);
    await this.assertCodeUnique(normalized.code, id);

    await this.performanceIndicatorEntity.update({ id }, normalized);

    return this.info(id);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.delete, '无权限删除指标');

    const validIds = (ids || [])
      .map(item => Number(item))
      .filter(item => Number.isInteger(item) && item > 0);

    if (!validIds.length) {
      return;
    }

    await this.performanceIndicatorEntity.delete(validIds);
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

  private async requireIndicator(id: number) {
    const indicator = await this.performanceIndicatorEntity.findOneBy({ id });

    if (!indicator) {
      throw new CoolCommException('数据不存在');
    }

    return indicator;
  }

  private async assertCodeUnique(code: string, excludeId?: number) {
    const exists = await this.performanceIndicatorEntity.findOneBy({ code });

    if (exists && Number(exists.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('指标编码已存在');
    }
  }

  private async normalizePayload(payload: any) {
    const name = String(payload.name || '').trim();
    const code = String(payload.code || '').trim();
    const category = String(payload.category || 'assessment').trim();
    const applyScope = String(payload.applyScope || 'all').trim();
    const description = payload.description
      ? String(payload.description).trim()
      : '';
    const weight = Number(payload.weight ?? 0);
    const scoreScale = Number(payload.scoreScale ?? 100);
    const status = Number(payload.status ?? 1);

    if (!name) {
      throw new CoolCommException('指标名称不能为空');
    }

    if (!code) {
      throw new CoolCommException('指标编码不能为空');
    }

    if (!INDICATOR_CATEGORIES.includes(category)) {
      throw new CoolCommException('指标类型不合法');
    }

    if (!INDICATOR_APPLY_SCOPES.includes(applyScope)) {
      throw new CoolCommException('适用范围不合法');
    }

    if (!Number.isFinite(weight) || weight < 0) {
      throw new CoolCommException('权重必须大于等于 0');
    }

    if (!Number.isInteger(scoreScale) || scoreScale <= 0) {
      throw new CoolCommException('满分必须为正整数');
    }

    if (!INDICATOR_STATUS.includes(status)) {
      throw new CoolCommException('指标状态不合法');
    }

    return {
      name,
      code,
      category,
      weight: this.normalizeDecimal(weight),
      scoreScale,
      applyScope,
      description,
      status,
    };
  }

  private normalizeIndicator(item: any) {
    return {
      ...item,
      id: Number(item.id),
      weight: this.normalizeDecimal(item.weight),
      scoreScale: Number(item.scoreScale),
      status: Number(item.status),
    };
  }

  private normalizeDecimal(value: any) {
    const normalized = Number(value || 0);
    return Number.isFinite(normalized) ? Number(normalized.toFixed(2)) : 0;
  }
}
