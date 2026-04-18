/**
 * 主题13证书台账领域服务。
 * 这里负责证书列表/详情/维护、发放和发放记录分页，不负责课程结业判断、证书附件流或自动生成证书。
 * 维护重点是证书台账经理只读、记录分页按部门树范围收口，且 `sourceCourseId` 只做可空引用不强制校验课程结业。
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
import { PerformanceCertificateEntity } from '../entity/certificate';
import { PerformanceCertificateRecordEntity } from '../entity/certificate-record';
import {
  assertCertificateTransition,
  normalizeCertificatePayload,
  normalizeIssuePayload,
} from './certificate-helper';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

const normalizePagination = (value: any, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceCertificateService extends BaseService {
  @InjectEntityModel(PerformanceCertificateEntity)
  performanceCertificateEntity: Repository<PerformanceCertificateEntity>;

  @InjectEntityModel(PerformanceCertificateRecordEntity)
  performanceCertificateRecordEntity: Repository<PerformanceCertificateRecordEntity>;

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
    page: 'performance:certificate:page',
    info: 'performance:certificate:info',
    add: 'performance:certificate:add',
    update: 'performance:certificate:update',
    issue: 'performance:certificate:issue',
    recordPage: 'performance:certificate:recordPage',
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
    this.assertPerm(perms, this.perms.page, '无权限查看证书列表');

    const page = normalizePagination(query.page, 1);
    const size = normalizePagination(query.size, 20);
    const qb = this.performanceCertificateEntity
      .createQueryBuilder('certificate')
      .select([
        'certificate.id as id',
        'certificate.name as name',
        'certificate.code as code',
        'certificate.category as category',
        'certificate.issuer as issuer',
        'certificate.description as description',
        'certificate.validityMonths as validityMonths',
        'certificate.sourceCourseId as sourceCourseId',
        'certificate.status as status',
        'certificate.createTime as createTime',
        'certificate.updateTime as updateTime',
      ]);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('certificate.name like :keyword', { keyword })
            .orWhere('certificate.code like :keyword', { keyword });
        })
      );
    }

    if (query.category) {
      qb.andWhere('certificate.category = :category', {
        category: String(query.category).trim(),
      });
    }

    if (query.status) {
      qb.andWhere('certificate.status = :status', {
        status: String(query.status).trim(),
      });
    }

    qb.orderBy('certificate.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();
    const issuedCountMap = await this.loadIssuedCountMap(
      list.map(item => Number(item.id))
    );

    return {
      list: list.map(item => this.normalizeCertificateRow(item, issuedCountMap)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看证书详情');

    const certificate = await this.requireCertificate(id);
    const countMap = await this.loadIssuedCountMap([certificate.id]);
    return this.normalizeCertificateRow(certificate, countMap);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增证书');

    const normalized = normalizeCertificatePayload(payload);
    assertCertificateTransition(undefined, normalized.status, 'add');
    await this.assertCertificateCodeUnique(normalized.code);

    const saved = await this.performanceCertificateEntity.save(
      this.performanceCertificateEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateCertificate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改证书');

    const certificate = await this.requireCertificate(Number(payload.id || 0));
    const normalized = normalizeCertificatePayload({
      ...certificate,
      ...payload,
    });
    assertCertificateTransition(certificate.status as any, normalized.status, 'update');
    await this.assertCertificateCodeUnique(normalized.code, certificate.id);

    await this.performanceCertificateEntity.update(
      { id: certificate.id },
      normalized
    );
    return this.info(certificate.id);
  }

  async issue(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.issue, '无权限发放证书');

    const normalized = normalizeIssuePayload(payload);
    const certificate = await this.requireCertificate(normalized.certificateId);

    if (certificate.status !== 'active') {
      throw new CoolCommException('当前状态不允许发放证书');
    }

    const employee = await this.baseSysUserEntity.findOneBy({
      id: normalized.employeeId,
    });

    if (!employee) {
      throw new CoolCommException('员工不存在');
    }

    const departmentId = Number(employee.departmentId || 0) || null;
    const department = departmentId
      ? await this.baseSysDepartmentEntity.findOneBy({ id: departmentId })
      : null;
    const adminName =
      this.currentAdmin?.name ||
      this.currentAdmin?.nickName ||
      this.currentAdmin?.username ||
      'system';
    const saved = await this.performanceCertificateRecordEntity.save(
      this.performanceCertificateRecordEntity.create({
        certificateId: normalized.certificateId,
        employeeId: normalized.employeeId,
        departmentId,
        sourceCourseId: normalized.sourceCourseId,
        issuedAt: normalized.issuedAt,
        issuedById: Number(this.currentAdmin?.userId || 0),
        issuedBy: String(adminName),
        remark: normalized.remark,
        status: 'issued',
      })
    );

    return this.normalizeRecordRow(
      {
        ...saved,
        certificateName: certificate.name,
        employeeName: employee.name,
        departmentName: department?.name || null,
      },
      certificate.name,
      employee.name,
      department?.name || null
    );
  }

  async recordPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.recordPage, '无权限查看证书记录列表');

    const page = normalizePagination(query.page, 1);
    const size = normalizePagination(query.size, 20);
    const departmentScopeIds = await this.departmentScopeIds(perms);
    const qb = this.performanceCertificateRecordEntity
      .createQueryBuilder('record')
      .leftJoin(
        PerformanceCertificateEntity,
        'certificate',
        'certificate.id = record.certificateId'
      )
      .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = record.employeeId')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = record.departmentId'
      )
      .select([
        'record.id as id',
        'record.certificateId as certificateId',
        'certificate.name as certificateName',
        'record.employeeId as employeeId',
        'employee.name as employeeName',
        'record.departmentId as departmentId',
        'department.name as departmentName',
        'record.issuedAt as issuedAt',
        'record.issuedBy as issuedBy',
        'record.sourceCourseId as sourceCourseId',
        'record.status as status',
      ]);

    this.applyDepartmentScope(qb, departmentScopeIds);

    if (query.certificateId) {
      qb.andWhere('record.certificateId = :certificateId', {
        certificateId: Number(query.certificateId),
      });
    }

    if (query.employeeId) {
      qb.andWhere('record.employeeId = :employeeId', {
        employeeId: Number(query.employeeId),
      });
    }

    if (query.status) {
      qb.andWhere('record.status = :status', {
        status: String(query.status).trim(),
      });
    }

    if (query.departmentId) {
      qb.andWhere('record.departmentId = :departmentId', {
        departmentId: Number(query.departmentId),
      });
    }

    qb.orderBy('record.issuedAt', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item =>
        this.normalizeRecordRow(
          item,
          item.certificateName,
          item.employeeName,
          item.departmentName
        )
      ),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  private async currentPerms() {
    const admin = this.currentAdmin;

    if (!admin?.roleIds) {
      throw new CoolCommException('登录状态已失效');
    }

    return this.baseSysMenuService.getPerms(admin.roleIds);
  }

  private assertPerm(perms: string[], perm: string, message: string) {
    if (!perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }

  private async requireCertificate(id: number) {
    const certificateId = Number(id || 0);

    if (!Number.isInteger(certificateId) || certificateId <= 0) {
      throw new CoolCommException('证书 ID 不合法');
    }

    const certificate = await this.performanceCertificateEntity.findOneBy({
      id: certificateId,
    });

    if (!certificate) {
      throw new CoolCommException('证书不存在');
    }

    return certificate;
  }

  private async assertCertificateCodeUnique(code: string | null, excludeId?: number) {
    if (!code) {
      return;
    }

    const existing = await this.performanceCertificateEntity.findOneBy({ code });

    if (existing && Number(existing.id) !== Number(excludeId || 0)) {
      throw new CoolCommException('证书编码已存在');
    }
  }

  private async loadIssuedCountMap(ids: number[]) {
    const validIds = Array.from(
      new Set(ids.filter(item => Number.isInteger(item) && item > 0))
    );
    const result = new Map<number, number>();

    if (!validIds.length) {
      return result;
    }

    const records = await this.performanceCertificateRecordEntity.findBy({
      certificateId: In(validIds),
    });

    records.forEach(item => {
      if (item.status !== 'issued') {
        return;
      }
      const certificateId = Number(item.certificateId);
      result.set(certificateId, (result.get(certificateId) || 0) + 1);
    });

    return result;
  }

  private normalizeCertificateRow(row: any, countMap: Map<number, number>) {
    const id = Number(row.id);
    return {
      id,
      name: row.name,
      code: row.code ?? null,
      category: row.category ?? null,
      issuer: row.issuer ?? null,
      description: row.description ?? null,
      validityMonths:
        row.validityMonths === undefined || row.validityMonths === null
          ? null
          : Number(row.validityMonths),
      sourceCourseId:
        row.sourceCourseId === undefined || row.sourceCourseId === null
          ? null
          : Number(row.sourceCourseId),
      status: row.status,
      issuedCount: countMap.get(id) || 0,
      createTime: row.createTime,
      updateTime: row.updateTime,
    };
  }

  private normalizeRecordRow(
    row: any,
    certificateName: string,
    employeeName: string,
    departmentName: string | null
  ) {
    return {
      id: Number(row.id),
      certificateId: Number(row.certificateId),
      certificateName,
      employeeId: Number(row.employeeId),
      employeeName,
      departmentId:
        row.departmentId === undefined || row.departmentId === null
          ? null
          : Number(row.departmentId),
      departmentName,
      issuedAt: row.issuedAt,
      issuedBy: row.issuedBy,
      sourceCourseId:
        row.sourceCourseId === undefined || row.sourceCourseId === null
          ? null
          : Number(row.sourceCourseId),
      status: row.status,
    };
  }

  private hasHrScope(perms: string[]) {
    return (
      perms.includes(this.perms.add) ||
      perms.includes(this.perms.update) ||
      perms.includes(this.perms.issue) ||
      Boolean(this.currentAdmin?.isAdmin) ||
      this.currentAdmin?.username === 'admin'
    );
  }

  private async departmentScopeIds(perms: string[]) {
    if (this.hasHrScope(perms)) {
      return null;
    }

    const userId = Number(this.currentAdmin?.userId || 0);

    if (!userId) {
      throw new CoolCommException('登录上下文缺失');
    }

    const ids = await this.baseSysPermsService.departmentIds(userId);
    return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
  }

  private applyDepartmentScope(qb: any, departmentIds: number[] | null) {
    if (departmentIds === null) {
      return;
    }

    if (!departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('record.departmentId in (:...departmentIds)', { departmentIds });
  }
}
