/**
 * 目标地图领域服务。
 * 这里负责目标主链查询、维护、进度更新与权限校验，不负责驾驶舱聚合或指标库配置。
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
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceGoalEntity } from '../entity/goal';
import { PerformanceGoalProgressEntity } from '../entity/goal-progress';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  GoalStatus,
  assertGoalUpdatable,
  calculateGoalProgressRate,
  normalizeGoalNumber,
  resolveGoalStatusAfterProgress,
  resolveGoalStatusForStoredValue,
  validateGoalPayload,
} from './goal-helper';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound
  );
const PERFORMANCE_GOAL_TITLE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.goalTitleRequired
  );

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceGoalService extends BaseService {
  @InjectEntityModel(PerformanceGoalEntity)
  performanceGoalEntity: Repository<PerformanceGoalEntity>;

  @InjectEntityModel(PerformanceGoalProgressEntity)
  performanceGoalProgressEntity: Repository<PerformanceGoalProgressEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  private readonly perms = {
    page: PERMISSIONS.performance.goal.page,
    info: PERMISSIONS.performance.goal.info,
    add: PERMISSIONS.performance.goal.add,
    update: PERMISSIONS.performance.goal.update,
    delete: PERMISSIONS.performance.goal.delete,
    progressUpdate: PERMISSIONS.performance.goal.progressUpdate,
    export: PERMISSIONS.performance.goal.export,
  };

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.goal.page]: 'goal.page_read',
    [PERMISSIONS.performance.goal.info]: 'goal.detail.read',
    [PERMISSIONS.performance.goal.add]: 'goal.create',
    [PERMISSIONS.performance.goal.update]: 'goal.update',
    [PERMISSIONS.performance.goal.delete]: 'goal.delete',
    [PERMISSIONS.performance.goal.progressUpdate]: 'goal.progress_update',
    [PERMISSIONS.performance.goal.export]: 'goal.export',
  };

  async page(query: any) {
    const access = await this.currentPerms();
    const page = Number(query.page || 1);
    const size = Number(query.size || 20);

    this.assertPerm(access, this.perms.page, '无权限查看目标地图');

    const qb = this.performanceGoalEntity
      .createQueryBuilder('goal')
      .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = goal.employeeId')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = goal.departmentId'
      )
      .select([
        'goal.id as id',
        'goal.employeeId as employeeId',
        'goal.departmentId as departmentId',
        'goal.title as title',
        'goal.description as description',
        'goal.targetValue as targetValue',
        'goal.currentValue as currentValue',
        'goal.unit as unit',
        'goal.weight as weight',
        'goal.startDate as startDate',
        'goal.endDate as endDate',
        'goal.status as status',
        'goal.createTime as createTime',
        'goal.updateTime as updateTime',
        'employee.name as employeeName',
        'department.name as departmentName',
      ]);

    this.applyGoalScope(qb, access);

    if (query.employeeId) {
      qb.andWhere('goal.employeeId = :employeeId', {
        employeeId: Number(query.employeeId),
      });
    }

    if (query.departmentId) {
      qb.andWhere('goal.departmentId = :departmentId', {
        departmentId: Number(query.departmentId),
      });
    }

    if (query.status) {
      qb.andWhere('goal.status = :status', { status: query.status });
    }

    if (query.keyword) {
      qb.andWhere('goal.title like :keyword', {
        keyword: `%${query.keyword}%`,
      });
    }

    if (query.startDate) {
      qb.andWhere('goal.startDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('goal.endDate <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('goal.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeGoalRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const access = await this.currentPerms();
    const goal = await this.requireGoal(id);

    this.assertCanViewGoal(goal, access);

    return this.buildGoalDetail(goal);
  }

  async add(payload: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.add, '无权限新增目标');

    const departmentId = await this.resolveDepartmentId(
      Number(payload.employeeId),
      Number(payload.departmentId)
    );

    this.assertCanManageDepartment(departmentId, access);
    this.assertTitle(payload.title);
    validateGoalPayload({
      targetValue: Number(payload.targetValue),
      currentValue: Number(payload.currentValue || 0),
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    const currentValue = normalizeGoalNumber(payload.currentValue || 0);
    const goal = await this.performanceGoalEntity.save(
      this.performanceGoalEntity.create({
        employeeId: Number(payload.employeeId),
        departmentId,
        title: String(payload.title || '').trim(),
        description: payload.description ? String(payload.description).trim() : '',
        targetValue: Number(payload.targetValue),
        currentValue,
        unit: payload.unit ? String(payload.unit).trim() : '',
        weight: normalizeGoalNumber(payload.weight || 0),
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: resolveGoalStatusForStoredValue(
          'draft',
          currentValue,
          Number(payload.targetValue)
        ),
      })
    );

    return this.info(goal.id);
  }

  async updateGoal(payload: any) {
    const access = await this.currentPerms();
    const goal = await this.requireGoal(Number(payload.id));

    this.assertPerm(access, this.perms.update, '无权限修改目标');

    assertGoalUpdatable(goal.status as GoalStatus);
    this.assertCanManageGoal(goal, access);

    const employeeId = Number(payload.employeeId || goal.employeeId);
    const departmentId = await this.resolveDepartmentId(
      employeeId,
      Number(payload.departmentId || goal.departmentId)
    );

    this.assertCanManageDepartment(departmentId, access);
    this.assertTitle(payload.title || goal.title);

    const nextTargetValue = Number(payload.targetValue ?? goal.targetValue);
    const nextCurrentValue = normalizeGoalNumber(
      payload.currentValue ?? goal.currentValue ?? 0
    );

    validateGoalPayload({
      targetValue: nextTargetValue,
      currentValue: nextCurrentValue,
      startDate: payload.startDate || goal.startDate,
      endDate: payload.endDate || goal.endDate,
    });

    await this.performanceGoalEntity.update(
      { id: goal.id },
      {
        employeeId,
        departmentId,
        title: String(payload.title || goal.title || '').trim(),
        description: payload.description
          ? String(payload.description).trim()
          : payload.description === ''
          ? ''
          : goal.description,
        targetValue: nextTargetValue,
        currentValue: nextCurrentValue,
        unit:
          payload.unit !== undefined
            ? String(payload.unit || '').trim()
            : goal.unit,
        weight: normalizeGoalNumber(payload.weight ?? goal.weight ?? 0),
        startDate: payload.startDate || goal.startDate,
        endDate: payload.endDate || goal.endDate,
        status: resolveGoalStatusForStoredValue(
          goal.status as GoalStatus,
          nextCurrentValue,
          nextTargetValue
        ),
      }
    );

    return this.info(goal.id);
  }

  async delete(ids: number[]) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.delete, '无权限删除目标');

    for (const id of ids) {
      const goal = await this.requireGoal(Number(id));
      this.assertCanManageGoal(goal, access);
    }

    await this.performanceGoalProgressEntity.delete({
      goalId: In((ids || []).map(item => Number(item))),
    });
    await this.performanceGoalEntity.delete((ids || []).map(item => Number(item)));
  }

  async progressUpdate(payload: any) {
    const access = await this.currentPerms();
    const goal = await this.requireGoal(Number(payload.id));

    this.assertPerm(access, this.perms.progressUpdate, '无权限更新目标进度');

    await this.assertCanUpdateProgress(goal, access);

    const nextCurrentValue = normalizeGoalNumber(payload.currentValue);
    validateGoalPayload({
      targetValue: Number(goal.targetValue),
      currentValue: nextCurrentValue,
      startDate: goal.startDate,
      endDate: goal.endDate,
    });

    const nextStatus = resolveGoalStatusAfterProgress(
      goal.status as GoalStatus,
      nextCurrentValue,
      Number(goal.targetValue)
    );

    await this.performanceGoalEntity.manager.transaction(async manager => {
      await manager.update(
        PerformanceGoalEntity,
        { id: goal.id },
        {
          currentValue: nextCurrentValue,
          status: nextStatus,
        }
      );

      await manager.save(
        PerformanceGoalProgressEntity,
        manager.create(PerformanceGoalProgressEntity, {
          goalId: goal.id,
          beforeValue: normalizeGoalNumber(goal.currentValue || 0),
          afterValue: nextCurrentValue,
          remark: payload.remark ? String(payload.remark).trim() : '',
          operatorId: access.userId,
        })
      );
    });

    return this.info(goal.id);
  }

  async export(query: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.export, '无权限导出目标');

    const result = await this.page({
      ...query,
      page: 1,
      size: 5000,
    });

    return result.list.map(item => {
      return {
        employeeName: item.employeeName,
        departmentName: item.departmentName,
        title: item.title,
        targetValue: item.targetValue,
        currentValue: item.currentValue,
        unit: item.unit,
        weight: item.weight,
        status: item.status,
        startDate: item.startDate,
        endDate: item.endDate,
        updateTime: item.updateTime,
      };
    });
  }

  private async buildGoalDetail(goal: PerformanceGoalEntity) {
    const [employee, department, progressRecords] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: goal.employeeId }),
      this.baseSysDepartmentEntity.findOneBy({ id: goal.departmentId }),
      this.performanceGoalProgressEntity.find({
        where: { goalId: goal.id },
        order: { createTime: 'DESC' },
      }),
    ]);

    const operatorIds = progressRecords.map(item => Number(item.operatorId));
    const operators = operatorIds.length
      ? await this.baseSysUserEntity.findBy({ id: In(operatorIds) } as any)
      : [];

    return {
      ...goal,
      employeeId: Number(goal.employeeId),
      departmentId: Number(goal.departmentId),
      targetValue: normalizeGoalNumber(goal.targetValue),
      currentValue: normalizeGoalNumber(goal.currentValue),
      weight: normalizeGoalNumber(goal.weight),
      employeeName: employee?.name || '',
      departmentName: department?.name || '',
      progressRate: calculateGoalProgressRate(
        Number(goal.currentValue),
        Number(goal.targetValue)
      ),
      progressRecords: progressRecords.map(item => {
        const operator = operators.find(
          operatorItem => Number(operatorItem.id) === Number(item.operatorId)
        );

        return {
          id: Number(item.id),
          goalId: Number(item.goalId),
          beforeValue: normalizeGoalNumber(item.beforeValue),
          afterValue: normalizeGoalNumber(item.afterValue),
          progressRate: calculateGoalProgressRate(
            Number(item.afterValue),
            Number(goal.targetValue)
          ),
          remark: item.remark || '',
          operatorId: Number(item.operatorId),
          operatorName: operator?.name || '',
          createTime: item.createTime,
        };
      }),
    };
  }

  private normalizeGoalRow(item: any) {
    return {
      ...item,
      id: Number(item.id),
      employeeId: Number(item.employeeId),
      departmentId: Number(item.departmentId),
      targetValue: normalizeGoalNumber(item.targetValue),
      currentValue: normalizeGoalNumber(item.currentValue),
      weight: normalizeGoalNumber(item.weight),
      progressRate: calculateGoalProgressRate(
        Number(item.currentValue || 0),
        Number(item.targetValue || 0)
      ),
    };
  }

  private async requireGoal(id: number) {
    const goal = await this.performanceGoalEntity.findOneBy({ id });

    if (!goal) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return goal;
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
      throw new CoolCommException(`未映射的目标权限: ${perm}`);
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

  private departmentScopeIds(access: PerformanceResolvedAccessContext) {
    return Array.from(
      new Set(
        (Array.isArray(access.departmentIds) ? access.departmentIds : [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );
  }

  private applyGoalScope(qb: any, access: PerformanceResolvedAccessContext) {
    const scopes = this.performanceAccessContextService.capabilityScopes(
      access,
      'goal.page_read'
    );
    if (scopes.includes('company')) {
      return;
    }

    const departmentIds = this.departmentScopeIds(access);
    if (scopes.includes('department_tree') || scopes.includes('department')) {
      if (!departmentIds.length) {
        qb.andWhere('1 = 0');
        return;
      }
      qb.andWhere('goal.departmentId in (:...departmentIds)', { departmentIds });
      return;
    }

    qb.andWhere('goal.employeeId = :userId', { userId: access.userId });
  }

  private assertCanViewGoal(
    goal: PerformanceGoalEntity,
    access: PerformanceResolvedAccessContext
  ) {
    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(
          access,
          'goal.detail.read'
        ),
        {
          subjectUserId: Number(goal.employeeId || 0),
          departmentId: Number(goal.departmentId || 0),
        }
      )
    ) {
      return;
    }
    throw new CoolCommException('无权查看该目标');
  }

  private assertCanManageGoal(
    goal: PerformanceGoalEntity,
    access: PerformanceResolvedAccessContext
  ) {
    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, 'goal.update'),
        {
          departmentId: Number(goal.departmentId || 0),
        }
      )
    ) {
      return;
    }
    throw new CoolCommException('无权管理该目标');
  }

  private assertCanManageDepartment(
    departmentId: number,
    access: PerformanceResolvedAccessContext
  ) {
    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, 'goal.update'),
        {
          departmentId: Number(departmentId || 0),
        }
      )
    ) {
      return;
    }
    throw new CoolCommException('无权管理该部门目标');
  }

  private async assertCanUpdateProgress(
    goal: PerformanceGoalEntity,
    access: PerformanceResolvedAccessContext
  ) {
    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(
          access,
          'goal.progress_update'
        ),
        {
          subjectUserId: Number(goal.employeeId || 0),
          departmentId: Number(goal.departmentId || 0),
        }
      )
    ) {
      return;
    }
    throw new CoolCommException('无权更新该目标进度');
  }

  private async resolveDepartmentId(employeeId: number, departmentId?: number) {
    if (departmentId) {
      return departmentId;
    }

    const employee = await this.baseSysUserEntity.findOneBy({ id: employeeId });

    if (!employee?.departmentId) {
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE);
    }

    return Number(employee.departmentId);
  }

  async initGoalScope() {
    return this.currentPerms();
  }

  private assertTitle(title: string) {
    if (!String(title || '').trim()) {
      throw new CoolCommException(PERFORMANCE_GOAL_TITLE_REQUIRED_MESSAGE);
    }
  }
}
