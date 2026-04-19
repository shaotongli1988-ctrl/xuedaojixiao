/// <reference types="jest" />
/**
 * 车辆管理台账服务最小测试。
 * 这里只验证 vehicle 的主链、权限拒绝和关键边界校验，不覆盖真实数据库或控制器装饰器联调。
 */
import { PerformanceVehicleService } from '../../src/modules/performance/service/vehicle';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function matchWhere(row: any, where: any) {
  return Object.entries(where || {}).every(([key, value]) => row[key] === value);
}

function extractFindOperatorValues(value: any) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  if (Array.isArray(value._value)) {
    return value._value;
  }
  if (Array.isArray(value.value)) {
    return value.value;
  }
  return null;
}

function createMemoryRepo(initialRows: any[] = []) {
  const rows = initialRows.map(item => clone(item));
  let currentId = rows.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0);

  return {
    rows,
    find: jest.fn(async () => rows.map(item => clone(item))),
    findBy: jest.fn(async (where: any) => {
      const idValues = extractFindOperatorValues(where?.id);
      if (idValues) {
        const idSet = new Set(idValues.map(item => Number(item)));
        return rows
          .filter(item => idSet.has(Number(item.id)))
          .map(item => clone(item));
      }
      return rows.filter(item => matchWhere(item, where)).map(item => clone(item));
    }),
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

describe('performance vehicle service', () => {
  test('should support hr CRUD and stats flow', async () => {
    const service = new PerformanceVehicleService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:vehicle:page',
        'performance:vehicle:info',
        'performance:vehicle:stats',
        'performance:vehicle:add',
        'performance:vehicle:update',
        'performance:vehicle:delete',
      ]),
    };
    service.performanceVehicleEntity = createMemoryRepo([
      {
        id: 1,
        vehicleNo: 'VEH-2026-001',
        plateNo: '沪A10001',
        brand: '别克',
        model: 'GL8',
        vehicleType: 'mpv',
        ownerDepartment: '行政部',
        managerName: '张老师',
        seats: 7,
        registerDate: '2024-05-01',
        inspectionDueDate: '2026-05-01',
        insuranceDueDate: '2026-06-01',
        status: 'in_use',
        usageScope: '校区通勤',
        notes: '主力公务车',
        createTime: '2026-04-19 09:00:00',
        updateTime: '2026-04-19 09:00:00',
      },
      {
        id: 2,
        vehicleNo: 'VEH-2026-002',
        plateNo: '沪A10002',
        brand: '大众',
        model: 'Passat',
        vehicleType: 'sedan',
        ownerDepartment: '行政部',
        managerName: '李老师',
        seats: 5,
        registerDate: '2023-03-15',
        inspectionDueDate: '2026-04-28',
        insuranceDueDate: '2026-05-15',
        status: 'inspection_due',
        usageScope: '访客接待',
        notes: '',
        createTime: '2026-04-18 09:00:00',
        updateTime: '2026-04-18 09:00:00',
      },
    ]);

    const added = await service.add({
      vehicleNo: 'VEH-2026-003',
      plateNo: '沪A10003',
      brand: '丰田',
      model: '考斯特',
      vehicleType: 'bus',
      ownerDepartment: '后勤部',
      managerName: '王老师',
      seats: 19,
      registerDate: '2025-01-10',
      inspectionDueDate: '2026-07-01',
      insuranceDueDate: '2026-08-01',
      status: 'maintenance',
      usageScope: '校外活动',
      notes: '保养中',
    });

    expect(added).toMatchObject({
      vehicleNo: 'VEH-2026-003',
      vehicleType: 'bus',
      status: 'maintenance',
    });

    const updated = await service.updateVehicle({
      id: added.id,
      status: 'idle',
      notes: '维修完成待排班',
    });

    expect(updated).toMatchObject({
      id: added.id,
      status: 'idle',
      notes: '维修完成待排班',
    });

    const pageResult = await service.page({
      page: 1,
      size: 10,
      keyword: '别克',
      vehicleType: 'mpv',
      status: 'in_use',
    });
    expect(pageResult.pagination.total).toBe(1);
    expect(pageResult.list[0]).toMatchObject({
      vehicleNo: 'VEH-2026-001',
    });

    const stats = await service.stats({});
    expect(stats).toEqual({
      total: 3,
      inUseCount: 1,
      maintenanceCount: 0,
      inspectionDueCount: 1,
    });

    await expect(service.info(1)).resolves.toMatchObject({
      vehicleNo: 'VEH-2026-001',
    });

    await expect(service.delete([added.id])).resolves.toBeUndefined();
    expect(
      service.performanceVehicleEntity.rows.some(
        (item: any) => Number(item.id) === Number(added.id)
      )
    ).toBe(false);
  });

  test('should reject access without vehicle perms', async () => {
    const service = new PerformanceVehicleService() as any;
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

    await expect(service.page({})).rejects.toThrow('无权限查看车辆列表');
    await expect(service.info(1)).rejects.toThrow('无权限查看车辆详情');
    await expect(service.stats({})).rejects.toThrow('无权限查看车辆统计');
    await expect(service.add({})).rejects.toThrow('无权限新增车辆台账');
    await expect(service.updateVehicle({ id: 1 })).rejects.toThrow(
      '无权限更新车辆台账'
    );
    await expect(service.delete([1])).rejects.toThrow('无权限删除车辆台账');
  });

  test('should reject duplicate, invalid enum, invalid status and date boundary payload', async () => {
    const service = new PerformanceVehicleService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:vehicle:add']),
    };
    service.performanceVehicleEntity = createMemoryRepo([
      {
        id: 10,
        vehicleNo: 'VEH-2026-100',
        plateNo: '沪A10100',
        brand: '现有品牌',
        model: '现有型号',
        vehicleType: 'sedan',
        ownerDepartment: '行政部',
        managerName: '赵老师',
        seats: 5,
        registerDate: '2026-03-01',
        inspectionDueDate: '2026-06-01',
        insuranceDueDate: '2026-07-01',
        status: 'idle',
        usageScope: '行政接待',
        notes: null,
        createTime: '2026-04-19 08:00:00',
        updateTime: '2026-04-19 08:00:00',
      },
    ]);

    await expect(
      service.add({
        vehicleNo: 'VEH-2026-100',
        plateNo: '沪A10199',
        brand: '测试品牌',
        model: '测试型号',
        vehicleType: 'sedan',
        ownerDepartment: '行政部',
        managerName: '赵老师',
        seats: 5,
        registerDate: '2026-04-01',
        status: 'idle',
      })
    ).rejects.toThrow('车辆编号已存在');

    await expect(
      service.add({
        vehicleNo: 'VEH-2026-199',
        plateNo: '沪A10100',
        brand: '测试品牌',
        model: '测试型号',
        vehicleType: 'sedan',
        ownerDepartment: '行政部',
        managerName: '赵老师',
        seats: 5,
        registerDate: '2026-04-01',
        status: 'idle',
      })
    ).rejects.toThrow('车牌号已存在');

    await expect(
      service.add({
        vehicleNo: 'VEH-2026-100',
        plateNo: '沪A10100',
        brand: '测试品牌',
        model: '测试型号',
        vehicleType: 'helicopter',
        ownerDepartment: '行政部',
        managerName: '赵老师',
        seats: 5,
        registerDate: '2026-04-01',
        status: 'idle',
      })
    ).rejects.toThrow('车辆类型不合法');

    await expect(
      service.add({
        vehicleNo: 'VEH-2026-102',
        plateNo: '沪A10102',
        brand: '测试品牌',
        model: '测试型号',
        vehicleType: 'sedan',
        ownerDepartment: '行政部',
        managerName: '赵老师',
        seats: 0,
        registerDate: '2026-04-10',
        status: 'idle',
      })
    ).rejects.toThrow('座位数必须在1-99之间');

    await expect(
      service.add({
        vehicleNo: 'VEH-2026-103',
        plateNo: '沪A10103',
        brand: '测试品牌',
        model: '测试型号',
        vehicleType: 'sedan',
        ownerDepartment: '行政部',
        managerName: '赵老师',
        seats: 5,
        registerDate: '2026-04-10',
        status: 'unknown',
      })
    ).rejects.toThrow('车辆状态不合法');

    await expect(
      service.add({
        vehicleNo: 'VEH-2026-101',
        plateNo: '沪A10101',
        brand: '测试品牌',
        model: '测试型号',
        vehicleType: 'sedan',
        ownerDepartment: '行政部',
        managerName: '赵老师',
        seats: 5,
        registerDate: '2026-04-10',
        inspectionDueDate: '2026-04-01',
        status: 'idle',
      })
    ).rejects.toThrow('年检到期日不能早于登记日期');
  });
});
