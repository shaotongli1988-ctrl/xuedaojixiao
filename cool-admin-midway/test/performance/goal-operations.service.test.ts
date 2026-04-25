/// <reference types="jest" />
/**
 * 目标运营台后端定向测试。
 * 这里优先验证贡献拆分、个人目标权限边界和自动补零等高风险规则，
 * 不负责 fresh runtime、真实数据库或 GUI 联调。
 */
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import {
  assertGoalOpsPeriod,
  assertGoalOpsSourceType,
  buildGoalOpsDailyReportSummary,
  buildGoalOpsOverviewRows,
} from '../../src/modules/performance/service/goal-operations-helper';
import { PerformanceGoalOperationsService } from '../../src/modules/performance/service/goal-operations';

function attachAccessContext(service: any) {
  const accessService = new PerformanceAccessContextService() as any;
  accessService.ctx = service.ctx;
  accessService.baseSysMenuService =
    service.baseSysMenuService || { getPerms: jest.fn().mockResolvedValue([]) };
  accessService.baseSysPermsService =
    service.baseSysPermsService || {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
  service.performanceAccessContextService = accessService;
  return service;
}

describe('performance goal operations helper', () => {
  test('should split public and personal contribution in overview rows', () => {
    const rows = buildGoalOpsOverviewRows([
      {
        id: 1,
        employeeId: 101,
        employeeName: '张三',
        departmentId: 10,
        periodType: 'day',
        planDate: '2026-04-19',
        sourceType: 'public',
        title: '电话量',
        targetValue: 100,
        actualValue: 80,
        status: 'submitted',
      },
      {
        id: 2,
        employeeId: 101,
        employeeName: '张三',
        departmentId: 10,
        periodType: 'day',
        planDate: '2026-04-19',
        sourceType: 'personal',
        title: '自拓客户',
        targetValue: 20,
        actualValue: 15,
        status: 'submitted',
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      employeeId: 101,
      publicTargetValue: 100,
      publicActualValue: 80,
      personalTargetValue: 20,
      personalActualValue: 15,
      totalTargetValue: 120,
      totalActualValue: 95,
      completionRate: 79.17,
    });
  });

  test('should build daily report with auto zero employees', () => {
    const summary = buildGoalOpsDailyReportSummary('2026-04-19', 10, [
      {
        employeeId: 101,
        employeeName: '张三',
        departmentId: 10,
        publicTargetValue: 100,
        publicActualValue: 100,
        personalTargetValue: 0,
        personalActualValue: 0,
        totalTargetValue: 100,
        totalActualValue: 100,
        completionRate: 100,
        assignedCount: 1,
        submittedCount: 1,
        autoZeroCount: 0,
      },
      {
        employeeId: 102,
        employeeName: '李四',
        departmentId: 10,
        publicTargetValue: 80,
        publicActualValue: 0,
        personalTargetValue: 20,
        personalActualValue: 0,
        totalTargetValue: 100,
        totalActualValue: 0,
        completionRate: 0,
        assignedCount: 2,
        submittedCount: 0,
        autoZeroCount: 2,
      },
    ]);

    expect(summary.departmentSummary).toMatchObject({
      employeeCount: 2,
      totalTargetValue: 200,
      totalActualValue: 100,
      publicTargetValue: 180,
      publicActualValue: 100,
      personalTargetValue: 20,
      personalActualValue: 0,
      autoZeroCount: 2,
    });
    expect(summary.autoZeroEmployees).toEqual([
      {
        employeeId: 102,
        employeeName: '李四',
        autoZeroCount: 2,
      },
    ]);
  });

  test('should reject invalid period and source type semantics', () => {
    expect(() =>
      assertGoalOpsPeriod('year' as any, '2026-04-01', '2026-04-30')
    ).toThrow('周期类型不合法');
    expect(() => assertGoalOpsPeriod('day', '', '2026-04-30')).toThrow(
      '周期开始和结束日期不能为空'
    );
    expect(() =>
      assertGoalOpsPeriod('day', '2026-04-30', '2026-04-01', '2026-04-30')
    ).toThrow('周期开始日期不能晚于结束日期');
    expect(() => assertGoalOpsPeriod('day', '2026-04-01', '2026-04-30')).toThrow(
      '日目标必须指定计划日期'
    );
    expect(() =>
      assertGoalOpsPeriod('day', '2026-04-01', '2026-04-30', '2026-05-01')
    ).toThrow('计划日期必须落在周期内');
    expect(() => assertGoalOpsSourceType('team' as any)).toThrow('目标来源不合法');
  });
});

describe('performance goal operations service', () => {
  test('should allow employee to save own personal plan', async () => {
    const findOneBy = jest.fn().mockImplementation(({ id }) => {
      if (id === 1) {
        return Promise.resolve({
          id: 1,
          employeeId: 321,
          departmentId: 88,
          periodType: 'day',
          planDate: '2026-04-19',
          periodStartDate: '2026-04-19',
          periodEndDate: '2026-04-19',
          sourceType: 'personal',
          title: '自拓客户',
          description: null,
          targetValue: 10,
          actualValue: 0,
          unit: '个',
          status: 'assigned',
          parentPlanId: null,
          isSystemGenerated: 0,
          assignedBy: 321,
          submittedBy: null,
          submittedAt: null,
          extJson: null,
        });
      }
      return Promise.resolve(null);
    });

    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
      goalDepartmentIds: [],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:update',
        'performance:goal:progressUpdate',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([88]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 321, departmentId: 88 }),
      findBy: jest.fn().mockResolvedValue([{ id: 321, name: 'employee_platform' }]),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 88, name: '平台部' }),
      findBy: jest.fn().mockResolvedValue([{ id: 88, name: '平台部' }]),
    };
    service.performanceGoalOpsPlanEntity = {
      findOneBy,
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 1 }),
    };
    attachAccessContext(service);

    const result = await service.savePlan({
      employeeId: 321,
      sourceType: 'personal',
      periodType: 'day',
      planDate: '2026-04-19',
      periodStartDate: '2026-04-19',
      periodEndDate: '2026-04-19',
      title: '自拓客户',
      targetValue: 10,
      unit: '个',
    });

    expect(service.performanceGoalOpsPlanEntity.save).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 1,
      employeeId: 321,
      departmentId: 88,
      sourceType: 'personal',
      employeeName: 'employee_platform',
      departmentName: '平台部',
    });
  });

  test('should reject employee saving public plan without department scope', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
      goalDepartmentIds: [],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:update',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 321, departmentId: 88 }),
    };
    service.performanceGoalOpsPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };
    attachAccessContext(service);

    await expect(
      service.savePlan({
        employeeId: 321,
        sourceType: 'public',
        periodType: 'day',
        planDate: '2026-04-19',
        periodStartDate: '2026-04-19',
        periodEndDate: '2026-04-19',
        title: '公共电话量',
        targetValue: 100,
      })
    ).rejects.toThrow('仅主管或 HR 可管理部门目标运营台数据');
    expect(service.performanceGoalOpsPlanEntity.save).not.toHaveBeenCalled();
  });

  test('should reject employee saving public plan even with same department scope', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
      goalDepartmentIds: [88],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:update',
        'performance:goal:progressUpdate',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([88]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 321, departmentId: 88 }),
    };
    service.performanceGoalOpsPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };
    attachAccessContext(service);

    await expect(
      service.savePlan({
        employeeId: 321,
        departmentId: 88,
        sourceType: 'public',
        periodType: 'day',
        planDate: '2026-04-19',
        periodStartDate: '2026-04-19',
        periodEndDate: '2026-04-19',
        title: '公共电话量',
        targetValue: 100,
      })
    ).rejects.toThrow('仅主管或 HR 可管理部门目标运营台数据');
    expect(service.performanceGoalOpsPlanEntity.save).not.toHaveBeenCalled();
  });

  test('should reject employee saving department config', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
      goalDepartmentIds: [88],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:update',
        'performance:goal:progressUpdate',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([88]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 321, departmentId: 88 }),
    };
    service.performanceGoalOpsDepartmentConfigEntity = {
      findOneBy: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      update: jest.fn(),
      create: jest.fn().mockImplementation(payload => payload),
    };
    attachAccessContext(service);

    await expect(
      service.saveDepartmentConfig({
        departmentId: 88,
        assignTime: '09:00',
        submitDeadline: '18:00',
        reportSendTime: '18:30',
        reportPushMode: 'system_only',
      })
    ).rejects.toThrow('仅主管或 HR 可管理部门目标运营台数据');
    expect(service.performanceGoalOpsDepartmentConfigEntity.save).not.toHaveBeenCalled();
  });

  test('should not expose department management access from personal goal perms', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
      goalDepartmentIds: [88],
      goalIsHr: false,
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:add',
        'performance:goal:update',
        'performance:goal:progressUpdate',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([88]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 321, departmentId: 88 }),
    };
    attachAccessContext(service);

    await expect(
      service.accessProfile({
        departmentId: 88,
      })
    ).resolves.toMatchObject({
      departmentId: 88,
      isHr: false,
      canManageDepartment: false,
      canMaintainPersonalPlan: true,
      manageableDepartmentIds: [88],
    });

    await expect(
      service.saveDepartmentConfig({
        departmentId: 88,
        assignTime: '09:00',
        submitDeadline: '18:00',
        reportSendTime: '18:30',
        reportPushMode: 'system_only',
      })
    ).rejects.toThrow('仅主管或 HR 可管理部门目标运营台数据');
  });

  test('should expose manager persona fact fields on department-scoped access profile', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
      goalDepartmentIds: [88],
      goalIsHr: false,
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:update',
        'performance:goal:opsManage',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([88]),
    };
    attachAccessContext(service);

    await expect(
      service.accessProfile({
        departmentId: 88,
      })
    ).resolves.toMatchObject({
      departmentId: 88,
      activePersonaKey: 'org.line_manager',
      roleKind: 'manager',
      scopeKey: 'department',
      isHr: false,
      canManageDepartment: true,
      manageableDepartmentIds: [88],
    });
  });

  test('should expose hr persona fact fields on company-scoped access profile', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 9527,
        roleIds: [12],
        isAdmin: false,
      },
      goalDepartmentIds: [88],
      goalIsHr: true,
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:update',
        'performance:goal:opsManage',
        'performance:goal:opsGlobalScope',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([88]),
    };
    attachAccessContext(service);

    await expect(
      service.accessProfile({
        departmentId: 88,
      })
    ).resolves.toMatchObject({
      departmentId: 88,
      activePersonaKey: 'org.hrbp',
      roleKind: 'hr',
      scopeKey: 'company',
      isHr: true,
      canManageDepartment: true,
      manageableDepartmentIds: [88],
    });
  });

  test('should keep opsManage department scoped without explicit global scope permission', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:update',
        'performance:goal:opsManage',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([88]),
    };
    attachAccessContext(service);

    await service.initGoalScope();

    expect(service.ctx.goalDepartmentIds).toEqual([88]);
    expect(service.ctx.goalIsHr).toBe(false);
  });

  test('should resolve goal hr scope from explicit global scope permission', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [12],
        isAdmin: false,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:update',
        'performance:goal:opsManage',
        'performance:goal:opsGlobalScope',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([88]),
    };
    attachAccessContext(service);

    await service.initGoalScope();

    expect(service.ctx.goalDepartmentIds).toEqual([88]);
    expect(service.ctx.goalIsHr).toBe(true);
  });

  test('should auto zero only assigned daily plans', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 101,
        roleIds: [2],
        isAdmin: false,
      },
      goalDepartmentIds: [10],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:update',
        'performance:goal:opsManage',
        'performance:goal:export',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([10]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 101, departmentId: 10 }),
    };
    service.performanceGoalOpsPlanEntity = {
      find: jest.fn().mockResolvedValue([
        { id: 1, status: 'assigned' },
        { id: 2, status: 'submitted' },
        { id: 3, status: 'auto_zero' },
      ]),
      update,
    };
    attachAccessContext(service);

    const result = await service.finalizeDailyMissing({
      departmentId: 10,
      planDate: '2026-04-19',
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({
        actualValue: 0,
        status: 'auto_zero',
        submittedBy: 101,
      })
    );
    expect(result).toEqual({
      departmentId: 10,
      planDate: '2026-04-19',
      autoZeroCount: 1,
    });
  });

  test('should reject resubmitting daily results after plan already left assigned status', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
      goalDepartmentIds: [],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:page',
        'performance:goal:update',
        'performance:goal:progressUpdate',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceGoalOpsPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        employeeId: 321,
        departmentId: 88,
        periodType: 'day',
        planDate: '2026-04-19',
        status: 'submitted',
      }),
      update,
    };
    service.overview = jest.fn().mockResolvedValue({
      departmentId: 88,
      planDate: '2026-04-19',
    });
    attachAccessContext(service);

    await expect(
      service.submitDailyResults({
        planDate: '2026-04-19',
        departmentId: 88,
        items: [
          {
            planId: 1,
            actualValue: 12,
          },
        ],
      })
    ).rejects.toThrow('当前状态不允许填报结果');

    expect(update).not.toHaveBeenCalled();
    expect(service.overview).not.toHaveBeenCalled();
  });

  test('should reject report info lookup without report date', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
      goalDepartmentIds: [],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:goal:page']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 321, departmentId: 88 }),
      findBy: jest.fn().mockResolvedValue([{ id: 321, name: 'employee_platform' }]),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 88, name: '平台部' }),
      findBy: jest.fn().mockResolvedValue([{ id: 88, name: '平台部' }]),
    };
    attachAccessContext(service);

    await expect(service.reportInfo({ departmentId: 88 })).rejects.toThrow(
      '日报日期不能为空'
    );
  });

  test('should reject finalizeDailyMissing without plan date', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [1],
        isAdmin: false,
      },
      goalDepartmentIds: [],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:goal:opsGlobalScope',
        'performance:goal:update',
        'performance:goal:progressUpdate',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 321, departmentId: 88 }),
      findBy: jest.fn().mockResolvedValue([{ id: 321, name: 'employee_platform' }]),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 88, name: '平台部' }),
      findBy: jest.fn().mockResolvedValue([{ id: 88, name: '平台部' }]),
    };
    attachAccessContext(service);

    await expect(
      service.finalizeDailyMissing({ departmentId: 88 })
    ).rejects.toThrow('补零日期不能为空');
  });

  test('should reject overview query without plan date', async () => {
    const service = new PerformanceGoalOperationsService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
      goalDepartmentIds: [],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:goal:page']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 321, departmentId: 88 }),
      findBy: jest.fn().mockResolvedValue([{ id: 321, name: 'employee_platform' }]),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 88, name: '平台部' }),
      findBy: jest.fn().mockResolvedValue([{ id: 88, name: '平台部' }]),
    };
    attachAccessContext(service);

    await expect(service.overview({ departmentId: 88 })).rejects.toThrow(
      '查询日期不能为空'
    );
  });
});
