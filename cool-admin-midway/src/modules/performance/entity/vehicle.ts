/**
 * 车辆管理台账主表。
 * 这里只承载 vehicle 的 HR-only 元数据台账，不负责用车申请、调度、保养流程或违章处置。
 * 维护重点是 vehicleNo / plateNo 唯一性、固定状态/类型枚举和到期日期边界必须与台账契约一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_vehicle')
export class PerformanceVehicleEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '车辆编号', length: 64 })
  vehicleNo: string;

  @Index({ unique: true })
  @Column({ comment: '车牌号', length: 32 })
  plateNo: string;

  @Column({ comment: '品牌', length: 100 })
  brand: string;

  @Column({ comment: '型号', length: 100 })
  model: string;

  @Index()
  @Column({ comment: '车辆类型', length: 32 })
  vehicleType: string;

  @Column({ comment: '归属部门', length: 100 })
  ownerDepartment: string;

  @Column({ comment: '管理员', length: 100 })
  managerName: string;

  @Column({ comment: '座位数', type: 'int', default: 5 })
  seats: number;

  @Column({ comment: '登记日期', type: 'varchar', length: 10 })
  registerDate: string;

  @Column({ comment: '年检到期日', type: 'varchar', length: 10, nullable: true })
  inspectionDueDate: string | null;

  @Column({ comment: '保险到期日', type: 'varchar', length: 10, nullable: true })
  insuranceDueDate: string | null;

  @Index()
  @Column({ comment: '状态', length: 32, default: 'idle' })
  status: string;

  @Column({ comment: '使用范围', type: 'text', nullable: true })
  usageScope: string | null;

  @Column({ comment: '备注', type: 'text', nullable: true })
  notes: string | null;
}
