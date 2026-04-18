/// <reference types="jest" />
/**
 * 主题13证书台账服务测试。
 * 这里只验证主题13的状态限制、编码唯一、发放规则和部门树范围，不覆盖真实数据库或联调环境。
 */
import {
  assertCertificateTransition,
  normalizeCertificatePayload,
  normalizeIssuePayload,
} from '../../src/modules/performance/service/certificate-helper';
import { PerformanceCertificateService } from '../../src/modules/performance/service/certificate';

describe('performance certificate helper', () => {
  test('should normalize draft certificate payload by default', () => {
    expect(
      normalizeCertificatePayload({
        name: 'PMP',
        code: '',
        category: '管理',
        issuer: 'PMI',
      })
    ).toEqual({
      name: 'PMP',
      code: null,
      category: '管理',
      issuer: 'PMI',
      description: null,
      validityMonths: null,
      sourceCourseId: null,
      status: 'draft',
    });
  });

  test('should keep issue payload sourceCourseId optional', () => {
    expect(
      normalizeIssuePayload({
        certificateId: 1,
        employeeId: 2,
        issuedAt: '2026-04-18 10:00:00',
      })
    ).toEqual({
      certificateId: 1,
      employeeId: 2,
      issuedAt: '2026-04-18 10:00:00',
      remark: null,
      sourceCourseId: null,
    });
  });

  test('should reject illegal certificate transition', () => {
    expect(() =>
      assertCertificateTransition('active', 'draft', 'update')
    ).toThrow('当前状态不允许流转到目标状态');
  });
});

describe('performance certificate service', () => {
  test('should reject duplicated certificate code on add', async () => {
    const service = new PerformanceCertificateService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:certificate:add']),
    };
    service.performanceCertificateEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 9, code: 'CERT-001' }),
    };

    await expect(
      service.add({
        name: 'PMP',
        code: 'CERT-001',
      })
    ).rejects.toThrow('证书编码已存在');
  });

  test('should reject issuing non-active certificate', async () => {
    const service = new PerformanceCertificateService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:certificate:issue']),
    };
    service.performanceCertificateEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        name: 'PMP',
        status: 'draft',
      }),
    };

    await expect(
      service.issue({
        certificateId: 1,
        employeeId: 2,
        issuedAt: '2026-04-18 10:00:00',
      })
    ).rejects.toThrow('当前状态不允许发放证书');
  });

  test('should issue certificate without forcing course completion', async () => {
    const service = new PerformanceCertificateService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:certificate:issue']),
    };
    service.performanceCertificateEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        name: 'PMP',
        status: 'active',
      }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 2, name: '张三', departmentId: 11 }),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.performanceCertificateRecordEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({
        id: 18,
        certificateId: 1,
        employeeId: 2,
        departmentId: 11,
        sourceCourseId: null,
        issuedAt: '2026-04-18 10:00:00',
        issuedBy: 'hr_admin',
        status: 'issued',
      }),
    };

    await expect(
      service.issue({
        certificateId: 1,
        employeeId: 2,
        issuedAt: '2026-04-18 10:00:00',
      })
    ).resolves.toEqual({
      id: 18,
      certificateId: 1,
      certificateName: 'PMP',
      employeeId: 2,
      employeeName: '张三',
      departmentId: 11,
      departmentName: '研发部',
      issuedAt: '2026-04-18 10:00:00',
      issuedBy: 'hr_admin',
      sourceCourseId: null,
      status: 'issued',
    });
  });

  test('should scope record page by manager department tree', async () => {
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
          id: 5,
          certificateId: 1,
          certificateName: 'PMP',
          employeeId: 2,
          employeeName: '张三',
          departmentId: 11,
          departmentName: '研发部',
          issuedAt: '2026-04-18 10:00:00',
          issuedBy: 'hr_admin',
          sourceCourseId: null,
          status: 'issued',
        },
      ]),
    };
    const service = new PerformanceCertificateService() as any;
    service.ctx = {
      admin: {
        userId: 2,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:certificate:recordPage']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.performanceCertificateRecordEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const result = await service.recordPage({ page: 1, size: 10, status: 'issued' });

    expect(andWhere).toHaveBeenCalledWith('record.departmentId in (:...departmentIds)', {
      departmentIds: [11],
    });
    expect(result.list).toHaveLength(1);
    expect(result.list[0]).toMatchObject({
      certificateId: 1,
      employeeId: 2,
      departmentId: 11,
      status: 'issued',
    });
  });
});
