import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 能力模型主表。
 * 这里只承载主题13冻结的能力地图模型定义，不负责画像原始评估过程、课程学习过程或人才资产主链。
 */
@Entity('performance_capability_model')
export class PerformanceCapabilityModelEntity extends BaseEntity {
  @Index()
  @Column({ comment: '模型名称', length: 200 })
  name: string;

  @Index('uk_performance_capability_model_code', { unique: true })
  @Column({ comment: '模型编码', length: 100, nullable: true })
  code: string | null;

  @Index()
  @Column({ comment: '模型分类', length: 100, nullable: true })
  category: string | null;

  @Column({ comment: '模型说明', type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ comment: '模型状态', length: 20, default: 'draft' })
  status: string;
}
