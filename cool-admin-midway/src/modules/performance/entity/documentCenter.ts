/**
 * 文件管理元数据主表。
 * 这里只承载主题21首批冻结的文件台账元数据，不负责二进制上传、目录树、权限继承或真实存储凭证。
 * 维护重点是状态集合、筛选字段和返回边界必须与 documentCenter 冻结契约一致。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_document_center')
export class PerformanceDocumentCenterEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '文件编号', length: 64 })
  fileNo: string;

  @Index()
  @Column({ comment: '文件名称', length: 200 })
  fileName: string;

  @Index()
  @Column({ comment: '文件分类', length: 32 })
  category: string;

  @Index()
  @Column({ comment: '文件类型', length: 32 })
  fileType: string;

  @Index()
  @Column({ comment: '存储方式', length: 32 })
  storage: string;

  @Index()
  @Column({ comment: '保密级别', length: 32 })
  confidentiality: string;

  @Column({ comment: '负责人', length: 100 })
  ownerName: string;

  @Column({ comment: '部门名称', length: 100 })
  department: string;

  @Index()
  @Column({ comment: '状态', length: 32, default: 'draft' })
  status: string;

  @Column({ comment: '版本号', length: 32 })
  version: string;

  @Column({
    comment: '容量(MB)',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  sizeMb: number;

  @Column({ comment: '下载次数', type: 'int', default: 0 })
  downloadCount: number;

  @Column({ comment: '失效日期', type: 'varchar', length: 10, nullable: true })
  expireDate: string | null;

  @Column({ comment: '标签 JSON', type: 'text', nullable: true })
  tags: string | null;

  @Column({ comment: '备注', type: 'text', nullable: true })
  notes: string | null;
}
