/**
 * 班主任渠道合作后端核心服务。
 * 这里统一承载主题19冻结的 teacherInfo / teacherFollow / teacherCooperation / teacherClass / teacherDashboard / teacherTodo 最小闭环，
 * 不负责代理体系、绩效、结算、复杂报表、附件上传或外部通知。
 * 维护重点是四档数据范围、只读脱敏、合作/班级状态机和跨资源归属一致性必须由服务端硬兜底。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import { PerformanceTeacherAgentAuditEntity } from '../entity/teacher-agent-audit';
import { PerformanceTeacherAgentRelationEntity } from '../entity/teacher-agent-relation';
import { PerformanceTeacherAgentEntity } from '../entity/teacher-agent';
import { PerformanceTeacherAttributionConflictEntity } from '../entity/teacher-attribution-conflict';
import { PerformanceTeacherAttributionEntity } from '../entity/teacher-attribution';
import { PerformanceTeacherClassEntity } from '../entity/teacher-class';
import { PerformanceTeacherFollowEntity } from '../entity/teacher-follow';
import { PerformanceTeacherInfoEntity } from '../entity/teacher-info';
import {
  resolvePermissionMask,
} from '../../base/generated/permission-bits.generated';
import {
  TEACHER_CHANNEL_CLASS_STATUS_VALUES,
  TEACHER_CHANNEL_COOPERATION_STATUS_VALUES,
} from './teacher-channel-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

type TeacherCooperationStatus =
  | 'uncontacted'
  | 'contacted'
  | 'negotiating'
  | 'partnered'
  | 'terminated';
type TeacherClassStatus = 'draft' | 'active' | 'closed';
type TeacherAgentStatus = 'active' | 'inactive';
type TeacherAgentBlacklistStatus = 'normal' | 'blacklisted';
type TeacherAgentRelationStatus = 'active' | 'inactive';
type TeacherAttributionStatus = 'pending' | 'active' | 'removed' | 'conflicted';
type TeacherAttributionConflictStatus = 'open' | 'resolved' | 'cancelled';
type TeacherScopeType = 'global' | 'department' | 'self';
type TeacherTodoBucket = 'today' | 'overdue';

interface TeacherAccessScope {
  scopeType: TeacherScopeType;
  userId: number;
  userName: string;
  userDepartmentId: number;
  departmentIds: number[] | null;
  isReadonly: boolean;
  canAssign: boolean;
  canCloseClass: boolean;
  canTerminateTeacher: boolean;
}

interface TeacherAccessProfile {
  permissionMask: string;
  scopeType: TeacherScopeType;
  isReadonly: boolean;
  scopedDepartmentIds: number[];
  scopedTeacherIds: number[];
  scopedClassIds: number[];
}

const TEACHER_COOPERATION_STATUS: TeacherCooperationStatus[] = [
  ...TEACHER_CHANNEL_COOPERATION_STATUS_VALUES,
];
const TEACHER_CLASS_STATUS: TeacherClassStatus[] = [
  ...TEACHER_CHANNEL_CLASS_STATUS_VALUES,
];
const TEACHER_AGENT_STATUS: TeacherAgentStatus[] = ['active', 'inactive'];
const TEACHER_AGENT_BLACKLIST_STATUS: TeacherAgentBlacklistStatus[] = [
  'normal',
  'blacklisted',
];
const TEACHER_AGENT_RELATION_STATUS: TeacherAgentRelationStatus[] = [
  'active',
  'inactive',
];
const TEACHER_ATTRIBUTION_STATUS: TeacherAttributionStatus[] = [
  'pending',
  'active',
  'removed',
  'conflicted',
];
const TEACHER_ATTRIBUTION_CONFLICT_STATUS: TeacherAttributionConflictStatus[] = [
  'open',
  'resolved',
  'cancelled',
];
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_READONLY_WRITE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.readonlyWriteDenied
  );
const PERFORMANCE_TEACHER_CLASS_CLOSED_EDIT_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassClosedEditDenied
  );
const PERFORMANCE_TEACHER_CLASS_CREATE_PARTNERED_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCreatePartneredOnly
  );
const PERFORMANCE_TEACHER_CLASS_DELETE_DRAFT_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassDeleteDraftOnly
  );
const PERFORMANCE_TEACHER_CLASS_DRAFT_TRANSITION_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassDraftTransitionOnly
  );
const PERFORMANCE_TEACHER_CLASS_ACTION_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassActionNotAllowed
  );
const PERFORMANCE_TEACHER_NEGOTIATING_TRANSITION_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherNegotiatingTransitionDenied
  );
const PERFORMANCE_TEACHER_TERMINATE_ROLE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherTerminateRoleDenied
  );
const PERFORMANCE_TEACHER_TERMINATE_PARTNERED_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherTerminatePartneredOnly
  );
const PERFORMANCE_TEACHER_STATUS_ACTION_UNSUPPORTED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherStatusActionUnsupported
  );
const PERFORMANCE_TEACHER_COOPERATION_MARK_FOLLOW_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationMarkFollowRequired
  );
const PERFORMANCE_TEACHER_COOPERATION_MARK_STATE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationMarkStateDenied
  );
const PERFORMANCE_TEACHER_CLASS_CREATE_TERMINATED_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCreateTerminatedDenied
  );
const PERFORMANCE_TEACHER_COOPERATION_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationStatusInvalid
  );
const PERFORMANCE_TEACHER_CLASS_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassStatusInvalid
  );
const PERFORMANCE_TEACHER_COOPERATION_STATUS_PRESET_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherCooperationStatusPresetDenied
  );
const PERFORMANCE_TEACHER_ASSIGN_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAssignDenied
  );
const PERFORMANCE_TEACHER_ASSIGN_TARGET_DEPARTMENT_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAssignTargetDepartmentDenied
  );
const PERFORMANCE_TEACHER_CLASS_CLOSE_ROLE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherClassCloseRoleDenied
  );
const PERFORMANCE_TEACHER_AGENT_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentStatusInvalid
  );
const PERFORMANCE_TEACHER_AGENT_BLACKLIST_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentBlacklistStatusInvalid
  );
const PERFORMANCE_TEACHER_AGENT_RELATION_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationStatusInvalid
  );
const PERFORMANCE_TEACHER_AGENT_AUDIT_VIEW_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentAuditViewDenied
  );
const PERFORMANCE_TEACHER_AGENT_RELATION_SELF_LOOP_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationSelfLoopDenied
  );
const PERFORMANCE_TEACHER_AGENT_RELATION_TARGET_INACTIVE_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentRelationTargetInactive
  );
const PERFORMANCE_TEACHER_AGENT_CYCLE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAgentCycleDenied
  );
const PERFORMANCE_TEACHER_ATTRIBUTION_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionStatusInvalid
  );
const PERFORMANCE_TEACHER_ATTRIBUTION_CONFLICT_RESOLVE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictResolveDenied
  );
const PERFORMANCE_TEACHER_ATTRIBUTION_CREATE_TERMINATED_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionCreateTerminatedDenied
  );
const PERFORMANCE_TEACHER_ATTRIBUTION_ASSIGN_EXISTING_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAssignExistingDenied
  );
const PERFORMANCE_TEACHER_ATTRIBUTION_AGENT_INACTIVE_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAgentInactive
  );
const PERFORMANCE_TEACHER_ATTRIBUTION_AGENT_BLACKLISTED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionAgentBlacklisted
  );
const PERFORMANCE_TEACHER_ATTRIBUTION_CONFLICT_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictStatusInvalid
  );
const PERFORMANCE_TEACHER_ATTRIBUTION_CONFLICT_CLOSED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictClosed
  );
const PERFORMANCE_TEACHER_ATTRIBUTION_CONFLICT_RESOLUTION_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherAttributionConflictResolutionInvalid
  );
const PERFORMANCE_TEACHER_CURRENT_ATTRIBUTION_MISSING_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.teacherCurrentAttributionMissing
  );

const TEACHER_PERMISSIONS = {
  teacherAgentAdd: PERMISSIONS.performance.teacherAgent.add,
  teacherAgentBlacklist: PERMISSIONS.performance.teacherAgent.blacklist,
  teacherAgentInfo: PERMISSIONS.performance.teacherAgent.info,
  teacherAgentPage: PERMISSIONS.performance.teacherAgent.page,
  teacherAgentUnblacklist: PERMISSIONS.performance.teacherAgent.unblacklist,
  teacherAgentUpdate: PERMISSIONS.performance.teacherAgent.update,
  teacherAgentUpdateStatus: PERMISSIONS.performance.teacherAgent.updateStatus,
  teacherAgentAuditInfo: PERMISSIONS.performance.teacherAgentAudit.info,
  teacherAgentAuditPage: PERMISSIONS.performance.teacherAgentAudit.page,
  teacherAgentRelationAdd: PERMISSIONS.performance.teacherAgentRelation.add,
  teacherAgentRelationDelete: PERMISSIONS.performance.teacherAgentRelation.delete,
  teacherAgentRelationPage: PERMISSIONS.performance.teacherAgentRelation.page,
  teacherAgentRelationUpdate: PERMISSIONS.performance.teacherAgentRelation.update,
  teacherAttributionAssign: PERMISSIONS.performance.teacherAttribution.assign,
  teacherAttributionChange: PERMISSIONS.performance.teacherAttribution.change,
  teacherAttributionInfo: PERMISSIONS.performance.teacherAttribution.info,
  teacherAttributionPage: PERMISSIONS.performance.teacherAttribution.page,
  teacherAttributionRemove: PERMISSIONS.performance.teacherAttribution.remove,
  teacherAttributionConflictCreate:
    PERMISSIONS.performance.teacherAttributionConflict.create,
  teacherAttributionConflictInfo:
    PERMISSIONS.performance.teacherAttributionConflict.info,
  teacherAttributionConflictPage:
    PERMISSIONS.performance.teacherAttributionConflict.page,
  teacherAttributionConflictResolve:
    PERMISSIONS.performance.teacherAttributionConflict.resolve,
  teacherClassAdd: PERMISSIONS.performance.teacherClass.add,
  teacherClassDelete: PERMISSIONS.performance.teacherClass.delete,
  teacherClassInfo: PERMISSIONS.performance.teacherClass.info,
  teacherClassPage: PERMISSIONS.performance.teacherClass.page,
  teacherClassUpdate: PERMISSIONS.performance.teacherClass.update,
  teacherCooperationMark: PERMISSIONS.performance.teacherCooperation.mark,
  teacherDashboardSummary: PERMISSIONS.performance.teacherDashboard.summary,
  teacherFollowAdd: PERMISSIONS.performance.teacherFollow.add,
  teacherFollowPage: PERMISSIONS.performance.teacherFollow.page,
  teacherInfoAdd: PERMISSIONS.performance.teacherInfo.add,
  teacherInfoAssign: PERMISSIONS.performance.teacherInfo.assign,
  teacherInfoAttributionHistory:
    PERMISSIONS.performance.teacherInfo.attributionHistory,
  teacherInfoAttributionInfo: PERMISSIONS.performance.teacherInfo.attributionInfo,
  teacherInfoInfo: PERMISSIONS.performance.teacherInfo.info,
  teacherInfoPage: PERMISSIONS.performance.teacherInfo.page,
  teacherInfoUpdate: PERMISSIONS.performance.teacherInfo.update,
  teacherInfoUpdateStatus: PERMISSIONS.performance.teacherInfo.updateStatus,
  teacherTodoPage: PERMISSIONS.performance.teacherTodo.page,
} as const;

function normalizePageNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeRequiredText(value: any, maxLength: number, message: string) {
  const text = String(value || '').trim();

  if (!text || text.length > maxLength) {
    throw new CoolCommException(message);
  }

  return text;
}

function normalizeOptionalText(value: any, maxLength: number, message: string) {
  const text = String(value ?? '').trim();

  if (!text) {
    return null;
  }

  if (text.length > maxLength) {
    throw new CoolCommException(message);
  }

  return text;
}

function normalizeRequiredPositiveInt(value: any, message: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(message);
  }

  return parsed;
}

function normalizeOptionalNonNegativeInt(value: any, message: string) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new CoolCommException(message);
  }

  return parsed;
}

function normalizeOptionalPositiveInt(value: any, message: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(message);
  }

  return parsed;
}

function normalizeDateTime(value: any, message: string, required = false) {
  const text = String(value ?? '').trim();

  if (!text) {
    if (required) {
      throw new CoolCommException(message);
    }

    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(text)) {
    throw new CoolCommException(message);
  }

  return text.length === 10 ? `${text} 00:00:00` : text;
}

function formatNow() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    ' ',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('');
}

function normalizeTagList(value: any) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? (() => {
          const text = value.trim();

          if (!text) {
            return [];
          }

          try {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed : [text];
          } catch (error) {
            return text.split(',');
          }
        })()
      : [];

  return Array.from(
    new Set(
      source
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .map(item => item.slice(0, 30))
    )
  ).slice(0, 10);
}

function parseTagList(value: any) {
  return normalizeTagList(value);
}

function maskPhone(value?: string | null) {
  const text = String(value || '').trim();

  if (!text) {
    return null;
  }

  if (text.length <= 7) {
    return `${text.slice(0, 2)}***`;
  }

  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function maskWechat(value?: string | null) {
  const text = String(value || '').trim();

  if (!text) {
    return null;
  }

  if (text.length <= 4) {
    return `${text[0]}***`;
  }

  return `${text.slice(0, 2)}****${text.slice(-2)}`;
}

function hasKeyword(value: any, keyword: string) {
  return String(value || '').toLowerCase().includes(keyword.toLowerCase());
}

function todayKey() {
  return formatNow().slice(0, 10);
}

function resolveTodoBucket(nextFollowTime?: string | null): TeacherTodoBucket | null {
  const text = String(nextFollowTime || '').trim();

  if (!text) {
    return null;
  }

  const dateKey = text.slice(0, 10);
  const currentDateKey = todayKey();

  if (dateKey < currentDateKey) {
    return 'overdue';
  }

  if (dateKey === currentDateKey) {
    return 'today';
  }

  return null;
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceTeacherChannelCoreService extends BaseService {
  @InjectEntityModel(PerformanceTeacherInfoEntity)
  performanceTeacherInfoEntity: Repository<PerformanceTeacherInfoEntity>;

  @InjectEntityModel(PerformanceTeacherFollowEntity)
  performanceTeacherFollowEntity: Repository<PerformanceTeacherFollowEntity>;

  @InjectEntityModel(PerformanceTeacherClassEntity)
  performanceTeacherClassEntity: Repository<PerformanceTeacherClassEntity>;

  @InjectEntityModel(PerformanceTeacherAgentEntity)
  performanceTeacherAgentEntity: Repository<PerformanceTeacherAgentEntity>;

  @InjectEntityModel(PerformanceTeacherAgentRelationEntity)
  performanceTeacherAgentRelationEntity: Repository<PerformanceTeacherAgentRelationEntity>;

  @InjectEntityModel(PerformanceTeacherAttributionEntity)
  performanceTeacherAttributionEntity: Repository<PerformanceTeacherAttributionEntity>;

  @InjectEntityModel(PerformanceTeacherAttributionConflictEntity)
  performanceTeacherAttributionConflictEntity: Repository<PerformanceTeacherAttributionConflictEntity>;

  @InjectEntityModel(PerformanceTeacherAgentAuditEntity)
  performanceTeacherAgentAuditEntity: Repository<PerformanceTeacherAgentAuditEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  ctx;

  private readonly perms = TEACHER_PERMISSIONS;

  private get currentCtx() {
    return this.ctx || {};
  }

  private get currentAdmin() {
    return this.currentCtx.admin || {};
  }

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.teacherAgent.page]: 'teacher_agent.read',
    [PERMISSIONS.performance.teacherAgent.info]: 'teacher_agent.read',
    [PERMISSIONS.performance.teacherAgent.add]: 'teacher_agent.create',
    [PERMISSIONS.performance.teacherAgent.update]: 'teacher_agent.update',
    [PERMISSIONS.performance.teacherAgent.updateStatus]:
      'teacher_agent.update_status',
    [PERMISSIONS.performance.teacherAgent.blacklist]:
      'teacher_agent.blacklist',
    [PERMISSIONS.performance.teacherAgent.unblacklist]:
      'teacher_agent.unblacklist',
    [PERMISSIONS.performance.teacherAgentAudit.page]: 'teacher_agent_audit.read',
    [PERMISSIONS.performance.teacherAgentAudit.info]: 'teacher_agent_audit.read',
    [PERMISSIONS.performance.teacherAgentRelation.page]:
      'teacher_agent_relation.read',
    [PERMISSIONS.performance.teacherAgentRelation.add]:
      'teacher_agent_relation.create',
    [PERMISSIONS.performance.teacherAgentRelation.update]:
      'teacher_agent_relation.update',
    [PERMISSIONS.performance.teacherAgentRelation.delete]:
      'teacher_agent_relation.delete',
    [PERMISSIONS.performance.teacherAttribution.page]: 'teacher_attribution.read',
    [PERMISSIONS.performance.teacherAttribution.info]: 'teacher_attribution.read',
    [PERMISSIONS.performance.teacherAttribution.assign]:
      'teacher_attribution.assign',
    [PERMISSIONS.performance.teacherAttribution.change]:
      'teacher_attribution.change',
    [PERMISSIONS.performance.teacherAttribution.remove]:
      'teacher_attribution.remove',
    [PERMISSIONS.performance.teacherAttributionConflict.page]:
      'teacher_attribution_conflict.read',
    [PERMISSIONS.performance.teacherAttributionConflict.info]:
      'teacher_attribution_conflict.read',
    [PERMISSIONS.performance.teacherAttributionConflict.create]:
      'teacher_attribution_conflict.create',
    [PERMISSIONS.performance.teacherAttributionConflict.resolve]:
      'teacher_attribution_conflict.resolve',
    [PERMISSIONS.performance.teacherClass.page]: 'teacher_class.read',
    [PERMISSIONS.performance.teacherClass.info]: 'teacher_class.read',
    [PERMISSIONS.performance.teacherClass.add]: 'teacher_class.create',
    [PERMISSIONS.performance.teacherClass.update]: 'teacher_class.update',
    [PERMISSIONS.performance.teacherClass.delete]: 'teacher_class.delete',
    [PERMISSIONS.performance.teacherCooperation.mark]: 'teacher_cooperation.mark',
    [PERMISSIONS.performance.teacherDashboard.summary]:
      'teacher_dashboard.summary',
    [PERMISSIONS.performance.teacherFollow.page]: 'teacher_follow.read',
    [PERMISSIONS.performance.teacherFollow.add]: 'teacher_follow.create',
    [PERMISSIONS.performance.teacherInfo.page]: 'teacher_info.read',
    [PERMISSIONS.performance.teacherInfo.info]: 'teacher_info.read',
    [PERMISSIONS.performance.teacherInfo.add]: 'teacher_info.create',
    [PERMISSIONS.performance.teacherInfo.update]: 'teacher_info.update',
    [PERMISSIONS.performance.teacherInfo.assign]: 'teacher_info.assign',
    [PERMISSIONS.performance.teacherInfo.updateStatus]:
      'teacher_info.update_status',
    [PERMISSIONS.performance.teacherInfo.attributionHistory]:
      'teacher_info.attribution_history',
    [PERMISSIONS.performance.teacherInfo.attributionInfo]:
      'teacher_info.attribution_info',
    [PERMISSIONS.performance.teacherTodo.page]: 'teacher_todo.read',
  };

  async teacherInfoPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherInfoPage, '无权限查看班主任资源列表');

    const scope = await this.resolveScope(perms);
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const qb = this.performanceTeacherInfoEntity
      .createQueryBuilder('teacherInfo')
      .leftJoin(BaseSysUserEntity, 'owner', 'owner.id = teacherInfo.ownerEmployeeId')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = teacherInfo.ownerDepartmentId'
      )
      .select([
        'teacherInfo.id as id',
        'teacherInfo.teacherName as teacherName',
        'teacherInfo.phone as phone',
        'teacherInfo.wechat as wechat',
        'teacherInfo.schoolName as schoolName',
        'teacherInfo.schoolRegion as schoolRegion',
        'teacherInfo.schoolType as schoolType',
        'teacherInfo.grade as grade',
        'teacherInfo.className as className',
        'teacherInfo.subject as subject',
        'teacherInfo.projectTags as projectTags',
        'teacherInfo.intentionLevel as intentionLevel',
        'teacherInfo.communicationStyle as communicationStyle',
        'teacherInfo.cooperationStatus as cooperationStatus',
        'teacherInfo.ownerEmployeeId as ownerEmployeeId',
        'owner.name as ownerEmployeeName',
        'teacherInfo.ownerDepartmentId as ownerDepartmentId',
        'department.name as ownerDepartmentName',
        'teacherInfo.lastFollowTime as lastFollowTime',
        'teacherInfo.nextFollowTime as nextFollowTime',
        'teacherInfo.cooperationTime as cooperationTime',
        'teacherInfo.createTime as createTime',
        'teacherInfo.updateTime as updateTime',
      ]);

    this.applyTeacherScope(qb, scope);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('teacherInfo.teacherName like :keyword', { keyword })
            .orWhere('teacherInfo.schoolName like :keyword', { keyword })
            .orWhere('teacherInfo.phone like :keyword', { keyword });
        })
      );
    }

    if (query.cooperationStatus) {
      qb.andWhere('teacherInfo.cooperationStatus = :cooperationStatus', {
        cooperationStatus: this.normalizeTeacherStatus(query.cooperationStatus),
      });
    }

    if (query.ownerEmployeeId !== undefined && query.ownerEmployeeId !== null && query.ownerEmployeeId !== '') {
      qb.andWhere('teacherInfo.ownerEmployeeId = :ownerEmployeeId', {
        ownerEmployeeId: normalizeRequiredPositiveInt(
          query.ownerEmployeeId,
          '归属员工不存在'
        ),
      });
    }

    if (
      query.ownerDepartmentId !== undefined &&
      query.ownerDepartmentId !== null &&
      query.ownerDepartmentId !== ''
    ) {
      qb.andWhere('teacherInfo.ownerDepartmentId = :ownerDepartmentId', {
        ownerDepartmentId: normalizeRequiredPositiveInt(
          query.ownerDepartmentId,
          '归属部门不存在'
        ),
      });
    }

    qb.orderBy('teacherInfo.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();
    const classCountMap = await this.loadClassCountMap(
      list.map(item => Number(item.id || 0))
    );

    return {
      list: list.map(item =>
        this.normalizeTeacherRow(item, {
          maskSensitive: scope.isReadonly,
          classCount: classCountMap.get(Number(item.id || 0)) || 0,
        })
      ),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async teacherInfoInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherInfoInfo, '无权限查看班主任资源详情');

    const scope = await this.resolveScope(perms);
    const teacher = await this.requireTeacher(id);
    this.assertTeacherReadable(teacher, scope, '无权查看该班主任资源');
    return this.buildTeacherDetail(teacher, scope.isReadonly);
  }

  async teacherInfoAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherInfoAdd, '无权限新增班主任资源');

    const scope = await this.resolveScope(perms);
    const normalized = this.normalizeTeacherPayload(payload);
    const saved = await this.performanceTeacherInfoEntity.save(
      this.performanceTeacherInfoEntity.create({
        ...normalized,
        cooperationStatus: 'uncontacted',
        ownerEmployeeId: scope.userId,
        ownerDepartmentId: scope.userDepartmentId,
        lastFollowTime: null,
        nextFollowTime: normalized.nextFollowTime,
        cooperationTime: null,
      })
    );

    return this.teacherInfoInfo(saved.id);
  }

  async teacherInfoUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherInfoUpdate, '无权限编辑班主任资源');

    const scope = await this.resolveScope(perms);
    const teacher = await this.requireTeacher(
      normalizeRequiredPositiveInt(payload.id, '班主任资源 ID 不合法')
    );
    this.assertTeacherWritable(teacher, scope, '无权编辑该班主任资源');

    const normalized = this.normalizeTeacherPayload(payload);
    await this.performanceTeacherInfoEntity.update({ id: teacher.id }, normalized);
    return this.teacherInfoInfo(teacher.id);
  }

  async teacherInfoAssign(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.teacherInfoAssign,
      PERFORMANCE_TEACHER_ASSIGN_DENIED_MESSAGE
    );

    const scope = await this.resolveScope(perms);
    if (!scope.canAssign) {
      throw new CoolCommException(PERFORMANCE_TEACHER_ASSIGN_DENIED_MESSAGE);
    }

    const teacher = await this.requireTeacher(
      normalizeRequiredPositiveInt(payload.id, '班主任资源 ID 不合法')
    );
    this.assertTeacherReadable(teacher, scope, '无权分配该班主任资源');

    const targetUser = await this.requireUser(
      normalizeRequiredPositiveInt(payload.ownerEmployeeId, '归属员工不存在')
    );

    if (!this.canAssignTargetDepartment(scope, Number(targetUser.departmentId || 0))) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ASSIGN_TARGET_DEPARTMENT_DENIED_MESSAGE
      );
    }

    await this.performanceTeacherInfoEntity.update(
      { id: teacher.id },
      {
        ownerEmployeeId: Number(targetUser.id),
        ownerDepartmentId: Number(targetUser.departmentId || 0),
      }
    );
    await this.performanceTeacherClassEntity.update(
      { teacherId: teacher.id },
      {
        ownerEmployeeId: Number(targetUser.id),
        ownerDepartmentId: Number(targetUser.departmentId || 0),
      }
    );

    return this.teacherInfoInfo(teacher.id);
  }

  async teacherInfoUpdateStatus(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.teacherInfoUpdateStatus,
      '无权限更新班主任合作状态'
    );

    const scope = await this.resolveScope(perms);
    const teacher = await this.requireTeacher(
      normalizeRequiredPositiveInt(payload.id, '班主任资源 ID 不合法')
    );
    this.assertTeacherWritable(teacher, scope, '无权更新该班主任合作状态');

    const targetStatus = this.normalizeTeacherStatus(
      payload.status ?? payload.cooperationStatus
    );
    const currentStatus = this.normalizeTeacherStatus(teacher.cooperationStatus);

    if (targetStatus === 'negotiating') {
      if (!['contacted', 'negotiating'].includes(currentStatus)) {
        throw new CoolCommException(
          PERFORMANCE_TEACHER_NEGOTIATING_TRANSITION_DENIED_MESSAGE
        );
      }
    } else if (targetStatus === 'terminated') {
      if (!scope.canTerminateTeacher) {
        throw new CoolCommException(
          PERFORMANCE_TEACHER_TERMINATE_ROLE_DENIED_MESSAGE
        );
      }
      if (currentStatus !== 'partnered') {
        throw new CoolCommException(
          PERFORMANCE_TEACHER_TERMINATE_PARTNERED_ONLY_MESSAGE
        );
      }
    } else {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_STATUS_ACTION_UNSUPPORTED_MESSAGE
      );
    }

    await this.performanceTeacherInfoEntity.update(
      { id: teacher.id },
      { cooperationStatus: targetStatus }
    );

    return this.teacherInfoInfo(teacher.id);
  }

  async teacherFollowPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherFollowPage, '无权限查看跟进记录');

    const scope = await this.resolveScope(perms);
    const teacher = await this.requireTeacher(
      normalizeRequiredPositiveInt(query.teacherId, '班主任资源不存在')
    );
    this.assertTeacherReadable(teacher, scope, '无权查看该班主任跟进记录');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const qb = this.performanceTeacherFollowEntity
      .createQueryBuilder('teacherFollow')
      .select([
        'teacherFollow.id as id',
        'teacherFollow.teacherId as teacherId',
        'teacherFollow.followTime as followTime',
        'teacherFollow.nextFollowTime as nextFollowTime',
        'teacherFollow.followMethod as followMethod',
        'teacherFollow.followContent as followContent',
        'teacherFollow.creatorEmployeeId as creatorEmployeeId',
        'teacherFollow.creatorEmployeeName as creatorEmployeeName',
        'teacherFollow.createTime as createTime',
      ])
      .where('teacherFollow.teacherId = :teacherId', { teacherId: teacher.id })
      .orderBy('teacherFollow.followTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeFollowRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async teacherFollowAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherFollowAdd, '无权限新增跟进记录');

    const scope = await this.resolveScope(perms);
    const teacher = await this.requireTeacher(
      normalizeRequiredPositiveInt(payload.teacherId, '班主任资源不存在')
    );
    this.assertTeacherWritable(teacher, scope, '无权跟进该班主任资源');

    const followTime =
      normalizeDateTime(payload.followTime, '跟进时间不合法', false) || formatNow();
    const nextFollowTime = normalizeDateTime(payload.nextFollowTime, '下次跟进时间不合法', false);
    const follow = await this.performanceTeacherFollowEntity.save(
      this.performanceTeacherFollowEntity.create({
        teacherId: teacher.id,
        followTime,
        nextFollowTime,
        followMethod: normalizeOptionalText(payload.followMethod, 50, '跟进方式长度不合法'),
        followContent: normalizeRequiredText(
          payload.followContent ?? payload.content,
          2000,
          '跟进内容不能为空且长度不能超过 2000'
        ),
        creatorEmployeeId: scope.userId,
        creatorEmployeeName: scope.userName,
      })
    );

    await this.performanceTeacherInfoEntity.update(
      { id: teacher.id },
      {
        lastFollowTime: followTime,
        nextFollowTime,
        cooperationStatus:
          teacher.cooperationStatus === 'uncontacted' ? 'contacted' : teacher.cooperationStatus,
      }
    );

    return this.normalizeFollowRow(follow);
  }

  async teacherCooperationMark(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherCooperationMark, '无权限标记合作');

    const scope = await this.resolveScope(perms);
    const teacher = await this.requireTeacher(
      normalizeRequiredPositiveInt(payload.teacherId || payload.id, '班主任资源不存在')
    );
    this.assertTeacherWritable(teacher, scope, '无权标记该班主任合作');

    const followCount = await this.performanceTeacherFollowEntity.count({
      where: { teacherId: teacher.id },
    });

    if (followCount < 1) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_COOPERATION_MARK_FOLLOW_REQUIRED_MESSAGE
      );
    }

    if (!['contacted', 'negotiating'].includes(String(teacher.cooperationStatus || '').trim())) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_COOPERATION_MARK_STATE_DENIED_MESSAGE
      );
    }

    await this.performanceTeacherInfoEntity.update(
      { id: teacher.id },
      {
        cooperationStatus: 'partnered',
        cooperationTime: formatNow(),
      }
    );

    return this.teacherInfoInfo(teacher.id);
  }

  async teacherClassPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherClassPage, '无权限查看班级列表');

    const scope = await this.resolveScope(perms);
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const qb = this.performanceTeacherClassEntity
      .createQueryBuilder('teacherClass')
      .select([
        'teacherClass.id as id',
        'teacherClass.teacherId as teacherId',
        'teacherClass.teacherName as teacherName',
        'teacherClass.className as className',
        'teacherClass.schoolName as schoolName',
        'teacherClass.grade as grade',
        'teacherClass.projectTag as projectTag',
        'teacherClass.studentCount as studentCount',
        'teacherClass.status as status',
        'teacherClass.ownerEmployeeId as ownerEmployeeId',
        'teacherClass.ownerDepartmentId as ownerDepartmentId',
        'teacherClass.createTime as createTime',
        'teacherClass.updateTime as updateTime',
      ]);

    this.applyClassScope(qb, scope);

    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('teacherClass.className like :keyword', { keyword })
            .orWhere('teacherClass.teacherName like :keyword', { keyword })
            .orWhere('teacherClass.schoolName like :keyword', { keyword });
        })
      );
    }

    if (query.status) {
      qb.andWhere('teacherClass.status = :status', {
        status: this.normalizeClassStatus(query.status),
      });
    }

    if (query.teacherId !== undefined && query.teacherId !== null && query.teacherId !== '') {
      qb.andWhere('teacherClass.teacherId = :teacherId', {
        teacherId: normalizeRequiredPositiveInt(query.teacherId, '班主任资源不存在'),
      });
    }

    qb.orderBy('teacherClass.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeClassRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async teacherClassInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherClassInfo, '无权限查看班级详情');

    const scope = await this.resolveScope(perms);
    const teacherClass = await this.requireTeacherClass(id);
    this.assertClassReadable(teacherClass, scope, '无权查看该班级');
    return this.normalizeClassRow(teacherClass);
  }

  async teacherClassAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherClassAdd, '无权限新增班级');

    const scope = await this.resolveScope(perms);
    const teacher = await this.requireTeacher(
      normalizeRequiredPositiveInt(payload.teacherId, '班主任资源不存在')
    );
    this.assertTeacherWritable(teacher, scope, '无权为该班主任创建班级');

    if (teacher.cooperationStatus === 'terminated') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_CLASS_CREATE_TERMINATED_DENIED_MESSAGE
      );
    }

    if (teacher.cooperationStatus !== 'partnered') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_CLASS_CREATE_PARTNERED_ONLY_MESSAGE
      );
    }

    const normalized = this.normalizeClassPayload(payload, teacher);
    const saved = await this.performanceTeacherClassEntity.save(
      this.performanceTeacherClassEntity.create({
        ...normalized,
        teacherId: teacher.id,
        teacherName: teacher.teacherName,
        schoolName: teacher.schoolName,
        grade: teacher.grade,
        ownerEmployeeId: teacher.ownerEmployeeId,
        ownerDepartmentId: teacher.ownerDepartmentId,
        status: 'draft',
      })
    );

    return this.teacherClassInfo(saved.id);
  }

  async teacherClassUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherClassUpdate, '无权限编辑班级');

    const scope = await this.resolveScope(perms);
    const teacherClass = await this.requireTeacherClass(
      normalizeRequiredPositiveInt(payload.id, '班级 ID 不合法')
    );
    this.assertClassWritable(teacherClass, scope, '无权编辑该班级');

    if (teacherClass.status === 'closed') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_CLASS_CLOSED_EDIT_DENIED_MESSAGE
      );
    }

    const teacher = await this.requireTeacher(teacherClass.teacherId);
    const normalized = this.normalizeClassPayload(payload, teacher, teacherClass);
    const targetStatus = payload.status
      ? this.normalizeClassStatus(payload.status)
      : this.normalizeClassStatus(teacherClass.status);

    this.assertClassTransition(teacherClass.status as TeacherClassStatus, targetStatus, scope);

    await this.performanceTeacherClassEntity.update(
      { id: teacherClass.id },
      {
        ...normalized,
        status: targetStatus,
        teacherName: teacher.teacherName,
        schoolName: teacher.schoolName,
        grade: teacher.grade,
        ownerEmployeeId: teacher.ownerEmployeeId,
        ownerDepartmentId: teacher.ownerDepartmentId,
      }
    );

    return this.teacherClassInfo(teacherClass.id);
  }

  async teacherClassDelete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherClassDelete, '无权限删除班级');

    const scope = await this.resolveScope(perms);
    const validIds = Array.from(
      new Set(
        (ids || [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );

    if (!validIds.length) {
      return;
    }

    const rows = await this.performanceTeacherClassEntity.findBy({
      id: In(validIds),
    });

    if (rows.length !== validIds.length) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    rows.forEach(item => {
      this.assertClassWritable(item, scope, '无权删除该班级');

      if (item.status !== 'draft') {
        throw new CoolCommException(
          PERFORMANCE_TEACHER_CLASS_DELETE_DRAFT_ONLY_MESSAGE
        );
      }
    });

    await this.performanceTeacherClassEntity.delete(validIds);
  }

  async teacherDashboardSummary() {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.teacherDashboardSummary,
      '无权限查看班主任渠道合作看板'
    );

    const scope = await this.resolveScope(perms);
    const teacherRows = await this.listTeachersInScope(scope);
    const classRows = await this.listClassesInScope(scope);
    const classCountMap = this.countClassesByTeacher(classRows);
    const memberDistributionMap = new Map<
      number,
      { ownerEmployeeId: number; ownerEmployeeName: string; resourceCount: number; classCount: number }
    >();
    const ownerIds = Array.from(
      new Set(teacherRows.map(item => Number(item.ownerEmployeeId || 0)).filter(item => item > 0))
    );
    const ownerNameMap = await this.loadUserNameMap(ownerIds);

    teacherRows.forEach(item => {
      const ownerEmployeeId = Number(item.ownerEmployeeId || 0);
      const existing =
        memberDistributionMap.get(ownerEmployeeId) ||
        {
          ownerEmployeeId,
          ownerEmployeeName: ownerNameMap.get(ownerEmployeeId) || '',
          resourceCount: 0,
          classCount: 0,
        };

      existing.resourceCount += 1;
      existing.classCount += classCountMap.get(Number(item.id || 0)) || 0;
      memberDistributionMap.set(ownerEmployeeId, existing);
    });

    const pendingFollowCount = teacherRows.filter(item => !!resolveTodoBucket(item.nextFollowTime)).length;
    const overdueFollowCount = teacherRows.filter(
      item => resolveTodoBucket(item.nextFollowTime) === 'overdue'
    ).length;

    return {
      resourceTotal: teacherRows.length,
      pendingFollowCount,
      overdueFollowCount,
      partneredCount: teacherRows.filter(item => item.cooperationStatus === 'partnered').length,
      classCount: classRows.length,
      cooperationDistribution: TEACHER_COOPERATION_STATUS.map(status => ({
        key: status,
        status,
        value: teacherRows.filter(item => item.cooperationStatus === status).length,
      })),
      classStatusDistribution: TEACHER_CLASS_STATUS.map(status => ({
        key: status,
        status,
        value: classRows.filter(item => item.status === status).length,
      })),
      memberDistribution: Array.from(memberDistributionMap.values()).sort(
        (left, right) => right.resourceCount - left.resourceCount || right.classCount - left.classCount
      ),
    };
  }

  async teacherTodoPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherTodoPage, '无权限查看我的待跟进');

    const scope = await this.resolveScope(perms);
    const teacherRows = await this.listTeachersInScope(scope);
    const classCountMap = await this.loadClassCountMap(
      teacherRows.map(item => Number(item.id || 0))
    );
    const ownerIds = Array.from(
      new Set(
        teacherRows
          .map(item => Number(item.ownerEmployeeId || 0))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );
    const ownerNameMap = await this.loadUserNameMap(ownerIds);
    const departmentNameMap = await this.loadDepartmentNameMap(
      Array.from(
        new Set(
          teacherRows
            .map(item => Number(item.ownerDepartmentId || 0))
            .filter(item => Number.isInteger(item) && item > 0)
        )
      )
    );
    const requestedBucket = String(query.todoBucket || '').trim() as TeacherTodoBucket;
    const keyword = String(query.keyword || '').trim().toLowerCase();
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);

    const rows = teacherRows
      .map(item => ({
        ...item,
        todoBucket: resolveTodoBucket(item.nextFollowTime),
        ownerEmployeeName: ownerNameMap.get(Number(item.ownerEmployeeId || 0)) || '',
        ownerDepartmentName:
          departmentNameMap.get(Number(item.ownerDepartmentId || 0)) || '',
      }))
      .filter(item => !!item.todoBucket)
      .filter(item => {
        if (requestedBucket && requestedBucket !== item.todoBucket) {
          return false;
        }

        if (!keyword) {
          return true;
        }

        return (
          hasKeyword(item.teacherName, keyword) ||
          hasKeyword(item.schoolName, keyword) ||
          hasKeyword(item.phone, keyword)
        );
      })
      .sort((left, right) =>
        String(left.nextFollowTime || '').localeCompare(String(right.nextFollowTime || ''))
      );

    const start = (page - 1) * size;
    const paged = rows.slice(start, start + size);

    return {
      list: paged.map(item =>
        this.normalizeTeacherRow(item, {
          maskSensitive: scope.isReadonly,
          classCount: classCountMap.get(Number(item.id || 0)) || 0,
          todoBucket: item.todoBucket || undefined,
        })
      ),
      pagination: {
        page,
        size,
        total: rows.length,
      },
      bucketSummary: {
        today: rows.filter(item => item.todoBucket === 'today').length,
        overdue: rows.filter(item => item.todoBucket === 'overdue').length,
      },
    };
  }

  async teacherAgentPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentPage, '无权限查看代理主体列表');

    const scope = await this.resolveScope(perms);
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const keyword = String(query.keyword || '').trim().toLowerCase();
    const rows =
      ((await this.performanceTeacherAgentEntity.find?.()) as PerformanceTeacherAgentEntity[]) ||
      [];

    const filtered = rows
      .filter(item => this.agentInScope(item, scope))
      .filter(item => !keyword || hasKeyword(item.name, keyword) || hasKeyword(item.region, keyword))
      .filter(item => {
        if (!query.status) {
          return true;
        }
        return item.status === this.normalizeAgentStatus(query.status);
      })
      .filter(item => {
        if (!query.blacklistStatus) {
          return true;
        }
        return item.blacklistStatus === this.normalizeAgentBlacklistStatus(query.blacklistStatus);
      })
      .filter(item => {
        if (!query.agentType) {
          return true;
        }
        return String(item.agentType || '') === String(query.agentType || '').trim();
      })
      .sort((left, right) => String(right.updateTime || '').localeCompare(String(left.updateTime || '')));

    return {
      list: filtered
        .slice((page - 1) * size, (page - 1) * size + size)
        .map(item => this.normalizeAgentRow(item)),
      pagination: {
        page,
        size,
        total: filtered.length,
      },
    };
  }

  async teacherAgentInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentInfo, '无权限查看代理主体详情');

    const scope = await this.resolveScope(perms);
    const agent = await this.requireAgent(id);
    this.assertAgentReadable(agent, scope, '无权查看该代理主体');
    return this.normalizeAgentRow(agent);
  }

  async teacherAgentAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentAdd, '无权限新增代理主体');

    const scope = await this.resolveScope(perms);
    const normalized = this.normalizeAgentPayload(payload);
    const saved = await this.performanceTeacherAgentEntity.save(
      this.performanceTeacherAgentEntity.create({
        ...normalized,
        status: normalized.status || 'active',
        blacklistStatus: normalized.blacklistStatus || 'normal',
        ownerEmployeeId: scope.userId,
        ownerDepartmentId: scope.userDepartmentId,
      })
    );
    await this.recordTeacherAgentAudit('teacherAgent', Number(saved.id), 'add', null, saved, scope);
    return this.teacherAgentInfo(saved.id);
  }

  async teacherAgentUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentUpdate, '无权限编辑代理主体');

    const scope = await this.resolveScope(perms);
    const agent = await this.requireAgent(
      normalizeRequiredPositiveInt(payload.id, '代理主体 ID 不合法')
    );
    this.assertAgentWritable(agent, scope, '无权编辑该代理主体');

    const normalized = this.normalizeAgentPayload(payload, agent);
    await this.performanceTeacherAgentEntity.update({ id: agent.id }, normalized);
    const updated = await this.requireAgent(agent.id);
    await this.recordTeacherAgentAudit('teacherAgent', Number(agent.id), 'update', agent, updated, scope);
    return this.teacherAgentInfo(agent.id);
  }

  async teacherAgentUpdateStatus(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentUpdateStatus, '无权限更新代理主体状态');

    const scope = await this.resolveScope(perms);
    const agent = await this.requireAgent(
      normalizeRequiredPositiveInt(payload.id, '代理主体 ID 不合法')
    );
    this.assertAgentWritable(agent, scope, '无权更新该代理主体');
    const targetStatus = this.normalizeAgentStatus(payload.status);

    await this.performanceTeacherAgentEntity.update({ id: agent.id }, { status: targetStatus });
    const updated = await this.requireAgent(agent.id);
    await this.recordTeacherAgentAudit(
      'teacherAgent',
      Number(agent.id),
      'updateStatus',
      agent,
      updated,
      scope
    );
    return this.teacherAgentInfo(agent.id);
  }

  async teacherAgentBlacklist(payload: any) {
    return this.updateTeacherAgentBlacklistStatus(payload, 'blacklisted', 'blacklist');
  }

  async teacherAgentUnblacklist(payload: any) {
    return this.updateTeacherAgentBlacklistStatus(payload, 'normal', 'unblacklist');
  }

  async teacherAgentRelationPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentRelationPage, '无权限查看代理关系列表');

    const scope = await this.resolveScope(perms);
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const agentRows =
      ((await this.performanceTeacherAgentEntity.find?.()) as PerformanceTeacherAgentEntity[]) || [];
    const agentNameMap = new Map(
      agentRows.map(item => [Number(item.id), String(item.name || '')])
    );
    const rows =
      ((await this.performanceTeacherAgentRelationEntity.find?.()) as PerformanceTeacherAgentRelationEntity[]) ||
      [];

    const filtered = rows
      .filter(item => this.agentRelationInScope(item, scope))
      .filter(item => {
        if (!query.status) {
          return true;
        }
        return item.status === this.normalizeAgentRelationStatus(query.status);
      })
      .filter(item => {
        const keyword = String(query.keyword || '').trim().toLowerCase();
        if (!keyword) {
          return true;
        }
        return (
          hasKeyword(agentNameMap.get(Number(item.parentAgentId)) || '', keyword) ||
          hasKeyword(agentNameMap.get(Number(item.childAgentId)) || '', keyword)
        );
      })
      .sort((left, right) => String(right.updateTime || '').localeCompare(String(left.updateTime || '')));

    return {
      list: filtered
        .slice((page - 1) * size, (page - 1) * size + size)
        .map(item =>
          this.normalizeAgentRelationRow(item, {
            parentAgentName: agentNameMap.get(Number(item.parentAgentId)) || '',
            childAgentName: agentNameMap.get(Number(item.childAgentId)) || '',
          })
        ),
      pagination: {
        page,
        size,
        total: filtered.length,
      },
    };
  }

  async teacherAgentRelationAdd(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentRelationAdd, '无权限新增代理关系');

    const scope = await this.resolveScope(perms);
    const normalized = await this.normalizeAgentRelationPayload(payload);
    const parentAgent = await this.requireActiveAgent(normalized.parentAgentId);
    const childAgent = await this.requireActiveAgent(normalized.childAgentId);

    this.assertAgentWritable(parentAgent, scope, '无权维护该代理关系');
    this.assertAgentWritable(childAgent, scope, '无权维护该代理关系');
    await this.assertNoAgentCycle(parentAgent.id, childAgent.id);

    const saved = await this.performanceTeacherAgentRelationEntity.save(
      this.performanceTeacherAgentRelationEntity.create({
        ...normalized,
        ownerEmployeeId: scope.userId,
        ownerDepartmentId: parentAgent.ownerDepartmentId,
      })
    );
    await this.recordTeacherAgentAudit(
      'teacherAgentRelation',
      Number(saved.id),
      'add',
      null,
      saved,
      scope
    );
    return this.teacherAgentRelationPage({ page: 1, size: 1, keyword: parentAgent.name });
  }

  async teacherAgentRelationUpdate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentRelationUpdate, '无权限编辑代理关系');

    const scope = await this.resolveScope(perms);
    const relation = await this.requireAgentRelation(
      normalizeRequiredPositiveInt(payload.id, '代理关系 ID 不合法')
    );
    this.assertAgentRelationWritable(relation, scope, '无权编辑该代理关系');

    const normalized = await this.normalizeAgentRelationPayload(payload, relation);
    const parentAgent = await this.requireActiveAgent(normalized.parentAgentId);
    const childAgent = await this.requireActiveAgent(normalized.childAgentId);

    this.assertAgentWritable(parentAgent, scope, '无权维护该代理关系');
    this.assertAgentWritable(childAgent, scope, '无权维护该代理关系');
    await this.assertNoAgentCycle(parentAgent.id, childAgent.id, relation.id);

    await this.performanceTeacherAgentRelationEntity.update(
      { id: relation.id },
      {
        ...normalized,
        ownerDepartmentId: parentAgent.ownerDepartmentId,
      }
    );
    const updated = await this.requireAgentRelation(relation.id);
    await this.recordTeacherAgentAudit(
      'teacherAgentRelation',
      Number(relation.id),
      'update',
      relation,
      updated,
      scope
    );
    return this.teacherAgentRelationPage({ page: 1, size: 1, keyword: parentAgent.name });
  }

  async teacherAgentRelationDelete(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentRelationDelete, '无权限删除代理关系');

    const scope = await this.resolveScope(perms);
    const relation = await this.requireAgentRelation(
      normalizeRequiredPositiveInt(payload.id, '代理关系 ID 不合法')
    );
    this.assertAgentRelationWritable(relation, scope, '无权删除该代理关系');

    await this.performanceTeacherAgentRelationEntity.update(
      { id: relation.id },
      { status: 'inactive' }
    );
    const updated = await this.requireAgentRelation(relation.id);
    await this.recordTeacherAgentAudit(
      'teacherAgentRelation',
      Number(relation.id),
      'delete',
      relation,
      updated,
      scope
    );
    return this.normalizeAgentRelationRow(updated);
  }

  async teacherAttributionPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAttributionPage, '无权限查看归因列表');

    const scope = await this.resolveScope(perms);
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const teacherRows = await this.listTeachersInScope(scope);
    const allowedTeacherIds = new Set(teacherRows.map(item => Number(item.id)));
    const teacherNameMap = new Map(teacherRows.map(item => [Number(item.id), String(item.teacherName || '')]));
    const agentNameMap = await this.loadAgentNameMap();
    const rows =
      ((await this.performanceTeacherAttributionEntity.find?.()) as PerformanceTeacherAttributionEntity[]) ||
      [];

    const filtered = rows
      .filter(item => allowedTeacherIds.has(Number(item.teacherId || 0)))
      .filter(item => {
        if (!query.status) {
          return true;
        }
        return item.status === this.normalizeAttributionStatus(query.status);
      })
      .filter(item => {
        if (query.teacherId) {
          return Number(item.teacherId) === normalizeRequiredPositiveInt(query.teacherId, '班主任资源不存在');
        }
        return true;
      })
      .sort((left, right) => String(right.createTime || '').localeCompare(String(left.createTime || '')));

    return {
      list: filtered
        .slice((page - 1) * size, (page - 1) * size + size)
        .map(item =>
          this.normalizeAttributionRow(item, {
            teacherName: teacherNameMap.get(Number(item.teacherId)) || '',
            agentName: item.agentId ? agentNameMap.get(Number(item.agentId)) || '' : '直营',
          })
        ),
      pagination: {
        page,
        size,
        total: filtered.length,
      },
    };
  }

  async teacherAttributionInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAttributionInfo, '无权限查看归因详情');

    const scope = await this.resolveScope(perms);
    const attribution = await this.requireAttribution(id);
    const teacher = await this.requireTeacher(Number(attribution.teacherId || 0));
    this.assertTeacherReadable(teacher, scope, '无权查看该归因');
    return this.buildAttributionDetail(attribution);
  }

  async teacherAttributionAssign(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAttributionAssign, '无权限建立归因');

    const scope = await this.resolveScope(perms);
    return this.createOrConflictAttribution(payload, scope, 'assign');
  }

  async teacherAttributionChange(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAttributionChange, '无权限调整归因');

    const scope = await this.resolveScope(perms);
    return this.createOrConflictAttribution(payload, scope, 'change');
  }

  async teacherAttributionRemove(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAttributionRemove, '无权限移除归因');

    const scope = await this.resolveScope(perms);
    const current = await this.requireCurrentActiveAttribution(
      normalizeRequiredPositiveInt(payload.teacherId, '班主任资源不存在')
    );
    const teacher = await this.requireTeacher(current.teacherId);
    this.assertTeacherWritable(teacher, scope, '无权移除该班主任归因');

    await this.performanceTeacherAttributionEntity.update(
      { id: current.id },
      {
        status: 'removed',
        operatorId: scope.userId,
        operatorName: scope.userName,
      }
    );
    const updated = await this.requireAttribution(current.id);
    await this.recordTeacherAgentAudit(
      'teacherAttribution',
      Number(current.id),
      'remove',
      current,
      updated,
      scope
    );
    return this.buildTeacherAttributionInfo(teacher.id);
  }

  async teacherAttributionConflictPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.teacherAttributionConflictPage,
      '无权限查看归因冲突列表'
    );

    const scope = await this.resolveScope(perms);
    const teacherRows = await this.listTeachersInScope(scope);
    const teacherNameMap = new Map(teacherRows.map(item => [Number(item.id), String(item.teacherName || '')]));
    const allowedTeacherIds = new Set(teacherRows.map(item => Number(item.id)));
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const rows =
      ((await this.performanceTeacherAttributionConflictEntity.find?.()) as PerformanceTeacherAttributionConflictEntity[]) ||
      [];

    const filtered = rows
      .filter(item => allowedTeacherIds.has(Number(item.teacherId || 0)))
      .filter(item => {
        if (!query.status) {
          return true;
        }
        return item.status === this.normalizeAttributionConflictStatus(query.status);
      })
      .sort((left, right) => String(right.createTime || '').localeCompare(String(left.createTime || '')));

    return {
      list: filtered
        .slice((page - 1) * size, (page - 1) * size + size)
        .map(item =>
          this.normalizeAttributionConflictRow(item, {
            teacherName: teacherNameMap.get(Number(item.teacherId)) || '',
          })
        ),
      pagination: {
        page,
        size,
        total: filtered.length,
      },
    };
  }

  async teacherAttributionConflictInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.teacherAttributionConflictInfo,
      '无权限查看归因冲突详情'
    );

    const scope = await this.resolveScope(perms);
    const conflict = await this.requireAttributionConflict(id);
    const teacher = await this.requireTeacher(Number(conflict.teacherId || 0));
    this.assertTeacherReadable(teacher, scope, '无权查看该归因冲突');
    return this.buildAttributionConflictDetail(conflict);
  }

  async teacherAttributionConflictCreate(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.teacherAttributionConflictCreate,
      '无权限创建归因冲突'
    );

    const scope = await this.resolveScope(perms);
    const teacherId = normalizeRequiredPositiveInt(payload.teacherId, '班主任资源不存在');
    const current = await this.findCurrentActiveAttribution(teacherId);
    const requestedAgentId = normalizeOptionalPositiveInt(payload.agentId, '代理主体不存在');

    return this.ensureConflict(
      teacherId,
      current?.agentId || null,
      requestedAgentId,
      scope,
      normalizeOptionalText(payload.sourceRemark, 500, '冲突说明长度不合法')
    );
  }

  async teacherAttributionConflictResolve(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.teacherAttributionConflictResolve,
      PERFORMANCE_TEACHER_ATTRIBUTION_CONFLICT_RESOLVE_DENIED_MESSAGE
    );

    const scope = await this.resolveScope(perms);
    if (scope.isReadonly || !scope.canAssign) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ATTRIBUTION_CONFLICT_RESOLVE_DENIED_MESSAGE
      );
    }

    const conflict = await this.requireOpenAttributionConflict(
      normalizeRequiredPositiveInt(payload.id, '归因冲突不存在')
    );
    const teacher = await this.requireTeacher(conflict.teacherId);
    this.assertTeacherWritable(teacher, scope, '无权处理该归因冲突');
    const resolution = String(payload.resolution || '').trim();
    const resolutionRemark = normalizeOptionalText(
      payload.resolutionRemark,
      500,
      '处理说明长度不合法'
    );

    if (resolution === 'cancelled') {
      await this.performanceTeacherAttributionConflictEntity.update(
        { id: conflict.id },
        {
          status: 'cancelled',
          resolution,
          resolutionRemark,
          resolvedBy: scope.userId,
          resolvedTime: formatNow(),
        }
      );
      const updated = await this.requireAttributionConflict(conflict.id);
      await this.recordTeacherAgentAudit(
        'teacherAttributionConflict',
        Number(conflict.id),
        'resolve',
        conflict,
        updated,
        scope
      );
      return this.buildAttributionConflictDetail(updated);
    }

    if (resolution !== 'resolved') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ATTRIBUTION_CONFLICT_RESOLUTION_INVALID_MESSAGE
      );
    }

    const winnerAgentId = normalizeOptionalPositiveInt(payload.agentId, '代理主体不存在');
    if (winnerAgentId) {
      await this.requireAttributableAgent(winnerAgentId);
    }

    const current = await this.findCurrentActiveAttribution(teacher.id);
    if (current) {
      await this.performanceTeacherAttributionEntity.update(
        { id: current.id },
        {
          status: 'removed',
          operatorId: scope.userId,
          operatorName: scope.userName,
        }
      );
    }

    const conflictedRows = await this.findAttributionRowsByTeacher(teacher.id);
    const winnerRow = conflictedRows.find(
      item =>
        item.status === 'conflicted' &&
        Number(item.agentId || 0) === Number(winnerAgentId || 0)
    );
    let activeRowId = Number(winnerRow?.id || 0);

    if (winnerRow) {
      await this.performanceTeacherAttributionEntity.update(
        { id: winnerRow.id },
        {
          status: 'active',
          effectiveTime: formatNow(),
          operatorId: scope.userId,
          operatorName: scope.userName,
        }
      );
    } else {
      const created = await this.performanceTeacherAttributionEntity.save(
        this.performanceTeacherAttributionEntity.create({
          teacherId: teacher.id,
          agentId: winnerAgentId,
          attributionType: winnerAgentId ? 'agent' : 'direct',
          status: 'active',
          sourceType: 'conflictResolve',
          sourceRemark: resolutionRemark,
          effectiveTime: formatNow(),
          operatorId: scope.userId,
          operatorName: scope.userName,
        })
      );
      activeRowId = Number(created.id);
    }

    await this.performanceTeacherAttributionConflictEntity.update(
      { id: conflict.id },
      {
        status: 'resolved',
        resolution,
        resolutionRemark,
        resolvedBy: scope.userId,
        resolvedTime: formatNow(),
        currentAgentId: winnerAgentId,
      }
    );
    const updated = await this.requireAttributionConflict(conflict.id);
    await this.recordTeacherAgentAudit(
      'teacherAttributionConflict',
      Number(conflict.id),
      'resolve',
      conflict,
      updated,
      scope
    );
    return this.teacherAttributionInfo(activeRowId);
  }

  async teacherAgentAuditPage(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentAuditPage, '无权限查看代理审计列表');

    const scope = await this.resolveScope(perms);
    const teacherRows = await this.listTeachersInScope(scope);
    const allowedTeacherIds = new Set(teacherRows.map(item => Number(item.id)));
    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const rows =
      ((await this.performanceTeacherAgentAuditEntity.find?.()) as PerformanceTeacherAgentAuditEntity[]) ||
      [];

    const filtered = rows
      .filter(item => this.auditInScope(item, allowedTeacherIds, scope))
      .filter(item => {
        if (!query.resourceType) {
          return true;
        }
        return String(item.resourceType || '') === String(query.resourceType || '').trim();
      })
      .sort((left, right) => String(right.createTime || '').localeCompare(String(left.createTime || '')));

    return {
      list: filtered
        .slice((page - 1) * size, (page - 1) * size + size)
        .map(item => this.normalizeAuditRow(item)),
      pagination: {
        page,
        size,
        total: filtered.length,
      },
    };
  }

  async teacherAgentAuditInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.teacherAgentAuditInfo, '无权限查看代理审计详情');

    const scope = await this.resolveScope(perms);
    const teacherRows = await this.listTeachersInScope(scope);
    const allowedTeacherIds = new Set(teacherRows.map(item => Number(item.id)));
    const audit = await this.requireTeacherAgentAudit(id);

    if (!this.auditInScope(audit, allowedTeacherIds, scope)) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_AGENT_AUDIT_VIEW_DENIED_MESSAGE
      );
    }

    return this.normalizeAuditRow(audit);
  }

  async teacherInfoAttributionInfo(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.teacherInfoAttributionInfo,
      '无权限查看班主任当前归因'
    );

    const scope = await this.resolveScope(perms);
    const teacher = await this.requireTeacher(id);
    this.assertTeacherReadable(teacher, scope, '无权查看该班主任当前归因');
    return this.buildTeacherAttributionInfo(teacher.id);
  }

  async teacherInfoAttributionHistory(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.teacherInfoAttributionHistory,
      '无权限查看班主任归因历史'
    );

    const scope = await this.resolveScope(perms);
    const teacher = await this.requireTeacher(id);
    this.assertTeacherReadable(teacher, scope, '无权查看该班主任归因历史');

    const rows = await this.findAttributionRowsByTeacher(teacher.id);
    const agentNameMap = await this.loadAgentNameMap();
    return rows
      .sort((left, right) => String(right.createTime || '').localeCompare(String(left.createTime || '')))
      .map(item =>
        this.normalizeAttributionRow(item, {
          teacherName: teacher.teacherName,
          agentName: item.agentId ? agentNameMap.get(Number(item.agentId)) || '' : '直营',
        })
      );
  }

  private async currentPerms() {
    const access = await this.performanceAccessContextService.resolveAccessContext(
      undefined,
      {
        allowEmptyRoleIds: false,
        missingAuthMessage: '登录状态已失效',
      }
    );
    if (!this.currentCtx.admin) {
      this.currentCtx.admin = { userId: access.userId };
    } else if (!this.currentCtx.admin.userId) {
      this.currentCtx.admin.userId = access.userId;
    }
    return access;
  }

  private currentPermissionMask(access: PerformanceResolvedAccessContext) {
    const tokenPermissionMask = String(this.currentAdmin?.permissionMask || '').trim();
    if (tokenPermissionMask) {
      return tokenPermissionMask;
    }
    return resolvePermissionMask(access.perms, {
      isAdmin: false,
    });
  }

  private resolveCapabilityKey(perm: string): PerformanceCapabilityKey {
    const capabilityKey = this.capabilityByPerm[perm];
    if (!capabilityKey) {
      throw new CoolCommException(`未映射的班主任渠道权限: ${perm}`);
    }
    return capabilityKey;
  }

  private hasPerm(access: PerformanceResolvedAccessContext, perm: string) {
    return this.performanceAccessContextService.hasCapability(
      access,
      this.resolveCapabilityKey(perm)
    );
  }

  private assertPerm(
    access: PerformanceResolvedAccessContext,
    perm: string,
    message: string
  ) {
    if (!this.hasPerm(access, perm)) {
      throw new CoolCommException(message);
    }
  }

  private async resolveScope(
    access: PerformanceResolvedAccessContext
  ): Promise<TeacherAccessScope> {
    const currentUser = await this.requireUser(
      Number(access.userId || 0),
      '登录状态已失效'
    );
    const permissionMask = this.currentPermissionMask(access);
    const readCapabilities: PerformanceCapabilityKey[] = [
      'teacher_agent.read',
      'teacher_agent_audit.read',
      'teacher_agent_relation.read',
      'teacher_attribution.read',
      'teacher_attribution_conflict.read',
      'teacher_class.read',
      'teacher_dashboard.summary',
      'teacher_follow.read',
      'teacher_info.read',
      'teacher_info.attribution_history',
      'teacher_info.attribution_info',
      'teacher_todo.read',
    ];
    const writeCapabilities: PerformanceCapabilityKey[] = [
      'teacher_agent.create',
      'teacher_agent.update',
      'teacher_agent.update_status',
      'teacher_agent.blacklist',
      'teacher_agent.unblacklist',
      'teacher_agent_relation.create',
      'teacher_agent_relation.update',
      'teacher_agent_relation.delete',
      'teacher_attribution.assign',
      'teacher_attribution.change',
      'teacher_attribution.remove',
      'teacher_attribution_conflict.create',
      'teacher_attribution_conflict.resolve',
      'teacher_class.create',
      'teacher_class.update',
      'teacher_class.delete',
      'teacher_cooperation.mark',
      'teacher_follow.create',
      'teacher_info.create',
      'teacher_info.update',
      'teacher_info.assign',
      'teacher_info.update_status',
    ];
    const assignCapabilities: PerformanceCapabilityKey[] = [
      'teacher_info.assign',
      'teacher_attribution.assign',
      'teacher_attribution.change',
      'teacher_attribution.remove',
      'teacher_attribution_conflict.resolve',
    ];
    const isGlobal = this.performanceAccessContextService.hasAnyCapabilityInScopes(
      access,
      readCapabilities.concat(writeCapabilities),
      ['company']
    );
    const isReadonly = !this.performanceAccessContextService.hasAnyCapability(
      access,
      writeCapabilities
    );
    const canAssign = this.performanceAccessContextService.hasAnyCapability(
      access,
      assignCapabilities
    );
    const departmentIds: number[] | null = isGlobal
      ? null
      : this.performanceAccessContextService.hasAnyCapabilityInScopes(
          access,
          readCapabilities.concat(writeCapabilities),
          ['department_tree', 'department']
        )
      ? Array.from(
          new Set(
            (Array.isArray(access.departmentIds) ? access.departmentIds : [])
              .map(item => Number(item))
              .filter(item => Number.isInteger(item) && item > 0)
          )
        )
      : [];
    const scopeType: TeacherScopeType = isGlobal
      ? 'global'
      : canAssign || (isReadonly && (departmentIds?.length || 0) > 0)
        ? 'department'
        : 'self';

    return {
      scopeType,
      userId: Number(currentUser.id),
      userName: String(currentUser.name || currentUser.nickName || currentUser.username || ''),
      userDepartmentId: normalizeRequiredPositiveInt(
        currentUser.departmentId,
        '当前用户未配置归属部门'
      ),
      departmentIds,
      isReadonly,
      canAssign,
      canCloseClass: canAssign,
      canTerminateTeacher: canAssign,
    };
  }

  async teacherAccessProfile(): Promise<TeacherAccessProfile | null> {
    const access = await this.currentPerms();
    const permissionMask = this.currentPermissionMask(access);
    const domainCapabilities: PerformanceCapabilityKey[] = [
      'teacher_agent.read',
      'teacher_agent.create',
      'teacher_agent.update',
      'teacher_agent.update_status',
      'teacher_agent.blacklist',
      'teacher_agent.unblacklist',
      'teacher_agent_audit.read',
      'teacher_agent_relation.read',
      'teacher_agent_relation.create',
      'teacher_agent_relation.update',
      'teacher_agent_relation.delete',
      'teacher_attribution.read',
      'teacher_attribution.assign',
      'teacher_attribution.change',
      'teacher_attribution.remove',
      'teacher_attribution_conflict.read',
      'teacher_attribution_conflict.create',
      'teacher_attribution_conflict.resolve',
      'teacher_class.read',
      'teacher_class.create',
      'teacher_class.update',
      'teacher_class.delete',
      'teacher_cooperation.mark',
      'teacher_dashboard.summary',
      'teacher_follow.read',
      'teacher_follow.create',
      'teacher_info.read',
      'teacher_info.create',
      'teacher_info.update',
      'teacher_info.assign',
      'teacher_info.update_status',
      'teacher_info.attribution_history',
      'teacher_info.attribution_info',
      'teacher_todo.read',
    ];
    if (
      !this.performanceAccessContextService.hasAnyCapability(
        access,
        domainCapabilities
      )
    ) {
      return null;
    }

    const scope = await this.resolveScope(access);
    const [teacherRows, classRows] = await Promise.all([
      this.listTeachersInScope(scope),
      this.listClassesInScope(scope),
    ]);

    return {
      permissionMask,
      scopeType: scope.scopeType,
      isReadonly: scope.isReadonly,
      scopedDepartmentIds: scope.departmentIds ? [...scope.departmentIds] : [],
      scopedTeacherIds: teacherRows.map(item => Number(item.id || 0)).filter(item => item > 0),
      scopedClassIds: classRows.map(item => Number(item.id || 0)).filter(item => item > 0),
    };
  }

  private canAssignTargetDepartment(scope: TeacherAccessScope, departmentId: number) {
    if (!scope.canAssign) {
      return false;
    }

    if (scope.scopeType === 'global') {
      return true;
    }

    return !!scope.departmentIds?.includes(departmentId);
  }

  private applyTeacherScope(qb: any, scope: TeacherAccessScope) {
    if (scope.scopeType === 'global') {
      return;
    }

    if (scope.scopeType === 'self') {
      qb.andWhere('teacherInfo.ownerEmployeeId = :ownerEmployeeId', {
        ownerEmployeeId: scope.userId,
      });
      return;
    }

    if (!scope.departmentIds?.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('teacherInfo.ownerDepartmentId in (:...departmentIds)', {
      departmentIds: scope.departmentIds,
    });
  }

  private applyClassScope(qb: any, scope: TeacherAccessScope) {
    if (scope.scopeType === 'global') {
      return;
    }

    if (scope.scopeType === 'self') {
      qb.andWhere('teacherClass.ownerEmployeeId = :ownerEmployeeId', {
        ownerEmployeeId: scope.userId,
      });
      return;
    }

    if (!scope.departmentIds?.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('teacherClass.ownerDepartmentId in (:...departmentIds)', {
      departmentIds: scope.departmentIds,
    });
  }

  private teacherInScope(teacher: Pick<PerformanceTeacherInfoEntity, 'ownerEmployeeId' | 'ownerDepartmentId'>, scope: TeacherAccessScope) {
    if (scope.scopeType === 'global') {
      return true;
    }

    if (scope.scopeType === 'self') {
      return Number(teacher.ownerEmployeeId || 0) === scope.userId;
    }

    return !!scope.departmentIds?.includes(Number(teacher.ownerDepartmentId || 0));
  }

  private classInScope(teacherClass: Pick<PerformanceTeacherClassEntity, 'ownerEmployeeId' | 'ownerDepartmentId'>, scope: TeacherAccessScope) {
    if (scope.scopeType === 'global') {
      return true;
    }

    if (scope.scopeType === 'self') {
      return Number(teacherClass.ownerEmployeeId || 0) === scope.userId;
    }

    return !!scope.departmentIds?.includes(Number(teacherClass.ownerDepartmentId || 0));
  }

  private assertTeacherReadable(
    teacher: PerformanceTeacherInfoEntity,
    scope: TeacherAccessScope,
    message: string
  ) {
    if (!this.teacherInScope(teacher, scope)) {
      throw new CoolCommException(message);
    }
  }

  private assertTeacherWritable(
    teacher: PerformanceTeacherInfoEntity,
    scope: TeacherAccessScope,
    message: string
  ) {
    if (scope.isReadonly) {
      throw new CoolCommException(PERFORMANCE_READONLY_WRITE_DENIED_MESSAGE);
    }

    this.assertTeacherReadable(teacher, scope, message);
  }

  private assertClassReadable(
    teacherClass: PerformanceTeacherClassEntity,
    scope: TeacherAccessScope,
    message: string
  ) {
    if (!this.classInScope(teacherClass, scope)) {
      throw new CoolCommException(message);
    }
  }

  private assertClassWritable(
    teacherClass: PerformanceTeacherClassEntity,
    scope: TeacherAccessScope,
    message: string
  ) {
    if (scope.isReadonly) {
      throw new CoolCommException(PERFORMANCE_READONLY_WRITE_DENIED_MESSAGE);
    }

    this.assertClassReadable(teacherClass, scope, message);
  }

  private assertClassTransition(
    currentStatus: TeacherClassStatus,
    targetStatus: TeacherClassStatus,
    scope: TeacherAccessScope
  ) {
    if (currentStatus === 'closed') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_CLASS_CLOSED_EDIT_DENIED_MESSAGE
      );
    }

    if (currentStatus === 'draft') {
      if (!['draft', 'active'].includes(targetStatus)) {
        throw new CoolCommException(
          PERFORMANCE_TEACHER_CLASS_DRAFT_TRANSITION_ONLY_MESSAGE
        );
      }
      return;
    }

    if (currentStatus === 'active') {
      if (targetStatus === 'active') {
        return;
      }

      if (targetStatus === 'closed') {
        if (!scope.canCloseClass) {
          throw new CoolCommException(
            PERFORMANCE_TEACHER_CLASS_CLOSE_ROLE_DENIED_MESSAGE
          );
        }
        return;
      }
    }

    throw new CoolCommException(
      PERFORMANCE_TEACHER_CLASS_ACTION_NOT_ALLOWED_MESSAGE
    );
  }

  private normalizeTeacherStatus(value: any) {
    const status = String(value || '').trim() as TeacherCooperationStatus;

    if (!TEACHER_COOPERATION_STATUS.includes(status)) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_COOPERATION_STATUS_INVALID_MESSAGE
      );
    }

    return status;
  }

  private normalizeClassStatus(value: any) {
    const status = String(value || '').trim() as TeacherClassStatus;

    if (!TEACHER_CLASS_STATUS.includes(status)) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_CLASS_STATUS_INVALID_MESSAGE
      );
    }

    return status;
  }

  private normalizeTeacherPayload(payload: any) {
    const status = String(payload.cooperationStatus || '').trim();

    if (status && status !== 'uncontacted') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_COOPERATION_STATUS_PRESET_DENIED_MESSAGE
      );
    }

    return {
      teacherName: normalizeRequiredText(payload.teacherName, 100, '班主任姓名不能为空且长度不能超过 100'),
      phone: normalizeOptionalText(payload.phone, 20, '联系电话长度不合法'),
      wechat: normalizeOptionalText(payload.wechat, 50, '微信号长度不合法'),
      schoolName: normalizeOptionalText(payload.schoolName, 100, '学校名称长度不合法'),
      schoolRegion: normalizeOptionalText(payload.schoolRegion, 100, '学校区域长度不合法'),
      schoolType: normalizeOptionalText(payload.schoolType, 100, '学校类型长度不合法'),
      grade: normalizeOptionalText(payload.grade, 50, '年级长度不合法'),
      className: normalizeOptionalText(payload.className, 100, '班级名称长度不合法'),
      subject: normalizeOptionalText(payload.subject, 50, '科目长度不合法'),
      projectTags: normalizeTagList(payload.projectTags),
      intentionLevel: normalizeOptionalText(payload.intentionLevel, 30, '意向等级长度不合法'),
      communicationStyle: normalizeOptionalText(
        payload.communicationStyle,
        50,
        '沟通风格长度不合法'
      ),
      nextFollowTime: normalizeDateTime(payload.nextFollowTime, '下次跟进时间不合法', false),
    };
  }

  private normalizeClassPayload(
    payload: any,
    teacher: PerformanceTeacherInfoEntity,
    existing?: PerformanceTeacherClassEntity
  ) {
    return {
      className: normalizeRequiredText(
        payload.className ?? existing?.className,
        100,
        '班级名称不能为空且长度不能超过 100'
      ),
      projectTag: normalizeOptionalText(
        payload.projectTag ?? existing?.projectTag ?? parseTagList(teacher.projectTags)[0],
        50,
        '项目标签长度不合法'
      ),
      studentCount: normalizeOptionalNonNegativeInt(
        payload.studentCount ?? existing?.studentCount ?? 0,
        '学员人数不合法'
      ),
    };
  }

  private normalizeTeacherRow(
    item: any,
    options?: {
      maskSensitive?: boolean;
      classCount?: number;
      todoBucket?: TeacherTodoBucket;
    }
  ) {
    const maskSensitive = options?.maskSensitive === true;
    const phone = maskSensitive ? maskPhone(item.phone) : item.phone || null;
    const wechat = maskSensitive ? maskWechat(item.wechat) : item.wechat || null;

    return {
      id: Number(item.id || 0),
      teacherName: item.teacherName || '',
      phone,
      wechat,
      schoolName: item.schoolName || null,
      schoolRegion: item.schoolRegion || null,
      schoolType: item.schoolType || null,
      grade: item.grade || null,
      className: item.className || null,
      subject: item.subject || null,
      projectTags: parseTagList(item.projectTags),
      intentionLevel: item.intentionLevel || null,
      communicationStyle: item.communicationStyle || null,
      cooperationStatus: item.cooperationStatus || 'uncontacted',
      ownerEmployeeId: Number(item.ownerEmployeeId || 0),
      ownerEmployeeName: item.ownerEmployeeName || '',
      ownerDepartmentId: Number(item.ownerDepartmentId || 0),
      ownerDepartmentName: item.ownerDepartmentName || '',
      lastFollowTime: item.lastFollowTime || null,
      nextFollowTime: item.nextFollowTime || null,
      cooperationTime: item.cooperationTime || null,
      classCount: Number(options?.classCount || 0),
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
      ...(options?.todoBucket ? { todoBucket: options.todoBucket } : {}),
    };
  }

  private normalizeFollowRow(item: any) {
    return {
      id: Number(item.id || 0),
      teacherId: Number(item.teacherId || 0),
      followTime: item.followTime || '',
      nextFollowTime: item.nextFollowTime || null,
      followMethod: item.followMethod || null,
      content: item.followContent || '',
      followContent: item.followContent || '',
      creatorEmployeeId: Number(item.creatorEmployeeId || 0),
      operatorName: item.creatorEmployeeName || '',
      creatorName: item.creatorEmployeeName || '',
      creatorEmployeeName: item.creatorEmployeeName || '',
      createTime: item.createTime || '',
    };
  }

  private normalizeClassRow(item: any) {
    return {
      id: Number(item.id || item.classId || 0),
      classId: Number(item.id || item.classId || 0),
      teacherId: Number(item.teacherId || 0),
      teacherName: item.teacherName || '',
      className: item.className || '',
      schoolName: item.schoolName || null,
      grade: item.grade || null,
      projectTag: item.projectTag || null,
      studentCount: Number(item.studentCount || 0),
      status: item.status || 'draft',
      ownerEmployeeId: Number(item.ownerEmployeeId || 0),
      ownerDepartmentId: Number(item.ownerDepartmentId || 0),
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private async buildTeacherDetail(teacher: PerformanceTeacherInfoEntity, maskSensitive: boolean) {
    const [owner, department, classCount] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: Number(teacher.ownerEmployeeId || 0) }),
      this.baseSysDepartmentEntity.findOneBy({
        id: Number(teacher.ownerDepartmentId || 0),
      }),
      this.performanceTeacherClassEntity.count({ where: { teacherId: teacher.id } }),
    ]);

    return this.normalizeTeacherRow(
      {
        ...teacher,
        ownerEmployeeName: owner?.name || owner?.nickName || owner?.username || '',
        ownerDepartmentName: department?.name || '',
      },
      {
        maskSensitive,
        classCount,
      }
    );
  }

  private async requireTeacher(id: number) {
    const teacher = await this.performanceTeacherInfoEntity.findOneBy({ id });

    if (!teacher) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return teacher;
  }

  private async requireTeacherClass(id: number) {
    const teacherClass = await this.performanceTeacherClassEntity.findOneBy({ id });

    if (!teacherClass) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return teacherClass;
  }

  private async requireUser(id: number, message = '用户不存在') {
    const user = await this.baseSysUserEntity.findOneBy({ id });

    if (!user || Number(user.status || 0) !== 1) {
      throw new CoolCommException(message);
    }

    return user;
  }

  private async loadUserNameMap(userIds: number[]) {
    if (!userIds.length) {
      return new Map<number, string>();
    }

    const rows = await this.baseSysUserEntity.findBy({
      id: In(userIds),
    });

    return new Map(
      rows.map(item => [
        Number(item.id),
        String(item.name || item.nickName || item.username || ''),
      ])
    );
  }

  private async loadDepartmentNameMap(departmentIds: number[]) {
    if (!departmentIds.length) {
      return new Map<number, string>();
    }

    const rows = await this.baseSysDepartmentEntity.findBy({
      id: In(departmentIds),
    });

    return new Map(rows.map(item => [Number(item.id), String(item.name || '')]));
  }

  private async loadClassCountMap(teacherIds: number[]) {
    const validIds = Array.from(
      new Set(
        (teacherIds || [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );

    if (!validIds.length) {
      return new Map<number, number>();
    }

    const rows = await this.performanceTeacherClassEntity.findBy({
      teacherId: In(validIds),
    });
    const map = new Map<number, number>();

    rows.forEach(item => {
      const teacherId = Number(item.teacherId || 0);
      map.set(teacherId, Number(map.get(teacherId) || 0) + 1);
    });

    return map;
  }

  private countClassesByTeacher(rows: PerformanceTeacherClassEntity[]) {
    const map = new Map<number, number>();

    rows.forEach(item => {
      const teacherId = Number(item.teacherId || 0);
      map.set(teacherId, Number(map.get(teacherId) || 0) + 1);
    });

    return map;
  }

  private async listTeachersInScope(scope: TeacherAccessScope) {
    const rows =
      (await this.performanceTeacherInfoEntity.find?.()) ||
      [];

    return rows.filter(item => this.teacherInScope(item, scope));
  }

  private async listClassesInScope(scope: TeacherAccessScope) {
    const rows =
      (await this.performanceTeacherClassEntity.find?.()) ||
      [];

    return rows.filter(item => this.classInScope(item, scope));
  }

  private async updateTeacherAgentBlacklistStatus(
    payload: any,
    blacklistStatus: TeacherAgentBlacklistStatus,
    action: string
  ) {
    const perms = await this.currentPerms();
    const perm =
      blacklistStatus === 'blacklisted'
        ? this.perms.teacherAgentBlacklist
        : this.perms.teacherAgentUnblacklist;
    this.assertPerm(perms, perm, '无权限更新代理主体黑名单状态');

    const scope = await this.resolveScope(perms);
    const agent = await this.requireAgent(
      normalizeRequiredPositiveInt(payload.id, '代理主体 ID 不合法')
    );
    this.assertAgentWritable(agent, scope, '无权更新该代理主体黑名单状态');

    await this.performanceTeacherAgentEntity.update(
      { id: agent.id },
      { blacklistStatus }
    );
    const updated = await this.requireAgent(agent.id);
    await this.recordTeacherAgentAudit(
      'teacherAgent',
      Number(agent.id),
      action,
      agent,
      updated,
      scope
    );
    return this.teacherAgentInfo(agent.id);
  }

  private normalizeAgentStatus(value: any) {
    const status = String(value || '').trim() as TeacherAgentStatus;

    if (!TEACHER_AGENT_STATUS.includes(status)) {
      throw new CoolCommException(PERFORMANCE_TEACHER_AGENT_STATUS_INVALID_MESSAGE);
    }

    return status;
  }

  private normalizeAgentBlacklistStatus(value: any) {
    const status = String(value || '').trim() as TeacherAgentBlacklistStatus;

    if (!TEACHER_AGENT_BLACKLIST_STATUS.includes(status)) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_AGENT_BLACKLIST_STATUS_INVALID_MESSAGE
      );
    }

    return status;
  }

  private normalizeAgentRelationStatus(value: any) {
    const status = String(value || '').trim() as TeacherAgentRelationStatus;

    if (!TEACHER_AGENT_RELATION_STATUS.includes(status)) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_AGENT_RELATION_STATUS_INVALID_MESSAGE
      );
    }

    return status;
  }

  private normalizeAttributionStatus(value: any) {
    const status = String(value || '').trim() as TeacherAttributionStatus;

    if (!TEACHER_ATTRIBUTION_STATUS.includes(status)) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ATTRIBUTION_STATUS_INVALID_MESSAGE
      );
    }

    return status;
  }

  private normalizeAttributionConflictStatus(value: any) {
    const status = String(value || '').trim() as TeacherAttributionConflictStatus;

    if (!TEACHER_ATTRIBUTION_CONFLICT_STATUS.includes(status)) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ATTRIBUTION_CONFLICT_STATUS_INVALID_MESSAGE
      );
    }

    return status;
  }

  private normalizeAgentPayload(
    payload: any,
    existing?: PerformanceTeacherAgentEntity
  ) {
    return {
      name: normalizeRequiredText(payload.name ?? existing?.name, 100, '代理主体名称不能为空且长度不能超过 100'),
      agentType: normalizeRequiredText(
        payload.agentType ?? existing?.agentType,
        20,
        '代理主体类型不能为空且长度不能超过 20'
      ),
      level: normalizeOptionalText(payload.level ?? existing?.level, 30, '代理等级长度不合法'),
      region: normalizeOptionalText(payload.region ?? existing?.region, 50, '代理区域长度不合法'),
      cooperationStatus: normalizeOptionalText(
        payload.cooperationStatus ?? existing?.cooperationStatus,
        30,
        '代理合作状态长度不合法'
      ),
      status: payload.status
        ? this.normalizeAgentStatus(payload.status)
        : existing?.status || 'active',
      blacklistStatus: payload.blacklistStatus
        ? this.normalizeAgentBlacklistStatus(payload.blacklistStatus)
        : existing?.blacklistStatus || 'normal',
      remark: normalizeOptionalText(payload.remark ?? existing?.remark, 500, '代理备注长度不合法'),
    };
  }

  private async normalizeAgentRelationPayload(
    payload: any,
    existing?: PerformanceTeacherAgentRelationEntity
  ) {
    const parentAgentId = normalizeRequiredPositiveInt(
      payload.parentAgentId ?? existing?.parentAgentId,
      '父级代理不存在'
    );
    const childAgentId = normalizeRequiredPositiveInt(
      payload.childAgentId ?? existing?.childAgentId,
      '子级代理不存在'
    );

    if (parentAgentId === childAgentId) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_AGENT_RELATION_SELF_LOOP_DENIED_MESSAGE
      );
    }

    return {
      parentAgentId,
      childAgentId,
      status: payload.status
        ? this.normalizeAgentRelationStatus(payload.status)
        : existing?.status || 'active',
      effectiveTime: normalizeDateTime(
        payload.effectiveTime ?? existing?.effectiveTime,
        '关系生效时间不合法',
        false
      ),
      remark: normalizeOptionalText(payload.remark ?? existing?.remark, 500, '关系备注长度不合法'),
    };
  }

  private async createOrConflictAttribution(
    payload: any,
    scope: TeacherAccessScope,
    action: 'assign' | 'change'
  ) {
    const teacherId = normalizeRequiredPositiveInt(payload.teacherId, '班主任资源不存在');
    const teacher = await this.requireTeacher(teacherId);
    this.assertTeacherWritable(teacher, scope, '无权维护该班主任归因');

    if (teacher.cooperationStatus === 'terminated') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ATTRIBUTION_CREATE_TERMINATED_DENIED_MESSAGE
      );
    }

    const targetAgentId = normalizeOptionalPositiveInt(payload.agentId, '代理主体不存在');
    if (targetAgentId) {
      await this.requireAttributableAgent(targetAgentId);
    }

    const current = await this.findCurrentActiveAttribution(teacher.id);

    if (
      current &&
      Number(current.agentId || 0) === Number(targetAgentId || 0) &&
      String(current.attributionType || '') === (targetAgentId ? 'agent' : 'direct')
    ) {
      return this.buildTeacherAttributionInfo(teacher.id);
    }

    if (current && action === 'assign') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ATTRIBUTION_ASSIGN_EXISTING_DENIED_MESSAGE
      );
    }

    if (current) {
      await this.ensureConflict(
        teacher.id,
        current.agentId || null,
        targetAgentId,
        scope,
        normalizeOptionalText(payload.sourceRemark, 500, '归因说明长度不合法')
      );
      const saved = await this.performanceTeacherAttributionEntity.save(
        this.performanceTeacherAttributionEntity.create({
          teacherId: teacher.id,
          agentId: targetAgentId,
          attributionType: targetAgentId ? 'agent' : 'direct',
          status: 'conflicted',
          sourceType: action,
          sourceRemark: normalizeOptionalText(payload.sourceRemark, 500, '归因说明长度不合法'),
          effectiveTime: null,
          operatorId: scope.userId,
          operatorName: scope.userName,
        })
      );
      await this.recordTeacherAgentAudit(
        'teacherAttribution',
        Number(saved.id),
        action,
        current,
        saved,
        scope
      );
      return this.buildTeacherAttributionInfo(teacher.id);
    }

    const created = await this.performanceTeacherAttributionEntity.save(
      this.performanceTeacherAttributionEntity.create({
        teacherId: teacher.id,
        agentId: targetAgentId,
        attributionType: targetAgentId ? 'agent' : 'direct',
        status: 'active',
        sourceType: action,
        sourceRemark: normalizeOptionalText(payload.sourceRemark, 500, '归因说明长度不合法'),
        effectiveTime: formatNow(),
        operatorId: scope.userId,
        operatorName: scope.userName,
      })
    );
    await this.recordTeacherAgentAudit(
      'teacherAttribution',
      Number(created.id),
      action,
      null,
      created,
      scope
    );
    return this.buildTeacherAttributionInfo(teacher.id);
  }

  private async ensureConflict(
    teacherId: number,
    currentAgentId: number | null,
    requestedAgentId: number | null,
    scope: TeacherAccessScope,
    resolutionRemark: string | null
  ) {
    const rows = await this.findOpenAttributionConflictsByTeacher(teacherId);
    const existing = rows.find(
      item =>
        Number(item.currentAgentId || 0) === Number(currentAgentId || 0) &&
        Number(item.requestedAgentId || 0) === Number(requestedAgentId || 0)
    );

    if (existing) {
      return existing;
    }

    const candidateAgentIds = Array.from(
      new Set(
        [currentAgentId, requestedAgentId]
          .map(item => Number(item || 0))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );

    const created = await this.performanceTeacherAttributionConflictEntity.save(
      this.performanceTeacherAttributionConflictEntity.create({
        teacherId,
        candidateAgentIds,
        status: 'open',
        resolution: null,
        resolutionRemark,
        resolvedBy: null,
        resolvedTime: null,
        currentAgentId,
        requestedAgentId,
        requestedById: scope.userId,
      })
    );
    await this.recordTeacherAgentAudit(
      'teacherAttributionConflict',
      Number(created.id),
      'create',
      null,
      created,
      scope
    );
    return created;
  }

  private async buildTeacherAttributionInfo(teacherId: number) {
    const teacher = await this.requireTeacher(teacherId);
    const current = await this.findCurrentActiveAttribution(teacherId);
    const openConflicts = await this.findOpenAttributionConflictsByTeacher(teacherId);
    const agentNameMap = await this.loadAgentNameMap();
    const history = await this.findAttributionRowsByTeacher(teacherId);

    return {
      teacherId,
      teacherName: teacher.teacherName,
      currentAttribution: current
        ? this.normalizeAttributionRow(current, {
            teacherName: teacher.teacherName,
            agentName: current.agentId
              ? agentNameMap.get(Number(current.agentId)) || ''
              : '直营',
          })
        : null,
      openConflictCount: openConflicts.length,
      openConflicts: openConflicts.map(item =>
        this.normalizeAttributionConflictRow(item, { teacherName: teacher.teacherName })
      ),
      history: history
        .sort((left, right) => String(right.createTime || '').localeCompare(String(left.createTime || '')))
        .map(item =>
          this.normalizeAttributionRow(item, {
            teacherName: teacher.teacherName,
            agentName: item.agentId ? agentNameMap.get(Number(item.agentId)) || '' : '直营',
          })
        ),
    };
  }

  private async buildAttributionDetail(attribution: PerformanceTeacherAttributionEntity) {
    const teacher = await this.requireTeacher(Number(attribution.teacherId || 0));
    const agentNameMap = await this.loadAgentNameMap();
    return this.normalizeAttributionRow(attribution, {
      teacherName: teacher.teacherName,
      agentName: attribution.agentId ? agentNameMap.get(Number(attribution.agentId)) || '' : '直营',
    });
  }

  private async buildAttributionConflictDetail(
    conflict: PerformanceTeacherAttributionConflictEntity
  ) {
    const teacher = await this.requireTeacher(Number(conflict.teacherId || 0));
    const agentNameMap = await this.loadAgentNameMap();
    const candidateAgents = (conflict.candidateAgentIds || []).map(id => ({
      id: Number(id),
      name: agentNameMap.get(Number(id)) || '',
    }));

    return {
      ...this.normalizeAttributionConflictRow(conflict, {
        teacherName: teacher.teacherName,
      }),
      candidateAgents,
      currentAgentName: conflict.currentAgentId
        ? agentNameMap.get(Number(conflict.currentAgentId)) || ''
        : '直营',
      requestedAgentName: conflict.requestedAgentId
        ? agentNameMap.get(Number(conflict.requestedAgentId)) || ''
        : '直营',
    };
  }

  private normalizeAgentRow(item: any) {
    return {
      id: Number(item.id || 0),
      name: item.name || '',
      agentType: item.agentType || '',
      level: item.level || null,
      region: item.region || null,
      cooperationStatus: item.cooperationStatus || null,
      status: item.status || 'active',
      blacklistStatus: item.blacklistStatus || 'normal',
      remark: item.remark || null,
      ownerEmployeeId: Number(item.ownerEmployeeId || 0),
      ownerDepartmentId: Number(item.ownerDepartmentId || 0),
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private normalizeAgentRelationRow(
    item: any,
    options?: {
      parentAgentName?: string;
      childAgentName?: string;
    }
  ) {
    return {
      id: Number(item.id || 0),
      parentAgentId: Number(item.parentAgentId || 0),
      parentAgentName: options?.parentAgentName || item.parentAgentName || '',
      childAgentId: Number(item.childAgentId || 0),
      childAgentName: options?.childAgentName || item.childAgentName || '',
      status: item.status || 'active',
      effectiveTime: item.effectiveTime || null,
      remark: item.remark || null,
      ownerEmployeeId: Number(item.ownerEmployeeId || 0),
      ownerDepartmentId: Number(item.ownerDepartmentId || 0),
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private normalizeAttributionRow(
    item: any,
    options?: {
      teacherName?: string;
      agentName?: string;
    }
  ) {
    return {
      id: Number(item.id || 0),
      teacherId: Number(item.teacherId || 0),
      teacherName: options?.teacherName || item.teacherName || '',
      agentId: item.agentId === null || item.agentId === undefined ? null : Number(item.agentId || 0),
      agentName: options?.agentName || item.agentName || (item.agentId ? '' : '直营'),
      attributionType: item.attributionType || 'direct',
      status: item.status || 'active',
      sourceType: item.sourceType || null,
      sourceRemark: item.sourceRemark || null,
      effectiveTime: item.effectiveTime || null,
      operatorId: item.operatorId === null || item.operatorId === undefined ? null : Number(item.operatorId || 0),
      operatorName: item.operatorName || null,
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private normalizeAttributionConflictRow(
    item: any,
    options?: {
      teacherName?: string;
    }
  ) {
    return {
      id: Number(item.id || 0),
      teacherId: Number(item.teacherId || 0),
      teacherName: options?.teacherName || item.teacherName || '',
      candidateAgentIds: Array.isArray(item.candidateAgentIds) ? item.candidateAgentIds : [],
      status: item.status || 'open',
      resolution: item.resolution || null,
      resolutionRemark: item.resolutionRemark || null,
      resolvedBy: item.resolvedBy === null || item.resolvedBy === undefined ? null : Number(item.resolvedBy || 0),
      resolvedTime: item.resolvedTime || null,
      currentAgentId: item.currentAgentId === null || item.currentAgentId === undefined ? null : Number(item.currentAgentId || 0),
      requestedAgentId:
        item.requestedAgentId === null || item.requestedAgentId === undefined
          ? null
          : Number(item.requestedAgentId || 0),
      requestedById:
        item.requestedById === null || item.requestedById === undefined
          ? null
          : Number(item.requestedById || 0),
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private normalizeAuditRow(item: any) {
    return {
      id: Number(item.id || 0),
      resourceType: item.resourceType || '',
      resourceId: Number(item.resourceId || 0),
      action: item.action || '',
      beforeSnapshot: item.beforeSnapshot || null,
      afterSnapshot: item.afterSnapshot || null,
      operatorId: Number(item.operatorId || 0),
      operatorName: item.operatorName || '',
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private agentInScope(
    agent: Pick<PerformanceTeacherAgentEntity, 'ownerEmployeeId' | 'ownerDepartmentId'>,
    scope: TeacherAccessScope
  ) {
    if (scope.scopeType === 'global') {
      return true;
    }

    if (scope.scopeType === 'self') {
      return Number(agent.ownerEmployeeId || 0) === scope.userId;
    }

    return !!scope.departmentIds?.includes(Number(agent.ownerDepartmentId || 0));
  }

  private agentRelationInScope(
    relation: Pick<PerformanceTeacherAgentRelationEntity, 'ownerEmployeeId' | 'ownerDepartmentId'>,
    scope: TeacherAccessScope
  ) {
    if (scope.scopeType === 'global') {
      return true;
    }

    if (scope.scopeType === 'self') {
      return Number(relation.ownerEmployeeId || 0) === scope.userId;
    }

    return !!scope.departmentIds?.includes(Number(relation.ownerDepartmentId || 0));
  }

  private assertAgentReadable(
    agent: PerformanceTeacherAgentEntity,
    scope: TeacherAccessScope,
    message: string
  ) {
    if (!this.agentInScope(agent, scope)) {
      throw new CoolCommException(message);
    }
  }

  private assertAgentWritable(
    agent: PerformanceTeacherAgentEntity,
    scope: TeacherAccessScope,
    message: string
  ) {
    if (scope.isReadonly) {
      throw new CoolCommException(PERFORMANCE_READONLY_WRITE_DENIED_MESSAGE);
    }
    this.assertAgentReadable(agent, scope, message);
  }

  private assertAgentRelationWritable(
    relation: PerformanceTeacherAgentRelationEntity,
    scope: TeacherAccessScope,
    message: string
  ) {
    if (scope.isReadonly) {
      throw new CoolCommException(PERFORMANCE_READONLY_WRITE_DENIED_MESSAGE);
    }
    if (!this.agentRelationInScope(relation, scope)) {
      throw new CoolCommException(message);
    }
  }

  private auditInScope(
    audit: PerformanceTeacherAgentAuditEntity,
    allowedTeacherIds: Set<number>,
    scope: TeacherAccessScope
  ) {
    if (scope.scopeType === 'global') {
      return true;
    }

    if (audit.resourceType === 'teacherAttribution' || audit.resourceType === 'teacherAttributionConflict') {
      const relatedId = Number(audit.afterSnapshot?.teacherId || audit.beforeSnapshot?.teacherId || 0);
      return allowedTeacherIds.has(relatedId);
    }

    if (audit.resourceType === 'teacherAgent' || audit.resourceType === 'teacherAgentRelation') {
      const departmentId = Number(
        audit.afterSnapshot?.ownerDepartmentId || audit.beforeSnapshot?.ownerDepartmentId || 0
      );
      if (scope.scopeType === 'self') {
        return Number(audit.operatorId || 0) === scope.userId;
      }
      return !!scope.departmentIds?.includes(departmentId);
    }

    return false;
  }

  private async requireAgent(id: number) {
    const agent = await this.performanceTeacherAgentEntity.findOneBy({ id });

    if (!agent) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return agent;
  }

  private async requireActiveAgent(id: number) {
    const agent = await this.requireAgent(id);

    if (agent.status !== 'active') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_AGENT_RELATION_TARGET_INACTIVE_MESSAGE
      );
    }

    return agent;
  }

  private async requireAttributableAgent(id: number) {
    const agent = await this.requireAgent(id);

    if (agent.status !== 'active') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ATTRIBUTION_AGENT_INACTIVE_MESSAGE
      );
    }

    if (agent.blacklistStatus === 'blacklisted') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ATTRIBUTION_AGENT_BLACKLISTED_MESSAGE
      );
    }

    return agent;
  }

  private async requireAgentRelation(id: number) {
    const relation = await this.performanceTeacherAgentRelationEntity.findOneBy({ id });

    if (!relation) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return relation;
  }

  private async requireAttribution(id: number) {
    const attribution = await this.performanceTeacherAttributionEntity.findOneBy({ id });

    if (!attribution) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return attribution;
  }

  private async requireAttributionConflict(id: number) {
    const conflict = await this.performanceTeacherAttributionConflictEntity.findOneBy({ id });

    if (!conflict) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return conflict;
  }

  private async requireOpenAttributionConflict(id: number) {
    const conflict = await this.requireAttributionConflict(id);

    if (conflict.status !== 'open') {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_ATTRIBUTION_CONFLICT_CLOSED_MESSAGE
      );
    }

    return conflict;
  }

  private async requireTeacherAgentAudit(id: number) {
    const audit = await this.performanceTeacherAgentAuditEntity.findOneBy({ id });

    if (!audit) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return audit;
  }

  private async findCurrentActiveAttribution(teacherId: number) {
    const rows = await this.findAttributionRowsByTeacher(teacherId);
    return rows.find(item => item.status === 'active') || null;
  }

  private async requireCurrentActiveAttribution(teacherId: number) {
    const current = await this.findCurrentActiveAttribution(teacherId);

    if (!current) {
      throw new CoolCommException(
        PERFORMANCE_TEACHER_CURRENT_ATTRIBUTION_MISSING_MESSAGE
      );
    }

    return current;
  }

  private async findAttributionRowsByTeacher(teacherId: number) {
    const rows =
      ((await this.performanceTeacherAttributionEntity.find?.()) as PerformanceTeacherAttributionEntity[]) ||
      [];

    return rows.filter(item => Number(item.teacherId || 0) === Number(teacherId || 0));
  }

  private async findOpenAttributionConflictsByTeacher(teacherId: number) {
    const rows =
      ((await this.performanceTeacherAttributionConflictEntity.find?.()) as PerformanceTeacherAttributionConflictEntity[]) ||
      [];

    return rows.filter(
      item =>
        Number(item.teacherId || 0) === Number(teacherId || 0) &&
        item.status === 'open'
    );
  }

  private async loadAgentNameMap() {
    const rows =
      ((await this.performanceTeacherAgentEntity.find?.()) as PerformanceTeacherAgentEntity[]) || [];

    return new Map(rows.map(item => [Number(item.id), String(item.name || '')]));
  }

  private async assertNoAgentCycle(
    parentAgentId: number,
    childAgentId: number,
    ignoreRelationId?: number
  ) {
    const rows =
      ((await this.performanceTeacherAgentRelationEntity.find?.()) as PerformanceTeacherAgentRelationEntity[]) ||
      [];
    const activeRows = rows.filter(
      item =>
        item.status === 'active' &&
        Number(item.id || 0) !== Number(ignoreRelationId || 0)
    );
    const adjacency = new Map<number, number[]>();

    activeRows.forEach(item => {
      const parentId = Number(item.parentAgentId || 0);
      const current = adjacency.get(parentId) || [];
      current.push(Number(item.childAgentId || 0));
      adjacency.set(parentId, current);
    });

    const stack = [childAgentId];
    const visited = new Set<number>();

    while (stack.length) {
      const current = Number(stack.pop() || 0);
      if (!current || visited.has(current)) {
        continue;
      }
      if (current === parentAgentId) {
        throw new CoolCommException(PERFORMANCE_TEACHER_AGENT_CYCLE_DENIED_MESSAGE);
      }
      visited.add(current);
      (adjacency.get(current) || []).forEach(item => stack.push(Number(item || 0)));
    }
  }

  private async recordTeacherAgentAudit(
    resourceType: string,
    resourceId: number,
    action: string,
    beforeSnapshot: any,
    afterSnapshot: any,
    scope: TeacherAccessScope
  ) {
    if (!this.performanceTeacherAgentAuditEntity?.save) {
      return;
    }

    await this.performanceTeacherAgentAuditEntity.save(
      this.performanceTeacherAgentAuditEntity.create({
        resourceType,
        resourceId,
        action,
        beforeSnapshot,
        afterSnapshot,
        operatorId: scope.userId,
        operatorName: scope.userName,
      })
    );
  }
}
