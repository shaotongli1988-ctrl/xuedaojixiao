/**
 * 物资库存聚合实体。
 * 这里只保存一期冻结的目录级库存汇总，不负责批次、库位、序列号或财务成本核算。
 * 维护重点是库存只能由入库 receive / 出库 issue 动作回写，外部接口只读。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_material_stock')
@Index('uk_performance_material_stock_catalog_department', ['catalogId', 'departmentId'], {
  unique: true,
})
export class PerformanceMaterialStockEntity extends BaseEntity {
  @Index()
  @Column({ comment: '物资目录 ID' })
  catalogId: number;

  @Index()
  @Column({ comment: '所属部门 ID' })
  departmentId: number;

  @Column({ comment: '当前库存数量', default: 0 })
  currentQty: number;

  @Column({ comment: '可用库存数量', default: 0 })
  availableQty: number;

  @Column({ comment: '预留库存数量', default: 0 })
  reservedQty: number;

  @Column({ comment: '累计已出库数量', default: 0 })
  issuedQty: number;

  @Column({
    comment: '最近参考单价',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  lastUnitCost: number;

  @Column({ comment: '最近入库时间', type: 'varchar', length: 19, nullable: true })
  lastInboundTime: string | null;

  @Column({ comment: '最近出库时间', type: 'varchar', length: 19, nullable: true })
  lastIssueTime: string | null;
}
