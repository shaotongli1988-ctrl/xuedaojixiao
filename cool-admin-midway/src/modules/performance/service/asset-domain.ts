/**
 * 资产管理统一领域服务。
 * 这里只负责主题20冻结的资产台账、领用、维护、采购入库、调拨、盘点、折旧、报废、首页和报表最小主链，
 * 不负责采购审批中心、供应商主数据中心、财务凭证、RFID/扫码或移动端入口。
 * 维护重点是权限边界、部门树范围和资产主状态回写必须始终收敛到这一处，避免子流程各自改状态造成漂移。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceAssetAssignmentEntity } from '../entity/assetAssignment';
import { PerformanceAssetAssignmentRequestEntity } from '../entity/assetAssignmentRequest';
import { PerformanceAssetDepreciationEntity } from '../entity/assetDepreciation';
import { PerformanceAssetDisposalEntity } from '../entity/assetDisposal';
import { PerformanceAssetInfoEntity } from '../entity/assetInfo';
import { PerformanceAssetInventoryEntity } from '../entity/assetInventory';
import { PerformanceAssetMaintenanceEntity } from '../entity/assetMaintenance';
import { PerformanceAssetProcurementEntity } from '../entity/assetProcurement';
import { PerformanceAssetTransferEntity } from '../entity/assetTransfer';
import { PerformancePurchaseOrderEntity } from '../entity/purchase-order';
import { PerformanceSupplierEntity } from '../entity/supplier';
import { PerformanceApprovalFlowService } from './approval-flow';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain';

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
type AssignmentRequestStatus =
  | 'draft'
  | 'inApproval'
  | 'rejected'
  | 'withdrawn'
  | 'approvedPendingAssignment'
  | 'issuing'
  | 'issued'
  | 'cancelled'
  | 'manualPending';
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
const ASSIGNMENT_REQUEST_STATUSES: AssignmentRequestStatus[] = [
  'draft',
  'inApproval',
  'rejected',
  'withdrawn',
  'approvedPendingAssignment',
  'issuing',
  'issued',
  'cancelled',
  'manualPending',
];
const PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.supplierNotFound
  );
const PERFORMANCE_ASSET_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetNotFound
  );
const PERFORMANCE_ORIGINAL_ASSET_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetNotFound,
    '原资产不存在'
  );
const PERFORMANCE_PURCHASE_ORDER_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.purchaseOrderNotFound
  );
const PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRequestNotFound
  );
const PERFORMANCE_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRecordNotFound
  );
const PERFORMANCE_ORIGINAL_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRecordNotFound,
    '原领用记录不存在'
  );
const PERFORMANCE_MAINTENANCE_RECORD_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetMaintenanceRecordNotFound
  );
const PERFORMANCE_APPLICANT_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound,
    '申请人部门不存在'
  );
const PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetProcurementNotFound
  );
const PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetTransferNotFound
  );
const PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetInventoryNotFound
  );
const PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetDisposalNotFound
  );
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
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
const PERFORMANCE_STATE_SUBMITTED_APPROVE_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateSubmittedApproveOnly
  );
const PERFORMANCE_STATE_APPROVED_EXECUTE_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateApprovedExecuteOnly
  );
const PERFORMANCE_TARGET_DEPARTMENT_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.targetDepartmentRequired
  );
const PERFORMANCE_ASSET_NO_DUPLICATE_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetNoDuplicate
  );
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
const ASSIGNMENT_REQUEST_TYPES = [
  'standard',
  'crossDepartmentBorrow',
  'lostReplacement',
  'abnormalReissue',
  'scrapReplacement',
] as const;
const ASSIGNMENT_REQUEST_L1_CATEGORIES = ['笔记本', '手机', '平板', '显示器'];
const ASSIGNMENT_REQUEST_SENSITIVE_CATEGORIES = [
  '笔记本',
  '手机',
  '平板',
  '高配工作站',
  '涉密终端',
];

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

function formatDateTimeText(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function normalizeDateTimeText(value: any) {
  if (!value) {
    return '';
  }
  if (value instanceof Date) {
    return formatDateTimeText(value);
  }
  const text = String(value).trim();
  if (!text) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text} 00:00:00`;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(text)) {
    return `${text}:00`;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(text)) {
    return text.slice(0, 19);
  }
  const parsed = new Date(text.replace(' ', 'T'));
  return Number.isFinite(parsed.getTime()) ? formatDateTimeText(parsed) : '';
}

function startOfTodayValue(now: Date) {
  const next = new Date(now);
  next.setHours(0, 0, 0, 0);
  return formatDateTimeText(next);
}

function startOfWeekValue(now: Date) {
  const next = new Date(now);
  const day = next.getDay();
  const offset = day === 0 ? 6 : day - 1;
  next.setDate(next.getDate() - offset);
  next.setHours(0, 0, 0, 0);
  return formatDateTimeText(next);
}

function startOfMonthValue(now: Date) {
  const next = new Date(now);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return formatDateTimeText(next);
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

  @InjectEntityModel(PerformanceAssetAssignmentRequestEntity)
  performanceAssetAssignmentRequestEntity: Repository<PerformanceAssetAssignmentRequestEntity>;

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
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  performanceApprovalFlowService: PerformanceApprovalFlowService;

  @Inject()
  ctx;

  private get currentCtx() {
    return this.ctx || {};
  }

  private get currentAdmin() {
    return this.currentCtx.admin || {};
  }

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.assetInfo.page]: 'asset_info.read',
    [PERMISSIONS.performance.assetInfo.info]: 'asset_info.read',
    [PERMISSIONS.performance.assetInfo.add]: 'asset_info.create',
    [PERMISSIONS.performance.assetInfo.update]: 'asset_info.update',
    [PERMISSIONS.performance.assetInfo.delete]: 'asset_info.delete',
    [PERMISSIONS.performance.assetInfo.updateStatus]: 'asset_info.update_status',
    [PERMISSIONS.performance.assetAssignment.page]: 'asset_assignment.read',
    [PERMISSIONS.performance.assetAssignment.add]: 'asset_assignment.create',
    [PERMISSIONS.performance.assetAssignment.update]: 'asset_assignment.update',
    [PERMISSIONS.performance.assetAssignment.delete]: 'asset_assignment.delete',
    [PERMISSIONS.performance.assetAssignment.return]: 'asset_assignment.return',
    [PERMISSIONS.performance.assetAssignment.markLost]:
      'asset_assignment.mark_lost',
    [PERMISSIONS.performance.assetAssignmentRequest.page]:
      'asset_assignment_request.read',
    [PERMISSIONS.performance.assetAssignmentRequest.info]:
      'asset_assignment_request.read',
    [PERMISSIONS.performance.assetAssignmentRequest.add]:
      'asset_assignment_request.create',
    [PERMISSIONS.performance.assetAssignmentRequest.update]:
      'asset_assignment_request.update',
    [PERMISSIONS.performance.assetAssignmentRequest.submit]:
      'asset_assignment_request.submit',
    [PERMISSIONS.performance.assetAssignmentRequest.withdraw]:
      'asset_assignment_request.withdraw',
    [PERMISSIONS.performance.assetAssignmentRequest.assign]:
      'asset_assignment_request.assign',
    [PERMISSIONS.performance.assetAssignmentRequest.cancel]:
      'asset_assignment_request.cancel',
    [PERMISSIONS.performance.assetDashboard.summary]: 'asset_dashboard.summary',
    [PERMISSIONS.performance.assetDepreciation.page]: 'asset_depreciation.read',
    [PERMISSIONS.performance.assetDepreciation.summary]:
      'asset_depreciation.summary',
    [PERMISSIONS.performance.assetDepreciation.recalculate]:
      'asset_depreciation.recalculate',
    [PERMISSIONS.performance.assetDisposal.page]: 'asset_disposal.read',
    [PERMISSIONS.performance.assetDisposal.info]: 'asset_disposal.read',
    [PERMISSIONS.performance.assetDisposal.add]: 'asset_disposal.create',
    [PERMISSIONS.performance.assetDisposal.update]: 'asset_disposal.update',
    [PERMISSIONS.performance.assetDisposal.submit]: 'asset_disposal.submit',
    [PERMISSIONS.performance.assetDisposal.approve]: 'asset_disposal.approve',
    [PERMISSIONS.performance.assetDisposal.execute]: 'asset_disposal.execute',
    [PERMISSIONS.performance.assetDisposal.cancel]: 'asset_disposal.cancel',
    [PERMISSIONS.performance.assetInventory.page]: 'asset_inventory.read',
    [PERMISSIONS.performance.assetInventory.info]: 'asset_inventory.read',
    [PERMISSIONS.performance.assetInventory.add]: 'asset_inventory.create',
    [PERMISSIONS.performance.assetInventory.update]: 'asset_inventory.update',
    [PERMISSIONS.performance.assetInventory.start]: 'asset_inventory.start',
    [PERMISSIONS.performance.assetInventory.complete]:
      'asset_inventory.complete',
    [PERMISSIONS.performance.assetInventory.close]: 'asset_inventory.close',
    [PERMISSIONS.performance.assetMaintenance.page]: 'asset_maintenance.read',
    [PERMISSIONS.performance.assetMaintenance.add]: 'asset_maintenance.create',
    [PERMISSIONS.performance.assetMaintenance.update]: 'asset_maintenance.update',
    [PERMISSIONS.performance.assetMaintenance.complete]:
      'asset_maintenance.complete',
    [PERMISSIONS.performance.assetMaintenance.cancel]: 'asset_maintenance.cancel',
    [PERMISSIONS.performance.assetMaintenance.delete]: 'asset_maintenance.delete',
    [PERMISSIONS.performance.assetProcurement.page]: 'asset_procurement.read',
    [PERMISSIONS.performance.assetProcurement.info]: 'asset_procurement.read',
    [PERMISSIONS.performance.assetProcurement.add]: 'asset_procurement.create',
    [PERMISSIONS.performance.assetProcurement.update]: 'asset_procurement.update',
    [PERMISSIONS.performance.assetProcurement.submit]:
      'asset_procurement.submit',
    [PERMISSIONS.performance.assetProcurement.receive]:
      'asset_procurement.receive',
    [PERMISSIONS.performance.assetProcurement.cancel]: 'asset_procurement.cancel',
    [PERMISSIONS.performance.assetReport.page]: 'asset_report.read',
    [PERMISSIONS.performance.assetReport.summary]: 'asset_report.summary',
    [PERMISSIONS.performance.assetReport.export]: 'asset_report.export',
    [PERMISSIONS.performance.assetTransfer.page]: 'asset_transfer.read',
    [PERMISSIONS.performance.assetTransfer.info]: 'asset_transfer.read',
    [PERMISSIONS.performance.assetTransfer.add]: 'asset_transfer.create',
    [PERMISSIONS.performance.assetTransfer.update]: 'asset_transfer.update',
    [PERMISSIONS.performance.assetTransfer.submit]: 'asset_transfer.submit',
    [PERMISSIONS.performance.assetTransfer.complete]: 'asset_transfer.complete',
    [PERMISSIONS.performance.assetTransfer.cancel]: 'asset_transfer.cancel',
  };

  private async currentPerms() {
    const access = await this.performanceAccessContextService.resolveAccessContext(
      undefined,
      {
        allowEmptyRoleIds: false,
        missingAuthMessage: '登录状态已失效',
      }
    );
    if (!this.currentCtx.admin) {
      this.currentCtx.admin = { userId: access.userId };
    } else if (!this.currentCtx.admin.userId) {
      this.currentCtx.admin.userId = access.userId;
    }
    return access;
  }

  private resolveCapabilityKey(perm: string): PerformanceCapabilityKey {
    const capabilityKey = this.capabilityByPerm[perm];
    if (!capabilityKey) {
      throw new CoolCommException(`未映射的资产权限: ${perm}`);
    }
    return capabilityKey;
  }

  private hasPerm(access: PerformanceResolvedAccessContext, perm: string) {
    return this.performanceAccessContextService.hasCapability(
      access,
      this.resolveCapabilityKey(perm)
    );
  }

  private assertPerm(
    access: PerformanceResolvedAccessContext,
    perm: string,
    message: string
  ) {
    if (!this.hasPerm(access, perm)) {
      throw new CoolCommException(message);
    }
  }

  private async departmentScopeIds(access: PerformanceResolvedAccessContext) {
    if (
      this.performanceAccessContextService.hasAnyCapabilityInScopes(
        access,
        [
          'asset_info.create',
          'asset_procurement.receive',
          'asset_depreciation.recalculate',
        ],
        ['company']
      )
    ) {
      return null;
    }
    return uniqueNumberList(access.departmentIds);
  }

  private async assertDepartmentInScope(
    departmentId: number | null | undefined,
    access: PerformanceResolvedAccessContext,
    message: string
  ) {
    const scopeIds = await this.departmentScopeIds(access);
    if (scopeIds === null) {
      return;
    }
    if (!scopeIds.length || !scopeIds.includes(Number(departmentId || 0))) {
      throw new CoolCommException(message);
    }
  }

  private async scopeRows<T>(
    rows: T[],
    access: PerformanceResolvedAccessContext,
    getter: (row: T) => number | null | undefined
  ) {
    const scopeIds = await this.departmentScopeIds(access);
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

  private async loadAsset(assetId: number, message = PERFORMANCE_ASSET_NOT_FOUND_MESSAGE) {
    const asset = await this.performanceAssetInfoEntity.findOneBy({ id: assetId });
    if (!asset) {
      throw new CoolCommException(message);
    }
    return asset;
  }

  private normalizeAssignmentRequestType(value: any) {
    const requestType = String(value || '').trim() as (typeof ASSIGNMENT_REQUEST_TYPES)[number];
    if (!ASSIGNMENT_REQUEST_TYPES.includes(requestType)) {
      throw new CoolCommException('领用申请类型不合法');
    }
    return requestType;
  }

  private normalizeAssignmentRequestStatus(value: any, message = '领用申请状态不合法') {
    return ensureStatus(value, ASSIGNMENT_REQUEST_STATUSES, message);
  }

  private currentUserId() {
    const userId = Number(this.currentAdmin?.userId || 0);
    if (!userId) {
      throw new CoolCommException(
        resolvePerformanceDomainErrorMessage(
          PERFORMANCE_DOMAIN_ERROR_CODES.authContextMissing
        )
      );
    }
    return userId;
  }

  private nextAssignmentRequestNo() {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `ASR-${stamp}-${random}`;
  }

  private computeAssignmentRequestRules(payload: {
    requestType: string;
    assetCategory: string;
    unitPriceEstimate: number;
  }) {
    const rules: string[] = [];
    const price = Number(payload.unitPriceEstimate || 0);
    const category = String(payload.assetCategory || '').trim();
    const requestType = payload.requestType;
    const isSensitive = ASSIGNMENT_REQUEST_SENSITIVE_CATEGORIES.includes(category);
    const isL1Category = ASSIGNMENT_REQUEST_L1_CATEGORIES.includes(category);

    if (price >= 5000) {
      rules.push('highAmount');
    } else if (price >= 1000) {
      rules.push('midAmount');
    }

    if (isSensitive) {
      rules.push('sensitiveAsset');
    } else if (isL1Category) {
      rules.push('l1Category');
    }

    if (requestType === 'crossDepartmentBorrow') {
      rules.push('crossDepartmentBorrow');
    }
    if (requestType === 'lostReplacement') {
      rules.push('lostReplacement');
    }
    if (requestType === 'abnormalReissue') {
      rules.push('abnormalReissue');
    }
    if (requestType === 'scrapReplacement') {
      rules.push('scrapReplacement');
    }

    const isL2 =
      rules.includes('highAmount') ||
      rules.includes('sensitiveAsset') ||
      rules.includes('crossDepartmentBorrow') ||
      rules.includes('lostReplacement') ||
      rules.includes('abnormalReissue') ||
      rules.includes('scrapReplacement');

    const requestLevel = isL2
      ? 'L2'
      : rules.includes('midAmount') || rules.includes('l1Category')
        ? 'L1'
        : 'L1';

    return {
      requestLevel,
      rules,
    };
  }

  private assertDirectAssignmentEligible(
    asset: PerformanceAssetInfoEntity,
    departmentId: number
  ) {
    const assetCategory = String(asset.category || '').trim();
    const isSensitive = ASSIGNMENT_REQUEST_SENSITIVE_CATEGORIES.includes(assetCategory);
    const unitPrice = Number(asset.purchaseCost || 0);
    const isCrossDepartment = Number(asset.ownerDepartmentId || 0) !== Number(departmentId || 0);

    const isL0Eligible = unitPrice < 1000 && !isSensitive && !isCrossDepartment;

    if (!isL0Eligible) {
      throw new CoolCommException(
        '当前领用场景需先走领用申请审批流程，请改用领用申请入口'
      );
    }
  }

  private shouldApplicantSelfScopeRequest(
    perms: PerformanceResolvedAccessContext
  ) {
    return (
      !this.hasPerm(perms, PERMISSIONS.performance.assetAssignmentRequest.assign) &&
      !this.hasPerm(perms, PERMISSIONS.performance.assetAssignmentRequest.cancel)
    );
  }

  private async requireAssignmentRequest(
    id: number,
    message = PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE
  ) {
    const request = await this.performanceAssetAssignmentRequestEntity.findOneBy({ id });
    if (!request) {
      throw new CoolCommException(message);
    }
    return request;
  }

  private async assertAssignmentRequestAccess(
    request: PerformanceAssetAssignmentRequestEntity,
    perms: PerformanceResolvedAccessContext,
    message: string
  ) {
    if (this.shouldApplicantSelfScopeRequest(perms)) {
      if (Number(request.applicantId) !== this.currentUserId()) {
        throw new CoolCommException(message);
      }
      return;
    }
    await this.assertDepartmentInScope(request.applicantDepartmentId, perms, message);
  }

  private parseTriggeredRules(value: string | null | undefined) {
    if (!value) {
      return [];
    }
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  private async buildAssignmentRequestRow(
    item: PerformanceAssetAssignmentRequestEntity,
    maps: {
      departments: Map<number, any>;
      users: Map<number, any>;
      assets: Map<number, any>;
      assignments: Map<number, any>;
    }
  ) {
    const applicant = maps.users.get(Number(item.applicantId));
    const approver = maps.users.get(Number(item.currentApproverId || 0));
    const assignedAsset = maps.assets.get(Number(item.assignedAssetId || 0));
    const assignment = maps.assignments.get(Number(item.assignmentRecordId || 0));
    return {
      id: item.id,
      requestNo: item.requestNo,
      requestLevel: item.requestLevel,
      requestType: item.requestType,
      applicantId: item.applicantId,
      applicantName: applicant?.name || '',
      applicantDepartmentId: item.applicantDepartmentId,
      applicantDepartmentName:
        maps.departments.get(Number(item.applicantDepartmentId || 0))?.name || '',
      assetCategory: item.assetCategory,
      assetModelRequest: item.assetModelRequest || '',
      quantity: Number(item.quantity || 0),
      unitPriceEstimate: Number(item.unitPriceEstimate || 0),
      usageReason: item.usageReason || '',
      expectedUseStartDate: item.expectedUseStartDate || '',
      targetDepartmentId: item.targetDepartmentId,
      targetDepartmentName:
        maps.departments.get(Number(item.targetDepartmentId || 0))?.name || '',
      exceptionReason: item.exceptionReason || '',
      originalAssetId: item.originalAssetId,
      originalAssetNo: maps.assets.get(Number(item.originalAssetId || 0))?.assetNo || '',
      originalAssignmentId: item.originalAssignmentId,
      approvalInstanceId: item.approvalInstanceId,
      approvalStatus: item.approvalStatus || '',
      currentApproverId: item.currentApproverId,
      currentApproverName: approver?.name || '',
      approvalTriggeredRules: this.parseTriggeredRules(item.approvalTriggeredRules),
      assignedAssetId: item.assignedAssetId,
      assignedAssetNo: assignedAsset?.assetNo || '',
      assignedAssetName: assignedAsset?.assetName || '',
      assignmentRecordId: item.assignmentRecordId,
      assignmentStatus: assignment?.status || '',
      assignedBy: item.assignedBy,
      assignedByName: maps.users.get(Number(item.assignedBy || 0))?.name || '',
      assignedAt: item.assignedAt || '',
      status: item.status,
      submitTime: item.submitTime || '',
      withdrawTime: item.withdrawTime || '',
      cancelReason: item.cancelReason || '',
      createTime: item.createTime,
      updateTime: item.updateTime,
    };
  }

  private async executeAssetAssignmentCreate(
    payload: {
      assetId: number;
      assigneeId: number;
      departmentId: number;
      assignDate?: string | null;
      actualReturnDate?: string | null;
      purpose?: string | null;
      returnRemark?: string | null;
    },
    perms: PerformanceResolvedAccessContext,
    manager?: EntityManager
  ) {
    const assetRepo = manager
      ? manager.getRepository(PerformanceAssetInfoEntity)
      : this.performanceAssetInfoEntity;
    const assignmentRepo = manager
      ? manager.getRepository(PerformanceAssetAssignmentEntity)
      : this.performanceAssetAssignmentEntity;
    const asset = await assetRepo.findOneBy({ id: payload.assetId });
    if (!asset) {
      throw new CoolCommException(PERFORMANCE_ASSET_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权操作该资产');
    if (asset.status !== 'available') {
      throw new CoolCommException('仅 available 资产允许发起领用');
    }
    await this.assertDepartmentInScope(payload.departmentId, perms, '无权操作该领用记录');
    const saved = await assignmentRepo.save(
      assignmentRepo.create({
        assetId: payload.assetId,
        assigneeId: payload.assigneeId,
        departmentId: payload.departmentId,
        assignDate: normalizeDate(payload.assignDate, 10) || nowTime().slice(0, 10),
        returnDate: normalizeDate(payload.actualReturnDate, 10),
        status: 'assigned',
        purpose: normalizeOptionalText(payload.purpose, 2000, '领用用途长度不能超过 2000'),
        returnNote: normalizeOptionalText(payload.returnRemark, 2000, '归还说明长度不能超过 2000'),
      })
    );
    await assetRepo.update(
      { id: payload.assetId },
      { status: 'assigned' }
    );
    return saved;
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

  private summarizeActionWindow(
    actions: Array<{
      occurredAt?: string | Date | null;
      assetId?: number | null;
      documentKey?: string | null;
    }>,
    startTime: string
  ) {
    const filtered = actions.filter(item => {
      const timestamp = normalizeDateTimeText(item.occurredAt);
      return Boolean(timestamp) && timestamp >= startTime;
    });

    return {
      actionCount: filtered.length,
      assetCount: uniqueNumberList(filtered.map(item => item.assetId)).length,
      documentCount: Array.from(
        new Set(filtered.map(item => String(item.documentKey || '').trim()).filter(Boolean))
      ).length,
    };
  }

  async assetDashboardSummary(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, PERMISSIONS.performance.assetDashboard.summary, '无权限查看资产首页');

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

    const today = new Date();
    const deadline = new Date(today.getTime() + 30 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const assignmentRows = (await this.performanceAssetAssignmentEntity.find()).filter(item =>
      assetMapForSummary.has(Number(item.assetId))
    );
    const maintenanceRows = (await this.performanceAssetMaintenanceEntity.find()).filter(item =>
      assetMapForSummary.has(Number(item.assetId))
    );
    const procurementRows = await this.scopeRows(
      await this.performanceAssetProcurementEntity.find(),
      perms,
      item => item.ownerDepartmentId
    );
    const transferRows = (await this.performanceAssetTransferEntity.find()).filter(item =>
      assetMapForSummary.has(Number(item.assetId))
    );
    const inventoryRows = await this.scopeRows(
      await this.performanceAssetInventoryEntity.find(),
      perms,
      item => item.ownerDepartmentId
    );
    const departmentMap = await this.departmentMap(
      uniqueNumberList([
        ...assets.map(item => item.ownerDepartmentId),
        ...disposalRows.map(item => item.ownerDepartmentId),
        ...assignmentRows.map(item => item.departmentId),
        ...maintenanceRows.map(item => item.departmentId),
        ...procurementRows.map(item => item.ownerDepartmentId),
        ...transferRows.map(item => item.fromDepartmentId),
        ...inventoryRows.map(item => item.ownerDepartmentId),
      ])
    );
    const userMap = await this.userMap(
      uniqueNumberList([
        ...assets.map(item => item.managerId),
        ...disposalRows.flatMap(item => [item.approvedById, item.executedById]),
        ...assignmentRows.map(item => item.assigneeId),
        ...procurementRows.map(item => item.managerId),
        ...transferRows.map(item => item.toManagerId),
      ])
    );

    const assetActions = assets.map(item => {
      const isNew = String(item.createTime || '') === String(item.updateTime || '');
      return {
        id: item.id,
        module: 'assetInfo',
        actionLabel: isNew ? '新增资产' : '台账维护',
        title: item.assetName || item.assetNo || `资产 #${item.id}`,
        objectNo: item.assetNo,
        objectName: item.assetName,
        status: item.status,
        resultStatus: item.status,
        assetId: item.id,
        departmentId: item.ownerDepartmentId,
        departmentName: departmentMap.get(Number(item.ownerDepartmentId))?.name || '',
        operatorName: userMap.get(Number(item.managerId || 0))?.name || '',
        occurredAt: item.updateTime || item.createTime || '',
        documentKey: null,
      };
    });
    const assignmentActions = assignmentRows.map(item => {
      const asset = assetMapForSummary.get(Number(item.assetId));
      const actionLabel =
        item.status === 'returned' ? '归还资产' : item.status === 'lost' ? '标记丢失' : '领用资产';
      return {
        id: item.id,
        module: 'assetAssignment',
        actionLabel,
        title: asset?.assetName || `领用归还 #${item.id}`,
        objectNo: asset?.assetNo || `ASSIGN-${item.id}`,
        objectName: asset?.assetName || '资产领用记录',
        status: item.status,
        resultStatus: item.status,
        assetId: item.assetId,
        departmentId: item.departmentId,
        departmentName: departmentMap.get(Number(item.departmentId))?.name || '',
        operatorName: userMap.get(Number(item.assigneeId || 0))?.name || '',
        occurredAt: item.returnDate || item.assignDate || item.updateTime || item.createTime || '',
        documentKey: `assetAssignment:${item.id}`,
      };
    });
    const maintenanceActions = maintenanceRows.map(item => {
      const asset = assetMapForSummary.get(Number(item.assetId));
      const actionLabel =
        item.status === 'completed'
          ? '完成维护'
          : item.status === 'cancelled'
            ? '取消维护'
            : item.status === 'inProgress'
              ? '开始维护'
              : '新增维护';
      return {
        id: item.id,
        module: 'assetMaintenance',
        actionLabel,
        title: asset?.assetName || `维护保养 #${item.id}`,
        objectNo: asset?.assetNo || `MAINT-${item.id}`,
        objectName: asset?.assetName || '资产维护记录',
        status: item.status,
        resultStatus: item.status,
        assetId: item.assetId,
        departmentId: item.departmentId,
        departmentName: departmentMap.get(Number(item.departmentId))?.name || '',
        operatorName: asset?.managerId ? userMap.get(Number(asset.managerId))?.name || '' : '',
        occurredAt:
          item.completedDate || item.startDate || item.updateTime || item.createTime || '',
        documentKey: `assetMaintenance:${item.id}`,
      };
    });
    const procurementActions = procurementRows
      .filter(item =>
        query?.category ? item.category === String(query.category).trim() : true
      )
      .map(item => {
      const actionLabel =
        item.status === 'received'
          ? '确认入库'
          : item.status === 'submitted'
            ? '提交入库'
            : item.status === 'cancelled'
              ? '取消入库'
              : '新增入库单';
      return {
        id: item.id,
        module: 'assetProcurement',
        actionLabel,
        title: item.title || item.procurementNo,
        objectNo: item.procurementNo,
        objectName: item.title || item.assetName,
        status: item.status,
        resultStatus: item.status,
        assetId:
          Array.isArray(item.receivedAssetIds) && item.receivedAssetIds.length
            ? Number(item.receivedAssetIds[0])
            : null,
        departmentId: item.ownerDepartmentId,
        departmentName: departmentMap.get(Number(item.ownerDepartmentId))?.name || '',
        operatorName: userMap.get(Number(item.managerId || 0))?.name || '',
        occurredAt:
          item.receivedAt || item.submittedAt || item.updateTime || item.createTime || '',
        documentKey: `assetProcurement:${item.id}`,
      };
      });
    const transferActions = transferRows.map(item => {
      const asset = assetMapForSummary.get(Number(item.assetId));
      const actionLabel =
        item.status === 'completed'
          ? '完成调拨'
          : item.status === 'submitted' || item.status === 'inTransit'
            ? '提交调拨'
            : item.status === 'cancelled'
              ? '取消调拨'
              : '新增调拨单';
      return {
        id: item.id,
        module: 'assetTransfer',
        actionLabel,
        title: item.transferNo,
        objectNo: item.transferNo,
        objectName: asset?.assetName || '资产调拨单',
        status: item.status,
        resultStatus: item.status,
        assetId: item.assetId,
        departmentId: item.fromDepartmentId,
        departmentName: departmentMap.get(Number(item.fromDepartmentId))?.name || '',
        operatorName: userMap.get(Number(item.toManagerId || 0))?.name || '',
        occurredAt:
          item.completedAt || item.submittedAt || item.updateTime || item.createTime || '',
        documentKey: `assetTransfer:${item.id}`,
      };
    });
    const inventoryActions = inventoryRows.map(item => {
      const asset = assetMapForSummary.get(Number(item.assetId));
      const actionLabel =
        item.status === 'closed'
          ? '关闭盘点'
          : item.status === 'completed'
            ? '完成盘点'
            : item.status === 'counting'
              ? '开始盘点'
              : '新增盘点单';
      return {
        id: item.id,
        module: 'assetInventory',
        actionLabel,
        title: item.inventoryNo,
        objectNo: item.inventoryNo,
        objectName: asset?.assetName || '资产盘点单',
        status: item.status,
        resultStatus: item.status,
        assetId: item.assetId,
        departmentId: item.ownerDepartmentId,
        departmentName: departmentMap.get(Number(item.ownerDepartmentId))?.name || '',
        operatorName: asset?.managerId ? userMap.get(Number(asset.managerId))?.name || '' : '',
        occurredAt:
          item.closedAt ||
          item.completedAt ||
          item.startedAt ||
          item.updateTime ||
          item.createTime ||
          '',
        documentKey: `assetInventory:${item.id}`,
      };
    });
    const disposalActions = disposalRows.map(item => {
      const asset = assetMapForSummary.get(Number(item.assetId));
      const actionLabel =
        item.status === 'scrapped'
          ? '执行报废'
          : item.status === 'approved'
            ? '审批报废'
            : item.status === 'submitted'
              ? '提交报废'
              : item.status === 'cancelled'
                ? '取消报废'
                : '新增报废单';
      const operatorId =
        item.status === 'scrapped'
          ? item.executedById
          : item.status === 'approved'
            ? item.approvedById
            : asset?.managerId || null;
      return {
        id: item.id,
        module: 'assetDisposal',
        actionLabel,
        title: item.disposalNo,
        objectNo: item.disposalNo,
        objectName: asset?.assetName || '资产报废单',
        status: item.status,
        resultStatus: item.status,
        assetId: item.assetId,
        departmentId: item.ownerDepartmentId,
        departmentName: departmentMap.get(Number(item.ownerDepartmentId))?.name || '',
        operatorName: userMap.get(Number(operatorId || 0))?.name || '',
        occurredAt:
          item.executedAt ||
          item.approvedAt ||
          item.submittedAt ||
          item.updateTime ||
          item.createTime ||
          '',
        documentKey: `assetDisposal:${item.id}`,
      };
    });
    const depreciationActions = depreciationRows
      .filter(item => item.recalculatedAt)
      .map(item => {
        const asset = assetMapForSummary.get(Number(item.assetId));
        return {
          id: item.id,
          module: 'assetDepreciation',
          actionLabel: '重算折旧',
          title: asset?.assetName || `折旧快照 #${item.id}`,
          objectNo: asset?.assetNo || item.periodValue,
          objectName: asset?.assetName || `${item.periodValue} 折旧`,
          status: item.periodValue,
          resultStatus: item.periodValue,
          assetId: item.assetId,
          departmentId: asset?.ownerDepartmentId || null,
          departmentName: departmentMap.get(Number(asset?.ownerDepartmentId || 0))?.name || '',
          operatorName: asset?.managerId ? userMap.get(Number(asset.managerId))?.name || '' : '',
          occurredAt: item.recalculatedAt || item.updateTime || item.createTime || '',
          documentKey: `assetDepreciation:${item.id}`,
        };
      });

    const activityTimeline = [
      ...assetActions,
      ...assignmentActions,
      ...maintenanceActions,
      ...procurementActions,
      ...transferActions,
      ...inventoryActions,
      ...disposalActions,
      ...depreciationActions,
    ]
      .map(item => ({
        ...item,
        occurredAt: normalizeDateTimeText(item.occurredAt),
      }))
      .filter(item => item.occurredAt)
      .sort((a, b) => String(b.occurredAt || '').localeCompare(String(a.occurredAt || '')));
    const recentActivities = activityTimeline.slice(0, 10);
    const actionOverview = {
      today: this.summarizeActionWindow(activityTimeline, startOfTodayValue(today)),
      thisWeek: this.summarizeActionWindow(activityTimeline, startOfWeekValue(today)),
      thisMonth: this.summarizeActionWindow(activityTimeline, startOfMonthValue(today)),
    };

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
      actionOverview,
      actionTimeline: recentActivities,
      recentActivities,
      updatedAt: nowTime(),
    };
  }

  async assetInfoPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, PERMISSIONS.performance.assetInfo.page, '无权限查看资产台账');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInfo.info, '无权限查看资产详情');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInfo.add, '无权限新增资产');
    const ownerDepartmentId = normalizeRequiredPositiveInt(
      payload.departmentId ?? payload.ownerDepartmentId,
      '所属部门不能为空'
    );
    await this.assertDepartmentInScope(ownerDepartmentId, perms, '无权操作该资产');

    const assetNo = normalizeRequiredText(payload.assetNo, 50, '资产编号不能为空且长度不能超过 50');
    const exists = await this.performanceAssetInfoEntity.findOneBy({ assetNo });
    if (exists) {
      throw new CoolCommException(PERFORMANCE_ASSET_NO_DUPLICATE_MESSAGE);
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
        supplierId: normalizeOptionalPositiveInt(
          payload.supplierId,
          PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE
        ),
        purchaseOrderId: normalizeOptionalPositiveInt(
          payload.purchaseOrderId,
          PERFORMANCE_PURCHASE_ORDER_NOT_FOUND_MESSAGE
        ),
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInfo.update, '无权限修改资产');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_NOT_FOUND_MESSAGE
    );
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
      throw new CoolCommException(PERFORMANCE_ASSET_NO_DUPLICATE_MESSAGE);
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
        supplierId: normalizeOptionalPositiveInt(
          payload.supplierId ?? asset.supplierId,
          PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE
        ),
        purchaseOrderId: normalizeOptionalPositiveInt(
          payload.purchaseOrderId ?? asset.purchaseOrderId,
          PERFORMANCE_PURCHASE_ORDER_NOT_FOUND_MESSAGE
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInfo.delete, '无权限删除资产');

    for (const rawId of ids) {
      const id = normalizeRequiredPositiveInt(
        rawId,
        PERFORMANCE_ASSET_NOT_FOUND_MESSAGE
      );
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInfo.updateStatus, '无权限更新资产状态');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_NOT_FOUND_MESSAGE
    );
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
    this.assertPerm(perms, PERMISSIONS.performance.assetAssignment.page, '无权限查看领用记录');
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

  async assetAssignmentRequestPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      PERMISSIONS.performance.assetAssignmentRequest.page,
      '无权限查看领用申请'
    );
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    let rows = await this.performanceAssetAssignmentRequestEntity.find();

    if (this.shouldApplicantSelfScopeRequest(perms)) {
      const userId = this.currentUserId();
      rows = rows.filter(item => Number(item.applicantId) === userId);
    } else {
      rows = await this.scopeRows(rows, perms, item => item.applicantDepartmentId);
    }

    if (query.status) {
      rows = rows.filter(item => item.status === String(query.status).trim());
    }
    if (query.requestLevel) {
      rows = rows.filter(item => item.requestLevel === String(query.requestLevel).trim());
    }
    if (query.requestType) {
      rows = rows.filter(item => item.requestType === String(query.requestType).trim());
    }
    if (query.pendingAssignmentOnly) {
      rows = rows.filter(item => item.status === 'approvedPendingAssignment');
    }

    const userIds = uniqueNumberList(
      rows.flatMap(item => [item.applicantId, item.currentApproverId, item.assignedBy])
    );
    const departmentIds = uniqueNumberList(
      rows.flatMap(item => [item.applicantDepartmentId, item.targetDepartmentId])
    );
    const assetIds = uniqueNumberList(rows.flatMap(item => [item.originalAssetId, item.assignedAssetId]));
    const assignmentIds = uniqueNumberList(rows.map(item => item.assignmentRecordId));
    const [users, departments, assets, assignments] = await Promise.all([
      this.userMap(userIds),
      this.departmentMap(departmentIds),
      assetIds.length
        ? this.performanceAssetInfoEntity.findBy(assetIds.map(id => ({ id })) as any)
        : Promise.resolve([] as any[]),
      assignmentIds.length
        ? this.performanceAssetAssignmentEntity.findBy(
            assignmentIds.map(id => ({ id })) as any
          )
        : Promise.resolve([] as any[]),
    ]);
    const assetMap = new Map(assets.map(item => [Number(item.id), item]));
    const assignmentMap = new Map(assignments.map(item => [Number(item.id), item]));
    const list = await Promise.all(
      rows
        .sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
        .map(item =>
          this.buildAssignmentRequestRow(item, {
            departments,
            users,
            assets: assetMap,
            assignments: assignmentMap,
          })
        )
    );
    return paginateList(list, page, size);
  }

  async assetAssignmentRequestInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      PERMISSIONS.performance.assetAssignmentRequest.info,
      '无权限查看领用申请详情'
    );
    const request = await this.requireAssignmentRequest(
      normalizeRequiredPositiveInt(id, PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE)
    );
    await this.assertAssignmentRequestAccess(request, perms, '无权查看该领用申请');
    const [users, departments, assets, assignments] = await Promise.all([
      this.userMap(
        uniqueNumberList([request.applicantId, request.currentApproverId, request.assignedBy])
      ),
      this.departmentMap(
        uniqueNumberList([request.applicantDepartmentId, request.targetDepartmentId])
      ),
      uniqueNumberList([request.originalAssetId, request.assignedAssetId]).length
        ? this.performanceAssetInfoEntity.findBy(
            uniqueNumberList([request.originalAssetId, request.assignedAssetId]).map(id => ({ id })) as any
          )
        : Promise.resolve([] as any[]),
      request.assignmentRecordId
        ? this.performanceAssetAssignmentEntity.findBy([{ id: request.assignmentRecordId }] as any)
        : Promise.resolve([] as any[]),
    ]);
    return this.buildAssignmentRequestRow(request, {
      departments,
      users,
      assets: new Map(assets.map(item => [Number(item.id), item])),
      assignments: new Map(assignments.map(item => [Number(item.id), item])),
    });
  }

  async assetAssignmentRequestAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      PERMISSIONS.performance.assetAssignmentRequest.add,
      '无权限新增领用申请'
    );
    const applicantId = this.currentUserId();
    const applicant = await this.baseSysUserEntity.findOneBy({ id: applicantId });
    const applicantDepartmentId = normalizeRequiredPositiveInt(
      applicant?.departmentId,
      PERFORMANCE_APPLICANT_DEPARTMENT_NOT_FOUND_MESSAGE
    );
    const requestType = this.normalizeAssignmentRequestType(payload.requestType || 'standard');
    const unitPriceEstimate = normalizeMoney(payload.unitPriceEstimate, 0);
    const rules = this.computeAssignmentRequestRules({
      requestType,
      assetCategory: normalizeRequiredText(payload.assetCategory, 100, '资产分类不能为空'),
      unitPriceEstimate,
    });
    const targetDepartmentId =
      requestType === 'crossDepartmentBorrow'
        ? normalizeRequiredPositiveInt(
            payload.targetDepartmentId,
            PERFORMANCE_TARGET_DEPARTMENT_REQUIRED_MESSAGE
          )
        : normalizeOptionalPositiveInt(payload.targetDepartmentId, '目标部门不合法');
    const saved = await this.performanceAssetAssignmentRequestEntity.save(
      this.performanceAssetAssignmentRequestEntity.create({
        requestNo: this.nextAssignmentRequestNo(),
        requestLevel: rules.requestLevel,
        requestType,
        applicantId,
        applicantDepartmentId,
        assetCategory: normalizeRequiredText(payload.assetCategory, 100, '资产分类不能为空'),
        assetModelRequest: normalizeOptionalText(payload.assetModelRequest, 200, '型号需求长度不能超过 200'),
        quantity: Math.max(1, normalizeRequiredPositiveInt(payload.quantity ?? 1, '数量不合法')),
        unitPriceEstimate,
        usageReason: normalizeOptionalText(payload.usageReason, 2000, '用途说明长度不能超过 2000'),
        expectedUseStartDate: normalizeDate(payload.expectedUseStartDate, 10),
        targetDepartmentId,
        exceptionReason:
          requestType === 'lostReplacement' ||
          requestType === 'abnormalReissue' ||
          requestType === 'scrapReplacement'
            ? normalizeRequiredText(payload.exceptionReason, 2000, '异常原因不能为空')
            : normalizeOptionalText(payload.exceptionReason, 2000, '异常原因长度不能超过 2000'),
        originalAssetId: normalizeOptionalPositiveInt(
          payload.originalAssetId,
          PERFORMANCE_ORIGINAL_ASSET_NOT_FOUND_MESSAGE
        ),
        originalAssignmentId: normalizeOptionalPositiveInt(
          payload.originalAssignmentId,
          PERFORMANCE_ORIGINAL_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE
        ),
        approvalInstanceId: null,
        approvalStatus: null,
        currentApproverId: null,
        approvalTriggeredRules: JSON.stringify(rules.rules),
        assignedAssetId: null,
        assignmentRecordId: null,
        assignedBy: null,
        assignedAt: null,
        status: 'draft',
        submitTime: null,
        withdrawTime: null,
        cancelReason: null,
      })
    );
    return this.assetAssignmentRequestInfo(Number(saved.id));
  }

  async assetAssignmentRequestUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      PERMISSIONS.performance.assetAssignmentRequest.update,
      '无权限编辑领用申请'
    );
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE
    );
    const current = await this.requireAssignmentRequest(id);
    if (Number(current.applicantId) !== this.currentUserId()) {
      throw new CoolCommException('仅允许申请人编辑草稿');
    }
    if (current.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_EDIT_ONLY_MESSAGE);
    }
    const requestType = this.normalizeAssignmentRequestType(payload.requestType ?? current.requestType);
    const assetCategory = normalizeRequiredText(
      payload.assetCategory ?? current.assetCategory,
      100,
      '资产分类不能为空'
    );
    const unitPriceEstimate = normalizeMoney(
      payload.unitPriceEstimate ?? current.unitPriceEstimate,
      0
    );
    const rules = this.computeAssignmentRequestRules({
      requestType,
      assetCategory,
      unitPriceEstimate,
    });
    await this.performanceAssetAssignmentRequestEntity.update(
      { id },
      {
        requestLevel: rules.requestLevel,
        requestType,
        assetCategory,
        assetModelRequest: normalizeOptionalText(
          payload.assetModelRequest ?? current.assetModelRequest,
          200,
          '型号需求长度不能超过 200'
        ),
        quantity: Math.max(
          1,
          normalizeRequiredPositiveInt(payload.quantity ?? current.quantity, '数量不合法')
        ),
        unitPriceEstimate,
        usageReason: normalizeOptionalText(
          payload.usageReason ?? current.usageReason,
          2000,
          '用途说明长度不能超过 2000'
        ),
        expectedUseStartDate: normalizeDate(
          payload.expectedUseStartDate ?? current.expectedUseStartDate,
          10
        ),
        targetDepartmentId:
          requestType === 'crossDepartmentBorrow'
            ? normalizeRequiredPositiveInt(
                payload.targetDepartmentId ?? current.targetDepartmentId,
                PERFORMANCE_TARGET_DEPARTMENT_REQUIRED_MESSAGE
              )
            : normalizeOptionalPositiveInt(
                payload.targetDepartmentId ?? current.targetDepartmentId,
                '目标部门不合法'
              ),
        exceptionReason:
          requestType === 'lostReplacement' ||
          requestType === 'abnormalReissue' ||
          requestType === 'scrapReplacement'
            ? normalizeRequiredText(
                payload.exceptionReason ?? current.exceptionReason,
                2000,
                '异常原因不能为空'
              )
            : normalizeOptionalText(
                payload.exceptionReason ?? current.exceptionReason,
                2000,
                '异常原因长度不能超过 2000'
              ),
        originalAssetId: normalizeOptionalPositiveInt(
          payload.originalAssetId ?? current.originalAssetId,
          PERFORMANCE_ORIGINAL_ASSET_NOT_FOUND_MESSAGE
        ),
        originalAssignmentId: normalizeOptionalPositiveInt(
          payload.originalAssignmentId ?? current.originalAssignmentId,
          PERFORMANCE_ORIGINAL_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE
        ),
        approvalTriggeredRules: JSON.stringify(rules.rules),
      }
    );
    return this.assetAssignmentRequestInfo(id);
  }

  async assetAssignmentRequestSubmit(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      PERMISSIONS.performance.assetAssignmentRequest.submit,
      '无权限提交领用申请'
    );
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE
    );
    await this.performanceAssetAssignmentRequestEntity.manager.transaction(async manager => {
      const repo = manager.getRepository(PerformanceAssetAssignmentRequestEntity);
      const current = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      } as any);
      if (!current) {
        throw new CoolCommException(PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE);
      }
      if (Number(current.applicantId) !== this.currentUserId()) {
        throw new CoolCommException('仅允许申请人提交');
      }
      if (current.status !== 'draft') {
        throw new CoolCommException(PERFORMANCE_STATE_DRAFT_SUBMIT_ONLY_MESSAGE);
      }
      await repo.update(
        { id },
        {
          status: 'inApproval',
          approvalStatus: 'launching',
          submitTime: nowTime(),
          cancelReason: null,
          withdrawTime: null,
        }
      );
      const instance = await this.performanceApprovalFlowService.launchForObject(
        {
          objectType: 'assetAssignmentRequest',
          objectId: id,
          applicantId: Number(current.applicantId),
          employeeId: Number(current.applicantId),
          departmentId: Number(current.applicantDepartmentId),
          tenantId: current.tenantId ?? null,
        },
        manager
      );
      await repo.update(
        { id },
        {
          approvalInstanceId: Number(instance.id),
          approvalStatus: String(instance.status || ''),
          currentApproverId: instance.currentApproverId
            ? Number(instance.currentApproverId)
            : null,
        }
      );
    });
    return this.assetAssignmentRequestInfo(id);
  }

  async assetAssignmentRequestWithdraw(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      PERMISSIONS.performance.assetAssignmentRequest.withdraw,
      '无权限撤回领用申请'
    );
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE
    );
    const current = await this.requireAssignmentRequest(id);
    if (Number(current.applicantId) !== this.currentUserId()) {
      throw new CoolCommException('仅允许申请人撤回');
    }
    if (!current.approvalInstanceId) {
      throw new CoolCommException('当前申请不存在审批实例');
    }
    await this.performanceApprovalFlowService.withdraw({
      instanceId: Number(current.approvalInstanceId),
      reason: normalizeOptionalText(payload.reason, 500, '撤回原因长度不能超过 500'),
    });
    return this.assetAssignmentRequestInfo(id);
  }

  async assetAssignmentRequestAssign(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      PERMISSIONS.performance.assetAssignmentRequest.assign,
      '无权限配发资产'
    );
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE
    );
    const assetId = normalizeRequiredPositiveInt(
      payload.assetId,
      PERFORMANCE_ASSET_NOT_FOUND_MESSAGE
    );
    await this.performanceAssetAssignmentRequestEntity.manager.transaction(async manager => {
      const requestRepo = manager.getRepository(PerformanceAssetAssignmentRequestEntity);
      const request = await requestRepo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      } as any);
      if (!request) {
        throw new CoolCommException(PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE);
      }
      await this.assertDepartmentInScope(
        request.applicantDepartmentId,
        perms,
        '无权操作该领用申请'
      );
      if (request.status !== 'approvedPendingAssignment') {
        throw new CoolCommException('当前状态不允许配发');
      }
      await requestRepo.update({ id }, { status: 'issuing' });
      const assignment = await this.executeAssetAssignmentCreate(
        {
          assetId,
          assigneeId: Number(request.applicantId),
          departmentId: Number(request.targetDepartmentId || request.applicantDepartmentId),
          assignDate: payload.assignDate,
          purpose: payload.purpose ?? request.usageReason,
        },
        perms,
        manager
      );
      await requestRepo.update(
        { id },
        {
          status: 'issued',
          assignedAssetId: assetId,
          assignmentRecordId: Number(assignment.id),
          assignedBy: this.currentUserId(),
          assignedAt: nowTime(),
        }
      );
    });
    return this.assetAssignmentRequestInfo(id);
  }

  async assetAssignmentRequestCancel(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      PERMISSIONS.performance.assetAssignmentRequest.cancel,
      '无权限取消领用申请'
    );
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE
    );
    const current = await this.requireAssignmentRequest(id);
    const reason = normalizeOptionalText(payload.reason, 500, '取消原因长度不能超过 500');
    if (current.approvalInstanceId && ['inApproval', 'manualPending'].includes(current.status)) {
      await this.performanceApprovalFlowService.terminate({
        instanceId: Number(current.approvalInstanceId),
        reason: reason || 'HR 取消领用申请',
      });
      return this.assetAssignmentRequestInfo(id);
    }
    if (current.status === 'issued') {
      throw new CoolCommException('已发放的申请单不允许取消');
    }
    await this.performanceAssetAssignmentRequestEntity.update(
      { id },
      {
        status: 'cancelled',
        approvalStatus: 'terminated',
        currentApproverId: null,
        cancelReason: reason || 'HR 取消领用申请',
      }
    );
    return this.assetAssignmentRequestInfo(id);
  }

  async assetAssignmentAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, PERMISSIONS.performance.assetAssignment.add, '无权限新增领用记录');
    const assetId = normalizeRequiredPositiveInt(
      payload.assetId,
      PERFORMANCE_ASSET_NOT_FOUND_MESSAGE
    );
    const asset = await this.loadAsset(assetId);
    const departmentId = normalizeRequiredPositiveInt(
      payload.departmentId ?? asset.ownerDepartmentId,
      '领用部门不能为空'
    );
    this.assertDirectAssignmentEligible(asset, departmentId);
    return this.executeAssetAssignmentCreate(
      {
        assetId,
        assigneeId: normalizeRequiredPositiveInt(payload.assigneeId, '领用人不能为空'),
        departmentId,
        assignDate: payload.assignDate,
        actualReturnDate: payload.actualReturnDate,
        purpose: payload.purpose,
        returnRemark: payload.returnRemark,
      },
      perms
    );
  }

  async assetAssignmentUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, PERMISSIONS.performance.assetAssignment.update, '无权限编辑领用记录');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetAssignmentEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetAssignment.return, '无权限归还资产');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetAssignmentEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetAssignment.markLost, '无权限标记丢失');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetAssignmentEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetAssignment.delete, '无权限删除领用记录');
    for (const rawId of ids) {
      const id = normalizeRequiredPositiveInt(
        rawId,
        PERFORMANCE_ASSIGNMENT_RECORD_NOT_FOUND_MESSAGE
      );
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
    this.assertPerm(perms, PERMISSIONS.performance.assetMaintenance.page, '无权限查看维护记录');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetMaintenance.add, '无权限新增维护记录');
    const assetId = normalizeRequiredPositiveInt(
      payload.assetId,
      PERFORMANCE_ASSET_NOT_FOUND_MESSAGE
    );
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
    this.assertPerm(perms, PERMISSIONS.performance.assetMaintenance.update, '无权限编辑维护记录');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_MAINTENANCE_RECORD_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetMaintenanceEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_MAINTENANCE_RECORD_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.departmentId, perms, '无权操作该维护记录');
    if (!['scheduled', 'inProgress'].includes(current.status)) {
      throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetMaintenance.complete, '无权限完成维护');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_MAINTENANCE_RECORD_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetMaintenanceEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_MAINTENANCE_RECORD_NOT_FOUND_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetMaintenance.cancel, '无权限取消维护');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_MAINTENANCE_RECORD_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetMaintenanceEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_MAINTENANCE_RECORD_NOT_FOUND_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetMaintenance.delete, '无权限删除维护记录');
    for (const rawId of ids) {
      const id = normalizeRequiredPositiveInt(
        rawId,
        PERFORMANCE_MAINTENANCE_RECORD_NOT_FOUND_MESSAGE
      );
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
    this.assertPerm(perms, PERMISSIONS.performance.assetProcurement.page, '无权限查看采购入库单');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetProcurement.info, '无权限查看采购入库详情');
    const item = await this.performanceAssetProcurementEntity.findOneBy({ id: Number(id) });
    if (!item) {
      throw new CoolCommException(PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(item.ownerDepartmentId, perms, '无权查看该采购入库单');
    const page = await this.assetProcurementPage({ page: 1, size: 9999 });
    return page.list.find(row => Number(row.id) === Number(id));
  }

  async assetProcurementAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, PERMISSIONS.performance.assetProcurement.add, '无权限新增采购入库单');
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
        purchaseOrderId: normalizeOptionalPositiveInt(
          payload.purchaseOrderId,
          PERFORMANCE_PURCHASE_ORDER_NOT_FOUND_MESSAGE
        ),
        supplierId: normalizeOptionalPositiveInt(
          payload.supplierId,
          PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE
        ),
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
    this.assertPerm(perms, PERMISSIONS.performance.assetProcurement.update, '无权限编辑采购入库单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetProcurementEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该采购入库单');
    if (current.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_EDIT_ONLY_MESSAGE);
    }
    await this.performanceAssetProcurementEntity.update(
      { id },
      {
        title: normalizeRequiredText(payload.title ?? current.title, 200, '标题不能为空且长度不能超过 200'),
        purchaseOrderId: normalizeOptionalPositiveInt(
          payload.purchaseOrderId ?? current.purchaseOrderId,
          PERFORMANCE_PURCHASE_ORDER_NOT_FOUND_MESSAGE
        ),
        supplierId: normalizeOptionalPositiveInt(
          payload.supplierId ?? current.supplierId,
          PERFORMANCE_SUPPLIER_NOT_FOUND_MESSAGE
        ),
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
    this.assertPerm(perms, PERMISSIONS.performance.assetProcurement.submit, '无权限提交采购入库单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetProcurementEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该采购入库单');
    if (current.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_SUBMIT_ONLY_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetProcurement.receive, '无权限确认入库');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetProcurementEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该采购入库单');
    if (current.status !== 'submitted') {
      throw new CoolCommException(PERFORMANCE_STATE_SUBMITTED_RECEIVE_ONLY_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetProcurement.cancel, '无权限取消采购入库单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetProcurementEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_PROCUREMENT_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该采购入库单');
    if (!['draft', 'submitted'].includes(current.status)) {
      throw new CoolCommException(PERFORMANCE_STATE_CANCEL_NOT_ALLOWED_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetTransfer.page, '无权限查看资产调拨');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetTransfer.info, '无权限查看资产调拨详情');
    const list = await this.assetTransferPage({ page: 1, size: 9999 });
    const row = list.list.find(item => Number(item.id) === Number(id));
    if (!row) {
      throw new CoolCommException(PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE);
    }
    return row;
  }

  async assetTransferAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, PERMISSIONS.performance.assetTransfer.add, '无权限新增调拨单');
    const assetId = normalizeRequiredPositiveInt(
      payload.assetId,
      PERFORMANCE_ASSET_NOT_FOUND_MESSAGE
    );
    const asset = await this.loadAsset(assetId);
    await this.assertDepartmentInScope(asset.ownerDepartmentId, perms, '无权操作该调拨单');
    if (asset.status !== 'available') {
      throw new CoolCommException('仅 available 资产允许发起调拨');
    }
    const toDepartmentId = normalizeRequiredPositiveInt(
      payload.toDepartmentId,
      PERFORMANCE_TARGET_DEPARTMENT_REQUIRED_MESSAGE
    );
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
    this.assertPerm(perms, PERMISSIONS.performance.assetTransfer.update, '无权限编辑调拨单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetTransferEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.fromDepartmentId, perms, '无权操作该调拨单');
    if (current.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_EDIT_ONLY_MESSAGE);
    }
    await this.performanceAssetTransferEntity.update(
      { id },
      {
        toDepartmentId: normalizeRequiredPositiveInt(
          payload.toDepartmentId ?? current.toDepartmentId,
          PERFORMANCE_TARGET_DEPARTMENT_REQUIRED_MESSAGE
        ),
        toManagerId: normalizeOptionalPositiveInt(payload.applicantId ?? payload.toManagerId ?? current.toManagerId, '目标管理人不合法'),
        toLocation: normalizeOptionalText(payload.toLocation ?? current.toLocation, 200, '目标位置长度不能超过 200'),
        reason: normalizeOptionalText(payload.remark ?? payload.reason ?? current.reason, 2000, '调拨原因长度不能超过 2000'),
      }
    );
    return this.assetTransferInfo(id);
  }

  async assetTransferSubmit(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, PERMISSIONS.performance.assetTransfer.submit, '无权限提交调拨单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetTransferEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.fromDepartmentId, perms, '无权操作该调拨单');
    if (current.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_SUBMIT_ONLY_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetTransfer.complete, '无权限完成调拨');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetTransferEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetTransfer.cancel, '无权限取消调拨单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetTransferEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_TRANSFER_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.fromDepartmentId, perms, '无权操作该调拨单');
    if (!['draft', 'submitted', 'inTransit'].includes(current.status)) {
      throw new CoolCommException(PERFORMANCE_STATE_CANCEL_NOT_ALLOWED_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInventory.page, '无权限查看资产盘点');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInventory.info, '无权限查看盘点详情');
    const list = await this.assetInventoryPage({ page: 1, size: 9999 });
    const row = list.list.find(item => Number(item.id) === Number(id));
    if (!row) {
      throw new CoolCommException(PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE);
    }
    return row;
  }

  async assetInventoryAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, PERMISSIONS.performance.assetInventory.add, '无权限新增盘点单');
    const assetId = normalizeRequiredPositiveInt(
      payload.assetId,
      PERFORMANCE_ASSET_NOT_FOUND_MESSAGE
    );
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInventory.update, '无权限编辑盘点单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetInventoryEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该盘点单');
    if (current.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_EDIT_ONLY_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInventory.start, '无权限开始盘点');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetInventoryEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInventory.complete, '无权限完成盘点');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetInventoryEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetInventory.close, '无权限关闭盘点');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetInventoryEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_INVENTORY_NOT_FOUND_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDepreciation.page, '无权限查看折旧列表');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDepreciation.summary, '无权限查看折旧汇总');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDepreciation.recalculate, '无权限重算折旧');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDisposal.page, '无权限查看报废单');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDisposal.info, '无权限查看报废详情');
    const list = await this.assetDisposalPage({ page: 1, size: 9999 });
    const row = list.list.find(item => Number(item.id) === Number(id));
    if (!row) {
      throw new CoolCommException(PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE);
    }
    return row;
  }

  async assetDisposalAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, PERMISSIONS.performance.assetDisposal.add, '无权限新增报废单');
    const assetId = normalizeRequiredPositiveInt(
      payload.assetId,
      PERFORMANCE_ASSET_NOT_FOUND_MESSAGE
    );
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDisposal.update, '无权限编辑报废单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (current.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_EDIT_ONLY_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDisposal.submit, '无权限提交报废单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (current.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_DRAFT_SUBMIT_ONLY_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDisposal.approve, '无权限审批报废单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (current.status !== 'submitted') {
      throw new CoolCommException(PERFORMANCE_STATE_SUBMITTED_APPROVE_ONLY_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDisposal.execute, '无权限执行报废');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (current.status !== 'approved') {
      throw new CoolCommException(PERFORMANCE_STATE_APPROVED_EXECUTE_ONLY_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetDisposal.cancel, '无权限取消报废单');
    const id = normalizeRequiredPositiveInt(
      payload.id,
      PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE
    );
    const current = await this.performanceAssetDisposalEntity.findOneBy({ id });
    if (!current) {
      throw new CoolCommException(PERFORMANCE_ASSET_DISPOSAL_NOT_FOUND_MESSAGE);
    }
    await this.assertDepartmentInScope(current.ownerDepartmentId, perms, '无权操作该报废单');
    if (!['draft', 'submitted', 'approved'].includes(current.status)) {
      throw new CoolCommException(PERFORMANCE_STATE_CANCEL_NOT_ALLOWED_MESSAGE);
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
    this.assertPerm(perms, PERMISSIONS.performance.assetReport.summary, '无权限查看资产报表汇总');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetReport.page, '无权限查看资产报表');
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
    this.assertPerm(perms, PERMISSIONS.performance.assetReport.export, '无权限导出资产报表');
    const page = await this.assetReportPage({ ...query, page: 1, size: 10000 });
    return page.list;
  }
}
