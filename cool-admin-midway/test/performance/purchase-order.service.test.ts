/// <reference types="jest" />
/**
 * 采购订单与采购报表定向测试。
 * 这里只覆盖主题11扩容后的最小闭环：流程动作、非法流转、经理范围、员工拒绝、终态锁定和报表只读。
 */
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import { PerformancePurchaseOrderService } from '../../src/modules/performance/service/purchase-order';
import { PerformancePurchaseReportService } from '../../src/modules/performance/service/purchase-report';

const ALL_PURCHASE_ORDER_PERMS = [
  'performance:purchaseOrder:page',
  'performance:purchaseOrder:info',
  'performance:purchaseOrder:add',
  'performance:purchaseOrder:update',
  'performance:purchaseOrder:delete',
  'performance:purchaseOrder:submitInquiry',
  'performance:purchaseOrder:submitApproval',
  'performance:purchaseOrder:approve',
  'performance:purchaseOrder:reject',
  'performance:purchaseOrder:receive',
  'performance:purchaseOrder:close',
];

const MANAGER_PURCHASE_ORDER_PERMS = [
  'performance:purchaseOrder:page',
  'performance:purchaseOrder:info',
  'performance:purchaseOrder:add',
  'performance:purchaseOrder:update',
  'performance:purchaseOrder:submitInquiry',
  'performance:purchaseOrder:submitApproval',
  'performance:purchaseOrder:approve',
  'performance:purchaseOrder:reject',
  'performance:purchaseOrder:receive',
  'performance:purchaseOrder:close',
];

const REPORT_PERMS = [
  'performance:purchaseReport:summary',
  'performance:purchaseReport:trend',
  'performance:purchaseReport:supplierStats',
];

const decodeIn = (value: any) => (value && value._type === 'in' ? value._value : null);

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

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

const buildOrder = (overrides: Record<string, any> = {}) => ({
  id: 11,
  orderNo: 'PO-011',
  title: '办公设备采购',
  supplierId: 6,
  departmentId: 21,
  requesterId: 8,
  orderDate: '2026-04-19',
  expectedDeliveryDate: '2026-04-25',
  totalAmount: 20000,
  currency: 'CNY',
  remark: '季度采购',
  status: 'draft',
  approvedBy: null,
  approvedAt: null,
  approvalRemark: null,
  closedReason: null,
  receivedQuantity: 0,
  receivedAt: null,
  items: [{ name: '笔记本', quantity: 10, unitPrice: 2000, totalAmount: 20000 }],
  inquiryRecords: [],
  approvalLogs: [],
  receiptRecords: [],
  createTime: '2026-04-19 09:00:00',
  updateTime: '2026-04-19 09:00:00',
  tenantId: null,
  ...overrides,
});

const buildAddPayload = (overrides: Record<string, any> = {}) => ({
  orderNo: 'PO-100',
  title: '办公设备采购',
  supplierId: 6,
  departmentId: 21,
  requesterId: 8,
  orderDate: '2026-04-19',
  expectedDeliveryDate: '2026-04-25',
  totalAmount: 20000,
  currency: 'CNY',
  remark: '季度采购',
  items: [{ name: '笔记本', quantity: 10, unitPrice: 2000 }],
  ...overrides,
});

function createLookupRepo(rows: any[]) {
  const list = rows.map(item => clone(item));

  return {
    findOneBy: jest.fn().mockImplementation(async (where: any) => {
      if (where.id !== undefined) {
        const found = list.find(item => Number(item.id) === Number(where.id));
        return found ? clone(found) : null;
      }

      if (where.code !== undefined) {
        const found = list.find(item => item.code === where.code);
        return found ? clone(found) : null;
      }

      return null;
    }),
    findBy: jest.fn().mockImplementation(async (where: any) => {
      let result = list.slice();
      const ids = decodeIn(where?.id);
      if (ids) {
        result = result.filter(item => ids.includes(Number(item.id)));
      }
      return clone(result);
    }),
  };
}

function createPurchaseOrderRepo(initialOrders: any[]) {
  const orders = initialOrders.map(item => clone(item));
  let nextId = orders.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;

  const repo = {
    create: jest.fn().mockImplementation((payload: any) => clone(payload)),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const now = '2026-04-19 10:00:00';
      const saved = {
        id: nextId++,
        createTime: now,
        updateTime: now,
        tenantId: null,
        ...clone(payload),
      };
      orders.push(saved);
      return { id: saved.id };
    }),
    update: jest.fn().mockImplementation(async (where: any, payload: any) => {
      const row = orders.find(item => Number(item.id) === Number(where.id));
      if (row) {
        Object.assign(row, clone(payload), { updateTime: '2026-04-19 10:10:00' });
      }
    }),
    findOneBy: jest.fn().mockImplementation(async (where: any) => {
      if (where.id !== undefined) {
        const found = orders.find(item => Number(item.id) === Number(where.id));
        return found ? clone(found) : null;
      }
      if (where.orderNo !== undefined) {
        const found = orders.find(item => item.orderNo === where.orderNo);
        return found ? clone(found) : null;
      }
      return null;
    }),
    findBy: jest.fn().mockImplementation(async (where: any) => {
      let result = orders.slice();
      const ids = decodeIn(where?.id);
      const supplierIds = decodeIn(where?.supplierId);
      const statuses = decodeIn(where?.status);

      if (ids) {
        result = result.filter(item => ids.includes(Number(item.id)));
      }
      if (supplierIds) {
        result = result.filter(item => supplierIds.includes(Number(item.supplierId)));
      }
      if (statuses) {
        result = result.filter(item => statuses.includes(item.status));
      } else if (typeof where?.status === 'string') {
        result = result.filter(item => item.status === where.status);
      }

      return clone(result);
    }),
    delete: jest.fn().mockImplementation(async (ids: number[]) => {
      ids.forEach(id => {
        const index = orders.findIndex(item => Number(item.id) === Number(id));
        if (index >= 0) {
          orders.splice(index, 1);
        }
      });
    }),
    find: jest.fn().mockImplementation(async () => clone(orders)),
  };

  return {
    repo,
    getOrders: () => clone(orders),
  };
}

function createPurchaseOrderService(options: {
  perms: string[];
  admin: any;
  scopedDepartmentIds?: number[];
  orders?: any[];
}) {
  const orderRepo = createPurchaseOrderRepo(options.orders || []);
  const service = new PerformancePurchaseOrderService() as any;

  service.ctx = { admin: options.admin };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(options.perms),
  };
  service.baseSysPermsService = {
    departmentIds: jest.fn().mockResolvedValue(options.scopedDepartmentIds || []),
  };
  service.performancePurchaseOrderEntity = orderRepo.repo;
  service.performanceSupplierEntity = createLookupRepo([
    { id: 6, name: '星云供应商' },
    { id: 7, name: '北辰供应商' },
  ]);
  service.baseSysDepartmentEntity = createLookupRepo([
    { id: 21, name: '平台研发部' },
    { id: 22, name: '市场部' },
  ]);
  service.baseSysUserEntity = createLookupRepo([
    { id: 1, name: 'HR 管理员' },
    { id: 8, name: '张三' },
    { id: 9, name: '李经理' },
  ]);
  attachAccessContext(service);

  return { service, orderRepo };
}

function createPurchaseReportService(options: {
  perms: string[];
  admin: any;
  scopedDepartmentIds?: number[];
  orders: any[];
}) {
  const orderRepo = createPurchaseOrderRepo(options.orders);
  const service = new PerformancePurchaseReportService() as any;

  service.ctx = { admin: options.admin };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(options.perms),
  };
  service.baseSysPermsService = {
    departmentIds: jest.fn().mockResolvedValue(options.scopedDepartmentIds || []),
  };
  service.performancePurchaseOrderEntity = orderRepo.repo;
  service.performanceSupplierEntity = createLookupRepo([
    { id: 6, name: '星云供应商' },
    { id: 7, name: '北辰供应商' },
  ]);

  attachAccessContext(service);

  return { service };
}

describe('performance purchase order service', () => {
  test('should support hr purchase order flow normal path', async () => {
    const { service } = createPurchaseOrderService({
      perms: ALL_PURCHASE_ORDER_PERMS,
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
        name: 'HR 管理员',
      },
    });

    const created = await service.add({
      orderNo: 'PO-100',
      title: '办公设备采购',
      supplierId: 6,
      departmentId: 21,
      requesterId: 8,
      orderDate: '2026-04-19',
      expectedDeliveryDate: '2026-04-25',
      totalAmount: 20000,
      remark: '季度采购',
      items: [{ name: '笔记本', quantity: 10, unitPrice: 2000 }],
    });
    const inquiring = await service.submitInquiry({
      id: created.id,
      inquiryRemark: '已询三家供应商',
    });
    const pendingApproval = await service.submitApproval({
      id: created.id,
      approvalRemark: '提交主管审批',
    });
    const approved = await service.approve({
      id: created.id,
      approvalRemark: '预算通过',
    });
    const received = await service.receive({
      id: created.id,
      quantity: 4,
      remark: '首批收货',
    });
    const closed = await service.close({
      id: created.id,
      closedReason: '项目采购完成',
    });

    expect(created).toMatchObject({
      orderNo: 'PO-100',
      status: 'draft',
      expectedDeliveryDate: '2026-04-25',
      receivedQuantity: 0,
    });
    expect(inquiring).toMatchObject({
      id: created.id,
      status: 'inquiring',
    });
    expect(inquiring.inquiryRecords).toHaveLength(1);
    expect(pendingApproval).toMatchObject({
      id: created.id,
      status: 'pendingApproval',
    });
    expect(approved).toMatchObject({
      id: created.id,
      status: 'approved',
      approvedBy: 1,
      approvedByName: 'HR 管理员',
      approvalRemark: '预算通过',
    });
    expect(received).toMatchObject({
      id: created.id,
      status: 'received',
      receivedQuantity: 4,
    });
    expect(received.receiptRecords).toHaveLength(1);
    expect(closed).toMatchObject({
      id: created.id,
      status: 'closed',
      closedReason: '项目采购完成',
      receivedQuantity: 4,
    });
  });

  test('should reject illegal transition and lock terminal state', async () => {
    const { service } = createPurchaseOrderService({
      perms: ALL_PURCHASE_ORDER_PERMS,
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
        name: 'HR 管理员',
      },
      orders: [buildOrder({ id: 12, orderNo: 'PO-012' })],
    });

    await expect(service.approve({ id: 12, approvalRemark: '直接审批' })).rejects.toThrow(
      '当前状态不允许审批'
    );
    await service.submitInquiry({ id: 12, inquiryRemark: '进入询价' });
    await expect(
      service.submitInquiry({ id: 12, inquiryRemark: '重复提交询价' })
    ).rejects.toThrow('当前状态不允许提交询价');
    await expect(
      service.reject({ id: 12, approvalRemark: '未到审批态驳回' })
    ).rejects.toThrow('当前状态不允许驳回');
    await service.submitApproval({ id: 12, approvalRemark: '进入审批' });
    await expect(
      service.submitApproval({ id: 12, approvalRemark: '重复提交审批' })
    ).rejects.toThrow('当前状态不允许提交采购审批');
    await service.approve({ id: 12, approvalRemark: '审批通过' });
    await service.close({ id: 12, closedReason: '无需收货关闭' });

    await expect(
      service.receive({ id: 12, quantity: 1, remark: '终态后收货' })
    ).rejects.toThrow('当前状态不允许收货');
    await expect(
      service.updatePurchaseOrder({ id: 12, title: '终态编辑', supplierId: 6, departmentId: 21, requesterId: 8, orderDate: '2026-04-19', totalAmount: 10 })
    ).rejects.toThrow('当前状态不允许编辑');
    await expect(service.delete([12])).rejects.toThrow('当前状态不允许删除');
  });

  test('should reject manager out-of-scope actions and employee access', async () => {
    const { service } = createPurchaseOrderService({
      perms: MANAGER_PURCHASE_ORDER_PERMS,
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
        name: '李经理',
      },
      scopedDepartmentIds: [21],
      orders: [
        buildOrder({ id: 21, orderNo: 'PO-021', departmentId: 21 }),
        buildOrder({ id: 22, orderNo: 'PO-022', departmentId: 22 }),
      ],
    });

    const ownDepartmentResult = await service.submitInquiry({
      id: 21,
      inquiryRemark: '经理可提交本部门询价',
    });
    expect(ownDepartmentResult.status).toBe('inquiring');

    await expect(
      service.submitInquiry({ id: 22, inquiryRemark: '跨部门询价' })
    ).rejects.toThrow('无权操作该采购订单');

    const employeeService = new PerformancePurchaseOrderService() as any;
    employeeService.ctx = {
      admin: { userId: 3, username: 'employee', roleIds: [3], name: '普通员工' },
    };
    employeeService.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
    employeeService.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    attachAccessContext(employeeService);

    await expect(
      employeeService.add({
        title: '员工越权新增',
        supplierId: 6,
        departmentId: 21,
        requesterId: 8,
        orderDate: '2026-04-19',
        totalAmount: 10,
      })
    ).rejects.toThrow('无权限新增采购订单');
  });

  test('should reject invalid purchase order validation inputs with shared semantics', async () => {
    const { service } = createPurchaseOrderService({
      perms: ALL_PURCHASE_ORDER_PERMS,
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
        name: 'HR 管理员',
      },
      orders: [buildOrder({ id: 41, orderNo: 'PO-041' })],
    });

    await expect(
      service.add(buildAddPayload({ orderNo: 'PO-STATUS', status: 'archived' }))
    ).rejects.toThrow('采购订单状态不合法');
    await expect(
      service.add(buildAddPayload({ orderNo: 'PO-CURRENCY', currency: ' '.repeat(21) }))
    ).rejects.toThrow('币种不合法');
    await expect(
      service.add(buildAddPayload({ orderNo: 'PO-AMOUNT', totalAmount: -1 }))
    ).rejects.toThrow('订单总金额不合法');
    await expect(
      service.add(buildAddPayload({ orderNo: 'PO-ITEMS', items: { name: '笔记本' } }))
    ).rejects.toThrow('采购明细格式不合法');
    await expect(
      service.add(buildAddPayload({ orderNo: 'PO-JSON', items: '{"name":' }))
    ).rejects.toThrow('JSON 字段格式不合法');
    await expect(
      service.add(buildAddPayload({ orderNo: 'PO-041' }))
    ).rejects.toThrow('订单编号已存在');
    await expect(
      service.add(buildAddPayload({ orderNo: 'PO-REQUESTER', requesterId: 999 }))
    ).rejects.toThrow('申请人不存在');
    await expect(
      service.add(buildAddPayload({ orderNo: 'PO-STATUS-ACTION', status: 'approved' }))
    ).rejects.toThrow('请通过流程动作更新采购状态');
  });

  test('should reject receive quantity overflow with shared semantics', async () => {
    const { service } = createPurchaseOrderService({
      perms: ALL_PURCHASE_ORDER_PERMS,
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
        name: 'HR 管理员',
      },
      orders: [
        buildOrder({
          id: 42,
          orderNo: 'PO-042',
          status: 'approved',
          receivedQuantity: 1,
          items: [{ name: '笔记本', quantity: 2, unitPrice: 2000, totalAmount: 4000 }],
        }),
      ],
    });

    await expect(
      service.receive({ id: 42, quantity: 2, remark: '超量收货' })
    ).rejects.toThrow('累计收货数量不能超过明细数量');
  });
});

describe('performance purchase report service', () => {
  test('should keep report read-only with hr full scope and manager scoped access', async () => {
    const reportOrders = [
      buildOrder({
        id: 31,
        orderNo: 'PO-031',
        supplierId: 6,
        departmentId: 21,
        orderDate: '2026-04-05',
        status: 'approved',
        totalAmount: 12000,
      }),
      buildOrder({
        id: 32,
        orderNo: 'PO-032',
        supplierId: 6,
        departmentId: 21,
        orderDate: '2026-04-08',
        status: 'received',
        totalAmount: 8000,
        receivedQuantity: 4,
      }),
      buildOrder({
        id: 33,
        orderNo: 'PO-033',
        supplierId: 7,
        departmentId: 22,
        orderDate: '2026-05-02',
        status: 'closed',
        totalAmount: 6000,
      }),
    ];
    const hrReport = createPurchaseReportService({
      perms: [...REPORT_PERMS, 'performance:purchaseOrder:delete'],
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
        name: 'HR 管理员',
      },
      orders: reportOrders,
    }).service;

    const hrSummary = await hrReport.summary({});
    const hrTrend = await hrReport.trend({});
    const hrSupplierStats = await hrReport.supplierStats({});

    expect(hrSummary).toEqual({
      totalOrders: 3,
      totalAmount: 26000,
      supplierCount: 2,
      totalReceivedQuantity: 4,
      draftCount: 0,
      inquiringCount: 0,
      pendingApprovalCount: 0,
      approvedCount: 1,
      receivedCount: 1,
      closedCount: 1,
      cancelledCount: 0,
    });
    expect(hrTrend).toEqual([
      {
        month: '2026-04',
        period: '2026-04',
        orderCount: 2,
        totalAmount: 20000,
        approvedCount: 1,
        receivedQuantity: 4,
        receivedCount: 1,
        closedCount: 0,
        cancelledCount: 0,
      },
      {
        month: '2026-05',
        period: '2026-05',
        orderCount: 1,
        totalAmount: 6000,
        approvedCount: 0,
        receivedQuantity: 0,
        receivedCount: 0,
        closedCount: 1,
        cancelledCount: 0,
      },
    ]);
    expect(hrSupplierStats).toEqual([
      {
        supplierId: 6,
        supplierName: '星云供应商',
        orderCount: 2,
        totalAmount: 20000,
        approvedCount: 1,
        receivedCount: 1,
        closedCount: 0,
        receivedQuantity: 4,
        lastOrderDate: '2026-04-08',
      },
      {
        supplierId: 7,
        supplierName: '北辰供应商',
        orderCount: 1,
        totalAmount: 6000,
        approvedCount: 0,
        receivedCount: 0,
        closedCount: 1,
        receivedQuantity: 0,
        lastOrderDate: '2026-05-02',
      },
    ]);

    const managerReport = createPurchaseReportService({
      perms: REPORT_PERMS,
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
        name: '李经理',
      },
      scopedDepartmentIds: [21],
      orders: reportOrders,
    }).service;

    expect(await managerReport.summary({})).toMatchObject({
      totalOrders: 2,
      totalAmount: 20000,
      approvedCount: 1,
      receivedCount: 1,
      closedCount: 0,
    });
    await expect(managerReport.summary({ departmentId: 22 })).rejects.toThrow(
      '无权查看该部门采购报表'
    );

    const employeeReport = createPurchaseReportService({
      perms: [],
      admin: {
        userId: 3,
        username: 'employee',
        roleIds: [3],
        name: '普通员工',
      },
      scopedDepartmentIds: [],
      orders: reportOrders,
    }).service;

    await expect(employeeReport.summary({})).rejects.toThrow('无权限查看采购报表汇总');
  });
});
