/**
 * 自动审批动作审计实体。
 * 这里只保存审批层动作时间线和原因摘要，不负责实例状态推进。
 * 维护重点是 launch / approve / reject / transfer / withdraw / remind / resolve / fallback / terminate 必须完整留痕。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_approval_action_log')
@Index('idx_approval_action_instance_time', ['instanceId', 'createTime'])
export class PerformanceApprovalActionLogEntity extends BaseEntity {
  @Index()
  @Column({ comment: '实例 ID' })
  instanceId: number;

  @Index()
  @Column({ comment: '实例节点 ID', nullable: true })
  instanceNodeId: number | null;

  @Index()
  @Column({ comment: '动作类型', length: 30 })
  action: string;

  @Index()
  @Column({ comment: '操作人 ID' })
  operatorId: number;

  @Column({ comment: '操作前实例状态', length: 30, nullable: true })
  fromStatus: string | null;

  @Column({ comment: '操作后实例状态', length: 30, nullable: true })
  toStatus: string | null;

  @Column({ comment: '动作原因', length: 500, nullable: true })
  reason: string | null;

  @Column({ comment: '动作摘要', length: 1000, nullable: true })
  detail: string | null;
}
