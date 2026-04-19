/// <reference types="jest" />
/**
 * 行政协同共享记录服务最小测试。
 * 这里只验证主题22的正常主链、权限拒绝和关键边界校验，不覆盖真实数据库、控制器装饰器或联调菜单导入。
 */
import { PerformanceOfficeCollabRecordService } from '../../src/modules/performance/service/office-collab-record';

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
    find: jest.fn(async (options?: any) => {
      let filtered = rows.slice();
      if (options?.where) {
        if (Array.isArray(options.where)) {
          filtered = filtered.filter(item =>
            options.where.some((condition: any) => matchWhere(item, condition))
          );
        } else {
          filtered = filtered.filter(item => matchWhere(item, options.where));
        }
      }
      return filtered.map(item => clone(item));
    }),
    findOneBy: jest.fn(async (where: any) => {
      const found = rows.find(item => matchWhere(item, where));
      return found ? clone(found) : null;
    }),
    create: jest.fn((payload: any) => clone(payload)),
    save: jest.fn(async (payload: any) => {
      if (payload.id) {
        const index = rows.findIndex(item => Number(item.id) === Number(payload.id));
        const next = {
          ...rows[index],
          ...clone(payload),
          updateTime: '2026-04-19 12:00:00',
        };
        rows[index] = next;
        return clone(next);
      }
      currentId += 1;
      const next = {
        id: currentId,
        tenantId: null,
        createTime: '2026-04-19 12:00:00',
        updateTime: '2026-04-19 12:00:00',
        ...clone(payload),
      };
      rows.push(next);
      return clone(next);
    }),
    update: jest.fn(async (where: any, payload: any) => {
      const target = rows.find(item => matchWhere(item, where));
      if (target) {
        Object.assign(target, clone(payload), {
          updateTime: '2026-04-19 13:00:00',
        });
      }
    }),
    delete: jest.fn(async (where: any) => {
      if (Array.isArray(where)) {
        const idSet = new Set(where.map(item => Number(item)));
        for (let index = rows.length - 1; index >= 0; index -= 1) {
          if (idSet.has(Number(rows[index].id))) {
            rows.splice(index, 1);
          }
        }
        return;
      }

      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (matchWhere(rows[index], where)) {
          rows.splice(index, 1);
        }
      }
    }),
  };
}

function buildModulePerms(moduleKey: string) {
  return [
    `performance:${moduleKey}:page`,
    `performance:${moduleKey}:info`,
    `performance:${moduleKey}:stats`,
    `performance:${moduleKey}:add`,
    `performance:${moduleKey}:update`,
    `performance:${moduleKey}:delete`,
  ];
}

function createService(perms: string[]) {
  const collabRepo = createMemoryRepo([
    {
      id: 1,
      moduleKey: 'annualInspection',
      recordNo: 'NJ-20260419-0001',
      title: '消防设施年检材料',
      status: 'preparing',
      department: '行政部',
      ownerName: '陈敏',
      assigneeName: null,
      category: 'safety',
      priority: null,
      version: 'v1.0',
      dueDate: '2026-04-25',
      eventDate: null,
      progressValue: 72,
      scoreValue: 0,
      relatedDocumentId: null,
      extJson: JSON.stringify({ reminderDays: 14 }),
      notes: '待补第三方报告',
      createTime: '2026-04-19 09:00:00',
      updateTime: '2026-04-19 09:00:00',
      tenantId: null,
    },
  ]);
  const documentRepo = createMemoryRepo([
    {
      id: 601,
      fileNo: 'DOC-601',
      fileName: '品牌规范手册',
      category: 'policy',
      fileType: 'pdf',
      storage: 'cloud',
      confidentiality: 'internal',
      ownerName: '行政资料员',
      department: '行政部',
      status: 'published',
      version: 'V1.0',
      sizeMb: 3.2,
      downloadCount: 21,
      expireDate: null,
      tags: null,
      notes: '',
      createTime: '2026-04-19 08:00:00',
      updateTime: '2026-04-19 08:00:00',
      tenantId: null,
    },
  ]);

  const service = new PerformanceOfficeCollabRecordService() as any;
  service.ctx = {
    admin: {
      userId: 1,
      username: 'hr_admin',
      roleIds: [1],
    },
  };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(perms),
  };
  service.performanceOfficeCollabRecordEntity = collabRepo;
  service.performanceDocumentCenterEntity = documentRepo;

  return {
    service,
    repos: {
      collabRepo,
      documentRepo,
    },
  };
}

describe('performance office collab record service', () => {
  test('should support annual inspection and publicity material normal flow', async () => {
    const { service, repos } = createService([
      ...buildModulePerms('annualInspection'),
      ...buildModulePerms('publicityMaterial'),
    ]);

    const annualAdded = await service.addByModule('annualInspection', {
      title: '电梯设备年检资料',
      category: 'equipment',
      department: '行政部',
      ownerName: '王楠',
      dueDate: '2026-05-06',
      completeness: 88,
      version: 'v2.0',
      reminderDays: 7,
      status: 'submitted',
      notes: '已送审',
    });

    expect(annualAdded).toMatchObject({
      title: '电梯设备年检资料',
      category: 'equipment',
      status: 'submitted',
      completeness: 88,
      reminderDays: 7,
    });
    expect(annualAdded.materialNo).toMatch(/^NJ-/);

    const annualUpdated = await service.updateByModule('annualInspection', {
      id: annualAdded.id,
      completeness: 90,
      status: 'approved',
    });

    expect(annualUpdated).toMatchObject({
      id: annualAdded.id,
      status: 'approved',
      completeness: 90,
    });

    const annualStats = await service.statsByModule('annualInspection', {});
    expect(annualStats).toEqual({
      total: 2,
      overdueCount: 0,
      approvedCount: 1,
      avgCompleteness: 81,
    });

    const publicityAdded = await service.addByModule('publicityMaterial', {
      title: '春招海报',
      materialType: 'poster',
      channel: 'wechat',
      ownerName: '李老师',
      publishDate: '2026-04-21',
      designOwner: '视觉A',
      status: 'review',
      views: 120,
      downloads: 12,
      relatedDocumentId: 601,
      notes: '仅做元数据关系',
    });

    expect(publicityAdded).toMatchObject({
      title: '春招海报',
      materialType: 'poster',
      channel: 'wechat',
      relatedDocumentId: 601,
      relatedDocumentSummary: {
        fileNo: 'DOC-601',
        fileName: '品牌规范手册',
      },
    });

    const publicityPage = await service.pageByModule('publicityMaterial', {
      page: 1,
      size: 10,
      keyword: '春招',
    });
    expect(publicityPage.pagination.total).toBe(1);
    expect(publicityPage.list[0].id).toBe(publicityAdded.id);

    await service.deleteByModule('annualInspection', [annualAdded.id]);
    expect(
      repos.collabRepo.rows.some((item: any) => Number(item.id) === Number(annualAdded.id))
    ).toBe(false);
  });

  test('should reject access when permission is missing', async () => {
    const { service } = createService([]);

    await expect(service.pageByModule('honor', { page: 1, size: 10 })).rejects.toThrow(
      '无权限查看荣誉管理列表'
    );
    await expect(service.infoByModule('honor', 1)).rejects.toThrow(
      '无权限查看荣誉管理详情'
    );
    await expect(service.statsByModule('honor', {})).rejects.toThrow(
      '无权限查看荣誉管理统计'
    );
    await expect(service.addByModule('honor', {})).rejects.toThrow(
      '无权限新增荣誉管理'
    );
  });

  test('should reject invalid boundary or relation payload', async () => {
    const { service } = createService([
      ...buildModulePerms('designCollab'),
      ...buildModulePerms('publicityMaterial'),
      ...buildModulePerms('expressCollab'),
    ]);

    await expect(
      service.addByModule('designCollab', {
        title: '主题海报修改',
        requesterName: '市场A',
        assigneeName: '设计B',
        dueDate: '2026-04-26',
        progress: 101,
      })
    ).rejects.toThrow('任务进度必须在0-100之间');

    await expect(
      service.addByModule('publicityMaterial', {
        title: '外宣稿',
        materialType: 'article',
        channel: 'website',
        ownerName: '王老师',
        publishDate: '2026-04-26',
        designOwner: '编辑A',
        relatedDocumentId: 999,
      })
    ).rejects.toThrow('关联文件不存在');

    await expect(
      service.addByModule('expressCollab', {
        title: '合同资料寄送',
        orderNo: 'ORD-001',
        courierCompany: '顺丰',
        serviceLevel: 'express',
        origin: '上海',
        destination: '北京',
        senderName: '行政A',
        receiverName: '法务B',
        etaDate: '2026-04-27',
        lastUpdate: '2026-04-19 10:00:00',
        syncStatus: 'unknown',
      })
    ).rejects.toThrow('同步状态不合法');
  });
});
