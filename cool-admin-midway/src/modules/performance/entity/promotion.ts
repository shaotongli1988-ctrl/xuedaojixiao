/**
 * 晋升单实体定义。
 * 这里只声明晋升申请主表字段，不负责评审记录、状态流转规则或权限判断。
 * 维护重点是字段名、可空性和默认状态必须与数据库设计和 API 契约一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 晋升申请主表。
 * 这里只承载晋升单核心状态和来源信息，不负责评审意见明细行存储。
 */
@Entity('performance_promotion')
export class PerformancePromotionEntity extends BaseEntity {
  @Index()
  @Column({ comment: '来源评估单', nullable: true })
  assessmentId: number;

  @Index()
  @Column({ comment: '员工' })
  employeeId: number;

  @Index()
  @Column({ comment: '发起人' })
  sponsorId: number;

  @Column({ comment: '当前岗位', length: 100 })
  fromPosition: string;

  @Column({ comment: '目标岗位', length: 100 })
  toPosition: string;

  @Column({ comment: '发起原因', type: 'text', nullable: true })
  reason: string;

  @Column({ comment: '独立创建原因', length: 500, nullable: true })
  sourceReason: string;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'draft' })
  status: string;

  @Index()
  @Column({ comment: '评审时间', type: 'varchar', length: 19, nullable: true })
  reviewTime: string;
}
