/**
 * 采购报表只读服务。
 * 这里只负责主题11冻结的 `summary / trend / supplierStats` 三个聚合接口，
 * 不负责导出、BI 大屏、付款分析或库存总账联动。
 * 维护重点是 HR 全量、经理部门树范围和只读统计口径必须与 `purchaseOrder` 单主资源保持一致。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { In, Repository } from 'typeorm';
import { PerformancePurchaseOrderEntity } from '../entity/purchase-order';
import { PerformanceSupplierEntity } from '../entity/supplier';
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

type PurchaseOrderStatus =
  | 'draft'
  | 'inquiring'
  | 'pendingApproval'
  | 'approved'
  | 'received'
  | 'closed'
  | 'cancelled';
const PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.departmentNotFound
  );
const PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.supplierNotFound
  );

function normalizeRequiredPositiveInt(value: any, message: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(message);
  }
  return parsed;
}

function normalizeDate(value: any, message: string) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  if (text.length > 10) {
    throw new CoolCommException(message);
  }
  return text;
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformancePurchaseReportService extends BaseService {
  @InjectEntityModel(PerformancePurchaseOrderEntity)
  performancePurchaseOrderEntity: Repository<PerformancePurchaseOrderEntity>;

  @InjectEntityModel(PerformanceSupplierEntity)
  performanceSupplierEntity: Repository<PerformanceSupplierEntity>;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  private readonly perms = {
    summary: PERMISSIONS.performance.purchaseReport.summary,
    trend: PERMISSIONS.performance.purchaseReport.trend,
    supplierStats: PERMISSIONS.performance.purchaseReport.supplierStats,
  };

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.purchaseReport.summary]:
      'purchase_report.summary.read',
    [PERMISSIONS.performance.purchaseReport.trend]:
      'purchase_report.trend.read',
    [PERMISSIONS.performance.purchaseReport.supplierStats]:
      'purchase_report.supplier_stats.read',
  };

  async summary(query: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.summary, '无权限查看采购报表汇总');

    const orders = await this.loadScopedOrders(
      query,
      access,
      'purchase_report.summary.read'
    );
    return {
      totalOrders: orders.length,
      totalAmount: this.sumAmount(orders.map(item => item.totalAmount)),
      supplierCount: new Set(
        orders
          .map(item => Number(item.supplierId || 0))
          .filter(item => Number.isInteger(item) && item > 0)
      ).size,
      totalReceivedQuantity: orders.reduce(
        (sum, item) => sum + Number(item.receivedQuantity || 0),
        0
      ),
      draftCount: this.countStatus(orders, 'draft'),
      inquiringCount: this.countStatus(orders, 'inquiring'),
      pendingApprovalCount: this.countStatus(orders, 'pendingApproval'),
      approvedCount: this.countStatus(orders, 'approved'),
      receivedCount: this.countStatus(orders, 'received'),
      closedCount: this.countStatus(orders, 'closed'),
      cancelledCount: this.countStatus(orders, 'cancelled'),
    };
  }

  async trend(query: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.trend, '无权限查看采购报表趋势');

    const orders = await this.loadScopedOrders(
      query,
      access,
      'purchase_report.trend.read'
    );
    const bucket = new Map<string, any>();

    orders.forEach(item => {
      const month = String(item.orderDate || '').slice(0, 7) || 'unknown';
      const row =
        bucket.get(month) || {
          month,
          period: month,
          orderCount: 0,
          totalAmount: 0,
          approvedCount: 0,
          receivedQuantity: 0,
          receivedCount: 0,
          closedCount: 0,
          cancelledCount: 0,
        };

      row.orderCount += 1;
      row.totalAmount = this.sumAmount([row.totalAmount, item.totalAmount]);
      if (item.status === 'approved') {
        row.approvedCount += 1;
      }
      row.receivedQuantity += Number(item.receivedQuantity || 0);
      if (item.status === 'received') {
        row.receivedCount += 1;
      }
      if (item.status === 'closed') {
        row.closedCount += 1;
      }
      if (item.status === 'cancelled') {
        row.cancelledCount += 1;
      }
      bucket.set(month, row);
    });

    return Array.from(bucket.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  async supplierStats(query: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.supplierStats, '无权限查看供应商采购统计');

    const orders = await this.loadScopedOrders(
      query,
      access,
      'purchase_report.supplier_stats.read'
    );
    const supplierIds = Array.from(
      new Set(
        orders
          .map(item => Number(item.supplierId || 0))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );
    const suppliers = supplierIds.length
      ? await this.performanceSupplierEntity.findBy({ id: In(supplierIds) })
      : [];
    const supplierMap = new Map(
      suppliers.map(item => [Number(item.id), item.name || ''])
    );
    const bucket = new Map<number, any>();

    orders.forEach(item => {
      const supplierId = Number(item.supplierId || 0);
      const row =
        bucket.get(supplierId) || {
          supplierId,
          supplierName: supplierMap.get(supplierId) || '',
          orderCount: 0,
          totalAmount: 0,
          receivedQuantity: 0,
          approvedCount: 0,
          receivedCount: 0,
          closedCount: 0,
          lastOrderDate: null,
        };

      row.orderCount += 1;
      row.totalAmount = this.sumAmount([row.totalAmount, item.totalAmount]);
      row.receivedQuantity += Number(item.receivedQuantity || 0);
      if (!row.lastOrderDate || String(item.orderDate || '') > String(row.lastOrderDate || '')) {
        row.lastOrderDate = item.orderDate || null;
      }
      if (item.status === 'approved') {
        row.approvedCount += 1;
      }
      if (item.status === 'received') {
        row.receivedCount += 1;
      }
      if (item.status === 'closed') {
        row.closedCount += 1;
      }
      bucket.set(supplierId, row);
    });

    return Array.from(bucket.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  private async loadScopedOrders(
    query: any,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const rows = await this.performancePurchaseOrderEntity.find();
    const departmentIds = await this.departmentScopeIds(access, capabilityKey);
    const requestedDepartmentId =
      query.departmentId === undefined || query.departmentId === null || query.departmentId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.departmentId,
            PERFORMANCE_DEPARTMENT_NOT_FOUND_MESSAGE
          );

    if (
      departmentIds !== null &&
      requestedDepartmentId !== null &&
      !departmentIds.includes(requestedDepartmentId)
    ) {
      throw new CoolCommException('无权查看该部门采购报表');
    }

    const keyword = String(query.keyword || '').trim().toLowerCase();
    const supplierId =
      query.supplierId === undefined || query.supplierId === null || query.supplierId === ''
        ? null
        : normalizeRequiredPositiveInt(
            query.supplierId,
            PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE
          );
    const status = String(query.status || '').trim() as PurchaseOrderStatus | '';
    const startDate = normalizeDate(query.startDate, '开始日期不合法');
    const endDate = normalizeDate(query.endDate, '结束日期不合法');

    return rows.filter(item => {
      if (departmentIds !== null && !departmentIds.includes(Number(item.departmentId || 0))) {
        return false;
      }
      if (
        requestedDepartmentId !== null &&
        Number(item.departmentId || 0) !== requestedDepartmentId
      ) {
        return false;
      }
      if (supplierId !== null && Number(item.supplierId || 0) !== supplierId) {
        return false;
      }
      if (status && String(item.status || '').trim() !== status) {
        return false;
      }
      if (startDate && String(item.orderDate || '') < startDate) {
        return false;
      }
      if (endDate && String(item.orderDate || '') > endDate) {
        return false;
      }
      if (keyword) {
        const orderNo = String(item.orderNo || '').toLowerCase();
        const title = String(item.title || '').toLowerCase();
        if (!orderNo.includes(keyword) && !title.includes(keyword)) {
          return false;
        }
      }
      return true;
    });
  }

  private sumAmount(values: any[]) {
    return Number(
      values
        .reduce((sum, item) => {
          const amount = Number(item || 0);
          return Number.isFinite(amount) ? sum + amount : sum;
        }, 0)
        .toFixed(2)
    );
  }

  private countStatus(rows: PerformancePurchaseOrderEntity[], status: PurchaseOrderStatus) {
    return rows.filter(item => item.status === status).length;
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
      throw new CoolCommException(`未映射的采购报表权限: ${perm}`);
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

    const ids = access.departmentIds;
    return Array.from(
      new Set(
        (Array.isArray(ids) ? ids : [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );
  }
}
