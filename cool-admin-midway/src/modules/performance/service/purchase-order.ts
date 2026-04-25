/**
 * 采购订单领域服务。
 * 这里只负责主题11扩容后冻结的 `purchaseOrder` 主链、状态动作和部门树范围控制，
 * 不负责付款、对账、库存总账、财务凭证或外部 ERP。
 * 维护重点是 `purchaseOrder` 单主资源状态机、经理部门树权限、终态锁定和轻量流程记录必须始终由服务端兜底。
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
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformancePurchaseOrderEntity } from '../entity/purchase-order';
import { PerformanceSupplierEntity } from '../entity/supplier';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import { PURCHASE_ORDER_STATUS_VALUES } from './purchase-order-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

type PurchaseOrderStatus =
  | 'draft'
  | 'inquiring'
  | 'pendingApproval'
  | 'approved'
  | 'received'
  | 'closed'
  | 'cancelled';

const PURCHASE_ORDER_STATUS: PurchaseOrderStatus[] = [
  ...PURCHASE_ORDER_STATUS_VALUES,
];
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.departmentNotFound
  );
const PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.supplierNotFound
  );
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateDeleteNotAllowed
  );
const PERFORMANCE_STATE_CLOSE_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateCloseNotAllowed
  );
const PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderOperateDenied
  );
const PERFORMANCE_PURCHASE_ORDER_SUBMIT_INQUIRY_STATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderSubmitInquiryStateDenied
  );
const PERFORMANCE_PURCHASE_ORDER_SUBMIT_APPROVAL_STATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderSubmitApprovalStateDenied
  );
const PERFORMANCE_PURCHASE_ORDER_APPROVE_STATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderApproveStateDenied
  );
const PERFORMANCE_PURCHASE_ORDER_REJECT_STATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderRejectStateDenied
  );
const PERFORMANCE_PURCHASE_ORDER_RECEIVE_STATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderReceiveStateDenied
  );
const PERFORMANCE_PURCHASE_ORDER_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderStatusInvalid
  );
const PERFORMANCE_PURCHASE_ORDER_CURRENCY_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderCurrencyInvalid
  );
const PERFORMANCE_PURCHASE_ORDER_TOTAL_AMOUNT_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderTotalAmountInvalid
  );
const PERFORMANCE_PURCHASE_ORDER_ITEMS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderItemsInvalid
  );
const PERFORMANCE_PURCHASE_ORDER_ORDER_NO_DUPLICATE_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderOrderNoDuplicate
  );
const PERFORMANCE_PURCHASE_ORDER_REQUESTER_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderRequesterNotFound
  );
const PERFORMANCE_PURCHASE_ORDER_STATUS_ACTION_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderStatusActionRequired
  );
const PERFORMANCE_PURCHASE_ORDER_RECEIPT_QUANTITY_EXCEEDED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderReceiptQuantityExceeded
  );
const PERFORMANCE_JSON_FIELD_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.jsonFieldInvalid
  );

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
      throw new CoolCommException(PERFORMANCE_JSON_FIELD_INVALID_MESSAGE);
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
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  ctx;

  private readonly perms = {
    page: PERMISSIONS.performance.purchaseOrder.page,
    info: PERMISSIONS.performance.purchaseOrder.info,
    add: PERMISSIONS.performance.purchaseOrder.add,
    update: PERMISSIONS.performance.purchaseOrder.update,
    delete: PERMISSIONS.performance.purchaseOrder.delete,
    submitInquiry: PERMISSIONS.performance.purchaseOrder.submitInquiry,
    submitApproval: PERMISSIONS.performance.purchaseOrder.submitApproval,
    approve: PERMISSIONS.performance.purchaseOrder.approve,
    reject: PERMISSIONS.performance.purchaseOrder.reject,
    receive: PERMISSIONS.performance.purchaseOrder.receive,
    close: PERMISSIONS.performance.purchaseOrder.close,
  };

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.purchaseOrder.page]: 'purchase_order.read',
    [PERMISSIONS.performance.purchaseOrder.info]: 'purchase_order.read',
    [PERMISSIONS.performance.purchaseOrder.add]: 'purchase_order.create',
    [PERMISSIONS.performance.purchaseOrder.update]: 'purchase_order.update',
    [PERMISSIONS.performance.purchaseOrder.delete]: 'purchase_order.delete',
    [PERMISSIONS.performance.purchaseOrder.submitInquiry]:
      'purchase_order.submit_inquiry',
    [PERMISSIONS.performance.purchaseOrder.submitApproval]:
      'purchase_order.submit_approval',
    [PERMISSIONS.performance.purchaseOrder.approve]: 'purchase_order.approve',
    [PERMISSIONS.performance.purchaseOrder.reject]: 'purchase_order.reject',
    [PERMISSIONS.performance.purchaseOrder.receive]: 'purchase_order.receive',
    [PERMISSIONS.performance.purchaseOrder.close]: 'purchase_order.close',
  };

  async page(query: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.page, '无权限查看采购订单列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const departmentIds = await this.departmentScopeIds(
      access,
      'purchase_order.read'
    );
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
        supplierId: normalizeRequiredPositiveInt(
          query.supplierId,
          PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE
        ),
      });
    }

    if (query.departmentId !== undefined && query.departmentId !== null && query.departmentId !== '') {
      const departmentId = normalizeRequiredPositiveInt(
        query.departmentId,
        PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
      );
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
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.info, '无权限查看采购订单详情');

    const purchaseOrder = await this.requirePurchaseOrder(id);
    await this.assertPurchaseOrderInScope(
      purchaseOrder,
      access,
      'purchase_order.read',
      '无权查看该采购订单'
    );

    return this.buildPurchaseOrderDetail(purchaseOrder);
  }

  async add(payload: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.add, '无权限新增采购订单');

    const normalized = await this.normalizeEditablePayload(
      payload,
      null,
      access,
      'purchase_order.create',
      'add'
    );
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
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.update, '无权限修改采购订单');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE)
    );
    await this.assertPurchaseOrderInScope(
      purchaseOrder,
      access,
      'purchase_order.update',
      PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE
    );
    this.assertEditableStatus(purchaseOrder.status as PurchaseOrderStatus);

    const normalized = await this.normalizeEditablePayload(
      payload,
      purchaseOrder,
      access,
      'purchase_order.update',
      'update'
    );

    await this.performancePurchaseOrderEntity.update(
      { id: purchaseOrder.id },
      normalized as any
    );
    return this.info(purchaseOrder.id);
  }

  async submitInquiry(payload: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.submitInquiry, '无权限提交询价');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(
      purchaseOrder,
      access,
      'purchase_order.submit_inquiry',
      PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE
    );

    if (purchaseOrder.status !== 'draft') {
      throw new CoolCommException(
        PERFORMANCE_PURCHASE_ORDER_SUBMIT_INQUIRY_STATE_DENIED_MESSAGE
      );
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
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.submitApproval, '无权限提交采购审批');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(
      purchaseOrder,
      access,
      'purchase_order.submit_approval',
      PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE
    );

    if (purchaseOrder.status !== 'inquiring') {
      throw new CoolCommException(
        PERFORMANCE_PURCHASE_ORDER_SUBMIT_APPROVAL_STATE_DENIED_MESSAGE
      );
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
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.approve, '无权限审批采购单');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(
      purchaseOrder,
      access,
      'purchase_order.approve',
      PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE
    );

    if (purchaseOrder.status !== 'pendingApproval') {
      throw new CoolCommException(
        PERFORMANCE_PURCHASE_ORDER_APPROVE_STATE_DENIED_MESSAGE
      );
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
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.reject, '无权限驳回采购单');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(
      purchaseOrder,
      access,
      'purchase_order.reject',
      PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE
    );

    if (purchaseOrder.status !== 'pendingApproval') {
      throw new CoolCommException(
        PERFORMANCE_PURCHASE_ORDER_REJECT_STATE_DENIED_MESSAGE
      );
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
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.receive, '无权限收货');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(
      purchaseOrder,
      access,
      'purchase_order.receive',
      PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE
    );

    if (!['approved', 'received'].includes(purchaseOrder.status)) {
      throw new CoolCommException(
        PERFORMANCE_PURCHASE_ORDER_RECEIVE_STATE_DENIED_MESSAGE
      );
    }

    const quantity = normalizeRequiredPositiveInt(
      payload.quantity ?? payload.receivedQuantity,
      '收货数量不合法'
    );
    const nextQuantity = Number(purchaseOrder.receivedQuantity || 0) + quantity;
    const totalItemQuantity = this.sumItemQuantity(purchaseOrder.items);
    if (totalItemQuantity > 0 && nextQuantity > totalItemQuantity) {
      throw new CoolCommException(
        PERFORMANCE_PURCHASE_ORDER_RECEIPT_QUANTITY_EXCEEDED_MESSAGE
      );
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
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.close, '无权限关闭采购单');

    const purchaseOrder = await this.requirePurchaseOrder(
      normalizeRequiredPositiveInt(payload.id, '采购单 ID 不合法')
    );
    await this.assertPurchaseOrderInScope(
      purchaseOrder,
      access,
      'purchase_order.close',
      PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE
    );

    if (!['approved', 'received'].includes(purchaseOrder.status)) {
      throw new CoolCommException(PERFORMANCE_STATE_CLOSE_NOT_ALLOWED_MESSAGE);
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
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.delete, '无权限删除采购订单');

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
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    rows.forEach(item => {
      const departmentId = Number(item.departmentId || 0);
      if (
        !this.performanceAccessContextService.matchesScope(
          access,
          this.performanceAccessContextService.capabilityScopes(
            access,
            'purchase_order.delete'
          ),
          { departmentId }
        )
      ) {
        throw new CoolCommException(PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE);
      }
      if (item.status !== 'draft') {
        throw new CoolCommException(PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE);
      }
    });

    await this.performancePurchaseOrderEntity.delete(validIds);
  }

  private async normalizeEditablePayload(
    payload: any,
    existing: PerformancePurchaseOrderEntity | null,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
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
      PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE
    );
    const departmentId = normalizeRequiredPositiveInt(
      payload.departmentId ?? existing?.departmentId,
      PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
    );
    const requesterId = normalizeRequiredPositiveInt(
      payload.requesterId ?? existing?.requesterId,
      PERFORMANCE_PURCHASE_ORDER_REQUESTER_NOT_FOUND_MESSAGE
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
        throw new CoolCommException(
          PERFORMANCE_PURCHASE_ORDER_STATUS_ACTION_REQUIRED_MESSAGE
        );
      }
    }

    await this.assertSupplierExists(supplierId);
    await this.assertDepartmentExists(departmentId);
    await this.assertRequesterExists(requesterId);
    await this.assertCanManageDepartment(departmentId, access, capabilityKey);
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
      throw new CoolCommException(PERFORMANCE_PURCHASE_ORDER_STATUS_INVALID_MESSAGE);
    }
    return status;
  }

  private normalizeCurrency(value: any) {
    const currency = String(value || 'CNY').trim();
    if (!currency || currency.length > 20) {
      throw new CoolCommException(PERFORMANCE_PURCHASE_ORDER_CURRENCY_INVALID_MESSAGE);
    }
    return currency;
  }

  private normalizeAmount(value: any) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new CoolCommException(
        PERFORMANCE_PURCHASE_ORDER_TOTAL_AMOUNT_INVALID_MESSAGE
      );
    }
    return Number(amount.toFixed(2));
  }

  private normalizeItems(value: any) {
    const parsed = normalizeJsonValue(value);
    if (parsed == null) {
      return [];
    }
    if (!Array.isArray(parsed)) {
      throw new CoolCommException(PERFORMANCE_PURCHASE_ORDER_ITEMS_INVALID_MESSAGE);
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
    return this.performanceAccessContextService.resolveAccessContext(undefined, {
      allowEmptyRoleIds: false,
      missingAuthMessage: '登录状态已失效',
    });
  }

  private resolveCapabilityKey(perm: string): PerformanceCapabilityKey {
    const capabilityKey = this.capabilityByPerm[perm];
    if (!capabilityKey) {
      throw new CoolCommException(`未映射的采购订单权限: ${perm}`);
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
    return Number(this.ctx?.admin?.userId || 0) || null;
  }

  private currentUserName() {
    return String(
      this.ctx?.admin?.name ||
        this.ctx?.admin?.nickName ||
        this.ctx?.admin?.username ||
        ''
    );
  }

  private async departmentScopeIds(
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    if (
      this.performanceAccessContextService.hasCapabilityInScopes(access, capabilityKey, [
        'company',
      ])
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
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, capabilityKey),
        {
          departmentId: Number(purchaseOrder.departmentId || 0),
        }
      )
    ) {
      return;
    }
    throw new CoolCommException(message);
  }

  private async assertCanManageDepartment(
    departmentId: number,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, capabilityKey),
        { departmentId }
      )
    ) {
      return;
    }
    throw new CoolCommException(PERFORMANCE_PURCHASE_ORDER_OPERATE_DENIED_MESSAGE);
  }

  private assertEditableStatus(status: PurchaseOrderStatus) {
    if (status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
    }
  }

  private async assertSupplierExists(supplierId: number) {
    const supplier = await this.performanceSupplierEntity.findOneBy({ id: supplierId });
    if (!supplier) {
      throw new CoolCommException(PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE);
    }
  }

  private async assertDepartmentExists(departmentId: number) {
    const department = await this.baseSysDepartmentEntity.findOneBy({ id: departmentId });
    if (!department) {
      throw new CoolCommException(PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE);
    }
  }

  private async assertRequesterExists(requesterId: number) {
    const requester = await this.baseSysUserEntity.findOneBy({ id: requesterId });
    if (!requester) {
      throw new CoolCommException(PERFORMANCE_PURCHASE_ORDER_REQUESTER_NOT_FOUND_MESSAGE);
    }
  }

  private async assertOrderNoUnique(orderNo?: string | null, excludeId?: number) {
    if (!orderNo) {
      return;
    }
    const exists = await this.performancePurchaseOrderEntity.findOneBy({ orderNo });
    if (exists && Number(exists.id) !== Number(excludeId || 0)) {
      throw new CoolCommException(
        PERFORMANCE_PURCHASE_ORDER_ORDER_NO_DUPLICATE_MESSAGE
      );
    }
  }

  private async requirePurchaseOrder(id: number) {
    const purchaseOrder = await this.performancePurchaseOrderEntity.findOneBy({ id });
    if (!purchaseOrder) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
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
