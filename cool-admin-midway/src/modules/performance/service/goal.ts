/**
 * 目标地图领域服务。
 * 这里负责目标主链查询、维护、进度更新与权限校验，不负责驾驶舱聚合或指标库配置。
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
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceGoalEntity } from '../entity/goal';
import { PerformanceGoalProgressEntity } from '../entity/goal-progress';
import * as jwt from 'jsonwebtoken';
import {
  GoalStatus,
  assertGoalUpdatable,
  calculateGoalProgressRate,
  normalizeGoalNumber,
  resolveGoalStatusAfterProgress,
  resolveGoalStatusForStoredValue,
  validateGoalPayload,
} from './goal-helper';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

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
  baseSysPermsService: BaseSysPermsService;

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

  private readonly perms = {
    page: 'performance:goal:page',
    info: 'performance:goal:info',
    add: 'performance:goal:add',
    update: 'performance:goal:update',
    delete: 'performance:goal:delete',
    progressUpdate: 'performance:goal:progressUpdate',
    export: 'performance:goal:export',
    hrPage: 'performance:salary:page',
  };

  async page(query: any) {
    const perms = await this.currentPerms();
    const page = Number(query.page || 1);
    const size = Number(query.size || 20);

    if (!this.hasPerm(perms, this.perms.page)) {
      throw new CoolCommException('无权限查看目标地图');
    }

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

    this.applyGoalScope(qb, perms);

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
    const perms = await this.currentPerms();
    const goal = await this.requireGoal(id);

    this.assertCanViewGoal(goal, perms);

    return this.buildGoalDetail(goal);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.add)) {
      throw new CoolCommException('无权限新增目标');
    }

    const departmentId = await this.resolveDepartmentId(
      Number(payload.employeeId),
      Number(payload.departmentId)
    );

    this.assertCanManageDepartment(departmentId, perms);
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
    const perms = await this.currentPerms();
    const goal = await this.requireGoal(Number(payload.id));

    if (!this.hasPerm(perms, this.perms.update)) {
      throw new CoolCommException('无权限修改目标');
    }

    assertGoalUpdatable(goal.status as GoalStatus);
    this.assertCanManageGoal(goal, perms);

    const employeeId = Number(payload.employeeId || goal.employeeId);
    const departmentId = await this.resolveDepartmentId(
      employeeId,
      Number(payload.departmentId || goal.departmentId)
    );

    this.assertCanManageDepartment(departmentId, perms);
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
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.delete)) {
      throw new CoolCommException('无权限删除目标');
    }

    for (const id of ids) {
      const goal = await this.requireGoal(Number(id));
      this.assertCanManageGoal(goal, perms);
    }

    await this.performanceGoalProgressEntity.delete({
      goalId: In((ids || []).map(item => Number(item))),
    });
    await this.performanceGoalEntity.delete((ids || []).map(item => Number(item)));
  }

  async progressUpdate(payload: any) {
    const perms = await this.currentPerms();
    const goal = await this.requireGoal(Number(payload.id));

    if (!this.hasPerm(perms, this.perms.progressUpdate)) {
      throw new CoolCommException('无权限更新目标进度');
    }

    this.assertCanUpdateProgress(goal, perms);

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
          operatorId: this.currentAdmin.userId,
        })
      );
    });

    return this.info(goal.id);
  }

  async export(query: any) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.export)) {
      throw new CoolCommException('无权限导出目标');
    }

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
      throw new CoolCommException('数据不存在');
    }

    return goal;
  }

  private async currentPerms() {
    return this.baseSysMenuService.getPerms(this.currentAdmin.roleIds);
  }

  private hasPerm(perms: string[], perm: string) {
    return perms.includes(perm);
  }

  private isHr(perms: string[]) {
    return (
      this.currentAdmin.isAdmin === true ||
      this.hasPerm(perms, this.perms.hrPage)
    );
  }

  private async departmentScopeIds() {
    const ids = await this.baseSysPermsService.departmentIds(
      this.currentAdmin.userId
    );
    return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
  }

  private applyGoalScope(qb: any, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    const userId = this.currentAdmin.userId;

    if (
      !this.hasPerm(perms, this.perms.add) &&
      !this.hasPerm(perms, this.perms.update) &&
      !this.hasPerm(perms, this.perms.delete)
    ) {
      qb.andWhere('goal.employeeId = :userId', { userId });
      return;
    }

    const departmentIds = this.currentCtx.goalDepartmentIds || [];

    if (!departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('goal.departmentId in (:...departmentIds)', { departmentIds });
  }

  private async assertCanViewGoal(goal: PerformanceGoalEntity, perms: string[]) {
    if (!this.hasPerm(perms, this.perms.info)) {
      throw new CoolCommException('无权限查看目标详情');
    }

    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds();
    const userId = this.currentAdmin.userId;

    if (
      goal.employeeId === userId ||
      departmentIds.includes(Number(goal.departmentId))
    ) {
      return;
    }

    throw new CoolCommException('无权查看该目标');
  }

  private assertCanManageGoal(goal: PerformanceGoalEntity, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = this.currentCtx.goalDepartmentIds || [];

    if (!departmentIds.includes(Number(goal.departmentId))) {
      throw new CoolCommException('无权管理该目标');
    }
  }

  private assertCanManageDepartment(departmentId: number, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = this.currentCtx.goalDepartmentIds || [];

    if (!departmentIds.includes(Number(departmentId))) {
      throw new CoolCommException('无权管理该部门目标');
    }
  }

  private async assertCanUpdateProgress(
    goal: PerformanceGoalEntity,
    perms: string[]
  ) {
    if (this.isHr(perms)) {
      return;
    }

    const userId = this.currentAdmin.userId;

    if (goal.employeeId === userId) {
      return;
    }

    this.assertCanManageGoal(goal, perms);
  }

  private async resolveDepartmentId(employeeId: number, departmentId?: number) {
    if (departmentId) {
      return departmentId;
    }

    const employee = await this.baseSysUserEntity.findOneBy({ id: employeeId });

    if (!employee?.departmentId) {
      throw new CoolCommException('员工所属部门不存在');
    }

    return Number(employee.departmentId);
  }

  async initGoalScope() {
    this.currentCtx.goalDepartmentIds = await this.departmentScopeIds();
  }

  private assertTitle(title: string) {
    if (!String(title || '').trim()) {
      throw new CoolCommException('目标标题不能为空');
    }
  }
}
