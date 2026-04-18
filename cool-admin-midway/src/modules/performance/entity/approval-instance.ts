/**
 * 自动审批实例实体。
 * 这里只保存提交后的审批层主状态、当前节点和 HR 介入结果，不负责节点明细或审计日志全文。
 * 维护重点是 objectType + objectId 在未终态时只能存在一个实例。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_approval_instance')
@Index('idx_approval_instance_object_status', ['objectType', 'objectId', 'status'])
export class PerformanceApprovalInstanceEntity extends BaseEntity {
  @Index()
  @Column({ comment: '审批对象类型', length: 30 })
  objectType: string;

  @Index()
  @Column({ comment: '源业务对象 ID' })
  objectId: number;

  @Index()
  @Column({ comment: '源业务对象状态快照', length: 30 })
  sourceStatus: string;

  @Index()
  @Column({ comment: '配置 ID' })
  configId: number;

  @Column({ comment: '配置版本快照', length: 30 })
  configVersion: string;

  @Index()
  @Column({ comment: '发起人 ID' })
  applicantId: number;

  @Index()
  @Column({ comment: '业务所属员工 ID' })
  employeeId: number;

  @Index()
  @Column({ comment: '业务所属部门 ID' })
  departmentId: number;

  @Index()
  @Column({
    comment: '实例状态',
    length: 30,
    default: 'pending_resolution',
  })
  status: string;

  @Index()
  @Column({ comment: '当前节点顺序', nullable: true })
  currentNodeOrder: number | null;

  @Index('idx_approval_instance_current_approver')
  @Column({ comment: '当前审批人 ID', nullable: true })
  currentApproverId: number | null;

  @Index()
  @Column({ comment: '发起时间', type: 'varchar', length: 19 })
  launchTime: string;

  @Index()
  @Column({ comment: '结束时间', type: 'varchar', length: 19, nullable: true })
  finishTime: string | null;

  @Column({ comment: '回退原因', length: 500, nullable: true })
  fallbackReason: string | null;

  @Index()
  @Column({ comment: '回退操作人', nullable: true })
  fallbackOperatorId: number | null;

  @Column({ comment: '终止原因', length: 500, nullable: true })
  terminateReason: string | null;

  @Index()
  @Column({ comment: '终止操作人', nullable: true })
  terminateOperatorId: number | null;
}
