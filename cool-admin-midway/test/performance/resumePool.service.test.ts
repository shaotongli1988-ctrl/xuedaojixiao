/// <reference types="jest" />
/**
 * 招聘简历池服务最小测试。
 * 这里只验证主题15冻结的主链、范围权限、状态约束、下载边界和主题8/12转换边界，不覆盖真实数据库或控制器联调。
 */
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import { PerformanceResumePoolService } from '../../src/modules/performance/service/resumePool';

const HR_PERMS = [
  'performance:resumePool:page',
  'performance:resumePool:info',
  'performance:resumePool:add',
  'performance:resumePool:update',
  'performance:resumePool:import',
  'performance:resumePool:export',
  'performance:resumePool:uploadAttachment',
  'performance:resumePool:downloadAttachment',
  'performance:resumePool:convertToTalentAsset',
  'performance:resumePool:createInterview',
];

const MANAGER_PERMS = [
  'performance:resumePool:page',
  'performance:resumePool:info',
  'performance:resumePool:add',
  'performance:resumePool:update',
  'performance:resumePool:import',
  'performance:resumePool:uploadAttachment',
  'performance:resumePool:convertToTalentAsset',
  'performance:resumePool:createInterview',
];

const createPageQueryBuilder = (rows: any[]) => {
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

const createHrService = () => {
  const qb = createPageQueryBuilder([
    {
      id: 1,
      candidateName: '张三',
      targetDepartmentId: 11,
      targetDepartmentName: '研发部',
      targetPosition: '后端工程师',
      phone: '13800000000',
      email: 'zhangsan@example.com',
      attachmentIdList: JSON.stringify([21]),
      sourceType: 'external',
      sourceRemark: '猎头推荐',
      externalLink: 'https://example.com/resume/1',
      resumeText: '十年 Java 后端经验',
      status: 'new',
      linkedTalentAssetId: null,
      latestInterviewId: null,
      recruitPlanId: 301,
      jobStandardId: 501,
      recruitPlanSnapshot: JSON.stringify({
        id: 301,
        title: '平台招聘计划',
        positionName: '后端工程师',
        targetDepartmentId: 11,
        targetDepartmentName: '研发部',
        headcount: 2,
        startDate: '2026-04-20',
        endDate: '2026-05-31',
        status: 'active',
        jobStandardId: 501,
      }),
      jobStandardSnapshot: JSON.stringify({
        id: 501,
        positionName: '后端工程师',
        jobLevel: 'P6',
        targetDepartmentId: 11,
        targetDepartmentName: '研发部',
        status: 'active',
        requirementSummary: '熟悉 Java 与平台研发',
      }),
      createTime: '2026-04-18 10:00:00',
      updateTime: '2026-04-18 10:00:00',
    },
  ]);
  const resumeRecord = {
    id: 1,
    candidateName: '张三',
    targetDepartmentId: 11,
    targetPosition: '后端工程师',
    phone: '13800000000',
    email: 'zhangsan@example.com',
    resumeText: '十年 Java 后端经验',
    sourceType: 'external',
    sourceRemark: '猎头推荐',
    externalLink: 'https://example.com/resume/1',
    attachmentIdList: [21],
    status: 'new',
    linkedTalentAssetId: null,
    latestInterviewId: null,
    recruitPlanId: 301,
    jobStandardId: 501,
    recruitPlanSnapshot: {
      id: 301,
      title: '平台招聘计划',
      positionName: '后端工程师',
      targetDepartmentId: 11,
      targetDepartmentName: '研发部',
      headcount: 2,
      startDate: '2026-04-20',
      endDate: '2026-05-31',
      status: 'active',
      jobStandardId: 501,
    },
    jobStandardSnapshot: {
      id: 501,
      positionName: '后端工程师',
      jobLevel: 'P6',
      targetDepartmentId: 11,
      targetDepartmentName: '研发部',
      status: 'active',
      requirementSummary: '熟悉 Java 与平台研发',
    },
    createTime: '2026-04-18 10:00:00',
    updateTime: '2026-04-18 10:00:00',
  };

  const service = new PerformanceResumePoolService() as any;
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
    findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
  };
  service.baseSysUserEntity = {
    findOneBy: jest.fn().mockResolvedValue({ id: 1, name: 'HR负责人' }),
  };
  service.spaceInfoEntity = {
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (where.id === 21 || where.id === 31) {
        return Promise.resolve({
          id: where.id,
          name: where.id === 21 ? 'resume.pdf' : 'import.xlsx',
          size: where.id === 21 ? 2048 : 1024,
          url: where.id === 21 ? 'https://files.example.com/resume.pdf' : 'https://files.example.com/import.xlsx',
          fileId: where.id === 21 ? 'resume-file-21' : 'import-file-31',
          createTime: '2026-04-18 10:30:00',
        });
      }

      return Promise.resolve(null);
    }),
    findBy: jest.fn().mockResolvedValue([
      {
        id: 21,
        name: 'resume.pdf',
        size: 2048,
        url: 'https://files.example.com/resume.pdf',
        fileId: 'resume-file-21',
        createTime: '2026-04-18 10:30:00',
      },
    ]),
  };
  service.performanceInterviewEntity = {
    create: jest.fn().mockImplementation((payload: any) => payload),
    save: jest.fn().mockResolvedValue({ id: 77 }),
  };
  service.performanceRecruitPlanEntity = {
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (where.id === 301) {
        return Promise.resolve({
          id: 301,
          title: '平台招聘计划',
          positionName: '后端工程师',
          targetDepartmentId: 11,
          headcount: 2,
          startDate: '2026-04-20',
          endDate: '2026-05-31',
          status: 'active',
          jobStandardId: 501,
        });
      }
      return Promise.resolve(null);
    }),
  };
  service.performanceJobStandardEntity = {
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (where.id === 501) {
        return Promise.resolve({
          id: 501,
          positionName: '后端工程师',
          jobLevel: 'P6',
          targetDepartmentId: 11,
          requirementSummary: '熟悉 Java 与平台研发',
          status: 'active',
        });
      }
      return Promise.resolve(null);
    }),
  };
  service.performanceTalentAssetEntity = {
    findOneBy: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((payload: any) => payload),
    save: jest.fn().mockResolvedValue({ id: 88 }),
  };
  service.performanceResumePoolEntity = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    findOneBy: jest.fn().mockImplementation((where: any) => {
      if (where.id === 1) {
        return Promise.resolve(resumeRecord);
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    save: jest
      .fn()
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 }),
    update: jest.fn().mockResolvedValue(undefined),
  };
  attachAccessContext(service);

  return { service, qb };
};

describe('performance resume pool service', () => {
  test('should support hr main flow and keep attachment/download semantics aligned', async () => {
    const { service, qb } = createHrService();

    const pageResult = await service.page({ page: 1, size: 10 });
    const infoResult = await service.info(1);
    const addResult = await service.add({
      candidateName: '张三',
      targetDepartmentId: 11,
      targetPosition: '后端工程师',
      phone: '13800000000',
      email: 'zhangsan@example.com',
      resumeText: '十年 Java 后端经验',
      sourceType: 'external',
      sourceRemark: '猎头推荐',
      externalLink: 'https://example.com/resume/1',
      attachmentIdList: [21],
      recruitPlanId: 301,
    });
    const updateResult = await service.updateResume({
      id: 1,
      status: 'screening',
      sourceRemark: '已完成首轮筛选',
      recruitPlanId: 301,
    });
    const importResult = await service.importResume({
      fileId: 31,
      rows: [
        {
          candidateName: '李四',
          targetDepartmentId: 11,
          targetPosition: '测试工程师',
          phone: '13900000000',
          email: 'lisi@example.com',
          resumeText: '测试经验丰富',
          sourceType: 'attachment',
          recruitPlanId: 301,
        },
      ],
      overwriteRows: [
        {
          id: 1,
          candidateName: '张三',
          targetDepartmentId: 11,
          targetPosition: '后端工程师',
          phone: '13800000000',
          email: 'zhangsan@example.com',
          resumeText: '十年 Java 后端经验',
          sourceType: 'external',
          sourceRemark: '覆盖更新',
          externalLink: 'https://example.com/resume/1',
          attachmentIdList: [21],
          status: 'screening',
          recruitPlanId: 301,
        },
      ],
    });
    const exportResult = await service.exportResume({});
    const uploadResult = await service.uploadAttachment({ id: 1, fileId: 21 });
    const downloadResult = await service.downloadAttachment({ id: 1, attachmentId: 21 });
    const convertResult = await service.convertToTalentAsset({ id: 1 });
    const interviewResult = await service.createInterview({ id: 1 });

    expect(qb.select).toHaveBeenCalled();
    expect(pageResult.list[0]).toMatchObject({
      id: 1,
      candidateName: '张三',
      targetDepartmentName: '研发部',
      recruitPlanId: 301,
      jobStandardId: 501,
      recruitPlanSummary: expect.objectContaining({
        id: 301,
        title: '平台招聘计划',
      }),
    });
    expect(pageResult.list[0].attachmentSummaryList).toEqual([
      expect.objectContaining({
        id: 21,
        name: 'resume.pdf',
      }),
    ]);
    expect(infoResult).toMatchObject({
      id: 1,
      resumeText: '十年 Java 后端经验',
      recruitPlanId: 301,
      jobStandardId: 501,
      jobStandardSnapshot: expect.objectContaining({
        id: 501,
        positionName: '后端工程师',
      }),
      attachmentSummaryList: [
        expect.objectContaining({
          id: 21,
          name: 'resume.pdf',
        }),
      ],
    });
    expect(addResult).toMatchObject({
      id: 1,
      candidateName: '张三',
      recruitPlanId: 301,
      jobStandardId: 501,
    });
    expect(updateResult).toMatchObject({
      id: 1,
      candidateName: '张三',
      recruitPlanId: 301,
      jobStandardId: 501,
    });
    expect(importResult).toEqual({
      fileId: 31,
      importedCount: 1,
      overwrittenCount: 1,
      skippedCount: 0,
    });
    expect(exportResult[0]).toMatchObject({
      candidateName: '张三',
      resumeText: '十年 Java 后端经验',
    });
    expect(uploadResult).toMatchObject({ id: 1, candidateName: '张三' });
    expect(downloadResult).toMatchObject({
      id: 21,
      name: 'resume.pdf',
      url: 'https://files.example.com/resume.pdf',
      downloadUrl: 'https://files.example.com/resume.pdf',
    });
    expect(convertResult).toEqual({
      talentAssetId: 88,
      created: true,
    });
    expect(interviewResult).toEqual({
      interviewId: 77,
      status: 'interviewing',
      resumePoolId: 1,
      recruitPlanId: 301,
      jobStandardId: 501,
      sourceSnapshot: {
        sourceResource: 'resumePool',
        resumePoolId: 1,
        recruitPlanId: 301,
        recruitPlanTitle: '平台招聘计划',
        candidateName: '张三',
        targetDepartmentId: 11,
        targetPosition: '后端工程师',
      },
      snapshot: {
        id: 1,
        candidateName: '张三',
        targetDepartmentId: 11,
        targetDepartmentName: '研发部',
        targetPosition: '后端工程师',
        phone: '13800000000',
        email: 'zhangsan@example.com',
        status: 'new',
        recruitPlanId: 301,
        jobStandardId: 501,
      },
      resumePoolSummary: expect.objectContaining({ id: 1 }),
      resumePoolSnapshot: expect.objectContaining({ id: 1 }),
      recruitPlanSummary: expect.objectContaining({ id: 301 }),
      recruitPlanSnapshot: expect.objectContaining({ id: 301 }),
      jobStandardSummary: expect.objectContaining({ id: 501 }),
      jobStandardSnapshot: expect.objectContaining({ id: 501 }),
    });
    expect(service.performanceInterviewEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        resumePoolId: 1,
        recruitPlanId: 301,
        sourceSnapshot: expect.objectContaining({
          sourceResource: 'resumePool',
          resumePoolId: 1,
          recruitPlanId: 301,
        }),
        resumePoolSnapshot: expect.objectContaining({ id: 1 }),
        recruitPlanSnapshot: expect.objectContaining({ id: 301 }),
      })
    );
    expect(service.performanceResumePoolEntity.update).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({
        status: 'interviewing',
        latestInterviewId: 77,
      })
    );
    expect(service.performanceTalentAssetEntity.create).toHaveBeenCalledWith(
      expect.not.objectContaining({
        resumeText: expect.anything(),
        phone: expect.anything(),
        email: expect.anything(),
        attachmentIdList: expect.anything(),
      })
    );
  });

  test('should scope manager page and reject export/download outside HR', async () => {
    const qb = createPageQueryBuilder([
      {
        id: 9,
        candidateName: '王五',
        targetDepartmentId: 11,
        targetDepartmentName: '研发部',
        targetPosition: '前端工程师',
        phone: '13700000000',
        email: 'wangwu@example.com',
        attachmentIdList: JSON.stringify([]),
        sourceType: 'manual',
        status: 'screening',
        createTime: '2026-04-18 09:00:00',
        updateTime: '2026-04-18 09:00:00',
      },
    ]);
    const service = new PerformanceResumePoolService() as any;
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
    service.performanceResumePoolEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOneBy: jest.fn().mockResolvedValue({
        id: 9,
        candidateName: '王五',
        targetDepartmentId: 11,
        targetPosition: '前端工程师',
        phone: '13700000000',
        email: 'wangwu@example.com',
        resumeText: '简历内容',
        sourceType: 'manual',
        sourceRemark: null,
        externalLink: null,
        attachmentIdList: [],
        status: 'screening',
        linkedTalentAssetId: null,
        latestInterviewId: null,
      }),
    };
    attachAccessContext(service);

    await service.page({ page: 1, size: 10 });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'resume.targetDepartmentId in (:...departmentIds)',
      { departmentIds: [11] }
    );
    await expect(service.exportResume({})).rejects.toThrow('无权限导出简历');
    await expect(
      service.downloadAttachment({ id: 9, attachmentId: 21 })
    ).rejects.toThrow('无权限下载简历附件');
  });

  test('should reject employee page access', async () => {
    const service = new PerformanceResumePoolService() as any;
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

    await expect(service.page({ page: 1, size: 10 })).rejects.toThrow(
      '无权限查看简历列表'
    );
  });

  test('should reject downloading missing attachment', async () => {
    const { service } = createHrService();

    await expect(
      service.downloadAttachment({ id: 1, attachmentId: 99 })
    ).rejects.toThrow('附件不存在');
  });

  test('should reject uploading when attachment file record is missing', async () => {
    const { service } = createHrService();

    await expect(
      service.uploadAttachment({ id: 1, fileId: 99 })
    ).rejects.toThrow('附件文件不存在');
  });

  test('should reject archived writes and createInterview replay', async () => {
    const service = new PerformanceResumePoolService() as any;
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
    service.performanceResumePoolEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce({
          id: 20,
          candidateName: '归档候选人',
          targetDepartmentId: 11,
          targetPosition: '后端工程师',
          phone: '13600000000',
          email: 'archived@example.com',
          resumeText: 'resume',
          sourceType: 'manual',
          sourceRemark: null,
          externalLink: null,
          attachmentIdList: [],
          status: 'archived',
        })
        .mockResolvedValueOnce({
          id: 20,
          candidateName: '归档候选人',
          targetDepartmentId: 11,
          targetPosition: '后端工程师',
          phone: '13600000000',
          email: 'archived@example.com',
          resumeText: 'resume',
          sourceType: 'manual',
          sourceRemark: null,
          externalLink: null,
          attachmentIdList: [],
          status: 'archived',
        })
        .mockResolvedValueOnce({
          id: 20,
          candidateName: '归档候选人',
          targetDepartmentId: 11,
          targetPosition: '后端工程师',
          phone: '13600000000',
          email: 'archived@example.com',
          resumeText: 'resume',
          sourceType: 'manual',
          sourceRemark: null,
          externalLink: null,
          attachmentIdList: [],
          status: 'archived',
        })
        .mockResolvedValueOnce({
          id: 21,
          candidateName: '已面试候选人',
          targetDepartmentId: 11,
          targetPosition: '后端工程师',
          phone: '13600000001',
          email: 'interviewing@example.com',
          resumeText: 'resume',
          sourceType: 'manual',
          sourceRemark: null,
          externalLink: null,
          attachmentIdList: [],
          status: 'interviewing',
        }),
    };
    attachAccessContext(service);

    await expect(
      service.updateResume({ id: 20, sourceRemark: '更新' })
    ).rejects.toThrow('当前状态不允许编辑');
    await expect(
      service.uploadAttachment({ id: 20, fileId: 21 })
    ).rejects.toThrow('当前状态不允许上传附件');
    await expect(service.convertToTalentAsset({ id: 20 })).rejects.toThrow(
      '当前状态不允许转人才资产'
    );
    await expect(service.createInterview({ id: 21 })).rejects.toThrow(
      '当前状态不允许再次发起面试'
    );
  });

  test('should reject illegal status jump and external-link misuse', async () => {
    const service = new PerformanceResumePoolService() as any;
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
    service.performanceResumePoolEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce({
          id: 30,
          candidateName: '非法跳转候选人',
          targetDepartmentId: 11,
          targetPosition: '测试工程师',
          phone: '13500000000',
          email: null,
          resumeText: 'resume',
          sourceType: 'manual',
          sourceRemark: null,
          externalLink: null,
          attachmentIdList: [],
          status: 'new',
        })
        .mockResolvedValueOnce({
          id: 31,
          candidateName: '外链误用候选人',
          targetDepartmentId: 11,
          targetPosition: '测试工程师',
          phone: '13500000001',
          email: null,
          resumeText: 'resume',
          sourceType: 'manual',
          sourceRemark: null,
          externalLink: null,
          attachmentIdList: [],
          status: 'new',
        }),
    };
    attachAccessContext(service);

    await expect(
      service.updateResume({
        id: 30,
        status: 'interviewing',
      })
    ).rejects.toThrow('请通过发起面试动作进入 interviewing');

    await expect(
      service.updateResume({
        id: 31,
        externalLink: 'https://example.com/resume/31',
      })
    ).rejects.toThrow('仅 external 来源允许填写外部简历链接');
  });

  test('should reject invalid resume status and source type with shared semantics', async () => {
    const { service } = createHrService();

    await expect(
      service.page({ page: 1, size: 10, status: 'invalid-status' })
    ).rejects.toThrow('简历状态不合法');
    await expect(
      service.page({ page: 1, size: 10, sourceType: 'invalid-source' })
    ).rejects.toThrow('简历来源类型不合法');
  });

  test('should reject add non-new status with shared semantics', async () => {
    const { service } = createHrService();

    await expect(
      service.add({
        candidateName: '赵六',
        targetDepartmentId: 11,
        targetPosition: '测试工程师',
        phone: '13600000088',
        email: 'zhaoliu@example.com',
        resumeText: 'resume',
        sourceType: 'manual',
        status: 'screening',
      })
    ).rejects.toThrow('新增简历状态只能为 new');
  });

  test('should reject resume interview when target position is missing', async () => {
    const service = new PerformanceResumePoolService() as any;
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
    service.performanceResumePoolEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 50,
        candidateName: '缺岗位候选人',
        targetDepartmentId: 11,
        targetPosition: '',
        phone: '13500000009',
        email: null,
        resumeText: 'resume',
        sourceType: 'manual',
        sourceRemark: null,
        externalLink: null,
        attachmentIdList: [],
        status: 'new',
      }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 1, name: 'HR负责人' }),
    };
    attachAccessContext(service);

    await expect(service.createInterview({ id: 50 })).rejects.toThrow(
      '目标岗位不能为空，无法发起面试'
    );
  });

  test('should reject resume department mismatch and out-of-scope writes', async () => {
    const { service } = createHrService();

    await expect(
      service.add({
        candidateName: '部门错配候选人',
        targetDepartmentId: 12,
        targetPosition: '后端工程师',
        phone: '13600000066',
        email: 'mismatch@example.com',
        resumeText: 'resume',
        sourceType: 'manual',
        recruitPlanId: 301,
      })
    ).rejects.toThrow('招聘计划所属部门与简历目标部门不一致');

    await expect(
      service.add({
        candidateName: '职位标准错配候选人',
        targetDepartmentId: 12,
        targetPosition: '后端工程师',
        phone: '13600000067',
        email: 'jobstandard@example.com',
        resumeText: 'resume',
        sourceType: 'manual',
        jobStandardId: 501,
      })
    ).rejects.toThrow('职位标准所属部门与简历目标部门不一致');

    const managerService = new PerformanceResumePoolService() as any;
    managerService.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    managerService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(MANAGER_PERMS),
    };
    managerService.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    attachAccessContext(managerService);

    await expect(
      managerService.add({
        candidateName: '越权候选人',
        targetDepartmentId: 22,
        targetPosition: '测试工程师',
        phone: '13600000068',
        email: 'forbidden@example.com',
        resumeText: 'resume',
        sourceType: 'manual',
      })
    ).rejects.toThrow('无权操作该简历');
  });

  test('should reject manager import overwrite outside scope', async () => {
    const service = new PerformanceResumePoolService() as any;
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
    service.spaceInfoEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 31,
        name: 'import.xlsx',
        url: 'https://files.example.com/import.xlsx',
      }),
    };
    service.performanceResumePoolEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 60,
        candidateName: '跨部门候选人',
        targetDepartmentId: 22,
        targetPosition: '销售顾问',
        phone: '13600000100',
        email: 'cross@example.com',
        resumeText: 'resume',
        sourceType: 'manual',
        sourceRemark: null,
        externalLink: null,
        attachmentIdList: [],
        status: 'screening',
      }),
      update: jest.fn(),
      save: jest.fn(),
      create: jest.fn(payload => payload),
    };
    attachAccessContext(service);

    await expect(
      service.importResume({
        fileId: 31,
        rows: [],
        overwriteRows: [
          {
            id: 60,
            candidateName: '跨部门候选人',
            targetDepartmentId: 22,
            targetPosition: '销售顾问',
            phone: '13600000100',
            resumeText: 'updated',
          },
        ],
      })
    ).rejects.toThrow('无权导入覆盖该简历');

    expect(service.performanceResumePoolEntity.update).not.toHaveBeenCalled();
    expect(service.performanceResumePoolEntity.save).not.toHaveBeenCalled();
  });

  test('should reject manager convert and createInterview outside scope', async () => {
    const service = new PerformanceResumePoolService() as any;
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
    service.performanceResumePoolEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 61,
        candidateName: '跨部门候选人',
        targetDepartmentId: 22,
        targetPosition: '销售顾问',
        phone: '13600000101',
        email: 'cross2@example.com',
        resumeText: 'resume',
        sourceType: 'manual',
        sourceRemark: null,
        externalLink: null,
        attachmentIdList: [],
        status: 'screening',
        linkedTalentAssetId: null,
        latestInterviewId: null,
      }),
      update: jest.fn(),
    };
    service.performanceTalentAssetEntity = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service.performanceInterviewEntity = {
      create: jest.fn(),
      save: jest.fn(),
    };
    attachAccessContext(service);

    await expect(service.convertToTalentAsset({ id: 61 })).rejects.toThrow(
      '无权转换该简历'
    );
    await expect(service.createInterview({ id: 61 })).rejects.toThrow(
      '无权发起该简历面试'
    );

    expect(service.performanceTalentAssetEntity.save).not.toHaveBeenCalled();
    expect(service.performanceInterviewEntity.save).not.toHaveBeenCalled();
    expect(service.performanceResumePoolEntity.update).not.toHaveBeenCalled();
  });

  test('should keep convert idempotent when linked talent asset already exists', async () => {
    const service = new PerformanceResumePoolService() as any;
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
    service.performanceResumePoolEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 40,
        candidateName: '已转化候选人',
        targetDepartmentId: 11,
        targetPosition: '前端工程师',
        phone: '13400000000',
        email: 'converted@example.com',
        resumeText: 'resume',
        sourceType: 'referral',
        sourceRemark: null,
        externalLink: null,
        attachmentIdList: [],
        status: 'screening',
        linkedTalentAssetId: 501,
        latestInterviewId: null,
      }),
      update: jest.fn(),
    };
    service.performanceTalentAssetEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 501 }),
      create: jest.fn(),
      save: jest.fn(),
    };
    attachAccessContext(service);

    await expect(service.convertToTalentAsset({ id: 40 })).resolves.toEqual({
      talentAssetId: 501,
      created: false,
    });
    expect(service.performanceResumePoolEntity.update).not.toHaveBeenCalled();
  });
});
