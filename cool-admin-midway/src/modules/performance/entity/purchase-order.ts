/**
 * 采购订单主表实体。
 * 这里只承载主题11冻结的采购订单摘要字段，不负责采购明细、审批流、收货/入库、对账或付款数据。
 * 维护重点是 `orderNo` 可空唯一、状态默认值和部门/申请人/供应商关联字段必须与冻结事实源一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_purchase_order')
export class PerformancePurchaseOrderEntity extends BaseEntity {
  @Index('uk_performance_purchase_order_no', { unique: true })
  @Column({ comment: '订单编号', length: 50, nullable: true })
  orderNo: string | null;

  @Column({ comment: '采购标题', length: 200 })
  title: string;

  @Index()
  @Column({ comment: '供应商 ID' })
  supplierId: number;

  @Index()
  @Column({ comment: '申请部门 ID' })
  departmentId: number;

  @Index()
  @Column({ comment: '申请人 ID' })
  requesterId: number;

  @Index()
  @Column({ comment: '采购日期', type: 'varchar', length: 10 })
  orderDate: string;

  @Column({
    comment: '订单总金额',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalAmount: number;

  @Column({ comment: '币种', length: 20, default: 'CNY' })
  currency: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;

  @Index()
  @Column({ comment: '采购订单状态', length: 20, default: 'draft' })
  status: string;
}
