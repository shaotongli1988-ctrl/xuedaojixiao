import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 课程考试结果摘要表。
 * 这里只承载主题14课程学习闭环的结果摘要，不负责试卷、题目、改分、补考或独立考试能力。
 */
@Entity('performance_course_exam')
@Index('uk_performance_course_exam_scope', ['courseId', 'userId'], {
  unique: true,
})
export class PerformanceCourseExamResultEntity extends BaseEntity {
  @Index()
  @Column({ comment: '课程 ID' })
  courseId: number;

  @Index()
  @Column({ comment: '员工 ID', name: 'employeeId' })
  userId: number;

  @Column({ comment: '课程标题快照', length: 200 })
  courseTitle: string;

  @Index()
  @Column({ comment: '结果状态', length: 20, default: 'locked' })
  resultStatus: string;

  @Column({
    comment: '最近一次结果分数摘要',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  latestScore: number;

  @Column({
    comment: '通过阈值摘要',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  passThreshold: number;

  @Column({ comment: '结果摘要文案', type: 'text', nullable: true })
  summaryText: string;

  @Column({ comment: '最近更新时间', type: 'varchar', length: 19, nullable: true })
  updatedAt: string;
}
