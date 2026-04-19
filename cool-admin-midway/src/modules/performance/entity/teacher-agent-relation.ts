/**
 * 代理上下级关系实体。
 * 这里只记录主题19 V0.2 冻结的代理树关系，不负责代理经营统计、结算链路或跨主题资源挂接。
 * 维护重点是父子关系不得成环，且停用主体不能形成新的有效关系。
 */
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

@Entity('performance_teacher_agent_relation')
export class PerformanceTeacherAgentRelationEntity extends BaseEntity {
  @Index()
  @Column({ comment: '父级代理 ID' })
  parentAgentId: number;

  @Index()
  @Column({ comment: '子级代理 ID' })
  childAgentId: number;

  @Index()
  @Column({ comment: '关系状态', length: 20, default: 'active' })
  status: string;

  @Index()
  @Column({ comment: '生效时间', type: 'varchar', length: 19, nullable: true })
  effectiveTime: string | null;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;

  @Index()
  @Column({ comment: '归属员工 ID' })
  ownerEmployeeId: number;

  @Index()
  @Column({ comment: '归属部门 ID' })
  ownerDepartmentId: number;
}
