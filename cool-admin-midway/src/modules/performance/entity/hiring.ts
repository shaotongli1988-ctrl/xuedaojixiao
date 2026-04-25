/**
 * 录用管理主表实体。
 * 这里只承载主题18冻结的录用决策字段与来源快照，不负责简历全文、联系方式全文、附件全文或面试评语全文。
 * 维护重点是状态集合、终态锁定字段和跨主题仅引用不改写约束必须与冻结事实源一致。
 */
import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_hiring')
export class PerformanceHiringEntity extends BaseEntity {
  @Index()
  @Column({ comment: '候选人姓名', length: 100 })
  candidateName: string;

  @Index()
  @Column({ comment: '目标部门 ID' })
  targetDepartmentId: number;

  @Column({ comment: '目标岗位', length: 100, nullable: true })
  targetPosition: string | null;

  @Column({ comment: '录用决策正文', type: 'text', nullable: true })
  decisionContent: string | null;

  @Index()
  @Column({ comment: '来源类型', length: 30, nullable: true })
  sourceType: string | null;

  @Index()
  @Column({ comment: '来源主键 ID', nullable: true })
  sourceId: number | null;

  @Column({ comment: '面试 ID', nullable: true })
  interviewId: number | null;

  @Column({ comment: '简历池 ID', nullable: true })
  resumePoolId: number | null;

  @Column({ comment: '招聘计划 ID', nullable: true })
  recruitPlanId: number | null;

  @Column({
    comment: '来源快照（仅引用快照，不回写来源主数据）',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  sourceSnapshot: Record<string, any> | string | null;

  @Column({
    comment: '面试轻量快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  interviewSnapshot: Record<string, any> | null;

  @Column({
    comment: '简历池轻量快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  resumePoolSnapshot: Record<string, any> | null;

  @Column({
    comment: '招聘计划轻量快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  recruitPlanSnapshot: Record<string, any> | null;

  @Index()
  @Column({ comment: '录用状态', length: 20, default: 'offered' })
  status: string;

  @Index()
  @Column({ comment: '发出录用时间', type: 'varchar', length: 19, nullable: true })
  offeredAt: string | null;

  @Index()
  @Column({ comment: '接受录用时间', type: 'varchar', length: 19, nullable: true })
  acceptedAt: string | null;

  @Index()
  @Column({ comment: '拒绝录用时间', type: 'varchar', length: 19, nullable: true })
  rejectedAt: string | null;

  @Index()
  @Column({ comment: '关闭录用时间', type: 'varchar', length: 19, nullable: true })
  closedAt: string | null;

  @Column({ comment: '关闭原因', type: 'text', nullable: true })
  closeReason: string | null;
}
