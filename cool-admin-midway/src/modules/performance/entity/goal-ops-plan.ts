import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 目标运营台计划项主表。
 * 这里只承接周/月/日目标项与当天实际结果，不负责日报留痕和部门级配置。
 * 维护重点是 periodType/sourceType/status 语义必须稳定，且公共目标与个人补充目标必须可区分。
 */
@Entity('performance_goal_ops_plan')
@Index(['departmentId', 'periodType', 'planDate'])
@Index(['employeeId', 'periodType', 'planDate'])
export class PerformanceGoalOpsPlanEntity extends BaseEntity {
  @Column({ comment: '部门ID' })
  departmentId: number;

  @Column({ comment: '员工ID' })
  employeeId: number;

  @Index()
  @Column({ comment: '周期类型', length: 16 })
  periodType: string;

  @Index()
  @Column({ comment: '计划日期', type: 'varchar', length: 10, nullable: true })
  planDate: string | null;

  @Column({ comment: '周期开始日期', type: 'varchar', length: 10 })
  periodStartDate: string;

  @Column({ comment: '周期结束日期', type: 'varchar', length: 10 })
  periodEndDate: string;

  @Index()
  @Column({ comment: '目标来源', length: 16 })
  sourceType: string;

  @Column({ comment: '目标标题', length: 200 })
  title: string;

  @Column({ comment: '目标说明', type: 'text', nullable: true })
  description: string | null;

  @Column({
    comment: '目标值',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  targetValue: number;

  @Column({
    comment: '实际值',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  actualValue: number;

  @Column({ comment: '单位', length: 20, nullable: true })
  unit: string | null;

  @Index()
  @Column({ comment: '状态', length: 32, default: 'assigned' })
  status: string;

  @Column({ comment: '父级计划ID', nullable: true })
  parentPlanId: number | null;

  @Column({ comment: '是否系统生成', type: 'tinyint', default: 0 })
  isSystemGenerated: number;

  @Column({ comment: '下发人ID', nullable: true })
  assignedBy: number | null;

  @Column({ comment: '提交人ID', nullable: true })
  submittedBy: number | null;

  @Column({ comment: '提交时间', type: 'varchar', length: 19, nullable: true })
  submittedAt: string | null;

  @Column({ comment: '扩展JSON', type: 'text', nullable: true })
  extJson: string | null;
}
