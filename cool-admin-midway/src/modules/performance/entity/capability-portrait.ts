import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 能力画像摘要表。
 * 这里只存主题13冻结的员工能力摘要，不负责人才档案全文、简历全文或面试评语全文。
 */
@Entity('performance_capability_portrait')
export class PerformanceCapabilityPortraitEntity extends BaseEntity {
  @Index('uk_performance_capability_portrait_employee', { unique: true })
  @Column({ comment: '员工 ID' })
  employeeId: number;

  @Index()
  @Column({ comment: '部门 ID', nullable: true })
  departmentId: number | null;

  @Column({ comment: '能力标签摘要', type: 'simple-json', nullable: true })
  capabilityTags: string[] | null;

  @Column({ comment: '等级摘要', type: 'simple-json', nullable: true })
  levelSummary: string[] | null;

  @Column({ comment: '摘要更新时间', type: 'varchar', length: 19 })
  updatedAt: string;
}
