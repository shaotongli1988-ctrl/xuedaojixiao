/**
 * 物资管理统一领域服务。
 * 这里只负责一期冻结的物资目录、部门维度库存、入库、领用和库存流水最小主链，
 * 不负责采购审批分流、退还、预留流程、批次/库位管理或财务成本核算。
 * 维护重点是库存回写只能在 `receive/issue` 动作里发生，且口径始终围绕 currentQty/availableQty/reservedQty/issuedQty。
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
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceMaterialCatalogEntity } from '../entity/materialCatalog';
import { PerformanceMaterialInboundEntity } from '../entity/materialInbound';
import { PerformanceMaterialIssueEntity } from '../entity/materialIssue';
import { PerformanceMaterialStockEntity } from '../entity/materialStock';
import { PerformanceMaterialStockLogEntity } from '../entity/materialStockLog';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
  resolvePerformanceCurrentAdmin,
  resolvePerformanceRuntimeContext,
} from './access-context';

type MaterialCatalogStatus = 'active' | 'inactive';
type MaterialInboundStatus = 'draft' | 'submitted' | 'received' | 'cancelled';
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.departmentNotFound
  );
const PERFORMANCE_STATE_DRAFT_EDIT_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftEditOnly
  );
const PERFORMANCE_STATE_DRAFT_SUBMIT_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateDraftSubmitOnly
  );
const PERFORMANCE_STATE_CANCEL_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateCancelNotAllowed
  );
const PERFORMANCE_STATE_SUBMITTED_RECEIVE_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateSubmittedReceiveOnly
  );
const PERFORMANCE_MATERIAL_INBOUND_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.materialInboundNotFound
  );
const PERFORMANCE_MATERIAL_ISSUE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.materialIssueNotFound
  );
const PERFORMANCE_MATERIAL_CATALOG_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.materialCatalogNotFound
  );
type MaterialIssueStatus = 'draft' | 'submitted' | 'issued' | 'cancelled';
type MaterialStockLogBizType = 'inbound' | 'issue';
type MaterialStockLogChangeType = 'in' | 'out';
type MaterialStockStatus = 'sufficient' | 'lowStock' | 'outOfStock';

const MATERIAL_CATALOG_STATUS: MaterialCatalogStatus[] = ['active', 'inactive'];
const MATERIAL_INBOUND_STATUS: MaterialInboundStatus[] = [
  'draft',
  'submitted',
  'received',
  'cancelled',
];
const MATERIAL_ISSUE_STATUS: MaterialIssueStatus[] = [
  'draft',
  'submitted',
  'issued',
  'cancelled',
];

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
  if (!text || text.length > maxLength) {
    throw new CoolCommException(message);
  }
  return text;
}

function normalizeOptionalText(value: any, maxLength: number, message: string) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  if (text.length > maxLength) {
    throw new CoolCommException(message);
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

function normalizeNonNegativeInt(value: any, fallback: number, message: string) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new CoolCommException(message);
  }
  return parsed;
}

function normalizeMoney(value: any, fallback = 0, message = '金额不合法') {
  if (value === undefined || value === null || value === '') {
    return Number(fallback.toFixed(2));
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new CoolCommException(message);
  }
  return Number(parsed.toFixed(2));
}

function normalizeOptionalDateTime(value: any, message: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const text = String(value).trim();
  if (!text || text.length > 19) {
    throw new CoolCommException(message);
  }
  return text.slice(0, 19);
}

function normalizeBoolean(value: any) {
  if (value === true || value === false) {
    return value;
  }
  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }
  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }
  return null;
}

function nowTime() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function paginateList<T>(rows: T[], page: number, size: number) {
  const total = rows.length;
  const start = (page - 1) * size;
  return {
    list: rows.slice(start, start + size),
    pagination: {
      page,
      size,
      total,
    },
  };
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceMaterialDomainService extends BaseService {
  @InjectEntityModel(PerformanceMaterialCatalogEntity)
  performanceMaterialCatalogEntity: Repository<PerformanceMaterialCatalogEntity>;

  @InjectEntityModel(PerformanceMaterialStockEntity)
  performanceMaterialStockEntity: Repository<PerformanceMaterialStockEntity>;

  @InjectEntityModel(PerformanceMaterialInboundEntity)
  performanceMaterialInboundEntity: Repository<PerformanceMaterialInboundEntity>;

  @InjectEntityModel(PerformanceMaterialIssueEntity)
  performanceMaterialIssueEntity: Repository<PerformanceMaterialIssueEntity>;

  @InjectEntityModel(PerformanceMaterialStockLogEntity)
  performanceMaterialStockLogEntity: Repository<PerformanceMaterialStockLogEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    materialCatalog: {
      page: PERMISSIONS.performance.materialCatalog.page,
      info: PERMISSIONS.performance.materialCatalog.info,
      add: PERMISSIONS.performance.materialCatalog.add,
      update: PERMISSIONS.performance.materialCatalog.update,
      delete: PERMISSIONS.performance.materialCatalog.delete,
      updateStatus: PERMISSIONS.performance.materialCatalog.updateStatus,
    },
    materialStock: {
      page: PERMISSIONS.performance.materialStock.page,
      info: PERMISSIONS.performance.materialStock.info,
      summary: PERMISSIONS.performance.materialStock.summary,
    },
    materialInbound: {
      page: PERMISSIONS.performance.materialInbound.page,
      info: PERMISSIONS.performance.materialInbound.info,
      add: PERMISSIONS.performance.materialInbound.add,
      update: PERMISSIONS.performance.materialInbound.update,
      submit: PERMISSIONS.performance.materialInbound.submit,
      receive: PERMISSIONS.performance.materialInbound.receive,
      cancel: PERMISSIONS.performance.materialInbound.cancel,
    },
    materialIssue: {
      page: PERMISSIONS.performance.materialIssue.page,
      info: PERMISSIONS.performance.materialIssue.info,
      add: PERMISSIONS.performance.materialIssue.add,
      update: PERMISSIONS.performance.materialIssue.update,
      submit: PERMISSIONS.performance.materialIssue.submit,
      issue: PERMISSIONS.performance.materialIssue.issue,
      cancel: PERMISSIONS.performance.materialIssue.cancel,
    },
    materialStockLog: {
      page: PERMISSIONS.performance.materialStockLog.page,
    },
  };

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.materialCatalog.page]: 'material.catalog.read',
    [PERMISSIONS.performance.materialCatalog.info]: 'material.catalog.read',
    [PERMISSIONS.performance.materialCatalog.add]: 'material.catalog.create',
    [PERMISSIONS.performance.materialCatalog.update]: 'material.catalog.update',
    [PERMISSIONS.performance.materialCatalog.delete]: 'material.catalog.delete',
    [PERMISSIONS.performance.materialCatalog.updateStatus]:
      'material.catalog.update_status',
    [PERMISSIONS.performance.materialStock.page]: 'material.stock.read',
    [PERMISSIONS.performance.materialStock.info]: 'material.stock.read',
    [PERMISSIONS.performance.materialStock.summary]: 'material.stock.summary',
    [PERMISSIONS.performance.materialInbound.page]: 'material.inbound.read',
    [PERMISSIONS.performance.materialInbound.info]: 'material.inbound.read',
    [PERMISSIONS.performance.materialInbound.add]: 'material.inbound.create',
    [PERMISSIONS.performance.materialInbound.update]: 'material.inbound.update',
    [PERMISSIONS.performance.materialInbound.submit]: 'material.inbound.submit',
    [PERMISSIONS.performance.materialInbound.receive]: 'material.inbound.receive',
    [PERMISSIONS.performance.materialInbound.cancel]: 'material.inbound.cancel',
    [PERMISSIONS.performance.materialIssue.page]: 'material.issue.read',
    [PERMISSIONS.performance.materialIssue.info]: 'material.issue.read',
    [PERMISSIONS.performance.materialIssue.add]: 'material.issue.create',
    [PERMISSIONS.performance.materialIssue.update]: 'material.issue.update',
    [PERMISSIONS.performance.materialIssue.submit]: 'material.issue.submit',
    [PERMISSIONS.performance.materialIssue.issue]: 'material.issue.issue',
    [PERMISSIONS.performance.materialIssue.cancel]: 'material.issue.cancel',
    [PERMISSIONS.performance.materialStockLog.page]: 'material.stocklog.read',
  };

  private get currentCtx() {
    return resolvePerformanceRuntimeContext({
      ctx: this.ctx,
      app: this.app,
    });
  }

  private get currentAdmin() {
    return resolvePerformanceCurrentAdmin({
      ctx: this.ctx,
      app: this.app,
    });
  }

  async materialCatalogPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialCatalog.page,
      '无权限查看物资目录列表'
    );

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const rows = await this.loadMaterialCatalogRows(query);
    return paginateList(rows, page, size);
  }

  async materialCatalogInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialCatalog.info,
      '无权限查看物资目录详情'
    );

    const catalog = await this.requireMaterialCatalog(id);
    return this.buildMaterialCatalogRow(catalog);
  }

  async materialCatalogAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialCatalog.add,
      '无权限新增物资目录'
    );

    const normalized = await this.normalizeMaterialCatalogPayload(payload, null, 'add');
    const saved: any = await this.performanceMaterialCatalogEntity.save(
      this.performanceMaterialCatalogEntity.create(normalized as any)
    );
    return this.materialCatalogInfo(saved.id);
  }

  async materialCatalogUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialCatalog.update,
      '无权限编辑物资目录'
    );

    const catalog = await this.requireMaterialCatalog(
      normalizeRequiredPositiveInt(
        payload.id,
        PERFORMANCE_MATERIAL_CATALOG_NOT_FOUND_MESSAGE
      )
    );
    const normalized = await this.normalizeMaterialCatalogPayload(
      payload,
      catalog,
      'update'
    );

    await this.performanceMaterialCatalogEntity.update({ id: catalog.id }, normalized as any);
    return this.materialCatalogInfo(catalog.id);
  }

  async materialCatalogDelete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialCatalog.delete,
      '无权限删除物资目录'
    );

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

    const catalogs = await this.performanceMaterialCatalogEntity.find();
    const matched = catalogs.filter(item => validIds.includes(Number(item.id)));
    if (matched.length !== validIds.length) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    matched.forEach(item => {
      if (item.status !== 'inactive') {
        throw new CoolCommException('仅停用后的物资目录允许删除');
      }
    });

    const stockRows = await this.performanceMaterialStockEntity.find();
    stockRows
      .filter(item => validIds.includes(Number(item.catalogId)))
      .forEach(item => {
        if (
          Number(item.currentQty || 0) > 0 ||
          Number(item.availableQty || 0) > 0 ||
          Number(item.reservedQty || 0) > 0 ||
          Number(item.issuedQty || 0) > 0
        ) {
          throw new CoolCommException('物资仍有库存或历史发放数量，不允许删除');
        }
      });

    const inboundRows = await this.performanceMaterialInboundEntity.find();
    const issueRows = await this.performanceMaterialIssueEntity.find();
    const hasBiz =
      inboundRows.some(item => validIds.includes(Number(item.catalogId))) ||
      issueRows.some(item => validIds.includes(Number(item.catalogId)));
    if (hasBiz) {
      throw new CoolCommException('物资目录已有业务单据，不允许删除');
    }

    const stockIds = stockRows
      .filter(item => validIds.includes(Number(item.catalogId)))
      .map(item => Number(item.id))
      .filter(item => item > 0);

    if (stockIds.length) {
      for (const stockId of stockIds) {
        await this.performanceMaterialStockEntity.delete({ id: stockId } as any);
      }
    }

    for (const id of validIds) {
      await this.performanceMaterialCatalogEntity.delete({ id } as any);
    }
  }

  async materialCatalogUpdateStatus(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialCatalog.updateStatus,
      '无权限更新物资目录状态'
    );

    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_MATERIAL_CATALOG_NOT_FOUND_MESSAGE
    );
    await this.requireMaterialCatalog(id);
    const status = this.normalizeMaterialCatalogStatus(payload.status);

    await this.performanceMaterialCatalogEntity.update({ id }, { status } as any);
    return this.materialCatalogInfo(id);
  }

  async materialStockPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.materialStock.page, '无权限查看物资库存');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const rows = await this.loadMaterialStockRows(query);
    return paginateList(rows, page, size);
  }

  async materialStockInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialStock.info,
      '无权限查看物资库存详情'
    );

    const stock = await this.requireMaterialStock(id);
    const catalog = await this.requireMaterialCatalog(stock.catalogId);
    const department = await this.findDepartment(stock.departmentId);
    return this.normalizeMaterialStockRow(catalog, stock, department);
  }

  async materialStockSummary(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialStock.summary,
      '无权限查看物资库存汇总'
    );

    const rows = await this.loadMaterialStockRows(query);
    const catalogCount = new Set(rows.map(item => Number(item.catalogId))).size;
    const departmentCount = new Set(rows.map(item => Number(item.departmentId))).size;

    return {
      stockCount: rows.length,
      catalogCount,
      departmentCount,
      lowStockCount: rows.filter(item => item.stockStatus !== 'sufficient').length,
      totalCurrentQty: rows.reduce((sum, item) => sum + Number(item.currentQty || 0), 0),
      totalAvailableQty: rows.reduce((sum, item) => sum + Number(item.availableQty || 0), 0),
      totalReservedQty: rows.reduce((sum, item) => sum + Number(item.reservedQty || 0), 0),
      totalIssuedQty: rows.reduce((sum, item) => sum + Number(item.issuedQty || 0), 0),
      totalAmount: Number(
        rows.reduce((sum, item) => sum + Number(item.stockAmount || 0), 0).toFixed(2)
      ),
      pendingInboundCount: (await this.performanceMaterialInboundEntity.find()).filter(
        item => item.status === 'submitted'
      ).length,
      pendingIssueCount: (await this.performanceMaterialIssueEntity.find()).filter(
        item => item.status === 'submitted'
      ).length,
    };
  }

  async materialInboundPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialInbound.page,
      '无权限查看物资入库单'
    );

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const rows = await this.loadMaterialInboundRows(query);
    return paginateList(rows, page, size);
  }

  async materialInboundInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialInbound.info,
      '无权限查看物资入库详情'
    );

    const inbound = await this.requireMaterialInbound(id);
    return this.buildMaterialInboundDetail(inbound);
  }

  async materialInboundAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialInbound.add,
      '无权限新增物资入库单'
    );

    const normalized = await this.normalizeMaterialInboundPayload(payload, null, 'add');
    const saved: any = await this.performanceMaterialInboundEntity.save(
      this.performanceMaterialInboundEntity.create({
        ...normalized,
        submittedAt: null,
        receivedBy: null,
        receivedAt: null,
        status: 'draft',
      } as any)
    );
    return this.materialInboundInfo(saved.id);
  }

  async materialInboundUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialInbound.update,
      '无权限编辑物资入库单'
    );

    const inbound = await this.requireMaterialInbound(
      normalizeRequiredPositiveInt(
        payload.id,
        PERFORMANCE_MATERIAL_INBOUND_NOT_FOUND_MESSAGE
      )
    );
    if (inbound.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_EDIT_ONLY_MESSAGE);
    }

    const normalized = await this.normalizeMaterialInboundPayload(
      payload,
      inbound,
      'update'
    );
    await this.performanceMaterialInboundEntity.update({ id: inbound.id }, normalized as any);
    return this.materialInboundInfo(inbound.id);
  }

  async materialInboundSubmit(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialInbound.submit,
      '无权限提交物资入库单'
    );

    const inbound = await this.requireMaterialInbound(
      normalizeRequiredPositiveInt(
        payload.id,
        PERFORMANCE_MATERIAL_INBOUND_NOT_FOUND_MESSAGE
      )
    );
    if (inbound.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_SUBMIT_ONLY_MESSAGE);
    }
    await this.requireActiveMaterialCatalog(inbound.catalogId);
    await this.requireDepartment(inbound.departmentId);

    await this.performanceMaterialInboundEntity.update(
      { id: inbound.id },
      {
        status: 'submitted',
        submittedAt: nowTime(),
      } as any
    );
    return this.materialInboundInfo(inbound.id);
  }

  async materialInboundReceive(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialInbound.receive,
      '无权限确认物资入库'
    );

    const inbound = await this.requireMaterialInbound(
      normalizeRequiredPositiveInt(
        payload.id,
        PERFORMANCE_MATERIAL_INBOUND_NOT_FOUND_MESSAGE
      )
    );
    if (inbound.status !== 'submitted') {
      throw new CoolCommException(PERFORMANCE_STATE_SUBMITTED_RECEIVE_ONLY_MESSAGE);
    }

    const catalog = await this.requireActiveMaterialCatalog(inbound.catalogId);
    await this.requireDepartment(inbound.departmentId);
    const stock = await this.ensureMaterialStock(
      catalog.id,
      inbound.departmentId,
      Number(inbound.unitCost || catalog.referenceUnitCost || 0)
    );
    const receivedAt =
      normalizeOptionalDateTime(
        payload.receivedAt ?? payload.receiveDate,
        '入库时间不合法'
      ) || nowTime();
    const quantity = Number(inbound.quantity || 0);
    const beforeQty = Number(stock.currentQty || 0);
    const beforeAvailableQty = Number(stock.availableQty || 0);
    const afterQty = beforeQty + quantity;
    const afterAvailableQty = beforeAvailableQty + quantity;
    const operatorId = this.currentUserId();

    await this.performanceMaterialInboundEntity.update(
      { id: inbound.id },
      {
        status: 'received',
        receivedBy: operatorId,
        receivedAt,
      } as any
    );
    await this.performanceMaterialStockEntity.update(
      { id: stock.id },
      {
        currentQty: afterQty,
        availableQty: afterAvailableQty,
        lastUnitCost: Number(inbound.unitCost || catalog.referenceUnitCost || 0),
        lastInboundTime: receivedAt,
      } as any
    );
    await this.performanceMaterialStockLogEntity.save(
      this.performanceMaterialStockLogEntity.create({
        catalogId: catalog.id,
        departmentId: inbound.departmentId,
        stockId: stock.id,
        bizType: 'inbound',
        bizId: inbound.id,
        bizNo: inbound.inboundNo,
        changeType: 'in',
        quantity,
        beforeQuantity: beforeAvailableQty,
        afterQuantity: afterAvailableQty,
        unitCost: Number(inbound.unitCost || catalog.referenceUnitCost || 0),
        operatedAt: receivedAt,
        operatorId,
        operatorName: this.currentUserName(),
        remark: normalizeOptionalText(payload.remark ?? inbound.remark, 2000, '备注长度不合法'),
      } as any)
    );

    return this.materialInboundInfo(inbound.id);
  }

  async materialInboundCancel(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialInbound.cancel,
      '无权限取消物资入库单'
    );

    const inbound = await this.requireMaterialInbound(
      normalizeRequiredPositiveInt(
        payload.id,
        PERFORMANCE_MATERIAL_INBOUND_NOT_FOUND_MESSAGE
      )
    );
    if (!['draft', 'submitted'].includes(inbound.status)) {
      throw new CoolCommException(PERFORMANCE_STATE_CANCEL_NOT_ALLOWED_MESSAGE);
    }

    await this.performanceMaterialInboundEntity.update(
      { id: inbound.id },
      {
        status: 'cancelled',
        remark: normalizeOptionalText(payload.remark ?? inbound.remark, 2000, '备注长度不合法'),
      } as any
    );
    return this.materialInboundInfo(inbound.id);
  }

  async materialIssuePage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialIssue.page,
      '无权限查看物资领用单'
    );

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const rows = await this.loadMaterialIssueRows(query);
    return paginateList(rows, page, size);
  }

  async materialIssueInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialIssue.info,
      '无权限查看物资领用详情'
    );

    const issue = await this.requireMaterialIssue(id);
    return this.buildMaterialIssueDetail(issue);
  }

  async materialIssueAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialIssue.add,
      '无权限新增物资领用单'
    );

    const normalized = await this.normalizeMaterialIssuePayload(payload, null, 'add');
    const saved: any = await this.performanceMaterialIssueEntity.save(
      this.performanceMaterialIssueEntity.create({
        ...normalized,
        submittedAt: null,
        issuedBy: null,
        issuedAt: null,
        status: 'draft',
      } as any)
    );
    return this.materialIssueInfo(saved.id);
  }

  async materialIssueUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialIssue.update,
      '无权限编辑物资领用单'
    );

    const issue = await this.requireMaterialIssue(
      normalizeRequiredPositiveInt(
        payload.id,
        PERFORMANCE_MATERIAL_ISSUE_NOT_FOUND_MESSAGE
      )
    );
    if (issue.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_EDIT_ONLY_MESSAGE);
    }

    const normalized = await this.normalizeMaterialIssuePayload(payload, issue, 'update');
    await this.performanceMaterialIssueEntity.update({ id: issue.id }, normalized as any);
    return this.materialIssueInfo(issue.id);
  }

  async materialIssueSubmit(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialIssue.submit,
      '无权限提交物资领用单'
    );

    const issue = await this.requireMaterialIssue(
      normalizeRequiredPositiveInt(
        payload.id,
        PERFORMANCE_MATERIAL_ISSUE_NOT_FOUND_MESSAGE
      )
    );
    if (issue.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_SUBMIT_ONLY_MESSAGE);
    }
    await this.requireActiveMaterialCatalog(issue.catalogId);
    await this.requireDepartment(issue.departmentId);
    await this.requireUser(issue.assigneeId, '领用人不存在');

    await this.performanceMaterialIssueEntity.update(
      { id: issue.id },
      {
        status: 'submitted',
        submittedAt: nowTime(),
      } as any
    );
    return this.materialIssueInfo(issue.id);
  }

  async materialIssueIssue(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialIssue.issue,
      '无权限确认物资领用'
    );

    const issue = await this.requireMaterialIssue(
      normalizeRequiredPositiveInt(
        payload.id,
        PERFORMANCE_MATERIAL_ISSUE_NOT_FOUND_MESSAGE
      )
    );
    if (issue.status !== 'submitted') {
      throw new CoolCommException('仅 submitted 状态允许确认领用');
    }

    const catalog = await this.requireActiveMaterialCatalog(issue.catalogId);
    await this.requireDepartment(issue.departmentId);
    await this.requireUser(issue.assigneeId, '领用人不存在');
    const stock = await this.ensureMaterialStock(
      catalog.id,
      issue.departmentId,
      Number(catalog.referenceUnitCost || 0)
    );
    const quantity = Number(issue.quantity || 0);
    const beforeQty = Number(stock.currentQty || 0);
    const beforeAvailableQty = Number(stock.availableQty || 0);

    if (beforeAvailableQty < quantity) {
      throw new CoolCommException('可用库存不足，无法完成领用');
    }

    const issuedAt =
      normalizeOptionalDateTime(payload.issuedAt ?? payload.issueDate, '领用时间不合法') ||
      nowTime();
    const operatorId = this.currentUserId();
    const afterQty = beforeQty - quantity;
    const afterAvailableQty = beforeAvailableQty - quantity;

    await this.performanceMaterialIssueEntity.update(
      { id: issue.id },
      {
        status: 'issued',
        issuedBy: operatorId,
        issuedAt,
      } as any
    );
    await this.performanceMaterialStockEntity.update(
      { id: stock.id },
      {
        currentQty: afterQty,
        availableQty: afterAvailableQty,
        issuedQty: Number(stock.issuedQty || 0) + quantity,
        lastIssueTime: issuedAt,
      } as any
    );
    await this.performanceMaterialStockLogEntity.save(
      this.performanceMaterialStockLogEntity.create({
        catalogId: catalog.id,
        departmentId: issue.departmentId,
        stockId: stock.id,
        bizType: 'issue',
        bizId: issue.id,
        bizNo: issue.issueNo,
        changeType: 'out',
        quantity,
        beforeQuantity: beforeAvailableQty,
        afterQuantity: afterAvailableQty,
        unitCost: Number(stock.lastUnitCost || catalog.referenceUnitCost || 0),
        operatedAt: issuedAt,
        operatorId,
        operatorName: this.currentUserName(),
        remark: normalizeOptionalText(payload.remark ?? issue.remark, 2000, '备注长度不合法'),
      } as any)
    );

    return this.materialIssueInfo(issue.id);
  }

  async materialIssueCancel(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialIssue.cancel,
      '无权限取消物资领用单'
    );

    const issue = await this.requireMaterialIssue(
      normalizeRequiredPositiveInt(
        payload.id,
        PERFORMANCE_MATERIAL_ISSUE_NOT_FOUND_MESSAGE
      )
    );
    if (!['draft', 'submitted'].includes(issue.status)) {
      throw new CoolCommException(PERFORMANCE_STATE_CANCEL_NOT_ALLOWED_MESSAGE);
    }

    await this.performanceMaterialIssueEntity.update(
      { id: issue.id },
      {
        status: 'cancelled',
        remark: normalizeOptionalText(payload.remark ?? issue.remark, 2000, '备注长度不合法'),
      } as any
    );
    return this.materialIssueInfo(issue.id);
  }

  async materialStockLogPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.materialStockLog.page,
      '无权限查看物资库存流水'
    );

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const rows = await this.loadMaterialStockLogRows(query);
    return paginateList(rows, page, size);
  }

  private async loadMaterialCatalogRows(query: any) {
    const catalogs = await this.performanceMaterialCatalogEntity.find();
    const stockRows = await this.performanceMaterialStockEntity.find();
    const keyword = String(query.keyword || '').trim().toLowerCase();
    const status =
      query.status === undefined || query.status === null || query.status === ''
        ? null
        : this.normalizeMaterialCatalogStatus(query.status);
    const category = String(query.category || '').trim().toLowerCase();
    const departmentId =
      query.departmentId === undefined || query.departmentId === null || query.departmentId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.departmentId,
            PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
          );

    const groupedStockMap = this.groupStockRowsByCatalog(
      stockRows.filter(item =>
        departmentId ? Number(item.departmentId) === departmentId : true
      )
    );

    return catalogs
      .map(catalog => this.normalizeMaterialCatalogRow(catalog, groupedStockMap.get(Number(catalog.id)) || []))
      .filter(item => {
        if (
          keyword &&
          ![item.code, item.name, item.category, item.specification]
            .filter(Boolean)
            .some(value => String(value).toLowerCase().includes(keyword))
        ) {
          return false;
        }
        if (status && item.status !== status) {
          return false;
        }
        if (category && !String(item.category || '').toLowerCase().includes(category)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')));
  }

  private async loadMaterialStockRows(query: any) {
    const stockRows = await this.performanceMaterialStockEntity.find();
    const catalogs = await this.performanceMaterialCatalogEntity.find();
    const departments = await this.loadDepartmentMap(
      stockRows.map(item => Number(item.departmentId)).filter(item => item > 0)
    );
    const catalogMap = new Map(catalogs.map(item => [Number(item.id), item]));
    const keyword = String(query.keyword || '').trim().toLowerCase();
    const status =
      query.status === undefined || query.status === null || query.status === ''
        ? null
        : this.normalizeMaterialCatalogStatus(query.status);
    const category = String(query.category || '').trim().toLowerCase();
    const departmentId =
      query.departmentId === undefined || query.departmentId === null || query.departmentId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.departmentId,
            PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
          );
    const stockStatus =
      query.stockStatus === undefined || query.stockStatus === null || query.stockStatus === ''
        ? null
        : this.normalizeMaterialStockStatus(query.stockStatus);
    const onlyLowStock = normalizeBoolean(query.onlyLowStock ?? query.isLowStock);

    return stockRows
      .map(stock => {
        const catalog = catalogMap.get(Number(stock.catalogId));
        if (!catalog) {
          return null;
        }
        return this.normalizeMaterialStockRow(
          catalog,
          stock,
          departments.get(Number(stock.departmentId)) || null
        );
      })
      .filter(Boolean)
      .filter(item => {
        if (
          keyword &&
          ![
            item.materialCode,
            item.materialName,
            item.category,
            item.specification,
            item.departmentName,
          ]
            .filter(Boolean)
            .some(value => String(value).toLowerCase().includes(keyword))
        ) {
          return false;
        }
        if (status && item.status !== status) {
          return false;
        }
        if (category && !String(item.category || '').toLowerCase().includes(category)) {
          return false;
        }
        if (departmentId && Number(item.departmentId) !== departmentId) {
          return false;
        }
        if (stockStatus && item.stockStatus !== stockStatus) {
          return false;
        }
        if (onlyLowStock !== null && item.isLowStock !== onlyLowStock) {
          return false;
        }
        return true;
      })
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')));
  }

  private async loadMaterialInboundRows(query: any) {
    const rows = await this.performanceMaterialInboundEntity.find();
    const catalogs = await this.performanceMaterialCatalogEntity.find();
    const departments = await this.loadDepartmentMap(
      rows.map(item => Number(item.departmentId)).filter(item => item > 0)
    );
    const users = await this.loadUserMap(
      rows.map(item => Number(item.receivedBy)).filter(item => item > 0)
    );
    const catalogMap = new Map(catalogs.map(item => [Number(item.id), item]));
    const keyword = String(query.keyword || '').trim().toLowerCase();
    const status =
      query.status === undefined || query.status === null || query.status === ''
        ? null
        : this.normalizeMaterialInboundStatus(query.status);
    const departmentId =
      query.departmentId === undefined || query.departmentId === null || query.departmentId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.departmentId,
            PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
          );
    const catalogId =
      query.catalogId === undefined || query.catalogId === null || query.catalogId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.catalogId,
            PERFORMANCE_MATERIAL_CATALOG_NOT_FOUND_MESSAGE
          );

    return rows
      .map(item =>
        this.normalizeMaterialInboundRow(
          item,
          catalogMap.get(Number(item.catalogId)),
          departments.get(Number(item.departmentId)) || null,
          users.get(Number(item.receivedBy)) || null
        )
      )
      .filter(item => {
        if (
          keyword &&
          [
            item.inboundNo,
            item.title,
            item.materialCode,
            item.materialName,
            item.departmentName,
            item.sourceType,
            item.sourceBizId,
          ]
            .filter(Boolean)
            .every(value => !String(value).toLowerCase().includes(keyword))
        ) {
          return false;
        }
        if (status && item.status !== status) {
          return false;
        }
        if (departmentId && Number(item.departmentId) !== departmentId) {
          return false;
        }
        if (catalogId && Number(item.catalogId) !== catalogId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')));
  }

  private async loadMaterialIssueRows(query: any) {
    const rows = await this.performanceMaterialIssueEntity.find();
    const catalogs = await this.performanceMaterialCatalogEntity.find();
    const departments = await this.loadDepartmentMap(
      rows.map(item => Number(item.departmentId)).filter(item => item > 0)
    );
    const users = await this.loadUserMap(
      rows
        .flatMap(item => [Number(item.assigneeId), Number(item.issuedBy)])
        .filter(item => item > 0)
    );
    const catalogMap = new Map(catalogs.map(item => [Number(item.id), item]));
    const keyword = String(query.keyword || '').trim().toLowerCase();
    const status =
      query.status === undefined || query.status === null || query.status === ''
        ? null
        : this.normalizeMaterialIssueStatus(query.status);
    const departmentId =
      query.departmentId === undefined || query.departmentId === null || query.departmentId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.departmentId,
            PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
          );
    const catalogId =
      query.catalogId === undefined || query.catalogId === null || query.catalogId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.catalogId,
            PERFORMANCE_MATERIAL_CATALOG_NOT_FOUND_MESSAGE
          );

    return rows
      .map(item =>
        this.normalizeMaterialIssueRow(
          item,
          catalogMap.get(Number(item.catalogId)),
          departments.get(Number(item.departmentId)) || null,
          users.get(Number(item.assigneeId)) || null,
          users.get(Number(item.issuedBy)) || null
        )
      )
      .filter(item => {
        if (
          keyword &&
          [
            item.issueNo,
            item.title,
            item.materialCode,
            item.materialName,
            item.departmentName,
            item.assigneeName,
            item.purpose,
          ]
            .filter(Boolean)
            .every(value => !String(value).toLowerCase().includes(keyword))
        ) {
          return false;
        }
        if (status && item.status !== status) {
          return false;
        }
        if (departmentId && Number(item.departmentId) !== departmentId) {
          return false;
        }
        if (catalogId && Number(item.catalogId) !== catalogId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')));
  }

  private async loadMaterialStockLogRows(query: any) {
    const rows = await this.performanceMaterialStockLogEntity.find();
    const catalogs = await this.performanceMaterialCatalogEntity.find();
    const departments = await this.loadDepartmentMap(
      rows.map(item => Number(item.departmentId)).filter(item => item > 0)
    );
    const catalogMap = new Map(catalogs.map(item => [Number(item.id), item]));
    const keyword = String(query.keyword || '').trim().toLowerCase();
    const bizType =
      query.bizType === undefined || query.bizType === null || query.bizType === ''
        ? null
        : this.normalizeMaterialStockLogBizType(query.bizType);
    const departmentId =
      query.departmentId === undefined || query.departmentId === null || query.departmentId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.departmentId,
            PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
          );
    const catalogId =
      query.catalogId === undefined || query.catalogId === null || query.catalogId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.catalogId,
            PERFORMANCE_MATERIAL_CATALOG_NOT_FOUND_MESSAGE
          );

    return rows
      .map(item =>
        this.normalizeMaterialStockLogRow(
          item,
          catalogMap.get(Number(item.catalogId)),
          departments.get(Number(item.departmentId)) || null
        )
      )
      .filter(item => {
        if (
          keyword &&
          [item.bizNo, item.materialCode, item.materialName, item.operatorName, item.departmentName]
            .filter(Boolean)
            .every(value => !String(value).toLowerCase().includes(keyword))
        ) {
          return false;
        }
        if (bizType && item.bizType !== bizType) {
          return false;
        }
        if (departmentId && Number(item.departmentId) !== departmentId) {
          return false;
        }
        if (catalogId && Number(item.catalogId) !== catalogId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => String(b.operatedAt || '').localeCompare(String(a.operatedAt || '')));
  }

  private async normalizeMaterialCatalogPayload(
    payload: any,
    existing: PerformanceMaterialCatalogEntity | null,
    mode: 'add' | 'update'
  ) {
    const code = normalizeRequiredText(
      payload.code ?? payload.materialNo ?? existing?.code,
      50,
      '物资编码不能为空且长度不能超过 50'
    );
    const name = normalizeRequiredText(
      payload.name ?? existing?.name,
      200,
      '物资名称不能为空且长度不能超过 200'
    );
    const category = normalizeOptionalText(
      payload.category ?? existing?.category,
      100,
      '物资分类长度不能超过 100'
    );
    const specification = normalizeOptionalText(
      payload.specification ?? existing?.specification,
      200,
      '规格型号长度不能超过 200'
    );
    const unit = normalizeRequiredText(
      payload.unit ?? existing?.unit,
      20,
      '计量单位不能为空且长度不能超过 20'
    );
    const safetyStock = normalizeNonNegativeInt(
      payload.safetyStock,
      Number(existing?.safetyStock || 0),
      '安全库存不合法'
    );
    const referenceUnitCost = normalizeMoney(
      payload.referenceUnitCost ?? existing?.referenceUnitCost,
      0,
      '参考单价不合法'
    );
    const remark = normalizeOptionalText(
      payload.remark ?? existing?.remark,
      2000,
      '备注长度不能超过 2000'
    );

    if (payload.status !== undefined && payload.status !== null && payload.status !== '') {
      const requestedStatus = this.normalizeMaterialCatalogStatus(payload.status);
      const expectedStatus = mode === 'add' ? 'active' : existing?.status;
      if (requestedStatus !== expectedStatus) {
        throw new CoolCommException('请通过 updateStatus 更新目录状态');
      }
    }

    await this.assertMaterialCatalogCodeUnique(code, existing?.id);

    return {
      code,
      name,
      category,
      specification,
      unit,
      safetyStock,
      referenceUnitCost,
      status: existing?.status || 'active',
      remark,
    };
  }

  private async normalizeMaterialInboundPayload(
    payload: any,
    existing: PerformanceMaterialInboundEntity | null,
    mode: 'add' | 'update'
  ) {
    const inboundNo = normalizeRequiredText(
      payload.inboundNo ?? existing?.inboundNo ?? this.generateBizNo('MAT-IN'),
      50,
      '入库单号不能为空且长度不能超过 50'
    );
    const title = normalizeRequiredText(
      payload.title ?? existing?.title,
      200,
      '入库标题不能为空且长度不能超过 200'
    );
    const catalogId = normalizeRequiredPositiveInt(
      payload.catalogId ?? payload.materialId ?? existing?.catalogId,
      PERFORMANCE_MATERIAL_CATALOG_NOT_FOUND_MESSAGE
    );
    const departmentId = normalizeRequiredPositiveInt(
      payload.departmentId ?? existing?.departmentId,
      PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
    );
    const quantity = normalizeRequiredPositiveInt(
      payload.quantity ?? existing?.quantity,
      '入库数量不合法'
    );
    const unitCost = normalizeMoney(
      payload.unitCost ?? payload.unitPrice ?? existing?.unitCost,
      0,
      '入库单价不合法'
    );
    const totalAmount = normalizeMoney(
      payload.totalAmount ?? payload.amount ?? Number((quantity * unitCost).toFixed(2)),
      Number((quantity * unitCost).toFixed(2)),
      '入库金额不合法'
    );
    const sourceType = normalizeOptionalText(
      payload.sourceType ?? existing?.sourceType,
      50,
      '来源类型长度不能超过 50'
    );
    const sourceBizId = normalizeOptionalText(
      payload.sourceBizId ?? existing?.sourceBizId,
      100,
      '来源业务 ID 长度不能超过 100'
    );
    const remark = normalizeOptionalText(
      payload.remark ?? existing?.remark,
      2000,
      '备注长度不能超过 2000'
    );

    if (payload.status !== undefined && payload.status !== null && payload.status !== '') {
      const requestedStatus = this.normalizeMaterialInboundStatus(payload.status);
      const expectedStatus = mode === 'add' ? 'draft' : existing?.status;
      if (requestedStatus !== expectedStatus) {
        throw new CoolCommException('请通过流程动作更新入库状态');
      }
    }

    await this.requireActiveMaterialCatalog(catalogId);
    await this.requireDepartment(departmentId);
    await this.assertMaterialInboundNoUnique(inboundNo, existing?.id);

    return {
      inboundNo,
      title,
      catalogId,
      departmentId,
      quantity,
      unitCost,
      totalAmount,
      sourceType,
      sourceBizId,
      remark,
      submittedAt: existing?.submittedAt || null,
      receivedBy: existing?.receivedBy || null,
      receivedAt: existing?.receivedAt || null,
    };
  }

  private async normalizeMaterialIssuePayload(
    payload: any,
    existing: PerformanceMaterialIssueEntity | null,
    mode: 'add' | 'update'
  ) {
    const issueNo = normalizeRequiredText(
      payload.issueNo ?? existing?.issueNo ?? this.generateBizNo('MAT-OUT'),
      50,
      '领用单号不能为空且长度不能超过 50'
    );
    const title = normalizeRequiredText(
      payload.title ?? existing?.title,
      200,
      '领用标题不能为空且长度不能超过 200'
    );
    const catalogId = normalizeRequiredPositiveInt(
      payload.catalogId ?? payload.materialId ?? existing?.catalogId,
      PERFORMANCE_MATERIAL_CATALOG_NOT_FOUND_MESSAGE
    );
    const departmentId = normalizeRequiredPositiveInt(
      payload.departmentId ?? existing?.departmentId,
      PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
    );
    const quantity = normalizeRequiredPositiveInt(
      payload.quantity ?? existing?.quantity,
      '领用数量不合法'
    );
    const assigneeId = normalizeRequiredPositiveInt(
      payload.assigneeId ?? existing?.assigneeId,
      '领用人不存在'
    );
    const assignee = await this.requireUser(assigneeId, '领用人不存在');
    const assigneeName = normalizeRequiredText(
      payload.assigneeName ?? assignee.name ?? existing?.assigneeName,
      100,
      '领用人姓名不能为空且长度不能超过 100'
    );
    const purpose = normalizeOptionalText(
      payload.purpose ?? existing?.purpose,
      200,
      '用途长度不能超过 200'
    );
    const issueDate = normalizeOptionalDateTime(
      payload.issueDate ?? existing?.issueDate,
      '领用日期不合法'
    );
    const remark = normalizeOptionalText(
      payload.remark ?? existing?.remark,
      2000,
      '备注长度不能超过 2000'
    );

    if (payload.status !== undefined && payload.status !== null && payload.status !== '') {
      const requestedStatus = this.normalizeMaterialIssueStatus(payload.status);
      const expectedStatus = mode === 'add' ? 'draft' : existing?.status;
      if (requestedStatus !== expectedStatus) {
        throw new CoolCommException('请通过流程动作更新领用状态');
      }
    }

    await this.requireActiveMaterialCatalog(catalogId);
    await this.requireDepartment(departmentId);
    await this.assertMaterialIssueNoUnique(issueNo, existing?.id);

    return {
      issueNo,
      title,
      catalogId,
      departmentId,
      quantity,
      assigneeId,
      assigneeName,
      purpose,
      issueDate,
      remark,
      submittedAt: existing?.submittedAt || null,
      issuedBy: existing?.issuedBy || null,
      issuedAt: existing?.issuedAt || null,
    };
  }

  private normalizeMaterialCatalogStatus(value: any) {
    const status = String(value || 'active').trim() as MaterialCatalogStatus;
    if (!MATERIAL_CATALOG_STATUS.includes(status)) {
      throw new CoolCommException('物资目录状态不合法');
    }
    return status;
  }

  private normalizeMaterialInboundStatus(value: any) {
    const status = String(value || 'draft').trim() as MaterialInboundStatus;
    if (!MATERIAL_INBOUND_STATUS.includes(status)) {
      throw new CoolCommException('物资入库状态不合法');
    }
    return status;
  }

  private normalizeMaterialIssueStatus(value: any) {
    const status = String(value || 'draft').trim() as MaterialIssueStatus;
    if (!MATERIAL_ISSUE_STATUS.includes(status)) {
      throw new CoolCommException('物资领用状态不合法');
    }
    return status;
  }

  private normalizeMaterialStockStatus(value: any) {
    const status = String(value || '').trim() as MaterialStockStatus;
    if (!['sufficient', 'lowStock', 'outOfStock'].includes(status)) {
      throw new CoolCommException('库存状态不合法');
    }
    return status;
  }

  private normalizeMaterialStockLogBizType(value: any) {
    const bizType = String(value || '').trim() as MaterialStockLogBizType;
    if (!['inbound', 'issue'].includes(bizType)) {
      throw new CoolCommException('库存流水业务类型不合法');
    }
    return bizType;
  }

  private groupStockRowsByCatalog(stockRows: PerformanceMaterialStockEntity[]) {
    const map = new Map<number, PerformanceMaterialStockEntity[]>();
    stockRows.forEach(item => {
      const key = Number(item.catalogId);
      const current = map.get(key) || [];
      current.push(item);
      map.set(key, current);
    });
    return map;
  }

  private computeStockStatus(availableQty: number, safetyStock: number) {
    if (availableQty <= 0) {
      return 'outOfStock';
    }
    if (availableQty <= safetyStock) {
      return 'lowStock';
    }
    return 'sufficient';
  }

  private normalizeMaterialCatalogRow(
    catalog: PerformanceMaterialCatalogEntity,
    stockRows: PerformanceMaterialStockEntity[]
  ) {
    const currentQty = stockRows.reduce((sum, item) => sum + Number(item.currentQty || 0), 0);
    const availableQty = stockRows.reduce(
      (sum, item) => sum + Number(item.availableQty || 0),
      0
    );
    const reservedQty = stockRows.reduce(
      (sum, item) => sum + Number(item.reservedQty || 0),
      0
    );
    const issuedQty = stockRows.reduce((sum, item) => sum + Number(item.issuedQty || 0), 0);

    return {
      id: Number(catalog.id),
      code: catalog.code || '',
      materialNo: catalog.code || '',
      name: catalog.name || '',
      category: catalog.category || null,
      specification: catalog.specification || null,
      unit: catalog.unit || '',
      safetyStock: Number(catalog.safetyStock || 0),
      referenceUnitCost: Number(catalog.referenceUnitCost || 0),
      status: catalog.status || 'active',
      remark: catalog.remark || null,
      currentQty,
      availableQty,
      reservedQty,
      issuedQty,
      stockDepartmentCount: stockRows.length,
      departmentCount: stockRows.length,
      createTime: catalog.createTime || '',
      updateTime: catalog.updateTime || '',
    };
  }

  private normalizeMaterialStockRow(
    catalog: PerformanceMaterialCatalogEntity,
    stock: PerformanceMaterialStockEntity,
    department: BaseSysDepartmentEntity | null
  ) {
    const currentQty = Number(stock.currentQty || 0);
    const availableQty = Number(stock.availableQty || 0);
    const reservedQty = Number(stock.reservedQty || 0);
    const issuedQty = Number(stock.issuedQty || 0);
    const safetyStock = Number(catalog.safetyStock || 0);
    const lastUnitCost = Number(stock.lastUnitCost || catalog.referenceUnitCost || 0);
    const stockStatus = this.computeStockStatus(availableQty, safetyStock);

    return {
      id: Number(stock.id),
      stockId: Number(stock.id),
      catalogId: Number(catalog.id),
      materialId: Number(catalog.id),
      materialCode: catalog.code || '',
      materialNo: catalog.code || '',
      materialName: catalog.name || '',
      category: catalog.category || null,
      specification: catalog.specification || null,
      unit: catalog.unit || '',
      departmentId: Number(stock.departmentId || 0),
      departmentName: department?.name || '',
      safetyStock,
      status: catalog.status || 'active',
      currentQty,
      availableQty,
      reservedQty,
      issuedQty,
      lastUnitCost,
      stockAmount: Number((currentQty * lastUnitCost).toFixed(2)),
      stockStatus,
      isLowStock: stockStatus !== 'sufficient',
      lastInboundTime: stock.lastInboundTime || null,
      lastIssueTime: stock.lastIssueTime || null,
      createTime: stock.createTime || '',
      updateTime: stock.updateTime || catalog.updateTime || '',
    };
  }

  private normalizeMaterialInboundRow(
    inbound: PerformanceMaterialInboundEntity,
    catalog: PerformanceMaterialCatalogEntity | undefined,
    department: BaseSysDepartmentEntity | null,
    receiver: BaseSysUserEntity | null
  ) {
    return {
      id: Number(inbound.id),
      inboundNo: inbound.inboundNo || '',
      title: inbound.title || '',
      catalogId: Number(inbound.catalogId || 0),
      materialId: Number(inbound.catalogId || 0),
      materialCode: catalog?.code || '',
      materialNo: catalog?.code || '',
      materialName: catalog?.name || '',
      category: catalog?.category || null,
      specification: catalog?.specification || null,
      unit: catalog?.unit || '',
      departmentId: Number(inbound.departmentId || 0),
      departmentName: department?.name || '',
      quantity: Number(inbound.quantity || 0),
      unitCost: Number(inbound.unitCost || 0),
      unitPrice: Number(inbound.unitCost || 0),
      totalAmount: Number(inbound.totalAmount || 0),
      amount: Number(inbound.totalAmount || 0),
      sourceType: inbound.sourceType || null,
      sourceBizId: inbound.sourceBizId || null,
      receivedBy:
        inbound.receivedBy === null || inbound.receivedBy === undefined
          ? null
          : Number(inbound.receivedBy),
      receivedByName: receiver?.name || '',
      submittedAt: inbound.submittedAt || null,
      receivedAt: inbound.receivedAt || null,
      status: inbound.status || 'draft',
      remark: inbound.remark || null,
      createTime: inbound.createTime || '',
      updateTime: inbound.updateTime || '',
    };
  }

  private normalizeMaterialIssueRow(
    issue: PerformanceMaterialIssueEntity,
    catalog: PerformanceMaterialCatalogEntity | undefined,
    department: BaseSysDepartmentEntity | null,
    assignee: BaseSysUserEntity | null,
    issuer: BaseSysUserEntity | null
  ) {
    return {
      id: Number(issue.id),
      issueNo: issue.issueNo || '',
      title: issue.title || '',
      catalogId: Number(issue.catalogId || 0),
      materialId: Number(issue.catalogId || 0),
      materialCode: catalog?.code || '',
      materialNo: catalog?.code || '',
      materialName: catalog?.name || '',
      category: catalog?.category || null,
      specification: catalog?.specification || null,
      unit: catalog?.unit || '',
      departmentId: Number(issue.departmentId || 0),
      departmentName: department?.name || '',
      quantity: Number(issue.quantity || 0),
      assigneeId: Number(issue.assigneeId || 0),
      assigneeName: issue.assigneeName || assignee?.name || '',
      purpose: issue.purpose || null,
      issueDate: issue.issueDate || null,
      submittedAt: issue.submittedAt || null,
      issuedBy:
        issue.issuedBy === null || issue.issuedBy === undefined ? null : Number(issue.issuedBy),
      issuedByName: issuer?.name || '',
      issuedAt: issue.issuedAt || null,
      status: issue.status || 'draft',
      remark: issue.remark || null,
      createTime: issue.createTime || '',
      updateTime: issue.updateTime || '',
    };
  }

  private normalizeMaterialStockLogRow(
    log: PerformanceMaterialStockLogEntity,
    catalog: PerformanceMaterialCatalogEntity | undefined,
    department: BaseSysDepartmentEntity | null
  ) {
    return {
      id: Number(log.id),
      catalogId: Number(log.catalogId || 0),
      stockId: Number(log.stockId || 0),
      departmentId: Number(log.departmentId || 0),
      departmentName: department?.name || '',
      materialCode: catalog?.code || '',
      materialNo: catalog?.code || '',
      materialName: catalog?.name || '',
      unit: catalog?.unit || '',
      bizType: log.bizType || '',
      bizId: Number(log.bizId || 0),
      bizNo: log.bizNo || null,
      changeType: log.changeType || '',
      quantity: Number(log.quantity || 0),
      beforeQuantity: Number(log.beforeQuantity || 0),
      afterQuantity: Number(log.afterQuantity || 0),
      unitCost: Number(log.unitCost || 0),
      operatedAt: log.operatedAt || '',
      operatorId:
        log.operatorId === null || log.operatorId === undefined
          ? null
          : Number(log.operatorId),
      operatorName: log.operatorName || '',
      remark: log.remark || null,
      createTime: log.createTime || '',
      updateTime: log.updateTime || '',
    };
  }

  private async buildMaterialCatalogRow(catalog: PerformanceMaterialCatalogEntity) {
    const stockRows = await this.performanceMaterialStockEntity.findBy({ catalogId: catalog.id } as any);
    return this.normalizeMaterialCatalogRow(catalog, stockRows);
  }

  private async buildMaterialInboundDetail(inbound: PerformanceMaterialInboundEntity) {
    const [catalog, department, receiver] = await Promise.all([
      this.requireMaterialCatalog(inbound.catalogId),
      this.findDepartment(inbound.departmentId),
      inbound.receivedBy ? this.findUser(inbound.receivedBy) : Promise.resolve(null),
    ]);
    return this.normalizeMaterialInboundRow(inbound, catalog, department, receiver);
  }

  private async buildMaterialIssueDetail(issue: PerformanceMaterialIssueEntity) {
    const [catalog, department, assignee, issuer] = await Promise.all([
      this.requireMaterialCatalog(issue.catalogId),
      this.findDepartment(issue.departmentId),
      this.findUser(issue.assigneeId),
      issue.issuedBy ? this.findUser(issue.issuedBy) : Promise.resolve(null),
    ]);
    return this.normalizeMaterialIssueRow(issue, catalog, department, assignee, issuer);
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
      throw new CoolCommException(`未映射的物资权限: ${perm}`);
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

  private currentUserId() {
    return Number(this.currentAdmin?.userId || 0) || null;
  }

  private currentUserName() {
    return String(
      this.currentAdmin?.name || this.currentAdmin?.nickName || this.currentAdmin?.username || ''
    );
  }

  private generateBizNo(prefix: string) {
    return `${prefix}-${Date.now()}`;
  }

  private async loadDepartmentMap(ids: number[]) {
    const uniqueIds = Array.from(new Set(ids.filter(id => Number.isInteger(id) && id > 0)));
    if (!uniqueIds.length) {
      return new Map<number, BaseSysDepartmentEntity>();
    }
    const rows = await this.baseSysDepartmentEntity.findBy(uniqueIds.map(id => ({ id })) as any);
    return new Map(rows.map(item => [Number(item.id), item]));
  }

  private async loadUserMap(ids: number[]) {
    const uniqueIds = Array.from(new Set(ids.filter(id => Number.isInteger(id) && id > 0)));
    if (!uniqueIds.length) {
      return new Map<number, BaseSysUserEntity>();
    }
    const rows = await this.baseSysUserEntity.findBy(uniqueIds.map(id => ({ id })) as any);
    return new Map(rows.map(item => [Number(item.id), item]));
  }

  private async findDepartment(id: number) {
    if (!Number(id)) {
      return null;
    }
    return this.baseSysDepartmentEntity.findOneBy({ id } as any);
  }

  private async findUser(id: number) {
    if (!Number(id)) {
      return null;
    }
    return this.baseSysUserEntity.findOneBy({ id } as any);
  }

  private async requireDepartment(id: number) {
    const department = await this.findDepartment(id);
    if (!department) {
      throw new CoolCommException(PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE);
    }
    return department;
  }

  private async requireUser(id: number, message = '用户不存在') {
    const user = await this.findUser(id);
    if (!user) {
      throw new CoolCommException(message);
    }
    return user;
  }

  private async assertMaterialCatalogCodeUnique(code: string, excludeId?: number) {
    const exists = await this.performanceMaterialCatalogEntity.findOneBy({ code } as any);
    if (exists && Number(exists.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('物资编码已存在');
    }
  }

  private async assertMaterialInboundNoUnique(inboundNo: string, excludeId?: number) {
    const exists = await this.performanceMaterialInboundEntity.findOneBy({ inboundNo } as any);
    if (exists && Number(exists.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('入库单号已存在');
    }
  }

  private async assertMaterialIssueNoUnique(issueNo: string, excludeId?: number) {
    const exists = await this.performanceMaterialIssueEntity.findOneBy({ issueNo } as any);
    if (exists && Number(exists.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('领用单号已存在');
    }
  }

  private async requireMaterialCatalog(id: number) {
    const catalog = await this.performanceMaterialCatalogEntity.findOneBy({ id } as any);
    if (!catalog) {
      throw new CoolCommException(PERFORMANCE_MATERIAL_CATALOG_NOT_FOUND_MESSAGE);
    }
    return catalog;
  }

  private async requireActiveMaterialCatalog(id: number) {
    const catalog = await this.requireMaterialCatalog(id);
    if (catalog.status !== 'active') {
      throw new CoolCommException('物资目录已停用');
    }
    return catalog;
  }

  private async requireMaterialStock(id: number) {
    const stock = await this.performanceMaterialStockEntity.findOneBy({ id } as any);
    if (!stock) {
      throw new CoolCommException('物资库存不存在');
    }
    return stock;
  }

  private async requireMaterialInbound(id: number) {
    const inbound = await this.performanceMaterialInboundEntity.findOneBy({ id } as any);
    if (!inbound) {
      throw new CoolCommException(PERFORMANCE_MATERIAL_INBOUND_NOT_FOUND_MESSAGE);
    }
    return inbound;
  }

  private async requireMaterialIssue(id: number) {
    const issue = await this.performanceMaterialIssueEntity.findOneBy({ id } as any);
    if (!issue) {
      throw new CoolCommException(PERFORMANCE_MATERIAL_ISSUE_NOT_FOUND_MESSAGE);
    }
    return issue;
  }

  private async ensureMaterialStock(catalogId: number, departmentId: number, lastUnitCost = 0) {
    const existing = await this.performanceMaterialStockEntity.findOneBy({
      catalogId,
      departmentId,
    } as any);
    if (existing) {
      return existing;
    }
    return (await this.performanceMaterialStockEntity.save(
      this.performanceMaterialStockEntity.create({
        catalogId,
        departmentId,
        currentQty: 0,
        availableQty: 0,
        reservedQty: 0,
        issuedQty: 0,
        lastUnitCost: normalizeMoney(lastUnitCost, 0),
        lastInboundTime: null,
        lastIssueTime: null,
      } as any)
    )) as any;
  }
}
