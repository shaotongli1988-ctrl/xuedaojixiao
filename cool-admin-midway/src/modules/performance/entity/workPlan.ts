/**
 * 工作计划主表实体。
 * 这里只承载执行计划、负责人分配和来源审批快照，不负责真实审批流编排、工时填报或跨系统任务拆分。
 * 维护重点是执行状态与来源审批状态必须拆开维护，钉钉来源字段只做追踪与承接，不反向改写审批主数据。
 */
import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_work_plan')
export class PerformanceWorkPlanEntity extends BaseEntity {
  @Index('uk_performance_work_plan_no', { unique: true })
  @Column({ comment: '工作计划单号', length: 50 })
  workNo: string;

  @Index()
  @Column({ comment: '所属部门 ID' })
  ownerDepartmentId: number;

  @Index()
  @Column({ comment: '计划负责人 ID' })
  ownerId: number;

  @Column({ comment: '计划标题', length: 200 })
  title: string;

  @Column({ comment: '计划说明', type: 'text', nullable: true })
  description: string | null;

  @Column({
    comment: '协作执行人 ID 列表',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  assigneeIds: number[] | null;

  @Index()
  @Column({ comment: '优先级', length: 20, default: 'medium' })
  priority: string;

  @Column({ comment: '计划开始日期', type: 'varchar', length: 10, nullable: true })
  plannedStartDate: string | null;

  @Column({ comment: '计划结束日期', type: 'varchar', length: 10, nullable: true })
  plannedEndDate: string | null;

  @Column({ comment: '开始执行时间', type: 'varchar', length: 19, nullable: true })
  startedAt: string | null;

  @Column({ comment: '完成时间', type: 'varchar', length: 19, nullable: true })
  completedAt: string | null;

  @Index()
  @Column({ comment: '执行状态', length: 20, default: 'draft' })
  status: string;

  @Column({ comment: '进展摘要', type: 'text', nullable: true })
  progressSummary: string | null;

  @Column({ comment: '结果总结', type: 'text', nullable: true })
  resultSummary: string | null;

  @Index()
  @Column({ comment: '来源类型', length: 30, default: 'manual' })
  sourceType: string;

  @Column({ comment: '来源业务类型', length: 50, nullable: true })
  sourceBizType: string | null;

  @Column({ comment: '来源业务 ID', length: 100, nullable: true })
  sourceBizId: string | null;

  @Column({ comment: '来源标题快照', length: 200, nullable: true })
  sourceTitle: string | null;

  @Index()
  @Column({ comment: '来源审批状态', length: 20, default: 'none' })
  sourceStatus: string;

  @Index('uk_performance_work_plan_external_instance', { unique: true })
  @Column({ comment: '外部审批实例 ID', length: 100, nullable: true })
  externalInstanceId: string | null;

  @Column({ comment: '外部审批模板编码', length: 100, nullable: true })
  externalProcessCode: string | null;

  @Column({ comment: '来源审批完成时间', type: 'varchar', length: 19, nullable: true })
  approvalFinishedAt: string | null;

  @Column({
    comment: '来源审批轻量快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  sourceSnapshot: Record<string, any> | null;
}
