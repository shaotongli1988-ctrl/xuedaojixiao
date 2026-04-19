/**
 * 招聘简历池主表实体。
 * 这里只承载主题15冻结的简历全文与附件摘要引用字段，不负责附件二进制、下载地址签发或主题8/12全链编排。
 * 维护重点是状态集合、字段边界和下游关联仅允许摘要级快照，避免跨主题主数据耦合。
 */
import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_resume_pool')
export class PerformanceResumePoolEntity extends BaseEntity {
  @Index()
  @Column({ comment: '候选人姓名', length: 100 })
  candidateName: string;

  @Index()
  @Column({ comment: '目标部门 ID' })
  targetDepartmentId: number;

  @Column({ comment: '目标岗位', length: 100, nullable: true })
  targetPosition: string | null;

  @Column({ comment: '联系电话', length: 30 })
  phone: string;

  @Column({ comment: '联系邮箱', length: 100, nullable: true })
  email: string | null;

  @Column({ comment: '简历全文', type: 'text' })
  resumeText: string;

  @Index()
  @Column({ comment: '来源类型', length: 20 })
  sourceType: string;

  @Column({ comment: '来源补充说明', type: 'text', nullable: true })
  sourceRemark: string | null;

  @Column({ comment: '外部简历链接', length: 500, nullable: true })
  externalLink: string | null;

  @Column({
    comment: '附件 ID 列表（引用 space_info.id）',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  attachmentIdList: number[] | null;

  @Index()
  @Column({ comment: '简历状态', length: 20, default: 'new' })
  status: string;

  @Index()
  @Column({ comment: '关联人才资产 ID', nullable: true })
  linkedTalentAssetId: number | null;

  @Index()
  @Column({ comment: '最近发起面试 ID', nullable: true })
  latestInterviewId: number | null;

  @Index()
  @Column({ comment: '招聘计划 ID', nullable: true })
  recruitPlanId: number | null;

  @Index()
  @Column({ comment: '职位标准 ID', nullable: true })
  jobStandardId: number | null;

  @Column({
    comment: '招聘计划轻量快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  recruitPlanSnapshot: Record<string, any> | null;

  @Column({
    comment: '职位标准轻量快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  jobStandardSnapshot: Record<string, any> | null;
}
