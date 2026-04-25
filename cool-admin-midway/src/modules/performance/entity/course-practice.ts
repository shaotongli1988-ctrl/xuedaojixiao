import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

/**
 * 课程练习任务表。
 * 这里只承载主题14员工本人练习任务摘要与文本提交，不负责课程主链、证书或能力地图数据。
 */
@Entity('performance_course_practice')
@Index('idx_performance_course_practice_course_user', ['courseId', 'userId'])
export class PerformanceCoursePracticeEntity extends BaseEntity {
  @Index()
  @Column({ comment: '课程 ID' })
  courseId: number;

  @Index()
  @Column({ comment: '员工 ID', name: 'employeeId' })
  userId: number;

  @Column({ comment: '课程标题快照', length: 200, nullable: true })
  courseTitle: string;

  @Column({ comment: '任务标题', length: 200 })
  title: string;

  @Column({ comment: '任务内容摘要', type: 'text', nullable: true })
  promptText: string;

  @Column({ comment: '员工文本提交内容', type: 'text', nullable: true })
  submissionText: string;

  @Index()
  @Column({ comment: '任务状态', length: 20, default: 'pending' })
  status: string;

  @Column({
    comment: '最近一次结果分数摘要',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  latestScore: number;

  @Column({ comment: '结果摘要', type: 'text', nullable: true })
  feedbackSummary: string;

  @Index()
  @Column({
    comment: '最近一次提交时间',
    type: 'varchar',
    length: 19,
    nullable: true,
  })
  submittedAt: string;

  @Index()
  @Column({
    comment: '最近一次评估时间',
    type: 'varchar',
    length: 19,
    nullable: true,
  })
  evaluatedAt: string;
}
