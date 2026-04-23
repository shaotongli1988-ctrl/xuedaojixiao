/// <reference types="jest" />
/**
 * 目标地图纯逻辑测试。
 * 这里负责验证模块 2 的进度计算、状态流转与输入校验，不负责数据库或接口联调。
 */
import * as jwt from 'jsonwebtoken';
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import {
  assertGoalUpdatable,
  calculateGoalProgressRate,
  resolveGoalStatusAfterProgress,
  resolveGoalStatusForStoredValue,
  validateGoalPayload,
} from '../../src/modules/performance/service/goal-helper';
import { PerformanceGoalService } from '../../src/modules/performance/service/goal';

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

describe('performance goal helper', () => {
  test('should calculate progress rate and cap at 100', () => {
    expect(calculateGoalProgressRate(50, 100)).toBe(50);
    expect(calculateGoalProgressRate(150, 100)).toBe(100);
  });

  test('should validate target value and date range', () => {
    expect(() =>
      validateGoalPayload({
        targetValue: 100,
        currentValue: 0,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      })
    ).not.toThrow();

    expect(() =>
      validateGoalPayload({
        targetValue: 0,
        currentValue: 0,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      })
    ).toThrow('目标值必须大于 0');

    expect(() =>
      validateGoalPayload({
        targetValue: 100,
        currentValue: -1,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      })
    ).toThrow('当前值不能小于 0');

    expect(() =>
      validateGoalPayload({
        targetValue: 100,
        currentValue: 0,
        startDate: '2026-04-30',
        endDate: '2026-04-01',
      })
    ).toThrow('开始日期不能晚于结束日期');
  });

  test('should resolve draft to in-progress and completed', () => {
    expect(resolveGoalStatusAfterProgress('draft', 10, 100)).toBe('in-progress');
    expect(resolveGoalStatusAfterProgress('in-progress', 100, 100)).toBe(
      'completed'
    );
  });

  test('should reject updating completed goal progress', () => {
    expect(() =>
      resolveGoalStatusAfterProgress('completed', 50, 100)
    ).toThrow('已完成目标不能继续更新进度');
  });

  test('should reject updating cancelled goal progress', () => {
    expect(() =>
      resolveGoalStatusAfterProgress('cancelled', 50, 100)
    ).toThrow('已取消目标不能继续更新进度');
  });

  test('should reject completed goal rollback', () => {
    expect(() => resolveGoalStatusForStoredValue('completed', 50, 100)).toThrow(
      '已完成目标不能回退为进行中'
    );
  });

  test('should allow editing only draft and in-progress goals', () => {
    expect(() => assertGoalUpdatable('draft')).not.toThrow();
    expect(() => assertGoalUpdatable('in-progress')).not.toThrow();
    expect(() => assertGoalUpdatable('completed')).toThrow(
      '当前状态不允许编辑目标'
    );
  });

  test('should scope goal page by user for non-admin token-only context', async () => {
    const token = jwt.sign(
      {
        userId: 321,
        username: 'employee_platform',
        roleIds: [3],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const andWhere = jest.fn().mockReturnThis();
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      andWhere,
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    const service = new PerformanceGoalService() as any;
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
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceGoalEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    attachAccessContext(service);

    const result = await service.page({});

    expect(service.baseSysMenuService.getPerms).toHaveBeenCalledWith([3]);
    expect(andWhere).toHaveBeenCalledWith('goal.employeeId = :userId', {
      userId: 321,
    });
    expect(result).toEqual({
      list: [],
      pagination: {
        page: 1,
        size: 20,
        total: 0,
      },
    });
  });
});

describe('performance goal service', () => {
  test('should reject progress update outside scoped goal and not write progress', async () => {
    const transaction = jest.fn().mockResolvedValue(undefined);

    const service = new PerformanceGoalService() as any;
    service.ctx = {
      admin: {
        userId: 2001,
        roleIds: [2],
        isAdmin: false,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:goal:progressUpdate']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.performanceGoalEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 7,
        employeeId: 3001,
        departmentId: 99,
        targetValue: 100,
        currentValue: 10,
        status: 'in-progress',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      }),
      manager: {
        transaction,
      },
    };
    service.info = jest.fn().mockResolvedValue({ id: 7 });
    attachAccessContext(service);

    await expect(
      service.progressUpdate({
        id: 7,
        currentValue: 60,
        remark: '越权更新',
      })
    ).rejects.toThrow('无权更新该目标进度');

    expect(transaction).not.toHaveBeenCalled();
    expect(service.info).not.toHaveBeenCalled();
  });

  test('should reject progress update for completed goal', async () => {
    const transaction = jest.fn().mockResolvedValue(undefined);

    const service = new PerformanceGoalService() as any;
    service.ctx = {
      admin: {
        userId: 321,
        roleIds: [3],
        isAdmin: false,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:goal:progressUpdate']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceGoalEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 8,
        employeeId: 321,
        departmentId: 88,
        targetValue: 100,
        currentValue: 100,
        status: 'completed',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      }),
      manager: {
        transaction,
      },
    };
    service.info = jest.fn().mockResolvedValue({ id: 8 });
    attachAccessContext(service);

    await expect(
      service.progressUpdate({
        id: 8,
        currentValue: 100,
      })
    ).rejects.toThrow('已完成目标不能继续更新进度');

    expect(transaction).not.toHaveBeenCalled();
    expect(service.info).not.toHaveBeenCalled();
  });
});
