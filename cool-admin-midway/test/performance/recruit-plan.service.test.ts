/// <reference types="jest" />
/**
 * 招聘计划服务测试。
 * 这里只验证主题16备案制扩展版的主链、部门树权限、导入导出、删除限制和状态机约束。
 */
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import { PerformanceRecruitPlanService } from '../../src/modules/performance/service/recruit-plan';

const HR_PERMS = [
  'performance:recruitPlan:page',
  'performance:recruitPlan:info',
  'performance:recruitPlan:add',
  'performance:recruitPlan:update',
  'performance:recruitPlan:delete',
  'performance:recruitPlan:import',
  'performance:recruitPlan:export',
  'performance:recruitPlan:submit',
  'performance:recruitPlan:close',
  'performance:recruitPlan:void',
  'performance:recruitPlan:reopen',
];

const MANAGER_PERMS = HR_PERMS.filter(
  item => item !== 'performance:recruitPlan:export'
);

const createQueryBuilder = (rows: any[]) => {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(rows.length),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
};

const attachAccessContext = (service: any) => {
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
};

const createService = (options?: {
  perms?: string[];
  departmentIds?: number[];
  plan?: any;
  pageRows?: any[];
  downstreamCounts?: {
    resume?: number;
    interview?: number;
    hiring?: number;
  };
}) => {
  const service = new PerformanceRecruitPlanService() as any;
  const plan = {
    id: 1,
    title: '主题16-平台工程师招聘',
    targetDepartmentId: 11,
    positionName: '平台工程师',
    headcount: 2,
    startDate: '2026-04-20',
    endDate: '2026-05-31',
    recruiterId: 101,
    requirementSummary: '主题16联调招聘计划',
    jobStandardId: 501,
    jobStandardSnapshot: {
      id: 501,
      positionName: '平台工程师',
      jobLevel: 'P6',
      targetDepartmentId: 11,
      targetDepartmentName: '研发中心',
      status: 'active',
      requirementSummary: '熟悉平台工程体系',
    },
    status: 'draft',
    createTime: '2026-04-19 10:00:00',
    updateTime: '2026-04-19 10:00:00',
    ...(options?.plan || {}),
  };
  const rows =
    options?.pageRows || [
      {
        id: 1,
        title: '主题16-平台工程师招聘',
        targetDepartmentId: 11,
        targetDepartmentName: '研发中心',
        positionName: '平台工程师',
        headcount: 2,
        startDate: '2026-04-20',
        endDate: '2026-05-31',
        recruiterId: 101,
        recruiterName: 'HR管理员',
        requirementSummary: '主题16联调招聘计划',
        jobStandardId: 501,
        jobStandardSnapshot: JSON.stringify({
          id: 501,
          positionName: '平台工程师',
          jobLevel: 'P6',
          targetDepartmentId: 11,
          targetDepartmentName: '研发中心',
          status: 'active',
          requirementSummary: '熟悉平台工程体系',
        }),
        status: 'draft',
        createTime: '2026-04-19 10:00:00',
        updateTime: '2026-04-19 10:00:00',
      },
    ];
  const qb = createQueryBuilder(rows);
  const savedPayloads: any[] = [];
  let deleted = false;

  service.ctx = {
    admin: {
      userId: 1,
      username: 'hr_admin',
      roleIds: [1],
    },
  };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(options?.perms || HR_PERMS),
  };
  service.baseSysPermsService = {
    departmentIds: jest
      .fn()
      .mockResolvedValue(options?.departmentIds || [11, 12, 13]),
  };
  service.baseSysDepartmentEntity = {
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (where.id === 11) {
        return Promise.resolve({ id: 11, name: '研发中心' });
      }
      if (where.id === 12) {
        return Promise.resolve({ id: 12, name: '销售中心' });
      }
      return Promise.resolve(null);
    }),
  };
  service.baseSysUserEntity = {
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (where.id === 101) {
        return Promise.resolve({ id: 101, name: 'HR管理员' });
      }
      if (where.id === 102) {
        return Promise.resolve({ id: 102, name: '研发经理' });
      }
      return Promise.resolve(null);
    }),
  };
  service.performanceJobStandardEntity = {
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (where.id === 501) {
        return Promise.resolve({
          id: 501,
          positionName: '平台工程师',
          jobLevel: 'P6',
          targetDepartmentId: 11,
          requirementSummary: '熟悉平台工程体系',
          status: 'active',
        });
      }
      return Promise.resolve(null);
    }),
  };
  service.spaceInfoEntity = {
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (where.id === 2001) {
        return Promise.resolve({
          id: 2001,
          name: 'recruit-plan-import.xlsx',
          url: 'https://example.com/recruit-plan-import.xlsx',
        });
      }
      return Promise.resolve(null);
    }),
  };
  service.performanceRecruitPlanEntity = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (deleted) {
        return Promise.resolve(null);
      }
      if (where.id === plan.id) {
        return Promise.resolve(plan);
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    save: jest.fn().mockImplementation(async (payload: any) => {
      savedPayloads.push(payload);
      Object.assign(plan, payload, { id: plan.id });
      return { id: savedPayloads.length === 1 ? plan.id : plan.id + savedPayloads.length };
    }),
    update: jest.fn().mockImplementation(async (_where: any, payload: any) => {
      Object.assign(plan, payload);
      return undefined;
    }),
    delete: jest.fn().mockImplementation(async () => {
      deleted = true;
      return undefined;
    }),
  };
  service.performanceResumePoolEntity = {
    count: jest.fn().mockResolvedValue(options?.downstreamCounts?.resume || 0),
  };
  service.performanceInterviewEntity = {
    count: jest.fn().mockResolvedValue(options?.downstreamCounts?.interview || 0),
  };
  service.performanceHiringEntity = {
    count: jest.fn().mockResolvedValue(options?.downstreamCounts?.hiring || 0),
  };
  attachAccessContext(service);

  return { service, qb, plan, savedPayloads };
};

describe('performance recruit plan service', () => {
  test('should support备案制主链 and keep summary field boundary aligned', async () => {
    const { service, qb, savedPayloads } = createService();

    const pageResult = await service.page({ page: 1, size: 10, keyword: '平台' });
    const infoResult = await service.info(1);
    const addResult = await service.add({
      title: '主题16-平台工程师招聘',
      targetDepartmentId: 11,
      positionName: '平台工程师',
      headcount: 2,
      startDate: '2026-04-20',
      endDate: '2026-05-31',
      recruiterId: 101,
      requirementSummary: '主题16联调招聘计划',
      jobStandardId: 501,
    });
    const updateResult = await service.updatePlan({
      id: 1,
      title: '主题16-平台工程师招聘-更新',
      targetDepartmentId: 11,
      positionName: '平台工程师',
      headcount: 3,
      startDate: '2026-04-20',
      endDate: '2026-06-15',
      recruiterId: 101,
      requirementSummary: '更新后的需求摘要',
      jobStandardId: 501,
    });
    const submitResult = await service.submitPlan({ id: 1 });
    const closeResult = await service.closePlan({ id: 1 });
    const reopenResult = await service.reopenPlan({ id: 1 });
    const voidResult = await service.voidPlan({ id: 1 });

    expect(qb.select).toHaveBeenCalled();
    expect(pageResult.list[0]).toMatchObject({
      id: 1,
      title: '主题16-平台工程师招聘',
      targetDepartmentName: '研发中心',
      jobStandardId: 501,
      jobStandardSummary: expect.objectContaining({
        id: 501,
        positionName: '平台工程师',
      }),
    });
    expect(infoResult).toMatchObject({
      id: 1,
      recruiterName: 'HR管理员',
      requirementSummary: '主题16联调招聘计划',
      jobStandardId: 501,
      jobStandardSnapshot: expect.objectContaining({
        id: 501,
        positionName: '平台工程师',
      }),
    });
    expect(infoResult).not.toHaveProperty('candidateList');
    expect(infoResult).not.toHaveProperty('budgetDetail');
    expect(addResult).toMatchObject({ id: 1, status: 'draft' });
    expect(updateResult).toMatchObject({
      id: 1,
      title: '主题16-平台工程师招聘-更新',
      headcount: 3,
      status: 'draft',
    });
    expect(submitResult).toMatchObject({ id: 1, status: 'active' });
    expect(closeResult).toMatchObject({ id: 1, status: 'closed' });
    expect(reopenResult).toMatchObject({ id: 1, status: 'active' });
    expect(voidResult).toMatchObject({ id: 1, status: 'voided' });
    expect(savedPayloads[0]).toMatchObject({
      title: '主题16-平台工程师招聘',
      jobStandardId: 501,
      status: 'draft',
    });
    expect(service.performanceRecruitPlanEntity.update).toHaveBeenNthCalledWith(
      1,
      { id: 1 },
      expect.objectContaining({
        title: '主题16-平台工程师招聘-更新',
        headcount: 3,
        jobStandardId: 501,
        status: 'draft',
      })
    );
    expect(service.performanceRecruitPlanEntity.update).toHaveBeenNthCalledWith(
      2,
      { id: 1 },
      { status: 'active' }
    );
    expect(service.performanceRecruitPlanEntity.update).toHaveBeenNthCalledWith(
      3,
      { id: 1 },
      { status: 'closed' }
    );
    expect(service.performanceRecruitPlanEntity.update).toHaveBeenNthCalledWith(
      4,
      { id: 1 },
      { status: 'active' }
    );
    expect(service.performanceRecruitPlanEntity.update).toHaveBeenNthCalledWith(
      5,
      { id: 1 },
      { status: 'voided' }
    );
  });

  test('should support import/export/delete and manager scope rules', async () => {
    const { service } = createService();

    const importResult = await service.importPlans({
      fileId: 2001,
      rows: [
        {
          title: '主题16-导入招聘计划',
          targetDepartmentId: 11,
          positionName: '后端工程师',
          headcount: 1,
          startDate: '2026-04-21',
          endDate: '2026-05-30',
          recruiterId: 101,
          requirementSummary: '导入样例',
        },
      ],
    });
    const exportResult = await service.exportPlans({
      keyword: '主题16',
      status: 'draft',
    });
    const deleteResult = await service.deletePlan({ id: 1 });

    expect(importResult).toMatchObject({
      fileId: 2001,
      importedCount: 1,
      skippedCount: 0,
    });
    expect(exportResult[0]).toMatchObject({
      id: 1,
      title: '主题16-平台工程师招聘',
      targetDepartmentName: '研发中心',
    });
    expect(deleteResult).toMatchObject({ id: 1, deleted: true });
    await expect(service.info(1)).rejects.toThrow('数据不存在');
  });

  test('should reject delete when downstream references exist', async () => {
    const { service } = createService({
      downstreamCounts: {
        resume: 1,
      },
    });

    await expect(service.deletePlan({ id: 1 })).rejects.toThrow(
      '当前招聘计划已被下游引用，不允许删除'
    );
    expect(service.performanceResumePoolEntity.count).toHaveBeenCalledWith({
      where: { recruitPlanId: 1 },
    });
    expect(service.performanceRecruitPlanEntity.delete).not.toHaveBeenCalled();
  });

  test('should reject out-of-scope manager operations and export', async () => {
    const { service, qb } = createService({
      perms: MANAGER_PERMS,
      departmentIds: [11],
      plan: {
        id: 2,
        title: '主题16-跨部门招聘',
        targetDepartmentId: 12,
        positionName: '销售顾问',
        headcount: 1,
        startDate: '2026-04-20',
        endDate: '2026-05-31',
        recruiterId: 102,
        requirementSummary: '跨部门样例',
        status: 'draft',
      },
      pageRows: [
        {
          id: 3,
          title: '主题16-经理可见招聘',
          targetDepartmentId: 11,
          targetDepartmentName: '研发中心',
          positionName: '前端工程师',
          headcount: 1,
          startDate: '2026-04-20',
          endDate: '2026-05-31',
          recruiterId: 102,
          recruiterName: '研发经理',
          requirementSummary: '范围内样例',
          status: 'draft',
          createTime: '2026-04-19 11:00:00',
          updateTime: '2026-04-19 11:00:00',
        },
      ],
    });

    await service.page({ page: 1, size: 10 });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'plan.targetDepartmentId in (:...departmentIds)',
      { departmentIds: [11] }
    );
    await expect(service.info(2)).rejects.toThrow('无权查看该招聘计划');
    await expect(
      service.add({
        title: '主题16-跨部门新建',
        targetDepartmentId: 12,
        positionName: '销售顾问',
        headcount: 1,
        startDate: '2026-04-20',
        endDate: '2026-05-31',
      })
    ).rejects.toThrow('无权操作该招聘计划');
    await expect(service.exportPlans({})).rejects.toThrow('无权限导出招聘计划');
  });

  test('should reject employee page access and illegal state transitions', async () => {
    const { service } = createService({
      perms: [],
      departmentIds: [11],
    });

    await expect(service.page({ page: 1, size: 10 })).rejects.toThrow(
      '无权限查看招聘计划列表'
    );

    const { service: activeService } = createService({
      plan: {
        id: 4,
        title: '主题16-已生效招聘',
        targetDepartmentId: 11,
        positionName: '平台工程师',
        headcount: 2,
        startDate: '2026-04-20',
        endDate: '2026-05-31',
        recruiterId: 101,
        requirementSummary: '已生效样例',
        status: 'active',
      },
    });

    await expect(
      activeService.updatePlan({
        id: 4,
        title: '主题16-已生效招聘',
        targetDepartmentId: 11,
        positionName: '平台工程师',
        headcount: 2,
        startDate: '2026-04-20',
        endDate: '2026-05-31',
        recruiterId: 101,
      })
    ).rejects.toThrow('当前状态不允许编辑');
    await expect(activeService.deletePlan({ id: 4 })).rejects.toThrow(
      '当前状态不允许删除'
    );
    await expect(activeService.submitPlan({ id: 4 })).rejects.toThrow(
      '当前状态不允许提交'
    );
    await expect(activeService.reopenPlan({ id: 4 })).rejects.toThrow(
      '当前状态不允许重新开启'
    );

    const { service: draftService } = createService();
    await expect(draftService.closePlan({ id: 1 })).rejects.toThrow(
      '当前状态不允许关闭'
    );
    await expect(draftService.voidPlan({ id: 1 })).rejects.toThrow(
      '当前状态不允许作废'
    );
    await expect(draftService.reopenPlan({ id: 1 })).rejects.toThrow(
      '当前状态不允许重新开启'
    );
    await expect(
      draftService.updatePlan({
        id: 1,
        title: '主题16-平台工程师招聘',
        targetDepartmentId: 11,
        positionName: '平台工程师',
        headcount: 2,
        startDate: '2026-04-20',
        endDate: '2026-05-31',
        recruiterId: 101,
        status: 'active',
      })
    ).rejects.toThrow('请通过提交动作进入 active');
  });
});
