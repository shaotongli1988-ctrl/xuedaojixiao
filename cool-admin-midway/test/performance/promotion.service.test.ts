/// <reference types="jest" />
/**
 * 晋升管理纯逻辑测试。
 * 这里负责验证模块 7 的状态流转、来源路径和独立创建约束，不负责数据库或接口联调。
 */
import {
  assertPromotionTransition,
  normalizePromotionDecision,
  validatePromotionPayload,
} from '../../src/modules/performance/service/promotion-helper';
import { PerformancePromotionService } from '../../src/modules/performance/service/promotion';
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

describe('performance promotion helper', () => {
  test('should allow legal transitions', () => {
    expect(() => assertPromotionTransition('draft', 'submit')).not.toThrow();
    expect(() =>
      assertPromotionTransition('reviewing', 'approved')
    ).not.toThrow();
    expect(() =>
      assertPromotionTransition('reviewing', 'rejected')
    ).not.toThrow();
  });

  test('should reject illegal transitions', () => {
    expect(() => assertPromotionTransition('draft', 'approved')).toThrow(
      '当前状态不允许执行该操作'
    );
    expect(() => assertPromotionTransition('approved', 'rejected')).toThrow(
      '当前状态不允许执行该操作'
    );
  });

  test('should require source reason when creating independently', () => {
    expect(() =>
      validatePromotionPayload({
        employeeId: 2,
        sponsorId: 9,
        fromPosition: 'P5',
        toPosition: 'P6',
        sourceReason: '',
      })
    ).toThrow('独立创建时必须填写原因说明');
  });

  test('should require sponsor and positions for promotion payload', () => {
    expect(() =>
      validatePromotionPayload({
        employeeId: 2,
        fromPosition: 'P5',
        toPosition: 'P6',
        sourceReason: '季度绩效达标',
      })
    ).toThrow('发起人不能为空');

    expect(() =>
      validatePromotionPayload({
        employeeId: 2,
        sponsorId: 9,
        toPosition: 'P6',
        sourceReason: '季度绩效达标',
      })
    ).toThrow('当前岗位不能为空');

    expect(() =>
      validatePromotionPayload({
        employeeId: 2,
        sponsorId: 9,
        fromPosition: 'P5',
        sourceReason: '季度绩效达标',
      })
    ).toThrow('目标岗位不能为空');
  });

  test('should reject invalid promotion decision', () => {
    expect(() => normalizePromotionDecision('approved')).not.toThrow();
    expect(() => normalizePromotionDecision('pending')).toThrow('评审结论不正确');
  });
});

describe('performance promotion service', () => {
  test('should support creation from assessment source and link accepted suggestion', async () => {
    const service = new PerformancePromotionService() as any;
    const suggestionRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 701,
        suggestionType: 'promotion',
        status: 'accepted',
        assessmentId: 12,
        employeeId: 2,
        linkedEntityType: null,
        linkedEntityId: null,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const manager = {
      save: jest.fn().mockResolvedValue({ id: 99 }),
      getRepository: jest.fn().mockReturnValue(suggestionRepo),
    };
    service.ctx = {
      admin: {
        userId: 9,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:promotion:add']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.performanceAssessmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 12,
        employeeId: 2,
      }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 2,
        departmentId: 11,
      }),
    };
    service.performancePromotionEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      manager: {
        transaction: jest.fn().mockImplementation(async (handler: any) => {
          return handler(manager);
        }),
      },
    };
    service.info = jest.fn().mockResolvedValue({ id: 99 });
    attachAccessContextService(service);

    await expect(
      service.add({
        assessmentId: 12,
        suggestionId: 701,
        sponsorId: 9,
        fromPosition: '高级工程师',
        toPosition: '技术经理',
        reason: '季度绩效达标',
      })
    ).resolves.toEqual({ id: 99 });

    expect(service.performancePromotionEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assessmentId: 12,
        employeeId: 2,
        sponsorId: 9,
        status: 'draft',
      })
    );
    expect(suggestionRepo.update).toHaveBeenCalledWith(
      { id: 701 },
      {
        linkedEntityType: 'promotion',
        linkedEntityId: 99,
      }
    );
    expect(service.info).toHaveBeenCalledWith(99);
  });

  test('should reject linking a suggestion that is already bound to a formal document', async () => {
    const service = new PerformancePromotionService() as any;
    const suggestionRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 702,
        suggestionType: 'promotion',
        status: 'accepted',
        assessmentId: 12,
        employeeId: 2,
        linkedEntityType: 'pip',
        linkedEntityId: 88,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const manager = {
      save: jest.fn().mockResolvedValue({ id: 100 }),
      getRepository: jest.fn().mockReturnValue(suggestionRepo),
    };
    service.ctx = {
      admin: {
        userId: 9,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:promotion:add']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.performanceAssessmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 12,
        employeeId: 2,
      }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 2,
        departmentId: 11,
      }),
    };
    service.performancePromotionEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      manager: {
        transaction: jest.fn().mockImplementation(async (handler: any) => {
          return handler(manager);
        }),
      },
    };
    attachAccessContextService(service);

    await expect(
      service.add({
        assessmentId: 12,
        suggestionId: 702,
        sponsorId: 9,
        fromPosition: '高级工程师',
        toPosition: '技术经理',
        reason: '季度绩效达标',
      })
    ).rejects.toThrow('该建议已关联正式单据');

    expect(suggestionRepo.update).not.toHaveBeenCalled();
  });

  test('should launch approval flow after submit when configuration is enabled', async () => {
    const service = new PerformancePromotionService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:promotion:submit']),
    };
    service.performancePromotionEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 101,
        employeeId: 2,
        sponsorId: 9,
        status: 'draft',
        tenantId: 1,
      }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 2,
        departmentId: 11,
      }),
    };
    service.performanceApprovalFlowService = {
      submitPromotion: jest.fn().mockResolvedValue(undefined),
    };
    service.info = jest.fn().mockResolvedValue({
      id: 101,
      status: 'reviewing',
    });
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    attachAccessContextService(service);

    await expect(service.submit(101)).resolves.toEqual({
      id: 101,
      status: 'reviewing',
    });

    expect(service.performanceApprovalFlowService.submitPromotion).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 101,
        employeeId: 2,
        sponsorId: 9,
      })
    );
  });

  test('should reject submit when sponsor no longer has employee scope', async () => {
    const service = new PerformancePromotionService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:promotion:submit']),
    };
    service.performancePromotionEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 102,
        employeeId: 2,
        sponsorId: 9,
        status: 'draft',
        tenantId: 1,
      }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 2,
        departmentId: 99,
      }),
    };
    service.performanceApprovalFlowService = {
      submitPromotion: jest.fn().mockResolvedValue(undefined),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    attachAccessContextService(service);

    await expect(service.submit(102)).rejects.toThrow('无权访问该晋升单');
    expect(service.performanceApprovalFlowService.submitPromotion).not.toHaveBeenCalled();
  });

  test('should block legacy manual review when active approval instance exists', async () => {
    const service = new PerformancePromotionService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:promotion:review']),
    };
    service.performancePromotionEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 88,
        employeeId: 2,
        sponsorId: 9,
        status: 'reviewing',
      }),
    };
    service.performanceApprovalFlowService = {
      assertManualReviewAllowed: jest
        .fn()
        .mockRejectedValue(
          new Error('当前对象已启用自动审批流，请使用审批流接口处理')
        ),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    attachAccessContextService(service);

    await expect(service.review(88, 'approved', '通过')).rejects.toThrow(
      '当前对象已启用自动审批流，请使用审批流接口处理'
    );
  });
});
