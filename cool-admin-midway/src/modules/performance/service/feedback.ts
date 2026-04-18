/**
 * 360 环评领域服务。
 * 这里负责模块 5 的任务列表、详情、创建、反馈提交和汇总裁剪，不负责前端视图结构或共享鉴权基础层。
 * 维护重点是提交唯一性、截止时间和员工不可见单条反馈内容三个约束必须始终由服务端兜底。
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
import { BaseSysLogEntity } from '../../base/entity/sys/log';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformanceFeedbackRecordEntity } from '../entity/feedback-record';
import { PerformanceFeedbackTaskEntity } from '../entity/feedback-task';

export type FeedbackTaskStatus = 'draft' | 'running' | 'closed';
export type FeedbackRecordStatus = 'draft' | 'submitted';

type FeedbackRelationType = '同级' | '上级' | '下级' | '协作人';

interface FeedbackRelationMappingItem {
  feedbackUserId: number;
  relationType: FeedbackRelationType;
}

const FEEDBACK_RELATION_TYPES: FeedbackRelationType[] = [
  '同级',
  '上级',
  '下级',
  '协作人',
];

const FEEDBACK_EXPORT_LIMIT = 5000;
const FEEDBACK_EXPORT_ACTION = '/admin/performance/feedback/export';
const FEEDBACK_EXPORT_FIELD_VERSION = 'feedback-summary-v1';
const FEEDBACK_EXPORT_ERRORS = {
  denied: '无权限导出该数据',
  noData: '当前筛选条件下无可导出数据',
  overLimit: '导出结果超过上限，请缩小筛选范围后重试',
} as const;

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

const nowString = () => {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

export function calculateFeedbackAverageScore(
  records: Array<{ status?: string; score?: number | string }>
) {
  const submitted = (records || []).filter(
    item => String(item?.status || '') === 'submitted'
  );

  if (!submitted.length) {
    return 0;
  }

  const total = submitted.reduce((sum, item) => {
    return sum + Number(item?.score || 0);
  }, 0);

  return Number((total / submitted.length).toFixed(2));
}

export function assertFeedbackDeadlineOpen(deadline?: string | null, now = nowString()) {
  if (deadline && String(deadline) < String(now)) {
    throw new CoolCommException('截止后不可补交反馈');
  }
}

export function assertFeedbackRecordSubmittable(input: {
  taskStatus?: string | null;
  recordStatus?: string | null;
  deadline?: string | null;
  now?: string;
}) {
  if (String(input.taskStatus || '') === 'closed') {
    throw new CoolCommException('当前环评任务已关闭');
  }

  assertFeedbackDeadlineOpen(input.deadline, input.now);

  if (String(input.recordStatus || 'draft') === 'submitted') {
    throw new CoolCommException('同任务同评价人只能提交一次');
  }
}

function normalizeFeedbackRelationType(value?: string): FeedbackRelationType {
  const relationType = String(value || '').trim() as FeedbackRelationType;

  if (!FEEDBACK_RELATION_TYPES.includes(relationType)) {
    throw new CoolCommException('评价关系不合法');
  }

  return relationType;
}

function normalizeFeedbackScore(value: number | string) {
  const score = Number(value);

  if (!Number.isFinite(score) || score < 0) {
    throw new CoolCommException('评分必须是大于等于 0 的数字');
  }

  return Number(score.toFixed(2));
}

function normalizeFeedbackUserIds(feedbackUserIds: any[]) {
  const normalized = Array.from(
    new Set(
      (feedbackUserIds || [])
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    )
  );

  if (!normalized.length) {
    throw new CoolCommException('请选择至少一名评价人');
  }

  return normalized;
}

function normalizeRelationMapping(
  relationTypes: any[]
): Map<number, FeedbackRelationType> {
  const result = new Map<number, FeedbackRelationType>();

  if (!Array.isArray(relationTypes) || !relationTypes.length) {
    return result;
  }

  for (const item of relationTypes) {
    const feedbackUserId = Number(item?.feedbackUserId);

    if (!Number.isInteger(feedbackUserId) || feedbackUserId <= 0) {
      throw new CoolCommException('评价人关系映射格式不正确');
    }

    result.set(feedbackUserId, normalizeFeedbackRelationType(item?.relationType));
  }

  return result;
}

function normalizePagination(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function compactObject<T extends Record<string, any>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== '')
  ) as Partial<T>;
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceFeedbackService extends BaseService {
  @InjectEntityModel(PerformanceFeedbackTaskEntity)
  performanceFeedbackTaskEntity: Repository<PerformanceFeedbackTaskEntity>;

  @InjectEntityModel(PerformanceFeedbackRecordEntity)
  performanceFeedbackRecordEntity: Repository<PerformanceFeedbackRecordEntity>;

  @InjectEntityModel(PerformanceAssessmentEntity)
  performanceAssessmentEntity: Repository<PerformanceAssessmentEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectEntityModel(BaseSysLogEntity)
  baseSysLogEntity: Repository<BaseSysLogEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:feedback:page',
    info: 'performance:feedback:info',
    add: 'performance:feedback:add',
    submit: 'performance:feedback:submit',
    summary: 'performance:feedback:summary',
    export: 'performance:feedback:export',
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

    if (!this.hasPerm(perms, this.perms.page)) {
      throw new CoolCommException('无权限查看环评任务');
    }

    const page = normalizePagination(query.page, 1);
    const size = normalizePagination(query.size, 20);
    const userId = Number(this.currentAdmin.userId);

    const qb = this.performanceFeedbackTaskEntity
      .createQueryBuilder('task')
      .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = task.employeeId')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = employee.departmentId'
      )
      .leftJoin(BaseSysUserEntity, 'creator', 'creator.id = task.creatorId')
      .leftJoin(
        PerformanceFeedbackRecordEntity,
        'currentRecord',
        'currentRecord.taskId = task.id and currentRecord.feedbackUserId = :currentUserId',
        {
          currentUserId: userId,
        }
      )
      .select([
        'task.id as id',
        'task.assessmentId as assessmentId',
        'task.employeeId as employeeId',
        'task.title as title',
        'task.deadline as deadline',
        'task.creatorId as creatorId',
        'task.status as status',
        'task.createTime as createTime',
        'task.updateTime as updateTime',
        'employee.name as employeeName',
        'employee.departmentId as departmentId',
        'department.name as departmentName',
        'creator.name as creatorName',
        'currentRecord.id as currentRecordId',
        'currentRecord.status as currentRecordStatus',
        'currentRecord.relationType as currentRecordRelationType',
        'currentRecord.submitTime as currentRecordSubmitTime',
      ]);

    await this.applyTaskScope(qb, perms, userId);

    if (query.assessmentId) {
      qb.andWhere('task.assessmentId = :assessmentId', {
        assessmentId: Number(query.assessmentId),
      });
    }

    if (query.employeeId) {
      qb.andWhere('task.employeeId = :employeeId', {
        employeeId: Number(query.employeeId),
      });
    }

    if (query.status) {
      qb.andWhere('task.status = :status', {
        status: String(query.status).trim(),
      });
    }

    if (query.keyword) {
      qb.andWhere('task.title like :keyword', {
        keyword: `%${String(query.keyword).trim()}%`,
      });
    }

    qb.orderBy('task.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    const statsMap = await this.fetchTaskStatsMap(list.map(item => Number(item.id)));

    return {
      list: list.map(item => {
        const stats = statsMap.get(Number(item.id));
        return {
          id: Number(item.id),
          assessmentId: Number(item.assessmentId),
          employeeId: Number(item.employeeId),
          employeeName: item.employeeName || '',
          departmentId: Number(item.departmentId || 0),
          departmentName: item.departmentName || '',
          title: item.title || '',
          deadline: item.deadline || '',
          creatorId: Number(item.creatorId),
          creatorName: item.creatorName || '',
          status: item.status || 'draft',
          submittedCount: stats?.submittedCount || 0,
          totalCount: stats?.totalCount || 0,
          averageScore: stats?.averageScore || 0,
          currentUserRecordStatus: item.currentRecordStatus || '',
          currentUserRelationType: item.currentRecordRelationType || '',
          currentUserSubmitTime: item.currentRecordSubmitTime || '',
          createTime: item.createTime,
          updateTime: item.updateTime,
        };
      }),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.info)) {
      throw new CoolCommException('无权限查看环评详情');
    }

    const task = await this.requireTask(id);
    await this.assertCanViewTask(task, perms);

    const detail = await this.fetchTaskDetailRow(Number(id));
    const statsMap = await this.fetchTaskStatsMap([Number(id)]);
    const stats = statsMap.get(Number(id));
    const records = await this.fetchTaskRecords(Number(id));
    const canViewRecords = await this.canViewDetailedRecords(task, perms);

    return {
      id: Number(detail.id),
      assessmentId: Number(detail.assessmentId),
      employeeId: Number(detail.employeeId),
      employeeName: detail.employeeName || '',
      departmentId: Number(detail.departmentId || 0),
      departmentName: detail.departmentName || '',
      title: detail.title || '',
      deadline: detail.deadline || '',
      creatorId: Number(detail.creatorId),
      creatorName: detail.creatorName || '',
      status: detail.status || 'draft',
      submittedCount: stats?.submittedCount || 0,
      totalCount: stats?.totalCount || 0,
      averageScore: stats?.averageScore || 0,
      currentUserRecord: detail.currentRecordId
        ? {
            id: Number(detail.currentRecordId),
            status: detail.currentRecordStatus || 'draft',
            relationType: detail.currentRecordRelationType || '',
            submitTime: detail.currentRecordSubmitTime || '',
          }
        : null,
      feedbackUsers: canViewRecords
        ? records.map(item => ({
            id: Number(item.id),
            feedbackUserId: Number(item.feedbackUserId),
            feedbackUserName: item.feedbackUserName || '',
            relationType: item.relationType || '',
            status: item.status || 'draft',
            submitTime: item.submitTime || '',
          }))
        : [],
      createTime: detail.createTime,
      updateTime: detail.updateTime,
    };
  }

  async add(payload: any) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.add)) {
      throw new CoolCommException('无权限发起环评');
    }

    const assessmentId = Number(payload.assessmentId);
    const employeeId = Number(payload.employeeId);
    const title = String(payload.title || '').trim();
    const deadline = payload.deadline ? String(payload.deadline).trim() : '';
    const feedbackUserIds = normalizeFeedbackUserIds(payload.feedbackUserIds);
    const relationTypeMap = normalizeRelationMapping(payload.relationTypes);

    if (!assessmentId || !employeeId || !title) {
      throw new CoolCommException('assessmentId、employeeId、title 不能为空');
    }

    if (deadline) {
      assertFeedbackDeadlineOpen(deadline);
    }

    await this.requireAssessment(assessmentId);
    const employee = await this.requireUser(employeeId, '员工不存在');
    await this.assertCanManageEmployee(employee, perms);

    const feedbackUsers = await this.baseSysUserEntity.findBy({
      id: In(feedbackUserIds),
    });

    if (feedbackUsers.length !== feedbackUserIds.length) {
      throw new CoolCommException('评价人不存在');
    }

    const task = await this.performanceFeedbackTaskEntity.save(
      this.performanceFeedbackTaskEntity.create({
        assessmentId,
        employeeId,
        title,
        deadline: deadline || null,
        creatorId: Number(this.currentAdmin.userId),
        status: 'running',
      })
    );

    const recordEntities = feedbackUserIds.map(feedbackUserId => {
      return this.performanceFeedbackRecordEntity.create({
        taskId: Number(task.id),
        feedbackUserId,
        relationType: relationTypeMap.get(feedbackUserId) || '协作人',
        score: 0,
        content: '',
        status: 'draft',
        submitTime: null,
      });
    });

    await this.performanceFeedbackRecordEntity.save(recordEntities);

    return this.info(Number(task.id));
  }

  async submit(payload: any) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.submit)) {
      throw new CoolCommException('无权限提交环评反馈');
    }

    const taskId = Number(payload.taskId);
    const relationType = normalizeFeedbackRelationType(payload.relationType);
    const score = normalizeFeedbackScore(payload.score);
    const content = payload.content ? String(payload.content).trim() : '';

    if (!taskId) {
      throw new CoolCommException('taskId 不能为空');
    }

    const task = await this.requireTask(taskId);
    const userId = Number(this.currentAdmin.userId);
    const record = await this.performanceFeedbackRecordEntity.findOneBy({
      taskId,
      feedbackUserId: userId,
    });

    if (!record) {
      throw new CoolCommException('无权提交该环评反馈');
    }

    assertFeedbackRecordSubmittable({
      taskStatus: task.status,
      recordStatus: record.status,
      deadline: task.deadline,
    });

    await this.performanceFeedbackRecordEntity.update(
      { id: record.id },
      {
        relationType,
        score,
        content,
        status: 'submitted',
        submitTime: nowString(),
      }
    );

    const remainingDraftCount = await this.performanceFeedbackRecordEntity.count({
      where: {
        taskId,
        status: 'draft',
      },
    });

    if (!remainingDraftCount && String(task.status) === 'running') {
      await this.performanceFeedbackTaskEntity.update(
        { id: taskId },
        {
          status: 'closed',
        }
      );
    }

    return this.summary(taskId);
  }

  async summary(id: number) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.summary)) {
      throw new CoolCommException('无权限查看环评汇总');
    }

    const task = await this.requireTask(id);
    await this.assertCanViewSummary(task, perms);

    if (String(task.status) === 'draft') {
      throw new CoolCommException('草稿状态不允许查看汇总结果');
    }

    const records = await this.fetchTaskRecords(Number(id));
    const canViewRecords = await this.canViewDetailedRecords(task, perms);

    return {
      taskId: Number(id),
      averageScore: calculateFeedbackAverageScore(records),
      submittedCount: records.filter(item => item.status === 'submitted').length,
      totalCount: records.length,
      records: canViewRecords
        ? records.map(item => ({
            id: Number(item.id),
            feedbackUserId: Number(item.feedbackUserId),
            feedbackUserName: item.feedbackUserName || '',
            relationType: item.relationType || '',
            score: Number(item.score || 0),
            content: item.content || '',
            status: item.status || 'draft',
            submitTime: item.submitTime || '',
          }))
        : [],
    };
  }

  async export(query: any) {
    let perms: string[] = [];

    try {
      perms = await this.currentPerms();

      if (!this.hasPerm(perms, this.perms.export)) {
        throw new CoolCommException(FEEDBACK_EXPORT_ERRORS.denied);
      }

      const qb = this.performanceFeedbackTaskEntity
        .createQueryBuilder('task')
        .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = task.employeeId')
        .leftJoin(
          BaseSysDepartmentEntity,
          'department',
          'department.id = employee.departmentId'
        )
        .select([
          'task.id as id',
          'task.assessmentId as assessmentId',
          'task.employeeId as employeeId',
          'task.title as title',
          'task.deadline as deadline',
        ]);

      await this.applyTaskExportScope(qb, perms);

      if (query.assessmentId) {
        qb.andWhere('task.assessmentId = :assessmentId', {
          assessmentId: Number(query.assessmentId),
        });
      }

      if (query.employeeId) {
        qb.andWhere('task.employeeId = :employeeId', {
          employeeId: Number(query.employeeId),
        });
      }

      if (query.status) {
        qb.andWhere('task.status = :status', {
          status: String(query.status).trim(),
        });
      }

      if (query.keyword) {
        qb.andWhere('task.title like :keyword', {
          keyword: `%${String(query.keyword).trim()}%`,
        });
      }

      qb.orderBy('task.updateTime', 'DESC');

      const total = await qb.getCount();

      if (!total) {
        throw new CoolCommException(FEEDBACK_EXPORT_ERRORS.noData);
      }

      if (total > FEEDBACK_EXPORT_LIMIT) {
        throw new CoolCommException(FEEDBACK_EXPORT_ERRORS.overLimit);
      }

      const list = await qb.getRawMany();
      const statsMap = await this.fetchTaskStatsMap(list.map(item => Number(item.id)));
      const result = list.map(item => {
        const stats = statsMap.get(Number(item.id));

        return {
          taskId: Number(item.id),
          assessmentId: Number(item.assessmentId),
          employeeId: Number(item.employeeId),
          title: item.title || '',
          deadline: item.deadline || '',
          averageScore: stats?.averageScore || 0,
          submittedCount: stats?.submittedCount || 0,
          totalCount: stats?.totalCount || 0,
        };
      });

      await this.recordExportAudit({
        perms,
        query,
        rowCount: result.length,
        resultStatus: 'success',
      });

      return result;
    } catch (error) {
      await this.recordExportAudit({
        perms,
        query,
        rowCount: 0,
        resultStatus: 'failed',
        failureReason: this.resolveExportFailureReason(error),
      });

      throw error;
    }
  }

  private async fetchTaskDetailRow(taskId: number) {
    const userId = Number(this.currentAdmin.userId);

    const row = await this.performanceFeedbackTaskEntity
      .createQueryBuilder('task')
      .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = task.employeeId')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = employee.departmentId'
      )
      .leftJoin(BaseSysUserEntity, 'creator', 'creator.id = task.creatorId')
      .leftJoin(
        PerformanceFeedbackRecordEntity,
        'currentRecord',
        'currentRecord.taskId = task.id and currentRecord.feedbackUserId = :currentUserId',
        {
          currentUserId: userId,
        }
      )
      .select([
        'task.id as id',
        'task.assessmentId as assessmentId',
        'task.employeeId as employeeId',
        'task.title as title',
        'task.deadline as deadline',
        'task.creatorId as creatorId',
        'task.status as status',
        'task.createTime as createTime',
        'task.updateTime as updateTime',
        'employee.name as employeeName',
        'employee.departmentId as departmentId',
        'department.name as departmentName',
        'creator.name as creatorName',
        'currentRecord.id as currentRecordId',
        'currentRecord.status as currentRecordStatus',
        'currentRecord.relationType as currentRecordRelationType',
        'currentRecord.submitTime as currentRecordSubmitTime',
      ])
      .where('task.id = :taskId', { taskId })
      .getRawOne();

    if (!row) {
      throw new CoolCommException('数据不存在');
    }

    return row;
  }

  private async fetchTaskStatsMap(taskIds: number[]) {
    const validTaskIds = (taskIds || []).filter(item => Number(item) > 0);
    const statsMap = new Map<
      number,
      {
        submittedCount: number;
        totalCount: number;
        averageScore: number;
      }
    >();

    if (!validTaskIds.length) {
      return statsMap;
    }

    const rows = await this.performanceFeedbackRecordEntity
      .createQueryBuilder('record')
      .select('record.taskId', 'taskId')
      .addSelect(
        "SUM(CASE WHEN record.status = 'submitted' THEN 1 ELSE 0 END)",
        'submittedCount'
      )
      .addSelect('COUNT(1)', 'totalCount')
      .addSelect(
        "AVG(CASE WHEN record.status = 'submitted' THEN record.score ELSE NULL END)",
        'averageScore'
      )
      .where('record.taskId in (:...taskIds)', { taskIds: validTaskIds })
      .groupBy('record.taskId')
      .getRawMany();

    for (const row of rows) {
      statsMap.set(Number(row.taskId), {
        submittedCount: Number(row.submittedCount || 0),
        totalCount: Number(row.totalCount || 0),
        averageScore: row.averageScore ? Number(Number(row.averageScore).toFixed(2)) : 0,
      });
    }

    return statsMap;
  }

  private async fetchTaskRecords(taskId: number) {
    return this.performanceFeedbackRecordEntity
      .createQueryBuilder('record')
      .leftJoin(
        BaseSysUserEntity,
        'feedbackUser',
        'feedbackUser.id = record.feedbackUserId'
      )
      .select([
        'record.id as id',
        'record.taskId as taskId',
        'record.feedbackUserId as feedbackUserId',
        'record.relationType as relationType',
        'record.score as score',
        'record.content as content',
        'record.status as status',
        'record.submitTime as submitTime',
        'feedbackUser.name as feedbackUserName',
      ])
      .where('record.taskId = :taskId', { taskId })
      .orderBy('record.id', 'ASC')
      .getRawMany();
  }

  private async currentPerms() {
    return this.baseSysMenuService.getPerms(this.currentAdmin.roleIds);
  }

  private hasPerm(perms: string[], perm: string) {
    return perms.includes(perm);
  }

  private isHr(perms: string[]) {
    return (
      this.currentAdmin.isAdmin === true ||
      this.hasPerm(perms, this.perms.hrPage)
    );
  }

  private async departmentScopeIds() {
    const ids = await this.baseSysPermsService.departmentIds(
      this.currentAdmin.userId
    );
    return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
  }

  private async resolveScopeDepartmentIds() {
    const cached = this.currentCtx?.feedbackDepartmentIds;

    if (Array.isArray(cached)) {
      return cached.map(item => Number(item));
    }

    const departmentIds = await this.departmentScopeIds();
    this.currentCtx.feedbackDepartmentIds = departmentIds;
    return departmentIds;
  }

  private async applyTaskScope(qb: any, perms: string[], userId: number) {
    if (this.isHr(perms)) {
      return;
    }

    if (!this.hasPerm(perms, this.perms.add)) {
      qb.andWhere(
        new Brackets(where => {
          where
            .where('task.employeeId = :currentUserId', {
              currentUserId: userId,
            })
            .orWhere('currentRecord.feedbackUserId = :currentUserId', {
              currentUserId: userId,
            });
        })
      );
      return;
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    qb.andWhere(
      new Brackets(where => {
        if (departmentIds.length) {
          where.where('employee.departmentId in (:...departmentIds)', {
            departmentIds,
          });
          where.orWhere('task.employeeId = :currentUserId', {
            currentUserId: userId,
          });
          where.orWhere('currentRecord.feedbackUserId = :currentUserId', {
            currentUserId: userId,
          });
        } else {
          where
            .where('task.employeeId = :currentUserId', {
              currentUserId: userId,
            })
            .orWhere('currentRecord.feedbackUserId = :currentUserId', {
              currentUserId: userId,
            });
        }
      })
    );
  }

  private async applyTaskExportScope(qb: any, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    if (!departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('employee.departmentId in (:...departmentIds)', { departmentIds });
  }

  private async assertCanViewTask(
    task: PerformanceFeedbackTaskEntity,
    perms: string[]
  ) {
    if (this.isHr(perms)) {
      return;
    }

    const userId = Number(this.currentAdmin.userId);

    if (Number(task.employeeId) === userId) {
      return;
    }

    const currentRecord = await this.performanceFeedbackRecordEntity.findOneBy({
      taskId: Number(task.id),
      feedbackUserId: userId,
    });

    if (currentRecord) {
      return;
    }

    if (!this.hasPerm(perms, this.perms.add)) {
      throw new CoolCommException('无权查看该环评任务');
    }

    const employee = await this.requireUser(Number(task.employeeId), '员工不存在');
    const departmentIds = await this.resolveScopeDepartmentIds();

    if (departmentIds.includes(Number(employee.departmentId))) {
      return;
    }

    throw new CoolCommException('无权查看该环评任务');
  }

  private async assertCanViewSummary(
    task: PerformanceFeedbackTaskEntity,
    perms: string[]
  ) {
    await this.assertCanViewTask(task, perms);
  }

  private async canViewDetailedRecords(
    task: PerformanceFeedbackTaskEntity,
    perms: string[]
  ) {
    if (this.isHr(perms)) {
      return true;
    }

    if (!this.hasPerm(perms, this.perms.add)) {
      return false;
    }

    const employee = await this.requireUser(Number(task.employeeId), '员工不存在');
    const departmentIds = await this.resolveScopeDepartmentIds();

    return departmentIds.includes(Number(employee.departmentId));
  }

  private async assertCanManageEmployee(
    employee: BaseSysUserEntity,
    perms: string[]
  ) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    if (!departmentIds.includes(Number(employee.departmentId))) {
      throw new CoolCommException('无权发起该员工环评任务');
    }
  }

  private async requireTask(id: number) {
    const task = await this.performanceFeedbackTaskEntity.findOneBy({ id });

    if (!task) {
      throw new CoolCommException('数据不存在');
    }

    return task;
  }

  private async requireAssessment(id: number) {
    const assessment = await this.performanceAssessmentEntity.findOneBy({ id });

    if (!assessment) {
      throw new CoolCommException('评估单不存在');
    }

    return assessment;
  }

  private async requireUser(id: number, message: string) {
    const user = await this.baseSysUserEntity.findOneBy({ id });

    if (!user) {
      throw new CoolCommException(message);
    }

    return user;
  }

  private resolveExportFailureReason(error: any) {
    const message = String(error?.message || '');

    switch (message) {
      case FEEDBACK_EXPORT_ERRORS.denied:
        return 'permission_denied';
      case FEEDBACK_EXPORT_ERRORS.noData:
        return 'no_data';
      case FEEDBACK_EXPORT_ERRORS.overLimit:
        return 'over_limit';
      default:
        return 'unknown';
    }
  }

  private resolveExportOperatorRole(perms: string[]) {
    if (this.currentAdmin?.isAdmin === true) {
      return 'admin';
    }

    if (this.isHr(perms)) {
      return 'hr';
    }

    if (
      this.hasPerm(perms, this.perms.export) ||
      this.hasPerm(perms, this.perms.add)
    ) {
      return 'manager';
    }

    return 'employee';
  }

  private buildExportFilterSummary(query: any) {
    return compactObject({
      assessmentId: query?.assessmentId ? Number(query.assessmentId) : undefined,
      employeeId: query?.employeeId ? Number(query.employeeId) : undefined,
      status: query?.status ? String(query.status).trim() : undefined,
      keyword: query?.keyword ? String(query.keyword).trim() : undefined,
    });
  }

  private async recordExportAudit(input: {
    perms: string[];
    query: any;
    rowCount: number;
    resultStatus: 'success' | 'failed';
    failureReason?: string;
  }) {
    if (!this.baseSysLogEntity?.insert) {
      return;
    }

    const operatorId = Number(this.currentAdmin?.userId || 0) || null;
    const params = {
      operatorId,
      operatorRole: this.resolveExportOperatorRole(input.perms || []),
      moduleKey: 'feedback',
      filterSummary: this.buildExportFilterSummary(input.query),
      exportFieldVersion: FEEDBACK_EXPORT_FIELD_VERSION,
      rowCount: input.rowCount,
      triggerTime: nowString(),
      resultStatus: input.resultStatus,
      failureReason: input.failureReason || '',
    };

    await this.baseSysLogEntity.insert(
      this.baseSysLogEntity.create
        ? this.baseSysLogEntity.create({
            userId: operatorId || undefined,
            action: FEEDBACK_EXPORT_ACTION,
            params,
          } as any)
        : ({
            userId: operatorId || undefined,
            action: FEEDBACK_EXPORT_ACTION,
            params,
          } as any)
    );
  }

  async initFeedbackScope() {
    this.currentCtx.feedbackDepartmentIds = await this.departmentScopeIds();
  }
}
