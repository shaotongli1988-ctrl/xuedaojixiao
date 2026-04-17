/// <reference types="jest" />
/**
 * 指标库服务测试。
 * 这里只验证模块 4 的关键权限与校验规则，不覆盖真实数据库或共享鉴权链路。
 */
import { PerformanceIndicatorService } from '../../src/modules/performance/service/indicator';

describe('performance indicator service', () => {
  test('should filter indicator page by status', async () => {
    const andWhere = jest.fn().mockReturnThis();
    const qb = {
      select: jest.fn().mockReturnThis(),
      andWhere,
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: '执行力',
          code: 'EXECUTION',
          category: 'assessment',
          weight: '20.00',
          scoreScale: '100',
          applyScope: 'all',
          description: '执行结果',
          status: '1',
          createTime: '2026-04-17 12:00:00',
          updateTime: '2026-04-17 12:00:00',
        },
      ]),
    };

    const service = new PerformanceIndicatorService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:indicator:page', 'performance:indicator:info']),
    };
    service.performanceIndicatorEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const result = await service.page({ page: 1, size: 10, status: 1 });

    expect(andWhere).toHaveBeenCalledWith('indicator.status = :status', {
      status: 1,
    });
    expect(result).toEqual({
      list: [
        {
          id: 1,
          name: '执行力',
          code: 'EXECUTION',
          category: 'assessment',
          weight: 20,
          scoreScale: 100,
          applyScope: 'all',
          description: '执行结果',
          status: 1,
          createTime: '2026-04-17 12:00:00',
          updateTime: '2026-04-17 12:00:00',
        },
      ],
      pagination: {
        page: 1,
        size: 10,
        total: 1,
      },
    });
  });

  test('should reject duplicated code on add', async () => {
    const service = new PerformanceIndicatorService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:indicator:add']),
    };
    service.performanceIndicatorEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 9, code: 'TEAM_WORK' }),
    };

    await expect(
      service.add({
        name: '团队协作',
        code: 'TEAM_WORK',
        category: 'assessment',
        weight: 20,
        scoreScale: 100,
        applyScope: 'all',
        status: 1,
      })
    ).rejects.toThrow('指标编码已存在');
  });

  test('should reject non-hr page access', async () => {
    const service = new PerformanceIndicatorService() as any;
    service.ctx = {
      admin: {
        userId: 2,
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };

    await expect(service.page({})).rejects.toThrow('无权限查看指标库');
  });
});
