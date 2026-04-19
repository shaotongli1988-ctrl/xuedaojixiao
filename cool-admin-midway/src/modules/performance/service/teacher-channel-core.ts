/**
 * 班主任渠道合作后端核心服务。
 * 这里统一承载主题19冻结的 teacherInfo / teacherFollow / teacherCooperation / teacherClass / teacherDashboard / teacherTodo 最小闭环，
 * 不负责代理体系、绩效、结算、复杂报表、附件上传或外部通知。
 * 维护重点是四档数据范围、只读脱敏、合作/班级状态机和跨资源归属一致性必须由服务端硬兜底。
 */
import {
  App,
  ASYNC_CONTEXT_KEY,
  ASYNC_CONTEXT_MANAGER_KEY,
  AsyncContextManager,
  IMidwayApplication,
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceTeacherClassEntity } from '../entity/teacher-class';
import { PerformanceTeacherFollowEntity } from '../entity/teacher-follow';
import { PerformanceTeacherInfoEntity } from '../entity/teacher-info';

type TeacherCooperationStatus =
  | 'uncontacted'
  | 'contacted'
  | 'negotiating'
  | 'partnered'
  | 'terminated';
type TeacherClassStatus = 'draft' | 'active' | 'closed';
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

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

const TEACHER_COOPERATION_STATUS: TeacherCooperationStatus[] = [
  'uncontacted',
  'contacted',
  'negotiating',
  'partnered',
  'terminated',
];
const TEACHER_CLASS_STATUS: TeacherClassStatus[] = ['draft', 'active', 'closed'];

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

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    teacherInfoPage: 'performance:teacherInfo:page',
    teacherInfoInfo: 'performance:teacherInfo:info',
    teacherInfoAdd: 'performance:teacherInfo:add',
    teacherInfoUpdate: 'performance:teacherInfo:update',
    teacherInfoAssign: 'performance:teacherInfo:assign',
    teacherInfoUpdateStatus: 'performance:teacherInfo:updateStatus',
    teacherFollowPage: 'performance:teacherFollow:page',
    teacherFollowAdd: 'performance:teacherFollow:add',
    teacherCooperationMark: 'performance:teacherCooperation:mark',
    teacherClassPage: 'performance:teacherClass:page',
    teacherClassInfo: 'performance:teacherClass:info',
    teacherClassAdd: 'performance:teacherClass:add',
    teacherClassUpdate: 'performance:teacherClass:update',
    teacherClassDelete: 'performance:teacherClass:delete',
    teacherDashboardSummary: 'performance:teacherDashboard:summary',
    teacherTodoPage: 'performance:teacherTodo:page',
  };

  private readonly writePerms = [
    this.perms.teacherInfoAdd,
    this.perms.teacherInfoUpdate,
    this.perms.teacherInfoAssign,
    this.perms.teacherInfoUpdateStatus,
    this.perms.teacherFollowAdd,
    this.perms.teacherCooperationMark,
    this.perms.teacherClassAdd,
    this.perms.teacherClassUpdate,
    this.perms.teacherClassDelete,
  ];

  private get currentCtx() {
    if (this.ctx?.admin) {
      return this.ctx;
    }

    try {
      const contextManager: AsyncContextManager = this.app
        .getApplicationContext()
        .get(ASYNC_CONTEXT_MANAGER_KEY);
      return contextManager.active().getValue(ASYNC_CONTEXT_KEY) as any;
    } catch (error) {
      return this.ctx;
    }
  }

  private get currentAdmin() {
    if (this.currentCtx?.admin) {
      return this.currentCtx.admin;
    }

    const token =
      this.currentCtx?.get?.('Authorization') ||
      this.currentCtx?.headers?.authorization;

    if (!token) {
      return undefined;
    }

    try {
      return jwt.verify(token, resolveBaseJwtConfig(this.app).secret);
    } catch (error) {
      return undefined;
    }
  }

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
    if (scope.isReadonly) {
      throw new CoolCommException('只读账号无权限新增班主任资源');
    }

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
    this.assertPerm(perms, this.perms.teacherInfoAssign, '无权限分配班主任资源');

    const scope = await this.resolveScope(perms);
    if (!scope.canAssign) {
      throw new CoolCommException('无权限分配班主任资源');
    }

    const teacher = await this.requireTeacher(
      normalizeRequiredPositiveInt(payload.id, '班主任资源 ID 不合法')
    );
    this.assertTeacherReadable(teacher, scope, '无权分配该班主任资源');

    const targetUser = await this.requireUser(
      normalizeRequiredPositiveInt(payload.ownerEmployeeId, '归属员工不存在')
    );

    if (!this.canAssignTargetDepartment(scope, Number(targetUser.departmentId || 0))) {
      throw new CoolCommException('无权分配到目标归属部门');
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
        throw new CoolCommException('当前状态不允许推进到洽谈中');
      }
    } else if (targetStatus === 'terminated') {
      if (!scope.canTerminateTeacher) {
        throw new CoolCommException('仅管理层或部门负责人可终止合作');
      }
      if (currentStatus !== 'partnered') {
        throw new CoolCommException('仅已合作班主任可终止合作');
      }
    } else {
      throw new CoolCommException('当前接口仅支持 negotiating 或 terminated');
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
      throw new CoolCommException('至少存在一条跟进记录后才允许标记合作');
    }

    if (!['contacted', 'negotiating'].includes(String(teacher.cooperationStatus || '').trim())) {
      throw new CoolCommException('当前合作状态不允许标记为已合作');
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
    if (scope.isReadonly) {
      throw new CoolCommException('只读账号无权限新增班级');
    }

    const teacher = await this.requireTeacher(
      normalizeRequiredPositiveInt(payload.teacherId, '班主任资源不存在')
    );
    this.assertTeacherWritable(teacher, scope, '无权为该班主任创建班级');

    if (teacher.cooperationStatus === 'terminated') {
      throw new CoolCommException('已终止合作的班主任不可新建班级');
    }

    if (teacher.cooperationStatus !== 'partnered') {
      throw new CoolCommException('仅已合作班主任可创建班级');
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
      throw new CoolCommException('已关闭班级不可编辑');
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
    if (scope.isReadonly) {
      throw new CoolCommException('只读账号无权限删除班级');
    }

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
      throw new CoolCommException('数据不存在');
    }

    rows.forEach(item => {
      this.assertClassWritable(item, scope, '无权删除该班级');

      if (item.status !== 'draft') {
        throw new CoolCommException('仅草稿班级允许删除');
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

  private async currentPerms() {
    const admin = this.currentAdmin;

    if (!admin?.roleIds) {
      throw new CoolCommException('登录状态已失效');
    }

    return this.baseSysMenuService.getPerms(admin.roleIds);
  }

  private hasPerm(perms: string[], perm: string) {
    return perms.includes(perm);
  }

  private assertPerm(perms: string[], perm: string, message: string) {
    if (!this.hasPerm(perms, perm)) {
      throw new CoolCommException(message);
    }
  }

  private async resolveScope(perms: string[]): Promise<TeacherAccessScope> {
    const currentUser = await this.requireUser(Number(this.currentAdmin?.userId || 0), '登录状态已失效');
    const isGlobal =
      this.currentAdmin?.isAdmin === true ||
      this.currentAdmin?.username === 'admin';
    const isReadonly = !this.writePerms.some(perm => this.hasPerm(perms, perm));
    const canAssign = !isReadonly && (isGlobal || this.hasPerm(perms, this.perms.teacherInfoAssign));
    const departmentIds = isGlobal ? null : await this.loadDepartmentIds(Number(currentUser.id || 0));
    const effectiveGlobal = isGlobal || (!!canAssign && (departmentIds?.length || 0) === 0);
    const scopeType: TeacherScopeType = isGlobal
      ? 'global'
      : canAssign || (isReadonly && (departmentIds?.length || 0) > 0)
        ? 'department'
        : 'self';

    return {
      scopeType: effectiveGlobal ? 'global' : scopeType,
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

  private canAssignTargetDepartment(scope: TeacherAccessScope, departmentId: number) {
    if (!scope.canAssign) {
      return false;
    }

    if (scope.scopeType === 'global') {
      return true;
    }

    return !!scope.departmentIds?.includes(departmentId);
  }

  private async loadDepartmentIds(userId: number) {
    if (!userId) {
      throw new CoolCommException('登录状态已失效');
    }

    const ids = await this.baseSysPermsService.departmentIds(userId);
    return Array.from(
      new Set(
        (Array.isArray(ids) ? ids : [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );
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
      throw new CoolCommException('只读账号无写权限');
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
      throw new CoolCommException('只读账号无写权限');
    }

    this.assertClassReadable(teacherClass, scope, message);
  }

  private assertClassTransition(
    currentStatus: TeacherClassStatus,
    targetStatus: TeacherClassStatus,
    scope: TeacherAccessScope
  ) {
    if (currentStatus === 'closed') {
      throw new CoolCommException('已关闭班级不可编辑');
    }

    if (currentStatus === 'draft') {
      if (!['draft', 'active'].includes(targetStatus)) {
        throw new CoolCommException('草稿班级仅允许更新为 draft 或 active');
      }
      return;
    }

    if (currentStatus === 'active') {
      if (targetStatus === 'active') {
        return;
      }

      if (targetStatus === 'closed') {
        if (!scope.canCloseClass) {
          throw new CoolCommException('仅管理层或部门负责人可关闭班级');
        }
        return;
      }
    }

    throw new CoolCommException('当前班级状态不允许执行该操作');
  }

  private normalizeTeacherStatus(value: any) {
    const status = String(value || '').trim() as TeacherCooperationStatus;

    if (!TEACHER_COOPERATION_STATUS.includes(status)) {
      throw new CoolCommException('班主任合作状态不合法');
    }

    return status;
  }

  private normalizeClassStatus(value: any) {
    const status = String(value || '').trim() as TeacherClassStatus;

    if (!TEACHER_CLASS_STATUS.includes(status)) {
      throw new CoolCommException('班级状态不合法');
    }

    return status;
  }

  private normalizeTeacherPayload(payload: any) {
    const status = String(payload.cooperationStatus || '').trim();

    if (status && status !== 'uncontacted') {
      throw new CoolCommException('新增或编辑班主任资源不可直接指定合作状态');
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
      throw new CoolCommException('数据不存在');
    }

    return teacher;
  }

  private async requireTeacherClass(id: number) {
    const teacherClass = await this.performanceTeacherClassEntity.findOneBy({ id });

    if (!teacherClass) {
      throw new CoolCommException('数据不存在');
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
}
