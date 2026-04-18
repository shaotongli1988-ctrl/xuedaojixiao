/// <reference types="jest" />
/**
 * 采购订单服务最小测试。
 * 这里只验证主题11冻结的 HR/经理/员工权限、部门树范围、状态流转、删除限制和关联校验，不覆盖真实数据库联调。
 */
import { PerformancePurchaseOrderService } from '../../src/modules/performance/service/purchase-order';

const PURCHASE_ORDER_PERMS = [
  'performance:purchaseOrder:page',
  'performance:purchaseOrder:info',
  'performance:purchaseOrder:add',
  'performance:purchaseOrder:update',
  'performance:purchaseOrder:delete',
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

describe('performance purchase order service', () => {
  test('should support hr purchase order normal path', async () => {
    const pageRow = {
      id: 11,
      orderNo: 'PO-001',
      title: '办公设备采购',
      supplierId: 6,
      supplierName: '星云供应商',
      departmentId: 21,
      departmentName: '平台研发部',
      requesterId: 8,
      requesterName: '张三',
      orderDate: '2026-04-18',
      totalAmount: '18888.50',
      currency: 'CNY',
      remark: '季度采购',
      status: 'draft',
      createTime: '2026-04-18 10:00:00',
      updateTime: '2026-04-18 10:00:00',
    };
    const purchaseOrderRecord = {
      id: 11,
      orderNo: 'PO-001',
      title: '办公设备采购',
      supplierId: 6,
      departmentId: 21,
      requesterId: 8,
      orderDate: '2026-04-18',
      totalAmount: 18888.5,
      currency: 'CNY',
      remark: '季度采购',
      status: 'draft',
      createTime: '2026-04-18 10:00:00',
      updateTime: '2026-04-18 10:00:00',
    };
    const qb = createPageQueryBuilder([pageRow]);
    const service = new PerformancePurchaseOrderService() as any;

    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(PURCHASE_ORDER_PERMS),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceSupplierEntity = {
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.id === 6) {
          return Promise.resolve({ id: 6, name: '星云供应商' });
        }

        return Promise.resolve(null);
      }),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 21, name: '平台研发部' }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 8, name: '张三' }),
    };
    service.performancePurchaseOrderEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.orderNo === 'PO-001') {
          return Promise.resolve(null);
        }

        if (where.id === 11) {
          return Promise.resolve(purchaseOrderRecord);
        }

        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation((payload: any) => payload),
      save: jest.fn().mockResolvedValue({ id: 11 }),
      update: jest.fn().mockImplementation((_where: any, payload: any) => {
        Object.assign(purchaseOrderRecord, payload);
        return Promise.resolve(undefined);
      }),
      findBy: jest.fn().mockResolvedValue([{ id: 11, status: 'draft' }]),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const pageResult = await service.page({ page: 1, size: 10, keyword: '采购' });
    const infoResult = await service.info(11);
    const addResult = await service.add({
      orderNo: 'PO-001',
      title: '办公设备采购',
      supplierId: 6,
      departmentId: 21,
      requesterId: 8,
      orderDate: '2026-04-18',
      totalAmount: 18888.5,
      remark: '季度采购',
    });
    const updateResult = await service.updatePurchaseOrder({
      id: 11,
      title: '办公设备采购-更新',
      supplierId: 6,
      departmentId: 21,
      requesterId: 8,
      orderDate: '2026-04-18',
      totalAmount: 20000,
      status: 'active',
    });
    await service.delete([11]);

    expect(pageResult).toEqual({
      list: [
        {
          id: 11,
          orderNo: 'PO-001',
          title: '办公设备采购',
          supplierId: 6,
          supplierName: '星云供应商',
          departmentId: 21,
          departmentName: '平台研发部',
          requesterId: 8,
          requesterName: '张三',
          orderDate: '2026-04-18',
          totalAmount: 18888.5,
          currency: 'CNY',
          remark: '季度采购',
          status: 'draft',
          createTime: '2026-04-18 10:00:00',
          updateTime: '2026-04-18 10:00:00',
        },
      ],
      pagination: {
        page: 1,
        size: 10,
        total: 1,
      },
    });
    expect(infoResult).toMatchObject({
      id: 11,
      supplierName: '星云供应商',
      departmentName: '平台研发部',
      requesterName: '张三',
    });
    expect(addResult).toMatchObject({ id: 11, status: 'draft' });
    expect(updateResult).toMatchObject({ id: 11, status: 'active' });
    expect(service.performancePurchaseOrderEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderNo: 'PO-001',
        title: '办公设备采购',
        status: 'draft',
      })
    );
    expect(service.performancePurchaseOrderEntity.update).toHaveBeenCalledWith(
      { id: 11 },
      expect.objectContaining({
        title: '办公设备采购-更新',
        status: 'active',
      })
    );
    expect(service.performancePurchaseOrderEntity.delete).toHaveBeenCalledWith([11]);
  });

  test('should scope manager page and reject out-of-scope or invalid transition', async () => {
    const qb = createPageQueryBuilder([
      {
        id: 22,
        orderNo: 'PO-022',
        title: '部门设备采购',
        supplierId: 6,
        supplierName: '星云供应商',
        departmentId: 21,
        departmentName: '平台研发部',
        requesterId: 9,
        requesterName: '李经理',
        orderDate: '2026-04-18',
        totalAmount: '9000.00',
        currency: 'CNY',
        remark: null,
        status: 'active',
        createTime: '2026-04-18 09:00:00',
        updateTime: '2026-04-18 09:00:00',
      },
    ]);
    const service = new PerformancePurchaseOrderService() as any;

    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:purchaseOrder:page',
        'performance:purchaseOrder:info',
        'performance:purchaseOrder:add',
        'performance:purchaseOrder:update',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([21]),
    };
    service.performanceSupplierEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 6, name: '星云供应商' }),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce({ id: 21, name: '平台研发部' })
        .mockResolvedValueOnce({ id: 22, name: '测试部' }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 9, name: '李经理' }),
    };
    service.performancePurchaseOrderEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.orderNo === 'PO-023' || where.orderNo === 'PO-024') {
          return Promise.resolve(null);
        }

        if (where.id === 22) {
          return Promise.resolve({
            id: 22,
            orderNo: 'PO-022',
            title: '部门设备采购',
            supplierId: 6,
            departmentId: 21,
            requesterId: 9,
            orderDate: '2026-04-18',
            totalAmount: 9000,
            currency: 'CNY',
            remark: null,
            status: 'active',
          });
        }

        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation((payload: any) => payload),
      save: jest.fn().mockResolvedValue({ id: 23 }),
    };
    service.info = jest.fn().mockResolvedValue({ id: 23, status: 'draft' });

    await service.page({ page: 1, size: 10, status: 'active' });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'purchaseOrder.departmentId in (:...departmentIds)',
      { departmentIds: [21] }
    );

    await expect(
      service.add({
        orderNo: 'PO-023',
        title: '新增部门采购',
        supplierId: 6,
        departmentId: 21,
        requesterId: 9,
        orderDate: '2026-04-19',
        totalAmount: 9999,
      })
    ).resolves.toEqual({ id: 23, status: 'draft' });

    await expect(
      service.add({
        orderNo: 'PO-024',
        title: '越权采购',
        supplierId: 6,
        departmentId: 22,
        requesterId: 9,
        orderDate: '2026-04-20',
        totalAmount: 5000,
      })
    ).rejects.toThrow('无权操作该采购订单');

    await expect(
      service.updatePurchaseOrder({
        id: 22,
        title: '部门设备采购',
        supplierId: 6,
        departmentId: 21,
        requesterId: 9,
        orderDate: '2026-04-18',
        totalAmount: 9000,
        status: 'cancelled',
      })
    ).rejects.toThrow('当前状态不允许执行该操作');
  });

  test('should reject employee access, invalid relation and non-draft delete', async () => {
    const employeeService = new PerformancePurchaseOrderService() as any;
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
      '无权限查看采购订单列表'
    );

    const hrService = new PerformancePurchaseOrderService() as any;
    hrService.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    hrService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:purchaseOrder:add',
        'performance:purchaseOrder:update',
        'performance:purchaseOrder:delete',
      ]),
    };
    hrService.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    hrService.performanceSupplierEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 6, name: '星云供应商' }),
    };
    hrService.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 21, name: '平台研发部' }),
    };
    hrService.baseSysUserEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce({ id: 8, name: '张三' })
        .mockResolvedValueOnce({ id: 8, name: '张三' }),
    };
    hrService.performancePurchaseOrderEntity = {
      findOneBy: jest.fn().mockImplementation((where: any) => {
        if (where.id === 31) {
          return Promise.resolve({
            id: 31,
            orderNo: 'PO-031',
            title: '正式采购',
            supplierId: 6,
            departmentId: 21,
            requesterId: 8,
            orderDate: '2026-04-18',
            totalAmount: 1000,
            currency: 'CNY',
            status: 'draft',
          });
        }

        return Promise.resolve(null);
      }),
      findBy: jest.fn().mockResolvedValue([{ id: 31, status: 'active' }]),
    };

    await expect(
      hrService.add({
        orderNo: 'PO-031',
        title: '正式采购',
        supplierId: 999,
        departmentId: 21,
        requesterId: 8,
        orderDate: '2026-04-18',
        totalAmount: 1000,
      })
    ).rejects.toThrow('供应商不存在');

    await expect(
      hrService.updatePurchaseOrder({
        id: 31,
        title: '正式采购',
        supplierId: 6,
        departmentId: 21,
        requesterId: 8,
        orderDate: '2026-04-18',
        totalAmount: 1000,
        status: 'invalid',
      })
    ).rejects.toThrow('采购订单状态不合法');

    await expect(hrService.delete([31])).rejects.toThrow('当前状态不允许删除');
  });
});
