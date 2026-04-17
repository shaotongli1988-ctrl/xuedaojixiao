/**
 * 文件职责：定义薪资调整记录实体，保留调整前后金额和操作人审计信息。
 * 不负责薪资主表状态流转和权限校验。
 * 维护重点：记录链路只追加，不直接覆盖历史记录。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 薪资调整记录。
 * 这里只保存单次调整审计信息，不保存薪资主表快照副本。
 */
@Entity('performance_salary_change')
export class PerformanceSalaryChangeEntity extends BaseEntity {
  @Index()
  @Column({ comment: '关联薪资记录' })
  salaryId: number;

  @Column({
    comment: '调整前最终金额',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  beforeAmount: number;

  @Column({
    comment: '调整后最终金额',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  afterAmount: number;

  @Column({ comment: '调整原因', length: 500, nullable: true })
  changeReason: string;

  @Index()
  @Column({ comment: '操作人 ID' })
  operatorId: number;
}
