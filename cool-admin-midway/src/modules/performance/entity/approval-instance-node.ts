/**
 * 自动审批实例节点实体。
 * 这里只保存实例创建时的节点快照、当前审批人和处理结果，不负责配置维护。
 * 维护重点是实例节点只保留一条快照记录，通过状态和审计留痕表达节点演进。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_approval_instance_node')
@Index('uk_approval_instance_node_order', ['instanceId', 'nodeOrder'], {
  unique: true,
})
export class PerformanceApprovalInstanceNodeEntity extends BaseEntity {
  @Index()
  @Column({ comment: '实例 ID' })
  instanceId: number;

  @Column({ comment: '节点顺序' })
  nodeOrder: number;

  @Column({ comment: '节点编码', length: 50 })
  nodeCode: string;

  @Column({ comment: '节点名称', length: 100 })
  nodeName: string;

  @Index()
  @Column({ comment: '审批人解析方式', length: 50 })
  resolverType: string;

  @Column({ comment: '审批人解析参数快照', length: 200, nullable: true })
  resolverValueSnapshot: string | null;

  @Column({ comment: '是否允许转办', default: true })
  allowTransfer: boolean;

  @Index()
  @Column({ comment: '审批人 ID', nullable: true })
  approverId: number | null;

  @Index()
  @Column({ comment: '节点状态', length: 20, default: 'pending' })
  status: string;

  @Index()
  @Column({ comment: '节点动作时间', type: 'varchar', length: 19, nullable: true })
  actionTime: string | null;

  @Index()
  @Column({ comment: '转办前审批人 ID', nullable: true })
  transferFromUserId: number | null;

  @Column({ comment: '转办原因', length: 500, nullable: true })
  transferReason: string | null;

  @Column({ comment: '审批意见', type: 'text', nullable: true })
  comment: string | null;
}
