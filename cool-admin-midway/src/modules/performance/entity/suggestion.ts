/**
 * 自动建议记录实体。
 * 这里只承载建议摘要、内部审计快照和关联正式单据标识，不负责规则判定、权限校验或正式单据创建。
 * 维护重点是内部可保留触发分数与撤销原因等审计字段，但接口层绝不直接暴露这些敏感字段。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_suggestion')
export class PerformanceSuggestionEntity extends BaseEntity {
  @Index()
  @Column({ comment: '建议类型', length: 20 })
  suggestionType: string;

  @Index()
  @Column({ comment: '建议状态', length: 20, default: 'pending' })
  status: string;

  @Index()
  @Column({ comment: '来源评估单 ID' })
  assessmentId: number;

  @Index()
  @Column({ comment: '员工 ID' })
  employeeId: number;

  @Index()
  @Column({ comment: '部门 ID' })
  departmentId: number;

  @Column({ comment: '周期类型', length: 20 })
  periodType: string;

  @Index()
  @Column({ comment: '周期值', length: 30 })
  periodValue: string;

  @Column({ comment: '非敏感触发摘要', length: 100 })
  triggerLabel: string;

  @Column({ comment: '触发等级快照', length: 10, nullable: true })
  triggerGrade: string | null;

  @Column({
    comment: '触发分数快照',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  triggerScore: number | null;

  @Column({ comment: '规则版本', length: 50 })
  ruleVersion: string;

  @Index()
  @Column({ comment: '最近处理时间', type: 'varchar', length: 19, nullable: true })
  handleTime: string | null;

  @Index()
  @Column({ comment: '最近处理人 ID', nullable: true })
  handlerId: number | null;

  @Column({ comment: '最近处理人姓名', length: 100, nullable: true })
  handlerName: string | null;

  @Column({ comment: '撤销原因编码', length: 50, nullable: true })
  revokeReasonCode: string | null;

  @Column({ comment: '撤销原因说明', type: 'text', nullable: true })
  revokeReason: string | null;

  @Column({ comment: '关联正式单据类型', length: 20, nullable: true })
  linkedEntityType: string | null;

  @Index()
  @Column({ comment: '关联正式单据 ID', nullable: true })
  linkedEntityId: number | null;
}
