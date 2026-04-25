/**
 * 课程考试结果摘要领域服务。
 * 这里只负责主题14冻结的本人考试/结果摘要只读接口，不负责试卷管理、人工改分、证书发放或外部 AI 推理轨迹暴露。
 * 维护重点是结果状态只能按 locked/pending/passed/failed 计算，并且只依赖本人课程上下文与任务摘要。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { PerformanceCourseEntity } from '../entity/course';
import { PerformanceCourseEnrollmentEntity } from '../entity/course-enrollment';
import { PerformanceCourseExamResultEntity } from '../entity/course-exam-result';
import { PerformanceCoursePracticeEntity } from '../entity/course-practice';
import { PerformanceCourseReciteEntity } from '../entity/course-recite';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  buildCourseExamSummaryText,
  DEFAULT_COURSE_EXAM_PASS_THRESHOLD,
  normalizeNullableScore,
  normalizePositiveInteger,
  pickLatestTime,
  resolveCourseExamResultStatus,
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
  performanceAccessContextService: PerformanceAccessContextService;

  private readonly perms = {
    summary: PERMISSIONS.performance.courseExam.summary,
  };

  async summary(courseId: number) {
    const access = await this.requireAccess(
      'course.exam.summary',
      '无权限查看考试结果摘要'
    );

    const normalizedCourseId = normalizePositiveInteger(courseId, '课程 ID');
    const userId = access.userId;
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

  private async requireLearningContext(courseId: number, userId: number) {
    const [course, enrollment] = await Promise.all([
      this.performanceCourseEntity.findOneBy({ id: courseId }),
      this.performanceCourseEnrollmentEntity.findOneBy({ courseId, userId }),
    ]);

    if (!course) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
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
