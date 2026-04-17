/**
 * 文件职责：定义薪资主表实体和金额字段持久化结构。
 * 不负责调整记录明细、权限裁剪和金额变更动作。
 * 维护重点：`confirmed` 后金额只能通过调整记录链路变更。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 薪资主表。
 * 这里只承载薪资结果快照，不负责单次调整记录存储。
 */
@Entity('performance_salary')
@Index('idx_salary_employee_period', ['employeeId', 'periodValue'])
export class PerformanceSalaryEntity extends BaseEntity {
  @Index()
  @Column({ comment: '员工 ID' })
  employeeId: number;

  @Index()
  @Column({ comment: '关联评估单 ID', nullable: true })
  assessmentId: number;

  @Index()
  @Column({ comment: '期间', length: 30 })
  periodValue: string;

  @Column({
    comment: '基础薪资',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  baseSalary: number;

  @Column({
    comment: '绩效奖金',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  performanceBonus: number;

  @Column({
    comment: '调整金额',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  adjustAmount: number;

  @Column({
    comment: '最终金额',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  finalAmount: number;

  @Index()
  @Column({ comment: '绩效等级快照', length: 10, nullable: true })
  grade: string;

  @Index()
  @Column({ comment: '生效日期', type: 'varchar', length: 10, nullable: true })
  effectiveDate: string;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'draft' })
  status: string;
}
