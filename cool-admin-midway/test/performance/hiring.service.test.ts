/// <reference types="jest" />
/**
 * 录用管理服务最小测试。
 * 这里只验证主题18冻结的主链、状态机、部门树范围和员工拒绝，不覆盖真实数据库或控制器联调。
 */
import { PerformanceHiringService } from '../../src/modules/performance/service/hiring';

const HR_PERMS = [
  'performance:hiring:page',
  'performance:hiring:info',
  'performance:hiring:add',
  'performance:hiring:updateStatus',
  'performance:hiring:close',
  'performance:salary:page',
];

const MANAGER_PERMS = [
  'performance:hiring:page',
  'performance:hiring:info',
  'performance:hiring:add',
  'performance:hiring:updateStatus',
  'performance:hiring:close',
];

function createHiringRecord(id: number, overrides: Partial<any> = {}) {
  return {
    id,
    candidateName: `候选人-${id}`,
    targetDepartmentId: 11,
    targetPosition: '后端工程师',
    decisionContent: '录用决策正文',
    sourceType: 'interview',
    sourceId: 41,
    sourceSnapshot: {
      status: 'scheduled',
    },
    interviewId: 41,
    resumePoolId: 21,
    recruitPlanId: 301,
    interviewSnapshot: {
      id: 41,
      candidateName: `候选人-${id}`,
      position: '后端工程师',
      departmentId: 11,
      interviewDate: '2026-04-18 15:00:00',
      interviewType: 'technical',
      interviewerId: 8,
      interviewerName: '面试官A',
      score: 88.5,
      status: 'scheduled',
      resumePoolId: 21,
      recruitPlanId: 301,
    },
    resumePoolSnapshot: {
      id: 21,
      candidateName: `候选人-${id}`,
      targetDepartmentId: 11,
      targetDepartmentName: '研发部',
      targetPosition: '后端工程师',
      phone: '13800000000',
      email: 'candidate@example.com',
      status: 'interviewing',
      recruitPlanId: 301,
      jobStandardId: 501,
    },
    recruitPlanSnapshot: {
      id: 301,
      title: '后端招聘计划',
      positionName: '后端工程师',
      targetDepartmentId: 11,
      targetDepartmentName: '研发部',
      headcount: 2,
      startDate: '2026-04-18',
      endDate: '2026-05-18',
      status: 'active',
      jobStandardId: 501,
    },
    status: 'offered',
    offeredAt: '2026-04-19 10:00:00',
    acceptedAt: null,
    rejectedAt: null,
    closedAt: null,
    closeReason: null,
    createTime: '2026-04-19 10:00:00',
    updateTime: '2026-04-19 10:00:00',
    ...overrides,
  };
}

function createPageQueryBuilder(rows: any[]) {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(rows.length),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
}

function createHrService() {
  const records = new Map<number, any>();
  records.set(1, createHiringRecord(1));
  const qb = createPageQueryBuilder([
    {
      ...createHiringRecord(1),
      targetDepartmentName: '研发部',
    },
  ]);
  let currentId = 1;

  const service = new PerformanceHiringService() as any;
  service.ctx = {
    admin: {
      userId: 1,
      username: 'hr_admin',
      roleIds: [1],
    },
  };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(HR_PERMS),
  };
  service.baseSysPermsService = {
    departmentIds: jest.fn().mockResolvedValue([]),
  };
  service.baseSysRoleEntity = {
    findBy: jest.fn().mockResolvedValue([]),
  };
  service.baseSysDepartmentEntity = {
    findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
  };
  service.baseSysUserEntity = {
    findOneBy: jest.fn().mockResolvedValue({ id: 8, name: '面试官A' }),
  };
  service.performanceInterviewEntity = {
    findOneBy: jest.fn().mockResolvedValue({
      id: 41,
      candidateName: '张三',
      position: '前端工程师',
      departmentId: 11,
      interviewerId: 8,
      interviewDate: '2026-04-18 15:00:00',
      interviewType: 'technical',
      score: 91,
      status: 'scheduled',
      resumePoolId: 21,
      recruitPlanId: 301,
    }),
  };
  service.performanceResumePoolEntity = {
    findOneBy: jest.fn().mockResolvedValue({
      id: 21,
      candidateName: '张三',
      targetDepartmentId: 11,
      targetPosition: '前端工程师',
      phone: '13800000000',
      email: 'zhangsan@example.com',
      status: 'interviewing',
      recruitPlanId: 301,
      jobStandardId: 501,
    }),
  };
  service.performanceRecruitPlanEntity = {
    findOneBy: jest.fn().mockResolvedValue({
      id: 301,
      title: '前端招聘计划',
      positionName: '前端工程师',
      targetDepartmentId: 11,
      headcount: 2,
      startDate: '2026-04-18',
      endDate: '2026-05-18',
      status: 'active',
      jobStandardId: 501,
    }),
  };
  service.performanceHiringEntity = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    findOneBy: jest.fn().mockImplementation((where: any) => {
      return Promise.resolve(records.get(Number(where.id)) || null);
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const nextId = ++currentId;
      const saved = createHiringRecord(nextId, payload);
      records.set(nextId, saved);
      return saved;
    }),
    update: jest.fn().mockImplementation(async (where: any, payload: any) => {
      const existing = records.get(Number(where.id));
      records.set(Number(where.id), {
        ...existing,
        ...payload,
        id: Number(where.id),
      });
    }),
  };

  return { service, qb };
}

describe('performance hiring service', () => {
  test('should support hr normal chain for page/add/updateStatus/close', async () => {
    const { service, qb } = createHrService();

    const pageResult = await service.page({ page: 1, size: 10, status: 'offered' });
    const infoResult = await service.info(1);
    const added = await service.add({
      candidateName: '张三',
      targetDepartmentId: 11,
      targetPosition: '前端工程师',
      hiringDecision: '新字段-拟发放 offer',
      decisionContent: '旧字段-应被覆盖',
      interviewId: 41,
    });
    const accepted = await service.updateStatus({
      id: added.id,
      status: 'accepted',
    });
    const added2 = await service.add({
      candidateName: '李四',
      targetDepartmentId: 11,
      targetPosition: '测试工程师',
      decisionContent: '二轮通过',
    });
    const closed = await service.close({
      id: added2.id,
      closeReason: '候选人已入职其他公司',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('hiring.status = :status', {
      status: 'offered',
    });
    expect(pageResult.list[0]).toMatchObject({
      id: 1,
      candidateName: '候选人-1',
      targetDepartmentName: '研发部',
      hiringDecision: '录用决策正文',
      sourceStatusSnapshot: 'scheduled',
      interviewId: 41,
      resumePoolId: 21,
      recruitPlanId: 301,
      interviewSummary: expect.objectContaining({ id: 41 }),
      resumePoolSummary: expect.objectContaining({ id: 21 }),
      recruitPlanSummary: expect.objectContaining({ id: 301 }),
      status: 'offered',
    });
    expect(infoResult).toMatchObject({
      id: 1,
      hiringDecision: '录用决策正文',
      sourceStatusSnapshot: 'scheduled',
      interviewId: 41,
      resumePoolId: 21,
      recruitPlanId: 301,
    });
    expect(added).toMatchObject({
      candidateName: '张三',
      status: 'offered',
      sourceType: 'interview',
      sourceId: 41,
      hiringDecision: '新字段-拟发放 offer',
      decisionContent: '新字段-拟发放 offer',
      sourceStatusSnapshot: 'scheduled',
      interviewId: 41,
      resumePoolId: 21,
      recruitPlanId: 301,
      interviewSnapshot: expect.objectContaining({ id: 41 }),
      resumePoolSnapshot: expect.objectContaining({ id: 21 }),
      recruitPlanSnapshot: expect.objectContaining({ id: 301 }),
    });
    expect(accepted).toMatchObject({
      id: added.id,
      status: 'accepted',
    });
    expect(accepted.acceptedAt).toBeTruthy();
    expect(closed).toMatchObject({
      id: added2.id,
      status: 'closed',
      closeReason: '候选人已入职其他公司',
    });
    expect(closed.closedAt).toBeTruthy();
  });

  test('should reject illegal transitions and invalid add status', async () => {
    const { service } = createHrService();

    await expect(
      service.updateStatus({
        id: 1,
        status: 'closed',
      })
    ).rejects.toThrow('updateStatus 仅支持 accepted 或 rejected');

    await expect(
      service.add({
        candidateName: '王五',
        targetDepartmentId: 11,
        status: 'rejected',
      })
    ).rejects.toThrow('新增录用状态只能为 offered');

    await expect(
      service.close({
        id: 1,
        closeReason: '',
      })
    ).rejects.toThrow('关闭原因不能为空且长度不能超过 2000');
  });

  test('should scope manager page and reject manager add outside department tree', async () => {
    const qb = createPageQueryBuilder([
      {
        ...createHiringRecord(1),
        targetDepartmentName: '研发部',
      },
    ]);

    const service = new PerformanceHiringService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(MANAGER_PERMS),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.baseSysRoleEntity = {
      findBy: jest.fn().mockResolvedValue([{ id: 2, name: '部门经理', label: 'manager' }]),
    };
    service.performanceHiringEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const pageResult = await service.page({ page: 1, size: 10 });

    expect(pageResult.list).toHaveLength(1);
    expect(qb.andWhere).toHaveBeenCalledWith('hiring.targetDepartmentId in (:...departmentIds)', {
      departmentIds: [11],
    });

    await expect(
      service.add({
        candidateName: '越权候选人',
        targetDepartmentId: 99,
      })
    ).rejects.toThrow('无权操作该录用单');
  });

  test('should reject employee access', async () => {
    const service = new PerformanceHiringService() as any;
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

    await expect(service.page({ page: 1, size: 10 })).rejects.toThrow('无权限查看录用列表');
  });

  test('should lock terminal states for updateStatus and close', async () => {
    const service = new PerformanceHiringService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(HR_PERMS),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysRoleEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.performanceHiringEntity = {
      findOneBy: jest.fn().mockResolvedValue(
        createHiringRecord(7, {
          status: 'accepted',
          acceptedAt: '2026-04-19 12:00:00',
        })
      ),
      update: jest.fn(),
    };

    await expect(
      service.updateStatus({
        id: 7,
        status: 'rejected',
      })
    ).rejects.toThrow('当前状态不允许更新录用状态');

    await expect(
      service.close({
        id: 7,
        closeReason: '终态后尝试关闭',
      })
    ).rejects.toThrow('当前状态不允许关闭录用单');
  });
});
