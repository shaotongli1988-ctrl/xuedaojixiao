/// <reference types="jest" />
/**
 * 供应商服务定向测试。
 * 这里只覆盖主题11扩容后仍然成立的 HR 全量、经理只读脱敏、员工拒绝和未结束采购单删除拦截。
 */
import { PerformanceSupplierService } from '../../src/modules/performance/service/supplier';

const SUPPLIER_PERMS = [
  'performance:supplier:page',
  'performance:supplier:info',
  'performance:supplier:add',
  'performance:supplier:update',
  'performance:supplier:delete',
];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const createPageQueryBuilder = (rows: any[]) => ({
  select: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(rows.length),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(clone(rows)),
});

describe('performance supplier service', () => {
  test('should support hr supplier normal path', async () => {
    const supplierRecord = {
      id: 7,
      name: '星云供应商',
      code: 'SUP-001',
      category: '硬件',
      contactName: '张敏',
      contactPhone: '13800135678',
      contactEmail: 'zhang@example.com',
      bankAccount: '6222020202026789',
      taxNo: '91350100ABC12345',
      remark: '重点合作',
      status: 'active',
      createTime: '2026-04-19 10:00:00',
      updateTime: '2026-04-19 10:00:00',
    };
    const qb = createPageQueryBuilder([supplierRecord]);
    const service = new PerformanceSupplierService() as any;

    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(SUPPLIER_PERMS),
    };
    service.performanceSupplierEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.code === 'SUP-001') {
          return Promise.resolve(null);
        }
        if (where.id === 7) {
          return Promise.resolve(clone(supplierRecord));
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation((payload: any) => clone(payload)),
      save: jest.fn().mockResolvedValue({ id: 7 }),
      update: jest.fn().mockImplementation((_where: any, payload: any) => {
        Object.assign(supplierRecord, payload);
        return Promise.resolve(undefined);
      }),
      findBy: jest.fn().mockResolvedValue([{ id: 7, status: 'inactive' }]),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    service.performancePurchaseOrderEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };

    const pageResult = await service.page({ page: 1, size: 10, keyword: '星云' });
    const infoResult = await service.info(7);
    const addResult = await service.add({
      name: '星云供应商',
      code: 'SUP-001',
      category: '硬件',
      contactName: '张敏',
      contactPhone: '13800135678',
      contactEmail: 'zhang@example.com',
      bankAccount: '6222020202026789',
      taxNo: '91350100ABC12345',
      remark: '重点合作',
    });
    const updateResult = await service.updateSupplier({
      id: 7,
      status: 'inactive',
    });
    await service.delete([7]);

    expect(pageResult.list[0]).toMatchObject({
      id: 7,
      bankAccount: '6222020202026789',
      taxNo: '91350100ABC12345',
    });
    expect(infoResult).toMatchObject({
      id: 7,
      bankAccount: '6222020202026789',
      taxNo: '91350100ABC12345',
    });
    expect(addResult).toMatchObject({ id: 7, status: 'active' });
    expect(updateResult).toMatchObject({ id: 7, status: 'inactive' });
    expect(service.performanceSupplierEntity.delete).toHaveBeenCalledWith([7]);
  });

  test('should mask supplier fields for manager and reject mutations', async () => {
    const qb = createPageQueryBuilder([
      {
        id: 8,
        name: '北辰供应商',
        code: 'SUP-008',
        category: '软件',
        contactName: '王超',
        contactPhone: '13812345678',
        contactEmail: 'wang@example.com',
        bankAccount: '6222020202026789',
        taxNo: '91350100ABC12345',
        remark: null,
        status: 'active',
        createTime: '2026-04-19 09:00:00',
        updateTime: '2026-04-19 09:00:00',
      },
    ]);
    const service = new PerformanceSupplierService() as any;

    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:supplier:page',
        'performance:supplier:info',
      ]),
    };
    service.performanceSupplierEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOneBy: jest.fn().mockResolvedValue({
        id: 8,
        name: '北辰供应商',
        code: 'SUP-008',
        category: '软件',
        contactName: '王超',
        contactPhone: '13812345678',
        contactEmail: 'wang@example.com',
        bankAccount: '6222020202026789',
        taxNo: '91350100ABC12345',
        remark: null,
        status: 'active',
        createTime: '2026-04-19 09:00:00',
        updateTime: '2026-04-19 09:00:00',
      }),
    };
    service.performancePurchaseOrderEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };

    const pageResult = await service.page({ page: 1, size: 10 });
    const infoResult = await service.info(8);

    expect(pageResult.list[0]).toMatchObject({
      bankAccount: '************6789',
      taxNo: '91************45',
      contactName: '王*',
      contactPhone: '138****5678',
      contactEmail: 'w***@example.com',
    });
    expect(infoResult).toMatchObject({
      bankAccount: '************6789',
      taxNo: '91************45',
      contactName: '王*',
      contactPhone: '138****5678',
      contactEmail: 'w***@example.com',
    });
    await expect(service.add({ name: '北辰供应商' })).rejects.toThrow('无权限新增供应商');
    await expect(service.updateSupplier({ id: 8 })).rejects.toThrow('无权限修改供应商');
    await expect(service.delete([8])).rejects.toThrow('无权限删除供应商');
  });

  test('should reject employee access, duplicate code and linked non-terminal orders on delete', async () => {
    const employeeService = new PerformanceSupplierService() as any;
    employeeService.ctx = {
      admin: {
        userId: 3,
        username: 'employee_platform',
        roleIds: [3],
      },
    };
    employeeService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };

    await expect(employeeService.page({ page: 1, size: 10 })).rejects.toThrow(
      '无权限查看供应商列表'
    );

    const hrService = new PerformanceSupplierService() as any;
    hrService.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    hrService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:supplier:add',
        'performance:supplier:update',
        'performance:supplier:delete',
      ]),
    };
    hrService.performanceSupplierEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce({ id: 88, code: 'SUP-088' })
        .mockResolvedValueOnce({
          id: 9,
          name: '待删供应商',
          code: 'SUP-009',
          category: null,
          contactName: null,
          contactPhone: null,
          contactEmail: null,
          bankAccount: null,
          taxNo: null,
          remark: null,
          status: 'inactive',
        }),
      findBy: jest.fn().mockResolvedValue([{ id: 9, status: 'inactive' }]),
    };
    hrService.performancePurchaseOrderEntity = {
      findBy: jest.fn().mockResolvedValue([{ id: 101, supplierId: 9, status: 'active' }]),
    };

    await expect(
      hrService.add({
        name: '重复编码供应商',
        code: 'SUP-088',
      })
    ).rejects.toThrow('供应商编码已存在');
    await expect(hrService.delete([9])).rejects.toThrow(
      '供应商存在有效采购订单，不允许删除'
    );
    expect(hrService.performancePurchaseOrderEntity.findBy).toHaveBeenCalledWith({
      supplierId: expect.anything(),
      status: expect.anything(),
    });
  });
});
