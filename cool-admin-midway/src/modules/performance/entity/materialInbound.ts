/**
 * 物资入库单实体。
 * 这里只承载一期冻结的入库单主资源与弱关联来源字段，不负责采购审批、批次拆分或仓位明细。
 * 维护重点是库存仅在 `receive` 时增加，且 `sourceType/sourceBizId` 只做来源追踪不做强绑定校验。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_material_inbound')
export class PerformanceMaterialInboundEntity extends BaseEntity {
  @Index('uk_performance_material_inbound_no', { unique: true })
  @Column({ comment: '入库单号', length: 50 })
  inboundNo: string;

  @Column({ comment: '入库标题', length: 200 })
  title: string;

  @Index()
  @Column({ comment: '物资目录 ID' })
  catalogId: number;

  @Index()
  @Column({ comment: '入库部门 ID' })
  departmentId: number;

  @Column({ comment: '入库数量', default: 1 })
  quantity: number;

  @Column({
    comment: '入库单价',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitCost: number;

  @Column({
    comment: '入库金额',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ comment: '来源类型', length: 50, nullable: true })
  sourceType: string | null;

  @Column({ comment: '来源业务 ID', length: 100, nullable: true })
  sourceBizId: string | null;

  @Column({ comment: '提交时间', type: 'varchar', length: 19, nullable: true })
  submittedAt: string | null;

  @Index()
  @Column({ comment: '确认入库人 ID', nullable: true })
  receivedBy: number | null;

  @Column({ comment: '确认入库时间', type: 'varchar', length: 19, nullable: true })
  receivedAt: string | null;

  @Index()
  @Column({ comment: '入库单状态', length: 20, default: 'draft' })
  status: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;
}
