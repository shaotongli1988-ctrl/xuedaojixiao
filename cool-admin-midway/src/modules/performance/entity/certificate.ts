import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 证书台账主表。
 * 这里只承载主题13冻结的证书基础台账，不负责证书附件、扫描件、PDF 文件流或课程结业主链。
 */
@Entity('performance_certificate')
export class PerformanceCertificateEntity extends BaseEntity {
  @Index()
  @Column({ comment: '证书名称', length: 200 })
  name: string;

  @Index('uk_performance_certificate_code', { unique: true })
  @Column({ comment: '证书编码', length: 100, nullable: true })
  code: string | null;

  @Index()
  @Column({ comment: '证书分类', length: 100, nullable: true })
  category: string | null;

  @Column({ comment: '发证机构摘要', length: 200, nullable: true })
  issuer: string | null;

  @Column({ comment: '证书说明', type: 'text', nullable: true })
  description: string | null;

  @Column({ comment: '有效月数', nullable: true })
  validityMonths: number | null;

  @Index()
  @Column({ comment: '来源课程 ID', nullable: true })
  sourceCourseId: number | null;

  @Index()
  @Column({ comment: '证书状态', length: 20, default: 'draft' })
  status: string;
}
