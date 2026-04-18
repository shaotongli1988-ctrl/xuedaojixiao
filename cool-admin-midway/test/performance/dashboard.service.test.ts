/// <reference types="jest" />
/**
 * 驾驶舱聚合纯逻辑测试。
 * 这里负责验证模块 3 的聚合结果结构和基础范围裁剪，不负责数据库或真实联调。
 */
import * as jwt from 'jsonwebtoken';

const {
  PerformanceDashboardService,
} = require('../../dist/modules/performance/service/dashboard');

const createQueryBuilder = (result: {
  rawOne?: any;
  rawMany?: any[];
}) => {
  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(result.rawOne || {}),
    getRawMany: jest.fn().mockResolvedValue(result.rawMany || []),
  };

  return qb;
};

describe('performance dashboard service', () => {
  test('should reject crossSummary when current role has no cross dashboard permission', async () => {
    const token = jwt.sign(
      {
        userId: 3001,
        username: 'employee_platform',
        roleIds: [3],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const service = new PerformanceDashboardService() as any;
    service.ctx = {
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:dashboard:summary']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn(),
    };
    service.midwayCache = {
      get: jest.fn(),
      set: jest.fn(),
    };

    await expect(service.crossSummary({})).rejects.toMatchObject({
      message: '无权限查看跨模块驾驶舱',
    });
    expect(service.midwayCache.get).not.toHaveBeenCalled();
    expect(service.midwayCache.set).not.toHaveBeenCalled();
  });

  test('should return crossSummary metric cards with unavailable status and isolated cache keys', async () => {
    const hrToken = jwt.sign(
      {
        userId: 1001,
        username: 'hr_admin',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );
    const managerToken = jwt.sign(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const createService = (token: string, perms: string[], departmentIds: number[]) => {
      const service = new PerformanceDashboardService() as any;
      const midwayCache = {
        get: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(undefined),
      };
      service.ctx = {
        headers: {
          authorization: token,
        },
        get: jest.fn().mockReturnValue(token),
      };
      service.baseSysMenuService = {
        getPerms: jest.fn().mockResolvedValue(perms),
      };
      service.baseSysPermsService = {
        departmentIds: jest.fn().mockResolvedValue(departmentIds),
      };
      service.midwayCache = midwayCache;
      return { service, midwayCache };
    };

    const hr = createService(
      hrToken,
      [
        'performance:dashboard:crossSummary',
        'performance:assessment:export',
      ],
      []
    );
    const manager = createService(
      managerToken,
      ['performance:dashboard:crossSummary'],
      [11, 12]
    );

    const hrResult = await hr.service.crossSummary({
      periodType: 'quarter',
      periodValue: '2026-Q2',
      metricCodes: ['training_pass_rate'],
    });
    const managerResult = await manager.service.crossSummary({
      periodType: 'quarter',
      periodValue: '2026-Q2',
      departmentId: 11,
      metricCodes: ['training_pass_rate'],
    });

    expect(hrResult).toEqual({
      metricCards: [
        {
          metricCode: 'training_pass_rate',
          metricLabel: '内训通关率',
          sourceDomain: 'training',
          metricValue: null,
          unit: '',
          periodType: 'quarter',
          periodValue: '2026-Q2',
          scopeType: 'global',
          departmentId: null,
          updatedAt: null,
          dataStatus: 'unavailable',
          statusText: '暂不可用',
        },
      ],
    });
    expect(managerResult).toEqual({
      metricCards: [
        {
          metricCode: 'training_pass_rate',
          metricLabel: '内训通关率',
          sourceDomain: 'training',
          metricValue: null,
          unit: '',
          periodType: 'quarter',
          periodValue: '2026-Q2',
          scopeType: 'department_tree',
          departmentId: 11,
          updatedAt: null,
          dataStatus: 'unavailable',
          statusText: '暂不可用',
        },
      ],
    });
    expect(hr.midwayCache.get).toHaveBeenCalledTimes(1);
    expect(hr.midwayCache.set).toHaveBeenCalledTimes(1);
    expect(manager.midwayCache.get).toHaveBeenCalledTimes(1);
    expect(manager.midwayCache.set).toHaveBeenCalledTimes(1);
    expect(hr.midwayCache.get.mock.calls[0][0]).toContain(
      'performance:dashboard:crossSummary:'
    );
    expect(manager.midwayCache.get.mock.calls[0][0]).toContain(
      'performance:dashboard:crossSummary:'
    );
    expect(hr.midwayCache.get.mock.calls[0][0]).not.toBe(
      manager.midwayCache.get.mock.calls[0][0]
    );
  });

  test('should reject crossSummary when manager requests out-of-scope department or unknown metric code', async () => {
    const token = jwt.sign(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const service = new PerformanceDashboardService() as any;
    service.ctx = {
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:dashboard:crossSummary']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11, 12]),
    };
    service.midwayCache = {
      get: jest.fn(),
      set: jest.fn(),
    };

    await expect(
      service.crossSummary({
        periodType: 'quarter',
        periodValue: '2026-Q2',
        departmentId: 999,
      })
    ).rejects.toMatchObject({
      message: '无权查看该部门范围跨模块驾驶舱',
    });

    await expect(
      service.crossSummary({
        periodType: 'quarter',
        periodValue: '2026-Q2',
        metricCodes: ['unknown_metric'],
      })
    ).rejects.toMatchObject({
      message: 'metricCodes 包含未冻结指标族',
    });
  });

  test('should reject summary when current role has no dashboard permission', async () => {
    const token = jwt.sign(
      {
        userId: 3001,
        username: 'employee_platform',
        roleIds: [3],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const service = new PerformanceDashboardService() as any;
    service.ctx = {
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:goal:page']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn(),
    };
    service.performanceAssessmentEntity = {
      createQueryBuilder: jest.fn(),
    };
    service.performanceGoalEntity = {
      createQueryBuilder: jest.fn(),
    };
    service.performanceIndicatorEntity = {
      createQueryBuilder: jest.fn(),
    };
    service.performanceSalaryEntity = {
      createQueryBuilder: jest.fn(),
    };

    await expect(service.summary({})).rejects.toMatchObject({
      message: '无权限查看绩效驾驶舱',
    });
    expect(service.performanceAssessmentEntity.createQueryBuilder).not.toHaveBeenCalled();
    expect(service.performanceGoalEntity.createQueryBuilder).not.toHaveBeenCalled();
  });

  test('should aggregate dashboard summary with real metric structure', async () => {
    const token = jwt.sign(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const averageQb = createQueryBuilder({
      rawOne: {
        averageScore: '86.666',
      },
    });
    const pendingQb = createQueryBuilder({
      rawOne: {
        pendingApprovalCount: '3',
      },
    });
    const goalQb = createQueryBuilder({
      rawOne: {
        totalCount: '8',
        completedCount: '6',
      },
    });
    const departmentQb = createQueryBuilder({
      rawMany: [
        {
          departmentId: '11',
          departmentName: '研发部',
          averageScore: '91.25',
          assessmentCount: '4',
        },
      ],
    });
    const gradeQb = createQueryBuilder({
      rawMany: [
        { grade: 'S', count: '1' },
        { grade: 'A', count: '2' },
        { grade: 'B', count: '1' },
      ],
    });
    const stageQb = createQueryBuilder({
      rawOne: {
        totalCount: '5',
        selfSubmittedCount: '4',
        managerApprovedCount: '2',
      },
    });
    const indicatorQb = createQueryBuilder({
      rawOne: {
        totalCount: '4',
        configuredCount: '3',
      },
    });
    const salaryQb = createQueryBuilder({
      rawOne: {
        totalCount: '3',
        archivedCount: '2',
      },
    });

    const service = new PerformanceDashboardService() as any;
    service.ctx = {
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:dashboard:summary',
        'performance:assessment:approve',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11, 12]),
    };
    service.performanceAssessmentEntity = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(averageQb)
        .mockReturnValueOnce(pendingQb)
        .mockReturnValueOnce(departmentQb)
        .mockReturnValueOnce(gradeQb)
        .mockReturnValueOnce(stageQb),
    };
    service.performanceGoalEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(goalQb),
    };
    service.performanceIndicatorEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(indicatorQb),
    };
    service.performanceSalaryEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(salaryQb),
    };

    const result = await service.summary({
      periodType: 'quarter',
      periodValue: '2026-Q2',
      departmentId: 11,
    });

    expect(result.averageScore).toBe(86.67);
    expect(result.pendingApprovalCount).toBe(3);
    expect(result.goalCompletionRate).toBe(75);
    expect(result.departmentDistribution).toEqual([
      {
        departmentId: 11,
        departmentName: '研发部',
        averageScore: 91.25,
        assessmentCount: 4,
      },
    ]);
    expect(result.gradeDistribution).toEqual([
      { grade: 'S', count: 1, ratio: 25 },
      { grade: 'A', count: 2, ratio: 50 },
      { grade: 'B', count: 1, ratio: 25 },
      { grade: 'C', count: 0, ratio: 0 },
    ]);
    expect(result.stageProgress).toEqual([
      {
        stageKey: 'indicatorConfigured',
        stageLabel: '指标库配置',
        completedCount: 3,
        totalCount: 4,
        completionRate: 75,
        sort: 1,
      },
      {
        stageKey: 'assessmentCreated',
        stageLabel: '评估单创建',
        completedCount: 5,
        totalCount: 5,
        completionRate: 100,
        sort: 2,
      },
      {
        stageKey: 'selfSubmitted',
        stageLabel: '自评提交',
        completedCount: 4,
        totalCount: 5,
        completionRate: 80,
        sort: 3,
      },
      {
        stageKey: 'managerApproved',
        stageLabel: '审批完成',
        completedCount: 2,
        totalCount: 5,
        completionRate: 40,
        sort: 4,
      },
      {
        stageKey: 'resultArchived',
        stageLabel: '结果归档',
        completedCount: 2,
        totalCount: 3,
        completionRate: 66.67,
        sort: 5,
      },
    ]);
    expect(service.baseSysMenuService.getPerms).toHaveBeenCalledWith([2]);
    expect(service.baseSysPermsService.departmentIds).toHaveBeenCalledWith(2001);
    expect(goalQb.andWhere).toHaveBeenCalledWith(
      'goal.startDate <= :periodEndDate',
      {
        periodEndDate: '2026-06-30',
      }
    );
    expect(goalQb.andWhere).toHaveBeenCalledWith(
      'goal.endDate >= :periodStartDate',
      {
        periodStartDate: '2026-04-01',
      }
    );
    expect(salaryQb.andWhere).toHaveBeenCalledWith('salary.periodValue = :periodValue', {
      periodValue: '2026-Q2',
    });
  });

  test('should return empty summary when manager requests out-of-scope department', async () => {
    const token = jwt.sign(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const service = new PerformanceDashboardService() as any;
    service.ctx = {
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:dashboard:summary',
        'performance:assessment:approve',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11, 12]),
    };
    service.performanceAssessmentEntity = {
      createQueryBuilder: jest.fn(),
    };
    service.performanceGoalEntity = {
      createQueryBuilder: jest.fn(),
    };
    service.performanceIndicatorEntity = {
      createQueryBuilder: jest.fn(),
    };
    service.performanceSalaryEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.summary({
      departmentId: 99,
    });

    expect(result).toEqual({
      averageScore: 0,
      pendingApprovalCount: 0,
      goalCompletionRate: 0,
      departmentDistribution: [],
      gradeDistribution: [
        { grade: 'S', count: 0, ratio: 0 },
        { grade: 'A', count: 0, ratio: 0 },
        { grade: 'B', count: 0, ratio: 0 },
        { grade: 'C', count: 0, ratio: 0 },
      ],
      stageProgress: [
        {
          stageKey: 'indicatorConfigured',
          stageLabel: '指标库配置',
          completedCount: 0,
          totalCount: 0,
          completionRate: 0,
          sort: 1,
        },
        {
          stageKey: 'assessmentCreated',
          stageLabel: '评估单创建',
          completedCount: 0,
          totalCount: 0,
          completionRate: 0,
          sort: 2,
        },
        {
          stageKey: 'selfSubmitted',
          stageLabel: '自评提交',
          completedCount: 0,
          totalCount: 0,
          completionRate: 0,
          sort: 3,
        },
        {
          stageKey: 'managerApproved',
          stageLabel: '审批完成',
          completedCount: 0,
          totalCount: 0,
          completionRate: 0,
          sort: 4,
        },
        {
          stageKey: 'resultArchived',
          stageLabel: '结果归档',
          completedCount: 0,
          totalCount: 0,
          completionRate: 0,
          sort: 5,
        },
      ],
    });
    expect(service.performanceAssessmentEntity.createQueryBuilder).not.toHaveBeenCalled();
    expect(service.performanceGoalEntity.createQueryBuilder).not.toHaveBeenCalled();
  });
});
