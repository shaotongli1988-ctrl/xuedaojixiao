import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 课程报名摘要表。
 * 这里只服务主题 7 的报名列表只读摘要，不负责员工报名动作、成绩计算或证书发放。
 */
@Entity('performance_course_enrollment')
@Index('uk_performance_course_enrollment_course_user', ['courseId', 'userId'], {
  unique: true,
})
export class PerformanceCourseEnrollmentEntity extends BaseEntity {
  @Index()
  @Column({ comment: '课程 ID' })
  courseId: number;

  @Index()
  @Column({ comment: '学员 ID' })
  userId: number;

  @Index()
  @Column({
    comment: '报名时间',
    type: 'varchar',
    length: 19,
    nullable: true,
  })
  enrollTime: string;

  @Index()
  @Column({ comment: '报名状态摘要', length: 50, nullable: true })
  status: string;

  @Column({
    comment: '成绩摘要',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  score: number;
}
