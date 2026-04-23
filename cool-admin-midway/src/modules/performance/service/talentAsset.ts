/**
 * 招聘人才资产领域服务。
 * 这里只负责主题12首批冻结的摘要主链 `page/info/add/update/delete`，不负责面试自动创建、简历全文管理或录用流程。
 * 维护重点是部门树范围、状态流转、删除约束和隐私字段白名单必须由服务端兜底。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { PerformanceTalentAssetEntity } from '../entity/talentAsset';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import { TALENT_ASSET_STATUS_VALUES } from './talent-asset-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

type TalentAssetStatus = (typeof TALENT_ASSET_STATUS_VALUES)[number];
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateActionNotAllowed
  );
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateDeleteNotAllowed
  );
const PERFORMANCE_TARGET_DEPARTMENT_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired
  );

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
  performanceAccessContextService: PerformanceAccessContextService;

  private readonly perms = {
    page: PERMISSIONS.performance.talentAsset.page,
    info: PERMISSIONS.performance.talentAsset.info,
    add: PERMISSIONS.performance.talentAsset.add,
    update: PERMISSIONS.performance.talentAsset.update,
    delete: PERMISSIONS.performance.talentAsset.delete,
  };

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.talentAsset.page]: 'talent_asset.read',
    [PERMISSIONS.performance.talentAsset.info]: 'talent_asset.read',
    [PERMISSIONS.performance.talentAsset.add]: 'talent_asset.create',
    [PERMISSIONS.performance.talentAsset.update]: 'talent_asset.update',
    [PERMISSIONS.performance.talentAsset.delete]: 'talent_asset.delete',
  };

  async page(query: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.page, '无权限查看人才资产列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const departmentIds = await this.departmentScopeIds(
      access,
      'talent_asset.read'
    );
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
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.info, '无权限查看人才资产详情');

    const talentAsset = await this.requireTalentAsset(id);
    await this.assertTalentAssetInScope(
      talentAsset,
      access,
      'talent_asset.read',
      '无权查看人才资产'
    );

    return this.buildTalentAssetDetail(talentAsset);
  }

  async add(payload: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.add, '无权限新增人才资产');

    const normalized = await this.normalizePayload(payload, null, access, 'add');
    const saved = await this.performanceTalentAssetEntity.save(
      this.performanceTalentAssetEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateTalentAsset(payload: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.update, '无权限修改人才资产');

    const talentAsset = await this.requireTalentAsset(Number(payload.id));
    await this.assertTalentAssetInScope(
      talentAsset,
      access,
      'talent_asset.update',
      '无权修改人才资产'
    );

    const normalized = await this.normalizePayload(
      payload,
      talentAsset,
      access,
      'update'
    );

    await this.performanceTalentAssetEntity.update(
      { id: talentAsset.id },
      normalized
    );

    return this.info(talentAsset.id);
  }

  async delete(ids: number[]) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.delete, '无权限删除人才资产');

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
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    rows.forEach(item => {
      if (item.status !== 'new') {
        throw new CoolCommException(PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE);
      }
    });

    await this.performanceTalentAssetEntity.delete(validIds);
  }

  private async normalizePayload(
    payload: any,
    existing: PerformanceTalentAssetEntity | null,
    access: PerformanceResolvedAccessContext,
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
      PERFORMANCE_TARGET_DEPARTMENT_REQUIRED_MESSAGE
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

    await this.assertCanManageDepartment(
      targetDepartmentId,
      access,
      mode === 'add' ? 'talent_asset.create' : 'talent_asset.update'
    );
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
      throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
    }

    if (currentStatus === 'new' && ['new', 'tracking', 'archived'].includes(nextStatus)) {
      return nextStatus;
    }

    if (currentStatus === 'tracking' && ['tracking', 'archived'].includes(nextStatus)) {
      return nextStatus;
    }

    throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
  }

  private normalizeStatus(value: any) {
    const status = String(value || 'new').trim() as TalentAssetStatus;

    if (!TALENT_ASSET_STATUS_VALUES.includes(status)) {
      throw new CoolCommException('人才资产状态不合法');
    }

    return status;
  }

  private async currentPerms() {
    return this.performanceAccessContextService.resolveAccessContext(undefined, {
      allowEmptyRoleIds: false,
      missingAuthMessage: '登录状态已失效',
    });
  }

  private resolveCapabilityKey(perm: string): PerformanceCapabilityKey {
    const capabilityKey = this.capabilityByPerm[perm];
    if (!capabilityKey) {
      throw new CoolCommException(`未映射的人才资产权限: ${perm}`);
    }
    return capabilityKey;
  }

  private assertPerm(
    access: PerformanceResolvedAccessContext,
    perm: string,
    message: string
  ) {
    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        this.resolveCapabilityKey(perm)
      )
    ) {
      throw new CoolCommException(message);
    }
  }

  private async departmentScopeIds(
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    if (
      this.performanceAccessContextService.hasCapabilityInScopes(
        access,
        capabilityKey,
        ['company']
      )
    ) {
      return null;
    }

    return Array.from(
      new Set(
        (Array.isArray(access.departmentIds) ? access.departmentIds : [])
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
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    if (
      !this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, capabilityKey),
        {
          departmentId: Number(talentAsset.targetDepartmentId || 0),
        }
      )
    ) {
      throw new CoolCommException(message);
    }
  }

  private async assertCanManageDepartment(
    targetDepartmentId: number,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    if (
      !this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, capabilityKey),
        {
          departmentId: targetDepartmentId,
        }
      )
    ) {
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
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
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
