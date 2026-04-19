/**
 * 招聘计划主表实体。
 * 这里只承载主题16冻结的招聘计划摘要字段，不负责简历池、面试、录用或审批流扩展。
 * 维护重点是状态集合、字段边界和招聘域联动保持最小化，避免主题16被扩成全流程中心。
 */
import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_recruit_plan')
export class PerformanceRecruitPlanEntity extends BaseEntity {
  @Index()
  @Column({ comment: '招聘计划标题', length: 200 })
  title: string;

  @Index()
  @Column({ comment: '目标部门 ID' })
  targetDepartmentId: number;

  @Column({ comment: '目标岗位名称', length: 100 })
  positionName: string;

  @Column({ comment: '计划招聘人数' })
  headcount: number;

  @Index()
  @Column({ comment: '计划开始日期', length: 10 })
  startDate: string;

  @Index()
  @Column({ comment: '计划结束日期', length: 10 })
  endDate: string;

  @Index()
  @Column({ comment: '招聘负责人 ID', nullable: true })
  recruiterId: number | null;

  @Column({ comment: '需求摘要', type: 'text', nullable: true })
  requirementSummary: string | null;

  @Index()
  @Column({ comment: '职位标准 ID', nullable: true })
  jobStandardId: number | null;

  @Column({
    comment: '职位标准轻量快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  jobStandardSnapshot: Record<string, any> | null;

  @Index()
  @Column({ comment: '招聘计划状态', length: 20, default: 'draft' })
  status: string;
}
