import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 目标运营台部门配置。
 * 这里只承接部门级下发、填报和日报发送时间，以及日报推送目标等运营参数；
 * 不负责目标项明细、统计快照和实际填报数据。
 * 维护重点是 departmentId 唯一，且时间节点格式必须保持为 HH:mm。
 */
@Entity('performance_goal_ops_department_config')
@Index(['departmentId'], { unique: true })
export class PerformanceGoalOpsDepartmentConfigEntity extends BaseEntity {
  @Column({ comment: '部门ID' })
  departmentId: number;

  @Column({ comment: '日目标下发时间', length: 5, default: '09:00' })
  assignTime: string;

  @Column({ comment: '结果填报截止时间', length: 5, default: '18:00' })
  submitDeadline: string;

  @Column({ comment: '日报自动发送时间', length: 5, default: '18:30' })
  reportSendTime: string;

  @Column({ comment: '日报推送方式', length: 32, default: 'system_and_group' })
  reportPushMode: string;

  @Column({ comment: '日报推送目标', length: 200, nullable: true })
  reportPushTarget: string | null;

  @Column({ comment: '最后更新人ID', nullable: true })
  updatedBy: number | null;
}
