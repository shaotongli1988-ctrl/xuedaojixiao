/**
 * 知识产权台账领域服务。
 * 这里只负责 intellectualProperty 的 page/info/stats/add/update/delete 主链，不负责证书附件、续费审批或侵权处置动作。
 * 维护重点是 HR-only 权限、固定类型/状态枚举和到期统计口径必须由服务端单点收敛。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceIntellectualPropertyEntity } from '../entity/intellectualProperty';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

const INTELLECTUAL_PROPERTY_TYPES = [
  'patent',
  'trademark',
  'copyright',
  'softwareCopyright',
];
const INTELLECTUAL_PROPERTY_STATUS = [
  'drafting',
  'applying',
  'registered',
  'expired',
  'invalidated',
];
const INTELLECTUAL_PROPERTY_RISK_LEVELS = ['low', 'medium', 'high'];
const PERFORMANCE_ID_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.idRequired
  );

function normalizePageNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeText(value: any, maxLength?: number) {
  const text = String(value ?? '').trim();
  if (!maxLength || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}

function normalizeOptionalText(value: any, maxLength?: number) {
  const text = normalizeText(value, maxLength);
  return text || null;
}

function normalizeRequiredText(value: any, label: string, maxLength?: number) {
  const text = normalizeText(value, maxLength);
  if (!text) {
    throw new CoolCommException(`${label}不能为空`);
  }
  return text;
}

function normalizeOptionalDate(value: any, label: string) {
  const text = normalizeOptionalText(value, 10);
  if (!text) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new CoolCommException(`${label}格式不合法`);
  }
  return text;
}

function normalizeRequiredDate(value: any, label: string) {
  const text = normalizeOptionalDate(value, label);
  if (!text) {
    throw new CoolCommException(`${label}不能为空`);
  }
  return text;
}

function normalizeIds(value: any) {
  const list = Array.isArray(value) ? value : [value];
  return Array.from(
    new Set(
      list
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    )
  );
}

function compareDateDesc(left?: string | null, right?: string | null) {
  return String(right || '').localeCompare(String(left || ''));
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceIntellectualPropertyService extends BaseService {
  @InjectEntityModel(PerformanceIntellectualPropertyEntity)
  performanceIntellectualPropertyEntity: Repository<PerformanceIntellectualPropertyEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  private readonly perms = {
    page: PERMISSIONS.performance.intellectualProperty.page,
    info: PERMISSIONS.performance.intellectualProperty.info,
    stats: PERMISSIONS.performance.intellectualProperty.stats,
    add: PERMISSIONS.performance.intellectualProperty.add,
    update: PERMISSIONS.performance.intellectualProperty.update,
    delete: PERMISSIONS.performance.intellectualProperty.delete,
  };

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.intellectualProperty.page]: 'intellectual_property.read',
    [PERMISSIONS.performance.intellectualProperty.info]: 'intellectual_property.read',
    [PERMISSIONS.performance.intellectualProperty.stats]: 'intellectual_property.stats',
    [PERMISSIONS.performance.intellectualProperty.add]: 'intellectual_property.create',
    [PERMISSIONS.performance.intellectualProperty.update]: 'intellectual_property.update',
    [PERMISSIONS.performance.intellectualProperty.delete]: 'intellectual_property.delete',
  };

  async page(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.page, '无权限查看知识产权列表');

    const page = normalizePageNumber(query?.page, 1);
    const size = normalizePageNumber(query?.size, 20);
    const filtered = await this.listByQuery(query);

    return {
      list: filtered.slice((page - 1) * size, page * size),
      pagination: {
        page,
        size,
        total: filtered.length,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.info, '无权限查看知识产权详情');
    const record = await this.requireRecord(Number(id));
    return this.normalizeRecord(record);
  }

  async stats(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.stats, '无权限查看知识产权统计');

    const list = await this.listByQuery(query);
    const today = new Date().toISOString().slice(0, 10);
    const warningDate = addDays(today, 30);

    return {
      total: list.length,
      registeredCount: list.filter(item => item.status === 'registered').length,
      expiringCount: list.filter(
        item =>
          item.status === 'registered' &&
          item.expiryDate &&
          item.expiryDate >= today &&
          item.expiryDate <= warningDate
      ).length,
      expiredCount: list.filter(
        item =>
          item.status === 'expired' ||
          (!!item.expiryDate &&
            item.expiryDate < today &&
            item.status !== 'invalidated')
      ).length,
    };
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.add, '无权限新增知识产权');

    const normalized = await this.normalizePayload(payload, 'add');
    const saved = await this.performanceIntellectualPropertyEntity.save(
      this.performanceIntellectualPropertyEntity.create(normalized)
    );
    return this.info(saved.id);
  }

  async updateProperty(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.update, '无权限更新知识产权');

    const id = Number(payload?.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new CoolCommException(PERFORMANCE_ID_REQUIRED_MESSAGE);
    }

    const current = await this.requireRecord(id);
    const normalized = await this.normalizePayload(
      {
        ...current,
        ...payload,
      },
      'update',
      current
    );
    await this.performanceIntellectualPropertyEntity.update({ id }, normalized);
    return this.info(id);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.delete, '无权限删除知识产权');

    const validIds = normalizeIds(ids);
    if (validIds.length === 0) {
      return;
    }

    const currentRows = await this.performanceIntellectualPropertyEntity.find();
    const deletableIds = currentRows
      .filter(item => validIds.includes(Number(item.id)))
      .map(item => Number(item.id));

    if (deletableIds.length === 0) {
      return;
    }

    await this.performanceIntellectualPropertyEntity.delete(deletableIds as any);
  }

  private async listByQuery(query: any) {
    const rows = await this.performanceIntellectualPropertyEntity.find();
    const keyword = normalizeText(query?.keyword, 100).toLowerCase();
    const status = normalizeText(query?.status, 32);
    const ipType = normalizeText(query?.ipType, 32);

    const filtered = rows
      .map(item => this.normalizeRecord(item))
      .filter(item => {
        if (status && item.status !== status) {
          return false;
        }
        if (ipType && item.ipType !== ipType) {
          return false;
        }
        if (
          keyword &&
          ![
            item.ipNo,
            item.title,
            item.ownerDepartment,
            item.ownerName,
            item.applicantName,
            item.registryNo,
          ].some(value => String(value || '').toLowerCase().includes(keyword))
        ) {
          return false;
        }
        return true;
      });

    filtered.sort((left, right) =>
      compareDateDesc(
        String(left.updateTime || left.createTime || ''),
        String(right.updateTime || right.createTime || '')
      )
    );
    return filtered;
  }

  private async normalizePayload(
    payload: any,
    mode: 'add' | 'update',
    current?: PerformanceIntellectualPropertyEntity
  ) {
    const ipNo = normalizeRequiredText(payload?.ipNo, '知识产权编号', 64);
    const title = normalizeRequiredText(payload?.title, '标题', 200);
    const ipType = normalizeRequiredText(payload?.ipType, '知识产权类型', 32);
    const ownerDepartment = normalizeRequiredText(
      payload?.ownerDepartment,
      '归属部门',
      100
    );
    const ownerName = normalizeRequiredText(payload?.ownerName, '归属人', 100);
    const applicantName = normalizeRequiredText(payload?.applicantName, '申请人', 100);
    const applyDate = normalizeRequiredDate(payload?.applyDate, '申请日期');
    const grantDate = normalizeOptionalDate(payload?.grantDate, '授权日期');
    const expiryDate = normalizeOptionalDate(payload?.expiryDate, '到期日期');
    const status = normalizeRequiredText(
      payload?.status ?? (mode === 'add' ? 'drafting' : current?.status),
      '状态',
      32
    );
    const riskLevel = normalizeOptionalText(payload?.riskLevel, 32);

    this.assertEnum(ipType, INTELLECTUAL_PROPERTY_TYPES, '知识产权类型不合法');
    this.assertEnum(status, INTELLECTUAL_PROPERTY_STATUS, '知识产权状态不合法');
    if (riskLevel) {
      this.assertEnum(
        riskLevel,
        INTELLECTUAL_PROPERTY_RISK_LEVELS,
        '风险等级不合法'
      );
    }

    if (grantDate && grantDate < applyDate) {
      throw new CoolCommException('授权日期不能早于申请日期');
    }
    if (expiryDate && expiryDate < (grantDate || applyDate)) {
      throw new CoolCommException('到期日期不能早于申请日期或授权日期');
    }

    await this.assertIpNoUnique(ipNo, current?.id);

    return {
      ipNo,
      title,
      ipType,
      ownerDepartment,
      ownerName,
      applicantName,
      applyDate,
      grantDate,
      expiryDate,
      status,
      registryNo: normalizeOptionalText(payload?.registryNo, 100),
      usageScope: normalizeOptionalText(payload?.usageScope, 1000),
      riskLevel,
      notes: normalizeOptionalText(payload?.notes, 2000),
    };
  }

  private normalizeRecord(record: PerformanceIntellectualPropertyEntity) {
    return {
      id: record.id,
      ipNo: record.ipNo,
      title: record.title,
      ipType: record.ipType,
      ownerDepartment: record.ownerDepartment,
      ownerName: record.ownerName,
      applicantName: record.applicantName,
      applyDate: record.applyDate,
      grantDate: record.grantDate,
      expiryDate: record.expiryDate,
      status: record.status,
      registryNo: record.registryNo,
      usageScope: record.usageScope,
      riskLevel: record.riskLevel,
      notes: record.notes,
      createTime: record.createTime || '',
      updateTime: record.updateTime || '',
    };
  }

  private async requireRecord(id: number) {
    const record = await this.performanceIntellectualPropertyEntity.findOneBy({ id });
    if (!record) {
      throw new CoolCommException('知识产权记录不存在');
    }
    return record;
  }

  private async assertIpNoUnique(ipNo: string, currentId?: number) {
    const existing = await this.performanceIntellectualPropertyEntity.findOneBy({ ipNo });
    if (existing && Number(existing.id) !== Number(currentId || 0)) {
      throw new CoolCommException('知识产权编号已存在');
    }
  }

  private assertEnum(value: string, allowed: string[], message: string) {
    if (!allowed.includes(value)) {
      throw new CoolCommException(message);
    }
  }

  private async currentPerms() {
    return this.performanceAccessContextService.resolveAccessContext(undefined, {
      allowEmptyRoleIds: true,
      missingAuthMessage: '登录状态已失效',
    });
  }

  private resolveCapabilityKey(perm: string): PerformanceCapabilityKey {
    const capabilityKey = this.capabilityByPerm[perm];
    if (!capabilityKey) {
      throw new CoolCommException(`未映射的知识产权权限: ${perm}`);
    }
    return capabilityKey;
  }

  private assertHasPerm(
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
}
