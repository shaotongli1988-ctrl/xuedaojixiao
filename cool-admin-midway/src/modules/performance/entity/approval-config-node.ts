/**
 * 自动审批流配置节点实体。
 * 这里只保存配置层节点顺序和解析规则，不负责运行时审批结果。
 * 维护重点是 configId + nodeOrder 必须唯一且顺序连续。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_approval_config_node')
@Index('uk_approval_config_node_order', ['configId', 'nodeOrder'], {
  unique: true,
})
export class PerformanceApprovalConfigNodeEntity extends BaseEntity {
  @Index()
  @Column({ comment: '配置 ID' })
  configId: number;

  @Column({ comment: '节点顺序' })
  nodeOrder: number;

  @Column({ comment: '节点编码', length: 50 })
  nodeCode: string;

  @Column({ comment: '节点名称', length: 100 })
  nodeName: string;

  @Index()
  @Column({ comment: '审批人解析方式', length: 50 })
  resolverType: string;

  @Column({ comment: '审批人解析参数', length: 200, nullable: true })
  resolverValue: string | null;

  @Column({ comment: '节点超时阈值', nullable: true })
  timeoutHours: number | null;

  @Column({ comment: '是否允许转办', default: true })
  allowTransfer: boolean;
}
