/**
 * 自动审批流配置实体。
 * 这里只保存 assessment / promotion 两类对象的启用状态和版本，不负责节点快照、实例状态或权限判断。
 * 维护重点是 objectType 唯一，避免同一对象类型出现多份生效配置。
 */
import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('performance_approval_config')
@Index('uk_approval_config_object_type', ['objectType'], { unique: true })
export class PerformanceApprovalConfigEntity extends BaseEntity {
  @Column({ comment: '审批对象类型', length: 30 })
  objectType: string;

  @Index()
  @Column({ comment: '配置版本号', length: 30 })
  version: string;

  @Index()
  @Column({ comment: '是否启用', default: false })
  enabled: boolean;

  @Column({
    comment: '通知模式',
    length: 30,
    default: 'interface_only',
  })
  notifyMode: string;
}
