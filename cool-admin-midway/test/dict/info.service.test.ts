/// <reference types="jest" />
/**
 * 字典服务业务字典聚合测试。
 * 这里只验证 dict/info/data 能透出业务字典组，不覆盖数据库 CRUD、翻译或真实 HTTP 链路。
 */
import { DictInfoService } from '../../src/modules/dict/service/info';

describe('dict info service', () => {
  test('should return assessment business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data(['performance.assessment.status']);

    expect(result).toEqual({
      'performance.assessment.status': {
        key: 'performance.assessment.status',
        version: 'assessment-v1',
        items: [
          expect.objectContaining({
            id: 'performance.assessment.status:draft',
            name: '草稿',
            value: 'draft',
            orderNum: 10,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.assessment.status:submitted',
            name: '待审批',
            value: 'submitted',
            orderNum: 20,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.assessment.status:approved',
            name: '已通过',
            value: 'approved',
            orderNum: 30,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.assessment.status:rejected',
            name: '已驳回',
            value: 'rejected',
            orderNum: 40,
            tone: 'danger',
          }),
        ],
      },
    });
  });

  test('should return indicator business dict groups without db dictionary rows', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data([
      'performance.indicator.status',
      'performance.indicator.applyScope',
    ]);

    expect(result).toEqual({
      'performance.indicator.status': {
        key: 'performance.indicator.status',
        version: 'indicator-v1',
        items: [
          expect.objectContaining({
            id: 'performance.indicator.status:1',
            name: '启用',
            value: 1,
            orderNum: 10,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.indicator.status:0',
            name: '禁用',
            value: 0,
            orderNum: 20,
            tone: 'info',
          }),
        ],
      },
      'performance.indicator.applyScope': {
        key: 'performance.indicator.applyScope',
        version: 'indicator-v1',
        items: [
          expect.objectContaining({
            value: 'all',
            name: '全员',
          }),
          expect.objectContaining({
            value: 'department',
            name: '部门',
          }),
          expect.objectContaining({
            value: 'employee',
            name: '员工/岗位',
          }),
        ],
      },
    });
  });

  test('should return job standard and certificate business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data([
      'performance.jobStandard.status',
      'performance.certificate.status',
      'performance.certificate.recordStatus',
    ]);

    expect(result).toEqual({
      'performance.jobStandard.status': {
        key: 'performance.jobStandard.status',
        version: 'job-standard-v1',
        items: [
          expect.objectContaining({
            id: 'performance.jobStandard.status:draft',
            name: '草稿',
            value: 'draft',
            orderNum: 10,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.jobStandard.status:active',
            name: '已启用',
            value: 'active',
            orderNum: 20,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.jobStandard.status:inactive',
            name: '已停用',
            value: 'inactive',
            orderNum: 30,
            tone: 'info',
          }),
        ],
      },
      'performance.certificate.status': {
        key: 'performance.certificate.status',
        version: 'certificate-v1',
        items: [
          expect.objectContaining({
            id: 'performance.certificate.status:draft',
            name: '草稿',
            value: 'draft',
            orderNum: 10,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.certificate.status:active',
            name: '已启用',
            value: 'active',
            orderNum: 20,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.certificate.status:retired',
            name: '已停用',
            value: 'retired',
            orderNum: 30,
            tone: 'info',
          }),
        ],
      },
      'performance.certificate.recordStatus': {
        key: 'performance.certificate.recordStatus',
        version: 'certificate-v1',
        items: [
          expect.objectContaining({
            id: 'performance.certificate.recordStatus:issued',
            name: '已发放',
            value: 'issued',
            orderNum: 10,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.certificate.recordStatus:revoked',
            name: '已撤销',
            value: 'revoked',
            orderNum: 20,
            tone: 'danger',
          }),
        ],
      },
    });
  });

  test('should return work plan business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data([
      'performance.workPlan.status',
      'performance.workPlan.sourceStatus',
      'performance.workPlan.priority',
      'performance.workPlan.sourceType',
    ]);

    expect(result).toEqual({
      'performance.workPlan.status': {
        key: 'performance.workPlan.status',
        version: 'work-plan-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.workPlan.status:draft',
            name: '草稿',
            value: 'draft',
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.workPlan.status:planned',
            name: '已计划',
            value: 'planned',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.workPlan.status:cancelled',
            name: '已取消',
            value: 'cancelled',
            tone: 'danger',
          }),
        ]),
      },
      'performance.workPlan.sourceStatus': {
        key: 'performance.workPlan.sourceStatus',
        version: 'work-plan-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.workPlan.sourceStatus:none',
            name: '无来源审批',
            value: 'none',
          }),
          expect.objectContaining({
            id: 'performance.workPlan.sourceStatus:approved',
            name: '已通过',
            value: 'approved',
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.workPlan.sourceStatus:terminated',
            name: '已终止',
            value: 'terminated',
            tone: 'danger',
          }),
        ]),
      },
      'performance.workPlan.priority': {
        key: 'performance.workPlan.priority',
        version: 'work-plan-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.workPlan.priority:low',
            name: '低',
            value: 'low',
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.workPlan.priority:urgent',
            name: '紧急',
            value: 'urgent',
            tone: 'danger',
          }),
        ]),
      },
      'performance.workPlan.sourceType': {
        key: 'performance.workPlan.sourceType',
        version: 'work-plan-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.workPlan.sourceType:manual',
            name: '手工创建',
            value: 'manual',
          }),
          expect.objectContaining({
            id: 'performance.workPlan.sourceType:dingtalkApproval',
            name: '钉钉审批',
            value: 'dingtalkApproval',
          }),
        ]),
      },
    });
  });

  test('should return salary, capability, contract and interview business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data([
      'performance.salary.status',
      'performance.capability.status',
      'performance.contract.type',
      'performance.contract.status',
      'performance.interview.status',
      'performance.interview.type',
    ]);

    expect(result).toEqual({
      'performance.salary.status': {
        key: 'performance.salary.status',
        version: 'salary-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.salary.status:draft',
            name: '草稿',
            value: 'draft',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.salary.status:confirmed',
            name: '已确认',
            value: 'confirmed',
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.salary.status:archived',
            name: '已归档',
            value: 'archived',
            tone: 'info',
          }),
        ]),
      },
      'performance.capability.status': {
        key: 'performance.capability.status',
        version: 'capability-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.capability.status:draft',
            name: '草稿',
            value: 'draft',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.capability.status:active',
            name: '已生效',
            value: 'active',
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.capability.status:archived',
            name: '已归档',
            value: 'archived',
            tone: 'info',
          }),
        ]),
      },
      'performance.contract.type': {
        key: 'performance.contract.type',
        version: 'contract-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.contract.type:full-time',
            name: '全职',
            value: 'full-time',
          }),
          expect.objectContaining({
            id: 'performance.contract.type:part-time',
            name: '兼职',
            value: 'part-time',
          }),
          expect.objectContaining({
            id: 'performance.contract.type:internship',
            name: '实习',
            value: 'internship',
          }),
          expect.objectContaining({
            id: 'performance.contract.type:other',
            name: '其他',
            value: 'other',
          }),
        ]),
      },
      'performance.contract.status': {
        key: 'performance.contract.status',
        version: 'contract-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.contract.status:draft',
            name: '草稿',
            value: 'draft',
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.contract.status:active',
            name: '生效',
            value: 'active',
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.contract.status:expired',
            name: '到期',
            value: 'expired',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.contract.status:terminated',
            name: '终止',
            value: 'terminated',
            tone: 'danger',
          }),
        ]),
      },
      'performance.interview.status': {
        key: 'performance.interview.status',
        version: 'interview-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.interview.status:scheduled',
            name: '待执行',
            value: 'scheduled',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.interview.status:completed',
            name: '已完成',
            value: 'completed',
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.interview.status:cancelled',
            name: '已取消',
            value: 'cancelled',
            tone: 'danger',
          }),
        ]),
      },
      'performance.interview.type': {
        key: 'performance.interview.type',
        version: 'interview-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.interview.type:technical',
            name: '技术面',
            value: 'technical',
          }),
          expect.objectContaining({
            id: 'performance.interview.type:behavioral',
            name: '行为面',
            value: 'behavioral',
          }),
          expect.objectContaining({
            id: 'performance.interview.type:manager',
            name: '经理面',
            value: 'manager',
          }),
          expect.objectContaining({
            id: 'performance.interview.type:hr',
            name: 'HR 面',
            value: 'hr',
          }),
        ]),
      },
    });
  });

  test('should return recruit plan business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data(['performance.recruitPlan.status']);

    expect(result).toEqual({
      'performance.recruitPlan.status': {
        key: 'performance.recruitPlan.status',
        version: 'recruit-plan-v1',
        items: [
          expect.objectContaining({
            id: 'performance.recruitPlan.status:draft',
            name: '草稿',
            value: 'draft',
            orderNum: 10,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.recruitPlan.status:active',
            name: '生效中',
            value: 'active',
            orderNum: 20,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.recruitPlan.status:voided',
            name: '已作废',
            value: 'voided',
            orderNum: 30,
            tone: 'danger',
          }),
          expect.objectContaining({
            id: 'performance.recruitPlan.status:closed',
            name: '已关闭',
            value: 'closed',
            orderNum: 40,
            tone: 'warning',
          }),
        ],
      },
    });
  });

  test('should return resume pool business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data([
      'performance.resumePool.status',
      'performance.resumePool.sourceType',
    ]);

    expect(result).toEqual({
      'performance.resumePool.status': {
        key: 'performance.resumePool.status',
        version: 'resume-pool-v1',
        items: [
          expect.objectContaining({
            id: 'performance.resumePool.status:new',
            name: '新建',
            value: 'new',
            orderNum: 10,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.resumePool.status:screening',
            name: '筛选中',
            value: 'screening',
            orderNum: 20,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.resumePool.status:interviewing',
            name: '面试中',
            value: 'interviewing',
            orderNum: 30,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.resumePool.status:archived',
            name: '已归档',
            value: 'archived',
            orderNum: 40,
            tone: 'info',
          }),
        ],
      },
      'performance.resumePool.sourceType': {
        key: 'performance.resumePool.sourceType',
        version: 'resume-pool-v1',
        items: [
          expect.objectContaining({
            id: 'performance.resumePool.sourceType:manual',
            name: '手工录入',
            value: 'manual',
            orderNum: 10,
          }),
          expect.objectContaining({
            id: 'performance.resumePool.sourceType:attachment',
            name: '附件解析',
            value: 'attachment',
            orderNum: 20,
          }),
          expect.objectContaining({
            id: 'performance.resumePool.sourceType:external',
            name: '外部来源',
            value: 'external',
            orderNum: 30,
          }),
          expect.objectContaining({
            id: 'performance.resumePool.sourceType:referral',
            name: '内推',
            value: 'referral',
            orderNum: 40,
          }),
        ],
      },
    });
  });

  test('should return supplier business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data(['performance.supplier.status']);

    expect(result).toEqual({
      'performance.supplier.status': {
        key: 'performance.supplier.status',
        version: 'supplier-v1',
        items: [
          expect.objectContaining({
            id: 'performance.supplier.status:active',
            name: '启用',
            value: 'active',
            orderNum: 10,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.supplier.status:inactive',
            name: '停用',
            value: 'inactive',
            orderNum: 20,
            tone: 'info',
          }),
        ],
      },
    });
  });

  test('should return meeting business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data(['performance.meeting.status']);

    expect(result).toEqual({
      'performance.meeting.status': {
        key: 'performance.meeting.status',
        version: 'meeting-v1',
        items: [
          expect.objectContaining({
            id: 'performance.meeting.status:scheduled',
            name: '已安排',
            value: 'scheduled',
            orderNum: 10,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.meeting.status:in_progress',
            name: '进行中',
            value: 'in_progress',
            orderNum: 20,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.meeting.status:completed',
            name: '已结束',
            value: 'completed',
            orderNum: 30,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.meeting.status:cancelled',
            name: '已取消',
            value: 'cancelled',
            orderNum: 40,
            tone: 'info',
          }),
        ],
      },
    });
  });

  test('should return hiring business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data([
      'performance.hiring.status',
      'performance.hiring.sourceType',
    ]);

    expect(result).toEqual({
      'performance.hiring.status': {
        key: 'performance.hiring.status',
        version: 'hiring-v1',
        items: [
          expect.objectContaining({
            id: 'performance.hiring.status:offered',
            name: '待候选人反馈',
            value: 'offered',
            orderNum: 10,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.hiring.status:accepted',
            name: '已接受',
            value: 'accepted',
            orderNum: 20,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.hiring.status:rejected',
            name: '已拒绝',
            value: 'rejected',
            orderNum: 30,
            tone: 'danger',
          }),
          expect.objectContaining({
            id: 'performance.hiring.status:closed',
            name: '已关闭',
            value: 'closed',
            orderNum: 40,
            tone: 'warning',
          }),
        ],
      },
      'performance.hiring.sourceType': {
        key: 'performance.hiring.sourceType',
        version: 'hiring-v1',
        items: [
          expect.objectContaining({
            id: 'performance.hiring.sourceType:manual',
            name: '手工创建',
            value: 'manual',
            orderNum: 10,
          }),
          expect.objectContaining({
            id: 'performance.hiring.sourceType:resumePool',
            name: '简历池',
            value: 'resumePool',
            orderNum: 20,
          }),
          expect.objectContaining({
            id: 'performance.hiring.sourceType:talentAsset',
            name: '人才资产',
            value: 'talentAsset',
            orderNum: 30,
          }),
          expect.objectContaining({
            id: 'performance.hiring.sourceType:interview',
            name: '面试',
            value: 'interview',
            orderNum: 40,
          }),
        ],
      },
    });
  });

  test('should return talent asset business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data(['performance.talentAsset.status']);

    expect(result).toEqual({
      'performance.talentAsset.status': {
        key: 'performance.talentAsset.status',
        version: 'talent-asset-v1',
        items: [
          expect.objectContaining({
            id: 'performance.talentAsset.status:new',
            name: '新建',
            value: 'new',
            orderNum: 10,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.talentAsset.status:tracking',
            name: '跟进中',
            value: 'tracking',
            orderNum: 20,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.talentAsset.status:archived',
            name: '已归档',
            value: 'archived',
            orderNum: 30,
            tone: 'info',
          }),
        ],
      },
    });
  });

  test('should return course business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data(['performance.course.status']);

    expect(result).toEqual({
      'performance.course.status': {
        key: 'performance.course.status',
        version: 'course-v1',
        items: [
          expect.objectContaining({
            id: 'performance.course.status:draft',
            name: '草稿',
            value: 'draft',
            orderNum: 10,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.course.status:published',
            name: '已发布',
            value: 'published',
            orderNum: 20,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.course.status:closed',
            name: '已关闭',
            value: 'closed',
            orderNum: 30,
            tone: 'info',
          }),
        ],
      },
    });
  });

  test('should return promotion business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data(['performance.promotion.status']);

    expect(result).toEqual({
      'performance.promotion.status': {
        key: 'performance.promotion.status',
        version: 'promotion-v1',
        items: [
          expect.objectContaining({
            id: 'performance.promotion.status:draft',
            name: '草稿',
            value: 'draft',
            orderNum: 10,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.promotion.status:reviewing',
            name: '评审中',
            value: 'reviewing',
            orderNum: 20,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.promotion.status:approved',
            name: '已通过',
            value: 'approved',
            orderNum: 30,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.promotion.status:rejected',
            name: '已驳回',
            value: 'rejected',
            orderNum: 40,
            tone: 'danger',
          }),
        ],
      },
    });
  });

  test('should return pip business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data(['performance.pip.status']);

    expect(result).toEqual({
      'performance.pip.status': {
        key: 'performance.pip.status',
        version: 'pip-v1',
        items: [
          expect.objectContaining({
            id: 'performance.pip.status:draft',
            name: '草稿',
            value: 'draft',
            orderNum: 10,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.pip.status:active',
            name: '进行中',
            value: 'active',
            orderNum: 20,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.pip.status:completed',
            name: '已完成',
            value: 'completed',
            orderNum: 30,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.pip.status:closed',
            name: '已关闭',
            value: 'closed',
            orderNum: 40,
            tone: 'danger',
          }),
        ],
      },
    });
  });

  test('should return feedback business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data([
      'performance.feedback.taskStatus',
      'performance.feedback.recordStatus',
      'performance.feedback.relationType',
    ]);

    expect(result).toEqual({
      'performance.feedback.taskStatus': {
        key: 'performance.feedback.taskStatus',
        version: 'feedback-v1',
        items: [
          expect.objectContaining({
            id: 'performance.feedback.taskStatus:draft',
            name: '草稿',
            value: 'draft',
            orderNum: 10,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.feedback.taskStatus:running',
            name: '进行中',
            value: 'running',
            orderNum: 20,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.feedback.taskStatus:closed',
            name: '已关闭',
            value: 'closed',
            orderNum: 30,
            tone: 'success',
          }),
        ],
      },
      'performance.feedback.recordStatus': {
        key: 'performance.feedback.recordStatus',
        version: 'feedback-v1',
        items: [
          expect.objectContaining({
            id: 'performance.feedback.recordStatus:draft',
            name: '草稿',
            value: 'draft',
            orderNum: 10,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.feedback.recordStatus:submitted',
            name: '已提交',
            value: 'submitted',
            orderNum: 20,
            tone: 'success',
          }),
        ],
      },
      'performance.feedback.relationType': {
        key: 'performance.feedback.relationType',
        version: 'feedback-v1',
        items: [
          expect.objectContaining({
            id: 'performance.feedback.relationType:上级',
            name: '上级',
            value: '上级',
            orderNum: 10,
          }),
          expect.objectContaining({
            id: 'performance.feedback.relationType:同级',
            name: '同级',
            value: '同级',
            orderNum: 20,
          }),
          expect.objectContaining({
            id: 'performance.feedback.relationType:下级',
            name: '下级',
            value: '下级',
            orderNum: 30,
          }),
          expect.objectContaining({
            id: 'performance.feedback.relationType:协作人',
            name: '协作人',
            value: '协作人',
            orderNum: 40,
          }),
        ],
      },
    });
  });

  test('should return suggestion business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data([
      'performance.suggestion.type',
      'performance.suggestion.status',
      'performance.suggestion.revokeReasonCode',
    ]);

    expect(result).toEqual({
      'performance.suggestion.type': {
        key: 'performance.suggestion.type',
        version: 'suggestion-v1',
        items: [
          expect.objectContaining({
            id: 'performance.suggestion.type:pip',
            name: 'PIP 建议',
            value: 'pip',
            orderNum: 10,
            tone: 'warning',
            extra: expect.objectContaining({
              targetLabel: 'PIP',
            }),
          }),
          expect.objectContaining({
            id: 'performance.suggestion.type:promotion',
            name: '晋升建议',
            value: 'promotion',
            orderNum: 20,
            tone: 'success',
            extra: expect.objectContaining({
              targetLabel: '晋升单',
            }),
          }),
        ],
      },
      'performance.suggestion.status': {
        key: 'performance.suggestion.status',
        version: 'suggestion-v1',
        items: [
          expect.objectContaining({
            id: 'performance.suggestion.status:pending',
            name: '待处理',
            value: 'pending',
            orderNum: 10,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.suggestion.status:accepted',
            name: '已采用',
            value: 'accepted',
            orderNum: 20,
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.suggestion.status:ignored',
            name: '已忽略',
            value: 'ignored',
            orderNum: 30,
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.suggestion.status:rejected',
            name: '已驳回',
            value: 'rejected',
            orderNum: 40,
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.suggestion.status:revoked',
            name: '已撤销',
            value: 'revoked',
            orderNum: 50,
            tone: 'danger',
          }),
        ],
      },
      'performance.suggestion.revokeReasonCode': {
        key: 'performance.suggestion.revokeReasonCode',
        version: 'suggestion-v1',
        items: [
          expect.objectContaining({
            id: 'performance.suggestion.revokeReasonCode:thresholdError',
            name: '阈值命中错误',
            value: 'thresholdError',
            orderNum: 10,
          }),
          expect.objectContaining({
            id: 'performance.suggestion.revokeReasonCode:assessmentCorrected',
            name: '评估数据已更正',
            value: 'assessmentCorrected',
            orderNum: 20,
          }),
          expect.objectContaining({
            id: 'performance.suggestion.revokeReasonCode:scopeError',
            name: '数据范围判断错误',
            value: 'scopeError',
            orderNum: 30,
          }),
          expect.objectContaining({
            id: 'performance.suggestion.revokeReasonCode:duplicateSuggestion',
            name: '重复建议',
            value: 'duplicateSuggestion',
            orderNum: 40,
          }),
        ],
      },
    });
  });

  test('should return goal, course learning, teacher channel, purchase order, document center, knowledge base and indicator category business dict groups', async () => {
    const service = new DictInfoService() as any;
    service.dictTypeEntity = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.dictInfoEntity = {
      createQueryBuilder: jest.fn(),
    };

    const result = await service.data([
      'performance.goal.status',
      'performance.goal.sourceType',
      'performance.goal.periodType',
      'performance.goal.planStatus',
      'performance.goal.reportStatus',
      'performance.courseLearning.taskStatus',
      'performance.courseLearning.examStatus',
      'performance.teacherChannel.cooperationStatus',
      'performance.teacherChannel.classStatus',
      'performance.teacherChannel.todoBucket',
      'performance.purchaseOrder.status',
      'performance.documentCenter.category',
      'performance.documentCenter.fileType',
      'performance.documentCenter.storage',
      'performance.documentCenter.confidentiality',
      'performance.documentCenter.status',
      'performance.knowledgeBase.status',
      'performance.indicator.category',
    ]);

    expect(result).toEqual({
      'performance.goal.status': {
        key: 'performance.goal.status',
        version: 'goal-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.goal.status:in-progress',
            name: '进行中',
            value: 'in-progress',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.goal.status:completed',
            name: '已完成',
            value: 'completed',
            tone: 'success',
          }),
        ]),
      },
      'performance.goal.sourceType': {
        key: 'performance.goal.sourceType',
        version: 'goal-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.goal.sourceType:public',
            name: '公共目标',
            value: 'public',
          }),
          expect.objectContaining({
            id: 'performance.goal.sourceType:personal',
            name: '个人补充目标',
            value: 'personal',
          }),
        ]),
      },
      'performance.goal.periodType': {
        key: 'performance.goal.periodType',
        version: 'goal-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.goal.periodType:day',
            name: '日目标',
            value: 'day',
          }),
          expect.objectContaining({
            id: 'performance.goal.periodType:month',
            name: '月目标',
            value: 'month',
          }),
        ]),
      },
      'performance.goal.planStatus': {
        key: 'performance.goal.planStatus',
        version: 'goal-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.goal.planStatus:assigned',
            name: '待填报',
            value: 'assigned',
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.goal.planStatus:auto_zero',
            name: '自动补零',
            value: 'auto_zero',
            tone: 'warning',
          }),
        ]),
      },
      'performance.goal.reportStatus': {
        key: 'performance.goal.reportStatus',
        version: 'goal-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.goal.reportStatus:sent',
            name: '已发送',
            value: 'sent',
            tone: 'success',
          }),
          expect.objectContaining({
            id: 'performance.goal.reportStatus:intercepted',
            name: '已拦截',
            value: 'intercepted',
            tone: 'danger',
          }),
        ]),
      },
      'performance.courseLearning.taskStatus': {
        key: 'performance.courseLearning.taskStatus',
        version: 'course-learning-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.courseLearning.taskStatus:pending',
            name: '待完成',
            value: 'pending',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.courseLearning.taskStatus:evaluated',
            name: '已评估',
            value: 'evaluated',
            tone: 'success',
          }),
        ]),
      },
      'performance.courseLearning.examStatus': {
        key: 'performance.courseLearning.examStatus',
        version: 'course-learning-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.courseLearning.examStatus:locked',
            name: '未解锁',
            value: 'locked',
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.courseLearning.examStatus:failed',
            name: '未通过',
            value: 'failed',
            tone: 'danger',
          }),
        ]),
      },
      'performance.teacherChannel.cooperationStatus': {
        key: 'performance.teacherChannel.cooperationStatus',
        version: 'teacher-channel-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.teacherChannel.cooperationStatus:contacted',
            name: '已跟进',
            value: 'contacted',
            tone: 'primary',
          }),
          expect.objectContaining({
            id: 'performance.teacherChannel.cooperationStatus:terminated',
            name: '已终止',
            value: 'terminated',
            tone: 'danger',
          }),
        ]),
      },
      'performance.teacherChannel.classStatus': {
        key: 'performance.teacherChannel.classStatus',
        version: 'teacher-channel-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.teacherChannel.classStatus:draft',
            name: '草稿',
            value: 'draft',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.teacherChannel.classStatus:closed',
            name: '已关闭',
            value: 'closed',
            tone: 'info',
          }),
        ]),
      },
      'performance.teacherChannel.todoBucket': {
        key: 'performance.teacherChannel.todoBucket',
        version: 'teacher-channel-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.teacherChannel.todoBucket:today',
            name: '今日待跟进',
            value: 'today',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.teacherChannel.todoBucket:overdue',
            name: '已逾期待跟进',
            value: 'overdue',
            tone: 'danger',
          }),
        ]),
      },
      'performance.purchaseOrder.status': {
        key: 'performance.purchaseOrder.status',
        version: 'purchase-order-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.purchaseOrder.status:pendingApproval',
            name: '待审批',
            value: 'pendingApproval',
            tone: 'danger',
          }),
          expect.objectContaining({
            id: 'performance.purchaseOrder.status:received',
            name: '已收货',
            value: 'received',
            tone: 'success',
          }),
        ]),
      },
      'performance.documentCenter.category': {
        key: 'performance.documentCenter.category',
        version: 'document-center-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.documentCenter.category:policy',
            name: '制度',
            value: 'policy',
          }),
          expect.objectContaining({
            id: 'performance.documentCenter.category:archive',
            name: '归档',
            value: 'archive',
          }),
        ]),
      },
      'performance.documentCenter.fileType': {
        key: 'performance.documentCenter.fileType',
        version: 'document-center-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.documentCenter.fileType:pdf',
            name: 'PDF',
            value: 'pdf',
          }),
          expect.objectContaining({
            id: 'performance.documentCenter.fileType:img',
            name: '图片',
            value: 'img',
          }),
        ]),
      },
      'performance.documentCenter.storage': {
        key: 'performance.documentCenter.storage',
        version: 'document-center-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.documentCenter.storage:local',
            name: '本地',
            value: 'local',
          }),
          expect.objectContaining({
            id: 'performance.documentCenter.storage:hybrid',
            name: '混合',
            value: 'hybrid',
          }),
        ]),
      },
      'performance.documentCenter.confidentiality': {
        key: 'performance.documentCenter.confidentiality',
        version: 'document-center-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.documentCenter.confidentiality:internal',
            name: '内部',
            value: 'internal',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.documentCenter.confidentiality:secret',
            name: '机密',
            value: 'secret',
            tone: 'danger',
          }),
        ]),
      },
      'performance.documentCenter.status': {
        key: 'performance.documentCenter.status',
        version: 'document-center-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.documentCenter.status:review',
            name: '待审核',
            value: 'review',
            tone: 'warning',
          }),
          expect.objectContaining({
            id: 'performance.documentCenter.status:published',
            name: '已发布',
            value: 'published',
            tone: 'success',
          }),
        ]),
      },
      'performance.knowledgeBase.status': {
        key: 'performance.knowledgeBase.status',
        version: 'knowledge-base-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.knowledgeBase.status:draft',
            name: '草稿',
            value: 'draft',
            tone: 'info',
          }),
          expect.objectContaining({
            id: 'performance.knowledgeBase.status:archived',
            name: '已归档',
            value: 'archived',
            tone: 'info',
          }),
        ]),
      },
      'performance.indicator.category': {
        key: 'performance.indicator.category',
        version: 'indicator-v1',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'performance.indicator.category:assessment',
            name: '考核指标',
            value: 'assessment',
          }),
          expect.objectContaining({
            id: 'performance.indicator.category:feedback',
            name: '环评指标',
            value: 'feedback',
          }),
        ]),
      },
    });
  });
});
