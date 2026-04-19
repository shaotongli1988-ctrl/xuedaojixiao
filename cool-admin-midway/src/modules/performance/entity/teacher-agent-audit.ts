/**
 * 代理体系审计实体。
 * 这里只记录主题19 V0.2 冻结的代理主体、关系、归因和冲突处理留痕，不负责业务审批或对外报表输出。
 * 维护重点是该表只读，快照字段必须可回放关键动作前后差异。
 */
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity, transformerJson } from '../../base/entity/base';

@Entity('performance_teacher_agent_audit')
export class PerformanceTeacherAgentAuditEntity extends BaseEntity {
  @Index()
  @Column({ comment: '资源类型', length: 30 })
  resourceType: string;

  @Index()
  @Column({ comment: '资源 ID' })
  resourceId: number;

  @Index()
  @Column({ comment: '动作', length: 30 })
  action: string;

  @Column({
    comment: '变更前快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  beforeSnapshot: Record<string, any> | null;

  @Column({
    comment: '变更后快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  afterSnapshot: Record<string, any> | null;

  @Index()
  @Column({ comment: '操作人 ID' })
  operatorId: number;

  @Column({ comment: '操作人名称', length: 100 })
  operatorName: string;
}
