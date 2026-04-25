import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 目标运营台部门日报记录。
 * 这里只承接日报摘要、发送状态和拦截/延期结果，不负责原始目标项或结果填报本身。
 * 维护重点是 departmentId + reportDate 唯一，且 summaryJson 需要保持可回放。
 */
@Entity('performance_goal_ops_report')
@Index(['departmentId', 'reportDate'], { unique: true })
export class PerformanceGoalOpsReportEntity extends BaseEntity {
  @Column({ comment: '部门ID' })
  departmentId: number;

  @Column({ comment: '日报日期', type: 'varchar', length: 10 })
  reportDate: string;

  @Index()
  @Column({ comment: '日报状态', length: 32, default: 'generated' })
  status: string;

  @Column({ comment: '日报摘要JSON', type: 'longtext' })
  summaryJson: string;

  @Column({ comment: '生成时间', type: 'varchar', length: 19 })
  generatedAt: string;

  @Column({ comment: '发送时间', type: 'varchar', length: 19, nullable: true })
  sentAt: string | null;

  @Column({ comment: '发送方式', length: 32, default: 'system_only' })
  pushMode: string;

  @Column({ comment: '发送目标', length: 200, nullable: true })
  pushTarget: string | null;

  @Column({ comment: '生成人ID', nullable: true })
  generatedBy: number | null;

  @Column({ comment: '最后操作人ID', nullable: true })
  operatedBy: number | null;

  @Column({ comment: '拦截或延期原因', type: 'text', nullable: true })
  operationRemark: string | null;
}
