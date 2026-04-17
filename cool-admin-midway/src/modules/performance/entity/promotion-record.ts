/**
 * 晋升评审记录实体定义。
 * 这里只声明单次评审记录字段，不负责晋升主单状态更新或评审权限判断。
 * 维护重点是记录只追加不覆写，并保持 reviewer/decision/comment 与事实源一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 晋升评审记录表。
 * 这里只承载单次评审结论和意见，不负责晋升主状态本身。
 */
@Entity('performance_promotion_record')
export class PerformancePromotionRecordEntity extends BaseEntity {
  @Index()
  @Column({ comment: '关联晋升单' })
  promotionId: number;

  @Index()
  @Column({ comment: '评审人' })
  reviewerId: number;

  @Index()
  @Column({ comment: '评审结论', length: 20 })
  decision: string;

  @Column({ comment: '评审意见', type: 'text', nullable: true })
  comment: string;
}
