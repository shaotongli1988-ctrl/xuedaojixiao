/// <reference types="jest" />
/**
 * 知识产权台账服务最小测试。
 * 这里只验证 intellectualProperty 的主链、权限拒绝和关键边界校验，不覆盖真实数据库或控制器装饰器联调。
 */
import { PerformanceIntellectualPropertyService } from '../../src/modules/performance/service/intellectualProperty';
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function matchWhere(row: any, where: any) {
  return Object.entries(where || {}).every(([key, value]) => row[key] === value);
}

function createMemoryRepo(initialRows: any[] = []) {
  const rows = initialRows.map(item => clone(item));
  let currentId = rows.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0);

  return {
    rows,
    find: jest.fn(async () => rows.map(item => clone(item))),
    findOneBy: jest.fn(async (where: any) => {
      const found = rows.find(item => matchWhere(item, where));
      return found ? clone(found) : null;
    }),
    create: jest.fn((payload: any) => clone(payload)),
    save: jest.fn(async (payload: any) => {
      currentId += 1;
      const next = {
        id: currentId,
        createTime: '2026-04-19 10:00:00',
        updateTime: '2026-04-19 10:00:00',
        ...clone(payload),
      };
      rows.push(next);
      return clone(next);
    }),
    update: jest.fn(async (where: any, payload: any) => {
      const target = rows.find(item => matchWhere(item, where));
      if (target) {
        Object.assign(target, clone(payload), {
          updateTime: '2026-04-19 11:00:00',
        });
      }
    }),
    delete: jest.fn(async (ids: any) => {
      const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map(item => Number(item)));
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (idSet.has(Number(rows[index].id))) {
          rows.splice(index, 1);
        }
      }
    }),
  };
}

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

describe('performance intellectual-property service', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-19T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should support hr CRUD and stats flow', async () => {
    const service = new PerformanceIntellectualPropertyService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:intellectualProperty:page',
        'performance:intellectualProperty:info',
        'performance:intellectualProperty:stats',
        'performance:intellectualProperty:add',
        'performance:intellectualProperty:update',
        'performance:intellectualProperty:delete',
      ]),
    };
    service.performanceIntellectualPropertyEntity = createMemoryRepo([
      {
        id: 1,
        ipNo: 'IP-2026-001',
        title: '招生系统软件著作权',
        ipType: 'softwareCopyright',
        ownerDepartment: '信息中心',
        ownerName: '张老师',
        applicantName: '张老师',
        applyDate: '2026-01-10',
        grantDate: '2026-02-18',
        expiryDate: '2026-05-01',
        status: 'registered',
        registryNo: 'REG-001',
        usageScope: '内部教学系统',
        riskLevel: 'medium',
        notes: '首批',
        createTime: '2026-04-19 09:00:00',
        updateTime: '2026-04-19 09:00:00',
      },
      {
        id: 2,
        ipNo: 'IP-2026-002',
        title: '品牌商标',
        ipType: 'trademark',
        ownerDepartment: '品牌部',
        ownerName: '李老师',
        applicantName: '李老师',
        applyDate: '2025-01-10',
        grantDate: '2025-03-18',
        expiryDate: '2026-03-01',
        status: 'expired',
        registryNo: 'REG-002',
        usageScope: '校外宣传',
        riskLevel: 'high',
        notes: '',
        createTime: '2026-04-18 09:00:00',
        updateTime: '2026-04-18 09:00:00',
      },
    ]);
    attachAccessContextService(service);

    const added = await service.add({
      ipNo: 'IP-2026-003',
      title: '课程内容版权',
      ipType: 'copyright',
      ownerDepartment: '教研部',
      ownerName: '王老师',
      applicantName: '王老师',
      applyDate: '2026-04-01',
      grantDate: '2026-04-15',
      expiryDate: '2027-04-15',
      status: 'registered',
      registryNo: 'REG-003',
      usageScope: '课程出版',
      riskLevel: 'low',
      notes: '新登记',
    });

    expect(added).toMatchObject({
      ipNo: 'IP-2026-003',
      ipType: 'copyright',
      status: 'registered',
    });

    const updated = await service.updateProperty({
      id: added.id,
      status: 'invalidated',
      notes: '登记撤销',
    });

    expect(updated).toMatchObject({
      id: added.id,
      status: 'invalidated',
      notes: '登记撤销',
    });

    const pageResult = await service.page({
      page: 1,
      size: 10,
      keyword: '软件',
      ipType: 'softwareCopyright',
      status: 'registered',
    });
    expect(pageResult.pagination.total).toBe(1);
    expect(pageResult.list[0]).toMatchObject({
      ipNo: 'IP-2026-001',
    });

    const stats = await service.stats({});
    expect(stats).toEqual({
      total: 3,
      registeredCount: 1,
      expiringCount: 1,
      expiredCount: 1,
    });

    await expect(service.info(1)).resolves.toMatchObject({
      ipNo: 'IP-2026-001',
    });

    await expect(service.delete([added.id])).resolves.toBeUndefined();
    expect(
      service.performanceIntellectualPropertyEntity.rows.some(
        (item: any) => Number(item.id) === Number(added.id)
      )
    ).toBe(false);
  });

  test('should reject access without intellectualProperty perms', async () => {
    const service = new PerformanceIntellectualPropertyService() as any;
    service.ctx = {
      admin: {
        userId: 2,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
    attachAccessContextService(service);

    await expect(service.page({})).rejects.toThrow('无权限查看知识产权列表');
    await expect(service.info(1)).rejects.toThrow('无权限查看知识产权详情');
    await expect(service.stats({})).rejects.toThrow('无权限查看知识产权统计');
    await expect(service.add({})).rejects.toThrow('无权限新增知识产权');
  });

  test('should reject invalid enum and date boundary payload', async () => {
    const service = new PerformanceIntellectualPropertyService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:intellectualProperty:add',
      ]),
    };
    service.performanceIntellectualPropertyEntity = createMemoryRepo();
    attachAccessContextService(service);

    await expect(
      service.add({
        ipNo: 'IP-2026-100',
        title: '非法类型记录',
        ipType: 'domain',
        ownerDepartment: '法务部',
        ownerName: '赵老师',
        applicantName: '赵老师',
        applyDate: '2026-04-01',
        status: 'drafting',
      })
    ).rejects.toThrow('知识产权类型不合法');

    await expect(
      service.add({
        ipNo: 'IP-2026-101',
        title: '日期越界记录',
        ipType: 'patent',
        ownerDepartment: '法务部',
        ownerName: '赵老师',
        applicantName: '赵老师',
        applyDate: '2026-04-10',
        grantDate: '2026-04-01',
        status: 'applying',
      })
    ).rejects.toThrow('授权日期不能早于申请日期');

    await expect(
      service.add({
        ipNo: 'IP-2026-102',
        title: '非法风险等级',
        ipType: 'patent',
        ownerDepartment: '法务部',
        ownerName: '赵老师',
        applicantName: '赵老师',
        applyDate: '2026-04-10',
        status: 'applying',
        riskLevel: 'critical',
      })
    ).rejects.toThrow('风险等级不合法');
  });
});
