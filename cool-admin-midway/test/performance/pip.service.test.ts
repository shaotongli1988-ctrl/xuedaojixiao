/// <reference types="jest" />
/**
 * PIP 纯逻辑测试。
 * 这里负责验证模块 6 的创建校验、状态流转和基础数据范围，不负责数据库或接口联调。
 */
import * as jwt from 'jsonwebtoken';

jest.mock('../../src/modules/base/service/sys/menu', () => ({
  BaseSysMenuService: class BaseSysMenuService {},
}));

jest.mock('../../src/modules/base/service/sys/perms', () => ({
  BaseSysPermsService: class BaseSysPermsService {},
}));

jest.mock('../../src/modules/base/entity/sys/user', () => ({
  BaseSysUserEntity: class BaseSysUserEntity {},
}));

jest.mock('../../src/modules/base/entity/sys/log', () => ({
  BaseSysLogEntity: class BaseSysLogEntity {},
}));

jest.mock('../../src/modules/performance/entity/assessment', () => ({
  PerformanceAssessmentEntity: class PerformanceAssessmentEntity {},
}));

jest.mock('../../src/modules/performance/entity/pip', () => ({
  PerformancePipEntity: class PerformancePipEntity {},
}));

jest.mock('../../src/modules/performance/entity/pip-record', () => ({
  PerformancePipRecordEntity: class PerformancePipRecordEntity {},
}));

import {
  assertPipEditable,
  resolvePipStatusTransition,
  validatePipPayload,
  PerformancePipService,
} from '../../src/modules/performance/service/pip';

const createExportQueryBuilder = (rows: any[], total = rows.length) => {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(total),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
};

describe('performance pip helper', () => {
  test('should require source reason for independent creation', () => {
    expect(() =>
      validatePipPayload({
        title: '季度改进计划',
        improvementGoal: '连续四周完成回访指标',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      })
    ).toThrow('独立创建必须填写来源原因');

    expect(() =>
      validatePipPayload({
        assessmentId: 1,
        title: '季度改进计划',
        improvementGoal: '连续四周完成回访指标',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      })
    ).not.toThrow();
  });

  test('should validate title and date range', () => {
    expect(() =>
      validatePipPayload({
        assessmentId: 1,
        title: '',
        improvementGoal: '提升沟通质量',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      })
    ).toThrow('PIP 标题不能为空');

    expect(() =>
      validatePipPayload({
        assessmentId: 1,
        title: '季度改进计划',
        improvementGoal: '提升沟通质量',
        startDate: '2026-04-30',
        endDate: '2026-04-01',
      })
    ).toThrow('开始日期不能晚于结束日期');
  });

  test('should allow only documented status transitions', () => {
    expect(resolvePipStatusTransition('draft', 'start')).toBe('active');
    expect(resolvePipStatusTransition('active', 'track')).toBe('active');
    expect(resolvePipStatusTransition('active', 'complete')).toBe('completed');
    expect(resolvePipStatusTransition('active', 'close')).toBe('closed');
  });

  test('should reject illegal status transitions', () => {
    expect(() => resolvePipStatusTransition('draft', 'complete')).toThrow(
      '只有进行中的 PIP 可以完成'
    );
    expect(() => resolvePipStatusTransition('completed', 'track')).toThrow(
      '只有进行中的 PIP 可以提交跟进'
    );
    expect(() => resolvePipStatusTransition('closed', 'close')).toThrow(
      '只有进行中的 PIP 可以关闭'
    );
  });

  test('should allow editing only draft pip', () => {
    expect(() => assertPipEditable('draft')).not.toThrow();
    expect(() => assertPipEditable('active')).toThrow(
      '当前状态不允许编辑 PIP'
    );
  });

  test('should scope pip page by user for token-only read context', async () => {
    const admin = {
      userId: 321,
      username: 'employee_platform',
      roleIds: [3],
      passwordVersion: 1,
      isRefresh: false,
    };
    const token = jwt.sign(admin, '694f6e56-579e-413e-8da0-63379cb5cd31');

    const andWhere = jest.fn().mockReturnThis();
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      andWhere,
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    const service = new PerformancePipService() as any;
    service.ctx = {
      admin,
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:pip:page',
        'performance:pip:info',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performancePipEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const result = await service.page({});

    expect(service.baseSysMenuService.getPerms).toHaveBeenCalledWith([3]);
    expect(andWhere).toHaveBeenCalledWith('pip.employeeId = :userId', {
      userId: 321,
    });
    expect(result).toEqual({
      list: [],
      pagination: {
        page: 1,
        size: 20,
        total: 0,
      },
    });
  });

  test('should reject pip export when row count exceeds frozen limit and record failed audit', async () => {
    const admin = {
      userId: 2001,
      username: 'manager_platform',
      roleIds: [2],
      passwordVersion: 1,
      isRefresh: false,
    };
    const qb = createExportQueryBuilder([], 5001);
    const insert = jest.fn().mockResolvedValue(undefined);

    const service = new PerformancePipService() as any;
    service.ctx = {
      admin,
      get: jest.fn(),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:pip:export']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([10]),
    };
    service.baseSysLogEntity = {
      insert,
      create: jest.fn().mockImplementation(input => input),
    };
    service.performancePipEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    await expect(service.export({ status: 'active' })).rejects.toThrow(
      '导出结果超过上限，请缩小筛选范围后重试'
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: '/admin/performance/pip/export',
        params: expect.objectContaining({
          moduleKey: 'pip',
          exportFieldVersion: 'pip-summary-v1',
          rowCount: 0,
          resultStatus: 'failed',
          failureReason: 'over_limit',
        }),
      })
    );
  });

  test('should export pip summary only and record success audit', async () => {
    const admin = {
      userId: 1,
      username: 'hr_admin',
      roleIds: [1],
      passwordVersion: 1,
      isRefresh: false,
      isAdmin: true,
    };
    const qb = createExportQueryBuilder([
      {
        id: 51,
        assessmentId: 71,
        employeeId: 3001,
        employeeName: '张三',
        ownerId: 2001,
        ownerName: '李经理',
        title: 'Q2 PIP',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        status: 'active',
        createTime: '2026-04-01 09:00:00',
        updateTime: '2026-04-02 10:00:00',
        improvementGoal: '不应导出',
        sourceReason: '不应导出',
        resultSummary: '不应导出',
      },
    ]);
    const insert = jest.fn().mockResolvedValue(undefined);

    const service = new PerformancePipService() as any;
    service.ctx = {
      admin,
      get: jest.fn(),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:pip:export',
        'performance:salary:page',
      ]),
    };
    service.baseSysLogEntity = {
      insert,
      create: jest.fn().mockImplementation(input => input),
    };
    service.performancePipEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const result = await service.export({
      assessmentId: 71,
      keyword: 'Q2',
    });

    expect(result).toEqual([
      {
        id: 51,
        assessmentId: 71,
        employeeId: 3001,
        employeeName: '张三',
        ownerId: 2001,
        ownerName: '李经理',
        title: 'Q2 PIP',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        status: 'active',
        createTime: '2026-04-01 09:00:00',
        updateTime: '2026-04-02 10:00:00',
      },
    ]);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: '/admin/performance/pip/export',
        params: expect.objectContaining({
          operatorRole: 'admin',
          moduleKey: 'pip',
          exportFieldVersion: 'pip-summary-v1',
          rowCount: 1,
          resultStatus: 'success',
        }),
      })
    );
  });
});
