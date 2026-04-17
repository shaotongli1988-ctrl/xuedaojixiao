/// <reference types="jest" />
/**
 * 晋升管理纯逻辑测试。
 * 这里负责验证模块 7 的状态流转、来源路径和独立创建约束，不负责数据库或接口联调。
 */
import {
  assertPromotionTransition,
  validatePromotionPayload,
} from '../../src/modules/performance/service/promotion-helper';
import { PerformancePromotionService } from '../../src/modules/performance/service/promotion';

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
});

describe('performance promotion service', () => {
  test('should support creation from assessment source', async () => {
    const service = new PerformancePromotionService() as any;
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
      save: jest.fn().mockResolvedValue({ id: 99 }),
    };
    service.info = jest.fn().mockResolvedValue({ id: 99 });

    await expect(
      service.add({
        assessmentId: 12,
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
    expect(service.info).toHaveBeenCalledWith(99);
  });
});
