/// <reference types="jest" />
/**
 * 会议管理服务测试。
 * 这里只验证主题 9 的关键权限、范围、状态和摘要字段裁剪，不覆盖真实数据库或运行态菜单导入。
 */
import { PerformanceMeetingService } from '../../src/modules/performance/service/meeting';

const createMeetingQueryBuilder = (rows: any[]) => {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
};

describe('performance meeting service', () => {
  test('should reject employee page access', async () => {
    const service = new PerformanceMeetingService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };

    await expect(service.page({ page: 1, size: 10 })).rejects.toThrow(
      '无权限查看会议列表'
    );
  });

  test('should reject manager add when organizer or participants are out of scope', async () => {
    const service = new PerformanceMeetingService() as any;
    service.ctx = {
      admin: {
        userId: 2,
        roleIds: [2],
      },
      meetingDepartmentIds: [11, 12],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:meeting:add']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11, 12]),
    };
    service.baseSysUserEntity = {
      findBy: jest.fn().mockResolvedValue([
        { id: 101, departmentId: 11 },
        { id: 102, departmentId: 99 },
      ]),
    };

    await expect(
      service.add({
        title: '季度复盘会',
        startDate: '2026-04-18 10:00:00',
        endDate: '2026-04-18 11:00:00',
        organizerId: 101,
        participantIds: [102],
      })
    ).rejects.toThrow('组织者或参与人超出部门范围');
  });

  test('should hide participant list in info response', async () => {
    const service = new PerformanceMeetingService() as any;
    service.ctx = {
      admin: {
        userId: 2,
        roleIds: [2],
      },
      meetingScopeUserIds: [101, 102, 103],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:meeting:info']),
    };
    service.performanceMeetingEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        title: '主题9联调会',
        code: 'MEETING-001',
        type: 'sync',
        description: '会议摘要',
        startDate: '2026-04-18 10:00:00',
        endDate: '2026-04-18 11:00:00',
        location: 'A1',
        organizerId: 101,
        participantIds: [102, 103],
        participantCount: 2,
        status: 'scheduled',
        createTime: '2026-04-18 09:00:00',
        updateTime: '2026-04-18 09:30:00',
      }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 101, name: '组织者A' }),
    };

    const result = await service.info(1);

    expect(result).toEqual({
      id: 1,
      title: '主题9联调会',
      code: 'MEETING-001',
      type: 'sync',
      description: '会议摘要',
      startDate: '2026-04-18 10:00:00',
      endDate: '2026-04-18 11:00:00',
      location: 'A1',
      organizerId: 101,
      organizerName: '组织者A',
      participantCount: 2,
      status: 'scheduled',
      createTime: '2026-04-18 09:00:00',
      updateTime: '2026-04-18 09:30:00',
    });
    expect(Object.prototype.hasOwnProperty.call(result, 'participantIds')).toBe(false);
  });

  test('should filter out meetings whose participants are outside manager scope', async () => {
    const qb = createMeetingQueryBuilder([
      {
        id: 1,
        title: '可见会议',
        code: 'M-1',
        type: 'sync',
        description: null,
        startDate: '2026-04-18 10:00:00',
        endDate: '2026-04-18 11:00:00',
        location: 'A1',
        organizerId: 101,
        participantIds: JSON.stringify([102]),
        participantCount: 1,
        status: 'scheduled',
        createTime: '2026-04-18 09:00:00',
        updateTime: '2026-04-18 09:30:00',
        organizerName: '组织者A',
        organizerDepartmentId: 11,
      },
      {
        id: 2,
        title: '越权会议',
        code: 'M-2',
        type: 'sync',
        description: null,
        startDate: '2026-04-18 10:00:00',
        endDate: '2026-04-18 11:00:00',
        location: 'A2',
        organizerId: 101,
        participantIds: JSON.stringify([999]),
        participantCount: 1,
        status: 'scheduled',
        createTime: '2026-04-18 09:00:00',
        updateTime: '2026-04-18 09:30:00',
        organizerName: '组织者A',
        organizerDepartmentId: 11,
      },
    ]);

    const service = new PerformanceMeetingService() as any;
    service.ctx = {
      admin: {
        userId: 2,
        roleIds: [2],
      },
      meetingScopeUserIds: [101, 102],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:meeting:page']),
    };
    service.performanceMeetingEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const result = await service.page({ page: 1, size: 10 });

    expect(result.pagination.total).toBe(1);
    expect(result.list).toHaveLength(1);
    expect(result.list[0]).toMatchObject({
      id: 1,
      title: '可见会议',
      participantCount: 1,
    });
  });

  test('should reject checkIn when meeting is not in progress', async () => {
    const service = new PerformanceMeetingService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:meeting:checkIn',
        'performance:salary:page',
      ]),
    };
    service.performanceMeetingEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        organizerId: 101,
        participantIds: [102],
        status: 'scheduled',
      }),
    };

    await expect(service.checkIn(1)).rejects.toThrow('当前状态不允许签到');
  });

  test('should allow updating scheduled meeting to in progress', async () => {
    const service = new PerformanceMeetingService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:meeting:update',
        'performance:salary:page',
      ]),
    };
    service.performanceMeetingEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        title: '主题9排期会',
        code: 'MEET-001',
        type: 'sync',
        description: '排期同步',
        startDate: '2026-04-18 10:00:00',
        endDate: '2026-04-18 11:00:00',
        location: 'A1',
        organizerId: 101,
        participantIds: [102],
        participantCount: 1,
        status: 'scheduled',
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    service.baseSysUserEntity = {
      findBy: jest.fn().mockResolvedValue([
        { id: 101, departmentId: 11 },
        { id: 102, departmentId: 11 },
      ]),
    };
    service.info = jest.fn().mockResolvedValue({
      id: 1,
      status: 'in_progress',
      participantCount: 1,
    });

    const result = await service.updateMeeting({
      id: 1,
      status: 'in_progress',
    });

    expect(service.performanceMeetingEntity.update).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({
        status: 'in_progress',
      })
    );
    expect(result).toEqual({
      id: 1,
      status: 'in_progress',
      participantCount: 1,
    });
  });

  test('should update meeting level checkIn timestamp when meeting is in progress', async () => {
    const service = new PerformanceMeetingService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:meeting:checkIn',
        'performance:salary:page',
      ]),
    };
    service.performanceMeetingEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        organizerId: 101,
        participantIds: [102],
        status: 'in_progress',
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    service.info = jest.fn().mockResolvedValue({
      id: 1,
      participantCount: 1,
      status: 'in_progress',
    });

    const result = await service.checkIn(1);

    expect(service.performanceMeetingEntity.update).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({
        lastCheckInTime: expect.any(String),
      })
    );
    expect(result).toEqual({
      id: 1,
      participantCount: 1,
      status: 'in_progress',
    });
  });

  test('should reject updating completed meetings', async () => {
    const service = new PerformanceMeetingService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:meeting:update',
        'performance:salary:page',
      ]),
    };
    service.performanceMeetingEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        title: '已结束会议',
        organizerId: 101,
        participantIds: [102],
        participantCount: 1,
        status: 'completed',
      }),
    };

    await expect(
      service.updateMeeting({
        id: 1,
        title: '尝试修改',
      })
    ).rejects.toThrow('当前状态不允许编辑');
  });

  test('should reject deleting non-scheduled meetings', async () => {
    const service = new PerformanceMeetingService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:meeting:delete',
        'performance:salary:page',
      ]),
    };
    service.performanceMeetingEntity = {
      findBy: jest.fn().mockResolvedValue([
        {
          id: 1,
          organizerId: 101,
          participantIds: [102],
          status: 'completed',
        },
      ]),
    };

    await expect(service.delete([1])).rejects.toThrow('当前状态不允许删除');
  });
});
