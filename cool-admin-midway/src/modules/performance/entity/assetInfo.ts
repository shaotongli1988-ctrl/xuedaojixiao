/**
 * 资产台账主表实体。
 * 这里只承载主题20冻结的资产侧台账最小字段，不负责供应商主数据、采购审批流、财务凭证或 IoT 设备明细。
 * 维护重点是资产主状态、金额字段裁剪边界和采购/供应商仅弱关联约束必须与冻结事实源一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_asset_info')
export class PerformanceAssetInfoEntity extends BaseEntity {
  @Index('uk_performance_asset_no', { unique: true })
  @Column({ comment: '资产编号', length: 50 })
  assetNo: string;

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

  @Index()
  @Column({ comment: '序列号', length: 100, nullable: true })
  serialNo: string | null;

  @Index()
  @Column({ comment: '资产状态', length: 30, default: 'available' })
  status: string;

  @Column({ comment: '存放位置', length: 200, nullable: true })
  location: string | null;

  @Index()
  @Column({ comment: '所属部门 ID' })
  ownerDepartmentId: number;

  @Index()
  @Column({ comment: '管理人 ID', nullable: true })
  managerId: number | null;

  @Column({ comment: '采购日期', type: 'varchar', length: 10, nullable: true })
  purchaseDate: string | null;

  @Column({
    comment: '采购金额',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  purchaseCost: number;

  @Index()
  @Column({ comment: '供应商 ID', nullable: true })
  supplierId: number | null;

  @Index()
  @Column({ comment: '采购订单 ID（弱关联）', nullable: true })
  purchaseOrderId: number | null;

  @Column({ comment: '质保到期日', type: 'varchar', length: 10, nullable: true })
  warrantyExpiry: string | null;

  @Column({ comment: '折旧月数', default: 0 })
  depreciationMonths: number;

  @Column({
    comment: '累计折旧金额',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  depreciatedAmount: number;

  @Column({
    comment: '净值',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  netBookValue: number;

  @Column({ comment: '最近盘点时间', type: 'varchar', length: 19, nullable: true })
  lastInventoryTime: string | null;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;
}
