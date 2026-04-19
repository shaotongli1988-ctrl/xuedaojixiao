/**
 * 班主任资源主数据实体。
 * 这里只承载主题19冻结的班主任资源摘要字段，不负责代理体系、绩效、结算、附件或外部通知链路。
 * 维护重点是合作状态、归属字段和跟进时间边界必须与服务端状态机保持一致。
 */
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity, transformerJson } from '../../base/entity/base';

@Entity('performance_teacher_info')
export class PerformanceTeacherInfoEntity extends BaseEntity {
  @Index()
  @Column({ comment: '班主任姓名', length: 100 })
  teacherName: string;

  @Column({ comment: '联系电话', length: 20, nullable: true })
  phone: string | null;

  @Column({ comment: '微信号', length: 50, nullable: true })
  wechat: string | null;

  @Index()
  @Column({ comment: '学校名称', length: 100, nullable: true })
  schoolName: string | null;

  @Column({ comment: '学校区域', length: 100, nullable: true })
  schoolRegion: string | null;

  @Column({ comment: '学校类型', length: 100, nullable: true })
  schoolType: string | null;

  @Column({ comment: '年级', length: 50, nullable: true })
  grade: string | null;

  @Column({ comment: '当前班级名', length: 100, nullable: true })
  className: string | null;

  @Column({ comment: '科目', length: 50, nullable: true })
  subject: string | null;

  @Column({
    comment: '项目标签',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  projectTags: string[] | null;

  @Column({ comment: '意向等级', length: 30, nullable: true })
  intentionLevel: string | null;

  @Column({ comment: '沟通风格', length: 50, nullable: true })
  communicationStyle: string | null;

  @Index()
  @Column({ comment: '合作状态', length: 20, default: 'uncontacted' })
  cooperationStatus: string;

  @Index()
  @Column({ comment: '归属员工 ID' })
  ownerEmployeeId: number;

  @Index()
  @Column({ comment: '归属部门 ID' })
  ownerDepartmentId: number;

  @Index()
  @Column({ comment: '最近跟进时间', type: 'varchar', length: 19, nullable: true })
  lastFollowTime: string | null;

  @Index()
  @Column({ comment: '下次跟进时间', type: 'varchar', length: 19, nullable: true })
  nextFollowTime: string | null;

  @Index()
  @Column({ comment: '合作达成时间', type: 'varchar', length: 19, nullable: true })
  cooperationTime: string | null;
}
