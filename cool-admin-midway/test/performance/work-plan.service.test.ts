/// <reference types="jest" />
/**
 * 工作计划服务测试。
 * 这里负责验证工作计划的关键状态约束、钉钉审批来源同步和日期边界，不负责数据库联调或真实钉钉 SDK。
 */

jest.mock('../../src/modules/base/service/sys/menu', () => ({
  BaseSysMenuService: class BaseSysMenuService {},
}));

jest.mock('../../src/modules/base/service/sys/perms', () => ({
  BaseSysPermsService: class BaseSysPermsService {},
}));

jest.mock('../../src/modules/base/entity/sys/user', () => ({
  BaseSysUserEntity: class BaseSysUserEntity {},
}));

jest.mock('../../src/modules/base/entity/sys/department', () => ({
  BaseSysDepartmentEntity: class BaseSysDepartmentEntity {},
}));

jest.mock('../../src/modules/performance/entity/workPlan', () => ({
  PerformanceWorkPlanEntity: class PerformanceWorkPlanEntity {},
}));

import { PerformanceWorkPlanService } from '../../src/modules/performance/service/workPlan';
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

function createServiceContext(perms: string[], admin = { userId: 9, username: 'manager', roleIds: [2] }) {
  const service = new PerformanceWorkPlanService() as any;
  service.ctx = { admin };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(perms),
  };
  service.baseSysPermsService = {
    departmentIds: jest.fn().mockResolvedValue([11]),
  };
  attachAccessContextService(service);
  return service;
}

describe('performance work plan service', () => {
  test('should start a manual plan when permission and status are valid', async () => {
    const service = createServiceContext(['performance:workPlan:start']);
    service.performanceWorkPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        ownerDepartmentId: 11,
        ownerId: 9,
        assigneeIds: [],
        status: 'draft',
        sourceType: 'manual',
        sourceStatus: 'none',
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    service.info = jest.fn().mockResolvedValue({
      id: 1,
      status: 'inProgress',
    });

    await expect(service.start({ id: 1 })).resolves.toEqual({
      id: 1,
      status: 'inProgress',
    });

    expect(service.performanceWorkPlanEntity.update).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({
        status: 'inProgress',
      })
    );
  });

  test('should reject starting a DingTalk-sourced plan before approval', async () => {
    const service = createServiceContext(['performance:workPlan:start']);
    service.performanceWorkPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 2,
        ownerDepartmentId: 11,
        ownerId: 9,
        assigneeIds: [],
        status: 'planned',
        sourceType: 'dingtalkApproval',
        sourceStatus: 'processing',
      }),
    };

    await expect(service.start({ id: 2 })).rejects.toThrow(
      '来源审批未通过，暂不能开始执行'
    );
  });

  test('should reject invalid plan date range when updating', async () => {
    const service = createServiceContext(['performance:workPlan:update']);
    const update = jest.fn().mockResolvedValue(undefined);
    service.performanceWorkPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 3,
        ownerDepartmentId: 11,
        ownerId: 9,
        assigneeIds: [],
        status: 'draft',
        sourceType: 'manual',
        plannedStartDate: null,
        plannedEndDate: null,
        progressSummary: null,
        resultSummary: null,
        tenantId: 1,
        title: '季度执行计划',
        priority: 'medium',
      }),
      update,
    };

    await expect(
      service.updateWorkPlan({
        id: 3,
        title: '季度执行计划',
        ownerDepartmentId: 11,
        ownerId: 9,
        plannedStartDate: '2026-04-30',
        plannedEndDate: '2026-04-01',
      })
    ).rejects.toThrow('计划开始日期不能晚于结束日期');

    expect(update).not.toHaveBeenCalled();
  });

  test('should reject starting work plan outside scope for non-assignee', async () => {
    const service = createServiceContext(['performance:workPlan:start']);
    service.performanceWorkPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 4,
        ownerDepartmentId: 22,
        ownerId: 18,
        assigneeIds: [],
        status: 'draft',
        sourceType: 'manual',
        sourceStatus: 'none',
      }),
      update: jest.fn(),
    };

    await expect(service.start({ id: 4 })).rejects.toThrow('无权开始该工作计划');
    expect(service.performanceWorkPlanEntity.update).not.toHaveBeenCalled();
  });

  test('should reject cancelling completed work plan', async () => {
    const service = createServiceContext(['performance:workPlan:cancel']);
    service.performanceWorkPlanEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 5,
        ownerDepartmentId: 11,
        ownerId: 9,
        assigneeIds: [],
        status: 'completed',
        sourceType: 'manual',
        sourceStatus: 'none',
      }),
      update: jest.fn(),
    };

    await expect(
      service.cancel({
        id: 5,
        progressSummary: '重复取消',
      })
    ).rejects.toThrow('已完成的工作计划不允许取消');

    expect(service.performanceWorkPlanEntity.update).not.toHaveBeenCalled();
  });

  test('should sync DingTalk callback into existing work plan without login context', async () => {
    const previousToken = process.env.WORK_PLAN_DINGTALK_SYNC_TOKEN;
    process.env.WORK_PLAN_DINGTALK_SYNC_TOKEN = 'callback-token';

    const service = new PerformanceWorkPlanService() as any;
    service.ctx = {
      headers: {
        'x-workplan-sync-token': 'callback-token',
      },
    };

    const currentRow = {
      id: 8,
      workNo: 'WP-20260419001',
      ownerDepartmentId: 11,
      ownerId: 21,
      title: '旧执行计划',
      description: '旧描述',
      assigneeIds: [22],
      priority: 'medium',
      plannedStartDate: '2026-04-20',
      plannedEndDate: '2026-04-22',
      startedAt: null,
      completedAt: null,
      status: 'draft',
      progressSummary: null,
      resultSummary: null,
      sourceType: 'dingtalkApproval',
      sourceBizType: 'proposal',
      sourceBizId: 'proposal-1',
      sourceTitle: '旧审批标题',
      sourceStatus: 'processing',
      externalInstanceId: 'PROC-1',
      externalProcessCode: 'PROC-CODE',
      approvalFinishedAt: null,
      sourceSnapshot: null,
      tenantId: 1,
      createTime: '2026-04-19 10:00:00',
      updateTime: '2026-04-19 10:00:00',
    };

    const syncedRow = {
      ...currentRow,
      title: '方案审批执行计划',
      sourceTitle: '方案审批单',
      sourceStatus: 'approved',
      status: 'planned',
      approvalFinishedAt: '2026-04-19 12:00:00',
      sourceSnapshot: {
        title: '方案审批单',
      },
      updateTime: '2026-04-19 12:00:00',
    };

    const update = jest.fn().mockResolvedValue(undefined);
    service.performanceWorkPlanEntity = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce(currentRow)
        .mockResolvedValueOnce(syncedRow),
      update,
      save: jest.fn(),
      create: jest.fn(payload => payload),
    };
    service.baseSysDepartmentEntity = {
      findBy: jest.fn().mockResolvedValue([{ id: 11, name: '人力资源部' }]),
    };
    service.baseSysUserEntity = {
      findBy: jest
        .fn()
        .mockResolvedValue([{ id: 21, name: '王主管' }, { id: 22, name: '李协作' }]),
    };

    await expect(
      service.syncDingtalkApproval(
        {
          externalInstanceId: 'PROC-1',
          sourceStatus: 'approved',
          sourceTitle: '方案审批单',
          sourceBizType: 'proposal',
          sourceBizId: 'proposal-1',
          approvalFinishedAt: '2026-04-19 12:00:00',
          sourceSnapshot: {
            title: '方案审批单',
          },
        },
        {
          bypassPerm: true,
        }
      )
    ).resolves.toEqual(
      expect.objectContaining({
        id: 8,
        title: '方案审批执行计划',
        ownerDepartmentName: '人力资源部',
        ownerName: '王主管',
        sourceStatus: 'approved',
        status: 'planned',
      })
    );

    expect(update).toHaveBeenCalledWith(
      { id: 8 },
      expect.objectContaining({
        sourceStatus: 'approved',
        status: 'planned',
        externalInstanceId: 'PROC-1',
      })
    );

    process.env.WORK_PLAN_DINGTALK_SYNC_TOKEN = previousToken;
  });
});
