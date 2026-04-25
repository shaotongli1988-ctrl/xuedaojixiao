/**
 * 招聘人才资产主表实体。
 * 这里只承载主题12冻结的人才资产摘要字段，不负责联系方式、身份信息、简历全文、附件全文或录用决策全文。
 * 维护重点是 `code` 可空唯一、状态默认值和字段边界必须与冻结事实源一致。
 */
import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_talent_asset')
export class PerformanceTalentAssetEntity extends BaseEntity {
  @Index()
  @Column({ comment: '人才资产名称', length: 100 })
  candidateName: string;

  @Index('uk_performance_talent_asset_code', { unique: true })
  @Column({ comment: '人才资产编码', length: 100, nullable: true })
  code: string | null;

  @Index()
  @Column({ comment: '目标部门 ID' })
  targetDepartmentId: number;

  @Column({ comment: '目标岗位摘要', length: 100, nullable: true })
  targetPosition: string | null;

  @Column({ comment: '来源摘要', length: 100 })
  source: string;

  @Column({
    comment: '标签列表',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  tagList: string[];

  @Column({ comment: '跟进摘要', type: 'text', nullable: true })
  followUpSummary: string | null;

  @Column({ comment: '下次跟进日期', type: 'varchar', length: 19, nullable: true })
  nextFollowUpDate: string | null;

  @Index()
  @Column({ comment: '状态', length: 20, default: 'new' })
  status: string;
}
