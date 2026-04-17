import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 360 环评任务主表。
 * 这里只承载任务主信息、截止时间和发起人，不负责单条反馈记录内容。
 */
@Entity('performance_feedback_task')
export class PerformanceFeedbackTaskEntity extends BaseEntity {
  @Index()
  @Column({ comment: '关联评估单' })
  assessmentId: number;

  @Index()
  @Column({ comment: '被评价人' })
  employeeId: number;

  @Column({ comment: '任务标题', length: 200 })
  title: string;

  @Index()
  @Column({
    comment: '截止时间',
    type: 'varchar',
    length: 19,
    nullable: true,
  })
  deadline: string;

  @Index()
  @Column({ comment: '发起人' })
  creatorId: number;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'draft' })
  status: string;
}
