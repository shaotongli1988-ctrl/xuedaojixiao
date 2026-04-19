/**
 * 班主任资源归因实体。
 * 这里只记录主题19 V0.2 冻结的当前归因与历史归因，不负责审批、结算或复杂归因算法。
 * 维护重点是同一班主任只能有一条当前有效归因，冲突候选不得直接覆盖现有有效归因。
 */
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

@Entity('performance_teacher_attribution')
export class PerformanceTeacherAttributionEntity extends BaseEntity {
  @Index()
  @Column({ comment: '班主任资源 ID' })
  teacherId: number;

  @Index()
  @Column({ comment: '代理主体 ID', nullable: true })
  agentId: number | null;

  @Column({ comment: '归因类型', length: 20 })
  attributionType: string;

  @Index()
  @Column({ comment: '归因状态', length: 20, default: 'active' })
  status: string;

  @Column({ comment: '来源类型', length: 30, nullable: true })
  sourceType: string | null;

  @Column({ comment: '来源说明', type: 'text', nullable: true })
  sourceRemark: string | null;

  @Index()
  @Column({ comment: '生效时间', type: 'varchar', length: 19, nullable: true })
  effectiveTime: string | null;

  @Index()
  @Column({ comment: '操作人 ID', nullable: true })
  operatorId: number | null;

  @Column({ comment: '操作人名称', length: 100, nullable: true })
  operatorName: string | null;
}
