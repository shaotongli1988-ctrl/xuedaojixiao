/**
 * 资产折旧快照实体。
 * 这里只承载主题20冻结的资产侧月度折旧摘要，不负责会计凭证、税务口径或回冲分录。
 * 维护重点是重算只改写当前资产侧快照与汇总视图，不得扩展到财务总账主链。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_asset_depreciation')
export class PerformanceAssetDepreciationEntity extends BaseEntity {
  @Index()
  @Column({ comment: '资产 ID' })
  assetId: number;

  @Index()
  @Column({ comment: '折旧期间', length: 7 })
  periodValue: string;

  @Column({
    comment: '本期折旧额',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  depreciationAmount: number;

  @Column({
    comment: '累计折旧额',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  accumulatedAmount: number;

  @Column({
    comment: '净值',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  netBookValue: number;

  @Column({
    comment: '原值快照',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  sourceCost: number;

  @Column({ comment: '重算时间', type: 'varchar', length: 19, nullable: true })
  recalculatedAt: string | null;
}
