/**
 * 供应商主数据实体。
 * 这里只承载主题11冻结的供应商台账摘要字段，不负责资质附件、评级、合同全文、结算中心或外部系统对接。
 * 维护重点是 `code` 可空唯一、敏感字段边界和停用后删除约束必须与冻结事实源一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_supplier')
export class PerformanceSupplierEntity extends BaseEntity {
  @Index()
  @Column({ comment: '供应商名称', length: 100 })
  name: string;

  @Index('uk_performance_supplier_code', { unique: true })
  @Column({ comment: '供应商编码', length: 100, nullable: true })
  code: string | null;

  @Column({ comment: '供应商分类', length: 100, nullable: true })
  category: string | null;

  @Column({ comment: '联系人姓名', length: 100, nullable: true })
  contactName: string | null;

  @Column({ comment: '联系电话', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ comment: '联系邮箱', length: 100, nullable: true })
  contactEmail: string | null;

  @Column({ comment: '银行账户', length: 100, nullable: true })
  bankAccount: string | null;

  @Column({ comment: '税号', length: 100, nullable: true })
  taxNo: string | null;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;

  @Index()
  @Column({ comment: '供应商状态', length: 20, default: 'active' })
  status: string;
}
