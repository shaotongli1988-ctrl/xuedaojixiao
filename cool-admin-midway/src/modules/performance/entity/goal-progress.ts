import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 目标进度更新记录。
 * 这里只保存每次进度变更快照，不负责目标主状态聚合。
 */
@Entity('performance_goal_progress')
export class PerformanceGoalProgressEntity extends BaseEntity {
  @Index()
  @Column({ comment: '关联目标' })
  goalId: number;

  @Column({
    comment: '更新前值',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  beforeValue: number;

  @Column({
    comment: '更新后值',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  afterValue: number;

  @Column({ comment: '更新说明', length: 500, nullable: true })
  remark: string;

  @Index()
  @Column({ comment: '记录人' })
  operatorId: number;
}
