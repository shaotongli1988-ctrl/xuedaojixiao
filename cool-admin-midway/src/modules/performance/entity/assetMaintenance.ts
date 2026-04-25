/**
 * 资产维护记录实体。
 * 这里只承载主题20冻结的维护主链，不负责外部工单系统、采购备件或供应商结算。
 * 维护重点是维护状态与资产主状态的开始/完成回写必须由资产域服务端统一兜底。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_asset_maintenance')
export class PerformanceAssetMaintenanceEntity extends BaseEntity {
  @Index()
  @Column({ comment: '资产 ID' })
  assetId: number;

  @Index()
  @Column({ comment: '所属部门 ID' })
  departmentId: number;

  @Column({ comment: '维护类型', length: 50, nullable: true })
  maintenanceType: string | null;

  @Column({ comment: '服务商', length: 100, nullable: true })
  vendor: string | null;

  @Column({
    comment: '维护费用',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  cost: number;

  @Column({ comment: '开始时间', type: 'varchar', length: 19, nullable: true })
  startDate: string | null;

  @Column({ comment: '完成时间', type: 'varchar', length: 19, nullable: true })
  completedDate: string | null;

  @Index()
  @Column({ comment: '维护状态', length: 20, default: 'scheduled' })
  status: string;

  @Column({ comment: '维护说明', type: 'text', nullable: true })
  description: string | null;

  @Column({ comment: '维护结果', type: 'text', nullable: true })
  result: string | null;
}
