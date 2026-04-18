/**
 * 课程背诵任务领域服务。
 * 这里只负责主题14首批冻结的本人背诵任务列表、详情和文本提交，不负责任务生成、真实 AI 供应商适配或考试试卷管理。
 * 维护重点是始终以“员工本人 + 已报名课程”作为访问边界，且详情之外不返回提交全文。
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
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceCourseEntity } from '../entity/course';
import { PerformanceCourseEnrollmentEntity } from '../entity/course-enrollment';
import { PerformanceCourseReciteEntity } from '../entity/course-recite';
import {
  normalizeNullableScore,
  normalizeNullableText,
  normalizePositiveInteger,
  normalizeSubmissionText,
  normalizeTaskStatus,
} from './course-learning-helper';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceCourseReciteService extends BaseService {
  @InjectEntityModel(PerformanceCourseReciteEntity)
  performanceCourseReciteEntity: Repository<PerformanceCourseReciteEntity>;

  @InjectEntityModel(PerformanceCourseEntity)
  performanceCourseEntity: Repository<PerformanceCourseEntity>;

  @InjectEntityModel(PerformanceCourseEnrollmentEntity)
  performanceCourseEnrollmentEntity: Repository<PerformanceCourseEnrollmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:courseRecite:page',
    info: 'performance:courseRecite:info',
    submit: 'performance:courseRecite:submit',
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
    this.assertPerm(perms, this.perms.page, '无权限查看背诵任务列表');

    const page = normalizePositiveInteger(query?.page, '页码', 1);
    const size = normalizePositiveInteger(query?.size, '页大小', 20);
    const courseId = normalizePositiveInteger(query?.courseId, '课程 ID');
    const status = normalizeTaskStatus(query?.status);
    const userId = this.currentUserId();
    const course = await this.requireLearningCourse(
      courseId,
      userId,
      '无权访问该课程学习任务'
    );

    const [list, total] = await this.performanceCourseReciteEntity.findAndCount({
      where: {
        courseId,
        userId,
        ...(status ? { status } : {}),
      },
      order: {
        updateTime: 'DESC',
        id: 'DESC',
      } as any,
      skip: (page - 1) * size,
      take: size,
    });

    return {
      list: list.map(item => this.toTaskSummary(item, course.title || '')),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看背诵任务详情');

    const userId = this.currentUserId();
    const task = await this.requireTask(
      Number(id),
      userId,
      '无权访问该背诵任务'
    );
    const course = await this.requireLearningCourse(
      Number(task.courseId),
      userId,
      '无权访问该课程学习任务'
    );

    return this.toTaskDetail(task, task.courseTitle || course.title || '');
  }

  async submit(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.submit, '无权限提交背诵任务');

    const userId = this.currentUserId();
    const id = normalizePositiveInteger(payload?.id, '任务 ID');
    const submissionText = normalizeSubmissionText(payload?.submissionText);
    const task = await this.requireTask(id, userId, '无权提交该背诵任务');

    await this.requireLearningCourse(
      Number(task.courseId),
      userId,
      '无权访问该课程学习任务'
    );

    if (task.status === 'evaluated') {
      throw new CoolCommException('已评估任务不可再次提交');
    }

    await this.performanceCourseReciteEntity.update(
      { id: task.id },
      {
        submissionText,
        status: 'submitted',
        submittedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        latestScore: null,
        feedbackSummary: null,
        evaluatedAt: null,
      }
    );

    return this.info(task.id);
  }

  private async currentPerms() {
    const admin = this.currentAdmin;
    if (!admin?.roleIds) {
      throw new CoolCommException('登录状态已失效');
    }
    return this.baseSysMenuService.getPerms(admin.roleIds);
  }

  private currentUserId() {
    const userId = Number(this.currentAdmin?.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new CoolCommException('登录状态已失效');
    }
    return userId;
  }

  private assertPerm(perms: string[], perm: string, message: string) {
    if (!perms.includes(perm)) {
      throw new CoolCommException(message);
    }
  }

  private async requireLearningCourse(
    courseId: number,
    userId: number,
    message: string
  ) {
    const [course, enrollment] = await Promise.all([
      this.performanceCourseEntity.findOneBy({ id: courseId }),
      this.performanceCourseEnrollmentEntity.findOneBy({ courseId, userId }),
    ]);

    if (!course) {
      throw new CoolCommException('数据不存在');
    }

    if (!enrollment || !['published', 'closed'].includes(String(course.status || ''))) {
      throw new CoolCommException(message);
    }

    return course;
  }

  private async requireTask(id: number, userId: number, message: string) {
    const task = await this.performanceCourseReciteEntity.findOneBy({ id });
    if (!task) {
      throw new CoolCommException('数据不存在');
    }
    if (Number(task.userId) !== Number(userId)) {
      throw new CoolCommException(message);
    }
    return task;
  }

  private toTaskSummary(
    task: Partial<PerformanceCourseReciteEntity>,
    courseTitle: string
  ) {
    return {
      id: Number(task.id || 0),
      courseId: Number(task.courseId || 0),
      courseTitle: task.courseTitle || courseTitle || '',
      title: task.title || '',
      taskType: 'recite',
      status: task.status || 'pending',
      latestScore: normalizeNullableScore(task.latestScore),
      feedbackSummary: normalizeNullableText(task.feedbackSummary),
      submittedAt: normalizeNullableText(task.submittedAt),
      evaluatedAt: normalizeNullableText(task.evaluatedAt),
    };
  }

  private toTaskDetail(
    task: Partial<PerformanceCourseReciteEntity>,
    courseTitle: string
  ) {
    return {
      ...this.toTaskSummary(task, courseTitle),
      promptText: task.promptText || '',
      submissionText: normalizeNullableText(task.submissionText),
    };
  }
}
