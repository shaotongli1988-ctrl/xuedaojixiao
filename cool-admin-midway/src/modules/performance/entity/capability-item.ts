import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 能力项主表。
 * 这里只承载主题13冻结的能力项摘要，不负责能力评估原始记录或能力项维护工作流。
 */
@Entity('performance_capability_item')
export class PerformanceCapabilityItemEntity extends BaseEntity {
  @Index()
  @Column({ comment: '能力模型 ID' })
  modelId: number;

  @Index()
  @Column({ comment: '能力项名称', length: 200 })
  name: string;

  @Column({ comment: '能力等级摘要', length: 50, nullable: true })
  level: string | null;

  @Column({ comment: '能力项说明', type: 'text', nullable: true })
  description: string | null;

  @Column({ comment: '佐证提示摘要', type: 'text', nullable: true })
  evidenceHint: string | null;
}
