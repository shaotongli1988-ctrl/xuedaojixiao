/**
 * 班主任资源归因冲突实体。
 * 这里只承接主题19 V0.2 冻结的重复归因冲突，不负责审批流、外部通知或复杂风控评分。
 * 维护重点是冲突未解决前不能让新归因直接生效，且处理结果必须可追溯。
 */
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity, transformerJson } from '../../base/entity/base';

@Entity('performance_teacher_attribution_conflict')
export class PerformanceTeacherAttributionConflictEntity extends BaseEntity {
  @Index()
  @Column({ comment: '班主任资源 ID' })
  teacherId: number;

  @Column({
    comment: '候选代理主体 ID 列表',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  candidateAgentIds: number[] | null;

  @Index()
  @Column({ comment: '冲突状态', length: 20, default: 'open' })
  status: string;

  @Column({ comment: '处理结果', length: 30, nullable: true })
  resolution: string | null;

  @Column({ comment: '处理说明', type: 'text', nullable: true })
  resolutionRemark: string | null;

  @Index()
  @Column({ comment: '处理人 ID', nullable: true })
  resolvedBy: number | null;

  @Index()
  @Column({ comment: '处理时间', type: 'varchar', length: 19, nullable: true })
  resolvedTime: string | null;

  @Index()
  @Column({ comment: '当前有效代理 ID', nullable: true })
  currentAgentId: number | null;

  @Index()
  @Column({ comment: '新申请代理 ID', nullable: true })
  requestedAgentId: number | null;

  @Index()
  @Column({ comment: '发起人 ID', nullable: true })
  requestedById: number | null;
}
