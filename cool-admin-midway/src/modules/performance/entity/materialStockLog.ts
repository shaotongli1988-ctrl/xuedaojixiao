/**
 * 物资库存流水实体。
 * 这里只记录一期冻结的目录级入库/出库库存变更，不负责批次追踪、审计签名或回滚补偿编排。
 * 维护重点是流水必须与 receive / issue 动作同源写入，数量变化前后值不能漂移。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_material_stock_log')
export class PerformanceMaterialStockLogEntity extends BaseEntity {
  @Index()
  @Column({ comment: '物资目录 ID' })
  catalogId: number;

  @Index()
  @Column({ comment: '部门 ID' })
  departmentId: number;

  @Index()
  @Column({ comment: '库存聚合 ID' })
  stockId: number;

  @Index()
  @Column({ comment: '业务类型', length: 20 })
  bizType: string;

  @Index()
  @Column({ comment: '业务单 ID' })
  bizId: number;

  @Column({ comment: '业务单号', length: 50, nullable: true })
  bizNo: string | null;

  @Column({ comment: '变更方向', length: 20 })
  changeType: string;

  @Column({ comment: '变更数量', default: 0 })
  quantity: number;

  @Column({ comment: '变更前数量', default: 0 })
  beforeQuantity: number;

  @Column({ comment: '变更后数量', default: 0 })
  afterQuantity: number;

  @Column({
    comment: '参考单价',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitCost: number;

  @Column({ comment: '操作时间', type: 'varchar', length: 19 })
  operatedAt: string;

  @Column({ comment: '操作人 ID', nullable: true })
  operatorId: number | null;

  @Column({ comment: '操作人名称', length: 100, nullable: true })
  operatorName: string | null;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;
}
