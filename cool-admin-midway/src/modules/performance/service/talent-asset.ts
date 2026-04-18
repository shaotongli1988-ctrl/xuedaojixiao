/**
 * 招聘人才资产领域服务。
 * 这里只负责主题12首批冻结的摘要主链 `page/info/add/update/delete`，不负责面试自动创建、简历全文管理或录用流程。
 * 维护重点是部门树范围、状态流转、删除约束和隐私字段白名单必须由服务端兜底。
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
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { PerformanceTalentAssetEntity } from '../entity/talent-asset';
import * as jwt from 'jsonwebtoken';

type TalentAssetStatus = 'new' | 'tracking' | 'archived';

const TALENT_ASSET_STATUS: TalentAssetStatus[] = ['new', 'tracking', 'archived'];

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

  if (!text) {
    throw new CoolCommException(message);
  }

  if (text.length > maxLength) {
    throw new CoolCommException(message);
  }

  return text;
}

function normalizeOptionalText(value: any, maxLength: number) {
  const text = String(value ?? '').trim();

  if (!text) {
    return null;
  }

  if (text.length > maxLength) {
    return text.slice(0, maxLength);
  }

  return text;
}

function normalizeRequiredPositiveInt(value: any, message: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(message);
  }

  return parsed;
}

function normalizeOptionalCode(value: any) {
  const code = String(value ?? '').trim();

  if (!code) {
    return null;
  }

  if (code.length > 100) {
    throw new CoolCommException('人才资产编码长度不合法');
  }

  return code;
}

function normalizeTagList(value: any) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? (() => {
          const text = value.trim();

          if (!text) {
            return [];
          }

          try {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed : [text];
          } catch (error) {
            return text.split(',');
          }
        })()
      : [];

  return Array.from(
    new Set(
      source
        .map(item => String(item || '').trim())
        .filter(item => !!item)
        .map(item => item.slice(0, 30))
    )
  ).slice(0, 20);
}

function parseTagList(value: any) {
  return normalizeTagList(value);
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTalentAssetService extends BaseService {
  @InjectEntityModel(PerformanceTalentAssetEntity)
  performanceTalentAssetEntity: Repository<PerformanceTalentAssetEntity>;

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
    page: 'performance:talentAsset:page',
    info: 'performance:talentAsset:info',
    add: 'performance:talentAsset:add',
    update: 'performance:talentAsset:update',
    delete: 'performance:talentAsset:delete',
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
    this.assertPerm(perms, this.perms.page, '无权限查看人才资产列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const departmentIds = await this.departmentScopeIds(perms);
    const qb = this.performanceTalentAssetEntity
      .createQueryBuilder('talentAsset')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = talentAsset.targetDepartmentId'
      )
      .select([
        'talentAsset.id as id',
        'talentAsset.candidateName as candidateName',
        'talentAsset.code as code',
        'talentAsset.targetDepartmentId as targetDepartmentId',
        'department.name as targetDepartmentName',
        'talentAsset.targetPosition as targetPosition',
        'talentAsset.source as source',
        'talentAsset.tagList as tagList',
        'talentAsset.followUpSummary as followUpSummary',
        'talentAsset.nextFollowUpDate as nextFollowUpDate',
        'talentAsset.status as status',
        'talentAsset.createTime as createTime',
        'talentAsset.updateTime as updateTime',
      ]);

    this.applyScope(qb, departmentIds);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('talentAsset.candidateName like :keyword', { keyword })
            .orWhere('talentAsset.targetPosition like :keyword', { keyword });
        })
      );
    }

    if (query.targetDepartmentId !== undefined && query.targetDepartmentId !== null) {
      const targetDepartmentId = Number(query.targetDepartmentId);

      if (!Number.isInteger(targetDepartmentId) || targetDepartmentId <= 0) {
        throw new CoolCommException('目标部门不合法');
      }

      qb.andWhere('talentAsset.targetDepartmentId = :targetDepartmentId', {
        targetDepartmentId,
      });
    }

    if (query.source) {
      qb.andWhere('talentAsset.source like :source', {
        source: `%${String(query.source).trim()}%`,
      });
    }

    if (query.tag) {
      qb.andWhere('talentAsset.tagList like :tag', {
        tag: `%${String(query.tag).trim()}%`,
      });
    }

    if (query.status) {
      qb.andWhere('talentAsset.status = :status', {
        status: this.normalizeStatus(query.status),
      });
    }

    qb.orderBy('talentAsset.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeTalentAssetRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看人才资产详情');

    const talentAsset = await this.requireTalentAsset(id);
    await this.assertTalentAssetInScope(talentAsset, perms, '无权查看人才资产');

    return this.buildTalentAssetDetail(talentAsset);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增人才资产');

    const normalized = await this.normalizePayload(payload, null, perms, 'add');
    const saved = await this.performanceTalentAssetEntity.save(
      this.performanceTalentAssetEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateTalentAsset(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改人才资产');

    const talentAsset = await this.requireTalentAsset(Number(payload.id));
    await this.assertTalentAssetInScope(talentAsset, perms, '无权修改人才资产');

    const normalized = await this.normalizePayload(
      payload,
      talentAsset,
      perms,
      'update'
    );

    await this.performanceTalentAssetEntity.update(
      { id: talentAsset.id },
      normalized
    );

    return this.info(talentAsset.id);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.delete, '无权限删除人才资产');

    const validIds = Array.from(
      new Set(
        (ids || [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );

    if (!validIds.length) {
      return;
    }

    const rows = await this.performanceTalentAssetEntity.findBy({
      id: In(validIds),
    });

    if (rows.length !== validIds.length) {
      throw new CoolCommException('数据不存在');
    }

    rows.forEach(item => {
      if (item.status !== 'new') {
        throw new CoolCommException('当前状态不允许删除');
      }
    });

    await this.performanceTalentAssetEntity.delete(validIds);
  }

  private async normalizePayload(
    payload: any,
    existing: PerformanceTalentAssetEntity | null,
    perms: string[],
    mode: 'add' | 'update'
  ) {
    const candidateName = normalizeRequiredText(
      payload.candidateName ?? existing?.candidateName,
      100,
      '候选人姓名不能为空'
    );
    const code = normalizeOptionalCode(payload.code ?? existing?.code);
    const targetDepartmentId = normalizeRequiredPositiveInt(
      payload.targetDepartmentId ?? existing?.targetDepartmentId,
      '目标部门不能为空'
    );
    const targetPosition = normalizeOptionalText(
      payload.targetPosition ?? existing?.targetPosition,
      100
    );
    const source = normalizeRequiredText(
      payload.source ?? existing?.source,
      100,
      '来源摘要不能为空'
    );
    const tagList =
      payload.tagList !== undefined
        ? normalizeTagList(payload.tagList)
        : normalizeTagList(existing?.tagList || []);
    const followUpSummary = normalizeOptionalText(
      payload.followUpSummary ?? existing?.followUpSummary,
      2000
    );
    const nextFollowUpDate = normalizeOptionalText(
      payload.nextFollowUpDate ?? existing?.nextFollowUpDate,
      19
    );
    const status = this.resolveNextStatus(
      mode,
      existing?.status as TalentAssetStatus | undefined,
      payload.status
    );

    await this.assertCanManageDepartment(targetDepartmentId, perms);
    await this.assertCodeUnique(code, existing?.id);

    return {
      candidateName,
      code,
      targetDepartmentId,
      targetPosition,
      source,
      tagList,
      followUpSummary,
      nextFollowUpDate,
      status,
    };
  }

  private resolveNextStatus(
    mode: 'add' | 'update',
    currentStatus: TalentAssetStatus | undefined,
    statusInput: any
  ) {
    const nextStatus = this.normalizeStatus(statusInput || currentStatus || 'new');

    if (mode === 'add') {
      if (nextStatus !== 'new') {
        throw new CoolCommException('新增人才资产状态只能为 new');
      }
      return nextStatus;
    }

    if (currentStatus === 'archived') {
      throw new CoolCommException('当前状态不允许编辑');
    }

    if (currentStatus === 'new' && ['new', 'tracking', 'archived'].includes(nextStatus)) {
      return nextStatus;
    }

    if (currentStatus === 'tracking' && ['tracking', 'archived'].includes(nextStatus)) {
      return nextStatus;
    }

    throw new CoolCommException('当前状态不允许执行该操作');
  }

  private normalizeStatus(value: any) {
    const status = String(value || 'new').trim() as TalentAssetStatus;

    if (!TALENT_ASSET_STATUS.includes(status)) {
      throw new CoolCommException('人才资产状态不合法');
    }

    return status;
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

  private isHr(perms: string[]) {
    return (
      this.currentAdmin?.isAdmin === true ||
      this.currentAdmin?.username === 'admin' ||
      this.hasPerm(perms, this.perms.delete)
    );
  }

  private async departmentScopeIds(perms: string[]) {
    if (this.isHr(perms)) {
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

    qb.andWhere('talentAsset.targetDepartmentId in (:...departmentIds)', {
      departmentIds,
    });
  }

  private async assertTalentAssetInScope(
    talentAsset: PerformanceTalentAssetEntity,
    perms: string[],
    message: string
  ) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);

    if (!departmentIds?.includes(Number(talentAsset.targetDepartmentId || 0))) {
      throw new CoolCommException(message);
    }
  }

  private async assertCanManageDepartment(targetDepartmentId: number, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);

    if (!departmentIds?.includes(targetDepartmentId)) {
      throw new CoolCommException('无权操作该人才资产');
    }
  }

  private async assertCodeUnique(code?: string | null, excludeId?: number) {
    if (!code) {
      return;
    }

    const exists = await this.performanceTalentAssetEntity.findOneBy({ code });

    if (exists && Number(exists.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('人才资产编码已存在');
    }
  }

  private async requireTalentAsset(id: number) {
    const talentAsset = await this.performanceTalentAssetEntity.findOneBy({ id });

    if (!talentAsset) {
      throw new CoolCommException('数据不存在');
    }

    return talentAsset;
  }

  private normalizeTalentAssetRow(item: any) {
    return {
      id: Number(item.id),
      candidateName: item.candidateName || '',
      code: item.code || null,
      targetDepartmentId: Number(item.targetDepartmentId || 0),
      targetDepartmentName: item.targetDepartmentName || '',
      targetPosition: item.targetPosition || null,
      source: item.source || '',
      tagList: parseTagList(item.tagList),
      followUpSummary: item.followUpSummary || null,
      nextFollowUpDate: item.nextFollowUpDate || null,
      status: item.status || 'new',
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private async buildTalentAssetDetail(talentAsset: PerformanceTalentAssetEntity) {
    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: Number(talentAsset.targetDepartmentId),
    });

    return this.normalizeTalentAssetRow({
      ...talentAsset,
      targetDepartmentName: department?.name || '',
    });
  }
}
