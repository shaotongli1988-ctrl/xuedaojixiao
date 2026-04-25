/// <reference types="jest" />
/**
 * 文件管理服务最小测试。
 * 这里只验证主题21的 HR-only、字段校验和 CRUD 主链，不负责数据库或控制器联调。
 */
import { PerformanceDocumentCenterService } from '../../src/modules/performance/service/documentCenter';
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

describe('performance document-center service', () => {
  test('should allow hr create update info and delete document metadata', async () => {
    const service = new PerformanceDocumentCenterService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:documentCenter:page',
        'performance:documentCenter:info',
        'performance:documentCenter:stats',
        'performance:documentCenter:add',
        'performance:documentCenter:update',
        'performance:documentCenter:delete',
      ]),
    };
    service.performanceDocumentCenterEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 301 }),
      findOne: jest.fn().mockResolvedValue(null),
      findOneBy: jest.fn().mockResolvedValue({
        id: 301,
        fileNo: 'DOC-001',
        fileName: '制度文件',
        category: 'policy',
        fileType: 'pdf',
        storage: 'cloud',
        confidentiality: 'internal',
        ownerName: '王老师',
        department: '行政部',
        status: 'draft',
        version: 'V1.0',
        sizeMb: 12.5,
        downloadCount: 8,
        expireDate: null,
        tags: '["制度","入职"]',
        notes: '首版',
      }),
      update: jest.fn().mockResolvedValue(undefined),
      findBy: jest.fn().mockResolvedValue([{ id: 301 }]),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    attachAccessContextService(service);

    await expect(
      service.add({
        fileNo: 'DOC-001',
        fileName: '制度文件',
        category: 'policy',
        fileType: 'pdf',
        storage: 'cloud',
        confidentiality: 'internal',
        ownerName: '王老师',
        department: '行政部',
        version: 'V1.0',
        status: 'draft',
        sizeMb: 12.5,
        downloadCount: 8,
        tags: ['制度', '入职'],
      })
    ).resolves.toEqual(
      expect.objectContaining({
        id: 301,
        fileNo: 'DOC-001',
        tags: ['制度', '入职'],
      })
    );

    service.performanceDocumentCenterEntity.findOne.mockResolvedValueOnce(null);
    await expect(
      service.updateDocument({
        id: 301,
        fileNo: 'DOC-001',
        fileName: '制度文件-修订',
        category: 'policy',
        fileType: 'pdf',
        storage: 'cloud',
        confidentiality: 'internal',
        ownerName: '王老师',
        department: '行政部',
        version: 'V1.1',
        status: 'review',
      })
    ).resolves.toEqual(expect.objectContaining({ id: 301 }));

    await expect(service.info(301)).resolves.toEqual(expect.objectContaining({ id: 301 }));
    await expect(service.delete([301])).resolves.toBeUndefined();

    expect(service.performanceDocumentCenterEntity.create).toHaveBeenCalled();
    expect(service.performanceDocumentCenterEntity.update).toHaveBeenCalledWith(
      { id: 301 },
      expect.objectContaining({
        fileName: '制度文件-修订',
        status: 'review',
      })
    );
    expect(service.performanceDocumentCenterEntity.delete).toHaveBeenCalledWith([301]);
  });

  test('should reject non-hr access', async () => {
    const service = new PerformanceDocumentCenterService() as any;
    service.ctx = {
      admin: {
        userId: 9,
        username: 'manager_rd',
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
    attachAccessContextService(service);

    await expect(service.page({})).rejects.toThrow('无权限查看文件管理列表');
    await expect(service.info(1)).rejects.toThrow('无权限查看文件详情');
    await expect(service.stats({})).rejects.toThrow('无权限查看文件统计');
    await expect(service.add({})).rejects.toThrow('无权限新增文件元数据');
  });

  test('should reject invalid enums and duplicate file no', async () => {
    const service = new PerformanceDocumentCenterService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:documentCenter:add']),
    };
    service.performanceDocumentCenterEntity = {
      findOne: jest.fn().mockResolvedValue({ id: 501, fileNo: 'DOC-EXISTS' }),
    };
    attachAccessContextService(service);

    await expect(
      service.add({
        fileNo: 'DOC-EXISTS',
        fileName: '重复文件',
        category: 'policy',
        fileType: 'pdf',
        storage: 'cloud',
        confidentiality: 'internal',
        ownerName: '王老师',
        department: '行政部',
        version: 'V1.0',
      })
    ).rejects.toThrow('文件编号已存在');

    service.performanceDocumentCenterEntity.findOne.mockResolvedValue(null);

    await expect(
      service.add({
        fileNo: 'DOC-NEW',
        fileName: '非法状态',
        category: 'unknown',
        fileType: 'pdf',
        storage: 'cloud',
        confidentiality: 'internal',
        ownerName: '王老师',
        department: '行政部',
        version: 'V1.0',
      })
    ).rejects.toThrow('文件分类不合法');
  });

  test('should keep allowEmptyRoleIds compatibility and return permission denial', async () => {
    const service = new PerformanceDocumentCenterService() as any;
    service.ctx = {
      admin: {
        userId: 12,
        username: 'legacy_document_user',
        roleIds: [],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
    attachAccessContextService(service);

    await expect(service.page({})).rejects.toThrow('无权限查看文件管理列表');
  });
});
