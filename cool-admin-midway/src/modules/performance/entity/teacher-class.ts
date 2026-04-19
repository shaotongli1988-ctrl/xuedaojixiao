/**
 * 班主任合作班级实体。
 * 这里只承载主题19冻结的班级摘要字段，不负责报名转化、绩效明细、结算或合同附件。
 * 维护重点是 partnered 才可建班、closed 终态锁定，以及 owner 快照必须跟随资源归属更新。
 */
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

@Entity('performance_teacher_class')
export class PerformanceTeacherClassEntity extends BaseEntity {
  @Index()
  @Column({ comment: '班主任资源 ID' })
  teacherId: number;

  @Column({ comment: '班主任姓名快照', length: 100 })
  teacherName: string;

  @Column({ comment: '班级名称', length: 100 })
  className: string;

  @Column({ comment: '学校名称快照', length: 100, nullable: true })
  schoolName: string | null;

  @Column({ comment: '年级快照', length: 50, nullable: true })
  grade: string | null;

  @Column({ comment: '项目标签', length: 50, nullable: true })
  projectTag: string | null;

  @Column({ comment: '学员人数', default: 0 })
  studentCount: number;

  @Index()
  @Column({ comment: '班级状态', length: 20, default: 'draft' })
  status: string;

  @Index()
  @Column({ comment: '归属员工 ID' })
  ownerEmployeeId: number;

  @Index()
  @Column({ comment: '归属部门 ID' })
  ownerDepartmentId: number;
}
