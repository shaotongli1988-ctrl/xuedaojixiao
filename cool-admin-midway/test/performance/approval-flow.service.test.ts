/// <reference types="jest" />
/**
 * 自动审批流后端最小测试。
 * 这里负责验证实例创建、合法/非法流转、manual_pending、withdrawn / rejected / terminated 等关键后端语义，不负责数据库或控制器联调。
 */
import { In } from 'typeorm';
import {
  canWithdrawInstance,
  ensureApprovalConfigNodes,
} from '../../src/modules/performance/service/approval-flow-helper';
import { PerformanceApprovalFlowService } from '../../src/modules/performance/service/approval-flow';
import { PerformanceApprovalConfigEntity } from '../../src/modules/performance/entity/approval-config';
import { PerformanceApprovalConfigNodeEntity } from '../../src/modules/performance/entity/approval-config-node';
import { PerformanceApprovalInstanceEntity } from '../../src/modules/performance/entity/approval-instance';
import { PerformanceApprovalInstanceNodeEntity } from '../../src/modules/performance/entity/approval-instance-node';
import { PerformanceApprovalActionLogEntity } from '../../src/modules/performance/entity/approval-action-log';
import { PerformanceAssessmentEntity } from '../../src/modules/performance/entity/assessment';
import { PerformancePromotionEntity } from '../../src/modules/performance/entity/promotion';
import { BaseSysUserEntity } from '../../src/modules/base/entity/sys/user';
import { BaseSysDepartmentEntity } from '../../src/modules/base/entity/sys/department';
import { BaseSysUserRoleEntity } from '../../src/modules/base/entity/sys/user_role';
import { BaseSysRoleEntity } from '../../src/modules/base/entity/sys/role';

type EntityClass =
  | typeof PerformanceApprovalConfigEntity
  | typeof PerformanceApprovalConfigNodeEntity
  | typeof PerformanceApprovalInstanceEntity
  | typeof PerformanceApprovalInstanceNodeEntity
  | typeof PerformanceApprovalActionLogEntity
  | typeof PerformanceAssessmentEntity
  | typeof PerformancePromotionEntity
  | typeof BaseSysUserEntity
  | typeof BaseSysDepartmentEntity
  | typeof BaseSysUserRoleEntity
  | typeof BaseSysRoleEntity;

function clone<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

function isInOperator(value: any) {
  return value && typeof value === 'object' && value._type === 'in';
}

function matchesWhere(record: any, where: any) {
  if (!where) {
    return true;
  }

  return Object.entries(where).every(([key, value]) => {
    const target = record[key];

    if (isInOperator(value)) {
      return (value as any)._value.includes(target);
    }

    return target === value;
  });
}

function sortRecords(list: any[], order?: Record<string, 'ASC' | 'DESC'>) {
  if (!order) {
    return list;
  }

  const [[key, direction]] = Object.entries(order);
  return [...list].sort((a, b) => {
    if (a[key] === b[key]) {
      return 0;
    }
    return direction === 'DESC'
      ? Number(b[key]) - Number(a[key])
      : Number(a[key]) - Number(b[key]);
  });
}

function createMemoryHarness(seed?: Partial<Record<string, any[]>>) {
  const stores: Record<string, any[]> = {
    PerformanceApprovalConfigEntity: clone(seed?.PerformanceApprovalConfigEntity || []),
    PerformanceApprovalConfigNodeEntity: clone(
      seed?.PerformanceApprovalConfigNodeEntity || []
    ),
    PerformanceApprovalInstanceEntity: clone(seed?.PerformanceApprovalInstanceEntity || []),
    PerformanceApprovalInstanceNodeEntity: clone(
      seed?.PerformanceApprovalInstanceNodeEntity || []
    ),
    PerformanceApprovalActionLogEntity: clone(
      seed?.PerformanceApprovalActionLogEntity || []
    ),
    PerformanceAssessmentEntity: clone(seed?.PerformanceAssessmentEntity || []),
    PerformancePromotionEntity: clone(seed?.PerformancePromotionEntity || []),
    BaseSysUserEntity: clone(seed?.BaseSysUserEntity || []),
    BaseSysDepartmentEntity: clone(seed?.BaseSysDepartmentEntity || []),
    BaseSysUserRoleEntity: clone(seed?.BaseSysUserRoleEntity || []),
    BaseSysRoleEntity: clone(seed?.BaseSysRoleEntity || []),
  };

  const nextId = Object.fromEntries(
    Object.entries(stores).map(([key, list]) => [
      key,
      list.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1,
    ])
  ) as Record<string, number>;

  const repoMap = new Map<EntityClass, any>();

  const getStore = (entity: EntityClass) => stores[entity.name];

  const saveOne = (store: any[], key: string, payload: any) => {
    const saved = clone(payload);
    if (!saved.id) {
      saved.id = nextId[key]++;
    }

    const index = store.findIndex(item => Number(item.id) === Number(saved.id));
    if (index >= 0) {
      store[index] = { ...store[index], ...saved };
    } else {
      store.push(saved);
    }

    return clone(saved);
  };

  const updateMany = (store: any[], criteria: any, patch: any) => {
    store.forEach((item, index) => {
      if (matchesWhere(item, criteria)) {
        store[index] = { ...item, ...clone(patch) };
      }
    });
  };

  const deleteMany = (store: any[], criteria: any) => {
    for (let index = store.length - 1; index >= 0; index--) {
      if (matchesWhere(store[index], criteria)) {
        store.splice(index, 1);
      }
    }
  };

  const manager = {
    getRepository(entity: EntityClass) {
      return repoMap.get(entity);
    },
    async transaction(handler: any) {
      return handler(manager);
    },
  };

  const createRepo = (entity: EntityClass) => {
    const key = entity.name;
    const repo = {
      create: jest.fn((payload: any) => clone(payload)),
      findOneBy: jest.fn(async (where: any) => {
        return (
          clone(getStore(entity).find(item => matchesWhere(item, where))) || null
        );
      }),
      findOne: jest.fn(async (options: any) => {
        const filtered = getStore(entity).filter(item =>
          matchesWhere(item, options?.where)
        );
        const sorted = sortRecords(filtered, options?.order);
        return clone(sorted[0]) || null;
      }),
      findBy: jest.fn(async (where: any) => {
        return clone(getStore(entity).filter(item => matchesWhere(item, where)));
      }),
      find: jest.fn(async (options?: any) => {
        const filtered = getStore(entity).filter(item =>
          matchesWhere(item, options?.where)
        );
        return clone(sortRecords(filtered, options?.order));
      }),
      save: jest.fn(async (payload: any) => {
        const store = getStore(entity);
        if (Array.isArray(payload)) {
          return payload.map(item => saveOne(store, key, item));
        }
        return saveOne(store, key, payload);
      }),
      update: jest.fn(async (criteria: any, patch: any) => {
        updateMany(getStore(entity), criteria, patch);
      }),
      delete: jest.fn(async (criteria: any) => {
        deleteMany(getStore(entity), criteria);
      }),
      manager: {
        transaction: async (handler: any) => handler(manager),
      },
    };

    repoMap.set(entity, repo);
    return repo;
  };

  return {
    stores,
    manager,
    repos: {
      config: createRepo(PerformanceApprovalConfigEntity),
      configNode: createRepo(PerformanceApprovalConfigNodeEntity),
      instance: createRepo(PerformanceApprovalInstanceEntity),
      instanceNode: createRepo(PerformanceApprovalInstanceNodeEntity),
      actionLog: createRepo(PerformanceApprovalActionLogEntity),
      assessment: createRepo(PerformanceAssessmentEntity),
      promotion: createRepo(PerformancePromotionEntity),
      user: createRepo(BaseSysUserEntity),
      department: createRepo(BaseSysDepartmentEntity),
      userRole: createRepo(BaseSysUserRoleEntity),
      role: createRepo(BaseSysRoleEntity),
    },
  };
}

function createService(seed?: Partial<Record<string, any[]>>) {
  const harness = createMemoryHarness(seed);
  const service = new PerformanceApprovalFlowService() as any;

  service.performanceApprovalConfigEntity = harness.repos.config;
  service.performanceApprovalConfigNodeEntity = harness.repos.configNode;
  service.performanceApprovalInstanceEntity = harness.repos.instance;
  service.performanceApprovalInstanceNodeEntity = harness.repos.instanceNode;
  service.performanceApprovalActionLogEntity = harness.repos.actionLog;
  service.performanceAssessmentEntity = harness.repos.assessment;
  service.performancePromotionEntity = harness.repos.promotion;
  service.baseSysUserEntity = harness.repos.user;
  service.baseSysDepartmentEntity = harness.repos.department;
  service.baseSysUserRoleEntity = harness.repos.userRole;
  service.baseSysRoleEntity = harness.repos.role;
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(['performance:approvalFlow:info']),
  };
  service.baseSysPermsService = {
    departmentIds: jest.fn().mockResolvedValue([]),
  };
  service.performanceSuggestionService = {
    syncApprovedAssessmentInTransaction: jest.fn().mockResolvedValue({ id: 901 }),
  };
  service.ctx = {
    admin: {
      userId: 1,
      username: 'hr_admin',
      roleIds: [1],
    },
  };

  return {
    service,
    stores: harness.stores,
    repos: harness.repos,
    manager: harness.manager,
  };
}

describe('performance approval flow helper', () => {
  test('should normalize sequential nodes', () => {
    expect(
      ensureApprovalConfigNodes([
        {
          nodeOrder: 2,
          nodeCode: 'manager-review',
          nodeName: '经理审批',
          resolverType: 'hr_manual_assign',
          allowTransfer: false,
        },
        {
          nodeOrder: 1,
          nodeCode: 'hr-review',
          nodeName: 'HR 审批',
          resolverType: 'specified_user',
          resolverValue: '7',
          allowTransfer: true,
        },
      ])
    ).toEqual([
      expect.objectContaining({ nodeOrder: 1, nodeCode: 'hr-review' }),
      expect.objectContaining({ nodeOrder: 2, nodeCode: 'manager-review' }),
    ]);
  });

  test('should reject invalid node sequence and missing resolver payload', () => {
    expect(() =>
      ensureApprovalConfigNodes([
        {
          nodeOrder: 2,
          nodeCode: 'broken',
          nodeName: '异常节点',
          resolverType: 'specified_user',
          resolverValue: '',
        },
      ])
    ).toThrow();
  });

  test('should allow withdraw only before first node is processed', () => {
    expect(canWithdrawInstance('pending_resolution', 1, 'pending', null)).toBe(
      true
    );
    expect(canWithdrawInstance('in_review', 1, 'pending', null)).toBe(true);
    expect(
      canWithdrawInstance('in_review', 1, 'pending', '2026-04-17 10:00:00')
    ).toBe(false);
  });
});

describe('performance approval flow service', () => {
  test('should launch in-review instance for specified user node', async () => {
    const { service, stores } = createService({
      PerformanceApprovalConfigEntity: [
        {
          id: 11,
          objectType: 'assessment',
          version: 'v1',
          enabled: true,
          notifyMode: 'interface_only',
        },
      ],
      PerformanceApprovalConfigNodeEntity: [
        {
          id: 31,
          configId: 11,
          nodeOrder: 1,
          nodeCode: 'leader-review',
          nodeName: '直属经理审批',
          resolverType: 'specified_user',
          resolverValue: '9',
          timeoutHours: null,
          allowTransfer: true,
        },
      ],
      BaseSysUserEntity: [
        { id: 2, name: '员工 A', departmentId: 11, status: 1 },
        { id: 9, name: '经理 A', departmentId: 11, status: 1 },
      ],
    });

    const result = await service.launchForObject({
      objectType: 'assessment',
      objectId: 101,
      applicantId: 2,
      employeeId: 2,
      departmentId: 11,
      tenantId: 1,
    });

    expect(result).toEqual(
      expect.objectContaining({
        objectType: 'assessment',
        status: 'in_review',
        currentApproverId: 9,
      })
    );
    expect(stores.PerformanceApprovalInstanceNodeEntity[0]).toEqual(
      expect.objectContaining({
        approverId: 9,
        status: 'pending',
      })
    );
    expect(stores.PerformanceApprovalActionLogEntity[0]).toEqual(
      expect.objectContaining({
        action: 'launch',
        toStatus: 'in_review',
      })
    );
  });

  test('should launch pending-resolution instance when approver is unresolved', async () => {
    const { service } = createService({
      PerformanceApprovalConfigEntity: [
        {
          id: 12,
          objectType: 'promotion',
          version: 'v2',
          enabled: true,
          notifyMode: 'interface_only',
        },
      ],
      PerformanceApprovalConfigNodeEntity: [
        {
          id: 32,
          configId: 12,
          nodeOrder: 1,
          nodeCode: 'manual',
          nodeName: 'HR 指定',
          resolverType: 'hr_manual_assign',
          resolverValue: '',
          timeoutHours: null,
          allowTransfer: true,
        },
      ],
      BaseSysUserEntity: [{ id: 9, name: '发起人 A', departmentId: 15, status: 1 }],
    });

    const result = await service.launchForObject({
      objectType: 'promotion',
      objectId: 301,
      applicantId: 9,
      employeeId: 12,
      departmentId: 15,
      tenantId: 1,
    });

    expect(result).toEqual(
      expect.objectContaining({
        objectType: 'promotion',
        status: 'pending_resolution',
        currentApproverId: null,
      })
    );
  });

  test('should approve final node and sync assessment source status', async () => {
    const { service, stores, manager } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 501,
          objectType: 'assessment',
          objectId: 101,
          sourceStatus: 'submitted',
          configId: 11,
          configVersion: 'v1',
          applicantId: 2,
          employeeId: 2,
          departmentId: 11,
          status: 'in_review',
          currentNodeOrder: 1,
          currentApproverId: 9,
          launchTime: '2026-04-17 10:00:00',
          finishTime: null,
          fallbackReason: null,
          fallbackOperatorId: null,
          terminateReason: null,
          terminateOperatorId: null,
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 701,
          instanceId: 501,
          nodeOrder: 1,
          nodeCode: 'leader-review',
          nodeName: '直属经理审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '9',
          approverId: 9,
          status: 'pending',
          actionTime: null,
          transferFromUserId: null,
          transferReason: null,
          comment: null,
        },
      ],
      PerformanceAssessmentEntity: [
        {
          id: 101,
          employeeId: 2,
          departmentId: 11,
          periodType: 'quarter',
          periodValue: '2026Q2',
          totalScore: 88,
          grade: 'A',
          status: 'submitted',
        },
      ],
      BaseSysUserEntity: [{ id: 9, name: '经理 A', departmentId: 11, status: 1 }],
    });
    service.ctx.admin = {
      userId: 9,
      username: 'manager_rd',
      roleIds: [2],
    };
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:approve',
      'performance:approvalFlow:info',
    ]);

    await service.approve({ instanceId: 501, comment: '通过' });

    expect(stores.PerformanceApprovalInstanceEntity[0]).toEqual(
      expect.objectContaining({
        status: 'approved',
        currentApproverId: null,
      })
    );
    expect(stores.PerformanceAssessmentEntity[0]).toEqual(
      expect.objectContaining({
        status: 'approved',
        managerFeedback: '通过',
      })
    );
    expect(
      service.performanceSuggestionService.syncApprovedAssessmentInTransaction
    ).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        id: 101,
        employeeId: 2,
        departmentId: 11,
        status: 'approved',
      })
    );
  });

  test('should reject final node and mark source object rejected', async () => {
    const { service, stores } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 601,
          objectType: 'promotion',
          objectId: 201,
          sourceStatus: 'reviewing',
          configId: 12,
          configVersion: 'v2',
          applicantId: 9,
          employeeId: 2,
          departmentId: 11,
          status: 'in_review',
          currentNodeOrder: 1,
          currentApproverId: 18,
          launchTime: '2026-04-17 10:00:00',
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 801,
          instanceId: 601,
          nodeOrder: 1,
          nodeCode: 'hr-review',
          nodeName: 'HR 审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '18',
          approverId: 18,
          status: 'pending',
          actionTime: null,
          transferFromUserId: null,
          transferReason: null,
          comment: null,
        },
      ],
      PerformancePromotionEntity: [
        {
          id: 201,
          employeeId: 2,
          sponsorId: 9,
          status: 'reviewing',
          reviewTime: null,
        },
      ],
      BaseSysUserEntity: [{ id: 18, name: 'HR A', departmentId: 1, status: 1 }],
    });
    service.ctx.admin = {
      userId: 18,
      username: 'hr_admin',
      roleIds: [1],
    };
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:reject',
      'performance:approvalFlow:info',
      'performance:approvalFlow:resolve',
      'performance:approvalFlow:terminate',
      'performance:approvalFlow:fallback',
      'performance:approvalFlow:configSave',
    ]);

    await service.reject({ instanceId: 601, comment: '资料不足' });

    expect(stores.PerformanceApprovalInstanceEntity[0]).toEqual(
      expect.objectContaining({
        status: 'rejected',
      })
    );
    expect(stores.PerformancePromotionEntity[0]).toEqual(
      expect.objectContaining({
        status: 'rejected',
      })
    );
  });

  test('should reject illegal approve from non-current approver', async () => {
    const { service } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 701,
          objectType: 'assessment',
          objectId: 301,
          sourceStatus: 'submitted',
          configId: 11,
          configVersion: 'v1',
          applicantId: 2,
          employeeId: 2,
          departmentId: 11,
          status: 'in_review',
          currentNodeOrder: 1,
          currentApproverId: 9,
          launchTime: '2026-04-17 10:00:00',
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 901,
          instanceId: 701,
          nodeOrder: 1,
          nodeCode: 'leader-review',
          nodeName: '直属经理审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '9',
          approverId: 9,
          status: 'pending',
          actionTime: null,
        },
      ],
    });
    service.ctx.admin = {
      userId: 12,
      username: 'manager_other',
      roleIds: [2],
    };
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:approve',
      'performance:approvalFlow:info',
    ]);
    service.baseSysPermsService.departmentIds.mockResolvedValue([11]);

    await expect(
      service.approve({ instanceId: 701, comment: '通过' })
    ).rejects.toThrow('仅当前审批人可执行该操作');
  });

  test('should withdraw before first node is handled', async () => {
    const { service, stores } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 801,
          objectType: 'assessment',
          objectId: 401,
          sourceStatus: 'submitted',
          configId: 11,
          configVersion: 'v1',
          applicantId: 2,
          employeeId: 2,
          departmentId: 11,
          status: 'in_review',
          currentNodeOrder: 1,
          currentApproverId: 9,
          launchTime: '2026-04-17 10:00:00',
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 1001,
          instanceId: 801,
          nodeOrder: 1,
          nodeCode: 'leader-review',
          nodeName: '直属经理审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '9',
          approverId: 9,
          status: 'pending',
          actionTime: null,
        },
      ],
      PerformanceAssessmentEntity: [
        {
          id: 401,
          employeeId: 2,
          departmentId: 11,
          status: 'submitted',
          submitTime: '2026-04-17 10:00:00',
        },
      ],
    });
    service.ctx.admin = {
      userId: 2,
      username: 'employee_platform',
      roleIds: [3],
    };
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:withdraw',
      'performance:approvalFlow:info',
    ]);

    await service.withdraw({ instanceId: 801, reason: '重新补充自评' });

    expect(stores.PerformanceApprovalInstanceEntity[0]).toEqual(
      expect.objectContaining({
        status: 'withdrawn',
      })
    );
    expect(stores.PerformanceAssessmentEntity[0]).toEqual(
      expect.objectContaining({
        status: 'draft',
        submitTime: null,
      })
    );
  });

  test('should move timeout instance into manual_pending', async () => {
    const { service, stores } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 901,
          objectType: 'assessment',
          objectId: 501,
          sourceStatus: 'submitted',
          configId: 11,
          configVersion: 'v1',
          applicantId: 2,
          employeeId: 2,
          departmentId: 11,
          status: 'in_review',
          currentNodeOrder: 1,
          currentApproverId: 9,
          launchTime: '2026-04-17 10:00:00',
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 1101,
          instanceId: 901,
          nodeOrder: 1,
          nodeCode: 'leader-review',
          nodeName: '直属经理审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '9',
          approverId: 9,
          status: 'pending',
          actionTime: null,
        },
      ],
    });
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:info',
      'performance:approvalFlow:resolve',
      'performance:approvalFlow:terminate',
      'performance:approvalFlow:fallback',
      'performance:approvalFlow:configSave',
    ]);

    await service.markTimeout(901);

    expect(stores.PerformanceApprovalInstanceEntity[0]).toEqual(
      expect.objectContaining({
        status: 'manual_pending',
        currentApproverId: null,
      })
    );
    expect(stores.PerformanceApprovalInstanceNodeEntity[0]).toEqual(
      expect.objectContaining({
        status: 'timed_out',
      })
    );
  });

  test('should fallback manual_pending instance to legacy manual chain', async () => {
    const { service, stores } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 1001,
          objectType: 'assessment',
          objectId: 601,
          sourceStatus: 'submitted',
          configId: 11,
          configVersion: 'v1',
          applicantId: 2,
          employeeId: 2,
          departmentId: 11,
          status: 'manual_pending',
          currentNodeOrder: 1,
          currentApproverId: null,
          launchTime: '2026-04-17 10:00:00',
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 1201,
          instanceId: 1001,
          nodeOrder: 1,
          nodeCode: 'leader-review',
          nodeName: '直属经理审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '9',
          approverId: 9,
          status: 'timed_out',
          actionTime: '2026-04-17 11:00:00',
        },
      ],
      PerformanceAssessmentEntity: [
        {
          id: 601,
          employeeId: 2,
          departmentId: 11,
          status: 'submitted',
        },
      ],
    });
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:fallback',
      'performance:approvalFlow:info',
      'performance:approvalFlow:resolve',
      'performance:approvalFlow:terminate',
      'performance:approvalFlow:configSave',
    ]);

    await service.fallback({ instanceId: 1001, reason: '切回人工审批止血' });

    expect(stores.PerformanceApprovalInstanceEntity[0]).toEqual(
      expect.objectContaining({
        status: 'terminated',
        fallbackReason: '切回人工审批止血',
      })
    );
    expect(stores.PerformanceAssessmentEntity[0]).toEqual(
      expect.objectContaining({
        status: 'submitted',
      })
    );
  });

  test('should terminate active instance by HR', async () => {
    const { service, stores } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 1101,
          objectType: 'promotion',
          objectId: 701,
          sourceStatus: 'reviewing',
          configId: 12,
          configVersion: 'v2',
          applicantId: 9,
          employeeId: 2,
          departmentId: 11,
          status: 'in_review',
          currentNodeOrder: 1,
          currentApproverId: 18,
          launchTime: '2026-04-17 10:00:00',
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 1301,
          instanceId: 1101,
          nodeOrder: 1,
          nodeCode: 'hr-review',
          nodeName: 'HR 审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '18',
          approverId: 18,
          status: 'pending',
          actionTime: null,
        },
      ],
      PerformancePromotionEntity: [
        {
          id: 701,
          employeeId: 2,
          sponsorId: 9,
          status: 'reviewing',
        },
      ],
    });
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:terminate',
      'performance:approvalFlow:info',
      'performance:approvalFlow:resolve',
      'performance:approvalFlow:fallback',
      'performance:approvalFlow:configSave',
    ]);

    await service.terminate({ instanceId: 1101, reason: '流程异常强制终止' });

    expect(stores.PerformanceApprovalInstanceEntity[0]).toEqual(
      expect.objectContaining({
        status: 'terminated',
        terminateReason: '流程异常强制终止',
      })
    );
  });

  test('should expose masked instance detail to applicant', async () => {
    const { service } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 1151,
          objectType: 'assessment',
          objectId: 801,
          sourceStatus: 'submitted',
          configId: 11,
          configVersion: 'v3',
          applicantId: 2,
          employeeId: 2,
          departmentId: 11,
          status: 'in_review',
          currentNodeOrder: 1,
          currentApproverId: 9,
          createTime: '2026-04-17 10:00:00',
          updateTime: '2026-04-17 10:30:00',
          fallbackReason: '切回人工审批止血',
          terminateReason: '流程异常强制终止',
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 1351,
          instanceId: 1151,
          nodeOrder: 1,
          nodeCode: 'leader-review',
          nodeName: '直属经理审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '9',
          approverId: 9,
          status: 'approved',
          actionTime: '2026-04-17 10:20:00',
          transferReason: '由 HR 协助转办',
          comment: '请补充年度成果说明',
        },
      ],
      BaseSysUserEntity: [
        { id: 2, name: '员工 A', departmentId: 11, status: 1 },
        { id: 9, name: '经理 A', departmentId: 11, status: 1 },
      ],
      BaseSysDepartmentEntity: [{ id: 11, name: '平台研发部', parentId: 1 }],
    });
    service.ctx.admin = {
      userId: 2,
      username: 'employee_platform',
      roleIds: [3],
    };
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:info',
      'performance:approvalFlow:withdraw',
      'performance:approvalFlow:remind',
    ]);
    service.baseSysPermsService.departmentIds.mockResolvedValue([]);

    const detail = await service.info(1151);

    expect(detail).toEqual(
      expect.objectContaining({
        instanceId: 1151,
        objectType: 'assessment',
        employeeName: '员工 A',
        departmentName: '平台研发部',
      })
    );
    expect(detail.fallbackReason).toBeUndefined();
    expect(detail.terminateReason).toBeUndefined();
    expect(detail.nodes[0]).toEqual(
      expect.objectContaining({
        nodeOrder: 1,
        nodeCode: 'leader-review',
        approverId: 9,
        approverName: '经理 A',
        status: 'approved',
      })
    );
    expect(detail.nodes[0].resolverType).toBeUndefined();
    expect(detail.nodes[0].resolverValue).toBeUndefined();
    expect(detail.nodes[0].transferReason).toBeUndefined();
    expect(detail.nodes[0].comment).toBeUndefined();
    for (const key of [
      'totalScore',
      'scoreItems',
      'managerFeedback',
      'records',
      'improvementGoal',
      'sourceReason',
      'resultSummary',
      'trackRecords',
      'salaryAmount',
    ]) {
      expect(detail).not.toHaveProperty(key);
      expect(detail.nodes[0]).not.toHaveProperty(key);
    }
  });

  test('should keep approval opinion masked for same-department viewer who is not approver', async () => {
    const { service } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 1161,
          objectType: 'promotion',
          objectId: 901,
          sourceStatus: 'reviewing',
          configId: 12,
          configVersion: 'v2',
          applicantId: 2,
          employeeId: 2,
          departmentId: 11,
          status: 'in_review',
          currentNodeOrder: 1,
          currentApproverId: 18,
          createTime: '2026-04-17 10:00:00',
          updateTime: '2026-04-17 11:00:00',
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 1361,
          instanceId: 1161,
          nodeOrder: 1,
          nodeCode: 'hr-review',
          nodeName: 'HR 审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '18',
          approverId: 18,
          status: 'pending',
          actionTime: null,
          transferReason: '经理申请 HR 接手',
          comment: '需要补充任职资格证明',
        },
      ],
      BaseSysUserEntity: [
        { id: 2, name: '员工 A', departmentId: 11, status: 1 },
        { id: 9, name: '经理 A', departmentId: 11, status: 1 },
        { id: 18, name: 'HR A', departmentId: 1, status: 1 },
      ],
      BaseSysDepartmentEntity: [{ id: 11, name: '平台研发部', parentId: 1 }],
    });
    service.ctx.admin = {
      userId: 9,
      username: 'manager_rd',
      roleIds: [2],
    };
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:info',
    ]);
    service.baseSysPermsService.departmentIds.mockResolvedValue([11]);

    const detail = await service.info(1161);

    expect(detail.configVersion).toBeUndefined();
    expect(detail.nodes[0]).toEqual(
      expect.objectContaining({
        nodeOrder: 1,
        approverId: 18,
        approverName: 'HR A',
        status: 'pending',
      })
    );
    expect(detail.nodes[0].resolverType).toBeUndefined();
    expect(detail.nodes[0].resolverValue).toBeUndefined();
    expect(detail.nodes[0].transferReason).toBeUndefined();
    expect(detail.nodes[0].comment).toBeUndefined();
  });

  test('should expose resolver snapshot and approval opinion to HR detail only', async () => {
    const { service } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 1171,
          objectType: 'assessment',
          objectId: 902,
          sourceStatus: 'submitted',
          configId: 11,
          configVersion: 'v5',
          applicantId: 2,
          employeeId: 2,
          departmentId: 11,
          status: 'manual_pending',
          currentNodeOrder: 1,
          currentApproverId: null,
          createTime: '2026-04-17 09:00:00',
          updateTime: '2026-04-17 12:00:00',
          fallbackReason: '切回人工审批止血',
          terminateReason: '流程异常强制终止',
        },
      ],
      PerformanceApprovalInstanceNodeEntity: [
        {
          id: 1371,
          instanceId: 1171,
          nodeOrder: 1,
          nodeCode: 'leader-review',
          nodeName: '直属经理审批',
          resolverType: 'specified_user',
          resolverValueSnapshot: '9',
          approverId: 9,
          status: 'transferred',
          actionTime: '2026-04-17 09:30:00',
          transferReason: '经理请假，由 HR 协助处理',
          comment: '请补充季度目标达成证据',
        },
      ],
      BaseSysUserEntity: [
        { id: 2, name: '员工 A', departmentId: 11, status: 1 },
        { id: 9, name: '经理 A', departmentId: 11, status: 1 },
      ],
      BaseSysDepartmentEntity: [{ id: 11, name: '平台研发部', parentId: 1 }],
    });
    service.ctx.admin = {
      userId: 18,
      username: 'hr_admin',
      roleIds: [1],
    };
    service.baseSysMenuService.getPerms.mockResolvedValue([
      'performance:approvalFlow:info',
      'performance:approvalFlow:resolve',
      'performance:approvalFlow:fallback',
      'performance:approvalFlow:terminate',
    ]);

    const detail = await service.info(1171);

    expect(detail).toEqual(
      expect.objectContaining({
        configVersion: 'v5',
        fallbackReason: '切回人工审批止血',
        terminateReason: '流程异常强制终止',
      })
    );
    expect(detail.nodes[0]).toEqual(
      expect.objectContaining({
        resolverType: 'specified_user',
        resolverValue: '9',
        transferReason: '经理请假，由 HR 协助处理',
        comment: '请补充季度目标达成证据',
      })
    );
  });

  test('should block manual review entry when active approval instance exists', async () => {
    const { service } = createService({
      PerformanceApprovalInstanceEntity: [
        {
          id: 1201,
          objectType: 'assessment',
          objectId: 801,
          status: 'in_review',
        },
      ],
    });

    await expect(
      service.assertManualReviewAllowed('assessment', 801)
    ).rejects.toThrow(
      '当前对象存在进行中的自动审批实例，请改用 approval-flow 接口'
    );
  });

  test('should lock source assessment row before checking active approval instance', async () => {
    const { service, repos } = createService({
      PerformanceApprovalConfigEntity: [
        {
          id: 41,
          objectType: 'assessment',
          version: 'v1',
          enabled: true,
          notifyMode: 'interface_only',
        },
      ],
      PerformanceApprovalConfigNodeEntity: [
        {
          id: 51,
          configId: 41,
          nodeOrder: 1,
          nodeCode: 'leader-review',
          nodeName: '直属经理审批',
          resolverType: 'specified_user',
          resolverValue: '9',
          timeoutHours: null,
          allowTransfer: true,
        },
      ],
      PerformanceAssessmentEntity: [
        {
          id: 901,
          employeeId: 2,
          departmentId: 11,
          tenantId: 1,
          status: 'draft',
        },
      ],
      BaseSysUserEntity: [
        { id: 2, name: '员工 A', departmentId: 11, status: 1 },
        { id: 9, name: '经理 A', departmentId: 11, status: 1 },
      ],
    });

    await service.submitAssessment(
      {
        id: 901,
        employeeId: 2,
        departmentId: 11,
        tenantId: 1,
      },
      {
        totalScore: 88,
        grade: 'A',
      }
    );

    expect(repos.assessment.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 901 },
        lock: { mode: 'pessimistic_write' },
      })
    );
  });
});
