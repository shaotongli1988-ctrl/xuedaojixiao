import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 培训课程主表。
 * 这里只承载主题 7 冻结的课程基础字段和状态，不负责报名明细、证书、试卷或 AI 训练扩展。
 */
@Entity('performance_course')
export class PerformanceCourseEntity extends BaseEntity {
  @Index()
  @Column({ comment: '课程标题', length: 200 })
  title: string;

  @Index('uk_performance_course_code', { unique: true })
  @Column({ comment: '课程编码', length: 100, nullable: true })
  code: string;

  @Index()
  @Column({ comment: '课程分类', length: 100, nullable: true })
  category: string;

  @Column({ comment: '课程描述', type: 'text', nullable: true })
  description: string;

  @Column({ comment: '开始日期', type: 'varchar', length: 10, nullable: true })
  startDate: string;

  @Column({ comment: '结束日期', type: 'varchar', length: 10, nullable: true })
  endDate: string;

  @Index()
  @Column({ comment: '课程状态', length: 20, default: 'draft' })
  status: string;
}
