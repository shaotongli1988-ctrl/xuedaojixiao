/**
 * 资产采购入库单实体。
 * 这里只承载主题20冻结的资产侧入库结果，不负责采购订单审批、供应商中心或财务凭证链路。
 * 维护重点是 receive 动作必须落地资产台账，且 purchaseOrderId/supplierId 仅保持弱关联引用。
 */
import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_asset_procurement')
export class PerformanceAssetProcurementEntity extends BaseEntity {
  @Index('uk_performance_asset_procurement_no', { unique: true })
  @Column({ comment: '采购入库单号', length: 50 })
  procurementNo: string;

  @Column({ comment: '标题', length: 200 })
  title: string;

  @Index()
  @Column({ comment: '采购订单 ID（弱关联）', nullable: true })
  purchaseOrderId: number | null;

  @Index()
  @Column({ comment: '供应商 ID（弱关联）', nullable: true })
  supplierId: number | null;

  @Index()
  @Column({ comment: '所属部门 ID' })
  ownerDepartmentId: number;

  @Index()
  @Column({ comment: '管理人 ID', nullable: true })
  managerId: number | null;

  @Column({ comment: '资产名称', length: 200 })
  assetName: string;

  @Index()
  @Column({ comment: '资产分类', length: 100, nullable: true })
  category: string | null;

  @Column({ comment: '资产类型', length: 100, nullable: true })
  assetType: string | null;

  @Column({ comment: '品牌', length: 100, nullable: true })
  brand: string | null;

  @Column({ comment: '型号', length: 100, nullable: true })
  model: string | null;

  @Column({ comment: '序列号或前缀', length: 100, nullable: true })
  serialNo: string | null;

  @Column({ comment: '入库位置', length: 200, nullable: true })
  location: string | null;

  @Column({ comment: '采购日期', type: 'varchar', length: 10, nullable: true })
  purchaseDate: string | null;

  @Column({
    comment: '单价',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitCost: number;

  @Column({ comment: '数量', default: 1 })
  quantity: number;

  @Column({ comment: '质保到期日', type: 'varchar', length: 10, nullable: true })
  warrantyExpiry: string | null;

  @Column({ comment: '折旧月数', default: 0 })
  depreciationMonths: number;

  @Column({
    comment: '已生成资产 ID 列表',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  receivedAssetIds: number[] | null;

  @Column({ comment: '提交时间', type: 'varchar', length: 19, nullable: true })
  submittedAt: string | null;

  @Column({ comment: '确认入库时间', type: 'varchar', length: 19, nullable: true })
  receivedAt: string | null;

  @Index()
  @Column({ comment: '采购入库状态', length: 20, default: 'draft' })
  status: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;
}
