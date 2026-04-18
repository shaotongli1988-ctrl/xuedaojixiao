/**
 * 会议主表实体。
 * 这里只承载会议主链摘要字段、组织者、参与人快照和会议级签到时间；
 * 不负责参与人名单返回、逐人签到明细、纪要 / 评论全文或外部会议系统集成。
 */
import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_meeting')
export class PerformanceMeetingEntity extends BaseEntity {
  @Index()
  @Column({ comment: '会议标题', length: 200 })
  title: string;

  @Index()
  @Column({ comment: '会议编码', length: 100, nullable: true })
  code: string | null;

  @Column({ comment: '会议类型', length: 100, nullable: true })
  type: string | null;

  @Column({ comment: '会议描述', type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ comment: '开始时间', type: 'varchar', length: 19 })
  startDate: string;

  @Index()
  @Column({ comment: '结束时间', type: 'varchar', length: 19 })
  endDate: string;

  @Column({ comment: '会议地点', length: 200, nullable: true })
  location: string | null;

  @Index()
  @Column({ comment: '组织者' })
  organizerId: number;

  @Column({
    comment: '参与人列表快照',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  participantIds: number[];

  @Column({ comment: '参与人数', default: 0 })
  participantCount: number;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'scheduled' })
  status: string;

  @Index()
  @Column({
    comment: '最近会议级签到时间',
    type: 'varchar',
    length: 19,
    nullable: true,
  })
  lastCheckInTime: string | null;
}
