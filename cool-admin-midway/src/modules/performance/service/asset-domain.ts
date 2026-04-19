/**
 * 资产管理统一领域服务。
 * 这里只负责主题20冻结的资产台账、领用、维护、采购入库、调拨、盘点、折旧、报废、首页和报表最小主链，
 * 不负责采购审批中心、供应商主数据中心、财务凭证、RFID/扫码或移动端入口。
 * 维护重点是权限边界、部门树范围和资产主状态回写必须始终收敛到这一处，避免子流程各自改状态造成漂移。
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
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceAssetAssignmentEntity } from '../entity/assetAssignment';
import { PerformanceAssetDepreciationEntity } from '../entity/assetDepreciation';
import { PerformanceAssetDisposalEntity } from '../entity/assetDisposal';
import { PerformanceAssetInfoEntity } from '../entity/assetInfo';
import { PerformanceAssetInventoryEntity } from '../entity/assetInventory';
import { PerformanceAssetMaintenanceEntity } from '../entity/assetMaintenance';
import { PerformanceAssetProcurementEntity } from '../entity/assetProcurement';
import { PerformanceAssetTransferEntity } from '../entity/assetTransfer';
import { PerformancePurchaseOrderEntity } from '../entity/purchase-order';
import { PerformanceSupplierEntity } from '../entity/supplier';

type AssetStatus =
  | 'pendingInbound'
  | 'available'
  | 'assigned'
  | 'maintenance'
  | 'inTransfer'
  | 'inventorying'
  | 'scrapped'
  | 'lost';
type AssignmentStatus = 'assigned' | 'returned' | 'lost';
type MaintenanceStatus = 'scheduled' | 'inProgress' | 'completed' | 'cancelled';
type ProcurementStatus = 'draft' | 'submitted' | 'received' | 'cancelled';
type TransferStatus = 'draft' | 'submitted' | 'inTransit' | 'completed' | 'cancelled';
type InventoryStatus = 'draft' | 'counting' | 'completed' | 'closed';
type DisposalStatus = 'draft' | 'submitted' | 'approved' | 'scrapped' | 'cancelled';

const ASSET_STATUSES: AssetStatus[] = [
  'pendingInbound',
  'available',
  'assigned',
  'maintenance',
  'inTransfer',
  'inventorying',
  'scrapped',
  'lost',
];
const ASSIGNMENT_STATUSES: AssignmentStatus[] = ['assigned', 'returned', 'lost'];
const MAINTENANCE_STATUSES: MaintenanceStatus[] = [
  'scheduled',
  'inProgress',
  'completed',
  'cancelled',
];
const PROCUREMENT_STATUSES: ProcurementStatus[] = [
  'draft',
  'submitted',
  'received',
  'cancelled',
];
const TRANSFER_STATUSES: TransferStatus[] = [
  'draft',
  'submitted',
  'inTransit',
  'completed',
  'cancelled',
];
const INVENTORY_STATUSES: InventoryStatus[] = [
  'draft',
  'counting',
  'completed',
  'closed',
];
const DISPOSAL_STATUSES: DisposalStatus[] = [
  'draft',
  'submitted',
  'approved',
  'scrapped',
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

function normalizeOptionalPositiveInt(value: any, message: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return normalizeRequiredPositiveInt(value, message);
}

function normalizeMoney(value: any, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Number(parsed.toFixed(2));
}

function normalizeDate(value: any, maxLength = 19) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  return text.slice(0, maxLength);
}

function ensureStatus<T extends string>(value: any, allowed: T[], message: string): T {
  const status = String(value || '').trim() as T;
  if (!allowed.includes(status)) {
    throw new CoolCommException(message);
  }
  return status;
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

function nowTime() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function monthValue(value?: string | null) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) {
    return raw;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function uniqueNumberList(values: Array<number | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    )
  );
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceAssetDomainService extends BaseService {
  @InjectEntityModel(PerformanceAssetInfoEntity)
  performanceAssetInfoEntity: Repository<PerformanceAssetInfoEntity>;

  @InjectEntityModel(PerformanceAssetAssignmentEntity)
  performanceAssetAssignmentEntity: Repository<PerformanceAssetAssignmentEntity>;

  @InjectEntityModel(PerformanceAssetMaintenanceEntity)
  performanceAssetMaintenanceEntity: Repository<PerformanceAssetMaintenanceEntity>;

  @InjectEntityModel(PerformanceAssetProcurementEntity)
  performanceAssetProcurementEntity: Repository<PerformanceAssetProcurementEntity>;

  @InjectEntityModel(PerformanceAssetTransferEntity)
  performanceAssetTransferEntity: Repository<PerformanceAssetTransferEntity>;

  @InjectEntityModel(PerformanceAssetInventoryEntity)
  performanceAssetInventoryEntity: Repository<PerformanceAssetInventoryEntity>;

  @InjectEntityModel(PerformanceAssetDepreciationEntity)
  performanceAssetDepreciationEntity: Repository<PerformanceAssetDepreciationEntity>;

  @InjectEntityModel(PerformanceAssetDisposalEntity)
  performanceAssetDisposalEntity: Repository<PerformanceAssetDisposalEntity>;

  @InjectEntityModel(PerformanceSupplierEntity)
  performanceSupplierEntity: Repository<PerformanceSupplierEntity>;

  @InjectEntityModel(PerformancePurchaseOrderEntity)
  performancePurchaseOrderEntity: Repository<PerformancePurchaseOrderEntity>;

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

  private async departmentScopeIds(perms: string[]) {
    if (
      this.currentAdmin?.isAdmin === true ||
      this.currentAdmin?.username === 'admin' ||
      this.hasPerm(perms, 'performance:assetInfo:add') ||
      this.hasPerm(perms, 'performance:assetProcurement:receive') ||
      this.hasPerm(perms, 'performance:assetDepreciation:recalculate')
    ) {
      return null;
    }

    const userId = Number(this.currentAdmin?.userId || 0);
    if (!userId) {
      throw new CoolCommException('登录上下文缺失');
    }

    const ids = await this.baseSysPermsService.departmentIds(userId);
    return uniqueNumberList(ids);
  }

  private async assertDepartmentInScope(
    departmentId: number | null | undefined,
    perms: string[],
    message: string
  ) {
    const scopeIds = await this.departmentScopeIds(perms);
    if (scopeIds === null) {
      return;
    }
    if (!scopeIds.length || !scopeIds.includes(Number(departmentId || 0))) {
      throw new CoolCommException(message);
    }
  }

  private async scopeRows<T>(
    rows: T[],
    perms: string[],
    getter: (row: T) => number | null | undefined
  ) {
    const scopeIds = await this.departmentScopeIds(perms);
    if (scopeIds === null) {
      return rows;
    }
    if (!scopeIds.length) {
      return [];
    }
    return rows.filter(row => scopeIds.includes(Number(getter(row) || 0)));
  }

  private async departmentMap(ids: number[]) {
    const rows = ids.length
      ? await this.baseSysDepartmentEntity.findBy(ids.map(id => ({ id })) as any)
      : [];
    return new Map(rows.map(item => [Number(item.id), item]));
  }

  private async userMap(ids: number[]) {
    const rows = ids.length
      ? await this.baseSysUserEntity.findBy(ids.map(id => ({ id })) as any)
      : [];
    return new Map(rows.map(item => [Number(item.id), item]));
  }

  private async supplierMap(ids: number[]) {
    const rows = ids.length
      ? await this.performanceSupplierEntity.findBy(ids.map(id => ({ id })) as any)
      : [];
    return new Map(rows.map(item => [Number(item.id), item]));
  }

  private async purchaseOrderMap(ids: number[]) {
    const rows = ids.length
      ? await this.performancePurchaseOrderEntity.findBy(ids.map(id => ({ id })) as any)
      : [];
    return new Map(rows.map(item => [Number(item.id), item]));
  }

  private async loadAsset(assetId: number, message = '资产不存在') {
    const asset = await this.performanceAssetInfoEntity.findOneBy({ id: assetId });
    if (!asset) {
      throw new CoolCommException(message);
    }
    return asset;
  }

  private normalizeAssetRow(
    asset: PerformanceAssetInfoEntity,
    maps: {
      departments: Map<number, any>;
      users: Map<number, any>;
      suppliers: Map<number, any>;
    }
  ) {
    return {
      id: asset.id,
      assetNo: asset.assetNo,
      name: asset.assetName,
      category: asset.category || '',
      assetStatus: asset.status,
      assetType: asset.assetType || '',
      brand: asset.brand || '',
      model: asset.model || '',
      serialNo: asset.serialNo || '',
      location: asset.location || '',
      departmentId: asset.ownerDepartmentId,
      departmentName:
        maps.departments.get(Number(asset.ownerDepartmentId))?.name || '',
      managerId: asset.managerId,
      managerName: maps.users.get(Number(asset.managerId || 0))?.name || '',
      purchaseDate: asset.purchaseDate || '',
      purchaseAmount: Number(asset.purchaseCost || 0),
      supplierId: asset.supplierId,
      supplierName: maps.suppliers.get(Number(asset.supplierId || 0))?.name || '',
      purchaseOrderId: asset.purchaseOrderId,
      warrantyExpiry: asset.warrantyExpiry || '',
      residualValue: Number(asset.netBookValue || 0),
      depreciationMonths: Number(asset.depreciationMonths || 0),
      depreciationStartMonth: asset.purchaseDate ? String(asset.purchaseDate).slice(0, 7) : '',
      remark: asset.remark || '',
      createTime: asset.createTime,
      updateTime: asset.updateTime,
    };
  }

  async assetDashboardSummary(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDashboard:summary', '无权限查看资产首页');

    let assets = await this.performanceAssetInfoEntity.find();
    assets = await this.scopeRows(assets, perms, item => item.ownerDepartmentId);

    if (query?.category) {
      assets = assets.filter(item => item.category === String(query.category).trim());
    }

    const disposalRows = await this.scopeRows(
      await this.performanceAssetDisposalEntity.find(),
      perms,
      item => item.ownerDepartmentId
    );
    const assetMapForSummary = new Map(assets.map(item => [Number(item.id), item]));
    const depreciationRows = (await this.performanceAssetDepreciationEntity.find()).filter(item =>
      assetMapForSummary.has(Number(item.assetId))
    );
    const pendingDisposalCount = disposalRows.filter(item =>
      ['submitted', 'approved'].includes(item.status)
    ).length;
    const totalOriginalAmount = assets.reduce(
      (sum, item) => sum + Number(item.purchaseCost || 0),
      0
    );
    const monthlyDepreciationAmount = depreciationRows
      .filter(item => item.periodValue === monthValue(query?.month))
      .reduce((sum, item) => sum + Number(item.depreciationAmount || 0), 0);
    const statusDistribution = ASSET_STATUSES.map(status => ({
      status,
      count: assets.filter(item => item.status === status).length,
      amount: assets
        .filter(item => item.status === status)
        .reduce((sum, item) => sum + Number(item.purchaseCost || 0), 0),
    }));
    const categoryDistribution = Array.from(
      assets.reduce((map, item) => {
        const key = item.category || '未分类';
        const current = map.get(key) || { category: key, count: 0, amount: 0 };
        current.count += 1;
        current.amount += Number(item.purchaseCost || 0);
        map.set(key, current);
        return map;
      }, new Map<string, any>()).values()
    );

    const recentActivities = [
      ...(await this.performanceAssetAssignmentEntity.find()).map(item => ({
        id: item.id,
        module: 'assetAssignment',
        title: `领用归还 #${item.id}`,
        status: item.status,
        occurredAt: item.updateTime,
      })),
      ...(await this.performanceAssetMaintenanceEntity.find()).map(item => ({
        id: item.id,
        module: 'assetMaintenance',
        title: `维护保养 #${item.id}`,
        status: item.status,
        occurredAt: item.updateTime,
      })),
      ...(await this.performanceAssetProcurementEntity.find()).map(item => ({
        id: item.id,
        module: 'assetProcurement',
        title: item.title,
        status: item.status,
        occurredAt: item.updateTime,
      })),
      ...(await this.performanceAssetTransferEntity.find()).map(item => ({
        id: item.id,
        module: 'assetTransfer',
        title: item.transferNo,
        status: item.status,
        occurredAt: item.updateTime,
      })),
      ...(await this.performanceAssetInventoryEntity.find()).map(item => ({
        id: item.id,
        module: 'assetInventory',
        title: item.inventoryNo,
        status: item.status,
        occurredAt: item.updateTime,
      })),
      ...(await this.performanceAssetDisposalEntity.find()).map(item => ({
        id: item.id,
        module: 'assetDisposal',
        title: item.disposalNo,
        status: item.status,
        occurredAt: item.updateTime,
      })),
    ]
      .sort((a, b) => String(b.occurredAt || '').localeCompare(String(a.occurredAt || '')))
      .slice(0, 10);

    const today = new Date();
    const deadline = new Date(today.getTime() + 30 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);

    return {
      totalAssetCount: assets.length,
      pendingInboundCount: assets.filter(item => item.status === 'pendingInbound').length,
      availableCount: assets.filter(item => item.status === 'available').length,
      assignedCount: assets.filter(item => item.status === 'assigned').length,
      maintenanceCount: assets.filter(item => item.status === 'maintenance').length,
      inventoryingCount: assets.filter(item => item.status === 'inventorying').length,
      scrappedCount: assets.filter(item => item.status === 'scrapped').length,
      lostCount: assets.filter(item => item.status === 'lost').length,
      totalOriginalAmount,
      monthlyDepreciationAmount,
      pendingDisposalCount,
      expiringWarrantyCount: assets.filter(
        item => item.warrantyExpiry && item.warrantyExpiry <= deadline
      ).length,
      statusDistribution,
      categoryDistribution,
      recentActivities,
      updatedAt: nowTime(),
    };
  }

  async assetInfoPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInfo:page', '无权限查看资产台账');
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    let assets = await this.performanceAssetInfoEntity.find();
    assets = await this.scopeRows(assets, perms, item => item.ownerDepartmentId);

    const keyword = String(query.keyword || '').trim().toLowerCase();
    if (keyword) {
      assets = assets.filter(item =>
        [item.assetNo, item.assetName, item.serialNo]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(keyword))
      );
    }
    if (query.category) {
      assets = assets.filter(item => item.category === String(query.category).trim());
    }
    if (query.assetStatus) {
      assets = assets.filter(item => item.status === String(query.assetStatus).trim());
    }
    if (query.departmentId) {
      assets = assets.filter(
        item => Number(item.ownerDepartmentId) === Number(query.departmentId)
      );
    }
    if (query.managerId) {
      assets = assets.filter(item => Number(item.managerId || 0) === Number(query.managerId));
    }

    assets.sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')));

    const departmentIds = uniqueNumberList(assets.map(item => item.ownerDepartmentId));
    const userIds = uniqueNumberList(assets.map(item => item.managerId));
    const supplierIds = uniqueNumberList(assets.map(item => item.supplierId));
    const maps = {
      departments: await this.departmentMap(departmentIds),
      users: await this.userMap(userIds),
      suppliers: await this.supplierMap(supplierIds),
    };

    const normalized = assets.map(item => this.normalizeAssetRow(item, maps));
    return paginateList(normalized, page, size);
  }

  async assetInfoDetail(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInfo:info', '无权限查看资产详情');
    const asset = await this.loadAsset(Number(id));
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权查看该资产');
    const maps = {
      departments: await this.departmentMap([asset.ownerDepartmentId]),
      users: await this.userMap([asset.managerId || 0]),
      suppliers: await this.supplierMap([asset.supplierId || 0]),
    };
    return this.normalizeAssetRow(asset, maps);
  }

  async assetInfoAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInfo:add', '无权限新增资产');
    const ownerDepartmentId = normalizeRequiredPositiveInt(
      payload.departmentId ?? payload.ownerDepartmentId,
      '所属部门不能为空'
    );
    await this.assertDepartmentInScope(ownerDepartmentId, perms, '无权操作该资产');

    const assetNo = normalizeRequiredText(payload.assetNo, 50, '资产编号不能为空且长度不能超过 50');
    const exists = await this.performanceAssetInfoEntity.findOneBy({ assetNo });
    if (exists) {
      throw new CoolCommException('资产编号已存在');
    }

    const saved = await this.performanceAssetInfoEntity.save(
      this.performanceAssetInfoEntity.create({
        assetNo,
        assetName: normalizeRequiredText(
          payload.name ?? payload.assetName,
          200,
          '资产名称不能为空且长度不能超过 200'
        ),
        category: normalizeOptionalText(payload.category, 100, '资产分类长度不能超过 100'),
        assetType: normalizeOptionalText(payload.assetType, 100, '资产类型长度不能超过 100'),
        brand: normalizeOptionalText(payload.brand, 100, '品牌长度不能超过 100'),
        model: normalizeOptionalText(payload.model, 100, '型号长度不能超过 100'),
        serialNo: normalizeOptionalText(payload.serialNo, 100, '序列号长度不能超过 100'),
        status: payload.assetStatus
          ? ensureStatus(payload.assetStatus, ASSET_STATUSES, '资产状态不合法')
          : 'available',
        location: normalizeOptionalText(payload.location, 200, '存放位置长度不能超过 200'),
        ownerDepartmentId,
        managerId: normalizeOptionalPositiveInt(payload.managerId, '管理人不合法'),
        purchaseDate: normalizeDate(payload.purchaseDate, 10),
        purchaseCost: normalizeMoney(payload.purchaseAmount ?? payload.purchaseCost, 0),
        supplierId: normalizeOptionalPositiveInt(payload.supplierId, '供应商不存在'),
        purchaseOrderId: normalizeOptionalPositiveInt(payload.purchaseOrderId, '采购订单不存在'),
        warrantyExpiry: normalizeDate(payload.warrantyExpiry, 10),
        depreciationMonths: Number(payload.depreciationMonths || 0),
        depreciatedAmount: 0,
        netBookValue: normalizeMoney(payload.purchaseAmount ?? payload.purchaseCost, 0),
        lastInventoryTime: null,
        remark: normalizeOptionalText(payload.remark, 2000, '备注长度不能超过 2000'),
      })
    );

    return this.assetInfoDetail(saved.id);
  }

  async assetInfoUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInfo:update', '无权限修改资产');
    const id = normalizeRequiredPositiveInt(payload.id, '资产不存在');
    const asset = await this.loadAsset(id);
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权操作该资产');

    const ownerDepartmentId = payload.departmentId
      ? normalizeRequiredPositiveInt(payload.departmentId, '所属部门不能为空')
      : asset.ownerDepartmentId;
    await this.assertDepartmentInScope(ownerDepartmentId, perms, '无权操作该资产');

    const nextAssetNo = normalizeRequiredText(
      payload.assetNo ?? asset.assetNo,
      50,
      '资产编号不能为空且长度不能超过 50'
    );
    const duplicated = await this.performanceAssetInfoEntity.findOneBy({ assetNo: nextAssetNo });
    if (duplicated && Number(duplicated.id) !== id) {
      throw new CoolCommException('资产编号已存在');
    }

    await this.performanceAssetInfoEntity.update(
      { id },
      {
        assetNo: nextAssetNo,
        assetName: normalizeRequiredText(
          payload.name ?? payload.assetName ?? asset.assetName,
          200,
          '资产名称不能为空且长度不能超过 200'
        ),
        category: normalizeOptionalText(payload.category ?? asset.category, 100, '资产分类长度不能超过 100'),
        assetType: normalizeOptionalText(payload.assetType ?? asset.assetType, 100, '资产类型长度不能超过 100'),
        brand: normalizeOptionalText(payload.brand ?? asset.brand, 100, '品牌长度不能超过 100'),
        model: normalizeOptionalText(payload.model ?? asset.model, 100, '型号长度不能超过 100'),
        serialNo: normalizeOptionalText(payload.serialNo ?? asset.serialNo, 100, '序列号长度不能超过 100'),
        location: normalizeOptionalText(payload.location ?? asset.location, 200, '存放位置长度不能超过 200'),
        ownerDepartmentId,
        managerId: normalizeOptionalPositiveInt(
          payload.managerId ?? asset.managerId,
          '管理人不合法'
        ),
        purchaseDate: normalizeDate(payload.purchaseDate ?? asset.purchaseDate, 10),
        purchaseCost: normalizeMoney(payload.purchaseAmount ?? payload.purchaseCost ?? asset.purchaseCost, 0),
        supplierId: normalizeOptionalPositiveInt(payload.supplierId ?? asset.supplierId, '供应商不存在'),
        purchaseOrderId: normalizeOptionalPositiveInt(
          payload.purchaseOrderId ?? asset.purchaseOrderId,
          '采购订单不存在'
        ),
        warrantyExpiry: normalizeDate(payload.warrantyExpiry ?? asset.warrantyExpiry, 10),
        depreciationMonths: Number(payload.depreciationMonths ?? asset.depreciationMonths ?? 0),
        netBookValue:
          payload.purchaseAmount !== undefined || payload.purchaseCost !== undefined
            ? normalizeMoney(payload.purchaseAmount ?? payload.purchaseCost, 0)
            : asset.netBookValue,
        remark: normalizeOptionalText(payload.remark ?? asset.remark, 2000, '备注长度不能超过 2000'),
      }
    );

    return this.assetInfoDetail(id);
  }

  async assetInfoDelete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInfo:delete', '无权限删除资产');

    for (const rawId of ids) {
      const id = normalizeRequiredPositiveInt(rawId, '资产不存在');
      const asset = await this.loadAsset(id);
      await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权删除该资产');
      if (['assigned', 'maintenance', 'inTransfer', 'inventorying', 'scrapped', 'lost'].includes(asset.status)) {
        throw new CoolCommException('当前资产状态不允许删除');
      }
      const hasReference =
        !!(await this.performanceAssetAssignmentEntity.findOneBy({ assetId: id })) ||
        !!(await this.performanceAssetMaintenanceEntity.findOneBy({ assetId: id })) ||
        !!(await this.performanceAssetTransferEntity.findOneBy({ assetId: id })) ||
        !!(await this.performanceAssetInventoryEntity.findOneBy({ assetId: id })) ||
        !!(await this.performanceAssetDisposalEntity.findOneBy({ assetId: id }));
      if (hasReference) {
        throw new CoolCommException('资产已被业务单据引用，禁止删除');
      }
      await this.performanceAssetInfoEntity.delete({ id } as any);
    }
  }

  async assetInfoUpdateStatus(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInfo:updateStatus', '无权限更新资产状态');
    const id = normalizeRequiredPositiveInt(payload.id, '资产不存在');
    const asset = await this.loadAsset(id);
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权操作该资产');
    const targetStatus = ensureStatus(payload.assetStatus, ASSET_STATUSES, '资产状态不合法');

    if (
      ['scrapped', 'lost'].includes(asset.status) &&
      targetStatus !== asset.status
    ) {
      throw new CoolCommException('终态资产不允许恢复或切换状态');
    }

    await this.performanceAssetInfoEntity.update(
      { id },
      {
        status: targetStatus,
        remark: normalizeOptionalText(payload.remark ?? asset.remark, 2000, '备注长度不能超过 2000'),
      }
    );
    return this.assetInfoDetail(id);
  }

  async assetAssignmentPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetAssignment:page', '无权限查看领用记录');
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    let rows = await this.performanceAssetAssignmentEntity.find();
    rows = await this.scopeRows(rows, perms, item => item.departmentId);
    if (query.status) {
      rows = rows.filter(item => item.status === String(query.status).trim());
    }
    if (query.assetId) {
      rows = rows.filter(item => Number(item.assetId) === Number(query.assetId));
    }
    if (query.assigneeId) {
      rows = rows.filter(item => Number(item.assigneeId) === Number(query.assigneeId));
    }
    if (query.departmentId) {
      rows = rows.filter(item => Number(item.departmentId) === Number(query.departmentId));
    }

    const assets = await this.performanceAssetInfoEntity.find();
    const assetMap = new Map(assets.map(item => [Number(item.id), item]));
    const departmentMap = await this.departmentMap(uniqueNumberList(rows.map(item => item.departmentId)));
    const userMap = await this.userMap(uniqueNumberList(rows.map(item => item.assigneeId)));
    const list = rows
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
      .map(item => {
        const asset = assetMap.get(Number(item.assetId));
        return {
          id: item.id,
          assetId: item.assetId,
          assetNo: asset?.assetNo || '',
          assetName: asset?.assetName || '',
          assetStatus: asset?.status || '',
          assigneeId: item.assigneeId,
          assigneeName: userMap.get(Number(item.assigneeId))?.name || '',
          departmentId: item.departmentId,
          departmentName: departmentMap.get(Number(item.departmentId))?.name || '',
          assignDate: item.assignDate,
          expectedReturnDate: null,
          actualReturnDate: item.returnDate || '',
          purpose: item.purpose || '',
          returnRemark: item.returnNote || '',
          status: item.status,
          createTime: item.createTime,
          updateTime: item.updateTime,
        };
      });
    return paginateList(list, page, size);
  }

  async assetAssignmentAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetAssignment:add', '无权限新增领用记录');
    const assetId = normalizeRequiredPositiveInt(payload.assetId, '资产不存在');
    const asset = await this.loadAsset(assetId);
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权操作该资产');
    if (asset.status !== 'available') {
      throw new CoolCommException('仅 available 资产允许发起领用');
    }

    const departmentId = normalizeRequiredPositiveInt(
      payload.departmentId ?? asset.ownerDepartmentId,
      '领用部门不能为空'
    );
    await this.assertDepartmentInScope(departmentId, perms, '无权操作该领用记录');

    const saved = await this.performanceAssetAssignmentEntity.save(
      this.performanceAssetAssignmentEntity.create({
        assetId,
        assigneeId: normalizeRequiredPositiveInt(payload.assigneeId, '领用人不能为空'),
        departmentId,
        assignDate: normalizeDate(payload.assignDate, 10) || nowTime().slice(0, 10),
        returnDate: normalizeDate(payload.actualReturnDate, 10),
        status: 'assigned',
        purpose: normalizeOptionalText(payload.purpose, 2000, '领用用途长度不能超过 2000'),
        returnNote: normalizeOptionalText(payload.returnRemark, 2000, '归还说明长度不能超过 2000'),
      })
    );
    await this.performanceAssetInfoEntity.update({ id: assetId }, { status: 'assigned' });
    return saved;
  }

  async assetAssignmentUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetAssignment:update', '无权限编辑领用记录');
    const id = normalizeRequiredPositiveInt(payload.id, '领用记录不存在');
    const current = await this.performanceAssetAssignmentEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('领用记录不存在');
    }
    await this.assertDepartmentInScope(current.departmentId, perms, '无权操作该领用记录');
    if (current.status !== 'assigned') {
      throw new CoolCommException('仅 assigned 状态允许编辑');
    }
    await this.performanceAssetAssignmentEntity.update(
      { id },
      {
        assigneeId: normalizeRequiredPositiveInt(payload.assigneeId ?? current.assigneeId, '领用人不能为空'),
        departmentId: normalizeRequiredPositiveInt(payload.departmentId ?? current.departmentId, '领用部门不能为空'),
        assignDate: normalizeDate(payload.assignDate ?? current.assignDate, 10) || current.assignDate,
        purpose: normalizeOptionalText(payload.purpose ?? current.purpose, 2000, '领用用途长度不能超过 2000'),
        returnNote: normalizeOptionalText(payload.returnRemark ?? current.returnNote, 2000, '归还说明长度不能超过 2000'),
      }
    );
    return this.performanceAssetAssignmentEntity.findOneBy({ id });
  }

  async assetAssignmentReturn(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetAssignment:return', '无权限归还资产');
    const id = normalizeRequiredPositiveInt(payload.id, '领用记录不存在');
    const current = await this.performanceAssetAssignmentEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('领用记录不存在');
    }
    if (current.status !== 'assigned') {
      throw new CoolCommException('当前状态不允许归还');
    }
    await this.assertDepartmentInScope(current.departmentId, perms, '无权操作该领用记录');
    await this.performanceAssetAssignmentEntity.update(
      { id },
      {
        status: 'returned',
        returnDate: normalizeDate(payload.actualReturnDate, 10) || nowTime().slice(0, 10),
        returnNote: normalizeOptionalText(payload.returnRemark ?? current.returnNote, 2000, '归还说明长度不能超过 2000'),
      }
    );
    await this.performanceAssetInfoEntity.update({ id: current.assetId }, { status: 'available' });
    return this.performanceAssetAssignmentEntity.findOneBy({ id });
  }

  async assetAssignmentMarkLost(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetAssignment:markLost', '无权限标记丢失');
    const id = normalizeRequiredPositiveInt(payload.id, '领用记录不存在');
    const current = await this.performanceAssetAssignmentEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('领用记录不存在');
    }
    if (current.status !== 'assigned') {
      throw new CoolCommException('当前状态不允许标记丢失');
    }
    await this.assertDepartmentInScope(current.departmentId, perms, '无权操作该领用记录');
    await this.performanceAssetAssignmentEntity.update(
      { id },
      {
        status: 'lost',
        returnNote: normalizeOptionalText(payload.returnRemark ?? current.returnNote, 2000, '归还说明长度不能超过 2000'),
      }
    );
    await this.performanceAssetInfoEntity.update({ id: current.assetId }, { status: 'lost' });
    return this.performanceAssetAssignmentEntity.findOneBy({ id });
  }

  async assetAssignmentDelete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetAssignment:delete', '无权限删除领用记录');
    for (const rawId of ids) {
      const id = normalizeRequiredPositiveInt(rawId, '领用记录不存在');
      const current = await this.performanceAssetAssignmentEntity.findOneBy({ id });
      if (!current) {
        continue;
      }
      await this.assertDepartmentInScope(current.departmentId, perms, '无权操作该领用记录');
      if (current.status === 'assigned') {
        throw new CoolCommException('进行中的领用记录不允许删除');
      }
      await this.performanceAssetAssignmentEntity.delete({ id } as any);
    }
  }

  async assetMaintenancePage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetMaintenance:page', '无权限查看维护记录');
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    let rows = await this.performanceAssetMaintenanceEntity.find();
    rows = await this.scopeRows(rows, perms, item => item.departmentId);
    if (query.status) {
      rows = rows.filter(item => item.status === String(query.status).trim());
    }
    if (query.assetId) {
      rows = rows.filter(item => Number(item.assetId) === Number(query.assetId));
    }
    const assets = await this.performanceAssetInfoEntity.find();
    const assetMap = new Map(assets.map(item => [Number(item.id), item]));
    const list = rows
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
      .map(item => {
        const asset = assetMap.get(Number(item.assetId));
        return {
          id: item.id,
          assetId: item.assetId,
          assetNo: asset?.assetNo || '',
          assetName: asset?.assetName || '',
          assetStatus: asset?.status || '',
          maintenanceType: item.maintenanceType || '',
          vendorName: item.vendor || '',
          cost: Number(item.cost || 0),
          planDate: item.startDate || '',
          startDate: item.startDate || '',
          completeDate: item.completedDate || '',
          description: item.description || '',
          resultSummary: item.result || '',
          status: item.status,
          createTime: item.createTime,
          updateTime: item.updateTime,
        };
      });
    return paginateList(list, page, size);
  }

  async assetMaintenanceAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetMaintenance:add', '无权限新增维护记录');
    const assetId = normalizeRequiredPositiveInt(payload.assetId, '资产不存在');
    const asset = await this.loadAsset(assetId);
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权操作该资产');
    if (!['available', 'assigned'].includes(asset.status)) {
      throw new CoolCommException('仅 available 或 assigned 资产允许进入维护');
    }
    const saved = await this.performanceAssetMaintenanceEntity.save(
      this.performanceAssetMaintenanceEntity.create({
        assetId,
        departmentId: asset.ownerDepartmentId,
        maintenanceType: normalizeOptionalText(payload.maintenanceType, 50, '维护类型长度不能超过 50'),
        vendor: normalizeOptionalText(payload.vendorName ?? payload.vendor, 100, '服务商长度不能超过 100'),
        cost: normalizeMoney(payload.cost, 0),
        startDate: normalizeDate(payload.startDate ?? payload.planDate),
        completedDate: null,
        status: 'scheduled',
        description: normalizeOptionalText(payload.description, 2000, '维护说明长度不能超过 2000'),
        result: normalizeOptionalText(payload.resultSummary, 2000, '维护结果长度不能超过 2000'),
      })
    );
    await this.performanceAssetInfoEntity.update({ id: assetId }, { status: 'maintenance' });
    return saved;
  }

  async assetMaintenanceUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetMaintenance:update', '无权限编辑维护记录');
    const id = normalizeRequiredPositiveInt(payload.id, '维护记录不存在');
    const current = await this.performanceAssetMaintenanceEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('维护记录不存在');
    }
    await this.assertDepartmentInScope(current.departmentId, perms, '无权操作该维护记录');
    if (!['scheduled', 'inProgress'].includes(current.status)) {
      throw new CoolCommException('当前状态不允许编辑');
    }
    await this.performanceAssetMaintenanceEntity.update(
      { id },
      {
        maintenanceType: normalizeOptionalText(payload.maintenanceType ?? current.maintenanceType, 50, '维护类型长度不能超过 50'),
        vendor: normalizeOptionalText(payload.vendorName ?? payload.vendor ?? current.vendor, 100, '服务商长度不能超过 100'),
        cost: normalizeMoney(payload.cost ?? current.cost, 0),
        startDate: normalizeDate(payload.startDate ?? payload.planDate ?? current.startDate),
        description: normalizeOptionalText(payload.description ?? current.description, 2000, '维护说明长度不能超过 2000'),
        result: normalizeOptionalText(payload.resultSummary ?? current.result, 2000, '维护结果长度不能超过 2000'),
      }
    );
    return this.performanceAssetMaintenanceEntity.findOneBy({ id });
  }

  async assetMaintenanceComplete(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetMaintenance:complete', '无权限完成维护');
    const id = normalizeRequiredPositiveInt(payload.id, '维护记录不存在');
    const current = await this.performanceAssetMaintenanceEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('维护记录不存在');
    }
    await this.assertDepartmentInScope(current.departmentId, perms, '无权操作该维护记录');
    if (!['scheduled', 'inProgress'].includes(current.status)) {
      throw new CoolCommException('当前状态不允许完成维护');
    }
    await this.performanceAssetMaintenanceEntity.update(
      { id },
      {
        status: 'completed',
        completedDate: normalizeDate(payload.completeDate, 19) || nowTime(),
        result: normalizeOptionalText(payload.resultSummary ?? current.result, 2000, '维护结果长度不能超过 2000'),
      }
    );
    await this.performanceAssetInfoEntity.update({ id: current.assetId }, { status: 'available' });
    return this.performanceAssetMaintenanceEntity.findOneBy({ id });
  }

  async assetMaintenanceCancel(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetMaintenance:cancel', '无权限取消维护');
    const id = normalizeRequiredPositiveInt(payload.id, '维护记录不存在');
    const current = await this.performanceAssetMaintenanceEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('维护记录不存在');
    }
    await this.assertDepartmentInScope(current.departmentId, perms, '无权操作该维护记录');
    if (!['scheduled', 'inProgress'].includes(current.status)) {
      throw new CoolCommException('当前状态不允许取消维护');
    }
    await this.performanceAssetMaintenanceEntity.update(
      { id },
      {
        status: 'cancelled',
        result: normalizeOptionalText(payload.resultSummary ?? current.result, 2000, '维护结果长度不能超过 2000'),
      }
    );
    await this.performanceAssetInfoEntity.update({ id: current.assetId }, { status: 'available' });
    return this.performanceAssetMaintenanceEntity.findOneBy({ id });
  }

  async assetMaintenanceDelete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetMaintenance:delete', '无权限删除维护记录');
    for (const rawId of ids) {
      const id = normalizeRequiredPositiveInt(rawId, '维护记录不存在');
      const current = await this.performanceAssetMaintenanceEntity.findOneBy({ id });
      if (!current) {
        continue;
      }
      await this.assertDepartmentInScope(current.departmentId, perms, '无权操作该维护记录');
      if (current.status === 'scheduled' || current.status === 'cancelled' || current.status === 'completed') {
        await this.performanceAssetMaintenanceEntity.delete({ id } as any);
        continue;
      }
      throw new CoolCommException('进行中的维护记录不允许删除');
    }
  }

  async assetProcurementPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetProcurement:page', '无权限查看采购入库单');
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    let rows = await this.performanceAssetProcurementEntity.find();
    rows = await this.scopeRows(rows, perms, item => item.ownerDepartmentId);
    const keyword = String(query.keyword || '').trim().toLowerCase();
    if (keyword) {
      rows = rows.filter(item =>
        [item.procurementNo, item.title, item.assetName]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(keyword))
      );
    }
    if (query.status) {
      rows = rows.filter(item => item.status === String(query.status).trim());
    }
    if (query.departmentId) {
      rows = rows.filter(item => Number(item.ownerDepartmentId) === Number(query.departmentId));
    }
    const departmentMap = await this.departmentMap(uniqueNumberList(rows.map(item => item.ownerDepartmentId)));
    const userMap = await this.userMap(uniqueNumberList(rows.map(item => item.managerId)));
    const supplierMap = await this.supplierMap(uniqueNumberList(rows.map(item => item.supplierId)));
    const list = rows
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
      .map(item => ({
        id: item.id,
        procurementNo: item.procurementNo,
        title: item.title,
        assetCategory: item.category || '',
        quantity: Number(item.quantity || 0),
        amount: Number(item.unitCost || 0) * Number(item.quantity || 0),
        departmentId: item.ownerDepartmentId,
        departmentName: departmentMap.get(Number(item.ownerDepartmentId))?.name || '',
        requesterId: item.managerId,
        requesterName: userMap.get(Number(item.managerId || 0))?.name || '',
        supplierId: item.supplierId,
        supplierName: supplierMap.get(Number(item.supplierId || 0))?.name || '',
        purchaseOrderId: item.purchaseOrderId,
        expectedArrivalDate: '',
        receiveDate: item.receivedAt || '',
        remark: item.remark || '',
        status: item.status,
        createTime: item.createTime,
        updateTime: item.updateTime,
      }));
    return paginateList(list, page, size);
  }

  async assetProcurementInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetProcurement:info', '无权限查看采购入库详情');
    const item = await this.performanceAssetProcurementEntity.findOneBy({ id: Number(id) });
    if (!item) {
      throw new CoolCommException('采购入库单不存在');
    }
    await this.assertDepartmentInScope(item.ownerDepartmentId, perms, '无权查看该采购入库单');
    const page = await this.assetProcurementPage({ page: 1, size: 9999 });
    return page.list.find(row => Number(row.id) === Number(id));
  }

  async assetProcurementAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetProcurement:add', '无权限新增采购入库单');
    const ownerDepartmentId = normalizeRequiredPositiveInt(payload.departmentId ?? payload.ownerDepartmentId, '所属部门不能为空');
    await this.assertDepartmentInScope(ownerDepartmentId, perms, '无权操作该采购入库单');
    const procurementNo = normalizeRequiredText(
      payload.procurementNo || `ASSET-IN-${Date.now()}`,
      50,
      '采购入库单号不能为空且长度不能超过 50'
    );
    const duplicated = await this.performanceAssetProcurementEntity.findOneBy({ procurementNo });
    if (duplicated) {
      throw new CoolCommException('采购入库单号已存在');
    }
    const saved = await this.performanceAssetProcurementEntity.save(
      this.performanceAssetProcurementEntity.create({
        procurementNo,
        title: normalizeRequiredText(payload.title, 200, '标题不能为空且长度不能超过 200'),
        purchaseOrderId: normalizeOptionalPositiveInt(payload.purchaseOrderId, '采购订单不存在'),
        supplierId: normalizeOptionalPositiveInt(payload.supplierId, '供应商不存在'),
        ownerDepartmentId,
        managerId: normalizeOptionalPositiveInt(payload.requesterId ?? payload.managerId, '申请人不合法'),
        assetName: normalizeRequiredText(payload.assetName ?? payload.title, 200, '资产名称不能为空且长度不能超过 200'),
        category: normalizeOptionalText(payload.assetCategory ?? payload.category, 100, '资产分类长度不能超过 100'),
        assetType: normalizeOptionalText(payload.assetType, 100, '资产类型长度不能超过 100'),
        brand: normalizeOptionalText(payload.brand, 100, '品牌长度不能超过 100'),
        model: normalizeOptionalText(payload.model, 100, '型号长度不能超过 100'),
        serialNo: normalizeOptionalText(payload.serialNo, 100, '序列号长度不能超过 100'),
        location: normalizeOptionalText(payload.location, 200, '存放位置长度不能超过 200'),
        purchaseDate: normalizeDate(payload.purchaseDate, 10),
        unitCost: normalizeMoney(
          payload.unitCost ??
            (Number(payload.amount || 0) && Number(payload.quantity || 0)
              ? Number(payload.amount || 0) / Number(payload.quantity || 1)
              : 0),
          0
        ),
        quantity: Math.max(1, normalizeRequiredPositiveInt(payload.quantity || 1, '数量不合法')),
        warrantyExpiry: normalizeDate(payload.warrantyExpiry, 10),
        depreciationMonths: Number(payload.depreciationMonths || 0),
        receivedAssetIds: [],
        submittedAt: null,
        receivedAt: null,
        status: 'draft',
        remark: normalizeOptionalText(payload.remark, 2000, '备注长度不能超过 2000'),
      })
    );
    return this.assetProcurementInfo(saved.id);
  }

  async assetProcurementUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetProcurement:update', '无权限编辑采购入库单');
    const id = normalizeRequiredPositiveInt(payload.id, '采购入库单不存在');
    const current = await this.performanceAssetProcurementEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('采购入库单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该采购入库单');
    if (current.status !== 'draft') {
      throw new CoolCommException('仅 draft 状态允许编辑');
    }
    await this.performanceAssetProcurementEntity.update(
      { id },
      {
        title: normalizeRequiredText(payload.title ?? current.title, 200, '标题不能为空且长度不能超过 200'),
        purchaseOrderId: normalizeOptionalPositiveInt(payload.purchaseOrderId ?? current.purchaseOrderId, '采购订单不存在'),
        supplierId: normalizeOptionalPositiveInt(payload.supplierId ?? current.supplierId, '供应商不存在'),
        managerId: normalizeOptionalPositiveInt(payload.requesterId ?? payload.managerId ?? current.managerId, '申请人不合法'),
        assetName: normalizeRequiredText(payload.assetName ?? current.assetName, 200, '资产名称不能为空且长度不能超过 200'),
        category: normalizeOptionalText(payload.assetCategory ?? payload.category ?? current.category, 100, '资产分类长度不能超过 100'),
        quantity: Math.max(1, normalizeRequiredPositiveInt(payload.quantity ?? current.quantity, '数量不合法')),
        unitCost: normalizeMoney(payload.unitCost ?? current.unitCost, 0),
        remark: normalizeOptionalText(payload.remark ?? current.remark, 2000, '备注长度不能超过 2000'),
      }
    );
    return this.assetProcurementInfo(id);
  }

  async assetProcurementSubmit(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetProcurement:submit', '无权限提交采购入库单');
    const id = normalizeRequiredPositiveInt(payload.id, '采购入库单不存在');
    const current = await this.performanceAssetProcurementEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('采购入库单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该采购入库单');
    if (current.status !== 'draft') {
      throw new CoolCommException('仅 draft 状态允许提交');
    }
    await this.performanceAssetProcurementEntity.update(
      { id },
      {
        status: 'submitted',
        submittedAt: nowTime(),
      }
    );
    return this.assetProcurementInfo(id);
  }

  async assetProcurementReceive(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetProcurement:receive', '无权限确认入库');
    const id = normalizeRequiredPositiveInt(payload.id, '采购入库单不存在');
    const current = await this.performanceAssetProcurementEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('采购入库单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该采购入库单');
    if (current.status !== 'submitted') {
      throw new CoolCommException('仅 submitted 状态允许确认入库');
    }

    const existingCount = (await this.performanceAssetInfoEntity.find()).length;
    const receivedAssetIds: number[] = [];

    for (let i = 0; i < Number(current.quantity || 0); i++) {
      const serial = existingCount + i + 1;
      const savedAsset = await this.performanceAssetInfoEntity.save(
        this.performanceAssetInfoEntity.create({
          assetNo: `AST-${String(serial).padStart(6, '0')}`,
          assetName: current.assetName,
          category: current.category,
          assetType: current.assetType,
          brand: current.brand,
          model: current.model,
          serialNo: current.serialNo ? `${current.serialNo}-${i + 1}` : null,
          status: 'available',
          location: current.location,
          ownerDepartmentId: current.ownerDepartmentId,
          managerId: current.managerId,
          purchaseDate: current.purchaseDate,
          purchaseCost: current.unitCost,
          supplierId: current.supplierId,
          purchaseOrderId: current.purchaseOrderId,
          warrantyExpiry: current.warrantyExpiry,
          depreciationMonths: Number(current.depreciationMonths || 0),
          depreciatedAmount: 0,
          netBookValue: Number(current.unitCost || 0),
          lastInventoryTime: null,
          remark: current.remark,
        })
      );
      receivedAssetIds.push(Number(savedAsset.id));
    }

    await this.performanceAssetProcurementEntity.update(
      { id },
      {
        status: 'received',
        receivedAt: normalizeDate(payload.receiveDate, 19) || nowTime(),
        receivedAssetIds,
      }
    );
    return this.assetProcurementInfo(id);
  }

  async assetProcurementCancel(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetProcurement:cancel', '无权限取消采购入库单');
    const id = normalizeRequiredPositiveInt(payload.id, '采购入库单不存在');
    const current = await this.performanceAssetProcurementEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('采购入库单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该采购入库单');
    if (!['draft', 'submitted'].includes(current.status)) {
      throw new CoolCommException('当前状态不允许取消');
    }
    await this.performanceAssetProcurementEntity.update(
      { id },
      {
        status: 'cancelled',
        remark: normalizeOptionalText(payload.remark ?? current.remark, 2000, '备注长度不能超过 2000'),
      }
    );
    return this.assetProcurementInfo(id);
  }

  async assetTransferPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetTransfer:page', '无权限查看资产调拨');
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    let rows = await this.performanceAssetTransferEntity.find();
    rows = await this.scopeRows(rows, perms, item => item.fromDepartmentId);
    if (query.status) {
      rows = rows.filter(item => item.status === String(query.status).trim());
    }
    if (query.fromDepartmentId) {
      rows = rows.filter(item => Number(item.fromDepartmentId) === Number(query.fromDepartmentId));
    }
    if (query.toDepartmentId) {
      rows = rows.filter(item => Number(item.toDepartmentId) === Number(query.toDepartmentId));
    }
    const assets = await this.performanceAssetInfoEntity.find();
    const assetMap = new Map(assets.map(item => [Number(item.id), item]));
    const departmentMap = await this.departmentMap(
      uniqueNumberList(rows.flatMap(item => [item.fromDepartmentId, item.toDepartmentId]))
    );
    const userMap = await this.userMap(uniqueNumberList(rows.map(item => item.toManagerId)));
    const list = rows
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
      .map(item => {
        const asset = assetMap.get(Number(item.assetId));
        return {
          id: item.id,
          transferNo: item.transferNo,
          assetId: item.assetId,
          assetNo: asset?.assetNo || '',
          assetName: asset?.assetName || '',
          assetStatus: asset?.status || '',
          fromDepartmentId: item.fromDepartmentId,
          fromDepartmentName: departmentMap.get(Number(item.fromDepartmentId))?.name || '',
          toDepartmentId: item.toDepartmentId,
          toDepartmentName: departmentMap.get(Number(item.toDepartmentId))?.name || '',
          fromLocation: item.fromLocation || '',
          toLocation: item.toLocation || '',
          applicantId: item.toManagerId,
          applicantName: userMap.get(Number(item.toManagerId || 0))?.name || '',
          submitTime: item.submittedAt || '',
          completeTime: item.completedAt || '',
          remark: item.reason || '',
          status: item.status,
          createTime: item.createTime,
          updateTime: item.updateTime,
        };
      });
    return paginateList(list, page, size);
  }

  async assetTransferInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetTransfer:info', '无权限查看资产调拨详情');
    const list = await this.assetTransferPage({ page: 1, size: 9999 });
    const row = list.list.find(item => Number(item.id) === Number(id));
    if (!row) {
      throw new CoolCommException('调拨单不存在');
    }
    return row;
  }

  async assetTransferAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetTransfer:add', '无权限新增调拨单');
    const assetId = normalizeRequiredPositiveInt(payload.assetId, '资产不存在');
    const asset = await this.loadAsset(assetId);
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权操作该调拨单');
    if (asset.status !== 'available') {
      throw new CoolCommException('仅 available 资产允许发起调拨');
    }
    const toDepartmentId = normalizeRequiredPositiveInt(payload.toDepartmentId, '目标部门不能为空');
    const transferNo = normalizeRequiredText(
      payload.transferNo || `ASSET-TR-${Date.now()}`,
      50,
      '调拨单号不能为空且长度不能超过 50'
    );
    const duplicated = await this.performanceAssetTransferEntity.findOneBy({ transferNo });
    if (duplicated) {
      throw new CoolCommException('调拨单号已存在');
    }
    const saved = await this.performanceAssetTransferEntity.save(
      this.performanceAssetTransferEntity.create({
        transferNo,
        assetId,
        fromDepartmentId: asset.ownerDepartmentId,
        toDepartmentId,
        toManagerId: normalizeOptionalPositiveInt(payload.applicantId ?? payload.toManagerId, '目标管理人不合法'),
        fromLocation: asset.location,
        toLocation: normalizeOptionalText(payload.toLocation, 200, '目标位置长度不能超过 200'),
        reason: normalizeOptionalText(payload.remark ?? payload.reason, 2000, '调拨原因长度不能超过 2000'),
        submittedAt: null,
        completedAt: null,
        status: 'draft',
      })
    );
    return this.assetTransferInfo(saved.id);
  }

  async assetTransferUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetTransfer:update', '无权限编辑调拨单');
    const id = normalizeRequiredPositiveInt(payload.id, '调拨单不存在');
    const current = await this.performanceAssetTransferEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('调拨单不存在');
    }
    await this.assertDepartmentInScope(current.fromDepartmentId, perms, '无权操作该调拨单');
    if (current.status !== 'draft') {
      throw new CoolCommException('仅 draft 状态允许编辑');
    }
    await this.performanceAssetTransferEntity.update(
      { id },
      {
        toDepartmentId: normalizeRequiredPositiveInt(payload.toDepartmentId ?? current.toDepartmentId, '目标部门不能为空'),
        toManagerId: normalizeOptionalPositiveInt(payload.applicantId ?? payload.toManagerId ?? current.toManagerId, '目标管理人不合法'),
        toLocation: normalizeOptionalText(payload.toLocation ?? current.toLocation, 200, '目标位置长度不能超过 200'),
        reason: normalizeOptionalText(payload.remark ?? payload.reason ?? current.reason, 2000, '调拨原因长度不能超过 2000'),
      }
    );
    return this.assetTransferInfo(id);
  }

  async assetTransferSubmit(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetTransfer:submit', '无权限提交调拨单');
    const id = normalizeRequiredPositiveInt(payload.id, '调拨单不存在');
    const current = await this.performanceAssetTransferEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('调拨单不存在');
    }
    await this.assertDepartmentInScope(current.fromDepartmentId, perms, '无权操作该调拨单');
    if (current.status !== 'draft') {
      throw new CoolCommException('仅 draft 状态允许提交');
    }
    await this.performanceAssetTransferEntity.update(
      { id },
      {
        status: 'inTransit',
        submittedAt: nowTime(),
      }
    );
    await this.performanceAssetInfoEntity.update({ id: current.assetId }, { status: 'inTransfer' });
    return this.assetTransferInfo(id);
  }

  async assetTransferComplete(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetTransfer:complete', '无权限完成调拨');
    const id = normalizeRequiredPositiveInt(payload.id, '调拨单不存在');
    const current = await this.performanceAssetTransferEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('调拨单不存在');
    }
    await this.assertDepartmentInScope(current.fromDepartmentId, perms, '无权操作该调拨单');
    if (current.status !== 'inTransit') {
      throw new CoolCommException('仅 inTransit 状态允许完成调拨');
    }
    await this.performanceAssetTransferEntity.update(
      { id },
      {
        status: 'completed',
        completedAt: normalizeDate(payload.completeTime, 19) || nowTime(),
      }
    );
    await this.performanceAssetInfoEntity.update(
      { id: current.assetId },
      {
        ownerDepartmentId: current.toDepartmentId,
        managerId: current.toManagerId,
        location: current.toLocation,
        status: 'available',
      }
    );
    return this.assetTransferInfo(id);
  }

  async assetTransferCancel(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetTransfer:cancel', '无权限取消调拨单');
    const id = normalizeRequiredPositiveInt(payload.id, '调拨单不存在');
    const current = await this.performanceAssetTransferEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('调拨单不存在');
    }
    await this.assertDepartmentInScope(current.fromDepartmentId, perms, '无权操作该调拨单');
    if (!['draft', 'submitted', 'inTransit'].includes(current.status)) {
      throw new CoolCommException('当前状态不允许取消');
    }
    await this.performanceAssetTransferEntity.update(
      { id },
      {
        status: 'cancelled',
        reason: normalizeOptionalText(payload.remark ?? current.reason, 2000, '调拨原因长度不能超过 2000'),
      }
    );
    await this.performanceAssetInfoEntity.update({ id: current.assetId }, { status: 'available' });
    return this.assetTransferInfo(id);
  }

  async assetInventoryPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInventory:page', '无权限查看资产盘点');
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    let rows = await this.performanceAssetInventoryEntity.find();
    rows = await this.scopeRows(rows, perms, item => item.ownerDepartmentId);
    if (query.status) {
      rows = rows.filter(item => item.status === String(query.status).trim());
    }
    if (query.departmentId) {
      rows = rows.filter(item => Number(item.ownerDepartmentId) === Number(query.departmentId));
    }
    const assetMap = new Map((await this.performanceAssetInfoEntity.find()).map(item => [Number(item.id), item]));
    const departmentMap = await this.departmentMap(uniqueNumberList(rows.map(item => item.ownerDepartmentId)));
    const list = rows
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
      .map(item => ({
        id: item.id,
        inventoryNo: item.inventoryNo,
        scopeLabel: assetMap.get(Number(item.assetId))?.assetName || '',
        departmentId: item.ownerDepartmentId,
        departmentName: departmentMap.get(Number(item.ownerDepartmentId))?.name || '',
        location: item.locationSnapshot || '',
        ownerId: null,
        ownerName: '',
        plannedDate: item.startedAt ? String(item.startedAt).slice(0, 10) : '',
        completedDate: item.completedAt || '',
        assetCount: 1,
        matchedCount: item.status === 'completed' || item.status === 'closed' ? 1 : 0,
        differenceCount: 0,
        remark: item.remark || '',
        status: item.status,
        createTime: item.createTime,
        updateTime: item.updateTime,
      }));
    return paginateList(list, page, size);
  }

  async assetInventoryInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInventory:info', '无权限查看盘点详情');
    const list = await this.assetInventoryPage({ page: 1, size: 9999 });
    const row = list.list.find(item => Number(item.id) === Number(id));
    if (!row) {
      throw new CoolCommException('盘点单不存在');
    }
    return row;
  }

  async assetInventoryAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInventory:add', '无权限新增盘点单');
    const assetId = normalizeRequiredPositiveInt(payload.assetId, '资产不存在');
    const asset = await this.loadAsset(assetId);
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权操作该盘点单');
    if (asset.status !== 'available') {
      throw new CoolCommException('仅 available 资产允许发起盘点');
    }
    const inventoryNo = normalizeRequiredText(
      payload.inventoryNo || `ASSET-IV-${Date.now()}`,
      50,
      '盘点单号不能为空且长度不能超过 50'
    );
    const duplicated = await this.performanceAssetInventoryEntity.findOneBy({ inventoryNo });
    if (duplicated) {
      throw new CoolCommException('盘点单号已存在');
    }
    const saved = await this.performanceAssetInventoryEntity.save(
      this.performanceAssetInventoryEntity.create({
        inventoryNo,
        assetId,
        ownerDepartmentId: asset.ownerDepartmentId,
        locationSnapshot: asset.location,
        resultSummary: '',
        startedAt: null,
        completedAt: null,
        closedAt: null,
        status: 'draft',
        remark: normalizeOptionalText(payload.remark, 2000, '备注长度不能超过 2000'),
      })
    );
    return this.assetInventoryInfo(saved.id);
  }

  async assetInventoryUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInventory:update', '无权限编辑盘点单');
    const id = normalizeRequiredPositiveInt(payload.id, '盘点单不存在');
    const current = await this.performanceAssetInventoryEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('盘点单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该盘点单');
    if (current.status !== 'draft') {
      throw new CoolCommException('仅 draft 状态允许编辑');
    }
    await this.performanceAssetInventoryEntity.update(
      { id },
      {
        remark: normalizeOptionalText(payload.remark ?? current.remark, 2000, '备注长度不能超过 2000'),
        resultSummary: normalizeOptionalText(payload.resultSummary ?? current.resultSummary, 2000, '结果摘要长度不能超过 2000'),
      }
    );
    return this.assetInventoryInfo(id);
  }

  async assetInventoryStart(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInventory:start', '无权限开始盘点');
    const id = normalizeRequiredPositiveInt(payload.id, '盘点单不存在');
    const current = await this.performanceAssetInventoryEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('盘点单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该盘点单');
    if (current.status !== 'draft') {
      throw new CoolCommException('仅 draft 状态允许开始盘点');
    }
    await this.performanceAssetInventoryEntity.update(
      { id },
      {
        status: 'counting',
        startedAt: nowTime(),
      }
    );
    await this.performanceAssetInfoEntity.update({ id: current.assetId }, { status: 'inventorying' });
    return this.assetInventoryInfo(id);
  }

  async assetInventoryComplete(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInventory:complete', '无权限完成盘点');
    const id = normalizeRequiredPositiveInt(payload.id, '盘点单不存在');
    const current = await this.performanceAssetInventoryEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('盘点单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该盘点单');
    if (current.status !== 'counting') {
      throw new CoolCommException('仅 counting 状态允许完成盘点');
    }
    const completedAt = normalizeDate(payload.completedDate, 19) || nowTime();
    await this.performanceAssetInventoryEntity.update(
      { id },
      {
        status: 'completed',
        completedAt,
        resultSummary: normalizeOptionalText(payload.resultSummary ?? current.resultSummary, 2000, '结果摘要长度不能超过 2000'),
      }
    );
    await this.performanceAssetInfoEntity.update(
      { id: current.assetId },
      { status: 'available', lastInventoryTime: completedAt }
    );
    return this.assetInventoryInfo(id);
  }

  async assetInventoryClose(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetInventory:close', '无权限关闭盘点');
    const id = normalizeRequiredPositiveInt(payload.id, '盘点单不存在');
    const current = await this.performanceAssetInventoryEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('盘点单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该盘点单');
    if (current.status !== 'completed') {
      throw new CoolCommException('仅 completed 状态允许关闭盘点');
    }
    await this.performanceAssetInventoryEntity.update(
      { id },
      {
        status: 'closed',
        closedAt: nowTime(),
        remark: normalizeOptionalText(payload.remark ?? current.remark, 2000, '备注长度不能超过 2000'),
      }
    );
    return this.assetInventoryInfo(id);
  }

  async assetDepreciationPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDepreciation:page', '无权限查看折旧列表');
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const month = monthValue(query.depreciationMonth);
    let rows = await this.performanceAssetDepreciationEntity.find();
    rows = rows.filter(item => item.periodValue === month);
    const assets = await this.scopeRows(await this.performanceAssetInfoEntity.find(), perms, item => item.ownerDepartmentId);
    const assetMap = new Map(assets.map(item => [Number(item.id), item]));
    rows = rows.filter(item => assetMap.has(Number(item.assetId)));
    if (query.keyword) {
      const keyword = String(query.keyword).trim().toLowerCase();
      rows = rows.filter(item => {
        const asset = assetMap.get(Number(item.assetId));
        return [asset?.assetNo, asset?.assetName]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(keyword));
      });
    }
    if (query.departmentId) {
      rows = rows.filter(item => Number(assetMap.get(Number(item.assetId))?.ownerDepartmentId) === Number(query.departmentId));
    }
    const departmentMap = await this.departmentMap(
      uniqueNumberList(Array.from(assetMap.values()).map(item => item.ownerDepartmentId))
    );
    const list = rows
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
      .map(item => {
        const asset = assetMap.get(Number(item.assetId));
        return {
          id: item.id,
          assetId: item.assetId,
          assetNo: asset?.assetNo || '',
          assetName: asset?.assetName || '',
          assetStatus: asset?.status || '',
          departmentId: asset?.ownerDepartmentId,
          departmentName: departmentMap.get(Number(asset?.ownerDepartmentId || 0))?.name || '',
          depreciationMonth: item.periodValue,
          originalAmount: Number(item.sourceCost || 0),
          residualValue: Number(item.netBookValue || 0),
          monthlyDepreciation: Number(item.depreciationAmount || 0),
          accumulatedDepreciation: Number(item.accumulatedAmount || 0),
          netValue: Number(item.netBookValue || 0),
          updateTime: item.updateTime,
        };
      });
    return paginateList(list, page, size);
  }

  async assetDepreciationSummary(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDepreciation:summary', '无权限查看折旧汇总');
    const month = monthValue(query.depreciationMonth);
    const page = await this.assetDepreciationPage({ page: 1, size: 10000, depreciationMonth: month, departmentId: query.departmentId, keyword: query.keyword });
    const list = page.list || [];
    return {
      month,
      assetCount: list.length,
      totalOriginalAmount: list.reduce((sum, item) => sum + Number(item.originalAmount || 0), 0),
      totalAccumulatedDepreciation: list.reduce((sum, item) => sum + Number(item.accumulatedDepreciation || 0), 0),
      totalNetValue: list.reduce((sum, item) => sum + Number(item.netValue || 0), 0),
      currentMonthDepreciation: list.reduce((sum, item) => sum + Number(item.monthlyDepreciation || 0), 0),
      lastRecalculatedAt: nowTime(),
    };
  }

  async assetDepreciationRecalculate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDepreciation:recalculate', '无权限重算折旧');
    const month = monthValue(payload.depreciationMonth);
    const assets = await this.scopeRows(await this.performanceAssetInfoEntity.find(), perms, item => item.ownerDepartmentId);
    const targetAssets = payload.departmentId
      ? assets.filter(item => Number(item.ownerDepartmentId) === Number(payload.departmentId))
      : assets;

    for (const asset of targetAssets) {
      const months = Math.max(0, Number(asset.depreciationMonths || 0));
      const originalAmount = Number(asset.purchaseCost || 0);
      const monthlyDepreciation =
        months > 0 ? Number((originalAmount / months).toFixed(2)) : 0;
      const accumulatedDepreciation = months > 0 ? Math.min(originalAmount, monthlyDepreciation * months) : 0;
      const netValue = Number((originalAmount - accumulatedDepreciation).toFixed(2));
      const current = await this.performanceAssetDepreciationEntity.findOneBy({
        assetId: asset.id,
        periodValue: month,
      } as any);
      if (current) {
        await this.performanceAssetDepreciationEntity.update(
          { id: current.id },
          {
            depreciationAmount: monthlyDepreciation,
            accumulatedAmount: accumulatedDepreciation,
            netBookValue: netValue,
            sourceCost: originalAmount,
            recalculatedAt: nowTime(),
          }
        );
      } else {
        await this.performanceAssetDepreciationEntity.save(
          this.performanceAssetDepreciationEntity.create({
            assetId: asset.id,
            periodValue: month,
            depreciationAmount: monthlyDepreciation,
            accumulatedAmount: accumulatedDepreciation,
            netBookValue: netValue,
            sourceCost: originalAmount,
            recalculatedAt: nowTime(),
          })
        );
      }
      await this.performanceAssetInfoEntity.update(
        { id: asset.id },
        {
          depreciatedAmount: accumulatedDepreciation,
          netBookValue: netValue,
        }
      );
    }
    return this.assetDepreciationSummary({ depreciationMonth: month, departmentId: payload.departmentId });
  }

  async assetDisposalPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDisposal:page', '无权限查看报废单');
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    let rows = await this.performanceAssetDisposalEntity.find();
    rows = await this.scopeRows(rows, perms, item => item.ownerDepartmentId);
    if (query.status) {
      rows = rows.filter(item => item.status === String(query.status).trim());
    }
    if (query.departmentId) {
      rows = rows.filter(item => Number(item.ownerDepartmentId) === Number(query.departmentId));
    }
    const assets = await this.performanceAssetInfoEntity.find();
    const assetMap = new Map(assets.map(item => [Number(item.id), item]));
    const departmentMap = await this.departmentMap(uniqueNumberList(rows.map(item => item.ownerDepartmentId)));
    const userMap = await this.userMap(
      uniqueNumberList(rows.flatMap(item => [item.approvedById, item.executedById]))
    );
    const list = rows
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
      .map(item => {
        const asset = assetMap.get(Number(item.assetId));
        return {
          id: item.id,
          disposalNo: item.disposalNo,
          assetId: item.assetId,
          assetNo: asset?.assetNo || '',
          assetName: asset?.assetName || '',
          assetStatus: asset?.status || '',
          departmentId: item.ownerDepartmentId,
          departmentName: departmentMap.get(Number(item.ownerDepartmentId))?.name || '',
          applicantId: item.approvedById,
          applicantName: userMap.get(Number(item.approvedById || 0))?.name || '',
          reason: item.reason,
          estimatedResidualAmount: Number(asset?.netBookValue || 0),
          submitTime: item.submittedAt || '',
          approveTime: item.approvedAt || '',
          executeTime: item.executedAt || '',
          remark: item.remark || '',
          status: item.status,
          createTime: item.createTime,
          updateTime: item.updateTime,
        };
      });
    return paginateList(list, page, size);
  }

  async assetDisposalInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDisposal:info', '无权限查看报废详情');
    const list = await this.assetDisposalPage({ page: 1, size: 9999 });
    const row = list.list.find(item => Number(item.id) === Number(id));
    if (!row) {
      throw new CoolCommException('报废单不存在');
    }
    return row;
  }

  async assetDisposalAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDisposal:add', '无权限新增报废单');
    const assetId = normalizeRequiredPositiveInt(payload.assetId, '资产不存在');
    const asset = await this.loadAsset(assetId);
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权操作该报废单');
    const disposalNo = normalizeRequiredText(
      payload.disposalNo || `ASSET-DP-${Date.now()}`,
      50,
      '报废单号不能为空且长度不能超过 50'
    );
    const duplicated = await this.performanceAssetDisposalEntity.findOneBy({ disposalNo });
    if (duplicated) {
      throw new CoolCommException('报废单号已存在');
    }
    const saved = await this.performanceAssetDisposalEntity.save(
      this.performanceAssetDisposalEntity.create({
        disposalNo,
        assetId,
        ownerDepartmentId: asset.ownerDepartmentId,
        reason: normalizeRequiredText(payload.reason, 2000, '报废原因不能为空且长度不能超过 2000'),
        remark: normalizeOptionalText(payload.remark, 2000, '备注长度不能超过 2000'),
        approvedById: null,
        executedById: null,
        submittedAt: null,
        approvedAt: null,
        executedAt: null,
        status: 'draft',
      })
    );
    return this.assetDisposalInfo(saved.id);
  }

  async assetDisposalUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDisposal:update', '无权限编辑报废单');
    const id = normalizeRequiredPositiveInt(payload.id, '报废单不存在');
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('报废单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (current.status !== 'draft') {
      throw new CoolCommException('仅 draft 状态允许编辑');
    }
    await this.performanceAssetDisposalEntity.update(
      { id },
      {
        reason: normalizeRequiredText(payload.reason ?? current.reason, 2000, '报废原因不能为空且长度不能超过 2000'),
        remark: normalizeOptionalText(payload.remark ?? current.remark, 2000, '备注长度不能超过 2000'),
      }
    );
    return this.assetDisposalInfo(id);
  }

  async assetDisposalSubmit(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDisposal:submit', '无权限提交报废单');
    const id = normalizeRequiredPositiveInt(payload.id, '报废单不存在');
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('报废单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (current.status !== 'draft') {
      throw new CoolCommException('仅 draft 状态允许提交');
    }
    await this.performanceAssetDisposalEntity.update(
      { id },
      {
        status: 'submitted',
        submittedAt: nowTime(),
      }
    );
    return this.assetDisposalInfo(id);
  }

  async assetDisposalApprove(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDisposal:approve', '无权限审批报废单');
    const id = normalizeRequiredPositiveInt(payload.id, '报废单不存在');
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('报废单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (current.status !== 'submitted') {
      throw new CoolCommException('仅 submitted 状态允许审批');
    }
    await this.performanceAssetDisposalEntity.update(
      { id },
      {
        status: 'approved',
        approvedById: Number(this.currentAdmin?.userId || 0) || null,
        approvedAt: nowTime(),
        remark: normalizeOptionalText(payload.remark ?? current.remark, 2000, '备注长度不能超过 2000'),
      }
    );
    return this.assetDisposalInfo(id);
  }

  async assetDisposalExecute(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDisposal:execute', '无权限执行报废');
    const id = normalizeRequiredPositiveInt(payload.id, '报废单不存在');
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('报废单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (current.status !== 'approved') {
      throw new CoolCommException('仅 approved 状态允许执行报废');
    }
    await this.performanceAssetDisposalEntity.update(
      { id },
      {
        status: 'scrapped',
        executedById: Number(this.currentAdmin?.userId || 0) || null,
        executedAt: normalizeDate(payload.executeTime, 19) || nowTime(),
      }
    );
    await this.performanceAssetInfoEntity.update({ id: current.assetId }, { status: 'scrapped' });
    return this.assetDisposalInfo(id);
  }

  async assetDisposalCancel(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetDisposal:cancel', '无权限取消报废单');
    const id = normalizeRequiredPositiveInt(payload.id, '报废单不存在');
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException('报废单不存在');
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (!['draft', 'submitted', 'approved'].includes(current.status)) {
      throw new CoolCommException('当前状态不允许取消');
    }
    await this.performanceAssetDisposalEntity.update(
      { id },
      {
        status: 'cancelled',
        remark: normalizeOptionalText(payload.remark ?? current.remark, 2000, '备注长度不能超过 2000'),
      }
    );
    return this.assetDisposalInfo(id);
  }

  async assetReportSummary(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetReport:summary', '无权限查看资产报表汇总');
    const page = await this.assetReportPage({
      page: 1,
      size: 10000,
      keyword: query.keyword,
      departmentId: query.departmentId,
      category: query.category,
      assetStatus: query.assetStatus,
      reportDate: query.reportDate,
    });
    const list = page.list || [];
    return {
      assetCount: list.length,
      totalOriginalAmount: list.reduce((sum, item) => sum + Number(item.originalAmount || 0), 0),
      totalNetValue: list.reduce((sum, item) => sum + Number(item.netValue || 0), 0),
      assignedCount: list.filter(item => item.assetStatus === 'assigned').length,
      maintenanceCount: list.filter(item => item.assetStatus === 'maintenance').length,
      scrappedCount: list.filter(item => item.assetStatus === 'scrapped').length,
      lostCount: list.filter(item => item.assetStatus === 'lost').length,
    };
  }

  async assetReportPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetReport:page', '无权限查看资产报表');
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    let assets = await this.performanceAssetInfoEntity.find();
    assets = await this.scopeRows(assets, perms, item => item.ownerDepartmentId);
    const keyword = String(query.keyword || '').trim().toLowerCase();
    if (keyword) {
      assets = assets.filter(item =>
        [item.assetNo, item.assetName]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(keyword))
      );
    }
    if (query.departmentId) {
      assets = assets.filter(item => Number(item.ownerDepartmentId) === Number(query.departmentId));
    }
    if (query.category) {
      assets = assets.filter(item => item.category === String(query.category).trim());
    }
    if (query.assetStatus) {
      assets = assets.filter(item => item.status === String(query.assetStatus).trim());
    }
    const month = monthValue(query.reportDate);
    const depreciationRows = await this.performanceAssetDepreciationEntity.find();
    const disposalRows = await this.performanceAssetDisposalEntity.find();
    const departmentMap = await this.departmentMap(uniqueNumberList(assets.map(item => item.ownerDepartmentId)));
    const depreciationMap = new Map(
      depreciationRows
        .filter(item => item.periodValue === month)
        .map(item => [Number(item.assetId), item])
    );
    const disposalMap = new Map(
      disposalRows
        .filter(item => !['cancelled'].includes(item.status))
        .map(item => [Number(item.assetId), item])
    );
    const list = assets
      .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
      .map(item => ({
        id: item.id,
        reportDate: month,
        assetId: item.id,
        assetNo: item.assetNo,
        assetName: item.assetName,
        category: item.category || '',
        departmentId: item.ownerDepartmentId,
        departmentName: departmentMap.get(Number(item.ownerDepartmentId))?.name || '',
        assetStatus: item.status,
        originalAmount: Number(item.purchaseCost || 0),
        netValue: Number(item.netBookValue || 0),
        monthlyDepreciation: Number(depreciationMap.get(Number(item.id))?.depreciationAmount || 0),
        disposalStatus: disposalMap.get(Number(item.id))?.status,
        remark: item.remark || '',
      }));
    return paginateList(list, page, size);
  }

  async assetReportExport(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, 'performance:assetReport:export', '无权限导出资产报表');
    const page = await this.assetReportPage({ ...query, page: 1, size: 10000 });
    return page.list;
  }
}
