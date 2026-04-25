/**
 * 驾驶舱聚合服务。
 * 这里负责首期 summary 和主题 6 crossSummary 两条只读聚合接口、权限范围裁剪与有界缓存；
 * 不负责评估单、目标、指标库或薪资模块的业务规则维护，也不负责跨域来源快照生产。
 */
import {
  App,
  ASYNC_CONTEXT_KEY,
  ASYNC_CONTEXT_MANAGER_KEY,
  AsyncContextManager,
  IMidwayApplication,
  Inject,
  InjectClient,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { CachingFactory, MidwayCache } from '@midwayjs/cache-manager';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import * as md5 from 'md5';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformanceGoalEntity } from '../entity/goal';
import { PerformanceIndicatorEntity } from '../entity/indicator';
import { PerformanceSalaryEntity } from '../entity/salary';
import { PerformanceAccessContextService } from './access-context';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

interface DashboardQuery {
  periodType?: string;
  periodValue?: string;
  departmentId?: number;
}

interface DashboardCrossSummaryQuery extends DashboardQuery {
  metricCodes?: string[];
}

interface DashboardScope {
  isHr: boolean;
  departmentIds: number[];
  requestedDepartmentId?: number;
  emptyScope: boolean;
}

interface DashboardCrossSummaryScope extends DashboardScope {
  scopeType: 'global' | 'department_tree';
  effectiveDepartmentId: number | null;
}

interface PeriodRange {
  startDate: string;
  endDate: string;
}

interface DashboardStageProgressItem {
  stageKey: string;
  stageLabel: string;
  completedCount: number;
  totalCount: number;
  completionRate: number;
  sort: number;
}

interface CrossMetricDefinition {
  metricCode: string;
  metricLabel: string;
  sourceDomain: 'recruitment' | 'training' | 'meeting';
}

interface CrossMetricSnapshot {
  metricCode: string;
  metricLabel: string;
  sourceDomain: 'recruitment' | 'training' | 'meeting';
  metricValue: number | null;
  unit: string;
  periodType: string;
  periodValue: string;
  scopeType: 'global' | 'department_tree';
  departmentId: number | null;
  updatedAt: string | null;
  sourceStatus: 'ready' | 'delayed' | 'unavailable';
  statusText: string;
}

const CROSS_SUMMARY_METRICS: CrossMetricDefinition[] = [
  {
    metricCode: 'recruitment_completion_rate',
    metricLabel: '招聘达成率',
    sourceDomain: 'recruitment',
  },
  {
    metricCode: 'training_pass_rate',
    metricLabel: '内训通关率',
    sourceDomain: 'training',
  },
  {
    metricCode: 'meeting_effectiveness_index',
    metricLabel: '会议效能看板',
    sourceDomain: 'meeting',
  },
];

const CROSS_SUMMARY_PERIOD_TYPES = ['month', 'quarter', 'year'];
const CROSS_SUMMARY_CACHE_TTL_MS = 60 * 1000;

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceDashboardService extends BaseService {
  @InjectEntityModel(PerformanceAssessmentEntity)
  performanceAssessmentEntity: Repository<PerformanceAssessmentEntity>;

  @InjectEntityModel(PerformanceGoalEntity)
  performanceGoalEntity: Repository<PerformanceGoalEntity>;

  @InjectEntityModel(PerformanceIndicatorEntity)
  performanceIndicatorEntity: Repository<PerformanceIndicatorEntity>;

  @InjectEntityModel(PerformanceSalaryEntity)
  performanceSalaryEntity: Repository<PerformanceSalaryEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectClient(CachingFactory, 'default')
  midwayCache: MidwayCache;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

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

  async summary(query: DashboardQuery) {
    const access = await this.performanceAccessContextService.resolveAccessContext();

    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        'dashboard.summary.read'
      )
    ) {
      throw new CoolCommException('无权限查看绩效驾驶舱');
    }

    const scope = await this.resolveScope(
      query,
      access,
      this.performanceAccessContextService.capabilityScopes(
        access,
        'dashboard.summary.read'
      )
    );

    if (scope.emptyScope) {
      return this.createEmptySummary();
    }

    const [
      averageScore,
      pendingApprovalCount,
      goalCompletionRate,
      departmentDistribution,
      gradeDistribution,
      stageProgress,
    ] = await Promise.all([
      this.fetchAverageScore(query, scope),
      this.fetchPendingApprovalCount(query, scope, access),
      this.fetchGoalCompletionRate(query, scope),
      this.fetchDepartmentDistribution(query, scope),
      this.fetchGradeDistribution(query, scope),
      this.fetchStageProgress(query, scope),
    ]);

    return {
      averageScore,
      pendingApprovalCount,
      goalCompletionRate,
      departmentDistribution,
      gradeDistribution,
      stageProgress,
    };
  }

  async crossSummary(query: DashboardCrossSummaryQuery) {
    const access = await this.performanceAccessContextService.resolveAccessContext();

    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        'dashboard.cross_summary.read'
      )
    ) {
      throw new CoolCommException('无权限查看跨模块驾驶舱');
    }

    const normalizedQuery = this.normalizeCrossSummaryQuery(query);
    const scope = await this.resolveCrossSummaryScope(
      normalizedQuery,
      access,
      this.performanceAccessContextService.capabilityScopes(
        access,
        'dashboard.cross_summary.read'
      )
    );
    const snapshots = this.buildCrossMetricSnapshots(normalizedQuery, scope);
    const cacheKey = this.buildCrossSummaryCacheKey(
      normalizedQuery,
      scope,
      snapshots
    );
    const cached = await this.readCrossSummaryCache(cacheKey);

    if (cached) {
      return cached;
    }

    const response = {
      metricCards: snapshots.map(item => ({
        metricCode: item.metricCode,
        metricLabel: item.metricLabel,
        sourceDomain: item.sourceDomain,
        metricValue: item.metricValue,
        unit: item.unit,
        periodType: item.periodType,
        periodValue: item.periodValue,
        scopeType: item.scopeType,
        departmentId: item.departmentId,
        updatedAt: item.updatedAt,
        dataStatus: item.sourceStatus,
        statusText: item.statusText,
      })),
    };

    await this.writeCrossSummaryCache(cacheKey, response);

    return response;
  }

  private async fetchAverageScore(query: DashboardQuery, scope: DashboardScope) {
    const qb = this.performanceAssessmentEntity
      .createQueryBuilder('assessment')
      .select('AVG(assessment.totalScore)', 'averageScore')
      .where('assessment.status = :status', { status: 'approved' });

    this.applyAssessmentSummaryScope(qb, query, scope);

    const result = await qb.getRawOne();
    return this.toFixedNumber(result?.averageScore);
  }

  private async fetchPendingApprovalCount(
    query: DashboardQuery,
    scope: DashboardScope,
    access: any
  ) {
    const qb = this.performanceAssessmentEntity
      .createQueryBuilder('assessment')
      .select('COUNT(1)', 'pendingApprovalCount')
      .where('assessment.status = :status', { status: 'submitted' });

    this.applyAssessmentPeriodAndDepartmentFilter(qb, query, scope);

    if (scope.isHr) {
      const result = await qb.getRawOne();
      return Number(result?.pendingApprovalCount || 0);
    }

    const userId = Number(this.currentAdmin.userId);
    const departmentIds = scope.departmentIds;

    if (
      this.performanceAccessContextService.hasCapability(
        access,
        'assessment.review.approve'
      )
    ) {
      if (departmentIds.length) {
        qb.andWhere(
          '(assessment.assessorId = :userId OR assessment.departmentId in (:...departmentIds))',
          { userId, departmentIds }
        );
      } else {
        qb.andWhere('assessment.assessorId = :userId', { userId });
      }
    } else {
      qb.andWhere('1 = 0');
    }

    const result = await qb.getRawOne();
    return Number(result?.pendingApprovalCount || 0);
  }

  private async fetchGoalCompletionRate(
    query: DashboardQuery,
    scope: DashboardScope
  ) {
    const qb = this.performanceGoalEntity
      .createQueryBuilder('goal')
      .select(
        "SUM(CASE WHEN goal.status = 'completed' THEN 1 ELSE 0 END)",
        'completedCount'
      )
      .addSelect('COUNT(1)', 'totalCount')
      .where('1 = 1');

    this.applyGoalSummaryScope(qb, query, scope);

    const result = await qb.getRawOne();
    const totalCount = Number(result?.totalCount || 0);
    const completedCount = Number(result?.completedCount || 0);

    if (!totalCount) {
      return 0;
    }

    return this.toFixedNumber((completedCount / totalCount) * 100);
  }

  private async fetchDepartmentDistribution(
    query: DashboardQuery,
    scope: DashboardScope
  ) {
    const qb = this.performanceAssessmentEntity
      .createQueryBuilder('assessment')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = assessment.departmentId'
      )
      .select('assessment.departmentId', 'departmentId')
      .addSelect('department.name', 'departmentName')
      .addSelect('AVG(assessment.totalScore)', 'averageScore')
      .addSelect('COUNT(1)', 'assessmentCount')
      .where('assessment.status = :status', { status: 'approved' })
      .groupBy('assessment.departmentId')
      .addGroupBy('department.name')
      .orderBy('averageScore', 'DESC');

    this.applyAssessmentSummaryScope(qb, query, scope);

    const rows = await qb.getRawMany();

    return rows.map(item => ({
      departmentId: Number(item.departmentId),
      departmentName: item.departmentName || '',
      averageScore: this.toFixedNumber(item.averageScore),
      assessmentCount: Number(item.assessmentCount || 0),
    }));
  }

  private async fetchGradeDistribution(
    query: DashboardQuery,
    scope: DashboardScope
  ) {
    const qb = this.performanceAssessmentEntity
      .createQueryBuilder('assessment')
      .select('assessment.grade', 'grade')
      .addSelect('COUNT(1)', 'count')
      .where('assessment.status = :status', { status: 'approved' })
      .groupBy('assessment.grade');

    this.applyAssessmentSummaryScope(qb, query, scope);

    const rows = await qb.getRawMany();
    const map = new Map<string, number>();

    rows.forEach(item => {
      if (item.grade) {
        map.set(String(item.grade), Number(item.count || 0));
      }
    });

    const total = Array.from(map.values()).reduce((sum, item) => sum + item, 0);

    return ['S', 'A', 'B', 'C'].map(grade => {
      const count = map.get(grade) || 0;
      return {
        grade,
        count,
        ratio: total ? this.toFixedNumber((count / total) * 100) : 0,
      };
    });
  }

  private async fetchStageProgress(
    query: DashboardQuery,
    scope: DashboardScope
  ): Promise<DashboardStageProgressItem[]> {
    const [indicatorConfigured, assessmentProgress, resultArchived] =
      await Promise.all([
        this.fetchIndicatorConfiguredProgress(),
        this.fetchAssessmentStageProgress(query, scope),
        this.fetchResultArchivedProgress(query, scope),
      ]);

    return [
      this.createStageItem(
        'indicatorConfigured',
        '指标库配置',
        indicatorConfigured.completedCount,
        indicatorConfigured.totalCount,
        1
      ),
      this.createStageItem(
        'assessmentCreated',
        '评估单创建',
        assessmentProgress.assessmentCreatedCount,
        assessmentProgress.totalCount,
        2
      ),
      this.createStageItem(
        'selfSubmitted',
        '自评提交',
        assessmentProgress.selfSubmittedCount,
        assessmentProgress.totalCount,
        3
      ),
      this.createStageItem(
        'managerApproved',
        '审批完成',
        assessmentProgress.managerApprovedCount,
        assessmentProgress.totalCount,
        4
      ),
      this.createStageItem(
        'resultArchived',
        '结果归档',
        resultArchived.completedCount,
        resultArchived.totalCount,
        5
      ),
    ];
  }

  private async fetchIndicatorConfiguredProgress() {
    const qb = this.performanceIndicatorEntity
      .createQueryBuilder('indicator')
      .select('COUNT(1)', 'totalCount')
      .addSelect(
        'SUM(CASE WHEN indicator.status = :enabledStatus THEN 1 ELSE 0 END)',
        'configuredCount'
      )
      .where('1 = 1', {
        enabledStatus: 1,
      });

    const result = await qb.getRawOne();

    return {
      totalCount: Number(result?.totalCount || 0),
      completedCount: Number(result?.configuredCount || 0),
    };
  }

  private async fetchAssessmentStageProgress(
    query: DashboardQuery,
    scope: DashboardScope
  ) {
    const qb = this.performanceAssessmentEntity
      .createQueryBuilder('assessment')
      .select('COUNT(1)', 'totalCount')
      .addSelect(
        "SUM(CASE WHEN assessment.status != 'draft' THEN 1 ELSE 0 END)",
        'selfSubmittedCount'
      )
      .addSelect(
        "SUM(CASE WHEN assessment.status in ('approved', 'rejected') THEN 1 ELSE 0 END)",
        'managerApprovedCount'
      )
      .where('1 = 1');

    this.applyAssessmentSummaryScope(qb, query, scope);

    const result = await qb.getRawOne();
    const totalCount = Number(result?.totalCount || 0);

    return {
      totalCount,
      assessmentCreatedCount: totalCount,
      selfSubmittedCount: Number(result?.selfSubmittedCount || 0),
      managerApprovedCount: Number(result?.managerApprovedCount || 0),
    };
  }

  private async fetchResultArchivedProgress(
    query: DashboardQuery,
    scope: DashboardScope
  ) {
    const qb = this.performanceSalaryEntity
      .createQueryBuilder('salary')
      .leftJoin(
        PerformanceAssessmentEntity,
        'assessment',
        'assessment.id = salary.assessmentId'
      )
      .select('COUNT(1)', 'totalCount')
      .addSelect(
        "SUM(CASE WHEN salary.status = 'archived' THEN 1 ELSE 0 END)",
        'archivedCount'
      )
      .where('1 = 1');

    this.applySalaryStageScope(qb, query, scope);

    const result = await qb.getRawOne();

    return {
      totalCount: Number(result?.totalCount || 0),
      completedCount: Number(result?.archivedCount || 0),
    };
  }

  private createStageItem(
    stageKey: string,
    stageLabel: string,
    completedCount: number,
    totalCount: number,
    sort: number
  ) {
    return {
      stageKey,
      stageLabel,
      completedCount,
      totalCount,
      completionRate: totalCount
        ? this.toFixedNumber((completedCount / totalCount) * 100)
        : 0,
      sort,
    };
  }

  private async resolveScope(
    query: DashboardQuery,
    access: any,
    capabilityScopes: readonly string[]
  ) {
    const isHr = capabilityScopes.includes('company');
    const requestedDepartmentId = query.departmentId
      ? Number(query.departmentId)
      : undefined;

    if (isHr) {
      return {
        isHr: true,
        departmentIds: [],
        requestedDepartmentId,
        emptyScope: false,
      } as DashboardScope;
    }

    const departmentIds = access.departmentIds;

    if (requestedDepartmentId && !departmentIds.includes(requestedDepartmentId)) {
      return {
        isHr: false,
        departmentIds,
        requestedDepartmentId,
        emptyScope: true,
      };
    }

    if (!departmentIds.length) {
      return {
        isHr: false,
        departmentIds,
        requestedDepartmentId,
        emptyScope: true,
      };
    }

    return {
      isHr: false,
      departmentIds,
      requestedDepartmentId,
      emptyScope: false,
    };
  }

  private applyAssessmentSummaryScope(
    qb: any,
    query: DashboardQuery,
    scope: DashboardScope
  ) {
    this.applyAssessmentPeriodAndDepartmentFilter(qb, query, scope);

    if (!scope.isHr) {
      qb.andWhere('assessment.departmentId in (:...scopeDepartmentIds)', {
        scopeDepartmentIds: scope.departmentIds,
      });
    }
  }

  private applyAssessmentPeriodAndDepartmentFilter(
    qb: any,
    query: DashboardQuery,
    scope: DashboardScope
  ) {
    if (query.periodType) {
      qb.andWhere('assessment.periodType = :periodType', {
        periodType: query.periodType,
      });
    }

    if (query.periodValue) {
      qb.andWhere('assessment.periodValue = :periodValue', {
        periodValue: query.periodValue,
      });
    }

    if (scope.requestedDepartmentId) {
      qb.andWhere('assessment.departmentId = :requestedDepartmentId', {
        requestedDepartmentId: scope.requestedDepartmentId,
      });
    }
  }

  private applyGoalSummaryScope(
    qb: any,
    query: DashboardQuery,
    scope: DashboardScope
  ) {
    const periodRange = this.resolvePeriodRange(query);

    if (scope.requestedDepartmentId) {
      qb.andWhere('goal.departmentId = :requestedDepartmentId', {
        requestedDepartmentId: scope.requestedDepartmentId,
      });
    }

    if (!scope.isHr) {
      qb.andWhere('goal.departmentId in (:...scopeDepartmentIds)', {
        scopeDepartmentIds: scope.departmentIds,
      });
    }

    if (periodRange) {
      qb.andWhere('goal.startDate <= :periodEndDate', {
        periodEndDate: periodRange.endDate,
      });
      qb.andWhere('goal.endDate >= :periodStartDate', {
        periodStartDate: periodRange.startDate,
      });
    }
  }

  private applySalaryStageScope(
    qb: any,
    query: DashboardQuery,
    scope: DashboardScope
  ) {
    if (query.periodValue) {
      qb.andWhere('salary.periodValue = :periodValue', {
        periodValue: String(query.periodValue),
      });
    }

    if (scope.requestedDepartmentId) {
      qb.andWhere('assessment.departmentId = :requestedDepartmentId', {
        requestedDepartmentId: scope.requestedDepartmentId,
      });
    }

    if (!scope.isHr) {
      qb.andWhere('assessment.departmentId in (:...scopeDepartmentIds)', {
        scopeDepartmentIds: scope.departmentIds,
      });
    }
  }

  private resolvePeriodRange(query: DashboardQuery): PeriodRange | undefined {
    const periodValue = String(query.periodValue || '').trim();
    const periodType = String(query.periodType || '').trim();

    if (!periodValue) {
      return undefined;
    }

    const normalizedType =
      periodType || this.inferPeriodType(periodValue) || undefined;

    if (!normalizedType) {
      return undefined;
    }

    if (normalizedType === 'year' && /^\d{4}$/.test(periodValue)) {
      return {
        startDate: `${periodValue}-01-01`,
        endDate: `${periodValue}-12-31`,
      };
    }

    if (normalizedType === 'month') {
      const match = periodValue.match(/^(\d{4})-(\d{1,2})$/);
      if (!match) {
        return undefined;
      }
      const year = Number(match[1]);
      const month = Number(match[2]);
      const endDay = new Date(year, month, 0).getDate();
      return {
        startDate: `${match[1]}-${String(month).padStart(2, '0')}-01`,
        endDate: `${match[1]}-${String(month).padStart(2, '0')}-${String(
          endDay
        ).padStart(2, '0')}`,
      };
    }

    if (normalizedType === 'quarter') {
      const match = periodValue.match(/^(\d{4})-?Q([1-4])$/i);
      if (!match) {
        return undefined;
      }
      const year = Number(match[1]);
      const quarter = Number(match[2]);
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const endDay = new Date(year, endMonth, 0).getDate();
      return {
        startDate: `${year}-${String(startMonth).padStart(2, '0')}-01`,
        endDate: `${year}-${String(endMonth).padStart(2, '0')}-${String(
          endDay
        ).padStart(2, '0')}`,
      };
    }

    return undefined;
  }

  private inferPeriodType(periodValue: string) {
    if (/^\d{4}$/.test(periodValue)) {
      return 'year';
    }

    if (/^\d{4}-(0?[1-9]|1[0-2])$/.test(periodValue)) {
      return 'month';
    }

    if (/^\d{4}-?Q[1-4]$/i.test(periodValue)) {
      return 'quarter';
    }

    return '';
  }

  private normalizeCrossSummaryQuery(query: DashboardCrossSummaryQuery) {
    const periodValue = String(query.periodValue || '').trim();
    const requestedPeriodType = String(query.periodType || '').trim();
    const periodType =
      requestedPeriodType || this.inferPeriodType(periodValue) || '';

    if (
      requestedPeriodType &&
      !CROSS_SUMMARY_PERIOD_TYPES.includes(requestedPeriodType)
    ) {
      throw new CoolCommException('periodType 仅支持 month / quarter / year');
    }

    const metricCodes = Array.from(
      new Set(
        (query.metricCodes || [])
          .map(item => String(item || '').trim())
          .filter(Boolean)
      )
    );

    const invalidMetricCode = metricCodes.find(code => {
      return !CROSS_SUMMARY_METRICS.some(item => item.metricCode === code);
    });

    if (invalidMetricCode) {
      throw new CoolCommException('metricCodes 包含未冻结指标族');
    }

    const departmentId =
      query.departmentId === undefined || query.departmentId === null
        ? undefined
        : Number(query.departmentId);

    if (
      departmentId !== undefined &&
      (!Number.isFinite(departmentId) || departmentId <= 0)
    ) {
      throw new CoolCommException('departmentId 参数错误');
    }

    return {
      periodType,
      periodValue,
      departmentId,
      metricCodes,
    };
  }

  private async resolveCrossSummaryScope(
    query: DashboardCrossSummaryQuery,
    access: any,
    capabilityScopes: readonly string[]
  ): Promise<DashboardCrossSummaryScope> {
    const isHr = capabilityScopes.includes('company');
    const requestedDepartmentId = query.departmentId
      ? Number(query.departmentId)
      : undefined;

    if (isHr) {
      return {
        isHr: true,
        departmentIds: [],
        requestedDepartmentId,
        effectiveDepartmentId: requestedDepartmentId ?? null,
        scopeType: requestedDepartmentId ? 'department_tree' : 'global',
        emptyScope: false,
      };
    }

    const departmentIds = access.departmentIds;

    if (requestedDepartmentId && !departmentIds.includes(requestedDepartmentId)) {
      throw new CoolCommException('无权查看该部门范围跨模块驾驶舱');
    }

    return {
      isHr: false,
      departmentIds,
      requestedDepartmentId,
      effectiveDepartmentId: requestedDepartmentId ?? null,
      scopeType: 'department_tree',
      emptyScope: !departmentIds.length,
    };
  }

  private buildCrossMetricSnapshots(
    query: DashboardCrossSummaryQuery,
    scope: DashboardCrossSummaryScope
  ) {
    const selectedCodes = new Set(query.metricCodes || []);
    const definitions = CROSS_SUMMARY_METRICS.filter(item => {
      return !selectedCodes.size || selectedCodes.has(item.metricCode);
    });

    return definitions.map(item => ({
      metricCode: item.metricCode,
      metricLabel: item.metricLabel,
      sourceDomain: item.sourceDomain,
      metricValue: null,
      unit: '',
      periodType: query.periodType || '',
      periodValue: query.periodValue || '',
      scopeType: scope.scopeType,
      departmentId: scope.effectiveDepartmentId,
      updatedAt: null,
      sourceStatus: 'unavailable',
      statusText: '暂不可用',
    })) as CrossMetricSnapshot[];
  }

  private buildCrossSummaryCacheKey(
    query: DashboardCrossSummaryQuery,
    scope: DashboardCrossSummaryScope,
    snapshots: CrossMetricSnapshot[]
  ) {
    const payload = {
      metricCodes: snapshots.map(item => item.metricCode),
      roleScope: scope.isHr ? 'company' : 'department',
      scopeType: scope.scopeType,
      requestedDepartmentId: scope.requestedDepartmentId ?? null,
      effectiveDepartmentId: scope.effectiveDepartmentId,
      departmentIds: scope.departmentIds.slice().sort((a, b) => a - b),
      periodType: query.periodType || '',
      periodValue: query.periodValue || '',
      snapshotVersion: snapshots.map(item => ({
        metricCode: item.metricCode,
        updatedAt: item.updatedAt || '',
        sourceStatus: item.sourceStatus,
      })),
    };

    return `dashboard-cross-summary:${md5(
      JSON.stringify(payload)
    )}`;
  }

  private async readCrossSummaryCache(cacheKey: string) {
    if (!this.midwayCache) {
      return null;
    }

    try {
      const cached = await this.midwayCache.get(cacheKey);
      return cached && typeof cached === 'object' ? cached : null;
    } catch (error) {
      return null;
    }
  }

  private async writeCrossSummaryCache(cacheKey: string, value: any) {
    if (!this.midwayCache) {
      return;
    }

    try {
      await this.midwayCache.set(cacheKey, value, CROSS_SUMMARY_CACHE_TTL_MS);
    } catch (error) {
      return;
    }
  }

  private createEmptySummary() {
    return {
      averageScore: 0,
      pendingApprovalCount: 0,
      goalCompletionRate: 0,
      departmentDistribution: [],
      gradeDistribution: ['S', 'A', 'B', 'C'].map(grade => ({
        grade,
        count: 0,
        ratio: 0,
      })),
      stageProgress: [
        this.createStageItem('indicatorConfigured', '指标库配置', 0, 0, 1),
        this.createStageItem('assessmentCreated', '评估单创建', 0, 0, 2),
        this.createStageItem('selfSubmitted', '自评提交', 0, 0, 3),
        this.createStageItem('managerApproved', '审批完成', 0, 0, 4),
        this.createStageItem('resultArchived', '结果归档', 0, 0, 5),
      ],
    };
  }

  private toFixedNumber(value: any) {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue)
      ? Number(numericValue.toFixed(2))
      : 0;
  }

}
