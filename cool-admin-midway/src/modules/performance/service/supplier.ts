/**
 * 供应商领域服务。
 * 这里只负责主题11冻结的 `supplier page/info/add/update/delete` 最小主链，不负责评级、资质、合同管理、结算中心或外部系统集成。
 * 维护重点是经理只读、敏感字段脱敏和“inactive 且无关联未结束采购订单”删除约束必须由服务端兜底。
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
import { Brackets, In, Not, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformancePurchaseOrderEntity } from '../entity/purchase-order';
import { PerformanceSupplierEntity } from '../entity/supplier';

type SupplierStatus = 'active' | 'inactive';

const SUPPLIER_STATUS: SupplierStatus[] = ['active', 'inactive'];

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

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceSupplierService extends BaseService {
  @InjectEntityModel(PerformanceSupplierEntity)
  performanceSupplierEntity: Repository<PerformanceSupplierEntity>;

  @InjectEntityModel(PerformancePurchaseOrderEntity)
  performancePurchaseOrderEntity: Repository<PerformancePurchaseOrderEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:supplier:page',
    info: 'performance:supplier:info',
    add: 'performance:supplier:add',
    update: 'performance:supplier:update',
    delete: 'performance:supplier:delete',
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
    this.assertPerm(perms, this.perms.page, '无权限查看供应商列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const qb = this.performanceSupplierEntity
      .createQueryBuilder('supplier')
      .select([
        'supplier.id as id',
        'supplier.name as name',
        'supplier.code as code',
        'supplier.category as category',
        'supplier.contactName as contactName',
        'supplier.contactPhone as contactPhone',
        'supplier.contactEmail as contactEmail',
        'supplier.bankAccount as bankAccount',
        'supplier.taxNo as taxNo',
        'supplier.remark as remark',
        'supplier.status as status',
        'supplier.createTime as createTime',
        'supplier.updateTime as updateTime',
      ]);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('supplier.name like :keyword', { keyword })
            .orWhere('supplier.code like :keyword', { keyword });
        })
      );
    }

    if (query.category) {
      qb.andWhere('supplier.category = :category', {
        category: String(query.category).trim(),
      });
    }

    if (query.status) {
      qb.andWhere('supplier.status = :status', {
        status: this.normalizeStatus(query.status),
      });
    }

    qb.orderBy('supplier.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeSupplierRow(item, this.isHr(perms))),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看供应商详情');

    const supplier = await this.requireSupplier(id);
    return this.normalizeSupplierRow(supplier, this.isHr(perms));
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增供应商');

    const normalized = await this.normalizePayload(payload, null, 'add');
    const saved = await this.performanceSupplierEntity.save(
      this.performanceSupplierEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateSupplier(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改供应商');

    const supplier = await this.requireSupplier(
      Number(payload.id || 0)
    );
    const normalized = await this.normalizePayload(payload, supplier, 'update');

    await this.performanceSupplierEntity.update({ id: supplier.id }, normalized);
    return this.info(supplier.id);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.delete, '无权限删除供应商');

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

    const rows = await this.performanceSupplierEntity.findBy({
      id: In(validIds),
    });

    if (rows.length !== validIds.length) {
      throw new CoolCommException('数据不存在');
    }

    rows.forEach(item => {
      if (item.status !== 'inactive') {
        throw new CoolCommException('当前状态不允许删除');
      }
    });

    // 删除保护按终态排除，兼容历史联调样例中的 legacy active 状态。
    const activeOrders = await this.performancePurchaseOrderEntity.findBy({
      supplierId: In(validIds as number[]),
      status: Not(In(['closed', 'cancelled'])) as any,
    });

    if (activeOrders.length) {
      throw new CoolCommException('供应商存在有效采购订单，不允许删除');
    }

    await this.performanceSupplierEntity.delete(validIds);
  }

  private async normalizePayload(
    payload: any,
    existing: PerformanceSupplierEntity | null,
    mode: 'add' | 'update'
  ) {
    const name = normalizeRequiredText(
      payload.name ?? existing?.name,
      100,
      '供应商名称不能为空'
    );
    const code = normalizeOptionalText(
      payload.code ?? existing?.code,
      100,
      '供应商编码长度不合法'
    );
    const category = normalizeOptionalText(
      payload.category ?? existing?.category,
      100,
      '供应商分类长度不合法'
    );
    const contactName = normalizeOptionalText(
      payload.contactName ?? existing?.contactName,
      100,
      '联系人姓名长度不合法'
    );
    const contactPhone = normalizeOptionalText(
      payload.contactPhone ?? existing?.contactPhone,
      20,
      '联系电话长度不合法'
    );
    const contactEmail = normalizeOptionalText(
      payload.contactEmail ?? existing?.contactEmail,
      100,
      '联系邮箱长度不合法'
    );
    const bankAccount = normalizeOptionalText(
      payload.bankAccount ?? existing?.bankAccount,
      100,
      '银行账户长度不合法'
    );
    const taxNo = normalizeOptionalText(
      payload.taxNo ?? existing?.taxNo,
      100,
      '税号长度不合法'
    );
    const remark = normalizeOptionalText(
      payload.remark ?? existing?.remark,
      2000,
      '备注长度不合法'
    );
    const status = this.resolveNextStatus(
      mode,
      existing?.status as SupplierStatus | undefined,
      payload.status
    );

    await this.assertCodeUnique(code, existing?.id);

    return {
      name,
      code,
      category,
      contactName,
      contactPhone,
      contactEmail,
      bankAccount,
      taxNo,
      remark,
      status,
    };
  }

  private resolveNextStatus(
    mode: 'add' | 'update',
    currentStatus: SupplierStatus | undefined,
    nextStatusInput: any
  ) {
    const nextStatus = this.normalizeStatus(nextStatusInput || currentStatus || 'active');

    if (mode === 'add') {
      if (nextStatus !== 'active') {
        throw new CoolCommException('新增供应商状态只能为 active');
      }
      return nextStatus;
    }

    if (currentStatus === 'active' && ['active', 'inactive'].includes(nextStatus)) {
      return nextStatus;
    }

    if (currentStatus === 'inactive' && ['inactive', 'active'].includes(nextStatus)) {
      return nextStatus;
    }

    if (currentStatus === nextStatus) {
      return nextStatus;
    }

    throw new CoolCommException('当前状态不允许执行该操作');
  }

  private normalizeStatus(value: any) {
    const status = String(value || 'active').trim() as SupplierStatus;

    if (!SUPPLIER_STATUS.includes(status)) {
      throw new CoolCommException('供应商状态不合法');
    }

    return status;
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
      this.hasPerm(perms, this.perms.add) ||
      this.hasPerm(perms, this.perms.update) ||
      this.hasPerm(perms, this.perms.delete)
    );
  }

  private async assertCodeUnique(code?: string | null, excludeId?: number) {
    if (!code) {
      return;
    }

    const exists = await this.performanceSupplierEntity.findOneBy({ code });

    if (exists && Number(exists.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('供应商编码已存在');
    }
  }

  private async requireSupplier(id: number) {
    const supplier = await this.performanceSupplierEntity.findOneBy({ id });

    if (!supplier) {
      throw new CoolCommException('数据不存在');
    }

    return supplier;
  }

  private normalizeSupplierRow(item: any, canViewSensitive: boolean) {
    return {
      id: Number(item.id),
      name: item.name || '',
      code: item.code || null,
      category: item.category || null,
      contactName: this.normalizeContactName(item.contactName, canViewSensitive),
      contactPhone: this.normalizeContactPhone(item.contactPhone, canViewSensitive),
      contactEmail: this.normalizeContactEmail(item.contactEmail, canViewSensitive),
      bankAccount: this.normalizeBankAccount(item.bankAccount, canViewSensitive),
      taxNo: this.normalizeTaxNo(item.taxNo, canViewSensitive),
      remark: item.remark || null,
      status: item.status || 'active',
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private normalizeBankAccount(value: any, canViewSensitive: boolean) {
    const text = value ? String(value) : null;

    if (!text) {
      return null;
    }

    if (canViewSensitive || text.length <= 4) {
      return text;
    }

    return `${'*'.repeat(text.length - 4)}${text.slice(-4)}`;
  }

  private normalizeTaxNo(value: any, canViewSensitive: boolean) {
    const text = value ? String(value) : null;

    if (!text) {
      return null;
    }

    if (canViewSensitive || text.length <= 4) {
      return text;
    }

    return `${text.slice(0, 2)}${'*'.repeat(text.length - 4)}${text.slice(-2)}`;
  }

  private normalizeContactName(value: any, canViewSensitive: boolean) {
    const text = value ? String(value) : null;

    if (!text) {
      return null;
    }

    if (canViewSensitive || text.length <= 1) {
      return text;
    }

    return `${text.slice(0, 1)}${'*'.repeat(text.length - 1)}`;
  }

  private normalizeContactPhone(value: any, canViewSensitive: boolean) {
    const text = value ? String(value) : null;

    if (!text) {
      return null;
    }

    if (canViewSensitive || text.length <= 7) {
      return text;
    }

    return `${text.slice(0, 3)}${'*'.repeat(text.length - 7)}${text.slice(-4)}`;
  }

  private normalizeContactEmail(value: any, canViewSensitive: boolean) {
    const text = value ? String(value) : null;

    if (!text) {
      return null;
    }

    if (canViewSensitive) {
      return text;
    }

    const [user, domain] = text.split('@');

    if (!domain) {
      return `${text.slice(0, 1)}***`;
    }

    return `${user.slice(0, 1)}***@${domain}`;
  }
}
