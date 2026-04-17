import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 绩效评估主表。
 * 这里只承载评估单核心状态与主信息，不负责评分明细的明细行存储。
 */
@Entity('performance_assessment')
export class PerformanceAssessmentEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '评估单编号', length: 50 })
  code: string;

  @Index()
  @Column({ comment: '被考核人' })
  employeeId: number;

  @Index()
  @Column({ comment: '评估负责人' })
  assessorId: number;

  @Index()
  @Column({ comment: '所属部门' })
  departmentId: number;

  @Column({ comment: '周期类型', length: 20, default: 'quarter' })
  periodType: string;

  @Index()
  @Column({ comment: '周期值', length: 30 })
  periodValue: string;

  @Column({
    comment: '目标完成率',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  targetCompletion: number;

  @Column({
    comment: '总分',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  totalScore: number;

  @Index()
  @Column({ comment: '等级', length: 10, nullable: true })
  grade: string;

  @Column({ comment: '员工自评', type: 'text', nullable: true })
  selfEvaluation: string;

  @Column({ comment: '经理反馈', type: 'text', nullable: true })
  managerFeedback: string;

  @Index()
  @Column({ comment: '提交时间', type: 'varchar', length: 19, nullable: true })
  submitTime: string;

  @Index()
  @Column({ comment: '审批时间', type: 'varchar', length: 19, nullable: true })
  approveTime: string;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'draft' })
  status: string;
}
