/// <reference types="jest" />
/**
 * 资产管理领域服务最小测试。
 * 这里只验证主题20核心状态回写、采购入库落台账和部门范围约束，不覆盖控制器装饰器、真实数据库或前端联调。
 */
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import { PerformanceAssetDomainService } from '../../src/modules/performance/service/asset-domain';

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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function matchWhere(row: any, where: any) {
  return Object.entries(where || {}).every(([key, value]) => row[key] === value);
}

function createMemoryRepo(initialRows: any[] = []) {
  const rows = initialRows.map(item => clone(item));
  let currentId = rows.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0);

  let repo: any;
  repo = {
    rows,
    find: jest.fn(async () => rows.map(item => clone(item))),
    findOne: jest.fn(async (options: any) => {
      const found = rows.find(item => matchWhere(item, options?.where));
      return found ? clone(found) : null;
    }),
    findOneBy: jest.fn(async (where: any) => {
      const found = rows.find(item => matchWhere(item, where));
      return found ? clone(found) : null;
    }),
    findBy: jest.fn(async (where: any) => {
      if (Array.isArray(where)) {
        return rows
          .filter(item => where.some(condition => matchWhere(item, condition)))
          .map(item => clone(item));
      }
      return rows.filter(item => matchWhere(item, where)).map(item => clone(item));
    }),
    create: jest.fn((payload: any) => clone(payload)),
    save: jest.fn(async (payload: any) => {
      if (payload.id) {
        const index = rows.findIndex(item => Number(item.id) === Number(payload.id));
        const next = {
          ...rows[index],
          ...clone(payload),
        };
        rows[index] = next;
        return clone(next);
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
      const target = rows.find(item => matchWhere(item, where));
      if (target) {
        Object.assign(target, clone(payload), {
          updateTime: '2026-04-19 10:00:00',
        });
      }
    }),
    delete: jest.fn(async (where: any) => {
      const index = rows.findIndex(item => matchWhere(item, where));
      if (index >= 0) {
        rows.splice(index, 1);
      }
    }),
    manager: {
      transaction: jest.fn(async (handler: any) =>
        handler({
          getRepository: () => repo,
        })
      ),
    },
  };
  return repo;
}

function createService(perms: string[], departmentIds: number[] = []) {
  const assetInfoRepo = createMemoryRepo([
    {
      id: 1,
      assetNo: 'AST-000001',
      assetName: '办公电脑',
      category: '电子设备',
      status: 'available',
      ownerDepartmentId: 10,
      managerId: 1,
      purchaseCost: 5000,
      netBookValue: 5000,
      depreciationMonths: 12,
      createTime: '2026-04-19 10:00:00',
      updateTime: '2026-04-19 10:00:00',
    },
  ]);
  const assignmentRepo = createMemoryRepo([
    {
      id: 11,
      assetId: 1,
      assigneeId: 2,
      departmentId: 10,
      assignDate: '2026-04-19',
      returnDate: null,
      status: 'assigned',
      purpose: '日常办公',
      returnNote: null,
      createTime: '2026-04-19 10:00:00',
      updateTime: '2026-04-19 10:00:00',
    },
  ]);
  const maintenanceRepo = createMemoryRepo([
    {
      id: 12,
      assetId: 1,
      departmentId: 10,
      maintenanceType: '保养',
      vendor: '服务商A',
      cost: 300,
      startDate: '2026-04-14 09:00:00',
      completedDate: '2026-04-15 18:00:00',
      status: 'completed',
      description: '更换配件',
      result: '已完成',
      createTime: '2026-04-14 09:00:00',
      updateTime: '2026-04-15 18:00:00',
    },
  ]);
  const procurementRepo = createMemoryRepo([
    {
      id: 21,
      procurementNo: 'ASSET-IN-0001',
      title: '新增办公电脑',
      purchaseOrderId: null,
      supplierId: null,
      ownerDepartmentId: 10,
      managerId: 1,
      assetName: '办公电脑',
      category: '电子设备',
      assetType: '电脑',
      brand: 'Lenovo',
      model: 'ThinkPad',
      serialNo: 'SN',
      location: 'A-01',
      purchaseDate: '2026-04-19',
      unitCost: 5000,
      quantity: 2,
      warrantyExpiry: '2027-04-19',
      depreciationMonths: 12,
      receivedAssetIds: [],
      submittedAt: '2026-04-19 10:00:00',
      receivedAt: null,
      status: 'submitted',
      remark: '',
      createTime: '2026-04-19 10:00:00',
      updateTime: '2026-04-19 10:00:00',
    },
  ]);
  const transferRepo = createMemoryRepo();
  const inventoryRepo = createMemoryRepo();
  const depreciationRepo = createMemoryRepo([
    {
      id: 41,
      assetId: 1,
      periodValue: '2026-04',
      depreciationAmount: 416.67,
      accumulatedAmount: 416.67,
      netBookValue: 4583.33,
      sourceCost: 5000,
      recalculatedAt: '2026-04-02 08:00:00',
      createTime: '2026-04-02 08:00:00',
      updateTime: '2026-04-02 08:00:00',
    },
  ]);
  const disposalRepo = createMemoryRepo([
    {
      id: 31,
      disposalNo: 'ASSET-DP-0001',
      assetId: 1,
      ownerDepartmentId: 10,
      reason: '设备老化',
      remark: '',
      approvedById: 1,
      executedById: null,
      submittedAt: '2026-04-19 10:00:00',
      approvedAt: '2026-04-19 11:00:00',
      executedAt: null,
      status: 'approved',
      createTime: '2026-04-19 10:00:00',
      updateTime: '2026-04-19 10:00:00',
    },
  ]);
  const requestRepo = createMemoryRepo([
    {
      id: 51,
      requestNo: 'REQ-001',
      requestLevel: 'L2',
      requestType: 'standard',
      applicantId: 2,
      applicantDepartmentId: 10,
      assetCategory: '笔记本',
      assetModelRequest: 'X1',
      quantity: 1,
      unitPriceEstimate: 5000,
      usageReason: '日常办公',
      expectedUseStartDate: '2026-04-20',
      targetDepartmentId: null,
      exceptionReason: null,
      originalAssetId: null,
      originalAssignmentId: null,
      approvalInstanceId: null,
      approvalStatus: null,
      currentApproverId: null,
      approvalTriggeredRules: '["highAmount","sensitiveAsset"]',
      assignedAssetId: null,
      assignmentRecordId: null,
      assignedBy: null,
      assignedAt: null,
      status: 'draft',
      submitTime: null,
      withdrawTime: null,
      cancelReason: null,
      createTime: '2026-04-19 10:00:00',
      updateTime: '2026-04-19 10:00:00',
    },
  ]);

  const service = new PerformanceAssetDomainService() as any;
  service.ctx = {
    admin: {
      userId: 1,
      username: 'asset_admin',
      roleIds: [1],
    },
  };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(perms),
  };
  service.baseSysPermsService = {
    departmentIds: jest.fn().mockResolvedValue(departmentIds),
  };
  service.performanceAssetInfoEntity = assetInfoRepo;
  service.performanceAssetAssignmentEntity = assignmentRepo;
  service.performanceAssetMaintenanceEntity = maintenanceRepo;
  service.performanceAssetProcurementEntity = procurementRepo;
  service.performanceAssetTransferEntity = transferRepo;
  service.performanceAssetInventoryEntity = inventoryRepo;
  service.performanceAssetDepreciationEntity = depreciationRepo;
  service.performanceAssetDisposalEntity = disposalRepo;
  service.performanceAssetAssignmentRequestEntity = requestRepo;
  service.performanceSupplierEntity = createMemoryRepo();
  service.performancePurchaseOrderEntity = createMemoryRepo();
  service.baseSysUserEntity = createMemoryRepo([
    { id: 1, name: '资产管理员', departmentId: 10, status: 1 },
    { id: 2, name: '张三', departmentId: 10, status: 1 },
  ]);
  service.baseSysDepartmentEntity = createMemoryRepo([{ id: 10, name: '平台部' }]);
  service.performanceApprovalFlowService = {
    launchForObject: jest.fn().mockResolvedValue({
      id: 801,
      status: 'in_review',
      currentApproverId: 9,
    }),
    withdraw: jest.fn().mockResolvedValue(undefined),
    terminate: jest.fn().mockResolvedValue(undefined),
  };
  requestRepo.manager.transaction.mockImplementation(async (handler: any) =>
    handler({
      getRepository: (entity: any) => {
        if (entity?.name === 'PerformanceAssetAssignmentRequestEntity') {
          return requestRepo;
        }
        if (entity?.name === 'PerformanceAssetInfoEntity') {
          return assetInfoRepo;
        }
        if (entity?.name === 'PerformanceAssetAssignmentEntity') {
          return assignmentRepo;
        }
        return requestRepo;
      },
    })
  );
  attachAccessContext(service);

  return {
    service,
    repos: {
      assetInfoRepo,
      assignmentRepo,
      procurementRepo,
      disposalRepo,
      requestRepo,
    },
  };
}

describe('performance asset domain service', () => {
  test('should return asset and recover main status on assignment return', async () => {
    const { service, repos } = createService(['performance:assetAssignment:return'], [10]);
    await repos.assetInfoRepo.update({ id: 1 }, { status: 'assigned' });

    const result = await service.assetAssignmentReturn({ id: 11 });

    expect(result).toMatchObject({
      id: 11,
      status: 'returned',
    });
    expect(repos.assetInfoRepo.rows[0].status).toBe('available');
  });

  test('should create asset ledger rows on procurement receive', async () => {
    const { service, repos } = createService([
      'performance:assetProcurement:page',
      'performance:assetProcurement:info',
      'performance:assetProcurement:receive',
    ]);

    const result = await service.assetProcurementReceive({ id: 21 });

    expect(result).toMatchObject({
      id: 21,
      status: 'received',
    });
    expect(repos.procurementRepo.rows[0].receivedAssetIds).toHaveLength(2);
    expect(repos.assetInfoRepo.rows).toHaveLength(3);
    expect(repos.assetInfoRepo.rows[1].status).toBe('available');
  });

  test('should mark asset as scrapped on disposal execute', async () => {
    const { service, repos } = createService(
      ['performance:assetDisposal:execute', 'performance:assetDisposal:info', 'performance:assetDisposal:page'],
      [10]
    );

    const result = await service.assetDisposalExecute({ id: 31 });

    expect(result).toMatchObject({
      id: 31,
      status: 'scrapped',
    });
    expect(repos.assetInfoRepo.rows[0].status).toBe('scrapped');
  });

  test('should reject assignment add outside manager scope', async () => {
    const { service, repos } = createService(['performance:assetAssignment:add'], [10]);
    repos.assetInfoRepo.rows[0].purchaseCost = 500;
    repos.assetInfoRepo.rows[0].category = '鼠标';
    repos.assetInfoRepo.rows[0].ownerDepartmentId = 20;

    await expect(
      service.assetAssignmentAdd({
        assetId: 1,
        assigneeId: 2,
        departmentId: 20,
        assignDate: '2026-04-19',
      })
    ).rejects.toThrow('无权操作该资产');
  });

  test('should reject direct assignment for non-L0 asset and require request flow', async () => {
    const { service } = createService(['performance:assetAssignment:add'], [10]);

    await expect(
      service.assetAssignmentAdd({
        assetId: 1,
        assigneeId: 2,
        departmentId: 10,
        assignDate: '2026-04-19',
      })
    ).rejects.toThrow('当前领用场景需先走领用申请审批流程');
  });

  test('should submit assignment request atomically into approval flow', async () => {
    const { service, repos } = createService(
      [
        'performance:assetAssignmentRequest:submit',
        'performance:assetAssignmentRequest:info',
      ],
      [10]
    );
    service.ctx.admin = {
      userId: 2,
      username: 'employee_platform',
      roleIds: [3],
    };

    const result = await service.assetAssignmentRequestSubmit({ id: 51 });

    expect(result).toMatchObject({
      id: 51,
      status: 'inApproval',
      approvalInstanceId: 801,
      approvalStatus: 'in_review',
      currentApproverId: 9,
    });
    expect(service.performanceApprovalFlowService.launchForObject).toHaveBeenCalledWith(
      expect.objectContaining({
        objectType: 'assetAssignmentRequest',
        objectId: 51,
        applicantId: 2,
      }),
      expect.any(Object)
    );
    expect(repos.requestRepo.rows[0]).toMatchObject({
      status: 'inApproval',
      approvalInstanceId: 801,
      approvalStatus: 'in_review',
      currentApproverId: 9,
    });
  });

  test('should assign approved request and create formal assignment record', async () => {
    const { service, repos } = createService(
      [
        'performance:assetAssignmentRequest:assign',
        'performance:assetAssignmentRequest:info',
      ],
      [10]
    );
    repos.requestRepo.rows[0].status = 'approvedPendingAssignment';
    repos.requestRepo.rows[0].approvalStatus = 'approved';

    const result = await service.assetAssignmentRequestAssign({
      id: 51,
      assetId: 1,
      assignDate: '2026-04-20',
    });

    expect(result).toMatchObject({
      id: 51,
      status: 'issued',
      assignedAssetId: 1,
    });
    expect(repos.assignmentRepo.rows).toHaveLength(2);
    expect(repos.assignmentRepo.rows[1]).toMatchObject({
      assetId: 1,
      assigneeId: 2,
      status: 'assigned',
    });
    expect(repos.assetInfoRepo.rows[0].status).toBe('assigned');
  });

  test('should reject duplicated asset number on add', async () => {
    const { service } = createService(
      ['performance:assetInfo:add', 'performance:assetInfo:info'],
      [10]
    );

    await expect(
      service.assetInfoAdd({
        assetNo: 'AST-000001',
        assetName: '重复编号资产',
        departmentId: 10,
        purchaseCost: 1000,
      })
    ).rejects.toThrow('资产编号已存在');
  });

  test('should summarize asset actions by natural day week month and expose action timeline', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-19T12:00:00Z'));

    try {
      const { service } = createService(['performance:assetDashboard:summary'], [10]);

      const result = await service.assetDashboardSummary({});

      expect(result.actionOverview).toMatchObject({
        today: {
          actionCount: 4,
          assetCount: 1,
          documentCount: 3,
        },
        thisWeek: {
          actionCount: 5,
          assetCount: 1,
          documentCount: 4,
        },
        thisMonth: {
          actionCount: 6,
          assetCount: 1,
          documentCount: 5,
        },
      });
      expect(result.actionTimeline[0]).toMatchObject({
        module: 'assetDisposal',
        actionLabel: '审批报废',
        objectNo: 'ASSET-DP-0001',
        objectName: '办公电脑',
        operatorName: '资产管理员',
        departmentName: '平台部',
        resultStatus: 'approved',
        occurredAt: '2026-04-19 11:00:00',
      });
      expect(result.actionTimeline.some(item => item.module === 'assetDepreciation')).toBe(true);
      expect(result.recentActivities).toHaveLength(result.actionTimeline.length);
    } finally {
      jest.useRealTimers();
    }
  });
});
