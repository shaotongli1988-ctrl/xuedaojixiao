/**
 * 资产盘点单实体。
 * 这里只承载主题20冻结的盘点主链，不负责仓储盘点任务分派、扫码设备或差异审批流。
 * 维护重点是盘点 start/complete/close 必须与资产 inventorying 状态成对回写。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_asset_inventory')
export class PerformanceAssetInventoryEntity extends BaseEntity {
  @Index('uk_performance_asset_inventory_no', { unique: true })
  @Column({ comment: '盘点单号', length: 50 })
  inventoryNo: string;

  @Index()
  @Column({ comment: '资产 ID' })
  assetId: number;

  @Index()
  @Column({ comment: '所属部门 ID' })
  ownerDepartmentId: number;

  @Column({ comment: '位置快照', length: 200, nullable: true })
  locationSnapshot: string | null;

  @Column({ comment: '盘点结果摘要', type: 'text', nullable: true })
  resultSummary: string | null;

  @Column({ comment: '开始时间', type: 'varchar', length: 19, nullable: true })
  startedAt: string | null;

  @Column({ comment: '完成时间', type: 'varchar', length: 19, nullable: true })
  completedAt: string | null;

  @Column({ comment: '关闭时间', type: 'varchar', length: 19, nullable: true })
  closedAt: string | null;

  @Index()
  @Column({ comment: '盘点状态', length: 20, default: 'draft' })
  status: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;
}
