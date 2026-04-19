/**
 * 采购订单领域服务。
 * 这里只负责主题11扩容后冻结的 `purchaseOrder` 主链、状态动作和部门树范围控制，
 * 不负责付款、对账、库存总账、财务凭证或外部 ERP。
 * 维护重点是 `purchaseOrder` 单主资源状态机、经理部门树权限、终态锁定和轻量流程记录必须始终由服务端兜底。
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

type PurchaseOrderStatus =
  | 'draft'
  | 'inquiring'
  | 'pendingApproval'
  | 'approved'
  | 'received'
  | 'closed'
  | 'cancelled';

const PURCHASE_ORDER_STATUS: PurchaseOrderStatus[] = [
  'draft',
  'inquiring',
  'pendingApproval',
  'approved',
  'received',
  'closed',
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

function normalizeOptionalDate(value: any, maxLength: number, message: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return normalizeRequiredText(value, maxLength, message);
}

function normalizeJsonValue(value: any) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new CoolCommException('JSON 字段格式不合法');
    }
  }

  return value;
}

function formatDateTime(input: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    input.getFullYear(),
    '-',
    pad(input.getMonth() + 1),
    '-',
    pad(input.getDate()),
    ' ',
    pad(input.getHours()),
    ':',
    pad(input.getMinutes()),
    ':',
    pad(input.getSeconds()),
  ].join('');
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
    submitInquiry: 'performance:purchaseOrder:submitInquiry',
    submitApproval: 'performance:purchaseOrder:submitApproval',
    approve: 'performance:purchaseOrder:approve',
    reject: 'performance:purchaseOrder:reject',
    receive: 'performance:purchaseOrder:receive',
    close: 'performance:purchaseOrder:close',
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
      .leftJoin(
        BaseSysUserEntity,
        'approver',
        'approver.id = purchaseOrder.approvedBy'
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
        'purchaseOrder.expectedDeliveryDate as expectedDeliveryDate',
        'purchaseOrder.totalAmount as totalAmount',
        'purchaseOrder.currency as currency',
        'purchaseOrder.remark as remark',
        'purchaseOrder.status as status',
        'purchaseOrder.approvedBy as approvedBy',
        'approver.name as approvedByName',
        'purchaseOrder.approvedAt as approvedAt',
        'purchaseOrder.receivedQuantity as receivedQuantity',
        'purchaseOrder.receivedAt as receivedAt',
        'purchaseOrder.closedReason as closedReason',
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

    if (query.departmentId !== undefined && query.departmentId !== null && query.departmentId !== '') {
      const departmentId = normalizeRequiredPositiveInt(query.departmentId, '部门不存在');
      await this.assertReportDepartmentInScope(departmentId, departmentIds);
      qb.andWhere('purchaseOrder.departmentId = :departmentId', { departmentId });
    }

    if (query.status) {
      qb.andWhere('purchaseOrder.status = :status', {
        status: this.normalizeStatus(query.status),
      });
    }

    if (query.startDate) {
      qb.andWhere('purchaseOrder.orderDate >= :startDate', {
        startDate: normalizeRequiredText(query.startDate, 10, '开始日期不合法'),
      });
    }

    if (query.endDate) {
      qb.andWhere('purchaseOrder.orderDate <= :endDate', {
        endDate: normalizeRequiredText(query.endDate, 10, '结束日期不合法'),
      });
    }

    qb.orderBy('purchaseOrder.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb.offset((page - 1) * size).limit(size).getRawMany();

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

    const normalized = await this.normalizeEditablePayload(payload, null, perms, 'add');
    const saved: any = await this.performancePurchaseOrderEntity.save(
      this.performancePurchaseOrderEntity.create({
        ...normalized,
        status: 'draft',
        approvedBy: null,
        approvedAt: null,
        approvalRemark: null,
        closedReason: null,
        receivedQuantity: 0,
        receivedAt: null,
        inquiryRecords: [],
        approvalLogs: [],
        receiptRecords: [],
      } as any)
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
    this.assertEditableStatus(purchaseOrder.status as PurchaseOrderStatus);

    const normalized = await this.normalizeEditablePayload(
      payload,
      purchaseOrder,
      perms,
      'update'
    );

    await this.performancePurchaseOrderEntity.update(
      { id: purchaseOrder.id },
      normalized as any
    );
    return this.info(purchaseOrder.id);
  }

  async submitInquiry(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.submitInquiry, '无权限提交询价');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(purchaseOrder, perms, '无权操作该采购订单');

    if (purchaseOrder.status !== 'draft') {
      throw new CoolCommException('当前状态不允许提交询价');
    }

    const now = formatDateTime(new Date());
    await this.performancePurchaseOrderEntity.update(
      { id: purchaseOrder.id },
      {
        status: 'inquiring',
        inquiryRecords: this.appendRecord(purchaseOrder.inquiryRecords, {
          action: 'submitInquiry',
          remark: normalizeOptionalText(
            payload.inquiryRemark ?? payload.remark,
            2000,
            '询价备注长度不合法'
          ),
          operatorId: this.currentUserId(),
          operatorName: this.currentUserName(),
          operatedAt: now,
        }),
      } as any
    );

    return this.info(purchaseOrder.id);
  }

  async submitApproval(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.submitApproval, '无权限提交采购审批');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(purchaseOrder, perms, '无权操作该采购订单');

    if (purchaseOrder.status !== 'inquiring') {
      throw new CoolCommException('当前状态不允许提交采购审批');
    }

    const now = formatDateTime(new Date());
    await this.performancePurchaseOrderEntity.update(
      { id: purchaseOrder.id },
      {
        status: 'pendingApproval',
        approvalLogs: this.appendRecord(purchaseOrder.approvalLogs, {
          action: 'submitApproval',
          remark: normalizeOptionalText(
            payload.approvalRemark ?? payload.remark,
            2000,
            '审批备注长度不合法'
          ),
          operatorId: this.currentUserId(),
          operatorName: this.currentUserName(),
          operatedAt: now,
          fromStatus: purchaseOrder.status,
          toStatus: 'pendingApproval',
        }),
      } as any
    );

    return this.info(purchaseOrder.id);
  }

  async approve(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.approve, '无权限审批采购单');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(purchaseOrder, perms, '无权操作该采购订单');

    if (purchaseOrder.status !== 'pendingApproval') {
      throw new CoolCommException('当前状态不允许审批');
    }

    const now = formatDateTime(new Date());
    const approvalRemark = normalizeOptionalText(
      payload.approvalRemark ?? payload.remark,
      2000,
      '审批备注长度不合法'
    );
    await this.performancePurchaseOrderEntity.update(
      { id: purchaseOrder.id },
      {
        status: 'approved',
        approvedBy: this.currentUserId(),
        approvedAt: now,
        approvalRemark,
        approvalLogs: this.appendRecord(purchaseOrder.approvalLogs, {
          action: 'approve',
          remark: approvalRemark,
          operatorId: this.currentUserId(),
          operatorName: this.currentUserName(),
          operatedAt: now,
          fromStatus: purchaseOrder.status,
          toStatus: 'approved',
        }),
      } as any
    );

    return this.info(purchaseOrder.id);
  }

  async reject(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.reject, '无权限驳回采购单');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(purchaseOrder, perms, '无权操作该采购订单');

    if (purchaseOrder.status !== 'pendingApproval') {
      throw new CoolCommException('当前状态不允许驳回');
    }

    const now = formatDateTime(new Date());
    const approvalRemark = normalizeOptionalText(
      payload.approvalRemark ?? payload.remark,
      2000,
      '审批备注长度不合法'
    );
    await this.performancePurchaseOrderEntity.update(
      { id: purchaseOrder.id },
      {
        status: 'draft',
        approvedBy: null,
        approvedAt: null,
        approvalRemark,
        approvalLogs: this.appendRecord(purchaseOrder.approvalLogs, {
          action: 'reject',
          remark: approvalRemark,
          operatorId: this.currentUserId(),
          operatorName: this.currentUserName(),
          operatedAt: now,
          fromStatus: purchaseOrder.status,
          toStatus: 'draft',
        }),
      } as any
    );

    return this.info(purchaseOrder.id);
  }

  async receive(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.receive, '无权限收货');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(purchaseOrder, perms, '无权操作该采购订单');

    if (!['approved', 'received'].includes(purchaseOrder.status)) {
      throw new CoolCommException('当前状态不允许收货');
    }

    const quantity = normalizeRequiredPositiveInt(
      payload.quantity ?? payload.receivedQuantity,
      '收货数量不合法'
    );
    const nextQuantity = Number(purchaseOrder.receivedQuantity || 0) + quantity;
    const totalItemQuantity = this.sumItemQuantity(purchaseOrder.items);
    if (totalItemQuantity > 0 && nextQuantity > totalItemQuantity) {
      throw new CoolCommException('累计收货数量不能超过明细数量');
    }

    const receivedAt =
      normalizeOptionalDate(payload.receivedAt, 19, '收货时间不合法') ||
      formatDateTime(new Date());
    await this.performancePurchaseOrderEntity.update(
      { id: purchaseOrder.id },
      {
        status: 'received',
        receivedQuantity: nextQuantity,
        receivedAt,
        receiptRecords: this.appendRecord(purchaseOrder.receiptRecords, {
          action: 'receive',
          quantity,
          remark: normalizeOptionalText(
            payload.remark,
            2000,
            '收货备注长度不合法'
          ),
          operatorId: this.currentUserId(),
          operatorName: this.currentUserName(),
          operatedAt: receivedAt,
          cumulativeQuantity: nextQuantity,
        }),
      } as any
    );

    return this.info(purchaseOrder.id);
  }

  async close(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.close, '无权限关闭采购单');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(purchaseOrder, perms, '无权操作该采购订单');

    if (!['approved', 'received'].includes(purchaseOrder.status)) {
      throw new CoolCommException('当前状态不允许关闭');
    }

    const closedReason = normalizeRequiredText(
      payload.closedReason,
      2000,
      '关闭原因不能为空且长度不能超过 2000'
    );
    await this.performancePurchaseOrderEntity.update(
      { id: purchaseOrder.id },
      {
        status: 'closed',
        closedReason,
      } as any
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

  private async normalizeEditablePayload(
    payload: any,
    existing: PerformancePurchaseOrderEntity | null,
    perms: string[],
    mode: 'add' | 'update'
  ) {
    const orderNo = normalizeOptionalText(
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
    const expectedDeliveryDate = normalizeOptionalDate(
      payload.expectedDeliveryDate ?? existing?.expectedDeliveryDate,
      10,
      '期望交付日期不合法'
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
    const items = this.normalizeItems(payload.items ?? existing?.items);

    if (payload.status !== undefined && payload.status !== null && payload.status !== '') {
      const requestedStatus = this.normalizeStatus(payload.status);
      const expectedStatus = mode === 'add' ? 'draft' : existing?.status;
      if (requestedStatus !== expectedStatus) {
        throw new CoolCommException('请通过流程动作更新采购状态');
      }
    }

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
      expectedDeliveryDate,
      totalAmount,
      currency,
      remark,
      items,
      inquiryRecords: existing?.inquiryRecords || [],
      approvalLogs: existing?.approvalLogs || [],
      receiptRecords: existing?.receiptRecords || [],
    };
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
    return Number(amount.toFixed(2));
  }

  private normalizeItems(value: any) {
    const parsed = normalizeJsonValue(value);
    if (parsed == null) {
      return [];
    }
    if (!Array.isArray(parsed)) {
      throw new CoolCommException('采购明细格式不合法');
    }

    return parsed.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new CoolCommException(`采购明细第 ${index + 1} 行格式不合法`);
      }

      const quantity =
        item.quantity === undefined || item.quantity === null || item.quantity === ''
          ? null
          : normalizeRequiredPositiveInt(item.quantity, `采购明细第 ${index + 1} 行数量不合法`);
      const unitPrice =
        item.unitPrice === undefined || item.unitPrice === null || item.unitPrice === ''
          ? null
          : this.normalizeAmount(item.unitPrice);
      const totalAmount =
        item.totalAmount === undefined || item.totalAmount === null || item.totalAmount === ''
          ? quantity != null && unitPrice != null
            ? Number((quantity * unitPrice).toFixed(2))
            : null
          : this.normalizeAmount(item.totalAmount);

      return {
        name: normalizeOptionalText(
          item.name ?? item.itemName,
          200,
          `采购明细第 ${index + 1} 行名称不合法`
        ),
        spec: normalizeOptionalText(
          item.spec ?? item.specification,
          200,
          `采购明细第 ${index + 1} 行规格不合法`
        ),
        quantity,
        unitPrice,
        totalAmount:
          item.totalAmount === undefined &&
          item.amount !== undefined &&
          item.amount !== null &&
          item.amount !== ''
            ? this.normalizeAmount(item.amount)
            : totalAmount,
        remark: normalizeOptionalText(item.remark, 1000, `采购明细第 ${index + 1} 行备注不合法`),
      };
    });
  }

  private appendRecord(source: any, payload: Record<string, any>) {
    const list = Array.isArray(source) ? source.slice() : [];
    list.push(payload);
    return list;
  }

  private sumItemQuantity(items: any) {
    if (!Array.isArray(items)) {
      return 0;
    }
    return items.reduce((sum, item) => {
      const quantity = Number(item?.quantity || 0);
      return Number.isFinite(quantity) && quantity > 0 ? sum + quantity : sum;
    }, 0);
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

  private currentUserId() {
    return Number(this.currentAdmin?.userId || 0) || null;
  }

  private currentUserName() {
    return String(
      this.currentAdmin?.name || this.currentAdmin?.nickName || this.currentAdmin?.username || ''
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

  private async assertReportDepartmentInScope(
    departmentId: number,
    departmentIds: number[] | null
  ) {
    if (departmentIds === null) {
      return;
    }
    if (!departmentIds.includes(departmentId)) {
      throw new CoolCommException('无权查看该部门采购订单');
    }
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

  private assertEditableStatus(status: PurchaseOrderStatus) {
    if (status !== 'draft') {
      throw new CoolCommException('当前状态不允许编辑');
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

  private async buildPurchaseOrderDetail(purchaseOrder: PerformancePurchaseOrderEntity) {
    // Keep detail hydration on a single async path to avoid avoidable connection spikes
    // when local verification is already sharing the same MariaDB with many background runtimes.
    const supplier = await this.performanceSupplierEntity.findOneBy({
      id: purchaseOrder.supplierId,
    });
    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: purchaseOrder.departmentId,
    });
    const requester = await this.baseSysUserEntity.findOneBy({
      id: purchaseOrder.requesterId,
    });
    const approver = purchaseOrder.approvedBy
      ? await this.baseSysUserEntity.findOneBy({ id: purchaseOrder.approvedBy })
      : null;

    return this.normalizePurchaseOrderRow({
      ...purchaseOrder,
      supplierName: supplier?.name || '',
      departmentName: department?.name || '',
      requesterName: requester?.name || '',
      approvedByName: approver?.name || '',
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
      expectedDeliveryDate: item.expectedDeliveryDate || null,
      totalAmount: this.normalizeNullableAmount(item.totalAmount),
      currency: item.currency || 'CNY',
      remark: item.remark || null,
      status: item.status || 'draft',
      approvedBy:
        item.approvedBy === null || item.approvedBy === undefined || item.approvedBy === ''
          ? null
          : Number(item.approvedBy),
      approvedByName: item.approvedByName || '',
      approvedAt: item.approvedAt || null,
      approvalRemark: item.approvalRemark || null,
      closedReason: item.closedReason || null,
      receivedQuantity: Number(item.receivedQuantity || 0),
      receivedAt: item.receivedAt || null,
      items: this.normalizeItemRows(item.items),
      inquiryRecords: this.normalizeInquiryRows(item.inquiryRecords),
      approvalLogs: this.normalizeApprovalRows(item.approvalLogs),
      receiptRecords: this.normalizeReceiptRows(item.receiptRecords),
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private normalizeItemRows(items: any) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map(item => ({
      id: item?.id || null,
      itemName: item?.itemName || item?.name || '',
      specification: item?.specification || item?.spec || null,
      unit: item?.unit || null,
      quantity: Number(item?.quantity || 0),
      unitPrice: this.normalizeNullableAmount(item?.unitPrice) || 0,
      amount:
        this.normalizeNullableAmount(item?.amount) ??
        this.normalizeNullableAmount(item?.totalAmount) ??
        0,
      remark: item?.remark || null,
    }));
  }

  private normalizeInquiryRows(records: any) {
    if (!Array.isArray(records)) {
      return [];
    }

    return records.map(item => ({
      id: item?.id || null,
      supplierId: item?.supplierId ? Number(item.supplierId) : null,
      supplierName: item?.supplierName || '',
      quotedAmount:
        this.normalizeNullableAmount(item?.quotedAmount) ??
        this.normalizeNullableAmount(item?.amount) ??
        0,
      inquiryRemark: item?.inquiryRemark || item?.remark || null,
      createdBy: item?.createdBy || item?.operatorName || '',
      createdAt: item?.createdAt || item?.operatedAt || '',
    }));
  }

  private normalizeApprovalRows(records: any) {
    if (!Array.isArray(records)) {
      return [];
    }

    return records.map(item => ({
      id: item?.id || null,
      action: item?.action || '',
      approverId: item?.approverId ? Number(item.approverId) : item?.operatorId ? Number(item.operatorId) : null,
      approverName: item?.approverName || item?.operatorName || '',
      remark: item?.remark || null,
      createdAt: item?.createdAt || item?.operatedAt || '',
    }));
  }

  private normalizeReceiptRows(records: any) {
    if (!Array.isArray(records)) {
      return [];
    }

    return records.map(item => ({
      id: item?.id || null,
      receivedQuantity:
        Number(item?.receivedQuantity || item?.quantity || 0) || 0,
      receivedAt: item?.receivedAt || item?.operatedAt || '',
      receiverId: item?.receiverId ? Number(item.receiverId) : item?.operatorId ? Number(item.operatorId) : null,
      receiverName: item?.receiverName || item?.operatorName || '',
      remark: item?.remark || null,
    }));
  }

  private normalizeNullableAmount(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const amount = Number(value);
    return Number.isFinite(amount) ? Number(amount.toFixed(2)) : null;
  }
}
