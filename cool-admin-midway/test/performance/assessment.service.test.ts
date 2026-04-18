/// <reference types="jest" />
/**
 * 评估单纯逻辑测试。
 * 这里负责验证模块 1 的总分、等级与状态流转规则，不负责数据库或接口联调。
 */
import * as jwt from 'jsonwebtoken';
jest.mock('../../src/modules/performance/service/suggestion', () => ({
  PerformanceSuggestionService: class PerformanceSuggestionService {},
}));
import {
  assertAssessmentTransition,
  calculateAssessmentTotalScore,
  resolveAssessmentGrade,
} from '../../src/modules/performance/service/assessment-helper';
import { PerformanceAssessmentService } from '../../src/modules/performance/service/assessment';

describe('performance assessment helper', () => {
  test('should calculate weighted total score', () => {
    const total = calculateAssessmentTotalScore([
      { indicatorName: '目标达成', score: 95, weight: 50 },
      { indicatorName: '团队协作', score: 85, weight: 50 },
    ]);

    expect(total).toBe(90);
  });

  test('should resolve grade boundaries', () => {
    expect(resolveAssessmentGrade(90)).toBe('S');
    expect(resolveAssessmentGrade(80)).toBe('A');
    expect(resolveAssessmentGrade(70)).toBe('B');
    expect(resolveAssessmentGrade(69.99)).toBe('C');
  });

  test('should allow legal transitions', () => {
    expect(() => assertAssessmentTransition('draft', 'submit')).not.toThrow();
    expect(() =>
      assertAssessmentTransition('submitted', 'approve')
    ).not.toThrow();
    expect(() =>
      assertAssessmentTransition('submitted', 'reject')
    ).not.toThrow();
  });

  test('should reject illegal transitions', () => {
    expect(() => assertAssessmentTransition('submitted', 'submit')).toThrow(
      '当前状态不允许执行该操作'
    );
    expect(() => assertAssessmentTransition('approved', 'approve')).toThrow(
      '当前状态不允许执行该操作'
    );
  });

  test('should reject initiated page for non-admin token-only context', async () => {
    const token = jwt.sign(
      {
        userId: 321,
        username: 'employee_platform',
        roleIds: [3],
        passwordVersion: 1,
        isRefresh: false,
      },
      '694f6e56-579e-413e-8da0-63379cb5cd31'
    );

    const service = new PerformanceAssessmentService() as any;
    service.ctx = {
      headers: {
        authorization: token,
      },
      get: jest.fn().mockReturnValue(token),
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:assessment:myPage']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };

    await expect(
      service.page({
        mode: 'initiated',
      })
    ).rejects.toThrow('无权限查看已发起考核');

    expect(service.baseSysMenuService.getPerms).toHaveBeenCalledWith([3]);
  });

  test('should sync suggestion when assessment is approved', async () => {
    const service = new PerformanceAssessmentService() as any;
    const assessment = {
      id: 41,
      employeeId: 501,
      assessorId: 601,
      departmentId: 18,
      periodType: 'quarter',
      periodValue: '2026Q2',
      status: 'submitted',
      grade: 'C',
      totalScore: 68,
      tenantId: 1,
    };

    service.ctx = {
      admin: {
        userId: 601,
        username: 'manager_platform',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:assessment:approve']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceAssessmentEntity = {
      findOneBy: jest.fn().mockResolvedValue(assessment),
      update: jest.fn().mockResolvedValue(undefined),
    };
    service.performanceSuggestionService = {
      syncApprovedAssessment: jest.fn().mockResolvedValue({ id: 901 }),
    };
    service.performanceApprovalFlowService = {
      assertManualReviewAllowed: jest.fn().mockResolvedValue(undefined),
    };
    service.info = jest.fn().mockResolvedValue({ id: 41, status: 'approved' });

    await expect(service.approve(41, '需要进入改进')).resolves.toEqual({
      id: 41,
      status: 'approved',
    });

    expect(service.performanceAssessmentEntity.update).toHaveBeenCalledWith(
      { id: 41 },
      expect.objectContaining({
        status: 'approved',
        managerFeedback: '需要进入改进',
      })
    );
    expect(
      service.performanceSuggestionService.syncApprovedAssessment
    ).toHaveBeenCalledWith({
      id: 41,
      employeeId: 501,
      departmentId: 18,
      periodType: 'quarter',
      periodValue: '2026Q2',
      status: 'approved',
      grade: 'C',
      totalScore: 68,
      tenantId: 1,
    });
    expect(
      service.performanceApprovalFlowService.assertManualReviewAllowed
    ).toHaveBeenCalledWith('assessment', 41);
  });

  test('should launch approval flow after submit when configuration is enabled', async () => {
    const service = new PerformanceAssessmentService() as any;
    service.ctx = {
      admin: {
        userId: 501,
        username: 'employee_platform',
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:assessment:submit']),
    };
    service.performanceAssessmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 61,
        employeeId: 501,
        departmentId: 18,
        status: 'draft',
        tenantId: 1,
      }),
    };
    service.performanceAssessmentScoreEntity = {
      findBy: jest.fn().mockResolvedValue([
        { indicatorName: '目标达成', score: 90, weight: 50 },
        { indicatorName: '团队协作', score: 80, weight: 50 },
      ]),
    };
    service.performanceApprovalFlowService = {
      submitAssessment: jest.fn().mockResolvedValue(undefined),
    };
    service.info = jest.fn().mockResolvedValue({ id: 61, status: 'submitted' });

    await expect(service.submit(61)).resolves.toEqual({
      id: 61,
      status: 'submitted',
    });

    expect(service.performanceApprovalFlowService.submitAssessment).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 61,
        employeeId: 501,
        departmentId: 18,
      }),
      expect.objectContaining({
        totalScore: 85,
        grade: 'A',
      })
    );
  });
});
