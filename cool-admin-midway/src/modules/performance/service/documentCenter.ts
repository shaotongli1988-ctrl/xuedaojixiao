/**
 * 文件管理领域服务。
 * 这里只负责主题21冻结的文件元数据分页、详情、统计和标准 CRUD，不负责二进制上传、目录树和权限继承。
 * 维护重点是 page/info/stats/add/update/delete 权限、状态集合和返回边界必须与冻结契约一致。
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
import { PerformanceDocumentCenterEntity } from '../entity/documentCenter';
import * as jwt from 'jsonwebtoken';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

const DOCUMENT_CATEGORIES = [
  'policy',
  'process',
  'template',
  'contract',
  'archive',
  'other',
];
const DOCUMENT_FILE_TYPES = [
  'pdf',
  'doc',
  'xls',
  'ppt',
  'img',
  'zip',
  'other',
];
const DOCUMENT_STORAGE = ['local', 'cloud', 'hybrid'];
const DOCUMENT_CONFIDENTIALITY = ['public', 'internal', 'secret'];
const DOCUMENT_STATUS = ['draft', 'review', 'published', 'archived'];

function normalizePageNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeDecimal(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? Number(parsed.toFixed(2))
    : fallback;
}

function parseStringArray(value: any) {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => String(item || '').trim())
          .filter(Boolean);
      }
    } catch (error) {}

    return trimmed
      .split(/[,\n，]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}

function serializeStringArray(value: any) {
  const normalized = parseStringArray(value);
  return normalized.length ? JSON.stringify(normalized) : null;
}

function deserializeStringArray(value: any) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return parseStringArray(value);
  }

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parseStringArray(parsed) : [];
  } catch (error) {
    return parseStringArray(String(value));
  }
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceDocumentCenterService extends BaseService {
  @InjectEntityModel(PerformanceDocumentCenterEntity)
  performanceDocumentCenterEntity: Repository<PerformanceDocumentCenterEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:documentCenter:page',
    info: 'performance:documentCenter:info',
    stats: 'performance:documentCenter:stats',
    add: 'performance:documentCenter:add',
    update: 'performance:documentCenter:update',
    delete: 'performance:documentCenter:delete',
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
    this.assertHasPerm(perms, this.perms.page, '无权限查看文件管理列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const qb = this.buildQuery(query);

    const total = await qb.getCount();
    const list = await qb
      .orderBy('document.updateTime', 'DESC')
      .offset((page - 1) * size)
      .limit(size)
      .getMany();

    return {
      list: list.map(item => this.normalizeDocument(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.info, '无权限查看文件详情');
    const item = await this.requireDocument(id);
    return this.normalizeDocument(item);
  }

  async stats(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.stats, '无权限查看文件统计');

    const baseQb = this.buildQuery(query);
    const [total, publishedCount, reviewCount, archivedCount, raw] =
      await Promise.all([
        baseQb.clone().getCount(),
        baseQb
          .clone()
          .andWhere('document.status = :status', { status: 'published' })
          .getCount(),
        baseQb
          .clone()
          .andWhere('document.status = :status', { status: 'review' })
          .getCount(),
        baseQb
          .clone()
          .andWhere('document.status = :status', { status: 'archived' })
          .getCount(),
        baseQb
          .clone()
          .select('COALESCE(SUM(document.sizeMb), 0)', 'totalSizeMb')
          .addSelect('COALESCE(SUM(document.downloadCount), 0)', 'totalDownloads')
          .getRawOne(),
      ]);

    return {
      total,
      publishedCount,
      reviewCount,
      archivedCount,
      totalSizeMb: normalizeDecimal(raw?.totalSizeMb, 0),
      totalDownloads: Number(raw?.totalDownloads || 0),
    };
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.add, '无权限新增文件元数据');

    const normalized = await this.normalizePayload(payload, 'add');
    const saved = await this.performanceDocumentCenterEntity.save(
      this.performanceDocumentCenterEntity.create(normalized)
    );
    return this.info(saved.id);
  }

  async updateDocument(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.update, '无权限更新文件元数据');

    const current = await this.requireDocument(Number(payload.id));
    const normalized = await this.normalizePayload(
      {
        ...current,
        ...payload,
      },
      'update',
      current.id
    );

    await this.performanceDocumentCenterEntity.update({ id: current.id }, normalized);
    return this.info(current.id);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.delete, '无权限删除文件元数据');

    const validIds = (ids || [])
      .map(item => Number(item))
      .filter(item => Number.isInteger(item) && item > 0);

    if (!validIds.length) {
      throw new CoolCommException('请选择需要删除的文件记录');
    }

    const rows = await this.performanceDocumentCenterEntity.findBy({
      id: In(validIds),
    });
    if (rows.length !== validIds.length) {
      throw new CoolCommException('部分文件记录不存在');
    }

    await this.performanceDocumentCenterEntity.delete(validIds);
  }

  private buildQuery(query: any) {
    const qb = this.performanceDocumentCenterEntity.createQueryBuilder('document');
    if (query.status) {
      qb.andWhere('document.status = :status', {
        status: String(query.status).trim(),
      });
    }
    if (query.category) {
      qb.andWhere('document.category = :category', {
        category: String(query.category).trim(),
      });
    }
    if (query.confidentiality) {
      qb.andWhere('document.confidentiality = :confidentiality', {
        confidentiality: String(query.confidentiality).trim(),
      });
    }
    if (query.storage) {
      qb.andWhere('document.storage = :storage', {
        storage: String(query.storage).trim(),
      });
    }
    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('document.fileNo LIKE :keyword', { keyword })
            .orWhere('document.fileName LIKE :keyword', { keyword })
            .orWhere('document.ownerName LIKE :keyword', { keyword })
            .orWhere('document.department LIKE :keyword', { keyword })
            .orWhere('document.tags LIKE :keyword', { keyword })
            .orWhere('document.notes LIKE :keyword', { keyword });
        })
      );
    }
    return qb;
  }

  private async currentPerms() {
    const admin = this.currentAdmin as any;
    if (!admin?.roleIds?.length) {
      return [];
    }
    return this.baseSysMenuService.getPerms(admin.roleIds);
  }

  private assertHasPerm(perms: string[], perm: string, message: string) {
    if (!perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }

  private async requireDocument(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new CoolCommException('文件记录 ID 不合法');
    }
    const item = await this.performanceDocumentCenterEntity.findOneBy({ id });
    if (!item) {
      throw new CoolCommException('文件记录不存在');
    }
    return item;
  }

  private async normalizePayload(payload: any, mode: 'add' | 'update', currentId?: number) {
    const fileNo = String(payload.fileNo || payload.file_no || '').trim();
    const fileName = String(payload.fileName || payload.file_name || '').trim();
    const category = String(payload.category || '').trim();
    const fileType = String(payload.fileType || payload.file_type || '').trim();
    const storage = String(payload.storage || '').trim();
    const confidentiality = String(payload.confidentiality || '').trim();
    const ownerName = String(payload.ownerName || payload.owner_name || '').trim();
    const department = String(payload.department || '').trim();
    const version = String(payload.version || '').trim();
    const status = String(payload.status || 'draft').trim();
    const expireDate = String(payload.expireDate || payload.expire_date || '').trim();
    const notes = String(payload.notes || '').trim();

    if (!fileNo) {
      throw new CoolCommException('文件编号不能为空');
    }
    if (!fileName) {
      throw new CoolCommException('文件名称不能为空');
    }
    if (!DOCUMENT_CATEGORIES.includes(category)) {
      throw new CoolCommException('文件分类不合法');
    }
    if (!DOCUMENT_FILE_TYPES.includes(fileType)) {
      throw new CoolCommException('文件类型不合法');
    }
    if (!DOCUMENT_STORAGE.includes(storage)) {
      throw new CoolCommException('存储方式不合法');
    }
    if (!DOCUMENT_CONFIDENTIALITY.includes(confidentiality)) {
      throw new CoolCommException('保密级别不合法');
    }
    if (!ownerName) {
      throw new CoolCommException('负责人不能为空');
    }
    if (!department) {
      throw new CoolCommException('部门不能为空');
    }
    if (!DOCUMENT_STATUS.includes(status)) {
      throw new CoolCommException('文件状态不合法');
    }
    if (!version) {
      throw new CoolCommException('版本号不能为空');
    }
    if (
      expireDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(expireDate)
    ) {
      throw new CoolCommException('失效日期格式不合法');
    }

    const duplicate = await this.performanceDocumentCenterEntity.findOne({
      where: { fileNo },
    });
    if (duplicate && duplicate.id !== currentId) {
      throw new CoolCommException('文件编号已存在');
    }

    return {
      fileNo,
      fileName,
      category,
      fileType,
      storage,
      confidentiality,
      ownerName,
      department,
      status,
      version,
      sizeMb: normalizeDecimal(payload.sizeMb ?? payload.size_mb, 0),
      downloadCount: normalizePageNumber(payload.downloadCount ?? payload.download_count, 0),
      expireDate: expireDate || null,
      tags: serializeStringArray(payload.tags),
      notes: notes || null,
    };
  }

  private normalizeDocument(item: PerformanceDocumentCenterEntity) {
    return {
      id: item.id,
      fileNo: item.fileNo,
      fileName: item.fileName,
      category: item.category,
      fileType: item.fileType,
      storage: item.storage,
      confidentiality: item.confidentiality,
      ownerName: item.ownerName,
      department: item.department,
      status: item.status,
      version: item.version,
      sizeMb: normalizeDecimal(item.sizeMb, 0),
      downloadCount: Number(item.downloadCount || 0),
      expireDate: item.expireDate || null,
      tags: deserializeStringArray(item.tags),
      notes: item.notes || null,
      createTime: item.createTime,
      updateTime: item.updateTime,
    };
  }
}
