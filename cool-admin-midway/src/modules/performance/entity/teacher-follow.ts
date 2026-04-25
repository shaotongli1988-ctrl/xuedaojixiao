/**
 * 班主任跟进记录实体。
 * 这里只记录主题19首批最小时间线，不负责附件、截图原件、外部提醒或自动化编排。
 * 维护重点是首次跟进推动资源从 uncontacted 进入 contacted，且 nextFollowTime 仅作为待办派生依据。
 */
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

@Entity('performance_teacher_follow')
export class PerformanceTeacherFollowEntity extends BaseEntity {
  @Index()
  @Column({ comment: '班主任资源 ID' })
  teacherId: number;

  @Index()
  @Column({ comment: '跟进时间', type: 'varchar', length: 19 })
  followTime: string;

  @Index()
  @Column({ comment: '下次跟进时间', type: 'varchar', length: 19, nullable: true })
  nextFollowTime: string | null;

  @Column({ comment: '跟进方式', length: 50, nullable: true })
  followMethod: string | null;

  @Column({ comment: '跟进内容', type: 'text' })
  followContent: string;

  @Index()
  @Column({ comment: '跟进人 ID' })
  creatorEmployeeId: number;

  @Column({ comment: '跟进人姓名', length: 100 })
  creatorEmployeeName: string;
}
