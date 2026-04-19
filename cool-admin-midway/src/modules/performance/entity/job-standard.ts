/**
 * 职位标准主表实体。
 * 这里只承载主题17冻结的职位标准摘要字段，不负责招聘计划、简历、面试结果、录用决策或设计器配置对象。
 * 维护重点是字段边界、状态默认值和目标部门归属必须与主题17冻结事实源一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_job_standard')
export class PerformanceJobStandardEntity extends BaseEntity {
  @Index()
  @Column({ comment: '岗位名称', length: 100 })
  positionName: string;

  @Index()
  @Column({ comment: '目标部门 ID' })
  targetDepartmentId: number;

  @Column({ comment: '岗位级别摘要', length: 100, nullable: true })
  jobLevel: string | null;

  @Column({ comment: '岗位画像摘要', type: 'text', nullable: true })
  profileSummary: string | null;

  @Column({ comment: '任职要求摘要', type: 'text', nullable: true })
  requirementSummary: string | null;

  @Column({ comment: '技能标签摘要', type: 'simple-json', nullable: true })
  skillTagList: string[] | null;

  @Column({ comment: '面试评价模板摘要', type: 'text', nullable: true })
  interviewTemplateSummary: string | null;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'draft' })
  status: string;
}
