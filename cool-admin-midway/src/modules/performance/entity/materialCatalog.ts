/**
 * 物资目录实体。
 * 这里只承载一期冻结的物资主数据，不负责采购分流、供应商绑定、批次管理或仓位管理。
 * 维护重点是 `code` 唯一、状态只允许 active/inactive，且库存聚合与业务单据必须通过目录 ID 关联。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_material_catalog')
export class PerformanceMaterialCatalogEntity extends BaseEntity {
  @Index('uk_performance_material_catalog_code', { unique: true })
  @Column({ comment: '物资编码', length: 50 })
  code: string;

  @Index()
  @Column({ comment: '物资名称', length: 200 })
  name: string;

  @Column({ comment: '物资分类', length: 100, nullable: true })
  category: string | null;

  @Column({ comment: '规格型号', length: 200, nullable: true })
  specification: string | null;

  @Column({ comment: '计量单位', length: 20 })
  unit: string;

  @Column({ comment: '安全库存', default: 0 })
  safetyStock: number;

  @Column({
    comment: '参考单价',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  referenceUnitCost: number;

  @Index()
  @Column({ comment: '目录状态', length: 20, default: 'active' })
  status: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;
}
