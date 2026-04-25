/**
 * 资产调拨单实体。
 * 这里只承载主题20冻结的资产调拨主链，不负责物流签收、跨系统仓储或审批中心扩展。
 * 维护重点是调拨只能基于 available 资产发起，且完成后必须回写资产归属部门和位置。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_asset_transfer')
export class PerformanceAssetTransferEntity extends BaseEntity {
  @Index('uk_performance_asset_transfer_no', { unique: true })
  @Column({ comment: '调拨单号', length: 50 })
  transferNo: string;

  @Index()
  @Column({ comment: '资产 ID' })
  assetId: number;

  @Index()
  @Column({ comment: '原所属部门 ID' })
  fromDepartmentId: number;

  @Index()
  @Column({ comment: '目标部门 ID' })
  toDepartmentId: number;

  @Index()
  @Column({ comment: '目标管理人 ID', nullable: true })
  toManagerId: number | null;

  @Column({ comment: '原位置快照', length: 200, nullable: true })
  fromLocation: string | null;

  @Column({ comment: '目标位置', length: 200, nullable: true })
  toLocation: string | null;

  @Column({ comment: '调拨原因', type: 'text', nullable: true })
  reason: string | null;

  @Column({ comment: '提交时间', type: 'varchar', length: 19, nullable: true })
  submittedAt: string | null;

  @Column({ comment: '完成时间', type: 'varchar', length: 19, nullable: true })
  completedAt: string | null;

  @Index()
  @Column({ comment: '调拨状态', length: 20, default: 'draft' })
  status: string;
}
