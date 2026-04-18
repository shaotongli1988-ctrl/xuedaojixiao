/**
 * 招聘面试主表实体。
 * 这里只承载主题8首批冻结的面试摘要字段，不负责简历池、面试评语全文或录用决策数据。
 * 维护重点是字段边界、状态默认值和单面试官模型必须与唯一事实源一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_interview')
export class PerformanceInterviewEntity extends BaseEntity {
  @Index()
  @Column({ comment: '候选人姓名', length: 100 })
  candidateName: string;

  @Column({ comment: '职位名称', length: 100 })
  position: string;

  @Index()
  @Column({ comment: '归属部门 ID', nullable: true })
  departmentId: number | null;

  @Index()
  @Column({ comment: '面试官 ID' })
  interviewerId: number;

  @Index()
  @Column({ comment: '面试时间', type: 'varchar', length: 19 })
  interviewDate: string;

  @Column({ comment: '面试类型', length: 20, nullable: true })
  interviewType: string | null;

  @Column({
    comment: '面试分数摘要',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  score: number | null;

  @Index()
  @Column({ comment: '面试状态', length: 20, default: 'scheduled' })
  status: string;
}
