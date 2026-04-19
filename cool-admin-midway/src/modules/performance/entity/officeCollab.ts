/**
 * 行政协同主题22共享元数据主表。
 * 这里只承接年检材料、荣誉管理、宣传资料、美工协同和快递协同的后台台账元数据，
 * 不负责真实文件上传、审批流、物流签收回执或费用结算。
 * 维护重点是 moduleKey + recordNo 唯一性、publicityMaterial 的关联文件引用和模块状态边界必须与 Theme22 冻结契约一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_office_collab')
@Index(['moduleKey', 'recordNo'], { unique: true })
export class PerformanceOfficeCollabEntity extends BaseEntity {
  @Index()
  @Column({ comment: '模块键', length: 64 })
  moduleKey: string;

  @Column({ comment: '记录编号', length: 64 })
  recordNo: string;

  @Index()
  @Column({ comment: '标题', length: 200 })
  title: string;

  @Index()
  @Column({ comment: '状态', length: 32, default: 'draft' })
  status: string;

  @Column({ comment: '所属部门', length: 100, nullable: true })
  department: string | null;

  @Column({ comment: '负责人/发起人', length: 100, nullable: true })
  ownerName: string | null;

  @Column({ comment: '协作人/接收人', length: 100, nullable: true })
  assigneeName: string | null;

  @Column({ comment: '主分类', length: 64, nullable: true })
  category: string | null;

  @Column({ comment: '优先级', length: 32, nullable: true })
  priority: string | null;

  @Column({ comment: '版本号', length: 32, nullable: true })
  version: string | null;

  @Column({ comment: '截止日期', type: 'varchar', length: 19, nullable: true })
  dueDate: string | null;

  @Column({ comment: '事件日期/最近事件时间', type: 'varchar', length: 19, nullable: true })
  eventDate: string | null;

  @Column({ comment: '进度/完整度', type: 'int', default: 0 })
  progressValue: number;

  @Column({ comment: '评分/浏览量', type: 'int', default: 0 })
  scoreValue: number;

  @Index()
  @Column({ comment: '关联文件ID', nullable: true })
  relatedDocumentId: number | null;

  @Column({ comment: '扩展 JSON', type: 'text', nullable: true })
  extJson: string | null;

  @Column({ comment: '备注', type: 'text', nullable: true })
  notes: string | null;
}
