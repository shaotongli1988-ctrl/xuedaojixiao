/// <reference types="jest" />
/**
 * 合同台账服务最小测试。
 * 这里只验证主题10的 HR-only、状态流、删除限制和输入校验，不负责数据库或控制器联调。
 */
import { PerformanceContractService } from '../../src/modules/performance/service/contract';
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';

function attachAccessContextService(service: any) {
  if (!service.baseSysMenuService) {
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
  }
  if (!service.baseSysPermsService) {
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
  }
  service.performanceAccessContextService = Object.assign(
    new PerformanceAccessContextService(),
    {
      ctx: service.ctx,
      baseSysMenuService: service.baseSysMenuService,
      baseSysPermsService: service.baseSysPermsService,
    }
  );
}

describe('performance contract service', () => {
  test('should allow hr create update and delete draft contract', async () => {
    const service = new PerformanceContractService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:contract:add',
        'performance:contract:update',
        'performance:contract:delete',
        'performance:contract:info',
      ]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce({ id: 2, name: '员工A', departmentId: 11 })
        .mockResolvedValueOnce({ id: 2, name: '员工A', departmentId: 11 })
        .mockResolvedValueOnce({ id: 2, name: '员工A', departmentId: 11 }),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceContractEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 101 }),
      findOneBy: jest.fn().mockResolvedValue({
        id: 101,
        employeeId: 2,
        type: 'full-time',
        title: '劳动合同',
        contractNumber: 'HT-001',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        probationPeriod: 3,
        salary: 15000,
        position: '前端工程师',
        departmentId: 11,
        status: 'draft',
      }),
      update: jest.fn().mockResolvedValue(undefined),
      findBy: jest.fn().mockResolvedValue([{ id: 101, status: 'draft' }]),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    service.info = jest.fn().mockResolvedValue({ id: 101, status: 'draft' });
    service.validateDateRange = jest
      .fn()
      .mockImplementation(async (startDate: string, endDate: string) => {
        if (endDate <= startDate) {
          throw new Error('结束日期必须晚于开始日期');
        }
      });
    attachAccessContextService(service);

    await expect(
      service.add({
        employeeId: 2,
        type: 'full-time',
        title: '劳动合同',
        contractNumber: 'HT-001',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        probationPeriod: 3,
        salary: 15000,
        position: '前端工程师',
        departmentId: 11,
      })
    ).resolves.toEqual({ id: 101, status: 'draft' });

    await expect(
      service.updateContract({
        id: 101,
        employeeId: 2,
        type: 'full-time',
        title: '劳动合同修订版',
        contractNumber: 'HT-001',
        startDate: '2026-05-01',
        endDate: '2027-05-31',
        probationPeriod: 3,
        salary: 16000,
        position: '高级前端工程师',
        departmentId: 11,
        status: 'active',
      })
    ).resolves.toEqual({ id: 101, status: 'draft' });

    await expect(service.delete([101])).resolves.toBeUndefined();

    expect(service.performanceContractEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: 2,
        type: 'full-time',
        status: 'draft',
      })
    );
    expect(service.performanceContractEntity.update).toHaveBeenCalledWith(
      { id: 101 },
      expect.objectContaining({
        title: '劳动合同修订版',
        status: 'active',
      })
    );
    expect(service.performanceContractEntity.delete).toHaveBeenCalledWith([101]);
  });

  test('should reject non-hr access', async () => {
    const service = new PerformanceContractService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    attachAccessContextService(service);

    await expect(service.page({})).rejects.toThrow('无权限查看合同列表');
    await expect(service.info(1)).rejects.toThrow('无权限查看合同详情');
    await expect(service.add({})).rejects.toThrow('无权限新增合同');
  });

  test('should reject invalid type status date and relation ids', async () => {
    const service = new PerformanceContractService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:contract:add',
        'performance:contract:update',
      ]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, name: '员工A', departmentId: 11 })
        .mockResolvedValueOnce({ id: 2, name: '员工A', departmentId: 11 })
        .mockResolvedValueOnce({ id: 2, name: '员工A', departmentId: 11 }),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 11, name: '研发部' }),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceContractEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 201 }),
      findOneBy: jest.fn().mockResolvedValue({
        id: 201,
        employeeId: 2,
        type: 'full-time',
        title: '劳动合同',
        contractNumber: 'HT-201',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        probationPeriod: 3,
        salary: 15000,
        position: '前端工程师',
        departmentId: 11,
        status: 'draft',
      }),
    };
    attachAccessContextService(service);

    await expect(
      service.add({
        employeeId: 999,
        type: 'full-time',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
      })
    ).rejects.toThrow('员工不存在');

    await expect(
      service.add({
        employeeId: 2,
        type: 'signing',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
      })
    ).rejects.toThrow('合同类型不合法');

    await expect(
      service.add({
        employeeId: 2,
        type: 'full-time',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        departmentId: 999,
      })
    ).rejects.toThrow('部门不存在');

    await expect(
      service.updateContract({
        id: 201,
        employeeId: 2,
        type: 'full-time',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        status: 'signing',
      })
    ).rejects.toThrow('合同状态不合法');
  });

  test('should reject invalid end date and active delete', async () => {
    const service = new PerformanceContractService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:contract:add',
        'performance:contract:delete',
      ]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 2, name: '员工A', departmentId: 11 }),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceContractEntity = {
      findBy: jest.fn().mockResolvedValue([{ id: 301, status: 'active' }]),
    };
    attachAccessContextService(service);

    await expect(
      service.add({
        employeeId: 2,
        type: 'full-time',
        startDate: '2026-06-01',
        endDate: '2026-06-01',
        departmentId: 11,
      })
    ).rejects.toThrow('结束日期必须晚于开始日期');

    await expect(service.delete([301])).rejects.toThrow('当前状态不允许删除');
  });

  test('should reject draft-only creation and invalid probation or salary', async () => {
    const service = new PerformanceContractService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:contract:add']),
    };
    service.baseSysUserEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ id: 2, name: '员工A', departmentId: 11 }),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceContractEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn(),
    };
    attachAccessContextService(service);

    await expect(
      service.add({
        employeeId: 2,
        type: 'full-time',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        departmentId: 11,
        status: 'active',
      })
    ).rejects.toThrow('新增合同状态只能为 draft');

    await expect(
      service.add({
        employeeId: 2,
        type: 'full-time',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        departmentId: 11,
        probationPeriod: -1,
      })
    ).rejects.toThrow('试用期不合法');

    await expect(
      service.add({
        employeeId: 2,
        type: 'full-time',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        departmentId: 11,
        salary: 'abc',
      })
    ).rejects.toThrow('薪资金额不合法');
  });

  test('should reject editing expired or terminated contracts', async () => {
    const service = new PerformanceContractService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:contract:update']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceContractEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce({
          id: 401,
          employeeId: 2,
          status: 'expired',
        })
        .mockResolvedValueOnce({
          id: 402,
          employeeId: 2,
          status: 'terminated',
        }),
    };
    attachAccessContextService(service);

    await expect(
      service.updateContract({
        id: 401,
        employeeId: 2,
        type: 'full-time',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
      })
    ).rejects.toThrow('当前状态不允许编辑');

    await expect(
      service.updateContract({
        id: 402,
        employeeId: 2,
        type: 'full-time',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
      })
    ).rejects.toThrow('当前状态不允许编辑');
  });
});
