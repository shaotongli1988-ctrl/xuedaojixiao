/**
 * 知识产权台账主表。
 * 这里只承载 intellectualProperty 的 HR-only 元数据台账，不负责证书附件上传、续费工作流或侵权处置流程。
 * 维护重点是 ipNo 唯一性、类型/状态枚举和到期日期边界必须由服务端保持一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_intellectual_property')
export class PerformanceIntellectualPropertyEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '知识产权编号', length: 64 })
  ipNo: string;

  @Index()
  @Column({ comment: '标题', length: 200 })
  title: string;

  @Index()
  @Column({ comment: '知识产权类型', length: 32 })
  ipType: string;

  @Column({ comment: '归属部门', length: 100 })
  ownerDepartment: string;

  @Column({ comment: '归属人', length: 100 })
  ownerName: string;

  @Column({ comment: '申请人', length: 100 })
  applicantName: string;

  @Column({ comment: '申请日期', type: 'varchar', length: 10 })
  applyDate: string;

  @Column({ comment: '授权日期', type: 'varchar', length: 10, nullable: true })
  grantDate: string | null;

  @Column({ comment: '到期日期', type: 'varchar', length: 10, nullable: true })
  expiryDate: string | null;

  @Index()
  @Column({ comment: '状态', length: 32, default: 'drafting' })
  status: string;

  @Column({ comment: '登记号', length: 100, nullable: true })
  registryNo: string | null;

  @Column({ comment: '使用范围', type: 'text', nullable: true })
  usageScope: string | null;

  @Column({ comment: '风险等级', length: 32, nullable: true })
  riskLevel: string | null;

  @Column({ comment: '备注', type: 'text', nullable: true })
  notes: string | null;
}
