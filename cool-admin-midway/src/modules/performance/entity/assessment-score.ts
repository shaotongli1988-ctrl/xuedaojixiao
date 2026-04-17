import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 绩效评估评分明细。
 * 这里只保存评估单的评分项快照，不负责加权结果字段持久化。
 */
@Entity('performance_assessment_score')
export class PerformanceAssessmentScoreEntity extends BaseEntity {
  @Index()
  @Column({ comment: '关联评估单' })
  assessmentId: number;

  @Index()
  @Column({ comment: '关联指标', nullable: true })
  indicatorId: number;

  @Column({ comment: '指标名称快照', length: 100 })
  indicatorName: string;

  @Column({
    comment: '评分',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  score: number;

  @Column({
    comment: '权重快照',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  weight: number;

  @Column({ comment: '单项说明', length: 500, nullable: true })
  comment: string;
}
