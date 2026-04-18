/// <reference types="jest" />
/**
 * 360 环评服务测试。
 * 这里只验证模块 5 的提交唯一性、截止时间和汇总口径，不覆盖真实数据库或联调链路。
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

jest.mock('../../src/modules/base/entity/sys/department', () => ({
  BaseSysDepartmentEntity: class BaseSysDepartmentEntity {},
}));

jest.mock('../../src/modules/base/entity/sys/log', () => ({
  BaseSysLogEntity: class BaseSysLogEntity {},
}));

jest.mock('../../src/modules/performance/entity/assessment', () => ({
  PerformanceAssessmentEntity: class PerformanceAssessmentEntity {},
}));

jest.mock('../../src/modules/performance/entity/feedback-task', () => ({
  PerformanceFeedbackTaskEntity: class PerformanceFeedbackTaskEntity {},
}));

jest.mock('../../src/modules/performance/entity/feedback-record', () => ({
  PerformanceFeedbackRecordEntity: class PerformanceFeedbackRecordEntity {},
}));

import {
  calculateFeedbackAverageScore,
  PerformanceFeedbackService,
} from '../../src/modules/performance/service/feedback';

const createRecordsQueryBuilder = (rows: any[]) => {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
};

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

describe('performance feedback service', () => {
  test('should calculate average score by simple mean', () => {
    expect(
      calculateFeedbackAverageScore([
        { status: 'submitted', score: 90 },
        { status: 'submitted', score: 84 },
        { status: 'draft', score: 0 },
      ])
    ).toBe(87);
  });

  test('should reject duplicate submission from same feedback user', async () => {
    const token = jwt.sign(
      {
        userId: 4001,
        username: 'feedback_peer',
        roleIds: [4],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const update = jest.fn();
    const service = new PerformanceFeedbackService() as any;
    service.ctx = {
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:feedback:submit']),
    };
    service.performanceFeedbackTaskEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 11,
        status: 'running',
        deadline: '2099-12-31 23:59:59',
      }),
      update: jest.fn(),
    };
    service.performanceFeedbackRecordEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 101,
        taskId: 11,
        feedbackUserId: 4001,
        status: 'submitted',
      }),
      update,
      count: jest.fn(),
    };

    await expect(
      service.submit({
        taskId: 11,
        score: 90,
        relationType: '协作人',
        content: '重复提交',
      })
    ).rejects.toThrow('同任务同评价人只能提交一次');

    expect(update).not.toHaveBeenCalled();
  });

  test('should reject submission after deadline', async () => {
    const token = jwt.sign(
      {
        userId: 4001,
        username: 'feedback_peer',
        roleIds: [4],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const update = jest.fn();
    const service = new PerformanceFeedbackService() as any;
    service.ctx = {
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:feedback:submit']),
    };
    service.performanceFeedbackTaskEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 12,
        status: 'running',
        deadline: '2000-01-01 00:00:00',
      }),
      update: jest.fn(),
    };
    service.performanceFeedbackRecordEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 102,
        taskId: 12,
        feedbackUserId: 4001,
        status: 'draft',
      }),
      update,
      count: jest.fn(),
    };

    await expect(
      service.submit({
        taskId: 12,
        score: 88,
        relationType: '协作人',
        content: '超时提交',
      })
    ).rejects.toThrow('截止后不可补交反馈');

    expect(update).not.toHaveBeenCalled();
  });

  test('should return summary average and hide records for employee view', async () => {
    const admin = {
      userId: 3001,
      username: 'employee_platform',
      roleIds: [3],
      passwordVersion: 1,
      isRefresh: false,
    };
    const token = jwt.sign(admin, '694f6e56-579e-413e-8da0-63379cb5cd31');
    const recordsQb = createRecordsQueryBuilder([
      {
        id: 201,
        taskId: 21,
        feedbackUserId: 4001,
        feedbackUserName: '环评价人',
        relationType: '协作人',
        score: '80.00',
        content: '协同稳定',
        status: 'submitted',
        submitTime: '2026-04-17 10:00:00',
      },
      {
        id: 202,
        taskId: 21,
        feedbackUserId: 2001,
        feedbackUserName: '研发经理',
        relationType: '上级',
        score: '90.00',
        content: '结果突出',
        status: 'submitted',
        submitTime: '2026-04-17 11:00:00',
      },
      {
        id: 203,
        taskId: 21,
        feedbackUserId: 5001,
        feedbackUserName: '未提交评价人',
        relationType: '同级',
        score: '0.00',
        content: '',
        status: 'draft',
        submitTime: null,
      },
    ]);

    const service = new PerformanceFeedbackService() as any;
    service.ctx = {
      admin,
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:feedback:summary']),
    };
    service.performanceFeedbackTaskEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 21,
        employeeId: 3001,
        status: 'running',
      }),
    };
    service.performanceFeedbackRecordEntity = {
      findOneBy: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn().mockReturnValue(recordsQb),
    };

    const result = await service.summary(21);

    expect(result).toEqual({
      taskId: 21,
      averageScore: 85,
      submittedCount: 2,
      totalCount: 3,
      records: [],
    });
  });

  test('should reject feedback export without independent export permission and record failed audit', async () => {
    const admin = {
      userId: 2001,
      username: 'manager_platform',
      roleIds: [2],
      passwordVersion: 1,
      isRefresh: false,
    };
    const insert = jest.fn().mockResolvedValue(undefined);

    const service = new PerformanceFeedbackService() as any;
    service.ctx = {
      admin,
      get: jest.fn(),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:feedback:summary']),
    };
    service.baseSysLogEntity = {
      insert,
      create: jest.fn().mockImplementation(input => input),
    };

    await expect(service.export({ employeeId: 3001 })).rejects.toThrow(
      '无权限导出该数据'
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2001,
        action: '/admin/performance/feedback/export',
        params: expect.objectContaining({
          operatorId: 2001,
          moduleKey: 'feedback',
          filterSummary: {
            employeeId: 3001,
          },
          exportFieldVersion: 'feedback-summary-v1',
          rowCount: 0,
          resultStatus: 'failed',
          failureReason: 'permission_denied',
        }),
      })
    );
  });

  test('should export feedback summary only and record success audit', async () => {
    const admin = {
      userId: 2001,
      username: 'manager_platform',
      roleIds: [2],
      passwordVersion: 1,
      isRefresh: false,
    };
    const qb = createExportQueryBuilder([
      {
        id: 31,
        assessmentId: 41,
        employeeId: 3001,
        title: 'Q2 360 环评',
        deadline: '2026-04-30 23:59:59',
      },
    ]);
    const insert = jest.fn().mockResolvedValue(undefined);

    const service = new PerformanceFeedbackService() as any;
    service.ctx = {
      admin,
      get: jest.fn(),
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:feedback:export']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([10]),
    };
    service.baseSysLogEntity = {
      insert,
      create: jest.fn().mockImplementation(input => input),
    };
    service.performanceFeedbackTaskEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    service.fetchTaskStatsMap = jest.fn().mockResolvedValue(
      new Map([
        [
          31,
          {
            submittedCount: 2,
            totalCount: 3,
            averageScore: 87,
          },
        ],
      ])
    );

    const result = await service.export({
      employeeId: 3001,
      status: 'running',
      keyword: 'Q2',
    });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'employee.departmentId in (:...departmentIds)',
      {
        departmentIds: [10],
      }
    );
    expect(result).toEqual([
      {
        taskId: 31,
        assessmentId: 41,
        employeeId: 3001,
        title: 'Q2 360 环评',
        deadline: '2026-04-30 23:59:59',
        averageScore: 87,
        submittedCount: 2,
        totalCount: 3,
      },
    ]);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: '/admin/performance/feedback/export',
        params: expect.objectContaining({
          operatorRole: 'manager',
          moduleKey: 'feedback',
          exportFieldVersion: 'feedback-summary-v1',
          rowCount: 1,
          resultStatus: 'success',
        }),
      })
    );
  });
});
