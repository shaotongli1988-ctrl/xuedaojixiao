import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 证书发放记录表。
 * 这里只承载主题13冻结的证书发放与撤销摘要，不负责课程结业回写、附件存储或外部凭证同步。
 */
@Entity('performance_certificate_record')
export class PerformanceCertificateRecordEntity extends BaseEntity {
  @Index()
  @Column({ comment: '证书 ID' })
  certificateId: number;

  @Index()
  @Column({ comment: '员工 ID' })
  employeeId: number;

  @Index()
  @Column({ comment: '部门 ID', nullable: true })
  departmentId: number | null;

  @Index()
  @Column({ comment: '来源课程 ID', nullable: true })
  sourceCourseId: number | null;

  @Index()
  @Column({ comment: '发放时间', type: 'varchar', length: 19 })
  issuedAt: string;

  @Index()
  @Column({ comment: '发放人 ID' })
  issuedById: number;

  @Column({ comment: '发放人姓名摘要', length: 100 })
  issuedBy: string;

  @Column({ comment: '发放备注摘要', type: 'text', nullable: true })
  remark: string | null;

  @Index()
  @Column({ comment: '记录状态', length: 20, default: 'issued' })
  status: string;
}
