import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 目标地图主表。
 * 这里只承载目标主信息和状态，不负责单次进度更新记录。
 */
@Entity('performance_goal')
export class PerformanceGoalEntity extends BaseEntity {
  @Index()
  @Column({ comment: '目标所属员工' })
  employeeId: number;

  @Index()
  @Column({ comment: '所属部门' })
  departmentId: number;

  @Index()
  @Column({ comment: '目标标题', length: 200 })
  title: string;

  @Column({ comment: '目标说明', length: 1000, nullable: true })
  description: string;

  @Column({
    comment: '目标值',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  targetValue: number;

  @Column({
    comment: '当前值',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  currentValue: number;

  @Column({ comment: '单位', length: 20, nullable: true })
  unit: string;

  @Column({
    comment: '权重',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  weight: number;

  @Index()
  @Column({ comment: '开始日期', type: 'varchar', length: 10 })
  startDate: string;

  @Index()
  @Column({ comment: '结束日期', type: 'varchar', length: 10 })
  endDate: string;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'draft' })
  status: string;
}
