/**
 * 资产领用申请实体。
 * 这里只承载 Theme20 L1/L2 领用申请、审批绑定、待配发和异常补领最小字段，
 * 不负责真实资产归还、丢失或审批流节点明细。
 * 维护重点是申请状态、审批实例和正式配发记录的关联必须保持一致，避免申请层与执行层错位。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_asset_assignment_request')
export class PerformanceAssetAssignmentRequestEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '申请编号', length: 50 })
  requestNo: string;

  @Index()
  @Column({ comment: '申请层级', length: 20 })
  requestLevel: string;

  @Index()
  @Column({ comment: '申请类型', length: 30, default: 'standard' })
  requestType: string;

  @Index()
  @Column({ comment: '申请人 ID' })
  applicantId: number;

  @Index()
  @Column({ comment: '申请人部门 ID' })
  applicantDepartmentId: number;

  @Column({ comment: '资产分类', length: 100 })
  assetCategory: string;

  @Column({ comment: '型号需求', type: 'varchar', length: 200, nullable: true })
  assetModelRequest: string | null;

  @Column({ comment: '数量', default: 1 })
  quantity: number;

  @Column({ comment: '预估单价', type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitPriceEstimate: number;

  @Column({ comment: '用途说明', type: 'text', nullable: true })
  usageReason: string | null;

  @Column({ comment: '预期使用日期', type: 'varchar', length: 10, nullable: true })
  expectedUseStartDate: string | null;

  @Index()
  @Column({ comment: '目标部门 ID', nullable: true })
  targetDepartmentId: number | null;

  @Column({ comment: '异常原因', type: 'text', nullable: true })
  exceptionReason: string | null;

  @Index()
  @Column({ comment: '原资产 ID', nullable: true })
  originalAssetId: number | null;

  @Index()
  @Column({ comment: '原领用记录 ID', nullable: true })
  originalAssignmentId: number | null;

  @Index()
  @Column({ comment: '审批实例 ID', nullable: true })
  approvalInstanceId: number | null;

  @Column({ comment: '审批状态', length: 30, nullable: true })
  approvalStatus: string | null;

  @Index()
  @Column({ comment: '当前审批人 ID', nullable: true })
  currentApproverId: number | null;

  @Column({ comment: '命中规则快照', type: 'text', nullable: true })
  approvalTriggeredRules: string | null;

  @Index()
  @Column({ comment: '已配发资产 ID', nullable: true })
  assignedAssetId: number | null;

  @Index()
  @Column({ comment: '正式领用记录 ID', nullable: true })
  assignmentRecordId: number | null;

  @Index()
  @Column({ comment: '配发人 ID', nullable: true })
  assignedBy: number | null;

  @Column({ comment: '配发时间', type: 'varchar', length: 19, nullable: true })
  assignedAt: string | null;

  @Index()
  @Column({ comment: '请求单状态', length: 30, default: 'draft' })
  status: string;

  @Column({ comment: '提交时间', type: 'varchar', length: 19, nullable: true })
  submitTime: string | null;

  @Column({ comment: '撤回时间', type: 'varchar', length: 19, nullable: true })
  withdrawTime: string | null;

  @Column({ comment: '取消原因', length: 500, nullable: true })
  cancelReason: string | null;
}
