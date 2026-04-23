/// <reference types="jest" />
/**
 * 知识库服务最小测试。
 * 这里只验证主题21的 HR-only、关联校验、搜索/图谱/QA 主链，不负责数据库或控制器联调。
 */
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import { PerformanceKnowledgeBaseService } from '../../src/modules/performance/service/knowledgeBase';

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

describe('performance knowledge-base service', () => {
  test('should allow hr create update delete search graph and qa add', async () => {
    const service = new PerformanceKnowledgeBaseService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:knowledgeBase:page',
        'performance:knowledgeBase:stats',
        'performance:knowledgeBase:add',
        'performance:knowledgeBase:update',
        'performance:knowledgeBase:delete',
        'performance:knowledgeBase:graph',
        'performance:knowledgeBase:search',
        'performance:knowledgeBase:qaList',
        'performance:knowledgeBase:qaAdd',
      ]),
    };
    service.performanceDocumentCenterEntity = {
      findBy: jest.fn().mockResolvedValue([{ id: 301, fileName: '制度文件' }]),
      find: jest.fn().mockResolvedValue([{ id: 301, fileName: '制度文件' }]),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 301,
            fileNo: 'DOC-001',
            fileName: '制度文件',
            category: 'policy',
            fileType: 'pdf',
            storage: 'cloud',
            confidentiality: 'internal',
            ownerName: '王老师',
            department: '行政部',
            status: 'published',
            version: 'V1.0',
            sizeMb: 12.5,
            downloadCount: 8,
            expireDate: null,
            tags: '["制度"]',
            notes: null,
            createTime: '2026-04-19 10:00:00',
            updateTime: '2026-04-19 10:00:00',
          },
        ]),
      }),
    };
    service.performanceKnowledgeBaseEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 401 }),
      findOne: jest.fn().mockResolvedValue(null),
      findOneBy: jest.fn().mockResolvedValue({
        id: 401,
        kbNo: 'KB-001',
        title: '入职制度',
        category: '制度',
        summary: '制度摘要',
        ownerName: '李老师',
        status: 'draft',
        tags: '["制度"]',
        relatedFileIds: '[301]',
        relatedTopics: '["人事"]',
        importance: 80,
        viewCount: 20,
        createTime: '2026-04-19 10:00:00',
        updateTime: '2026-04-19 10:00:00',
      }),
      update: jest.fn().mockResolvedValue(undefined),
      findBy: jest.fn().mockResolvedValue([{ id: 401 }]),
      delete: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([
        {
          id: 401,
          kbNo: 'KB-001',
          title: '入职制度',
          category: '制度',
          summary: '制度摘要',
          ownerName: '李老师',
          status: 'published',
          tags: '["制度"]',
          relatedFileIds: '[301]',
          relatedTopics: '["人事"]',
          importance: 80,
          viewCount: 20,
          createTime: '2026-04-19 10:00:00',
          updateTime: '2026-04-19 10:00:00',
        },
      ]),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 401,
            kbNo: 'KB-001',
            title: '入职制度',
            category: '制度',
            summary: '制度摘要',
            ownerName: '李老师',
            status: 'published',
            tags: '["制度"]',
            relatedFileIds: '[301]',
            relatedTopics: '["人事"]',
            importance: 80,
            viewCount: 20,
            createTime: '2026-04-19 10:00:00',
            updateTime: '2026-04-19 10:00:00',
          },
        ]),
      }),
    };
    service.performanceKnowledgeQaEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn().mockResolvedValue({ id: 601 }),
      findOneBy: jest.fn().mockResolvedValue({
        id: 601,
        question: '如何入职',
        answer: '按制度执行',
        relatedKnowledgeIds: '[401]',
        relatedFileIds: '[301]',
        createTime: '2026-04-19 10:00:00',
        updateTime: '2026-04-19 10:00:00',
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 601,
            question: '如何入职',
            answer: '按制度执行',
            relatedKnowledgeIds: '[401]',
            relatedFileIds: '[301]',
            createTime: '2026-04-19 10:00:00',
            updateTime: '2026-04-19 10:00:00',
          },
        ]),
      }),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    attachAccessContext(service);

    await expect(
      service.add({
        kbNo: 'KB-001',
        title: '入职制度',
        category: '制度',
        summary: '制度摘要',
        ownerName: '李老师',
        status: 'draft',
        tags: ['制度'],
        relatedFileIds: [301],
        relatedTopics: ['人事'],
        importance: 80,
      })
    ).resolves.toEqual(expect.objectContaining({ id: 401, kbNo: 'KB-001' }));

    service.performanceKnowledgeBaseEntity.findOne.mockResolvedValueOnce(null);
    await expect(
      service.updateKnowledge({
        id: 401,
        kbNo: 'KB-001',
        title: '入职制度-修订',
        category: '制度',
        summary: '制度摘要2',
        ownerName: '李老师',
        status: 'published',
        relatedFileIds: [301],
      })
    ).resolves.toEqual(expect.objectContaining({ id: 401 }));

    await expect(service.search('制度')).resolves.toEqual(
      expect.objectContaining({
        total: 3,
      })
    );
    await expect(service.graph()).resolves.toEqual(
      expect.objectContaining({
        categories: expect.any(Array),
        nodes: expect.any(Array),
        links: expect.any(Array),
      })
    );
    await expect(service.qaList('入职')).resolves.toHaveLength(1);
    await expect(
      service.qaAdd({
        question: '如何入职',
        answer: '按制度执行',
        relatedKnowledgeIds: [401],
        relatedFileIds: [301],
      })
    ).resolves.toEqual(expect.objectContaining({ id: 601 }));
    await expect(service.delete([401])).resolves.toBeUndefined();
  });

  test('should reject non-hr access', async () => {
    const service = new PerformanceKnowledgeBaseService() as any;
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
    attachAccessContext(service);

    await expect(service.page({})).rejects.toThrow('无权限查看知识库列表');
    await expect(service.search('制度')).rejects.toThrow('无权限使用知识搜索');
    await expect(service.qaAdd({})).rejects.toThrow('无权限新增百问百答');
  });

  test('should reject invalid relations and duplicate kb no', async () => {
    const service = new PerformanceKnowledgeBaseService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:knowledgeBase:add',
        'performance:knowledgeBase:qaAdd',
      ]),
    };
    service.performanceKnowledgeBaseEntity = {
      findOne: jest.fn().mockResolvedValue({ id: 701, kbNo: 'KB-EXISTS' }),
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.performanceDocumentCenterEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };
    attachAccessContext(service);

    await expect(
      service.add({
        kbNo: 'KB-EXISTS',
        title: '重复知识',
        category: '制度',
        summary: '摘要',
        ownerName: '李老师',
      })
    ).rejects.toThrow('知识编号已存在');

    service.performanceKnowledgeBaseEntity.findOne.mockResolvedValue(null);

    await expect(
      service.add({
        kbNo: 'KB-NEW',
        title: '无效关联',
        category: '制度',
        summary: '摘要',
        ownerName: '李老师',
        relatedFileIds: [999],
      })
    ).rejects.toThrow('存在无效的关联文件');
  });

  test('should reject invalid knowledge payload and delete guards', async () => {
    const service = new PerformanceKnowledgeBaseService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        username: 'hr_admin',
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([
        'performance:knowledgeBase:add',
        'performance:knowledgeBase:update',
        'performance:knowledgeBase:delete',
      ]),
    };
    service.performanceKnowledgeBaseEntity = {
      create: jest.fn().mockImplementation(payload => payload),
      save: jest.fn(),
      findOne: jest.fn().mockResolvedValue(null),
      findOneBy: jest.fn().mockResolvedValue(null),
      findBy: jest.fn().mockResolvedValue([{ id: 401 }]),
    };
    service.performanceDocumentCenterEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.performanceKnowledgeQaEntity = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    attachAccessContext(service);

    await expect(
      service.add({
        title: '缺编号',
        category: '制度',
        summary: '摘要',
        ownerName: '李老师',
      })
    ).rejects.toThrow('知识编号不能为空');
    await expect(
      service.add({
        kbNo: 'KB-001',
        category: '制度',
        summary: '摘要',
        ownerName: '李老师',
      })
    ).rejects.toThrow('知识标题不能为空');
    await expect(
      service.add({
        kbNo: 'KB-001',
        title: '缺分类',
        summary: '摘要',
        ownerName: '李老师',
      })
    ).rejects.toThrow('知识分类不能为空');
    await expect(
      service.add({
        kbNo: 'KB-001',
        title: '缺摘要',
        category: '制度',
        ownerName: '李老师',
      })
    ).rejects.toThrow('知识摘要不能为空');
    await expect(
      service.add({
        kbNo: 'KB-001',
        title: '非法状态',
        category: '制度',
        summary: '摘要',
        ownerName: '李老师',
        status: 'closed',
      })
    ).rejects.toThrow('知识状态不合法');

    await expect(service.delete([])).rejects.toThrow('请选择需要删除的知识条目');
    service.performanceKnowledgeBaseEntity.findBy.mockResolvedValueOnce([]);
    await expect(service.delete([401, 402])).rejects.toThrow('部分知识条目不存在');
    await expect(service.updateKnowledge({ id: 0 })).rejects.toThrow('知识条目 ID 不合法');
    await expect(service.updateKnowledge({ id: 401 })).rejects.toThrow('知识条目不存在');
  });
});
