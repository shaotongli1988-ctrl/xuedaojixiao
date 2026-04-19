/**
 * 行政协同共享记录领域服务。
 * 这里只负责 annualInspection/honor/publicityMaterial/designCollab/expressCollab 五页的共享台账主链，
 * 不负责审批流、正文内容、真实文件上传、签收结算或外部快递配置。
 * 维护重点是 controller 语义分离但底层权限、校验、关系约束和统计口径必须保持单一事实源。
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
import { PerformanceDocumentCenterEntity } from '../entity/documentCenter';
import { PerformanceOfficeCollabEntity } from '../entity/officeCollab';
import * as jwt from 'jsonwebtoken';

export type OfficeCollabModuleKey =
  | 'annualInspection'
  | 'honor'
  | 'publicityMaterial'
  | 'designCollab'
  | 'expressCollab';

type PermissionAction = 'page' | 'info' | 'stats' | 'add' | 'update' | 'delete';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

const MODULE_META: Record<
  OfficeCollabModuleKey,
  {
    label: string;
    prefix: string;
    statuses: string[];
  }
> = {
  annualInspection: {
    label: '年检材料',
    prefix: 'NJ',
    statuses: ['draft', 'preparing', 'submitted', 'approved', 'rejected', 'expired'],
  },
  honor: {
    label: '荣誉管理',
    prefix: 'RY',
    statuses: ['draft', 'published', 'archived'],
  },
  publicityMaterial: {
    label: '宣传资料',
    prefix: 'XC',
    statuses: ['draft', 'review', 'approved', 'published', 'offline'],
  },
  designCollab: {
    label: '美工协同',
    prefix: 'MG',
    statuses: ['todo', 'in_progress', 'review', 'done', 'cancelled'],
  },
  expressCollab: {
    label: '快递协同',
    prefix: 'KD',
    statuses: ['created', 'in_transit', 'delivered', 'exception', 'returned'],
  },
};

const ANNUAL_CATEGORIES = ['safety', 'equipment', 'license', 'compliance', 'other'];
const HONOR_TYPES = ['individual', 'team', 'organization'];
const HONOR_LEVELS = ['departmental', 'city', 'provincial', 'national', 'international'];
const PUBLICITY_TYPES = ['poster', 'video', 'article', 'ppt', 'brochure'];
const PUBLICITY_CHANNELS = ['website', 'wechat', 'weibo', 'offline', 'all'];
const DESIGN_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const EXPRESS_SERVICE_LEVELS = ['standard', 'express', 'same_day'];
const EXPRESS_SYNC_STATUS = ['synced', 'pending', 'failed'];

function normalizePageNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function pickValue(source: any, aliases: string[], fallback?: any) {
  for (const key of aliases) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }
  return fallback;
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

function normalizeRequiredText(value: any, fieldLabel: string, maxLength?: number) {
  const text = normalizeText(value, maxLength);
  if (!text) {
    throw new CoolCommException(`${fieldLabel}不能为空`);
  }
  return text;
}

function normalizeOptionalDate(value: any) {
  const text = normalizeText(value, 19);
  return text || null;
}

function normalizeRequiredDate(value: any, fieldLabel: string) {
  const text = normalizeOptionalDate(value);
  if (!text) {
    throw new CoolCommException(`${fieldLabel}不能为空`);
  }
  return text;
}

function normalizeInteger(
  value: any,
  options: {
    fallback?: number;
    min?: number;
    max?: number;
    fieldLabel: string;
  }
) {
  const parsed = Number(value);
  const target = Number.isFinite(parsed)
    ? Math.round(parsed)
    : Number(options.fallback ?? 0);
  const min = options.min ?? Number.MIN_SAFE_INTEGER;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  if (target < min || target > max) {
    throw new CoolCommException(`${options.fieldLabel}必须在${min}-${max}之间`);
  }
  return target;
}

function parseExtraJson(value: any) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  try {
    return JSON.parse(String(value));
  } catch (error) {
    return {};
  }
}

function serializeExtraJson(value: Record<string, any>) {
  const next = Object.fromEntries(
    Object.entries(value || {}).filter(([, item]) => item !== undefined)
  );
  return Object.keys(next).length > 0 ? JSON.stringify(next) : null;
}

function matchKeyword(value: any, keyword: string) {
  return String(value || '').toLowerCase().includes(keyword.toLowerCase());
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

function compareDateAsc(left?: string | null, right?: string | null) {
  return String(left || '').localeCompare(String(right || ''));
}

function currentYear() {
  return String(new Date().getFullYear());
}

function generateRecordNo(prefix: string) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${datePart}-${rand}`;
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceOfficeCollabRecordService extends BaseService {
  @InjectEntityModel(PerformanceOfficeCollabEntity)
  performanceOfficeCollabRecordEntity: Repository<PerformanceOfficeCollabEntity>;

  @InjectEntityModel(PerformanceDocumentCenterEntity)
  performanceDocumentCenterEntity: Repository<PerformanceDocumentCenterEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

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

  async pageByModule(moduleKey: OfficeCollabModuleKey, query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(
      perms,
      this.getPerm(moduleKey, 'page'),
      `无权限查看${MODULE_META[moduleKey].label}列表`
    );

    const page = normalizePageNumber(query?.page, 1);
    const size = normalizePageNumber(query?.size, 20);
    const list = await this.listByModule(moduleKey);
    const filtered = list.filter(item => this.matchQuery(moduleKey, item, query));
    filtered.sort((left, right) => this.compareItems(moduleKey, left, right));

    return {
      list: filtered.slice((page - 1) * size, page * size),
      pagination: {
        page,
        size,
        total: filtered.length,
      },
    };
  }

  async infoByModule(moduleKey: OfficeCollabModuleKey, id: number) {
    const perms = await this.currentPerms();
    this.assertHasPerm(
      perms,
      this.getPerm(moduleKey, 'info'),
      `无权限查看${MODULE_META[moduleKey].label}详情`
    );
    const record = await this.requireRecord(moduleKey, id);
    return this.normalizeRecord(moduleKey, record);
  }

  async statsByModule(moduleKey: OfficeCollabModuleKey, query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(
      perms,
      this.getPerm(moduleKey, 'stats'),
      `无权限查看${MODULE_META[moduleKey].label}统计`
    );
    const list = await this.listByModule(moduleKey);
    const filtered = list.filter(item => this.matchQuery(moduleKey, item, query));
    return this.buildStats(moduleKey, filtered);
  }

  async addByModule(moduleKey: OfficeCollabModuleKey, payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(
      perms,
      this.getPerm(moduleKey, 'add'),
      `无权限新增${MODULE_META[moduleKey].label}`
    );

    const normalized = await this.normalizePayload(moduleKey, payload, 'add');
    const saved = await this.performanceOfficeCollabRecordEntity.save(
      this.performanceOfficeCollabRecordEntity.create(normalized)
    );
    return this.infoByModule(moduleKey, saved.id);
  }

  async updateByModule(moduleKey: OfficeCollabModuleKey, payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(
      perms,
      this.getPerm(moduleKey, 'update'),
      `无权限更新${MODULE_META[moduleKey].label}`
    );

    const id = Number(pickValue(payload, ['id']));
    if (!Number.isInteger(id) || id <= 0) {
      throw new CoolCommException('ID不能为空');
    }

    const current = await this.requireRecord(moduleKey, id);
    const normalized = await this.normalizePayload(moduleKey, payload, 'update', current);
    await this.performanceOfficeCollabRecordEntity.update({ id: current.id }, normalized);
    return this.infoByModule(moduleKey, current.id);
  }

  async deleteByModule(moduleKey: OfficeCollabModuleKey, ids: number[]) {
    const perms = await this.currentPerms();
    this.assertHasPerm(
      perms,
      this.getPerm(moduleKey, 'delete'),
      `无权限删除${MODULE_META[moduleKey].label}`
    );

    const validIds = normalizeIds(ids);
    if (validIds.length === 0) {
      return;
    }

    const currentRows = await this.performanceOfficeCollabRecordEntity.find({
      where: { moduleKey },
    } as any);
    const deletableIds = currentRows
      .filter(item => validIds.includes(Number(item.id)))
      .map(item => Number(item.id));

    if (deletableIds.length === 0) {
      return;
    }

    await this.performanceOfficeCollabRecordEntity.delete(deletableIds as any);
  }

  private async listByModule(moduleKey: OfficeCollabModuleKey) {
    const rows = await this.performanceOfficeCollabRecordEntity.find({
      where: { moduleKey },
    } as any);
    return Promise.all(rows.map(item => this.normalizeRecord(moduleKey, item)));
  }

  private async normalizePayload(
    moduleKey: OfficeCollabModuleKey,
    payload: any,
    mode: 'add' | 'update',
    current?: PerformanceOfficeCollabEntity
  ) {
    const meta = MODULE_META[moduleKey];
    const currentView = current ? await this.normalizeRecord(moduleKey, current) : {};
    const source = {
      ...currentView,
      ...payload,
    };

    let normalized: Partial<PerformanceOfficeCollabEntity> | Record<string, any>;

    switch (moduleKey) {
      case 'annualInspection':
        normalized = await this.normalizeAnnualInspection(source, mode);
        break;
      case 'honor':
        normalized = await this.normalizeHonor(source, mode);
        break;
      case 'publicityMaterial':
        normalized = await this.normalizePublicityMaterial(source, mode);
        break;
      case 'designCollab':
        normalized = await this.normalizeDesignCollab(source, mode);
        break;
      case 'expressCollab':
        normalized = await this.normalizeExpressCollab(source, mode);
        break;
      default:
        throw new CoolCommException(`暂不支持模块 ${moduleKey}`);
    }

    const recordNo = normalizeRequiredText(
      pickValue(normalized, ['recordNo'], generateRecordNo(meta.prefix)),
      `${meta.label}编号`,
      64
    );
    await this.assertRecordNoUnique(moduleKey, recordNo, current?.id);

    return {
      moduleKey,
      recordNo,
      title: normalizeRequiredText(pickValue(normalized, ['title']), `${meta.label}标题`, 200),
      status: this.normalizeStatus(
        moduleKey,
        pickValue(normalized, ['status']),
        mode
      ),
      department: normalizeOptionalText(pickValue(normalized, ['department']), 100),
      ownerName: normalizeOptionalText(pickValue(normalized, ['ownerName']), 100),
      assigneeName: normalizeOptionalText(pickValue(normalized, ['assigneeName']), 100),
      category: normalizeOptionalText(pickValue(normalized, ['category']), 64),
      priority: normalizeOptionalText(pickValue(normalized, ['priority']), 32),
      version: normalizeOptionalText(pickValue(normalized, ['version']), 32),
      dueDate: normalizeOptionalDate(pickValue(normalized, ['dueDate'])),
      eventDate: normalizeOptionalDate(pickValue(normalized, ['eventDate'])),
      progressValue: normalizeInteger(pickValue(normalized, ['progressValue']), {
        fallback: 0,
        min: 0,
        max: 100,
        fieldLabel: '进度值',
      }),
      scoreValue: normalizeInteger(pickValue(normalized, ['scoreValue']), {
        fallback: 0,
        min: 0,
        max: 999999,
        fieldLabel: '统计值',
      }),
      relatedDocumentId:
        pickValue(normalized, ['relatedDocumentId']) !== undefined &&
        pickValue(normalized, ['relatedDocumentId']) !== null
          ? Number(pickValue(normalized, ['relatedDocumentId']))
          : null,
      extJson: serializeExtraJson(pickValue(normalized, ['extra']) || {}),
      notes: normalizeOptionalText(pickValue(normalized, ['notes']), 2000),
    };
  }

  private async normalizeAnnualInspection(source: any, mode: 'add' | 'update') {
    const recordNo = normalizeOptionalText(
      pickValue(source, ['materialNo', 'material_no', 'recordNo']),
      64
    );
    const category = normalizeRequiredText(
      pickValue(source, ['category'], 'other'),
      '年检分类',
      64
    );
    this.assertEnum(category, ANNUAL_CATEGORIES, '年检分类不合法');

    return {
      recordNo,
      title: normalizeRequiredText(pickValue(source, ['title']), '年检材料标题', 200),
      category,
      department: normalizeRequiredText(
        pickValue(source, ['department']),
        '所属部门',
        100
      ),
      ownerName: normalizeRequiredText(
        pickValue(source, ['ownerName', 'owner_name']),
        '负责人',
        100
      ),
      dueDate: normalizeRequiredDate(
        pickValue(source, ['dueDate', 'due_date']),
        '截止日期'
      ),
      status: pickValue(source, ['status'], mode === 'add' ? 'draft' : undefined),
      progressValue: normalizeInteger(
        pickValue(source, ['completeness', 'progressValue'], 0),
        {
          fallback: 0,
          min: 0,
          max: 100,
          fieldLabel: '材料完整度',
        }
      ),
      version: normalizeRequiredText(
        pickValue(source, ['version'], 'v1.0'),
        '版本号',
        32
      ),
      extra: {
        reminderDays: normalizeInteger(
          pickValue(source, ['reminderDays', 'reminder_days'], 7),
          {
            fallback: 7,
            min: 0,
            max: 365,
            fieldLabel: '提醒天数',
          }
        ),
      },
      notes: pickValue(source, ['notes']),
    };
  }

  private async normalizeHonor(source: any, mode: 'add' | 'update') {
    const honorType = normalizeRequiredText(
      pickValue(source, ['honorType', 'honor_type'], 'individual'),
      '荣誉类型',
      32
    );
    const level = normalizeRequiredText(
      pickValue(source, ['level'], 'departmental'),
      '荣誉级别',
      32
    );
    this.assertEnum(honorType, HONOR_TYPES, '荣誉类型不合法');
    this.assertEnum(level, HONOR_LEVELS, '荣誉级别不合法');

    return {
      recordNo: normalizeOptionalText(
        pickValue(source, ['honorNo', 'honor_no', 'recordNo']),
        64
      ),
      title: normalizeRequiredText(pickValue(source, ['title']), '荣誉标题', 200),
      department: normalizeRequiredText(
        pickValue(source, ['department']),
        '所属部门',
        100
      ),
      ownerName: normalizeRequiredText(
        pickValue(source, ['winnerName', 'winner_name']),
        '获奖对象',
        100
      ),
      eventDate: normalizeRequiredDate(
        pickValue(source, ['awardedAt', 'awarded_at']),
        '获奖日期'
      ),
      status: pickValue(source, ['status'], mode === 'add' ? 'draft' : undefined),
      scoreValue: normalizeInteger(
        pickValue(source, ['impactScore', 'impact_score'], 70),
        {
          fallback: 70,
          min: 0,
          max: 100,
          fieldLabel: '影响分',
        }
      ),
      extra: {
        honorType,
        level,
        issuer: normalizeRequiredText(
          pickValue(source, ['issuer']),
          '颁发单位',
          100
        ),
        evidenceUrl: normalizeOptionalText(
          pickValue(source, ['evidenceUrl', 'evidence_url']),
          255
        ),
      },
      notes: pickValue(source, ['notes']),
    };
  }

  private async normalizePublicityMaterial(source: any, mode: 'add' | 'update') {
    const materialType = normalizeRequiredText(
      pickValue(source, ['materialType', 'material_type'], 'poster'),
      '资料类型',
      32
    );
    const channel = normalizeRequiredText(
      pickValue(source, ['channel'], 'offline'),
      '投放渠道',
      32
    );
    this.assertEnum(materialType, PUBLICITY_TYPES, '宣传资料类型不合法');
    this.assertEnum(channel, PUBLICITY_CHANNELS, '宣传渠道不合法');

    const relatedDocumentIdRaw = pickValue(source, [
      'relatedDocumentId',
      'related_document_id',
      'documentId',
      'document_id',
    ]);
    const relatedDocumentId =
      relatedDocumentIdRaw === undefined ||
      relatedDocumentIdRaw === null ||
      relatedDocumentIdRaw === ''
        ? null
        : Number(relatedDocumentIdRaw);

    if (relatedDocumentId !== null) {
      const relatedDocument = await this.performanceDocumentCenterEntity.findOneBy({
        id: relatedDocumentId,
      });
      if (!relatedDocument) {
        throw new CoolCommException('关联文件不存在');
      }
    }

    return {
      recordNo: normalizeOptionalText(
        pickValue(source, ['materialNo', 'material_no', 'recordNo']),
        64
      ),
      title: normalizeRequiredText(pickValue(source, ['title']), '宣传资料标题', 200),
      ownerName: normalizeRequiredText(
        pickValue(source, ['ownerName', 'owner_name']),
        '负责人',
        100
      ),
      assigneeName: normalizeRequiredText(
        pickValue(source, ['designOwner', 'design_owner']),
        '设计负责人',
        100
      ),
      eventDate: normalizeRequiredDate(
        pickValue(source, ['publishDate', 'publish_date']),
        '发布日期'
      ),
      status: pickValue(source, ['status'], mode === 'add' ? 'draft' : undefined),
      scoreValue: normalizeInteger(pickValue(source, ['views'], 0), {
        fallback: 0,
        min: 0,
        max: 999999,
        fieldLabel: '浏览量',
      }),
      relatedDocumentId,
      extra: {
        materialType,
        channel,
        downloads: normalizeInteger(pickValue(source, ['downloads'], 0), {
          fallback: 0,
          min: 0,
          max: 999999,
          fieldLabel: '下载量',
        }),
      },
      notes: pickValue(source, ['notes']),
    };
  }

  private async normalizeDesignCollab(source: any, mode: 'add' | 'update') {
    const priority = normalizeRequiredText(
      pickValue(source, ['priority'], 'medium'),
      '优先级',
      32
    );
    this.assertEnum(priority, DESIGN_PRIORITIES, '优先级不合法');

    return {
      recordNo: normalizeOptionalText(
        pickValue(source, ['taskNo', 'task_no', 'recordNo']),
        64
      ),
      title: normalizeRequiredText(pickValue(source, ['title']), '协同任务标题', 200),
      ownerName: normalizeRequiredText(
        pickValue(source, ['requesterName', 'requester_name']),
        '需求方',
        100
      ),
      assigneeName: normalizeRequiredText(
        pickValue(source, ['assigneeName', 'assignee_name']),
        '执行人',
        100
      ),
      priority,
      dueDate: normalizeRequiredDate(
        pickValue(source, ['dueDate', 'due_date']),
        '截止日期'
      ),
      status: pickValue(source, ['status'], mode === 'add' ? 'todo' : undefined),
      progressValue: normalizeInteger(
        pickValue(source, ['progress', 'progressValue'], 0),
        {
          fallback: 0,
          min: 0,
          max: 100,
          fieldLabel: '任务进度',
        }
      ),
      extra: {
        workload: normalizeInteger(pickValue(source, ['workload'], 1), {
          fallback: 1,
          min: 1,
          max: 999,
          fieldLabel: '工作量',
        }),
        relatedMaterialNo: normalizeOptionalText(
          pickValue(source, ['relatedMaterialNo', 'related_material_no']),
          64
        ),
      },
      notes: pickValue(source, ['notes']),
    };
  }

  private async normalizeExpressCollab(source: any, mode: 'add' | 'update') {
    const serviceLevel = normalizeRequiredText(
      pickValue(source, ['serviceLevel', 'service_level'], 'standard'),
      '服务等级',
      32
    );
    const syncStatus = normalizeRequiredText(
      pickValue(source, ['syncStatus', 'sync_status'], 'pending'),
      '同步状态',
      32
    );
    this.assertEnum(serviceLevel, EXPRESS_SERVICE_LEVELS, '服务等级不合法');
    this.assertEnum(syncStatus, EXPRESS_SYNC_STATUS, '同步状态不合法');

    return {
      recordNo: normalizeOptionalText(
        pickValue(source, ['trackingNo', 'tracking_no', 'recordNo']),
        64
      ),
      title: normalizeRequiredText(
        pickValue(source, ['title'], '快递协同记录'),
        '快递标题',
        200
      ),
      ownerName: normalizeRequiredText(
        pickValue(source, ['senderName', 'sender_name']),
        '寄件人',
        100
      ),
      assigneeName: normalizeRequiredText(
        pickValue(source, ['receiverName', 'receiver_name']),
        '收件人',
        100
      ),
      category: normalizeRequiredText(
        pickValue(source, ['courierCompany', 'courier_company']),
        '快递公司',
        64
      ),
      dueDate: normalizeRequiredDate(
        pickValue(source, ['etaDate', 'eta_date']),
        '预计送达时间'
      ),
      eventDate: normalizeRequiredDate(
        pickValue(source, ['lastUpdate', 'last_update']),
        '最近事件时间'
      ),
      status: pickValue(source, ['status'], mode === 'add' ? 'created' : undefined),
      extra: {
        orderNo: normalizeRequiredText(
          pickValue(source, ['orderNo', 'order_no']),
          '订单号',
          64
        ),
        courierCompany: normalizeRequiredText(
          pickValue(source, ['courierCompany', 'courier_company']),
          '快递公司',
          64
        ),
        serviceLevel,
        origin: normalizeRequiredText(
          pickValue(source, ['origin']),
          '寄件地',
          120
        ),
        destination: normalizeRequiredText(
          pickValue(source, ['destination']),
          '收件地',
          120
        ),
        sourceSystem: normalizeOptionalText(
          pickValue(source, ['sourceSystem', 'source_system'], 'manual'),
          64
        ),
        syncStatus,
        lastEvent: normalizeOptionalText(
          pickValue(source, ['lastEvent', 'last_event']),
          200
        ),
      },
      notes: pickValue(source, ['notes']),
    };
  }

  private normalizeStatus(
    moduleKey: OfficeCollabModuleKey,
    value: any,
    mode: 'add' | 'update'
  ) {
    const meta = MODULE_META[moduleKey];
    const fallback = meta.statuses[0];
    const status = normalizeRequiredText(
      value ?? (mode === 'add' ? fallback : fallback),
      '状态',
      32
    );
    this.assertEnum(status, meta.statuses, `${meta.label}状态不合法`);
    return status;
  }

  private async normalizeRecord(
    moduleKey: OfficeCollabModuleKey,
    record: PerformanceOfficeCollabEntity
  ) {
    const extra = parseExtraJson(record.extJson);
    const base = {
      id: record.id,
      title: record.title,
      status: record.status,
      notes: record.notes || '',
      createTime: record.createTime || '',
      updateTime: record.updateTime || '',
    };

    switch (moduleKey) {
      case 'annualInspection':
        return {
          ...base,
          materialNo: record.recordNo,
          category: record.category || 'other',
          department: record.department || '',
          ownerName: record.ownerName || '',
          dueDate: record.dueDate || '',
          completeness: Number(record.progressValue || 0),
          version: record.version || 'v1.0',
          reminderDays: Number(extra.reminderDays || 0),
        };
      case 'honor':
        return {
          ...base,
          honorNo: record.recordNo,
          honorType: extra.honorType || 'individual',
          level: extra.level || 'departmental',
          winnerName: record.ownerName || '',
          department: record.department || '',
          awardedAt: record.eventDate || '',
          issuer: extra.issuer || '',
          impactScore: Number(record.scoreValue || 0),
          evidenceUrl: extra.evidenceUrl || null,
        };
      case 'publicityMaterial': {
        const response = {
          ...base,
          materialNo: record.recordNo,
          materialType: extra.materialType || 'poster',
          channel: extra.channel || 'offline',
          ownerName: record.ownerName || '',
          publishDate: record.eventDate || '',
          views: Number(record.scoreValue || 0),
          downloads: Number(extra.downloads || 0),
          designOwner: record.assigneeName || '',
          relatedDocumentId: record.relatedDocumentId || null,
        } as Record<string, any>;

        if (record.relatedDocumentId) {
          const relatedDocument = await this.performanceDocumentCenterEntity.findOneBy({
            id: Number(record.relatedDocumentId),
          });
          if (relatedDocument) {
            response.relatedDocumentSummary = {
              id: relatedDocument.id,
              fileNo: relatedDocument.fileNo,
              fileName: relatedDocument.fileName,
            };
          }
        }

        return response;
      }
      case 'designCollab':
        return {
          ...base,
          taskNo: record.recordNo,
          requesterName: record.ownerName || '',
          assigneeName: record.assigneeName || '',
          priority: record.priority || 'medium',
          dueDate: record.dueDate || '',
          progress: Number(record.progressValue || 0),
          workload: Number(extra.workload || 0),
          relatedMaterialNo: extra.relatedMaterialNo || null,
        };
      case 'expressCollab':
        return {
          ...base,
          trackingNo: record.recordNo,
          orderNo: extra.orderNo || '',
          courierCompany: record.category || extra.courierCompany || '',
          serviceLevel: extra.serviceLevel || 'standard',
          origin: extra.origin || '',
          destination: extra.destination || '',
          senderName: record.ownerName || '',
          receiverName: record.assigneeName || '',
          sourceSystem: extra.sourceSystem || 'manual',
          syncStatus: extra.syncStatus || 'pending',
          lastEvent: extra.lastEvent || '',
          lastUpdate: record.eventDate || '',
          etaDate: record.dueDate || '',
        };
    }
  }

  private matchQuery(moduleKey: OfficeCollabModuleKey, item: any, query: any) {
    const keyword = normalizeText(pickValue(query, ['keyword']), 100);
    const status = normalizeText(pickValue(query, ['status']), 32);

    if (status && item.status !== status) {
      return false;
    }

    if (
      keyword &&
      ![
        item.title,
        item.department,
        item.ownerName,
        item.assigneeName,
        item.materialNo,
        item.honorNo,
        item.taskNo,
        item.trackingNo,
        item.orderNo,
        item.notes,
      ].some(value => matchKeyword(value, keyword))
    ) {
      return false;
    }

    switch (moduleKey) {
      case 'annualInspection': {
        const category = normalizeText(pickValue(query, ['category']), 64);
        const department = normalizeText(pickValue(query, ['department']), 100);
        return (
          (!category || item.category === category) &&
          (!department || matchKeyword(item.department, department))
        );
      }
      case 'honor': {
        const honorType = normalizeText(
          pickValue(query, ['honorType', 'honor_type']),
          32
        );
        const level = normalizeText(pickValue(query, ['level']), 32);
        const department = normalizeText(pickValue(query, ['department']), 100);
        return (
          (!honorType || item.honorType === honorType) &&
          (!level || item.level === level) &&
          (!department || matchKeyword(item.department, department))
        );
      }
      case 'publicityMaterial': {
        const materialType = normalizeText(
          pickValue(query, ['materialType', 'material_type']),
          32
        );
        const channel = normalizeText(pickValue(query, ['channel']), 32);
        return (
          (!materialType || item.materialType === materialType) &&
          (!channel || item.channel === channel)
        );
      }
      case 'designCollab': {
        const priority = normalizeText(pickValue(query, ['priority']), 32);
        return !priority || item.priority === priority;
      }
      case 'expressCollab': {
        const company = normalizeText(
          pickValue(query, ['company', 'courierCompany', 'courier_company']),
          64
        );
        const serviceLevel = normalizeText(
          pickValue(query, ['serviceLevel', 'service_level']),
          32
        );
        const syncStatus = normalizeText(
          pickValue(query, ['syncStatus', 'sync_status']),
          32
        );
        const system = normalizeText(
          pickValue(query, ['system', 'sourceSystem', 'source_system']),
          64
        );
        return (
          (!company || matchKeyword(item.courierCompany, company)) &&
          (!serviceLevel || item.serviceLevel === serviceLevel) &&
          (!syncStatus || item.syncStatus === syncStatus) &&
          (!system || item.sourceSystem === system)
        );
      }
    }
  }

  private compareItems(moduleKey: OfficeCollabModuleKey, left: any, right: any) {
    switch (moduleKey) {
      case 'annualInspection':
        return compareDateAsc(left.dueDate, right.dueDate);
      case 'honor':
        return compareDateDesc(left.awardedAt, right.awardedAt);
      case 'publicityMaterial':
        return compareDateDesc(left.publishDate, right.publishDate);
      case 'designCollab':
        return compareDateAsc(left.dueDate, right.dueDate);
      case 'expressCollab':
        return compareDateDesc(left.lastUpdate, right.lastUpdate);
    }
  }

  private buildStats(moduleKey: OfficeCollabModuleKey, list: any[]) {
    switch (moduleKey) {
      case 'annualInspection': {
        const today = new Date().toISOString().slice(0, 10);
        const overdueCount = list.filter(
          item => item.dueDate && item.dueDate < today && item.status !== 'approved'
        ).length;
        const approvedCount = list.filter(item => item.status === 'approved').length;
        const avgCompleteness = list.length
          ? Math.round(
              list.reduce(
                (sum, item) => sum + Number(item.completeness || 0),
                0
              ) / list.length
            )
          : 0;
        return {
          total: list.length,
          overdueCount,
          approvedCount,
          avgCompleteness,
        };
      }
      case 'honor': {
        const publishedCount = list.filter(item => item.status === 'published').length;
        const thisYearCount = list.filter((item: any) =>
          String(item.awardedAt || '').startsWith(currentYear())
        ).length;
        const avgImpactScore = list.length
          ? Math.round(
              list.reduce(
                (sum, item) => sum + Number(item.impactScore || 0),
                0
              ) / list.length
            )
          : 0;
        return {
          total: list.length,
          publishedCount,
          thisYearCount,
          avgImpactScore,
        };
      }
      case 'publicityMaterial':
        return {
          total: list.length,
          publishedCount: list.filter(item => item.status === 'published').length,
          reviewingCount: list.filter(item => item.status === 'review').length,
          totalViews: list.reduce((sum, item) => sum + Number(item.views || 0), 0),
        };
      case 'designCollab': {
        const today = new Date().toISOString().slice(0, 10);
        return {
          total: list.length,
          doneCount: list.filter(item => item.status === 'done').length,
          inProgressCount: list.filter((item: any) =>
            ['in_progress', 'review'].includes(item.status)
          ).length,
          overdueCount: list.filter(
            (item: any) =>
              item.dueDate &&
              item.dueDate < today &&
              !['done', 'cancelled'].includes(item.status)
          ).length,
        };
      }
      case 'expressCollab':
        return {
          total: list.length,
          inTransitCount: list.filter(item => item.status === 'in_transit').length,
          deliveredCount: list.filter(item => item.status === 'delivered').length,
          exceptionCount: list.filter(item => item.status === 'exception').length,
          pendingSyncCount: list.filter(item => item.syncStatus === 'pending').length,
        };
    }
  }

  private async requireRecord(moduleKey: OfficeCollabModuleKey, id: number) {
    const target = await this.performanceOfficeCollabRecordEntity.findOneBy({
      id: Number(id),
      moduleKey,
    } as any);
    if (!target) {
      throw new CoolCommException(`${MODULE_META[moduleKey].label}不存在`);
    }
    return target;
  }

  private async assertRecordNoUnique(
    moduleKey: OfficeCollabModuleKey,
    recordNo: string,
    currentId?: number
  ) {
    const existing = await this.performanceOfficeCollabRecordEntity.findOneBy({
      moduleKey,
      recordNo,
    } as any);
    if (existing && Number(existing.id) !== Number(currentId || 0)) {
      throw new CoolCommException(`${MODULE_META[moduleKey].label}编号已存在`);
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

  private getPerm(moduleKey: OfficeCollabModuleKey, action: PermissionAction) {
    return `performance:${moduleKey}:${action}`;
  }

  private assertHasPerm(perms: string[], perm: string, message: string) {
    if (!Array.isArray(perms) || !perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }
}
