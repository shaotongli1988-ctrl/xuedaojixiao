/**
 * 知识库百问百答元数据表。
 * 这里只承载主题21首批冻结的问答元数据，不负责 AI 问答生成、对话上下文和外部知识召回。
 * 维护重点是关联知识/文件 ID 只允许引用主题21正式表中的记录。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity } from 'typeorm';

@Entity('performance_knowledge_qa')
export class PerformanceKnowledgeQaEntity extends BaseEntity {
  @Column({ comment: '问题', length: 500 })
  question: string;

  @Column({ comment: '答案', type: 'text' })
  answer: string;

  @Column({ comment: '关联知识 ID JSON', type: 'text', nullable: true })
  relatedKnowledgeIds: string | null;

  @Column({ comment: '关联文件 ID JSON', type: 'text', nullable: true })
  relatedFileIds: string | null;
}
