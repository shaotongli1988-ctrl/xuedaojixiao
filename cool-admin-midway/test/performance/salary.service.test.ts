/// <reference types="jest" />
/**
 * 文件职责：验证薪资模块的状态流转、调整金额计算和最小权限回归。
 * 不负责数据库联调或前端交互验证。
 * 维护重点：`confirmed` 后只能通过 `changeAdd` 变更金额。
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

jest.mock('../../src/modules/performance/entity/assessment', () => ({
  PerformanceAssessmentEntity: class PerformanceAssessmentEntity {},
}));

jest.mock('../../src/modules/performance/entity/salary', () => ({
  PerformanceSalaryEntity: class PerformanceSalaryEntity {},
}));

jest.mock('../../src/modules/performance/entity/salary-change', () => ({
  PerformanceSalaryChangeEntity: class PerformanceSalaryChangeEntity {},
}));

import {
  applySalaryChange,
  assertSalaryActionAllowed,
  assertSalaryDraftEditable,
  PerformanceSalaryService,
} from '../../src/modules/performance/service/salary';
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

describe('performance salary service', () => {
  test('should allow draft to confirmed only', () => {
    expect(() => assertSalaryActionAllowed('draft', 'confirm')).not.toThrow();
    expect(() => assertSalaryActionAllowed('confirmed', 'confirm')).toThrow(
      '当前状态不允许执行该操作'
    );
  });

  test('should allow confirmed to archived only', () => {
    expect(() => assertSalaryActionAllowed('confirmed', 'archive')).not.toThrow();
    expect(() => assertSalaryActionAllowed('draft', 'archive')).toThrow(
      '当前状态不允许执行该操作'
    );
  });

  test('should reject editing confirmed salary directly', () => {
    expect(() => assertSalaryDraftEditable('draft')).not.toThrow();
    expect(() => assertSalaryDraftEditable('confirmed')).toThrow(
      '已确认薪资不允许直接修改金额'
    );
  });

  test('should calculate before and after amount through changeAdd', () => {
    expect(applySalaryChange(500, 10500, -200)).toEqual({
      beforeAmount: 10500,
      delta: -200,
      nextAdjustAmount: 300,
      afterAmount: 10300,
    });
  });

  test('should deny salary page for non hr permission set', async () => {
    const service = new PerformanceSalaryService() as any;
    service.ctx = {
      admin: {
        userId: 11,
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    attachAccessContextService(service);

    await expect(service.page({ page: 1, size: 10 })).rejects.toThrow(
      '无权限查看薪资管理'
    );
  });

  test('should reject empty change reason when adding salary adjustment', async () => {
    const service = new PerformanceSalaryService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:salary:changeAdd']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.performanceSalaryEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 101,
        status: 'confirmed',
        adjustAmount: 0,
        finalAmount: 10000,
      }),
    };
    attachAccessContextService(service);

    await expect(
      service.changeAdd({
        salaryId: 101,
        adjustAmount: 100,
        changeReason: '',
      })
    ).rejects.toThrow('调整原因不能为空');
  });

  test('should reject missing period or effective date in salary payload', async () => {
    const service = new PerformanceSalaryService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:salary:add']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 2, name: '员工A' }),
    };
    service.performanceSalaryEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn(),
    };
    attachAccessContextService(service);

    await expect(
      service.add({
        employeeId: 2,
        effectiveDate: '2026-05-01',
      })
    ).rejects.toThrow('期间不能为空');

    await expect(
      service.add({
        employeeId: 2,
        periodValue: '2026-05',
      })
    ).rejects.toThrow('生效日期不能为空');
  });
});
