/**
 * 会议管理领域服务。
 * 这里负责会议主链查询、维护、删除和会议级签到，不负责逐人签到、参与人名单返回或外部会议系统接入。
 * 维护重点是经理数据范围、摘要字段裁剪和状态流转必须由服务端兜底。
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
import { In, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceMeetingEntity } from '../entity/meeting';

type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

const MEETING_STATUS: MeetingStatus[] = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
];

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

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
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:meeting:page',
    info: 'performance:meeting:info',
    add: 'performance:meeting:add',
    update: 'performance:meeting:update',
    delete: 'performance:meeting:delete',
    checkIn: 'performance:meeting:checkIn',
    hrPage: 'performance:salary:page',
  };

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

  async page(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.page, '无权限查看会议列表');

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
    const filtered = await this.filterRowsByScope(rows, perms);
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
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看会议详情');

    const meeting = await this.requireMeeting(id);
    await this.assertMeetingInScope(meeting, perms, '无权限查看会议详情');

    const organizer = await this.baseSysUserEntity.findOneBy({
      id: Number(meeting.organizerId),
    });

    return this.buildMeetingDetail(meeting, organizer?.name || '');
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增会议');

    const normalized = await this.normalizePayload(payload, null, perms);
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
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改会议');

    const id = Number(payload.id || 0);
    const meeting = await this.requireMeeting(id);
    await this.assertMeetingInScope(meeting, perms, '无权限修改会议');

    const normalized = await this.normalizePayload(payload, meeting, perms);

    await this.performanceMeetingEntity.update({ id: meeting.id }, normalized);
    return this.info(meeting.id);
  }

  async delete(ids: number[]) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.delete, '无权限删除会议');

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
      throw new CoolCommException('数据不存在');
    }

    for (const meeting of meetings) {
      await this.assertMeetingInScope(meeting, perms, '无权限删除会议');

      if (meeting.status !== 'scheduled') {
        throw new CoolCommException('当前状态不允许删除');
      }
    }

    await this.performanceMeetingEntity.delete(validIds);
  }

  async checkIn(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.checkIn, '无权限执行会议签到');

    const meeting = await this.requireMeeting(id);
    await this.assertMeetingInScope(meeting, perms, '无权限执行会议签到');

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
    perms: string[]
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
      ? this.resolveNextStatus(existing.status as MeetingStatus, payload.status, perms)
      : 'scheduled';

    if (!Number.isInteger(organizerId) || organizerId <= 0) {
      throw new CoolCommException('组织者不能为空');
    }

    assertMeetingDateRange(startDate, endDate);

    await this.assertScopedUsers([organizerId, ...participantIds], perms);

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
    perms: string[]
  ): MeetingStatus {
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      throw new CoolCommException('当前状态不允许编辑');
    }

    const nextStatus = String(inputStatus || currentStatus).trim() as MeetingStatus;

    if (!MEETING_STATUS.includes(nextStatus)) {
      throw new CoolCommException('会议状态不合法');
    }

    if (currentStatus === 'scheduled') {
      if (['scheduled', 'in_progress', 'cancelled'].includes(nextStatus)) {
        return nextStatus;
      }
      throw new CoolCommException('当前状态不允许更新到目标状态');
    }

    if (currentStatus === 'in_progress') {
      if (nextStatus === 'cancelled' && !this.isHr(perms)) {
        throw new CoolCommException('当前角色不允许取消进行中的会议');
      }

      if (['in_progress', 'completed', 'cancelled'].includes(nextStatus)) {
        return nextStatus;
      }
    }

    throw new CoolCommException('当前状态不允许更新到目标状态');
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

  private async filterRowsByScope(rows: any[], perms: string[]) {
    if (this.isHr(perms)) {
      return rows;
    }

    const scopeUserIds = await this.resolveScopeUserIds();
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
      throw new CoolCommException('数据不存在');
    }

    return meeting;
  }

  private async assertMeetingInScope(
    meeting: PerformanceMeetingEntity,
    perms: string[],
    message: string
  ) {
    if (this.isHr(perms)) {
      return;
    }

    const scopeUserIds = new Set(await this.resolveScopeUserIds());
    const participantIds = parseParticipantIds(meeting.participantIds);

    if (
      !scopeUserIds.has(Number(meeting.organizerId)) ||
      !participantIds.every(id => scopeUserIds.has(id))
    ) {
      throw new CoolCommException(message);
    }
  }

  private async assertScopedUsers(userIds: number[], perms: string[]) {
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

    if (this.isHr(perms)) {
      return;
    }

    const scopeDepartmentIds = new Set(await this.resolveScopeDepartmentIds());

    const outOfScope = users.some(user => {
      return !scopeDepartmentIds.has(Number(user.departmentId || 0));
    });

    if (outOfScope) {
      throw new CoolCommException('组织者或参与人超出部门范围');
    }
  }

  private async resolveScopeUserIds() {
    const cached = this.currentCtx?.meetingScopeUserIds;

    if (Array.isArray(cached)) {
      return cached.map(item => Number(item));
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    if (!departmentIds.length) {
      this.currentCtx.meetingScopeUserIds = [];
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

    this.currentCtx.meetingScopeUserIds = userIds;
    return userIds;
  }

  private async resolveScopeDepartmentIds() {
    const cached = this.currentCtx?.meetingDepartmentIds;

    if (Array.isArray(cached)) {
      return cached.map(item => Number(item));
    }

    const departmentIds = await this.departmentScopeIds();
    this.currentCtx.meetingDepartmentIds = departmentIds;
    return departmentIds;
  }

  private async currentPerms() {
    const admin = this.currentAdmin;

    if (!admin?.roleIds) {
      throw new CoolCommException('登录状态已失效');
    }

    return this.baseSysMenuService.getPerms(admin.roleIds);
  }

  private assertPerm(perms: string[], perm: string, message: string) {
    if (!perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }

  private hasPerm(perms: string[], perm: string) {
    return perms.includes(perm);
  }

  private isHr(perms: string[]) {
    return (
      this.currentAdmin?.isAdmin === true ||
      this.hasPerm(perms, this.perms.hrPage)
    );
  }

  private async departmentScopeIds() {
    const ids = await this.baseSysPermsService.departmentIds(
      Number(this.currentAdmin?.userId || 0)
    );
    return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
  }
}
