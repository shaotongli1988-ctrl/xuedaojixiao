/**
 * 课程背诵任务领域服务。
 * 这里只负责主题14首批冻结的本人背诵任务列表、详情和文本提交，不负责任务生成、真实 AI 供应商适配或考试试卷管理。
 * 维护重点是始终以“员工本人 + 已报名课程”作为访问边界，且详情之外不返回提交全文。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceCourseEntity } from '../entity/course';
import { PerformanceCourseEnrollmentEntity } from '../entity/course-enrollment';
import { PerformanceCourseReciteEntity } from '../entity/course-recite';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  normalizeNullableScore,
  normalizeNullableText,
  normalizePositiveInteger,
  normalizeSubmissionText,
  normalizeTaskStatus,
} from './course-learning-helper';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_COURSE_EVALUATED_TASK_RESUBMIT_DENIED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.courseEvaluatedTaskResubmitDenied
  );

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
  performanceAccessContextService: PerformanceAccessContextService;

  private readonly perms = {
    page: PERMISSIONS.performance.courseRecite.page,
    info: PERMISSIONS.performance.courseRecite.info,
    submit: PERMISSIONS.performance.courseRecite.submit,
  };

  async page(query: any) {
    const access = await this.requireAccess(
      'course.recite.read',
      '无权限查看背诵任务列表'
    );

    const page = normalizePositiveInteger(query?.page, '页码', 1);
    const size = normalizePositiveInteger(query?.size, '页大小', 20);
    const courseId = normalizePositiveInteger(query?.courseId, '课程 ID');
    const status = normalizeTaskStatus(query?.status);
    const userId = access.userId;
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
    const access = await this.requireAccess(
      'course.recite.read',
      '无权限查看背诵任务详情'
    );

    const userId = access.userId;
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
    const access = await this.requireAccess(
      'course.recite.submit',
      '无权限提交背诵任务'
    );

    const userId = access.userId;
    const id = normalizePositiveInteger(payload?.id, '任务 ID');
    const submissionText = normalizeSubmissionText(payload?.submissionText);
    const task = await this.requireTask(id, userId, '无权提交该背诵任务');

    await this.requireLearningCourse(
      Number(task.courseId),
      userId,
      '无权访问该课程学习任务'
    );

    if (task.status === 'evaluated') {
      throw new CoolCommException(
        PERFORMANCE_COURSE_EVALUATED_TASK_RESUBMIT_DENIED_MESSAGE
      );
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

  private async requireAccess(
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ): Promise<PerformanceResolvedAccessContext> {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    if (!this.performanceAccessContextService.hasCapability(access, capabilityKey)) {
      throw new CoolCommException(message);
    }
    return access;
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
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    if (!enrollment || !['published', 'closed'].includes(String(course.status || ''))) {
      throw new CoolCommException(message);
    }

    return course;
  }

  private async requireTask(id: number, userId: number, message: string) {
    const task = await this.performanceCourseReciteEntity.findOneBy({ id });
    if (!task) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
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
