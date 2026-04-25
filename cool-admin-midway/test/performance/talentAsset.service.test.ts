/// <reference types="jest" />
/**
 * 招聘人才资产服务最小测试。
 * 这里只验证主题12冻结的后端主链、范围权限、状态流转、删除限制、编码唯一性和敏感字段边界，不覆盖真实数据库联调。
 */
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import { PerformanceTalentAssetService } from '../../src/modules/performance/service/talentAsset';

const TALENT_PERMS = [
  'performance:talentAsset:page',
  'performance:talentAsset:info',
  'performance:talentAsset:add',
  'performance:talentAsset:update',
  'performance:talentAsset:delete',
];

const createPageQueryBuilder = (rows: any[]) => {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(rows.length),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
};

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

describe('performance talent asset service', () => {
  test('should support hr crud normal path', async () => {
    const pageRow = {
      id: 1,
      candidateName: '张三',
      code: 'TA-001',
      targetDepartmentId: 11,
      targetDepartmentName: '研发部',
      targetPosition: '后端工程师',
      source: '内推',
      tagList: JSON.stringify(['高潜', '可尽快到岗']),
      followUpSummary: '保持周跟进',
      nextFollowUpDate: '2026-04-20',
      status: 'new',
      createTime: '2026-04-18 10:00:00',
      updateTime: '2026-04-18 10:00:00',
    };
    const talentAssetRecord = {
      id: 1,
      candidateName: '张三',
      code: 'TA-001',
      targetDepartmentId: 11,
      targetPosition: '后端工程师',
      source: '内推',
      tagList: ['高潜', '可尽快到岗'],
      followUpSummary: '保持周跟进',
      nextFollowUpDate: '2026-04-20',
      status: 'new',
      createTime: '2026-04-18 10:00:00',
      updateTime: '2026-04-18 10:00:00',
    };

    const qb = createPageQueryBuilder([pageRow]);
    const service = new PerformanceTalentAssetService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(TALENT_PERMS),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.performanceTalentAssetEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.code) {
          return Promise.resolve(null);
        }

        if (where.id === 1) {
          return Promise.resolve(talentAssetRecord);
        }

        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation((payload: any) => payload),
      save: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue(undefined),
      findBy: jest.fn().mockResolvedValue([{ id: 1, status: 'new' }]),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    attachAccessContext(service);

    const pageResult = await service.page({ page: 1, size: 10 });
    const infoResult = await service.info(1);
    const addResult = await service.add({
      candidateName: '张三',
      code: 'TA-001',
      targetDepartmentId: 11,
      targetPosition: '后端工程师',
      source: '内推',
      tagList: ['高潜', '可尽快到岗'],
      followUpSummary: '保持周跟进',
      nextFollowUpDate: '2026-04-20',
    });
    const updateResult = await service.updateTalentAsset({
      id: 1,
      status: 'tracking',
    });
    await service.delete([1]);

    expect(pageResult.pagination).toEqual({ page: 1, size: 10, total: 1 });
    expect(infoResult).toMatchObject({
      id: 1,
      candidateName: '张三',
      targetDepartmentName: '研发部',
    });
    expect(addResult).toMatchObject({ id: 1, candidateName: '张三' });
    expect(updateResult).toMatchObject({ id: 1, candidateName: '张三' });
    expect(service.performanceTalentAssetEntity.delete).toHaveBeenCalledWith([1]);
  });

  test('should scope manager page query by department tree', async () => {
    const qb = createPageQueryBuilder([
      {
        id: 2,
        candidateName: '李四',
        code: null,
        targetDepartmentId: 11,
        targetDepartmentName: '研发部',
        targetPosition: '前端工程师',
        source: '社招',
        tagList: JSON.stringify(['React']),
        followUpSummary: null,
        nextFollowUpDate: null,
        status: 'new',
        createTime: '2026-04-18 09:00:00',
        updateTime: '2026-04-18 09:00:00',
      },
    ]);

    const service = new PerformanceTalentAssetService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:talentAsset:page',
        'performance:talentAsset:info',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.performanceTalentAssetEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    attachAccessContext(service);

    await service.page({ page: 1, size: 10 });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'talentAsset.targetDepartmentId in (:...departmentIds)',
      { departmentIds: [11] }
    );
  });

  test('should allow manager in-scope update and reject out-of-scope add', async () => {
    const managerPerms = [
      'performance:talentAsset:update',
      'performance:talentAsset:add',
      'performance:talentAsset:info',
    ];
    const allowedService = new PerformanceTalentAssetService() as any;
    allowedService.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    allowedService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(managerPerms),
    };
    allowedService.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    allowedService.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    allowedService.performanceTalentAssetEntity = {
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.id === 1) {
          return Promise.resolve({
            id: 1,
            candidateName: '王五',
            code: null,
            targetDepartmentId: 11,
            targetPosition: '测试工程师',
            source: '推荐',
            tagList: [],
            followUpSummary: null,
            nextFollowUpDate: null,
            status: 'new',
          });
        }

        if (where.code) {
          return Promise.resolve(null);
        }

        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    attachAccessContext(allowedService);

    const updated = await allowedService.updateTalentAsset({
      id: 1,
      followUpSummary: '首次沟通完成',
      status: 'tracking',
    });

    expect(updated).toMatchObject({
      id: 1,
      targetDepartmentName: '研发部',
    });
    expect(allowedService.performanceTalentAssetEntity.update).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({
        status: 'tracking',
      })
    );

    const deniedService = new PerformanceTalentAssetService() as any;
    deniedService.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    deniedService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(managerPerms),
    };
    deniedService.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    deniedService.performanceTalentAssetEntity = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };
    attachAccessContext(deniedService);

    await expect(
      deniedService.add({
        candidateName: '赵六',
        targetDepartmentId: 99,
        source: '猎头',
      })
    ).rejects.toThrow('无权操作该人才资产');
  });

  test('should allow legal status transition and reject illegal status transition', async () => {
    const service = new PerformanceTalentAssetService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:talentAsset:update',
        'performance:talentAsset:info',
        'performance:talentAsset:delete',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.performanceTalentAssetEntity = {
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.id === 10) {
          return Promise.resolve({
            id: 10,
            candidateName: '孙七',
            code: null,
            targetDepartmentId: 11,
            targetPosition: '前端工程师',
            source: '校招',
            tagList: [],
            followUpSummary: null,
            nextFollowUpDate: null,
            status: 'new',
          });
        }

        if (where.id === 11) {
          return Promise.resolve({
            id: 11,
            candidateName: '周八',
            code: null,
            targetDepartmentId: 11,
            targetPosition: '产品经理',
            source: '内推',
            tagList: [],
            followUpSummary: null,
            nextFollowUpDate: null,
            status: 'tracking',
          });
        }

        if (where.id === 12) {
          return Promise.resolve({
            id: 12,
            candidateName: '吴九',
            code: null,
            targetDepartmentId: 11,
            targetPosition: '测试工程师',
            source: '社招',
            tagList: [],
            followUpSummary: null,
            nextFollowUpDate: null,
            status: 'archived',
          });
        }

        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    attachAccessContext(service);

    const legal = await service.updateTalentAsset({
      id: 10,
      status: 'tracking',
    });

    expect(legal).toMatchObject({ id: 10 });
    expect(service.performanceTalentAssetEntity.update).toHaveBeenCalledWith(
      { id: 10 },
      expect.objectContaining({
        status: 'tracking',
      })
    );

    await expect(
      service.updateTalentAsset({
        id: 11,
        status: 'new',
      })
    ).rejects.toThrow('当前状态不允许执行该操作');

    await expect(
      service.updateTalentAsset({
        id: 12,
        status: 'tracking',
      })
    ).rejects.toThrow('当前状态不允许编辑');
  });

  test('should reject delete for manager and allow delete for hr only when status is new', async () => {
    const managerService = new PerformanceTalentAssetService() as any;
    managerService.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    managerService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:talentAsset:page']),
    };
    attachAccessContext(managerService);

    await expect(managerService.delete([1])).rejects.toThrow('无权限删除人才资产');

    const hrService = new PerformanceTalentAssetService() as any;
    hrService.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    hrService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:talentAsset:delete']),
    };
    hrService.performanceTalentAssetEntity = {
      findBy: jest.fn().mockResolvedValue([{ id: 2, status: 'tracking' }]),
    };
    attachAccessContext(hrService);

    await expect(hrService.delete([2])).rejects.toThrow('当前状态不允许删除');
  });

  test('should enforce optional code uniqueness', async () => {
    const duplicatedService = new PerformanceTalentAssetService() as any;
    duplicatedService.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    duplicatedService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:talentAsset:add',
        'performance:talentAsset:delete',
      ]),
    };
    duplicatedService.performanceTalentAssetEntity = {
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.code === 'TA-100') {
          return Promise.resolve({ id: 88, code: 'TA-100' });
        }

        return Promise.resolve(null);
      }),
      create: jest.fn(),
      save: jest.fn(),
    };
    attachAccessContext(duplicatedService);

    await expect(
      duplicatedService.add({
        candidateName: '陈十',
        code: 'TA-100',
        targetDepartmentId: 11,
        source: '推荐',
      })
    ).rejects.toThrow('人才资产编码已存在');

    const nullableService = new PerformanceTalentAssetService() as any;
    nullableService.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    nullableService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:talentAsset:add',
        'performance:talentAsset:info',
        'performance:talentAsset:delete',
      ]),
    };
    nullableService.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    nullableService.performanceTalentAssetEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 5,
        candidateName: '陈十',
        code: null,
        targetDepartmentId: 11,
        targetPosition: null,
        source: '推荐',
        tagList: [],
        followUpSummary: null,
        nextFollowUpDate: null,
        status: 'new',
      }),
      create: jest.fn().mockImplementation((payload: any) => payload),
      save: jest.fn().mockResolvedValue({ id: 5 }),
    };
    attachAccessContext(nullableService);

    await expect(
      nullableService.add({
        candidateName: '陈十',
        code: '',
        targetDepartmentId: 11,
        source: '推荐',
      })
    ).resolves.toMatchObject({ id: 5, code: null });
  });

  test('should not persist or return sensitive fields', async () => {
    const service = new PerformanceTalentAssetService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:talentAsset:add',
        'performance:talentAsset:info',
        'performance:talentAsset:delete',
      ]),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.performanceTalentAssetEntity = {
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.code) {
          return Promise.resolve(null);
        }

        return Promise.resolve({
          id: 9,
          candidateName: '敏感字段候选人',
          code: 'TA-009',
          targetDepartmentId: 11,
          targetPosition: '后端工程师',
          source: '推荐',
          tagList: ['高潜'],
          followUpSummary: '保持联系',
          nextFollowUpDate: '2026-04-21',
          status: 'new',
          phone: '13800000000',
          email: 'candidate@example.com',
          wechat: 'wechat-id',
          idCardNo: '310************0000',
          resumeText: '完整简历全文',
          interviewReviewText: '完整面评全文',
          offerDecisionText: '完整录用决策全文',
        });
      }),
      create: jest.fn().mockImplementation((payload: any) => payload),
      save: jest.fn().mockResolvedValue({ id: 9 }),
    };
    attachAccessContext(service);

    const result = await service.add({
      candidateName: '敏感字段候选人',
      code: 'TA-009',
      targetDepartmentId: 11,
      source: '推荐',
      phone: '13800000000',
      email: 'candidate@example.com',
      wechat: 'wechat-id',
      idCardNo: '310************0000',
      resumeText: '完整简历全文',
      interviewReviewText: '完整面评全文',
      offerDecisionText: '完整录用决策全文',
    });

    const persistedPayload =
      service.performanceTalentAssetEntity.create.mock.calls[0][0];

    expect(Object.prototype.hasOwnProperty.call(persistedPayload, 'phone')).toBe(
      false
    );
    expect(Object.prototype.hasOwnProperty.call(persistedPayload, 'email')).toBe(
      false
    );
    expect(Object.prototype.hasOwnProperty.call(persistedPayload, 'wechat')).toBe(
      false
    );
    expect(Object.prototype.hasOwnProperty.call(result, 'phone')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'email')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'resumeText')).toBe(false);
  });
});
