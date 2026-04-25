/**
 * 资产领用记录实体。
 * 这里只承载主题20冻结的领用/归还/丢失最小记录，不负责人事主数据、审批流或员工自助入口。
 * 维护重点是领用状态与资产主状态回写必须保持一致，且部门负责人只能在本人部门树范围内操作。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_asset_assignment')
export class PerformanceAssetAssignmentEntity extends BaseEntity {
  @Index()
  @Column({ comment: '资产 ID' })
  assetId: number;

  @Index()
  @Column({ comment: '领用人 ID' })
  assigneeId: number;

  @Index()
  @Column({ comment: '领用部门 ID' })
  departmentId: number;

  @Column({ comment: '领用日期', type: 'varchar', length: 10 })
  assignDate: string;

  @Column({ comment: '归还日期', type: 'varchar', length: 10, nullable: true })
  returnDate: string | null;

  @Index()
  @Column({ comment: '领用状态', length: 20, default: 'assigned' })
  status: string;

  @Column({ comment: '领用用途', type: 'text', nullable: true })
  purpose: string | null;

  @Column({ comment: '归还说明', type: 'text', nullable: true })
  returnNote: string | null;
}
