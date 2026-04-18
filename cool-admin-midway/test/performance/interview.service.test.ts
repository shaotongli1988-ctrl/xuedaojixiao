/// <reference types="jest" />
/**
 * 招聘面试服务最小测试。
 * 这里只验证主题8的范围权限、终态编辑限制、删除限制和手工文本录入链路，不负责数据库或控制器联调。
 */
import { PerformanceInterviewService } from '../../src/modules/performance/service/interview';

describe('performance interview service', () => {
  test('should scope interview page by department for manager', async () => {
    const andWhere = jest.fn().mockReturnThis();
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      andWhere,
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          candidateName: '张三',
          position: '前端工程师',
          departmentId: 11,
          interviewerId: 8,
          interviewerName: '面试官A',
          interviewDate: '2026-04-18 10:00:00',
          interviewType: 'technical',
          score: '88.50',
          status: 'scheduled',
          createTime: '2026-04-18 09:00:00',
          updateTime: '2026-04-18 09:00:00',
        },
      ]),
    };

    const service = new PerformanceInterviewService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:interview:page', 'performance:interview:info']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.performanceInterviewEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const result = await service.page({
      page: 1,
      size: 10,
      candidateName: '张',
      status: 'scheduled',
      startDate: '2026-04-18',
      endDate: '2026-04-18',
    });

    expect(andWhere).toHaveBeenCalledWith('interview.departmentId in (:...departmentIds)', {
      departmentIds: [11],
    });
    expect(andWhere).toHaveBeenCalledWith('interview.status = :status', {
      status: 'scheduled',
    });
    expect(andWhere).toHaveBeenCalledWith('interview.interviewDate >= :startDate', {
      startDate: '2026-04-18 00:00:00',
    });
    expect(andWhere).toHaveBeenCalledWith('interview.interviewDate <= :endDate', {
      endDate: '2026-04-18 23:59:59',
    });
    expect(result).toEqual({
      list: [
        {
          id: 1,
          candidateName: '张三',
          position: '前端工程师',
          departmentId: 11,
          interviewerId: 8,
          interviewerName: '面试官A',
          interviewDate: '2026-04-18 10:00:00',
          interviewType: 'technical',
          score: 88.5,
          status: 'scheduled',
          createTime: '2026-04-18 09:00:00',
          updateTime: '2026-04-18 09:00:00',
        },
      ],
      pagination: {
        page: 1,
        size: 10,
        total: 1,
      },
    });
  });

  test('should allow hr add with manual candidate text and null department', async () => {
    const service = new PerformanceInterviewService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:interview:add', 'performance:interview:info', 'performance:interview:delete']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 8, name: '面试官A' }),
    };
    service.performanceInterviewEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 12 }),
    };
    service.info = jest.fn().mockResolvedValue({ id: 12 });

    await expect(
      service.add({
        candidateName: '李四',
        position: '后端工程师',
        departmentId: null,
        interviewerId: 8,
        interviewDate: '2026-04-19 15:00:00',
        interviewType: 'technical',
        score: 90,
      })
    ).resolves.toEqual({ id: 12 });

    expect(service.performanceInterviewEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateName: '李四',
        position: '后端工程师',
        departmentId: null,
        interviewerId: 8,
        status: 'scheduled',
      })
    );
  });

  test('should reject manager add without scoped department', async () => {
    const service = new PerformanceInterviewService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:interview:add']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 8, name: '面试官A' }),
    };

    await expect(
      service.add({
        candidateName: '王五',
        position: '测试工程师',
        interviewerId: 8,
        interviewDate: '2026-04-20 11:00:00',
      })
    ).rejects.toThrow('部门经理必须选择归属部门');
  });

  test('should reject updating terminal interview', async () => {
    const service = new PerformanceInterviewService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:interview:update', 'performance:interview:delete']),
    };
    service.performanceInterviewEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 15,
        candidateName: '赵六',
        position: '产品经理',
        departmentId: 11,
        interviewerId: 8,
        interviewDate: '2026-04-21 10:00:00',
        interviewType: 'manager',
        score: 85,
        status: 'completed',
      }),
    };

    await expect(
      service.updateInterview({
        id: 15,
        score: 90,
      })
    ).rejects.toThrow('当前状态不允许编辑');
  });

  test('should reject delete for manager and non-scheduled interviews', async () => {
    const managerService = new PerformanceInterviewService() as any;
    managerService.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    managerService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:interview:page']),
    };

    await expect(managerService.delete([1])).rejects.toThrow('无权限删除面试');

    const hrService = new PerformanceInterviewService() as any;
    hrService.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    hrService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:interview:delete']),
    };
    hrService.performanceInterviewEntity = {
      findBy: jest.fn().mockResolvedValue([
        {
          id: 7,
          status: 'completed',
        },
      ]),
    };

    await expect(hrService.delete([7])).rejects.toThrow('当前状态不允许删除');
  });

  test('should reject employee page access', async () => {
    const service = new PerformanceInterviewService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        username: 'employee_platform',
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };

    await expect(service.page({})).rejects.toThrow('无权限查看面试列表');
  });
});
