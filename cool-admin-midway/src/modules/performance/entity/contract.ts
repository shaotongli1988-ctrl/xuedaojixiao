/**
 * 合同台账主表实体。
 * 这里只承载主题10首批冻结的合同摘要字段，不负责附件、电子签、审批流或归档下载数据。
 * 维护重点是字段边界、状态默认值和敏感金额字段必须与唯一事实源一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_contract')
export class PerformanceContractEntity extends BaseEntity {
  @Index()
  @Column({ comment: '员工 ID' })
  employeeId: number;

  @Index()
  @Column({ comment: '合同类型', length: 20 })
  type: string;

  @Column({ comment: '合同标题', length: 200, nullable: true })
  title: string;

  @Index()
  @Column({ comment: '合同编号', length: 50, nullable: true })
  contractNumber: string;

  @Index()
  @Column({ comment: '开始日期', type: 'varchar', length: 10 })
  startDate: string;

  @Index()
  @Column({ comment: '结束日期', type: 'varchar', length: 10 })
  endDate: string;

  @Column({ comment: '试用期（月）', type: 'int', nullable: true })
  probationPeriod: number | null;

  @Column({
    comment: '薪资金额',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  salary: number | null;

  @Column({ comment: '岗位名称', length: 100, nullable: true })
  position: string;

  @Index()
  @Column({ comment: '部门 ID', nullable: true })
  departmentId: number | null;

  @Index()
  @Column({ comment: '合同状态', length: 20, default: 'draft' })
  status: string;
}
