/// <reference types="jest" />
/**
 * 物资管理领域服务最小回归测试。
 * 这里只覆盖一期冻结链路中的入库/领用状态流转、库存增减与库存不足保护，
 * 不覆盖控制器装饰器、真实数据库映射、分页查询或二期预留/归还能力。
 * 维护重点是库存只允许在 `receive` / `issue` 终态动作时回写，避免状态机与库存规则漂移。
 */
import { PerformanceMaterialDomainService } from '../../src/modules/performance/service/material-domain';
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';

const MATERIAL_PERMS = [
  'performance:materialInbound:info',
  'performance:materialInbound:submit',
  'performance:materialInbound:receive',
  'performance:materialIssue:info',
  'performance:materialIssue:submit',
  'performance:materialIssue:issue',
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function matchWhere(row: Record<string, any>, where: Record<string, any>) {
  return Object.entries(where || {}).every(([key, value]) => row[key] === value);
}

function createMemoryRepo(initialRows: any[] = []) {
  const rows = initialRows.map(item => clone(item));
  let currentId = rows.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0);

  return {
    rows,
    find: jest.fn(async () => rows.map(item => clone(item))),
    findOneBy: jest.fn(async (where: any) => {
      const found = rows.find(item => matchWhere(item, where));
      return found ? clone(found) : null;
    }),
    create: jest.fn((payload: any) => clone(payload)),
    save: jest.fn(async (payload: any) => {
      if (payload.id) {
        const index = rows.findIndex(item => Number(item.id) === Number(payload.id));
        if (index >= 0) {
          rows[index] = {
            ...rows[index],
            ...clone(payload),
            updateTime: '2026-04-19 10:00:00',
          };
          return clone(rows[index]);
        }
      }

      currentId += 1;
      const next = {
        id: currentId,
        createTime: '2026-04-19 10:00:00',
        updateTime: '2026-04-19 10:00:00',
        ...clone(payload),
      };
      rows.push(next);
      return clone(next);
    }),
    update: jest.fn(async (where: any, payload: any) => {
      const row = rows.find(item => matchWhere(item, where));
      if (row) {
        Object.assign(row, clone(payload), {
          updateTime: '2026-04-19 10:00:00',
        });
      }
    }),
  };
}

function buildCatalog(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    code: 'MAT-001',
    name: '办公纸',
    category: '办公耗材',
    specification: 'A4/80g',
    unit: '包',
    safetyStock: 2,
    referenceUnitCost: 8,
    status: 'active',
    remark: null,
    createTime: '2026-04-19 09:00:00',
    updateTime: '2026-04-19 09:00:00',
    ...overrides,
  };
}

function buildStock(overrides: Record<string, any> = {}) {
  return {
    id: 101,
    catalogId: 1,
    departmentId: 10,
    currentQty: 10,
    availableQty: 10,
    reservedQty: 0,
    issuedQty: 0,
    lastUnitCost: 8,
    lastInboundTime: null,
    lastIssueTime: null,
    createTime: '2026-04-19 09:30:00',
    updateTime: '2026-04-19 09:30:00',
    ...overrides,
  };
}

function buildInbound(overrides: Record<string, any> = {}) {
  return {
    id: 201,
    inboundNo: 'MAT-IN-0001',
    title: '采购到货入库',
    catalogId: 1,
    departmentId: 10,
    quantity: 8,
    unitCost: 12,
    totalAmount: 96,
    sourceType: 'purchase',
    sourceBizId: 'PO-1',
    submittedAt: null,
    receivedBy: null,
    receivedAt: null,
    status: 'draft',
    remark: null,
    createTime: '2026-04-19 09:00:00',
    updateTime: '2026-04-19 09:00:00',
    ...overrides,
  };
}

function buildIssue(overrides: Record<string, any> = {}) {
  return {
    id: 301,
    issueNo: 'MAT-OUT-0001',
    title: '部门领用',
    catalogId: 1,
    departmentId: 10,
    quantity: 4,
    assigneeId: 2,
    assigneeName: '张三',
    purpose: '日常办公',
    issueDate: '2026-04-19 14:00:00',
    submittedAt: null,
    issuedBy: null,
    issuedAt: null,
    status: 'draft',
    remark: null,
    createTime: '2026-04-19 09:00:00',
    updateTime: '2026-04-19 09:00:00',
    ...overrides,
  };
}

function createService(options?: {
  stocks?: any[];
  inbounds?: any[];
  issues?: any[];
  perms?: string[];
}) {
  const catalogRepo = createMemoryRepo([buildCatalog()]);
  const stockRepo = createMemoryRepo(options?.stocks || []);
  const inboundRepo = createMemoryRepo(options?.inbounds || []);
  const issueRepo = createMemoryRepo(options?.issues || []);
  const stockLogRepo = createMemoryRepo([]);
  const departmentRepo = createMemoryRepo([{ id: 10, name: '采购部' }]);
  const userRepo = createMemoryRepo([
    { id: 1, name: '物资管理员' },
    { id: 2, name: '张三' },
  ]);

  const service = new PerformanceMaterialDomainService() as any;
  service.ctx = {
    admin: {
      userId: 1,
      username: 'material_admin',
      name: '物资管理员',
      roleIds: [1],
    },
  };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(options?.perms || MATERIAL_PERMS),
  };
  service.baseSysPermsService = {
    departmentIds: jest.fn().mockResolvedValue([]),
  };
  service.performanceMaterialCatalogEntity = catalogRepo;
  service.performanceMaterialStockEntity = stockRepo;
  service.performanceMaterialInboundEntity = inboundRepo;
  service.performanceMaterialIssueEntity = issueRepo;
  service.performanceMaterialStockLogEntity = stockLogRepo;
  service.baseSysDepartmentEntity = departmentRepo;
  service.baseSysUserEntity = userRepo;
  service.performanceAccessContextService = Object.assign(
    new PerformanceAccessContextService(),
    {
      ctx: service.ctx,
      baseSysMenuService: service.baseSysMenuService,
      baseSysPermsService: service.baseSysPermsService,
    }
  );

  return {
    service,
    repos: {
      stockRepo,
      inboundRepo,
      issueRepo,
      stockLogRepo,
    },
  };
}

describe('performance material domain service', () => {
  test('should submit and receive inbound, creating stock and increasing available qty only on receive', async () => {
    const { service, repos } = createService({
      inbounds: [buildInbound()],
    });

    const submitted = await service.materialInboundSubmit({ id: 201 });

    expect(submitted).toMatchObject({
      id: 201,
      status: 'submitted',
      receivedBy: null,
      receivedAt: null,
    });
    expect(repos.stockRepo.rows).toHaveLength(0);
    expect(repos.stockLogRepo.rows).toHaveLength(0);

    const received = await service.materialInboundReceive({
      id: 201,
      receivedAt: '2026-04-19 11:30:00',
      remark: '到货验收',
    });

    expect(received).toMatchObject({
      id: 201,
      status: 'received',
      receivedBy: 1,
      receivedByName: '物资管理员',
      receivedAt: '2026-04-19 11:30:00',
    });
    expect(repos.stockRepo.rows).toHaveLength(1);
    expect(repos.stockRepo.rows[0]).toMatchObject({
      catalogId: 1,
      departmentId: 10,
      currentQty: 8,
      availableQty: 8,
      reservedQty: 0,
      issuedQty: 0,
      lastUnitCost: 12,
      lastInboundTime: '2026-04-19 11:30:00',
    });
    expect(repos.stockLogRepo.rows[0]).toMatchObject({
      bizType: 'inbound',
      changeType: 'in',
      bizId: 201,
      quantity: 8,
      beforeQuantity: 0,
      afterQuantity: 8,
      catalogId: 1,
      departmentId: 10,
      operatorId: 1,
      operatorName: '物资管理员',
    });
  });

  test('should submit and issue material, decreasing available qty and increasing issued qty only on issue', async () => {
    const { service, repos } = createService({
      stocks: [buildStock({ currentQty: 10, availableQty: 10, issuedQty: 2 })],
      issues: [buildIssue()],
    });

    const stockBeforeIssue = clone(repos.stockRepo.rows[0]);
    const submitted = await service.materialIssueSubmit({ id: 301 });

    expect(submitted).toMatchObject({
      id: 301,
      status: 'submitted',
      issuedBy: null,
      issuedAt: null,
    });
    expect(repos.stockRepo.rows[0]).toMatchObject(stockBeforeIssue);
    expect(repos.stockLogRepo.rows).toHaveLength(0);

    const issued = await service.materialIssueIssue({
      id: 301,
      issuedAt: '2026-04-19 15:00:00',
      remark: '部门领料',
    });

    expect(issued).toMatchObject({
      id: 301,
      status: 'issued',
      issuedBy: 1,
      issuedByName: '物资管理员',
      issuedAt: '2026-04-19 15:00:00',
    });
    expect(repos.stockRepo.rows[0]).toMatchObject({
      currentQty: 6,
      availableQty: 6,
      issuedQty: 6,
      lastIssueTime: '2026-04-19 15:00:00',
    });
    expect(repos.stockLogRepo.rows[0]).toMatchObject({
      bizType: 'issue',
      changeType: 'out',
      bizId: 301,
      quantity: 4,
      beforeQuantity: 10,
      afterQuantity: 6,
      unitCost: 8,
      catalogId: 1,
      departmentId: 10,
      operatorId: 1,
      operatorName: '物资管理员',
    });
  });

  test('should reject issue when available qty is insufficient and keep state unchanged', async () => {
    const { service, repos } = createService({
      stocks: [buildStock({ currentQty: 2, availableQty: 2, issuedQty: 0 })],
      issues: [buildIssue({ status: 'submitted', quantity: 3, submittedAt: '2026-04-19 13:00:00' })],
    });

    const stockSnapshot = clone(repos.stockRepo.rows[0]);
    const issueSnapshot = clone(repos.issueRepo.rows[0]);

    await expect(
      service.materialIssueIssue({
        id: 301,
        issuedAt: '2026-04-19 15:30:00',
      })
    ).rejects.toThrow('可用库存不足，无法完成领用');

    expect(repos.stockRepo.rows[0]).toMatchObject(stockSnapshot);
    expect(repos.issueRepo.rows[0]).toMatchObject(issueSnapshot);
    expect(repos.stockLogRepo.rows).toHaveLength(0);
  });
});
