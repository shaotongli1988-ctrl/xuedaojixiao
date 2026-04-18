/**
 * 课程考试结果摘要领域服务。
 * 这里只负责主题14冻结的本人考试/结果摘要只读接口，不负责试卷管理、人工改分、证书发放或外部 AI 推理轨迹暴露。
 * 维护重点是结果状态只能按 locked/pending/passed/failed 计算，并且只依赖本人课程上下文与任务摘要。
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
import { Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceCourseEntity } from '../entity/course';
import { PerformanceCourseEnrollmentEntity } from '../entity/course-enrollment';
import { PerformanceCourseExamResultEntity } from '../entity/course-exam-result';
import { PerformanceCoursePracticeEntity } from '../entity/course-practice';
import { PerformanceCourseReciteEntity } from '../entity/course-recite';
import {
  buildCourseExamSummaryText,
  DEFAULT_COURSE_EXAM_PASS_THRESHOLD,
  normalizeNullableScore,
  normalizePositiveInteger,
  pickLatestTime,
  resolveCourseExamResultStatus,
} from './course-learning-helper';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceCourseExamService extends BaseService {
  @InjectEntityModel(PerformanceCourseEntity)
  performanceCourseEntity: Repository<PerformanceCourseEntity>;

  @InjectEntityModel(PerformanceCourseEnrollmentEntity)
  performanceCourseEnrollmentEntity: Repository<PerformanceCourseEnrollmentEntity>;

  @InjectEntityModel(PerformanceCourseExamResultEntity)
  performanceCourseExamResultEntity: Repository<PerformanceCourseExamResultEntity>;

  @InjectEntityModel(PerformanceCourseReciteEntity)
  performanceCourseReciteEntity: Repository<PerformanceCourseReciteEntity>;

  @InjectEntityModel(PerformanceCoursePracticeEntity)
  performanceCoursePracticeEntity: Repository<PerformanceCoursePracticeEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    summary: 'performance:courseExam:summary',
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

  async summary(courseId: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.summary, '无权限查看考试结果摘要');

    const normalizedCourseId = normalizePositiveInteger(courseId, '课程 ID');
    const userId = this.currentUserId();
    const { course, enrollment } = await this.requireLearningContext(
      normalizedCourseId,
      userId
    );
    const savedSummary = await this.performanceCourseExamResultEntity.findOneBy({
      courseId: normalizedCourseId,
      userId,
    });

    if (savedSummary) {
      return {
        courseId: Number(savedSummary.courseId),
        courseTitle: savedSummary.courseTitle || course.title || '',
        resultStatus: savedSummary.resultStatus,
        latestScore: normalizeNullableScore(savedSummary.latestScore),
        passThreshold: normalizeNullableScore(savedSummary.passThreshold),
        summaryText: savedSummary.summaryText || null,
        updatedAt: savedSummary.updatedAt || null,
      };
    }


    const [reciteTasks, practiceTasks] = await Promise.all([
      this.performanceCourseReciteEntity.findBy({ courseId: normalizedCourseId, userId }),
      this.performanceCoursePracticeEntity.findBy({
        courseId: normalizedCourseId,
        userId,
      }),
    ]);

    const tasks = [...reciteTasks, ...practiceTasks];
    const evaluatedTasks = tasks.filter(item => item.status === 'evaluated');
    const hasSubmitted = tasks.some(item => item.status === 'submitted');
    const latestEvaluatedTask = this.pickLatestEvaluatedTask(evaluatedTasks);
    const fallbackScore = latestEvaluatedTask
      ? normalizeNullableScore(latestEvaluatedTask.latestScore)
      : null;
    const latestScore = normalizeNullableScore(enrollment.score) ?? fallbackScore;
    const passThreshold = evaluatedTasks.length
      ? DEFAULT_COURSE_EXAM_PASS_THRESHOLD
      : null;
    const resultStatus = resolveCourseExamResultStatus({
      hasTask: tasks.length > 0,
      hasSubmitted,
      hasEvaluated: evaluatedTasks.length > 0,
      latestScore,
      passThreshold,
      enrollmentStatus: enrollment.status,
    });
    const updatedAt = pickLatestTime([
      latestEvaluatedTask?.evaluatedAt,
      latestEvaluatedTask?.submittedAt,
      enrollment.updateTime,
      ...tasks.map(item => item.updateTime),
    ]);

    return {
      courseId: Number(course.id),
      courseTitle: course.title || '',
      resultStatus,
      latestScore,
      passThreshold:
        resultStatus === 'passed' || resultStatus === 'failed'
          ? passThreshold
          : null,
      summaryText: buildCourseExamSummaryText(resultStatus, latestScore),
      updatedAt,
    };
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

  private async requireLearningContext(courseId: number, userId: number) {
    const [course, enrollment] = await Promise.all([
      this.performanceCourseEntity.findOneBy({ id: courseId }),
      this.performanceCourseEnrollmentEntity.findOneBy({ courseId, userId }),
    ]);

    if (!course) {
      throw new CoolCommException('数据不存在');
    }

    if (!enrollment || !['published', 'closed'].includes(String(course.status || ''))) {
      throw new CoolCommException('无权访问该课程考试结果');
    }

    return { course, enrollment };
  }

  private pickLatestEvaluatedTask(
    tasks: Array<PerformanceCourseReciteEntity | PerformanceCoursePracticeEntity>
  ) {
    if (!tasks.length) {
      return null;
    }

    return [...tasks].sort((a, b) => {
      const left = String(a.evaluatedAt || a.updateTime || '');
      const right = String(b.evaluatedAt || b.updateTime || '');
      return right.localeCompare(left);
    })[0];
  }
}
