/**
 * 采购订单领域服务。
 * 这里只负责主题11冻结的 `purchaseOrder page/info/add/update/delete` 最小主链，不负责采购计划、询价、审批、收货/入库、对账或付款扩展。
 * 维护重点是经理部门树范围、状态流转、删除限制和供应商/申请人/部门关联校验必须由服务端兜底。
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
import { PerformancePurchaseOrderEntity } from '../entity/purchase-order';
import { PerformanceSupplierEntity } from '../entity/supplier';

type PurchaseOrderStatus = 'draft' | 'active' | 'cancelled';

const PURCHASE_ORDER_STATUS: PurchaseOrderStatus[] = [
  'draft',
  'active',
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

function normalizeOptionalCode(value: any, maxLength: number, message: string) {
  return normalizeOptionalText(value, maxLength, message);
}

function normalizeRequiredPositiveInt(value: any, message: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(message);
  }

  return parsed;
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformancePurchaseOrderService extends BaseService {
  @InjectEntityModel(PerformancePurchaseOrderEntity)
  performancePurchaseOrderEntity: Repository<PerformancePurchaseOrderEntity>;

  @InjectEntityModel(PerformanceSupplierEntity)
  performanceSupplierEntity: Repository<PerformanceSupplierEntity>;

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
    page: 'performance:purchaseOrder:page',
    info: 'performance:purchaseOrder:info',
    add: 'performance:purchaseOrder:add',
    update: 'performance:purchaseOrder:update',
    delete: 'performance:purchaseOrder:delete',
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
    this.assertPerm(perms, this.perms.page, '无权限查看采购订单列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const departmentIds = await this.departmentScopeIds(perms);
    const qb = this.performancePurchaseOrderEntity
      .createQueryBuilder('purchaseOrder')
      .leftJoin(
        PerformanceSupplierEntity,
        'supplier',
        'supplier.id = purchaseOrder.supplierId'
      )
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = purchaseOrder.departmentId'
      )
      .leftJoin(
        BaseSysUserEntity,
        'requester',
        'requester.id = purchaseOrder.requesterId'
      )
      .select([
        'purchaseOrder.id as id',
        'purchaseOrder.orderNo as orderNo',
        'purchaseOrder.title as title',
        'purchaseOrder.supplierId as supplierId',
        'supplier.name as supplierName',
        'purchaseOrder.departmentId as departmentId',
        'department.name as departmentName',
        'purchaseOrder.requesterId as requesterId',
        'requester.name as requesterName',
        'purchaseOrder.orderDate as orderDate',
        'purchaseOrder.totalAmount as totalAmount',
        'purchaseOrder.currency as currency',
        'purchaseOrder.remark as remark',
        'purchaseOrder.status as status',
        'purchaseOrder.createTime as createTime',
        'purchaseOrder.updateTime as updateTime',
      ]);

    this.applyDepartmentScope(qb, departmentIds);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('purchaseOrder.orderNo like :keyword', { keyword })
            .orWhere('purchaseOrder.title like :keyword', { keyword });
        })
      );
    }

    if (query.supplierId !== undefined && query.supplierId !== null && query.supplierId !== '') {
      qb.andWhere('purchaseOrder.supplierId = :supplierId', {
        supplierId: normalizeRequiredPositiveInt(query.supplierId, '供应商不存在'),
      });
    }

    if (
      query.departmentId !== undefined &&
      query.departmentId !== null &&
      query.departmentId !== ''
    ) {
      qb.andWhere('purchaseOrder.departmentId = :departmentId', {
        departmentId: normalizeRequiredPositiveInt(query.departmentId, '部门不存在'),
      });
    }

    if (query.status) {
      qb.andWhere('purchaseOrder.status = :status', {
        status: this.normalizeStatus(query.status),
      });
    }

    if (query.startDate) {
      qb.andWhere('purchaseOrder.orderDate >= :startDate', {
        startDate: this.normalizeDateBoundary(query.startDate, 'start'),
      });
    }

    if (query.endDate) {
      qb.andWhere('purchaseOrder.orderDate <= :endDate', {
        endDate: this.normalizeDateBoundary(query.endDate, 'end'),
      });
    }

    qb.orderBy('purchaseOrder.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizePurchaseOrderRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看采购订单详情');

    const purchaseOrder = await this.requirePurchaseOrder(id);
    await this.assertPurchaseOrderInScope(purchaseOrder, perms, '无权查看该采购订单');

    return this.buildPurchaseOrderDetail(purchaseOrder);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增采购订单');

    const normalized = await this.normalizePayload(payload, null, perms, 'add');
    const saved = await this.performancePurchaseOrderEntity.save(
      this.performancePurchaseOrderEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updatePurchaseOrder(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改采购订单');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '数据不存在')
    );
    await this.assertPurchaseOrderInScope(purchaseOrder, perms, '无权操作该采购订单');

    const normalized = await this.normalizePayload(
      payload,
      purchaseOrder,
      perms,
      'update'
    );

    await this.performancePurchaseOrderEntity.update(
      { id: purchaseOrder.id },
      normalized
    );
    return this.info(purchaseOrder.id);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.delete, '无权限删除采购订单');

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

    const rows = await this.performancePurchaseOrderEntity.findBy({
      id: In(validIds),
    });

    if (rows.length !== validIds.length) {
      throw new CoolCommException('数据不存在');
    }

    rows.forEach(item => {
      if (item.status !== 'draft') {
        throw new CoolCommException('当前状态不允许删除');
      }
    });

    await this.performancePurchaseOrderEntity.delete(validIds);
  }

  private async normalizePayload(
    payload: any,
    existing: PerformancePurchaseOrderEntity | null,
    perms: string[],
    mode: 'add' | 'update'
  ) {
    const orderNo = normalizeOptionalCode(
      payload.orderNo ?? existing?.orderNo,
      50,
      '订单编号长度不合法'
    );
    const title = normalizeRequiredText(
      payload.title ?? existing?.title,
      200,
      '采购标题不能为空'
    );
    const supplierId = normalizeRequiredPositiveInt(
      payload.supplierId ?? existing?.supplierId,
      '供应商不存在'
    );
    const departmentId = normalizeRequiredPositiveInt(
      payload.departmentId ?? existing?.departmentId,
      '部门不存在'
    );
    const requesterId = normalizeRequiredPositiveInt(
      payload.requesterId ?? existing?.requesterId,
      '申请人不存在'
    );
    const orderDate = normalizeRequiredText(
      payload.orderDate ?? existing?.orderDate,
      10,
      '采购日期不能为空'
    );
    const totalAmount = this.normalizeAmount(
      payload.totalAmount ?? existing?.totalAmount
    );
    const currency = this.normalizeCurrency(payload.currency ?? existing?.currency);
    const remark = normalizeOptionalText(
      payload.remark ?? existing?.remark,
      2000,
      '备注长度不合法'
    );
    const status = this.resolveNextStatus(
      mode,
      existing?.status as PurchaseOrderStatus | undefined,
      payload.status,
      perms
    );

    await this.assertSupplierExists(supplierId);
    await this.assertDepartmentExists(departmentId);
    await this.assertRequesterExists(requesterId);
    await this.assertCanManageDepartment(departmentId, perms);
    await this.assertOrderNoUnique(orderNo, existing?.id);

    return {
      orderNo,
      title,
      supplierId,
      departmentId,
      requesterId,
      orderDate,
      totalAmount,
      currency,
      remark,
      status,
    };
  }

  private resolveNextStatus(
    mode: 'add' | 'update',
    currentStatus: PurchaseOrderStatus | undefined,
    nextStatusInput: any,
    perms: string[]
  ) {
    const nextStatus = this.normalizeStatus(nextStatusInput || currentStatus || 'draft');

    if (mode === 'add') {
      if (nextStatus !== 'draft') {
        throw new CoolCommException('新增采购订单状态只能为 draft');
      }
      return nextStatus;
    }

    if (currentStatus === 'cancelled') {
      throw new CoolCommException('当前状态不允许编辑');
    }

    if (currentStatus === 'draft' && ['draft', 'active', 'cancelled'].includes(nextStatus)) {
      return nextStatus;
    }

    if (currentStatus === 'active' && nextStatus === 'active') {
      return nextStatus;
    }

    if (currentStatus === 'active' && nextStatus === 'cancelled' && this.isHr(perms)) {
      return nextStatus;
    }

    if (currentStatus === nextStatus) {
      return nextStatus;
    }

    throw new CoolCommException('当前状态不允许执行该操作');
  }

  private normalizeStatus(value: any) {
    const status = String(value || 'draft').trim() as PurchaseOrderStatus;

    if (!PURCHASE_ORDER_STATUS.includes(status)) {
      throw new CoolCommException('采购订单状态不合法');
    }

    return status;
  }

  private normalizeCurrency(value: any) {
    const currency = String(value || 'CNY').trim();

    if (!currency || currency.length > 20) {
      throw new CoolCommException('币种不合法');
    }

    return currency;
  }

  private normalizeAmount(value: any) {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new CoolCommException('订单总金额不合法');
    }

    return Math.round(amount * 100) / 100;
  }

  private normalizeDateBoundary(value: any, side: 'start' | 'end') {
    const date = String(value || '').trim();

    if (!date) {
      return date;
    }

    if (date.length === 10) {
      return side === 'start' ? date : date;
    }

    return date;
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

  private applyDepartmentScope(qb: any, departmentIds: number[] | null) {
    if (departmentIds === null) {
      return;
    }

    if (!departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('purchaseOrder.departmentId in (:...departmentIds)', {
      departmentIds,
    });
  }

  private async assertPurchaseOrderInScope(
    purchaseOrder: PerformancePurchaseOrderEntity,
    perms: string[],
    message: string
  ) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);

    if (!departmentIds?.includes(Number(purchaseOrder.departmentId || 0))) {
      throw new CoolCommException(message);
    }
  }

  private async assertCanManageDepartment(departmentId: number, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);

    if (!departmentIds?.includes(departmentId)) {
      throw new CoolCommException('无权操作该采购订单');
    }
  }

  private async assertSupplierExists(supplierId: number) {
    const supplier = await this.performanceSupplierEntity.findOneBy({ id: supplierId });

    if (!supplier) {
      throw new CoolCommException('供应商不存在');
    }
  }

  private async assertDepartmentExists(departmentId: number) {
    const department = await this.baseSysDepartmentEntity.findOneBy({ id: departmentId });

    if (!department) {
      throw new CoolCommException('部门不存在');
    }
  }

  private async assertRequesterExists(requesterId: number) {
    const requester = await this.baseSysUserEntity.findOneBy({ id: requesterId });

    if (!requester) {
      throw new CoolCommException('申请人不存在');
    }
  }

  private async assertOrderNoUnique(orderNo?: string | null, excludeId?: number) {
    if (!orderNo) {
      return;
    }

    const exists = await this.performancePurchaseOrderEntity.findOneBy({ orderNo });

    if (exists && Number(exists.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('订单编号已存在');
    }
  }

  private async requirePurchaseOrder(id: number) {
    const purchaseOrder = await this.performancePurchaseOrderEntity.findOneBy({ id });

    if (!purchaseOrder) {
      throw new CoolCommException('数据不存在');
    }

    return purchaseOrder;
  }

  private async buildPurchaseOrderDetail(
    purchaseOrder: PerformancePurchaseOrderEntity
  ) {
    const [supplier, department, requester] = await Promise.all([
      this.performanceSupplierEntity.findOneBy({ id: purchaseOrder.supplierId }),
      this.baseSysDepartmentEntity.findOneBy({ id: purchaseOrder.departmentId }),
      this.baseSysUserEntity.findOneBy({ id: purchaseOrder.requesterId }),
    ]);

    return this.normalizePurchaseOrderRow({
      ...purchaseOrder,
      supplierName: supplier?.name || '',
      departmentName: department?.name || '',
      requesterName: requester?.name || '',
    });
  }

  private normalizePurchaseOrderRow(item: any) {
    return {
      id: Number(item.id),
      orderNo: item.orderNo || null,
      title: item.title || '',
      supplierId: Number(item.supplierId || 0),
      supplierName: item.supplierName || '',
      departmentId: Number(item.departmentId || 0),
      departmentName: item.departmentName || '',
      requesterId: Number(item.requesterId || 0),
      requesterName: item.requesterName || '',
      orderDate: item.orderDate || '',
      totalAmount: this.normalizeNullableAmount(item.totalAmount),
      currency: item.currency || 'CNY',
      remark: item.remark || null,
      status: item.status || 'draft',
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private normalizeNullableAmount(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const amount = Number(value);
    return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null;
  }
}
