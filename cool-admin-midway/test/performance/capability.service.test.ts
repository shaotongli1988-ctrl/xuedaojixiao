/// <reference types="jest" />
/**
 * 主题13能力地图服务测试。
 * 这里只验证主题13的状态限制、编码唯一、经理部门树范围和员工权限拒绝，不覆盖真实数据库或联调环境。
 */
import {
  assertCapabilityModelTransition,
  normalizeCapabilityArray,
  normalizeCapabilityModelPayload,
  normalizeCapabilityModelStatus,
} from '../../src/modules/performance/service/capability-helper';
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import { PerformanceCapabilityService } from '../../src/modules/performance/service/capability';

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

describe('performance capability helper', () => {
  test('should normalize draft model payload by default', () => {
    expect(
      normalizeCapabilityModelPayload({
        name: '领导力模型',
        code: '',
        category: '管理',
        description: '',
      })
    ).toEqual({
      name: '领导力模型',
      code: null,
      category: '管理',
      description: null,
      status: 'draft',
    });
  });

  test('should normalize capability summary arrays', () => {
    expect(normalizeCapabilityArray(['沟通', '沟通', '  ', '执行力'])).toEqual([
      '沟通',
      '执行力',
    ]);
  });

  test('should reject illegal capability model transition', () => {
    expect(() =>
      assertCapabilityModelTransition('active', 'draft', 'update')
    ).toThrow('当前状态不允许流转到目标状态');
  });

  test('should reject invalid model status and non-draft add status', () => {
    expect(() => normalizeCapabilityModelStatus('enabled')).toThrow(
      '能力模型状态不合法'
    );
    expect(() =>
      assertCapabilityModelTransition(undefined, 'active', 'add')
    ).toThrow('新增能力模型状态只能为 draft');
  });
});

describe('performance capability service', () => {
  test('should reject employee model page access', async () => {
    const service = new PerformanceCapabilityService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
    attachAccessContext(service);

    await expect(service.modelPage({ page: 1, size: 10 })).rejects.toThrow(
      '无权限查看能力模型列表'
    );
  });

  test('should reject duplicated model code on add', async () => {
    const service = new PerformanceCapabilityService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:capabilityModel:add']),
    };
    service.performanceCapabilityModelEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 9, code: 'CAP-001' }),
    };
    attachAccessContext(service);

    await expect(
      service.addModel({
        name: '通用模型',
        code: 'CAP-001',
      })
    ).rejects.toThrow('能力模型编码已存在');
  });

  test('should reject manager portrait access out of scope', async () => {
    const service = new PerformanceCapabilityService() as any;
    service.ctx = {
      admin: {
        userId: 2,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:capabilityPortrait:info']),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([11]),
    };
    service.performanceCapabilityPortraitEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        employeeId: 101,
        departmentId: 22,
        capabilityTags: ['沟通'],
        levelSummary: ['L2'],
        updatedAt: '2026-04-18 10:00:00',
      }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 101, name: '张三', departmentId: 22 }),
    };
    attachAccessContext(service);

    await expect(service.portraitInfo(101)).rejects.toThrow(
      '无权限查看能力画像摘要'
    );
  });

  test('should return portrait summary only for hr', async () => {
    const service = new PerformanceCapabilityService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:capabilityPortrait:info',
        'performance:capabilityModel:add',
      ]),
    };
    service.performanceCapabilityPortraitEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        employeeId: 101,
        departmentId: 11,
        capabilityTags: ['沟通', '执行'],
        levelSummary: ['L2'],
        updatedAt: '2026-04-18 10:00:00',
      }),
    };
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 101, name: '张三', departmentId: 11 }),
    };
    service.baseSysDepartmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 11, name: '研发部' }),
    };
    service.performanceCertificateRecordEntity = {
      findBy: jest.fn().mockResolvedValue([
        { issuedAt: '2026-04-18 08:00:00', status: 'issued' },
        { issuedAt: '2026-04-19 08:00:00', status: 'issued' },
      ]),
    };
    attachAccessContext(service);

    await expect(service.portraitInfo(101)).resolves.toEqual({
      employeeId: 101,
      employeeName: '张三',
      departmentId: 11,
      departmentName: '研发部',
      capabilityTags: ['沟通', '执行'],
      levelSummary: ['L2'],
      certificateCount: 2,
      lastCertifiedAt: '2026-04-19 08:00:00',
      updatedAt: '2026-04-18 10:00:00',
    });
  });
});
