/**
 * 知识库领域服务。
 * 这里只负责主题21冻结的知识条目、图谱、搜索和百问百答元数据，不负责正文全文、向量检索或 AI 答案生成。
 * 维护重点是 relatedFileIds 与 QA 关联必须引用正式表，且 graph/search/qaList/qaAdd 权限不能漂移。
 */
import {
  App,
  ASYNC_CONTEXT_KEY,
  ASYNC_CONTEXT_MANAGER_KEY,
  AsyncContextManager,
  IMidwayApplication,
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceDocumentCenterEntity } from '../entity/documentCenter';
import { PerformanceKnowledgeBaseEntity } from '../entity/knowledgeBase';
import { PerformanceKnowledgeQaEntity } from '../entity/knowledgeQa';
import * as jwt from 'jsonwebtoken';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

const KNOWLEDGE_STATUS = ['draft', 'published', 'archived'];

function normalizePageNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeImportance(value: any, fallback = 70) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    return fallback;
  }
  return parsed;
}

function parseStringArray(value: any) {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => String(item || '').trim())
          .filter(Boolean);
      }
    } catch (error) {}

    return trimmed
      .split(/[,\n，]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseNumberArray(value: any) {
  return parseStringArray(value)
    .map(item => Number(item))
    .filter(item => Number.isInteger(item) && item > 0);
}

function serializeArray(value: any) {
  const normalized = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? parseStringArray(value)
      : [];
  return normalized.length ? JSON.stringify(normalized) : null;
}

function deserializeStringArray(value: any) {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parseStringArray(parsed) : [];
  } catch (error) {
    return parseStringArray(String(value));
  }
}

function deserializeNumberArray(value: any) {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parseNumberArray(parsed) : [];
  } catch (error) {
    return parseNumberArray(String(value));
  }
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceKnowledgeBaseService extends BaseService {
  @InjectEntityModel(PerformanceKnowledgeBaseEntity)
  performanceKnowledgeBaseEntity: Repository<PerformanceKnowledgeBaseEntity>;

  @InjectEntityModel(PerformanceKnowledgeQaEntity)
  performanceKnowledgeQaEntity: Repository<PerformanceKnowledgeQaEntity>;

  @InjectEntityModel(PerformanceDocumentCenterEntity)
  performanceDocumentCenterEntity: Repository<PerformanceDocumentCenterEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:knowledgeBase:page',
    stats: 'performance:knowledgeBase:stats',
    add: 'performance:knowledgeBase:add',
    update: 'performance:knowledgeBase:update',
    delete: 'performance:knowledgeBase:delete',
    graph: 'performance:knowledgeBase:graph',
    search: 'performance:knowledgeBase:search',
    qaList: 'performance:knowledgeBase:qaList',
    qaAdd: 'performance:knowledgeBase:qaAdd',
  };

  private get currentCtx() {
    if (this.ctx?.admin) {
      return this.ctx;
    }
    try {
      const contextManager: AsyncContextManager = this.app
        .getApplicationContext()
        .get(ASYNC_CONTEXT_MANAGER_KEY);
      return contextManager.active().getValue(ASYNC_CONTEXT_KEY) as any;
    } catch (error) {
      return this.ctx;
    }
  }

  private get currentAdmin() {
    if (this.currentCtx?.admin) {
      return this.currentCtx.admin;
    }
    const token =
      this.currentCtx?.get?.('Authorization') ||
      this.currentCtx?.headers?.authorization;
    if (!token) {
      return undefined;
    }
    try {
      return jwt.verify(token, resolveBaseJwtConfig(this.app).secret);
    } catch (error) {
      return undefined;
    }
  }

  async page(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.page, '无权限查看知识库列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const qb = this.buildKnowledgeQuery(query);

    const total = await qb.getCount();
    const list = await qb
      .orderBy('knowledge.updateTime', 'DESC')
      .offset((page - 1) * size)
      .limit(size)
      .getMany();

    return {
      list: list.map(item => this.normalizeKnowledge(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async stats(query: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.stats, '无权限查看知识统计');

    const baseQb = this.buildKnowledgeQuery(query);
    const list = await baseQb.clone().getMany();
    const publishedCount = list.filter(item => item.status === 'published').length;
    const draftCount = list.filter(item => item.status === 'draft').length;
    const fileLinkedCount = list.filter(
      item => deserializeNumberArray(item.relatedFileIds).length > 0
    ).length;
    const totalImportance = list.reduce(
      (sum, item) => sum + normalizeImportance(item.importance, 0),
      0
    );
    const topicSet = new Set<string>();
    for (const item of list) {
      for (const topic of deserializeStringArray(item.relatedTopics)) {
        topicSet.add(topic);
      }
    }

    return {
      total: list.length,
      publishedCount,
      draftCount,
      fileLinkedCount,
      avgImportance: list.length
        ? Number((totalImportance / list.length).toFixed(2))
        : 0,
      topicCount: topicSet.size,
    };
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.add, '无权限新增知识条目');

    const normalized = await this.normalizeKnowledgePayload(payload, 'add');
    const saved = await this.performanceKnowledgeBaseEntity.save(
      this.performanceKnowledgeBaseEntity.create(normalized)
    );
    const item = await this.requireKnowledge(saved.id);
    return this.normalizeKnowledge(item);
  }

  async updateKnowledge(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.update, '无权限更新知识条目');

    const current = await this.requireKnowledge(Number(payload.id));
    const normalized = await this.normalizeKnowledgePayload(
      {
        ...current,
        ...payload,
      },
      'update',
      current.id
    );

    await this.performanceKnowledgeBaseEntity.update({ id: current.id }, normalized);
    const item = await this.requireKnowledge(current.id);
    return this.normalizeKnowledge(item);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.delete, '无权限删除知识条目');

    const validIds = (ids || [])
      .map(item => Number(item))
      .filter(item => Number.isInteger(item) && item > 0);

    if (!validIds.length) {
      throw new CoolCommException('请选择需要删除的知识条目');
    }

    const list = await this.performanceKnowledgeBaseEntity.findBy({
      id: In(validIds),
    });
    if (list.length !== validIds.length) {
      throw new CoolCommException('部分知识条目不存在');
    }

    await this.performanceKnowledgeBaseEntity.delete(validIds);
    await this.cleanupQaRelations(validIds);
  }

  async graph() {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.graph, '无权限查看知识图谱');

    const [knowledgeRows, documentRows] = await Promise.all([
      this.performanceKnowledgeBaseEntity.find(),
      this.performanceDocumentCenterEntity.find(),
    ]);

    const fileMap = new Map(
      documentRows.map(item => [item.id, item.fileName])
    );
    const nodes: Array<{
      id: string;
      name: string;
      category: string;
      symbolSize?: number;
    }> = [];
    const links: Array<{ source: string; target: string; value?: number }> = [];
    const nodeIds = new Set<string>();

    const pushNode = (id: string, name: string, category: string, symbolSize?: number) => {
      if (nodeIds.has(id)) {
        return;
      }
      nodeIds.add(id);
      nodes.push({ id, name, category, symbolSize });
    };

    for (const item of knowledgeRows) {
      const knowledge = this.normalizeKnowledge(item);
      const knowledgeNodeId = `kb-${knowledge.id}`;
      pushNode(
        knowledgeNodeId,
        knowledge.title,
        'knowledge',
        Math.max(32, Math.min(knowledge.importance + 20, 100))
      );

      const categoryNodeId = `category-${knowledge.category}`;
      pushNode(categoryNodeId, knowledge.category, 'category', 44);
      links.push({ source: knowledgeNodeId, target: categoryNodeId, value: 1 });

      for (const tag of knowledge.tags) {
        const tagNodeId = `tag-${tag}`;
        pushNode(tagNodeId, tag, 'tag', 40);
        links.push({ source: knowledgeNodeId, target: tagNodeId, value: 1 });
      }

      for (const fileId of knowledge.relatedFileIds) {
        const fileNodeId = `file-${fileId}`;
        pushNode(fileNodeId, fileMap.get(fileId) || `文件#${fileId}`, 'file', 40);
        links.push({ source: knowledgeNodeId, target: fileNodeId, value: 1 });
      }
    }

    return {
      nodes,
      links,
      categories: [
        { name: 'knowledge' },
        { name: 'category' },
        { name: 'tag' },
        { name: 'file' },
      ],
    };
  }

  async search(keyword: string) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.search, '无权限使用知识搜索');

    const trimmedKeyword = String(keyword || '').trim();
    if (!trimmedKeyword) {
      return {
        keyword: '',
        knowledge: [],
        files: [],
        qas: [],
        total: 0,
      };
    }

    const likeKeyword = `%${trimmedKeyword}%`;
    const [knowledge, files, qas] = await Promise.all([
      this.performanceKnowledgeBaseEntity
        .createQueryBuilder('knowledge')
        .where(
          new Brackets(where => {
            where
              .where('knowledge.kbNo LIKE :keyword', { keyword: likeKeyword })
              .orWhere('knowledge.title LIKE :keyword', { keyword: likeKeyword })
              .orWhere('knowledge.category LIKE :keyword', { keyword: likeKeyword })
              .orWhere('knowledge.summary LIKE :keyword', { keyword: likeKeyword })
              .orWhere('knowledge.tags LIKE :keyword', { keyword: likeKeyword })
              .orWhere('knowledge.relatedTopics LIKE :keyword', {
                keyword: likeKeyword,
              });
          })
        )
        .orderBy('knowledge.updateTime', 'DESC')
        .limit(20)
        .getMany(),
      this.performanceDocumentCenterEntity
        .createQueryBuilder('document')
        .where(
          new Brackets(where => {
            where
              .where('document.fileNo LIKE :keyword', { keyword: likeKeyword })
              .orWhere('document.fileName LIKE :keyword', { keyword: likeKeyword })
              .orWhere('document.ownerName LIKE :keyword', { keyword: likeKeyword })
              .orWhere('document.department LIKE :keyword', { keyword: likeKeyword })
              .orWhere('document.tags LIKE :keyword', { keyword: likeKeyword })
              .orWhere('document.notes LIKE :keyword', { keyword: likeKeyword });
          })
        )
        .orderBy('document.updateTime', 'DESC')
        .limit(20)
        .getMany(),
      this.performanceKnowledgeQaEntity
        .createQueryBuilder('qa')
        .where(
          new Brackets(where => {
            where
              .where('qa.question LIKE :keyword', { keyword: likeKeyword })
              .orWhere('qa.answer LIKE :keyword', { keyword: likeKeyword });
          })
        )
        .orderBy('qa.updateTime', 'DESC')
        .limit(20)
        .getMany(),
    ]);

    return {
      keyword: trimmedKeyword,
      knowledge: knowledge.map(item => this.normalizeKnowledge(item)),
      files: files.map(item => ({
        id: item.id,
        fileNo: item.fileNo,
        fileName: item.fileName,
        category: item.category,
        fileType: item.fileType,
        storage: item.storage,
        confidentiality: item.confidentiality,
        ownerName: item.ownerName,
        department: item.department,
        status: item.status,
        version: item.version,
        sizeMb: Number(item.sizeMb || 0),
        downloadCount: Number(item.downloadCount || 0),
        expireDate: item.expireDate || null,
        tags: deserializeStringArray(item.tags),
        notes: item.notes || null,
        createTime: item.createTime,
        updateTime: item.updateTime,
      })),
      qas: qas.map(item => this.normalizeQa(item)),
      total: knowledge.length + files.length + qas.length,
    };
  }

  async qaList(keyword?: string) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.qaList, '无权限查看百问百答');

    const trimmedKeyword = String(keyword || '').trim();
    const qb = this.performanceKnowledgeQaEntity.createQueryBuilder('qa');
    if (trimmedKeyword) {
      const likeKeyword = `%${trimmedKeyword}%`;
      qb.where(
        new Brackets(where => {
          where
            .where('qa.question LIKE :keyword', { keyword: likeKeyword })
            .orWhere('qa.answer LIKE :keyword', { keyword: likeKeyword });
        })
      );
    }
    const rows = await qb.orderBy('qa.updateTime', 'DESC').getMany();
    return rows.map(item => this.normalizeQa(item));
  }

  async qaAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertHasPerm(perms, this.perms.qaAdd, '无权限新增百问百答');

    const normalized = await this.normalizeQaPayload(payload);
    const saved = await this.performanceKnowledgeQaEntity.save(
      this.performanceKnowledgeQaEntity.create(normalized)
    );
    const item = await this.performanceKnowledgeQaEntity.findOneBy({ id: saved.id });
    return this.normalizeQa(item);
  }

  private buildKnowledgeQuery(query: any) {
    const qb = this.performanceKnowledgeBaseEntity.createQueryBuilder('knowledge');
    if (query.status) {
      qb.andWhere('knowledge.status = :status', {
        status: String(query.status).trim(),
      });
    }
    if (query.category) {
      qb.andWhere('knowledge.category = :category', {
        category: String(query.category).trim(),
      });
    }
    if (query.tag) {
      const tag = `%${String(query.tag).trim()}%`;
      qb.andWhere('knowledge.tags LIKE :tag', { tag });
    }
    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('knowledge.kbNo LIKE :keyword', { keyword })
            .orWhere('knowledge.title LIKE :keyword', { keyword })
            .orWhere('knowledge.category LIKE :keyword', { keyword })
            .orWhere('knowledge.summary LIKE :keyword', { keyword })
            .orWhere('knowledge.tags LIKE :keyword', { keyword })
            .orWhere('knowledge.relatedTopics LIKE :keyword', { keyword });
        })
      );
    }
    return qb;
  }

  private async currentPerms() {
    const admin = this.currentAdmin as any;
    if (!admin?.roleIds?.length) {
      return [];
    }
    return this.baseSysMenuService.getPerms(admin.roleIds);
  }

  private assertHasPerm(perms: string[], perm: string, message: string) {
    if (!perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }

  private async requireKnowledge(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new CoolCommException('知识条目 ID 不合法');
    }
    const item = await this.performanceKnowledgeBaseEntity.findOneBy({ id });
    if (!item) {
      throw new CoolCommException('知识条目不存在');
    }
    return item;
  }

  private async normalizeKnowledgePayload(
    payload: any,
    mode: 'add' | 'update',
    currentId?: number
  ) {
    const kbNo = String(payload.kbNo || payload.kb_no || '').trim();
    const title = String(payload.title || '').trim();
    const category = String(payload.category || '').trim();
    const summary = String(payload.summary || '').trim();
    const ownerName = String(payload.ownerName || payload.owner_name || '').trim();
    const status = String(payload.status || 'draft').trim();
    const importance = normalizeImportance(payload.importance, 70);
    const viewCount = normalizePageNumber(payload.viewCount ?? payload.view_count, 0);
    const tags = parseStringArray(payload.tags);
    const relatedTopics = parseStringArray(payload.relatedTopics ?? payload.related_topics);
    const relatedFileIds = parseNumberArray(
      payload.relatedFileIds ?? payload.relatedFiles ?? payload.related_files
    );

    if (!kbNo) {
      throw new CoolCommException('知识编号不能为空');
    }
    if (!title) {
      throw new CoolCommException('知识标题不能为空');
    }
    if (!category) {
      throw new CoolCommException('知识分类不能为空');
    }
    if (!summary) {
      throw new CoolCommException('知识摘要不能为空');
    }
    if (!ownerName) {
      throw new CoolCommException('负责人不能为空');
    }
    if (!KNOWLEDGE_STATUS.includes(status)) {
      throw new CoolCommException('知识状态不合法');
    }

    const duplicate = await this.performanceKnowledgeBaseEntity.findOne({
      where: { kbNo },
    });
    if (duplicate && duplicate.id !== currentId) {
      throw new CoolCommException('知识编号已存在');
    }

    if (relatedFileIds.length) {
      const relatedFiles = await this.performanceDocumentCenterEntity.findBy({
        id: In(relatedFileIds),
      });
      if (relatedFiles.length !== relatedFileIds.length) {
        throw new CoolCommException('存在无效的关联文件');
      }
    }

    return {
      kbNo,
      title,
      category,
      summary,
      ownerName,
      status,
      tags: serializeArray(tags),
      relatedFileIds: serializeArray(relatedFileIds),
      relatedTopics: serializeArray(relatedTopics),
      importance,
      viewCount,
    };
  }

  private async normalizeQaPayload(payload: any) {
    const question = String(payload.question || '').trim();
    const answer = String(payload.answer || '').trim();
    const relatedKnowledgeIds = parseNumberArray(
      payload.relatedKnowledgeIds ?? payload.related_knowledge_ids
    );
    const relatedFileIds = parseNumberArray(
      payload.relatedFileIds ?? payload.related_file_ids
    );

    if (!question) {
      throw new CoolCommException('问题不能为空');
    }
    if (!answer) {
      throw new CoolCommException('答案不能为空');
    }

    if (relatedKnowledgeIds.length) {
      const rows = await this.performanceKnowledgeBaseEntity.findBy({
        id: In(relatedKnowledgeIds),
      });
      if (rows.length !== relatedKnowledgeIds.length) {
        throw new CoolCommException('存在无效的关联知识条目');
      }
    }

    if (relatedFileIds.length) {
      const rows = await this.performanceDocumentCenterEntity.findBy({
        id: In(relatedFileIds),
      });
      if (rows.length !== relatedFileIds.length) {
        throw new CoolCommException('存在无效的关联文件');
      }
    }

    return {
      question,
      answer,
      relatedKnowledgeIds: serializeArray(relatedKnowledgeIds),
      relatedFileIds: serializeArray(relatedFileIds),
    };
  }

  private normalizeKnowledge(item: PerformanceKnowledgeBaseEntity) {
    return {
      id: item.id,
      kbNo: item.kbNo,
      title: item.title,
      category: item.category,
      summary: item.summary,
      ownerName: item.ownerName,
      status: item.status,
      tags: deserializeStringArray(item.tags),
      relatedFileIds: deserializeNumberArray(item.relatedFileIds),
      relatedTopics: deserializeStringArray(item.relatedTopics),
      importance: normalizeImportance(item.importance, 70),
      viewCount: Number(item.viewCount || 0),
      createTime: item.createTime,
      updateTime: item.updateTime,
    };
  }

  private normalizeQa(item: PerformanceKnowledgeQaEntity | null) {
    if (!item) {
      return null;
    }
    return {
      id: item.id,
      question: item.question,
      answer: item.answer,
      relatedKnowledgeIds: deserializeNumberArray(item.relatedKnowledgeIds),
      relatedFileIds: deserializeNumberArray(item.relatedFileIds),
      createTime: item.createTime,
      updateTime: item.updateTime,
    };
  }

  private async cleanupQaRelations(deletedKnowledgeIds: number[]) {
    const qaRows = await this.performanceKnowledgeQaEntity.find();
    for (const row of qaRows) {
      const nextKnowledgeIds = deserializeNumberArray(row.relatedKnowledgeIds).filter(
        item => !deletedKnowledgeIds.includes(item)
      );
      if (nextKnowledgeIds.length === deserializeNumberArray(row.relatedKnowledgeIds).length) {
        continue;
      }
      await this.performanceKnowledgeQaEntity.update(
        { id: row.id },
        {
          relatedKnowledgeIds: serializeArray(nextKnowledgeIds),
        }
      );
    }
  }
}
