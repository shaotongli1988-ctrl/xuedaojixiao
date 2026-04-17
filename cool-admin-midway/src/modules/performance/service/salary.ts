/**
 * 文件职责：承载薪资模块的列表、详情、草稿维护、确认/归档和调整记录主链。
 * 不负责共享鉴权基础层、导出或复杂薪资计算引擎。
 * 维护重点：只有 HR 可访问，且 `confirmed` 后金额只能通过 `changeAdd` 变更。
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
import { In, Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformanceSalaryEntity } from '../entity/salary';
import { PerformanceSalaryChangeEntity } from '../entity/salary-change';
import * as jwt from 'jsonwebtoken';

export type SalaryStatus = 'draft' | 'confirmed' | 'archived';

export const normalizeSalaryAmount = (value: number | string | null | undefined) =>
  Math.round(Number(value || 0) * 100) / 100;

export function assertSalaryDraftEditable(status?: string) {
  if (status !== 'draft') {
    throw new CoolCommException('已确认薪资不允许直接修改金额');
  }
}

export function assertSalaryActionAllowed(
  currentStatus: string | undefined,
  action: 'confirm' | 'archive' | 'changeAdd'
) {
  if (action === 'confirm' && currentStatus !== 'draft') {
    throw new CoolCommException('当前状态不允许执行该操作');
  }

  if (action === 'archive' && currentStatus !== 'confirmed') {
    throw new CoolCommException('当前状态不允许执行该操作');
  }

  if (action === 'changeAdd' && currentStatus !== 'confirmed') {
    throw new CoolCommException('当前状态不允许执行该操作');
  }
}

export function applySalaryChange(
  currentAdjustAmount: number | string | null | undefined,
  currentFinalAmount: number | string | null | undefined,
  changeAdjustAmount: number | string | null | undefined
) {
  const beforeAmount = normalizeSalaryAmount(currentFinalAmount);
  const delta = normalizeSalaryAmount(changeAdjustAmount);
  const nextAdjustAmount = normalizeSalaryAmount(
    normalizeSalaryAmount(currentAdjustAmount) + delta
  );
  const afterAmount = normalizeSalaryAmount(beforeAmount + delta);

  return {
    beforeAmount,
    delta,
    nextAdjustAmount,
    afterAmount,
  };
}

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceSalaryService extends BaseService {
  @InjectEntityModel(PerformanceSalaryEntity)
  performanceSalaryEntity: Repository<PerformanceSalaryEntity>;

  @InjectEntityModel(PerformanceSalaryChangeEntity)
  performanceSalaryChangeEntity: Repository<PerformanceSalaryChangeEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(PerformanceAssessmentEntity)
  performanceAssessmentEntity: Repository<PerformanceAssessmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:salary:page',
    info: 'performance:salary:info',
    add: 'performance:salary:add',
    update: 'performance:salary:update',
    confirm: 'performance:salary:confirm',
    archive: 'performance:salary:archive',
    changeAdd: 'performance:salary:changeAdd',
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
    this.assertHasPerm(perms, this.perms.page, '无权限查看薪资管理');

    const page = Number(query.page || 1);
    const size = Number(query.size || 20);

    const qb = this.performanceSalaryEntity
      .createQueryBuilder('salary')
      .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = salary.employeeId')
      .select([
        'salary.id as id',
        'salary.employeeId as employeeId',
        'salary.assessmentId as assessmentId',
        'salary.periodValue as periodValue',
        'salary.grade as grade',
        'salary.effectiveDate as effectiveDate',
        'salary.status as status',
        'salary.baseSalary as baseSalary',
        'salary.performanceBonus as performanceBonus',
        'salary.adjustAmount as adjustAmount',
        'salary.finalAmount as finalAmount',
        'salary.createTime as createTime',
        'salary.updateTime as updateTime',
        'employee.name as employeeName',
      ]);

    if (query.employeeId) {
      qb.andWhere('salary.employeeId = :employeeId', {
        employeeId: Number(query.employeeId),
      });
    }

    if (query.periodValue) {
      qb.andWhere('salary.periodValue = :periodValue', {
        periodValue: String(query.periodValue).trim(),
      });
    }

    if (query.status) {
      qb.andWhere('salary.status = :status', { status: String(query.status) });
    }

    if (query.effectiveDateStart) {
      qb.andWhere('salary.effectiveDate >= :effectiveDateStart', {
        effectiveDateStart: String(query.effectiveDateStart),
      });
    }

    if (query.effectiveDateEnd) {
      qb.andWhere('salary.effectiveDate <= :effectiveDateEnd', {
        effectiveDateEnd: String(query.effectiveDateEnd),
      });
    }

    qb.orderBy('salary.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeSalaryRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.info, '无权限查看薪资详情');

    const salary = await this.requireSalary(id);
    return this.buildSalaryDetail(salary);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.add, '无权限新增薪资');

    const salaryPayload = await this.resolveSalaryPayload(payload);
    const salary = await this.performanceSalaryEntity.save(
      this.performanceSalaryEntity.create({
        ...salaryPayload,
        status: 'draft',
      })
    );

    return this.info(salary.id);
  }

  async updateSalary(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.update, '无权限修改薪资');

    const salary = await this.requireSalary(Number(payload.id));
    assertSalaryDraftEditable(salary.status);

    const salaryPayload = await this.resolveSalaryPayload(payload, salary);
    await this.performanceSalaryEntity.update({ id: salary.id }, salaryPayload);

    return this.info(salary.id);
  }

  async confirm(payload: { id: number }) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.confirm, '无权限确认薪资');

    const salary = await this.requireSalary(Number(payload.id));
    assertSalaryActionAllowed(salary.status, 'confirm');

    await this.performanceSalaryEntity.update(
      { id: salary.id },
      { status: 'confirmed' }
    );

    return this.info(salary.id);
  }

  async archive(payload: { id: number }) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.archive, '无权限归档薪资');

    const salary = await this.requireSalary(Number(payload.id));
    assertSalaryActionAllowed(salary.status, 'archive');

    await this.performanceSalaryEntity.update(
      { id: salary.id },
      { status: 'archived' }
    );

    return this.info(salary.id);
  }

  async changeAdd(payload: { salaryId: number; adjustAmount: number; changeReason: string }) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.changeAdd, '无权限调整薪资');

    const salary = await this.requireSalary(Number(payload.salaryId));
    assertSalaryActionAllowed(salary.status, 'changeAdd');

    const changeReason = String(payload.changeReason || '').trim();
    if (!changeReason) {
      throw new CoolCommException('调整原因不能为空');
    }

    const { beforeAmount, delta, nextAdjustAmount, afterAmount } = applySalaryChange(
      salary.adjustAmount,
      salary.finalAmount,
      payload.adjustAmount
    );

    await this.performanceSalaryEntity.manager.transaction(async manager => {
      await manager.update(
        PerformanceSalaryEntity,
        { id: salary.id },
        {
          adjustAmount: nextAdjustAmount,
          finalAmount: afterAmount,
        }
      );

      await manager.save(
        PerformanceSalaryChangeEntity,
        manager.create(PerformanceSalaryChangeEntity, {
          salaryId: salary.id,
          beforeAmount,
          afterAmount,
          changeReason,
          operatorId: this.currentAdmin.userId,
        })
      );
    });

    return this.info(salary.id);
  }

  async initSalaryScope() {
    return;
  }

  private async buildSalaryDetail(salary: PerformanceSalaryEntity) {
    const [employee, changeRecords] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: salary.employeeId }),
      this.performanceSalaryChangeEntity.find({
        where: { salaryId: salary.id },
        order: { createTime: 'DESC' },
      }),
    ]);

    const operatorIds = changeRecords
      .map(item => Number(item.operatorId))
      .filter(item => item > 0);
    const operators = operatorIds.length
      ? await this.baseSysUserEntity.findBy({ id: In(operatorIds) } as any)
      : [];

    return {
      ...this.normalizeSalaryRow({
        ...salary,
        employeeName: employee?.name || '',
      }),
      changeRecords: changeRecords.map(item => {
        const operator = operators.find(
          operatorItem => Number(operatorItem.id) === Number(item.operatorId)
        );

        return {
          id: Number(item.id),
          salaryId: Number(item.salaryId),
          beforeAmount: normalizeSalaryAmount(item.beforeAmount),
          adjustAmount: normalizeSalaryAmount(
            normalizeSalaryAmount(item.afterAmount) -
              normalizeSalaryAmount(item.beforeAmount)
          ),
          afterAmount: normalizeSalaryAmount(item.afterAmount),
          changeReason: item.changeReason || '',
          operatorId: Number(item.operatorId),
          operatorName: operator?.name || '',
          createTime: item.createTime,
        };
      }),
    };
  }

  private normalizeSalaryRow(item: any) {
    return {
      ...item,
      id: Number(item.id),
      employeeId: Number(item.employeeId),
      assessmentId: item.assessmentId ? Number(item.assessmentId) : null,
      baseSalary: normalizeSalaryAmount(item.baseSalary),
      performanceBonus: normalizeSalaryAmount(item.performanceBonus),
      adjustAmount: normalizeSalaryAmount(item.adjustAmount),
      finalAmount: normalizeSalaryAmount(item.finalAmount),
    };
  }

  private async resolveSalaryPayload(
    payload: any,
    current?: PerformanceSalaryEntity
  ) {
    const employeeId = Number(payload.employeeId ?? current?.employeeId);
    const periodValue = String(
      payload.periodValue ?? current?.periodValue ?? ''
    ).trim();
    const effectiveDate = String(
      payload.effectiveDate ?? current?.effectiveDate ?? ''
    ).trim();

    if (!employeeId) {
      throw new CoolCommException('员工不能为空');
    }

    if (!periodValue) {
      throw new CoolCommException('期间不能为空');
    }

    if (!effectiveDate) {
      throw new CoolCommException('生效日期不能为空');
    }

    const employee = await this.baseSysUserEntity.findOneBy({ id: employeeId });
    if (!employee) {
      throw new CoolCommException('员工不存在');
    }

    const assessmentId = this.resolveOptionalNumber(
      payload.assessmentId,
      current?.assessmentId
    );
    let grade =
      payload.grade !== undefined ? String(payload.grade || '').trim() : current?.grade || '';

    if (assessmentId) {
      const assessment = await this.performanceAssessmentEntity.findOneBy({
        id: assessmentId,
      });
      if (!assessment) {
        throw new CoolCommException('评估单不存在');
      }
      if (!grade) {
        grade = assessment.grade || '';
      }
    }

    return {
      employeeId,
      assessmentId,
      periodValue,
      baseSalary: normalizeSalaryAmount(
        payload.baseSalary ?? current?.baseSalary ?? 0
      ),
      performanceBonus: normalizeSalaryAmount(
        payload.performanceBonus ?? current?.performanceBonus ?? 0
      ),
      adjustAmount: normalizeSalaryAmount(
        payload.adjustAmount ?? current?.adjustAmount ?? 0
      ),
      finalAmount: normalizeSalaryAmount(
        payload.finalAmount ?? current?.finalAmount ?? 0
      ),
      grade,
      effectiveDate,
      status: current?.status || 'draft',
    };
  }

  private resolveOptionalNumber(nextValue: any, currentValue?: number | null) {
    if (nextValue === undefined) {
      return currentValue ? Number(currentValue) : null;
    }

    if (nextValue === null || nextValue === '') {
      return null;
    }

    const value = Number(nextValue);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private async requireSalary(id: number) {
    const salary = await this.performanceSalaryEntity.findOneBy({ id });

    if (!salary) {
      throw new CoolCommException('数据不存在');
    }

    return salary;
  }

  private async currentPerms() {
    return this.baseSysMenuService.getPerms(this.currentAdmin.roleIds);
  }

  private assertHasPerm(perms: string[], perm: string, message: string) {
    if (!perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }
}
