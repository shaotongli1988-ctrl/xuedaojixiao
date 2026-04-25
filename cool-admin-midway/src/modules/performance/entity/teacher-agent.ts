/**
 * 代理主体实体。
 * 这里只承载主题19 V0.2 冻结的代理主体最小档案字段，不负责结算、分佣、合同或复杂经营统计。
 * 维护重点是状态、黑名单与部门范围字段必须稳定，以支撑归因约束和只读/可写权限裁剪。
 */
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

@Entity('performance_teacher_agent')
export class PerformanceTeacherAgentEntity extends BaseEntity {
  @Index()
  @Column({ comment: '代理主体名称', length: 100 })
  name: string;

  @Index()
  @Column({ comment: '代理主体类型', length: 20 })
  agentType: string;

  @Column({ comment: '代理等级', length: 30, nullable: true })
  level: string | null;

  @Column({ comment: '区域', length: 50, nullable: true })
  region: string | null;

  @Column({ comment: '合作状态', length: 30, nullable: true })
  cooperationStatus: string | null;

  @Index()
  @Column({ comment: '主体状态', length: 20, default: 'active' })
  status: string;

  @Index()
  @Column({ comment: '黑名单状态', length: 20, default: 'normal' })
  blacklistStatus: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string | null;

  @Index()
  @Column({ comment: '归属员工 ID' })
  ownerEmployeeId: number;

  @Index()
  @Column({ comment: '归属部门 ID' })
  ownerDepartmentId: number;
}
