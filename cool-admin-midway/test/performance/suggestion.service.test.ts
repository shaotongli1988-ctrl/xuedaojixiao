/// <reference types="jest" />
/**
 * 自动建议引擎后端最小测试。
 * 这里负责验证规则命中、重复触发幂等、权限拒绝、非法状态拒绝和撤销审计校验，不负责数据库或控制器联调。
 */
import {
  assertSuggestionTransition,
  deriveSuggestionCandidate,
  validateRevokePayload,
} from '../../src/modules/performance/service/suggestion-helper';
import { PerformanceSuggestionService } from '../../src/modules/performance/service/suggestion';

describe('performance suggestion helper', () => {
  test('should derive pip suggestion from approved C result', () => {
    expect(
      deriveSuggestionCandidate({
        id: 1,
        status: 'approved',
        grade: 'C',
        totalScore: 66,
        employeeId: 2,
        departmentId: 11,
        periodType: 'quarter',
        periodValue: '2026-Q1',
      })
    ).toEqual(
      expect.objectContaining({
        suggestionType: 'pip',
        triggerLabel: '命中 PIP 建议规则',
      })
    );
  });

  test('should derive promotion suggestion from approved A result', () => {
    expect(
      deriveSuggestionCandidate({
        id: 1,
        status: 'approved',
        grade: 'A',
        totalScore: 86,
        employeeId: 2,
        departmentId: 11,
        periodType: 'quarter',
        periodValue: '2026-Q1',
      })
    ).toEqual(
      expect.objectContaining({
        suggestionType: 'promotion',
        triggerLabel: '命中晋升建议规则',
      })
    );
  });

  test('should not derive suggestion when rule does not match', () => {
    expect(
      deriveSuggestionCandidate({
        id: 1,
        status: 'approved',
        grade: 'B',
        totalScore: 75,
        employeeId: 2,
        departmentId: 11,
        periodType: 'quarter',
        periodValue: '2026-Q1',
      })
    ).toBeNull();
    expect(
      deriveSuggestionCandidate({
        id: 1,
        status: 'submitted',
        grade: 'C',
        totalScore: 60,
        employeeId: 2,
        departmentId: 11,
        periodType: 'quarter',
        periodValue: '2026-Q1',
      })
    ).toBeNull();
  });

  test('should reject invalid state transitions and revoke payloads', () => {
    expect(() =>
      assertSuggestionTransition('accepted', 'ignore', false)
    ).toThrow('当前状态不允许执行该操作');
    expect(() =>
      validateRevokePayload({ revokeReasonCode: '', revokeReason: '' })
    ).toThrow('撤销原因编码不合法');
  });
});

describe('performance suggestion service', () => {
  test('should create suggestion records and dedupe repeated triggers', async () => {
    const service = new PerformanceSuggestionService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
        isAdmin: true,
      },
      suggestionDepartmentIds: [11],
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:suggestion:page', 'performance:salary:page']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.performanceAssessmentEntity = {
      find: jest.fn().mockResolvedValue([
        {
          id: 101,
          status: 'approved',
          grade: 'C',
          totalScore: 65,
          employeeId: 2,
          departmentId: 11,
          periodType: 'quarter',
          periodValue: '2026-Q1',
        },
      ]),
    };

    const findOneBy = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 900,
        assessmentId: 101,
        suggestionType: 'pip',
      });
    service.performanceSuggestionEntity = {
      findOneBy,
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 900 }),
    };

    await service.ensureSuggestions({}, ['performance:suggestion:page']);
    await service.ensureSuggestions({}, ['performance:suggestion:page']);

    expect(service.performanceSuggestionEntity.create).toHaveBeenCalledTimes(1);
    expect(service.performanceSuggestionEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assessmentId: 101,
        suggestionType: 'pip',
        status: 'pending',
      })
    );
  });

  test('should reject accept when manager lacks target create permission', async () => {
    const service = new PerformanceSuggestionService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
      suggestionDepartmentIds: [11],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:suggestion:accept',
        'performance:suggestion:info',
      ]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.performanceSuggestionEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 501,
        suggestionType: 'pip',
        status: 'pending',
        assessmentId: 101,
        employeeId: 2,
        departmentId: 11,
      }),
    };

    await expect(service.accept({ id: 501 })).rejects.toThrow('无权限采用该建议');
  });

  test('should reject illegal repeated processing', async () => {
    const service = new PerformanceSuggestionService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:suggestion:ignore',
        'performance:salary:page',
      ]),
    };
    service.performanceSuggestionEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 601,
        suggestionType: 'promotion',
        status: 'accepted',
        assessmentId: 101,
        employeeId: 2,
        departmentId: 11,
      }),
    };

    await expect(service.ignore({ id: 601 })).rejects.toThrow(
      '当前状态不允许执行该操作'
    );
  });

  test('should require revoke audit fields and persist handler snapshot', async () => {
    const service = new PerformanceSuggestionService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:suggestion:revoke',
        'performance:salary:page',
      ]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        name: 'HR 管理员',
      }),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.baseSysDepartmentEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };
    const suggestion = {
      id: 701,
      suggestionType: 'promotion',
      status: 'pending',
      assessmentId: 101,
      employeeId: 2,
      departmentId: 11,
      periodType: 'quarter',
      periodValue: '2026-Q1',
      triggerLabel: '命中晋升建议规则',
      ruleVersion: 'suggestion-rule-v1',
      linkedEntityType: null,
      linkedEntityId: null,
      createTime: '2026-04-17 10:00:00',
      handleTime: null,
      handlerId: null,
      handlerName: null,
    };
    service.performanceSuggestionEntity = {
      findOneBy: jest.fn().mockResolvedValue(suggestion),
      save: jest.fn().mockImplementation(async payload => payload),
    };

    await expect(service.revoke({ id: 701 })).rejects.toThrow('撤销原因编码不合法');

    await expect(
      service.revoke({
        id: 701,
        revokeReasonCode: 'duplicateSuggestion',
        revokeReason: '重复建议',
      })
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'revoked',
        revokeReason: '重复建议',
      })
    );

    expect(service.performanceSuggestionEntity.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'revoked',
        revokeReasonCode: 'duplicateSuggestion',
        revokeReason: '重复建议',
        handlerId: 1,
        handlerName: 'HR 管理员',
      })
    );
  });

  test('should only expose frozen summary fields in suggestion detail', async () => {
    const service = new PerformanceSuggestionService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
        isAdmin: true,
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:suggestion:info',
        'performance:salary:page',
      ]),
    };
    service.baseSysUserEntity = {
      findBy: jest.fn().mockResolvedValue([
        {
          id: 2,
          name: '张三',
        },
      ]),
    };
    service.baseSysDepartmentEntity = {
      findBy: jest.fn().mockResolvedValue([
        {
          id: 11,
          name: '研发部',
        },
      ]),
    };
    service.performanceSuggestionEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 801,
        suggestionType: 'promotion',
        status: 'pending',
        assessmentId: 101,
        employeeId: 2,
        departmentId: 11,
        periodType: 'quarter',
        periodValue: '2026-Q1',
        triggerLabel: '命中晋升建议规则',
        triggerGrade: 'A',
        triggerScore: 88,
        ruleVersion: 'suggestion-rule-v1',
        createTime: '2026-04-17 10:00:00',
        handleTime: null,
        handlerId: null,
        handlerName: null,
        revokeReasonCode: null,
        revokeReason: null,
        linkedEntityType: null,
        linkedEntityId: null,
      }),
    };

    await expect(service.info(801)).resolves.toEqual({
      id: 801,
      suggestionType: 'promotion',
      status: 'pending',
      assessmentId: 101,
      employeeId: 2,
      employeeName: '张三',
      departmentId: 11,
      departmentName: '研发部',
      periodType: 'quarter',
      periodValue: '2026-Q1',
      triggerLabel: '命中晋升建议规则',
      createTime: '2026-04-17 10:00:00',
      handleTime: null,
      handlerId: null,
      handlerName: null,
      ruleVersion: 'suggestion-rule-v1',
      linkedEntityType: null,
      linkedEntityId: null,
      revokeReason: undefined,
    });
  });

  test('should reject manager cross-department suggestion access', async () => {
    const service = new PerformanceSuggestionService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
      suggestionDepartmentIds: [11],
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:suggestion:info',
      ]),
    };
    service.performanceSuggestionEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 901,
        suggestionType: 'pip',
        status: 'pending',
        assessmentId: 101,
        employeeId: 2,
        departmentId: 22,
        periodType: 'quarter',
        periodValue: '2026-Q1',
        triggerLabel: '命中 PIP 建议规则',
        ruleVersion: 'suggestion-rule-v1',
        createTime: '2026-04-17 10:00:00',
        handleTime: null,
        handlerId: null,
        handlerName: null,
        linkedEntityType: null,
        linkedEntityId: null,
      }),
    };

    await expect(service.info(901)).rejects.toThrow('无权访问该建议');
  });
});
