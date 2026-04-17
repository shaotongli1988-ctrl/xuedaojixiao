import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * PIP 主表。
 * 这里只承载改进计划主信息、来源和状态，不负责单次跟进记录明细。
 */
@Entity('performance_pip')
export class PerformancePipEntity extends BaseEntity {
  @Index()
  @Column({ comment: '来源评估单', nullable: true })
  assessmentId: number | null;

  @Index()
  @Column({ comment: '员工 ID' })
  employeeId: number;

  @Index()
  @Column({ comment: '负责人 ID' })
  ownerId: number;

  @Index()
  @Column({ comment: 'PIP 标题', length: 200 })
  title: string;

  @Column({ comment: '改进目标', type: 'text' })
  improvementGoal: string;

  @Column({ comment: '来源原因', type: 'text', nullable: true })
  sourceReason: string;

  @Index()
  @Column({ comment: '开始日期', type: 'varchar', length: 10 })
  startDate: string;

  @Index()
  @Column({ comment: '结束日期', type: 'varchar', length: 10 })
  endDate: string;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'draft' })
  status: string;

  @Column({ comment: '结果总结', type: 'text', nullable: true })
  resultSummary: string;
}
