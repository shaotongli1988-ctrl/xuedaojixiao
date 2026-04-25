/**
 * 物资出库单实体。
 * 这里只承载一期冻结的出库单主资源，不负责领料审批、批次先进先出或仓位分摊。
 * 维护重点是库存仅在 `issue` 时扣减，且终态后不允许再编辑。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_material_issue')
export class PerformanceMaterialIssueEntity extends BaseEntity {
  @Index('uk_performance_material_issue_no', { unique: true })
  @Column({ comment: '出库单号', length: 50 })
  issueNo: string;

  @Column({ comment: '出库标题', length: 200 })
  title: string;

  @Index()
  @Column({ comment: '物资目录 ID' })
  catalogId: number;

  @Index()
  @Column({ comment: '出库部门 ID' })
  departmentId: number;

  @Column({ comment: '出库数量', default: 1 })
  quantity: number;

  @Index()
  @Column({ comment: '领用人 ID' })
  assigneeId: number;

  @Column({ comment: '领用人姓名', length: 100 })
  assigneeName: string;

  @Column({ comment: '用途', length: 200, nullable: true })
  purpose: string | null;

  @Column({ comment: '出库日期', type: 'varchar', length: 19, nullable: true })
  issueDate: string | null;

  @Column({ comment: '提交时间', type: 'varchar', length: 19, nullable: true })
  submittedAt: string | null;

  @Index()
  @Column({ comment: '确认出库人 ID', nullable: true })
  issuedBy: number | null;

  @Column({ comment: '确认出库时间', type: 'varchar', length: 19, nullable: true })
  issuedAt: string | null;

  @Index()
  @Column({ comment: '出库单状态', length: 20, default: 'draft' })
  status: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;
}
