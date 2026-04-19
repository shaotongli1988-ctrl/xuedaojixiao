/**
 * 知识产权台账领域服务。
 * 这里只负责 intellectualProperty 的 page/info/stats/add/update/delete 主链，不负责证书附件、续费审批或侵权处置动作。
 * 维护重点是 HR-only 权限、固定类型/状态枚举和到期统计口径必须由服务端单点收敛。
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
import { Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceIntellectualPropertyEntity } from '../entity/intellectualProperty';
import * as jwt from 'jsonwebtoken';

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
let intellectualPropertyTableReadyPromise: Promise<void> | null = null;

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
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:intellectualProperty:page',
    info: 'performance:intellectualProperty:info',
    stats: 'performance:intellectualProperty:stats',
    add: 'performance:intellectualProperty:add',
    update: 'performance:intellectualProperty:update',
    delete: 'performance:intellectualProperty:delete',
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
    await this.ensureTableReady();
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
    await this.ensureTableReady();
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.info, '无权限查看知识产权详情');
    const record = await this.requireRecord(Number(id));
    return this.normalizeRecord(record);
  }

  async stats(query: any) {
    await this.ensureTableReady();
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
    await this.ensureTableReady();
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.add, '无权限新增知识产权');

    const normalized = await this.normalizePayload(payload, 'add');
    const saved = await this.performanceIntellectualPropertyEntity.save(
      this.performanceIntellectualPropertyEntity.create(normalized)
    );
    return this.info(saved.id);
  }

  async updateProperty(payload: any) {
    await this.ensureTableReady();
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.update, '无权限更新知识产权');

    const id = Number(payload?.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new CoolCommException('ID不能为空');
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
    await this.ensureTableReady();
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
    await this.ensureTableReady();
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

    this.assertEnum(ipType, INTELLECTUAL_PROPERTY_TYPES, '知识产权类型不合法');
    this.assertEnum(status, INTELLECTUAL_PROPERTY_STATUS, '知识产权状态不合法');

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
      riskLevel: normalizeOptionalText(payload?.riskLevel, 32),
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
    await this.ensureTableReady();
    const record = await this.performanceIntellectualPropertyEntity.findOneBy({ id });
    if (!record) {
      throw new CoolCommException('知识产权记录不存在');
    }
    return record;
  }

  private async assertIpNoUnique(ipNo: string, currentId?: number) {
    await this.ensureTableReady();
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
    const roleIds = this.currentAdmin?.roleIds || [];
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return [];
    }
    return this.baseSysMenuService.getPerms(roleIds);
  }

  private assertHasPerm(perms: string[], perm: string, message: string) {
    if (!Array.isArray(perms) || !perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }

  /**
   * current latest 关闭了 TypeORM auto-sync，新增台账表需要在首次访问时兜底建表，
   * 否则运行态会在首屏 page/stats 请求阶段直接报缺表。
   */
  private async ensureTableReady() {
    if (!intellectualPropertyTableReadyPromise) {
      intellectualPropertyTableReadyPromise = this.performanceIntellectualPropertyEntity
        .query(`
          CREATE TABLE IF NOT EXISTS performance_intellectual_property (
            id int NOT NULL AUTO_INCREMENT,
            ipNo varchar(64) NOT NULL,
            title varchar(200) NOT NULL,
            ipType varchar(32) NOT NULL,
            ownerDepartment varchar(100) NOT NULL,
            ownerName varchar(100) NOT NULL,
            applicantName varchar(100) NOT NULL,
            applyDate varchar(10) NOT NULL,
            grantDate varchar(10) DEFAULT NULL,
            expiryDate varchar(10) DEFAULT NULL,
            status varchar(32) NOT NULL DEFAULT 'drafting',
            registryNo varchar(100) DEFAULT NULL,
            usageScope text DEFAULT NULL,
            riskLevel varchar(32) DEFAULT NULL,
            notes text DEFAULT NULL,
            createTime varchar(19) NOT NULL,
            updateTime varchar(19) NOT NULL,
            tenantId int DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uk_performance_intellectual_property_no (ipNo),
            KEY idx_performance_intellectual_property_title (title),
            KEY idx_performance_intellectual_property_type (ipType),
            KEY idx_performance_intellectual_property_status (status),
            KEY idx_performance_intellectual_property_create_time (createTime),
            KEY idx_performance_intellectual_property_update_time (updateTime),
            KEY idx_performance_intellectual_property_tenant (tenantId)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `)
        .then(() => undefined)
        .catch(error => {
          intellectualPropertyTableReadyPromise = null;
          throw error;
        });
    }
    await intellectualPropertyTableReadyPromise;
  }
}
