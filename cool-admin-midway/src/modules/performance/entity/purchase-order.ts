/**
 * 采购订单主表实体。
 * 这里只承载主题11扩容后冻结的采购订单主单、轻量流程记录和收货摘要，不负责付款、对账、库存总账或外部 ERP。
 * 维护重点是单主资源状态机、关闭原因、累计收货和轻量 JSON 快照字段必须与冻结事实源一致。
 */
import { BaseEntity, transformerJson } from '../../base/entity/base';
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

  @Column({ comment: '期望交付日期', type: 'varchar', length: 10, nullable: true })
  expectedDeliveryDate: string | null;

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

  @Index()
  @Column({ comment: '审批人 ID', nullable: true })
  approvedBy: number | null;

  @Column({ comment: '审批时间', type: 'varchar', length: 19, nullable: true })
  approvedAt: string | null;

  @Column({ comment: '审批备注', type: 'text', nullable: true })
  approvalRemark: string | null;

  @Column({ comment: '关闭原因', type: 'text', nullable: true })
  closedReason: string | null;

  @Column({ comment: '累计收货数量', default: 0 })
  receivedQuantity: number;

  @Column({ comment: '最近收货时间', type: 'varchar', length: 19, nullable: true })
  receivedAt: string | null;

  @Column({
    comment: '采购明细快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  items: Array<Record<string, any>> | null;

  @Column({
    comment: '询价记录',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  inquiryRecords: Array<Record<string, any>> | null;

  @Column({
    comment: '审批日志',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  approvalLogs: Array<Record<string, any>> | null;

  @Column({
    comment: '收货记录',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  receiptRecords: Array<Record<string, any>> | null;
}
