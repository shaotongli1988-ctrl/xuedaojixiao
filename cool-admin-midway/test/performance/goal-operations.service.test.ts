/// <reference types="jest" />
/**
 * 目标运营台后端定向测试。
 * 这里优先验证贡献拆分、个人目标权限边界和自动补零等高风险规则，
 * 不负责 fresh runtime、真实数据库或 GUI 联调。
 */
import {
  buildGoalOpsDailyReportSummary,
  buildGoalOpsOverviewRows,
} from '../../src/modules/performance/service/goal-operations-helper';
import { PerformanceGoalOperationsService } from '../../src/modules/performance/service/goal-operations';

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
    service.performanceGoalOpsPlanEntity = {
      findOneBy,
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 1 }),
    };

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
});
