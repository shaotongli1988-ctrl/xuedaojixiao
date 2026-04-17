import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 360 环评反馈记录表。
 * 这里只保存单个评价人的一次反馈结果，不负责任务汇总聚合和权限裁剪。
 */
@Entity('performance_feedback_record')
@Index('uk_feedback_record_task_user', ['taskId', 'feedbackUserId'], {
  unique: true,
})
export class PerformanceFeedbackRecordEntity extends BaseEntity {
  @Index()
  @Column({ comment: '关联任务' })
  taskId: number;

  @Index()
  @Column({ comment: '评价人' })
  feedbackUserId: number;

  @Column({ comment: '评价关系', length: 20 })
  relationType: string;

  @Column({
    comment: '评分',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  score: number;

  @Column({ comment: '反馈内容', type: 'text', nullable: true })
  content: string;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'draft' })
  status: string;

  @Index()
  @Column({
    comment: '提交时间',
    type: 'varchar',
    length: 19,
    nullable: true,
  })
  submitTime: string;
}
