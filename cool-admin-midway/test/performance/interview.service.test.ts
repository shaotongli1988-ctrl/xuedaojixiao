/// <reference types="jest" />
/**
 * 招聘面试服务最小测试。
 * 这里只验证主题8的范围权限、终态编辑限制、删除限制和手工文本录入链路，不负责数据库或控制器联调。
 */
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import { PerformanceInterviewService } from '../../src/modules/performance/service/interview';

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
          resumePoolId: 21,
          recruitPlanId: 301,
          resumePoolSnapshot: JSON.stringify({
            id: 21,
            candidateName: '张三',
            targetDepartmentId: 11,
            targetDepartmentName: '研发部',
            targetPosition: '前端工程师',
            status: 'interviewing',
            recruitPlanId: 301,
            jobStandardId: 501,
          }),
          recruitPlanSnapshot: JSON.stringify({
            id: 301,
            title: '前端招聘计划',
            positionName: '前端工程师',
            targetDepartmentId: 11,
            targetDepartmentName: '研发部',
            headcount: 1,
            startDate: '2026-04-18',
            endDate: '2026-05-18',
            status: 'active',
            jobStandardId: 501,
          }),
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
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.performanceInterviewEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    attachAccessContext(service);

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
          resumePoolId: 21,
          recruitPlanId: 301,
          sourceSnapshot: null,
          resumePoolSummary: expect.objectContaining({
            id: 21,
            candidateName: '张三',
          }),
          resumePoolSnapshot: expect.objectContaining({
            id: 21,
            candidateName: '张三',
          }),
          recruitPlanSummary: expect.objectContaining({
            id: 301,
            title: '前端招聘计划',
          }),
          recruitPlanSnapshot: expect.objectContaining({
            id: 301,
            title: '前端招聘计划',
          }),
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
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 8, name: '面试官A' }),
    };
    service.performanceResumePoolEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 21,
        candidateName: '李四',
        targetDepartmentId: 11,
        targetPosition: '后端工程师',
        status: 'screening',
        recruitPlanId: 301,
        jobStandardId: 501,
      }),
    };
    service.performanceRecruitPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 301,
        title: '后端招聘计划',
        positionName: '后端工程师',
        targetDepartmentId: 11,
        headcount: 2,
        startDate: '2026-04-19',
        endDate: '2026-05-19',
        status: 'active',
        jobStandardId: 501,
      }),
    };
    service.performanceInterviewEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 12 }),
    };
    service.info = jest.fn().mockResolvedValue({
      id: 12,
      resumePoolId: 21,
      recruitPlanId: 301,
    });
    attachAccessContext(service);

    await expect(
      service.add({
        candidateName: '李四',
        position: '后端工程师',
        departmentId: null,
        interviewerId: 8,
        interviewDate: '2026-04-19 15:00:00',
        interviewType: 'technical',
        score: 90,
        resumePoolId: 21,
      })
    ).resolves.toEqual({
      id: 12,
      resumePoolId: 21,
      recruitPlanId: 301,
    });

    expect(service.performanceInterviewEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateName: '李四',
        position: '后端工程师',
        departmentId: null,
        interviewerId: 8,
        resumePoolId: 21,
        recruitPlanId: 301,
        sourceSnapshot: expect.objectContaining({
          sourceResource: 'resumePool',
          resumePoolId: 21,
          recruitPlanId: 301,
        }),
        resumePoolSnapshot: expect.objectContaining({ id: 21 }),
        recruitPlanSnapshot: expect.objectContaining({ id: 301 }),
        status: 'scheduled',
      })
    );
  });

  test('should persist canonical talentAsset source snapshot when adding interview from talent asset', async () => {
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
        .mockResolvedValue([
          'performance:interview:add',
          'performance:interview:info',
          'performance:interview:delete',
        ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.id === 8) {
          return Promise.resolve({ id: 8, name: '面试官A' });
        }
        return Promise.resolve(null);
      }),
    };
    service.performanceResumePoolEntity = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    service.performanceRecruitPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    service.performanceTalentAssetEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 88,
        candidateName: '赵六',
        targetDepartmentId: 11,
        targetPosition: '产品经理',
      }),
    };
    service.performanceInterviewEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 18 }),
    };
    service.info = jest.fn().mockResolvedValue({
      id: 18,
      sourceSnapshot: {
        sourceResource: 'talentAsset',
        talentAssetId: 88,
      },
    });
    attachAccessContext(service);

    await expect(
      service.add({
        candidateName: '赵六',
        position: '产品经理',
        departmentId: 11,
        interviewerId: 8,
        interviewDate: '2026-04-20 11:00:00',
        sourceSnapshot: {
          sourceResource: 'talentAsset',
          talentAssetId: 88,
          candidateName: '无效值',
          targetDepartmentId: 11,
          targetPosition: '无效岗位',
        },
      })
    ).resolves.toEqual({
      id: 18,
      sourceSnapshot: {
        sourceResource: 'talentAsset',
        talentAssetId: 88,
      },
    });

    expect(service.performanceInterviewEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceSnapshot: {
          sourceResource: 'talentAsset',
          talentAssetId: 88,
          candidateName: '赵六',
          targetDepartmentId: 11,
          targetPosition: '产品经理',
        },
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
    attachAccessContext(service);

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
    attachAccessContext(service);

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
    attachAccessContext(managerService);

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
    attachAccessContext(hrService);

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
    attachAccessContext(service);

    await expect(service.page({})).rejects.toThrow('无权限查看面试列表');
  });
});
