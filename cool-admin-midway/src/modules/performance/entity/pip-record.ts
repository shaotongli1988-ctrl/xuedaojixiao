import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * PIP 跟进记录表。
 * 这里只保存每次跟进快照和记录人，不负责主单状态聚合。
 */
@Entity('performance_pip_record')
export class PerformancePipRecordEntity extends BaseEntity {
  @Index()
  @Column({ comment: '关联 PIP ID' })
  pipId: number;

  @Index()
  @Column({ comment: '跟进日期', type: 'varchar', length: 10 })
  recordDate: string;

  @Column({ comment: '跟进内容', type: 'text' })
  progress: string;

  @Column({ comment: '下一步计划', type: 'text', nullable: true })
  nextPlan: string;

  @Index()
  @Column({ comment: '记录人 ID' })
  operatorId: number;
}
