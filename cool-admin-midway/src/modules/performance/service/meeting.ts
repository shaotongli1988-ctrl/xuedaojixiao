/**
 * 会议管理领域服务。
 * 这里负责会议主链查询、维护、删除和会议级签到，不负责逐人签到、参与人名单返回或外部会议系统接入。
 * 维护重点是经理数据范围、摘要字段裁剪和状态流转必须由服务端兜底。
 */
import {
  App,
  IMidwayApplication,
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceMeetingEntity } from '../entity/meeting';
import { MEETING_STATUS_VALUES } from './meeting-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
  resolvePerformanceRuntimeContext,
} from './access-context';

type MeetingStatus = (typeof MEETING_STATUS_VALUES)[number];
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateDeleteNotAllowed
  );
const PERFORMANCE_STATE_TARGET_UPDATE_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateTargetUpdateNotAllowed
  );
const PERFORMANCE_MEETING_STATUS_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.meetingStatusInvalid
  );
const PERFORMANCE_MEETING_CANCEL_ROLE_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.meetingCancelRoleDenied
  );

const nowString = () => {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

function normalizeText(value: any, maxLength?: number) {
  const text = String(value || '').trim();
  if (!maxLength || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}

function normalizeOptionalText(value: any, maxLength?: number) {
  const text = normalizeText(value, maxLength);
  return text || null;
}

function normalizePagination(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeParticipantIds(value: any) {
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    )
  );
}

function parseParticipantIds(value: any) {
  if (Array.isArray(value)) {
    return normalizeParticipantIds(value);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      return normalizeParticipantIds(JSON.parse(value));
    } catch (error) {
      return [];
    }
  }

  return [];
}

function assertMeetingDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    throw new CoolCommException('开始时间和结束时间不能为空');
  }

  if (startDate > endDate) {
    throw new CoolCommException('开始时间不能晚于结束时间');
  }
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceMeetingService extends BaseService {
  @InjectEntityModel(PerformanceMeetingEntity)
  performanceMeetingEntity: Repository<PerformanceMeetingEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private get currentCtx() {
    return resolvePerformanceRuntimeContext({
      ctx: this.ctx,
      app: this.app,
    });
  }

  async page(query: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'meeting.page', '无权限查看会议列表');

    const page = normalizePagination(query.page, 1);
    const size = normalizePagination(query.size, 20);
    const qb = this.performanceMeetingEntity
      .createQueryBuilder('meeting')
      .leftJoin(BaseSysUserEntity, 'organizer', 'organizer.id = meeting.organizerId')
      .select([
        'meeting.id as id',
        'meeting.title as title',
        'meeting.code as code',
        'meeting.type as type',
        'meeting.description as description',
        'meeting.startDate as startDate',
        'meeting.endDate as endDate',
        'meeting.location as location',
        'meeting.organizerId as organizerId',
        'meeting.participantIds as participantIds',
        'meeting.participantCount as participantCount',
        'meeting.status as status',
        'meeting.createTime as createTime',
        'meeting.updateTime as updateTime',
        'organizer.name as organizerName',
        'organizer.departmentId as organizerDepartmentId',
      ]);

    if (query.keyword) {
      const keyword = `%${normalizeText(query.keyword)}%`;
      qb.andWhere('(meeting.title like :keyword OR meeting.code like :keyword)', {
        keyword,
      });
    }

    if (query.status) {
      qb.andWhere('meeting.status = :status', {
        status: String(query.status).trim(),
      });
    }

    if (query.startDate) {
      qb.andWhere('meeting.startDate >= :startDate', {
        startDate: normalizeText(query.startDate, 19),
      });
    }

    if (query.endDate) {
      qb.andWhere('meeting.endDate <= :endDate', {
        endDate: normalizeText(query.endDate, 19),
      });
    }

    qb.orderBy('meeting.updateTime', 'DESC');

    const rows = await qb.getRawMany();
    const filtered = await this.filterRowsByScope(rows, access);
    const list = filtered
      .slice((page - 1) * size, page * size)
      .map(item => this.normalizeMeetingSummary(item));

    return {
      list,
      pagination: {
        page,
        size,
        total: filtered.length,
      },
    };
  }

  async info(id: number) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'meeting.read', '无权限查看会议详情');

    const meeting = await this.requireMeeting(id);
    await this.assertMeetingInScope(
      meeting,
      access,
      'meeting.read',
      '无权限查看会议详情'
    );

    const organizer = await this.baseSysUserEntity.findOneBy({
      id: Number(meeting.organizerId),
    });

    return this.buildMeetingDetail(meeting, organizer?.name || '');
  }

  async add(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'meeting.create', '无权限新增会议');

    const normalized = await this.normalizePayload(
      payload,
      null,
      access,
      'meeting.create'
    );
    const saved = await this.performanceMeetingEntity.save(
      this.performanceMeetingEntity.create({
        ...normalized,
        status: 'scheduled',
        lastCheckInTime: null,
      })
    );

    return this.info(saved.id);
  }

  async updateMeeting(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'meeting.update', '无权限修改会议');

    const id = Number(payload.id || 0);
    const meeting = await this.requireMeeting(id);
    await this.assertMeetingInScope(
      meeting,
      access,
      'meeting.update',
      '无权限修改会议'
    );

    const normalized = await this.normalizePayload(
      payload,
      meeting,
      access,
      'meeting.update'
    );

    await this.performanceMeetingEntity.update({ id: meeting.id }, normalized);
    return this.info(meeting.id);
  }

  async delete(ids: number[]) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'meeting.delete', '无权限删除会议');

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

    const meetings = await this.performanceMeetingEntity.findBy({
      id: In(validIds),
    });

    if (meetings.length !== validIds.length) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    for (const meeting of meetings) {
      await this.assertMeetingInScope(
        meeting,
        access,
        'meeting.delete',
        '无权限删除会议'
      );

      if (meeting.status !== 'scheduled') {
        throw new CoolCommException(PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE);
      }
    }

    await this.performanceMeetingEntity.delete(validIds);
  }

  async checkIn(id: number) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'meeting.checkin', '无权限执行会议签到');

    const meeting = await this.requireMeeting(id);
    await this.assertMeetingInScope(
      meeting,
      access,
      'meeting.checkin',
      '无权限执行会议签到'
    );

    if (meeting.status !== 'in_progress') {
      throw new CoolCommException('当前状态不允许签到');
    }

    await this.performanceMeetingEntity.update(
      { id: meeting.id },
      { lastCheckInTime: nowString() }
    );

    return this.info(meeting.id);
  }

  private async normalizePayload(
    payload: any,
    existing: PerformanceMeetingEntity | null,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const title = normalizeText(payload.title || existing?.title, 200);
    const code = normalizeOptionalText(payload.code ?? existing?.code, 100);
    const type = normalizeOptionalText(payload.type ?? existing?.type, 100);
    const description = normalizeOptionalText(
      payload.description ?? existing?.description
    );
    const startDate = normalizeText(payload.startDate ?? existing?.startDate, 19);
    const endDate = normalizeText(payload.endDate ?? existing?.endDate, 19);
    const location = normalizeOptionalText(
      payload.location ?? existing?.location,
      200
    );
    const organizerId = Number(payload.organizerId ?? existing?.organizerId ?? 0);
    const participantIds =
      payload.participantIds !== undefined
        ? normalizeParticipantIds(payload.participantIds)
        : parseParticipantIds(existing?.participantIds);

    if (!title) {
      throw new CoolCommException('会议标题不能为空');
    }

    const nextStatus = existing
      ? this.resolveNextStatus(existing.status as MeetingStatus, payload.status, access)
      : 'scheduled';

    if (!Number.isInteger(organizerId) || organizerId <= 0) {
      throw new CoolCommException('组织者不能为空');
    }

    assertMeetingDateRange(startDate, endDate);

    await this.assertScopedUsers(
      [organizerId, ...participantIds],
      access,
      capabilityKey
    );

    if (existing) {
      this.assertEditableFields(existing, {
        title,
        code,
        type,
        description,
        startDate,
        endDate,
        location,
        organizerId,
        participantIds,
      });
    }

    return {
      title,
      code,
      type,
      description,
      startDate,
      endDate,
      location,
      organizerId,
      participantIds,
      participantCount: participantIds.length,
      status: nextStatus,
    };
  }

  private resolveNextStatus(
    currentStatus: MeetingStatus,
    inputStatus: any,
    access: PerformanceResolvedAccessContext
  ): MeetingStatus {
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
    }

    const nextStatus = String(inputStatus || currentStatus).trim() as MeetingStatus;

    if (!MEETING_STATUS_VALUES.includes(nextStatus)) {
      throw new CoolCommException(PERFORMANCE_MEETING_STATUS_INVALID_MESSAGE);
    }

    if (currentStatus === 'scheduled') {
      if (['scheduled', 'in_progress', 'cancelled'].includes(nextStatus)) {
        return nextStatus;
      }
      throw new CoolCommException(
        PERFORMANCE_STATE_TARGET_UPDATE_NOT_ALLOWED_MESSAGE
      );
    }

    if (currentStatus === 'in_progress') {
      if (nextStatus === 'cancelled' && !this.hasCompanyScope(access, 'meeting.update')) {
        throw new CoolCommException(PERFORMANCE_MEETING_CANCEL_ROLE_DENIED_MESSAGE);
      }

      if (['in_progress', 'completed', 'cancelled'].includes(nextStatus)) {
        return nextStatus;
      }
    }

    throw new CoolCommException(PERFORMANCE_STATE_TARGET_UPDATE_NOT_ALLOWED_MESSAGE);
  }

  private assertEditableFields(
    existing: PerformanceMeetingEntity,
    next: {
      title: string;
      code: string | null;
      type: string | null;
      description: string | null;
      startDate: string;
      endDate: string;
      location: string | null;
      organizerId: number;
      participantIds: number[];
    }
  ) {
    if (existing.status !== 'in_progress') {
      return;
    }

    const currentParticipants = parseParticipantIds(existing.participantIds);
    const changed =
      next.title !== String(existing.title || '') ||
      next.code !== (existing.code || null) ||
      next.type !== (existing.type || null) ||
      next.description !== (existing.description || null) ||
      next.startDate !== String(existing.startDate || '') ||
      next.endDate !== String(existing.endDate || '') ||
      next.location !== (existing.location || null) ||
      next.organizerId !== Number(existing.organizerId) ||
      JSON.stringify(next.participantIds) !== JSON.stringify(currentParticipants);

    if (changed) {
      throw new CoolCommException('当前状态只允许更新会议状态');
    }
  }

  private async filterRowsByScope(
    rows: any[],
    access: PerformanceResolvedAccessContext
  ) {
    if (this.hasCompanyScope(access, 'meeting.page')) {
      return rows;
    }

    const scopeUserIds = await this.resolveScopeUserIds(access);
    const scopeUserIdSet = new Set(scopeUserIds);

    return rows.filter(item => {
      const organizerId = Number(item.organizerId || 0);
      const participantIds = parseParticipantIds(item.participantIds);
      return (
        scopeUserIdSet.has(organizerId) &&
        participantIds.every(participantId => scopeUserIdSet.has(participantId))
      );
    });
  }

  private normalizeMeetingSummary(item: any) {
    return {
      id: Number(item.id),
      title: item.title || '',
      code: item.code || null,
      type: item.type || null,
      description: item.description || null,
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      location: item.location || null,
      organizerId: Number(item.organizerId || 0),
      organizerName: item.organizerName || '',
      participantCount: Number(item.participantCount || 0),
      status: item.status || 'scheduled',
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private buildMeetingDetail(
    meeting: PerformanceMeetingEntity,
    organizerName: string
  ) {
    return {
      id: Number(meeting.id),
      title: meeting.title || '',
      code: meeting.code || null,
      type: meeting.type || null,
      description: meeting.description || null,
      startDate: meeting.startDate || '',
      endDate: meeting.endDate || '',
      location: meeting.location || null,
      organizerId: Number(meeting.organizerId || 0),
      organizerName,
      participantCount: Number(meeting.participantCount || 0),
      status: meeting.status || 'scheduled',
      createTime: meeting.createTime,
      updateTime: meeting.updateTime,
    };
  }

  private async requireMeeting(id: number) {
    const meeting = await this.performanceMeetingEntity.findOneBy({ id });

    if (!meeting) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return meeting;
  }

  private async assertMeetingInScope(
    meeting: PerformanceMeetingEntity,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    if (this.hasCompanyScope(access, capabilityKey)) {
      return;
    }

    const scopeUserIds = new Set(await this.resolveScopeUserIds(access));
    const participantIds = parseParticipantIds(meeting.participantIds);

    if (
      !scopeUserIds.has(Number(meeting.organizerId)) ||
      !participantIds.every(id => scopeUserIds.has(id))
    ) {
      throw new CoolCommException(message);
    }
  }

  private async assertScopedUsers(
    userIds: number[],
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const validIds = Array.from(
      new Set(
        (userIds || [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );

    if (!validIds.length) {
      return;
    }

    const users = await this.baseSysUserEntity.findBy({ id: In(validIds) });

    if (users.length !== validIds.length) {
      throw new CoolCommException('组织者或参与人不存在');
    }

    if (this.hasCompanyScope(access, capabilityKey)) {
      return;
    }

    const scopeDepartmentIds = new Set(await this.resolveScopeDepartmentIds(access));

    const outOfScope = users.some(user => {
      return !scopeDepartmentIds.has(Number(user.departmentId || 0));
    });

    if (outOfScope) {
      throw new CoolCommException('组织者或参与人超出部门范围');
    }
  }

  private async resolveScopeUserIds(access: PerformanceResolvedAccessContext) {
    const cached = this.currentCtx?.meetingScopeUserIds;

    if (Array.isArray(cached)) {
      return cached.map(item => Number(item));
    }

    const departmentIds = await this.resolveScopeDepartmentIds(access);

    if (!departmentIds.length) {
      if (this.currentCtx) {
        this.currentCtx.meetingScopeUserIds = [];
      }
      return [];
    }

    const users = await this.baseSysUserEntity.find({
      select: ['id', 'departmentId'],
      where: {
        departmentId: In(departmentIds),
      },
    });
    const userIds = users
      .map(item => Number(item.id))
      .filter(item => Number.isInteger(item) && item > 0);

    if (this.currentCtx) {
      this.currentCtx.meetingScopeUserIds = userIds;
    }
    return userIds;
  }

  private async resolveScopeDepartmentIds(access: PerformanceResolvedAccessContext) {
    const cached = this.currentCtx?.meetingDepartmentIds;

    if (Array.isArray(cached)) {
      return cached.map(item => Number(item));
    }

    const departmentIds = Array.isArray(access.departmentIds)
      ? access.departmentIds.map(item => Number(item))
      : [];
    if (this.currentCtx) {
      this.currentCtx.meetingDepartmentIds = departmentIds;
    }
    return departmentIds;
  }

  private assertHasCapability(
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    if (!this.performanceAccessContextService.hasCapability(access, capabilityKey)) {
      throw new CoolCommException(message);
    }
  }

  private hasCompanyScope(
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    return this.performanceAccessContextService.capabilityScopes(
      access,
      capabilityKey
    ).includes('company');
  }
}
