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
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformanceSalaryEntity } from '../entity/salary';
import { PerformanceSalaryChangeEntity } from '../entity/salary-change';
import * as jwt from 'jsonwebtoken';
import { SALARY_STATUS_VALUES } from './salary-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

export type SalaryStatus = (typeof SALARY_STATUS_VALUES)[number];
const [SALARY_DRAFT_STATUS, SALARY_CONFIRMED_STATUS] = SALARY_STATUS_VALUES;
const PERFORMANCE_EMPLOYEE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeNotFound
  );
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_ASSESSMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assessmentNotFound
  );
const PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateActionNotAllowed
  );
const PERFORMANCE_EMPLOYEE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeRequired
  );
const PERFORMANCE_SALARY_CONFIRMED_EDIT_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.salaryConfirmedEditDenied
  );
const PERFORMANCE_SALARY_CHANGE_REASON_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.salaryChangeReasonRequired
  );
const PERFORMANCE_SALARY_PERIOD_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.salaryPeriodRequired
  );
const PERFORMANCE_SALARY_EFFECTIVE_DATE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.salaryEffectiveDateRequired
  );

export const normalizeSalaryAmount = (value: number | string | null | undefined) =>
  Math.round(Number(value || 0) * 100) / 100;

export function assertSalaryDraftEditable(status?: string) {
  if (status !== SALARY_DRAFT_STATUS) {
    throw new CoolCommException(PERFORMANCE_SALARY_CONFIRMED_EDIT_DENIED_MESSAGE);
  }
}

export function assertSalaryActionAllowed(
  currentStatus: string | undefined,
  action: 'confirm' | 'archive' | 'changeAdd'
) {
  if (action === 'confirm' && currentStatus !== SALARY_DRAFT_STATUS) {
    throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
  }

  if (action === 'archive' && currentStatus !== SALARY_CONFIRMED_STATUS) {
    throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
  }

  if (action === 'changeAdd' && currentStatus !== SALARY_CONFIRMED_STATUS) {
    throw new CoolCommException(PERFORMANCE_STATE_ACTION_NOT_ALLOWED_MESSAGE);
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
  performanceAccessContextService: PerformanceAccessContextService;

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

  async page(query: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'salary.read', '无权限查看薪资管理');

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
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'salary.read', '无权限查看薪资详情');

    const salary = await this.requireSalary(id);
    return this.buildSalaryDetail(salary);
  }

  async add(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'salary.create', '无权限新增薪资');

    const salaryPayload = await this.resolveSalaryPayload(payload);
    const salary = await this.performanceSalaryEntity.save(
      this.performanceSalaryEntity.create({
        ...salaryPayload,
        status: SALARY_DRAFT_STATUS,
      })
    );

    return this.info(salary.id);
  }

  async updateSalary(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'salary.update', '无权限修改薪资');

    const salary = await this.requireSalary(Number(payload.id));
    assertSalaryDraftEditable(salary.status);

    const salaryPayload = await this.resolveSalaryPayload(payload, salary);
    await this.performanceSalaryEntity.update({ id: salary.id }, salaryPayload);

    return this.info(salary.id);
  }

  async confirm(payload: { id: number }) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'salary.confirm', '无权限确认薪资');

    const salary = await this.requireSalary(Number(payload.id));
    assertSalaryActionAllowed(salary.status, 'confirm');

    await this.performanceSalaryEntity.update(
      { id: salary.id },
      { status: 'confirmed' }
    );

    return this.info(salary.id);
  }

  async archive(payload: { id: number }) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'salary.archive', '无权限归档薪资');

    const salary = await this.requireSalary(Number(payload.id));
    assertSalaryActionAllowed(salary.status, 'archive');

    await this.performanceSalaryEntity.update(
      { id: salary.id },
      { status: 'archived' }
    );

    return this.info(salary.id);
  }

  async changeAdd(payload: { salaryId: number; adjustAmount: number; changeReason: string }) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'salary.change_add', '无权限调整薪资');

    const salary = await this.requireSalary(Number(payload.salaryId));
    assertSalaryActionAllowed(salary.status, 'changeAdd');

    const changeReason = String(payload.changeReason || '').trim();
    if (!changeReason) {
      throw new CoolCommException(PERFORMANCE_SALARY_CHANGE_REASON_REQUIRED_MESSAGE);
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
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_REQUIRED_MESSAGE);
    }

    if (!periodValue) {
      throw new CoolCommException(PERFORMANCE_SALARY_PERIOD_REQUIRED_MESSAGE);
    }

    if (!effectiveDate) {
      throw new CoolCommException(PERFORMANCE_SALARY_EFFECTIVE_DATE_REQUIRED_MESSAGE);
    }

    const employee = await this.baseSysUserEntity.findOneBy({ id: employeeId });
    if (!employee) {
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_NOT_FOUND_MESSAGE);
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
        throw new CoolCommException(PERFORMANCE_ASSESSMENT_NOT_FOUND_MESSAGE);
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
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return salary;
  }

  private assertHasCapability(
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    if (!this.performanceAccessContextService.hasCapability(access, capabilityKey)) {
      throw new CoolCommException(message);
    }
  }
}
