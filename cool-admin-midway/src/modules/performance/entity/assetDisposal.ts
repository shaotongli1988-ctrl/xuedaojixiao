/**
 * 资产报废单实体。
 * 这里只承载主题20冻结的报废申请、审批和执行主链，不负责财务核销、残值处置或外部审批引擎。
 * 维护重点是 execute 必须把资产推进到 scrapped 终态，且终态后禁止恢复。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_asset_disposal')
export class PerformanceAssetDisposalEntity extends BaseEntity {
  @Index('uk_performance_asset_disposal_no', { unique: true })
  @Column({ comment: '报废单号', length: 50 })
  disposalNo: string;

  @Index()
  @Column({ comment: '资产 ID' })
  assetId: number;

  @Index()
  @Column({ comment: '所属部门 ID' })
  ownerDepartmentId: number;

  @Column({ comment: '报废原因', type: 'text' })
  reason: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;

  @Index()
  @Column({ comment: '审批人 ID', nullable: true })
  approvedById: number | null;

  @Index()
  @Column({ comment: '执行人 ID', nullable: true })
  executedById: number | null;

  @Column({ comment: '提交时间', type: 'varchar', length: 19, nullable: true })
  submittedAt: string | null;

  @Column({ comment: '审批时间', type: 'varchar', length: 19, nullable: true })
  approvedAt: string | null;

  @Column({ comment: '执行时间', type: 'varchar', length: 19, nullable: true })
  executedAt: string | null;

  @Index()
  @Column({ comment: '报废状态', length: 20, default: 'draft' })
  status: string;
}
