import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 指标库实体。
 * 这里只承载指标配置主数据，不负责评估单或环评对指标的引用关系。
 */
@Entity('performance_indicator')
export class PerformanceIndicatorEntity extends BaseEntity {
  @Index()
  @Column({ comment: '指标名称', length: 100 })
  name: string;

  @Index('uk_performance_indicator_code', { unique: true })
  @Column({ comment: '指标编码', length: 50 })
  code: string;

  @Index()
  @Column({ comment: '指标类型', length: 30, default: 'assessment' })
  category: string;

  @Column({
    comment: '权重',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  weight: number;

  @Column({ comment: '满分', type: 'int', default: 100 })
  scoreScale: number;

  @Column({ comment: '适用范围', length: 50, default: 'all' })
  applyScope: string;

  @Column({ comment: '说明', length: 500, nullable: true })
  description: string;

  @Index()
  @Column({ comment: '状态', type: 'tinyint', default: 1 })
  status: number;
}
