/**
 * 知识库条目主表。
 * 这里只承载主题21首批冻结的知识元数据，不负责正文全文、向量索引、模型推理或员工自助门户。
 * 维护重点是 relatedFileIds、relatedTopics 和状态边界必须与 knowledgeBase 冻结契约一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_knowledge_base')
export class PerformanceKnowledgeBaseEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '知识编号', length: 64 })
  kbNo: string;

  @Index()
  @Column({ comment: '标题', length: 200 })
  title: string;

  @Index()
  @Column({ comment: '分类', length: 64 })
  category: string;

  @Column({ comment: '摘要', type: 'text' })
  summary: string;

  @Column({ comment: '负责人', length: 100 })
  ownerName: string;

  @Index()
  @Column({ comment: '状态', length: 32, default: 'draft' })
  status: string;

  @Column({ comment: '标签 JSON', type: 'text', nullable: true })
  tags: string | null;

  @Column({ comment: '关联文件 ID JSON', type: 'text', nullable: true })
  relatedFileIds: string | null;

  @Column({ comment: '关联主题 JSON', type: 'text', nullable: true })
  relatedTopics: string | null;

  @Column({ comment: '重要度', type: 'int', default: 70 })
  importance: number;

  @Column({ comment: '查看次数', type: 'int', default: 0 })
  viewCount: number;
}
