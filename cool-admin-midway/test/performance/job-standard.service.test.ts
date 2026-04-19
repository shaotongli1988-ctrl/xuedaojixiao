/// <reference types="jest" />
/**
 * 职位标准服务最小测试。
 * 这里只验证主题17冻结的状态流、角色权限、部门树只读范围和字段边界，不覆盖真实数据库或控制器联调。
 */
import { PerformanceJobStandardService } from '../../src/modules/performance/service/job-standard';

const HR_PERMS = [
  'performance:jobStandard:page',
  'performance:jobStandard:info',
  'performance:jobStandard:add',
  'performance:jobStandard:update',
  'performance:jobStandard:setStatus',
];

const MANAGER_PERMS = [
  'performance:jobStandard:page',
  'performance:jobStandard:info',
];

function createRecord(id: number, overrides: Partial<any> = {}) {
  return {
    id,
    positionName: `职位标准-${id}`,
    targetDepartmentId: 11,
    jobLevel: 'P6',
    profileSummary: '岗位画像摘要',
    requirementSummary: '任职要求摘要',
    skillTagList: ['Node.js', 'Midway'],
    interviewTemplateSummary: '面试模板摘要',
    status: 'draft',
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
  const pageRows = [
    {
      ...createRecord(1, {
        positionName: '联调-主题17平台职位标准',
        targetDepartmentName: '平台组',
        status: 'active',
        skillTagList: JSON.stringify(['Node.js', 'Midway'])
      }),
    },
  ];
  records.set(1, createRecord(1, { positionName: '联调-主题17平台职位标准', status: 'draft' }));

  const qb = createPageQueryBuilder(pageRows);
  let currentId = 1;

  const service = new PerformanceJobStandardService() as any;
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
  service.baseSysDepartmentEntity = {
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (where.id === 11) {
        return Promise.resolve({ id: 11, name: '平台组' });
      }
      return Promise.resolve(null);
    }),
  };
  service.performanceJobStandardEntity = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    findOneBy: jest.fn().mockImplementation((where: any) => {
      return Promise.resolve(records.get(Number(where.id)) || null);
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const nextId = payload.id ? Number(payload.id) : ++currentId;
      const saved = createRecord(nextId, payload);
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

  return { service, qb, records };
}

describe('performance job standard service', () => {
  test('should support hr main flow and keep summary fields stable across inactive transition', async () => {
    const { service, qb } = createHrService();

    const pageResult = await service.page({
      page: 1,
      size: 10,
      keyword: '主题17',
      status: 'active',
    });
    const addResult = await service.add({
      positionName: '新增职位标准',
      targetDepartmentId: 11,
      jobLevel: 'P7',
      profileSummary: '新增岗位画像',
      requirementSummary: '新增任职要求',
      skillTagList: ['TypeScript', '联调'],
      interviewTemplateSummary: '新增模板摘要',
    });
    const updated = await service.updateJobStandard({
      id: addResult.id,
      positionName: '新增职位标准-更新',
      targetDepartmentId: 11,
      jobLevel: 'P8',
      profileSummary: '更新岗位画像',
      requirementSummary: '更新任职要求',
      skillTagList: ['TypeScript', '联调', 'Midway'],
      interviewTemplateSummary: '更新模板摘要',
    });
    const activated = await service.setStatus({
      id: addResult.id,
      status: 'active',
    });
    const inactivated = await service.setStatus({
      id: addResult.id,
      status: 'inactive',
    });
    const reactivated = await service.setStatus({
      id: addResult.id,
      status: 'active',
    });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'jobStandard.status = :status',
      expect.objectContaining({ status: 'active' })
    );
    expect(pageResult.list[0]).toMatchObject({
      id: 1,
      positionName: '联调-主题17平台职位标准',
      targetDepartmentName: '平台组',
      skillTagList: ['Node.js', 'Midway'],
      status: 'active',
    });
    expect(addResult).toMatchObject({
      positionName: '新增职位标准',
      status: 'draft',
    });
    expect(updated).toMatchObject({
      positionName: '新增职位标准-更新',
      jobLevel: 'P8',
      status: 'draft',
    });
    expect(activated.status).toBe('active');
    expect(inactivated.status).toBe('inactive');
    expect(inactivated.profileSummary).toBe(activated.profileSummary);
    expect(inactivated.requirementSummary).toBe(activated.requirementSummary);
    expect(inactivated.interviewTemplateSummary).toBe(
      activated.interviewTemplateSummary
    );
    expect(inactivated.skillTagList).toEqual(activated.skillTagList);
    expect(reactivated.status).toBe('active');
    expect(Object.prototype.hasOwnProperty.call(reactivated, 'salaryRange')).toBe(
      false
    );
    expect(
      Object.prototype.hasOwnProperty.call(reactivated, 'interviewComment')
    ).toBe(false);
  });

  test('should enforce manager read-only scope and deny out-of-scope detail', async () => {
    const service = new PerformanceJobStandardService() as any;
    const qb = createPageQueryBuilder([
      {
        ...createRecord(1, {
          positionName: '联调-主题17平台职位标准',
          targetDepartmentName: '平台组',
          status: 'active',
          skillTagList: JSON.stringify(['Node.js'])
        }),
      },
    ]);

    service.ctx = {
      admin: {
        userId: 2,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(MANAGER_PERMS),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11, 12]),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '平台组' }),
    };
    service.performanceJobStandardEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (Number(where.id) === 1) {
          return Promise.resolve(createRecord(1, { status: 'active' }));
        }
        if (Number(where.id) === 2) {
          return Promise.resolve(
            createRecord(2, {
              positionName: '联调-主题17销售职位标准',
              targetDepartmentId: 99,
              status: 'draft',
            })
          );
        }
        return Promise.resolve(null);
      }),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const pageResult = await service.page({ page: 1, size: 10 });
    const infoResult = await service.info(1);

    expect(qb.andWhere).toHaveBeenCalledWith(
      'jobStandard.targetDepartmentId in (:...departmentIds)',
      { departmentIds: [11, 12] }
    );
    expect(pageResult.list).toHaveLength(1);
    expect(infoResult.positionName).toBe('职位标准-1');

    await expect(
      service.add({
        positionName: '经理越权新增',
        targetDepartmentId: 11,
      })
    ).rejects.toThrow('无权限新增职位标准');
    await expect(
      service.updateJobStandard({
        id: 1,
        positionName: '经理越权修改',
        targetDepartmentId: 11,
      })
    ).rejects.toThrow('无权限修改职位标准');
    await expect(
      service.setStatus({
        id: 1,
        status: 'inactive',
      })
    ).rejects.toThrow('无权限更新职位标准状态');
    await expect(service.info(2)).rejects.toThrow('无权查看该职位标准');
  });

  test('should reject employee page access and illegal transitions', async () => {
    const service = new PerformanceJobStandardService() as any;

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

    await expect(service.page({})).rejects.toThrow('无权限查看职位标准列表');

    const { service: hrService } = createHrService();
    await expect(
      hrService.setStatus({
        id: 1,
        status: 'inactive',
      })
    ).rejects.toThrow('当前状态不允许切换到目标状态');
  });
});
