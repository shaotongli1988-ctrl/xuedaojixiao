/**
 * 评估单领域服务。
 * 这里负责评估单主链的查询、保存、提交、审批与权限校验，不负责前端视图组装。
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
import { EntityManager, In, Repository } from 'typeorm';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformanceAssessmentScoreEntity } from '../entity/assessment-score';
import { PerformanceApprovalFlowService } from './approval-flow';
import { PerformanceSuggestionService } from './suggestion';
import * as jwt from 'jsonwebtoken';
import { ASSESSMENT_STATUS_VALUES } from './assessment-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceResolvedAccessContext,
} from './access-context';
import {
  AssessmentScoreInput,
  AssessmentStatus,
  assertAssessmentTransition,
  buildWeightedScoreItems,
  calculateAssessmentTotalScore,
  normalizeAssessmentScores,
  resolveAssessmentGrade,
} from './assessment-helper';

const [
  ASSESSMENT_DRAFT_STATUS,
  ASSESSMENT_SUBMITTED_STATUS,
  ASSESSMENT_APPROVED_STATUS,
  ASSESSMENT_REJECTED_STATUS,
] = ASSESSMENT_STATUS_VALUES;
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound
  );
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateDeleteNotAllowed
  );

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceAssessmentService extends BaseService {
  @InjectEntityModel(PerformanceAssessmentEntity)
  performanceAssessmentEntity: Repository<PerformanceAssessmentEntity>;

  @InjectEntityModel(PerformanceAssessmentScoreEntity)
  performanceAssessmentScoreEntity: Repository<PerformanceAssessmentScoreEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  performanceSuggestionService: PerformanceSuggestionService;

  @Inject()
  performanceApprovalFlowService: PerformanceApprovalFlowService;

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

  async page(query: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const userId = this.currentAdmin.userId;
    const mode = query.mode || 'initiated';
    const page = Number(query.page || 1);
    const size = Number(query.size || 20);

    this.assertPageModePermission(mode, access);

    const qb = this.performanceAssessmentEntity
      .createQueryBuilder('assessment')
      .leftJoin(
        BaseSysUserEntity,
        'employee',
        'employee.id = assessment.employeeId'
      )
      .leftJoin(
        BaseSysUserEntity,
        'assessor',
        'assessor.id = assessment.assessorId'
      )
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = assessment.departmentId'
      )
      .select([
        'assessment.id as id',
        'assessment.code as code',
        'assessment.employeeId as employeeId',
        'assessment.assessorId as assessorId',
        'assessment.departmentId as departmentId',
        'assessment.periodType as periodType',
        'assessment.periodValue as periodValue',
        'assessment.targetCompletion as targetCompletion',
        'assessment.totalScore as totalScore',
        'assessment.grade as grade',
        'assessment.status as status',
        'assessment.submitTime as submitTime',
        'assessment.approveTime as approveTime',
        'assessment.createTime as createTime',
        'assessment.updateTime as updateTime',
        'employee.name as employeeName',
        'assessor.name as assessorName',
        'department.name as departmentName',
      ]);

    if (query.employeeId) {
      qb.andWhere('assessment.employeeId = :employeeId', {
        employeeId: Number(query.employeeId),
      });
    }

    if (query.assessorId) {
      qb.andWhere('assessment.assessorId = :assessorId', {
        assessorId: Number(query.assessorId),
      });
    }

    if (query.periodValue) {
      qb.andWhere('assessment.periodValue = :periodValue', {
        periodValue: query.periodValue,
      });
    }

    if (query.status) {
      qb.andWhere('assessment.status = :status', {
        status: query.status,
      });
    }

    switch (mode) {
      case 'my':
        qb.andWhere('assessment.employeeId = :userId', { userId });
        qb.orderBy('assessment.updateTime', 'DESC');
        break;
      case 'pending':
        qb.andWhere('assessment.status = :pendingStatus', {
          pendingStatus: ASSESSMENT_SUBMITTED_STATUS,
        });

        this.applyCapabilityScopeFilter(
          qb,
          access,
          this.performanceAccessContextService.capabilityScopes(
            access,
            'assessment.review.read'
          ),
          userId
        );

        qb.orderBy('assessment.submitTime', 'ASC');
        break;
      case 'initiated':
      default:
        if (
          !this.performanceAccessContextService
            .capabilityScopes(access, 'assessment.manage.read')
            .includes('company')
        ) {
          qb.andWhere('assessment.assessorId = :userId', { userId });
        }
        qb.orderBy('assessment.createTime', 'DESC');
        break;
    }

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const assessment = await this.requireAssessment(id);
    const access = await this.performanceAccessContextService.resolveAccessContext();

    this.assertCanViewAssessment(assessment, access);

    return this.buildAssessmentDetail(assessment);
  }

  async add(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();

    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        'assessment.manage.create'
      )
    ) {
      throw new CoolCommException('无权限发起评估单');
    }

    const scores = normalizeAssessmentScores(payload.scoreItems || []);
    const summary = this.buildAssessmentSummary(scores);

    const departmentId = await this.resolveDepartmentId(
      Number(payload.employeeId),
      Number(payload.departmentId)
    );

    const assessorId = Number(payload.assessorId || this.currentAdmin.userId);

    this.assertCanCreateAssessment(
      {
        assessorId,
        departmentId,
      },
      access
    );

    const entity = this.performanceAssessmentEntity.create({
      code: payload.code || this.generateAssessmentCode(),
      employeeId: Number(payload.employeeId),
      assessorId,
      departmentId,
      periodType: payload.periodType || 'quarter',
      periodValue: payload.periodValue,
      targetCompletion: Number(payload.targetCompletion || 0),
      totalScore: summary.totalScore,
      grade: summary.grade,
      selfEvaluation: payload.selfEvaluation || '',
      managerFeedback: '',
      status: ASSESSMENT_DRAFT_STATUS,
      submitTime: null,
      approveTime: null,
    });

    const savedId = await this.performanceAssessmentEntity.manager.transaction(
      async manager => {
        const saved = await manager.save(PerformanceAssessmentEntity, entity);
        await this.replaceScoreItems(manager, saved.id, scores);
        return saved.id;
      }
    );

    return this.info(savedId);
  }

  async updateAssessment(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const assessment = await this.requireAssessment(Number(payload.id));

    this.assertCanUpdateAssessment(assessment, access);

    const scores = normalizeAssessmentScores(payload.scoreItems || []);
    const summary = this.buildAssessmentSummary(scores);
    const updateData: Partial<PerformanceAssessmentEntity> = {
      totalScore: summary.totalScore,
      grade: summary.grade,
    };

    if (this.isSelfEditor(assessment, access)) {
      updateData.selfEvaluation = payload.selfEvaluation || '';
      updateData.targetCompletion = Number(payload.targetCompletion || 0);
      if (assessment.status === ASSESSMENT_REJECTED_STATUS) {
        updateData.status = ASSESSMENT_DRAFT_STATUS;
        updateData.approveTime = null;
        updateData.managerFeedback = '';
      }
    } else {
      updateData.employeeId = Number(payload.employeeId || assessment.employeeId);
      updateData.assessorId = Number(payload.assessorId || assessment.assessorId);
      updateData.departmentId = await this.resolveDepartmentId(
        Number(payload.employeeId || assessment.employeeId),
        Number(payload.departmentId || assessment.departmentId)
      );
      updateData.periodType = payload.periodType || assessment.periodType;
      updateData.periodValue = payload.periodValue || assessment.periodValue;
      updateData.targetCompletion = Number(
        payload.targetCompletion ?? assessment.targetCompletion ?? 0
      );
      updateData.selfEvaluation = payload.selfEvaluation || '';
    }

    await this.performanceAssessmentEntity.manager.transaction(async manager => {
      await manager.update(
        PerformanceAssessmentEntity,
        { id: assessment.id },
        updateData
      );
      await this.replaceScoreItems(manager, assessment.id, scores);
    });

    return this.info(assessment.id);
  }

  async delete(ids: number[]) {
    const access = await this.performanceAccessContextService.resolveAccessContext();

    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        'assessment.manage.delete'
      )
    ) {
      throw new CoolCommException('无权限删除评估单');
    }

    for (const id of ids) {
      const assessment = await this.requireAssessment(Number(id));

      if (assessment.status !== ASSESSMENT_DRAFT_STATUS) {
        throw new CoolCommException(PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE);
      }

      this.assertManageScope(assessment, access);
    }

    await this.performanceAssessmentEntity.manager.transaction(async manager => {
      await manager.delete(PerformanceAssessmentScoreEntity, {
        assessmentId: In(ids.map(item => Number(item))),
      });
      await manager.delete(PerformanceAssessmentEntity, ids.map(item => Number(item)));
    });
  }

  async submit(id: number) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const assessment = await this.requireAssessment(id);

    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        'assessment.submit'
      )
    ) {
      throw new CoolCommException('无权限提交评估单');
    }

    if (assessment.employeeId !== this.currentAdmin.userId) {
      throw new CoolCommException('仅允许提交本人评估单');
    }

    assertAssessmentTransition(assessment.status as AssessmentStatus, 'submit');

    const scoreItems = await this.performanceAssessmentScoreEntity.findBy({
      assessmentId: assessment.id,
    });
    const summary = this.buildAssessmentSummary(scoreItems);

    await this.performanceApprovalFlowService.submitAssessment(assessment, summary);

    return this.info(assessment.id);
  }

  async approve(id: number, comment?: string) {
    return this.review(id, 'approve', comment);
  }

  async reject(id: number, comment?: string) {
    return this.review(id, 'reject', comment);
  }

  async export(query: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();

    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        'assessment.export'
      )
    ) {
      throw new CoolCommException('无权限导出评估单');
    }

    const result = await this.page({
      ...query,
      page: 1,
      size: 5000,
      mode: 'initiated',
    });

    return result.list.map(item => {
      return {
        code: item.code,
        employeeName: item.employeeName,
        departmentName: item.departmentName,
        periodType: item.periodType,
        periodValue: item.periodValue,
        assessorName: item.assessorName,
        status: item.status,
        targetCompletion: item.targetCompletion,
        totalScore: item.totalScore,
        grade: item.grade,
        submitTime: item.submitTime,
        approveTime: item.approveTime,
      };
    });
  }

  private async review(
    id: number,
    action: 'approve' | 'reject',
    comment?: string
  ) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const assessment = await this.requireAssessment(id);

    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        action === 'approve'
          ? 'assessment.review.approve'
          : 'assessment.review.reject'
      )
    ) {
      throw new CoolCommException('无权限执行审批操作');
    }

    await this.performanceApprovalFlowService.assertManualReviewAllowed(
      'assessment',
      assessment.id
    );
    assertAssessmentTransition(assessment.status as AssessmentStatus, action);
    await this.assertCanReviewAssessment(assessment, access);

    await this.performanceAssessmentEntity.manager.transaction(
      async (manager: EntityManager) => {
        await manager.getRepository(PerformanceAssessmentEntity).update(
          { id: assessment.id },
          {
            status:
              action === 'approve'
                ? ASSESSMENT_APPROVED_STATUS
                : ASSESSMENT_REJECTED_STATUS,
            managerFeedback: comment || '',
            approveTime: this.now(),
          }
        );

        if (action === 'approve') {
          await this.performanceSuggestionService.syncApprovedAssessmentInTransaction(
            manager,
            {
              id: assessment.id,
              employeeId: Number(assessment.employeeId),
              departmentId: Number(assessment.departmentId),
              periodType: assessment.periodType,
              periodValue: assessment.periodValue,
              status: ASSESSMENT_APPROVED_STATUS,
              grade: assessment.grade,
              totalScore: Number(assessment.totalScore || 0),
              tenantId: assessment.tenantId ?? null,
            }
          );
        }
      }
    );

    return this.info(assessment.id);
  }

  private async buildAssessmentDetail(assessment: PerformanceAssessmentEntity) {
    const [employee, assessor, department, scoreItems] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: assessment.employeeId }),
      this.baseSysUserEntity.findOneBy({ id: assessment.assessorId }),
      this.baseSysDepartmentEntity.findOneBy({ id: assessment.departmentId }),
      this.performanceAssessmentScoreEntity.findBy({ assessmentId: assessment.id }),
    ]);

    return {
      ...assessment,
      employeeId: Number(assessment.employeeId),
      assessorId: Number(assessment.assessorId),
      departmentId: Number(assessment.departmentId),
      targetCompletion: Number(assessment.targetCompletion || 0),
      totalScore: Number(assessment.totalScore || 0),
      employeeName: employee?.name || '',
      assessorName: assessor?.name || '',
      departmentName: department?.name || '',
      scoreItems: buildWeightedScoreItems(scoreItems),
    };
  }

  private normalizeRow(item: any) {
    return {
      ...item,
      id: Number(item.id),
      employeeId: Number(item.employeeId),
      assessorId: Number(item.assessorId),
      departmentId: Number(item.departmentId),
      targetCompletion: Number(item.targetCompletion || 0),
      totalScore: Number(item.totalScore || 0),
    };
  }

  private buildAssessmentSummary(scoreItems: AssessmentScoreInput[]) {
    const totalScore = calculateAssessmentTotalScore(scoreItems);

    return {
      totalScore,
      grade: resolveAssessmentGrade(totalScore),
    };
  }

  private async replaceScoreItems(manager: any, assessmentId: number, items: any[]) {
    await manager.delete(PerformanceAssessmentScoreEntity, { assessmentId });

    if (!items.length) {
      return;
    }

    const rows = items.map(item => {
      if (!item.indicatorName) {
        throw new CoolCommException('评分项名称不能为空');
      }

      return manager.create(PerformanceAssessmentScoreEntity, {
        assessmentId,
        indicatorId: item.indicatorId,
        indicatorName: item.indicatorName,
        score: item.score,
        weight: item.weight,
        comment: item.comment || '',
      });
    });

    await manager.save(PerformanceAssessmentScoreEntity, rows);
  }

  private async requireAssessment(id: number) {
    const assessment = await this.performanceAssessmentEntity.findOneBy({ id });

    if (!assessment) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return assessment;
  }

  private isSelfEditor(
    assessment: PerformanceAssessmentEntity,
    access: PerformanceResolvedAccessContext
  ) {
    return (
      this.performanceAccessContextService.hasCapability(
        access,
        'assessment.self.edit'
      ) &&
      assessment.employeeId === this.currentAdmin.userId
    );
  }

  private assertPageModePermission(
    mode: string,
    access: PerformanceResolvedAccessContext
  ) {
    if (
      mode === 'my' &&
      !this.performanceAccessContextService.hasCapability(
        access,
        'assessment.self.read'
      )
    ) {
      throw new CoolCommException('无权限查看我的考核');
    }

    if (
      mode === 'initiated' &&
      !this.performanceAccessContextService.hasCapability(
        access,
        'assessment.manage.read'
      )
    ) {
      throw new CoolCommException('无权限查看已发起考核');
    }

    if (
      mode === 'pending' &&
      !this.performanceAccessContextService.hasCapability(
        access,
        'assessment.review.read'
      )
    ) {
      throw new CoolCommException('无权限查看待我审批');
    }
  }

  private async assertCanViewAssessment(
    assessment: PerformanceAssessmentEntity,
    access: PerformanceResolvedAccessContext
  ) {
    const selfScopes = this.performanceAccessContextService.capabilityScopes(
      access,
      'assessment.self.read'
    );
    const manageScopes = this.performanceAccessContextService.capabilityScopes(
      access,
      'assessment.manage.read'
    );
    const reviewScopes = this.performanceAccessContextService.capabilityScopes(
      access,
      'assessment.review.read'
    );

    if (!selfScopes.length && !manageScopes.length && !reviewScopes.length) {
      throw new CoolCommException('无权限查看评估单详情');
    }

    if (this.matchesAssessmentScope(access, selfScopes, assessment)) {
      return;
    }

    if (this.matchesAssessmentScope(access, manageScopes, assessment)) {
      return;
    }

    if (this.matchesAssessmentScope(access, reviewScopes, assessment)) {
      return;
    }

    throw new CoolCommException('无权查看该评估单');
  }

  private async assertCanUpdateAssessment(
    assessment: PerformanceAssessmentEntity,
    access: PerformanceResolvedAccessContext
  ) {
    if (
      !this.performanceAccessContextService.hasAnyCapability(access, [
        'assessment.self.edit',
        'assessment.manage.update',
      ])
    ) {
      throw new CoolCommException('无权限修改评估单');
    }

    if (this.isSelfEditor(assessment, access)) {
      if (
        !(
          assessment.status === ASSESSMENT_DRAFT_STATUS ||
          assessment.status === ASSESSMENT_REJECTED_STATUS
        )
      ) {
        throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
      }
      return;
    }

    if (assessment.status !== ASSESSMENT_DRAFT_STATUS) {
      throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
    }

    this.assertManageScope(assessment, access);
  }

  private assertManageScope(
    assessment: PerformanceAssessmentEntity,
    access: PerformanceResolvedAccessContext
  ) {
    const manageScopes = this.performanceAccessContextService.capabilityScopes(
      access,
      'assessment.manage.update'
    );

    if (!this.matchesAssessmentScope(access, manageScopes, assessment)) {
      throw new CoolCommException('仅允许修改本人负责的评估单');
    }
  }

  private async assertCanReviewAssessment(
    assessment: PerformanceAssessmentEntity,
    access: PerformanceResolvedAccessContext
  ) {
    const reviewScopes = this.performanceAccessContextService.capabilityScopes(
      access,
      'assessment.review.approve'
    );

    if (this.matchesAssessmentScope(access, reviewScopes, assessment)) {
      return;
    }

    throw new CoolCommException('无权审批该评估单');
  }

  private assertCanCreateAssessment(
    target: { assessorId: number; departmentId: number },
    access: PerformanceResolvedAccessContext
  ) {
    const createScopes = this.performanceAccessContextService.capabilityScopes(
      access,
      'assessment.manage.create'
    );

    if (
      !this.performanceAccessContextService.matchesScope(access, createScopes, {
        ownerUserId: target.assessorId,
        departmentId: target.departmentId,
      })
    ) {
      throw new CoolCommException('仅允许发起本人负责范围内的评估单');
    }
  }

  private matchesAssessmentScope(
    access: PerformanceResolvedAccessContext,
    scopes: readonly string[],
    assessment: PerformanceAssessmentEntity
  ) {
    return this.performanceAccessContextService.matchesScope(access, scopes as any, {
      subjectUserId: Number(assessment.employeeId),
      ownerUserId: Number(assessment.assessorId),
      departmentId: Number(assessment.departmentId),
    });
  }

  private applyCapabilityScopeFilter(
    qb: any,
    access: PerformanceResolvedAccessContext,
    scopes: readonly string[],
    userId: number
  ) {
    if (scopes.includes('company')) {
      return;
    }

    const hasAssignedScope = scopes.includes('assigned_domain');
    const hasDepartmentScope =
      scopes.includes('department') || scopes.includes('department_tree');

    if (hasAssignedScope && hasDepartmentScope && access.departmentIds.length) {
      qb.andWhere(
        '(assessment.assessorId = :userId or assessment.departmentId in (:...departmentIds))',
        {
          userId,
          departmentIds: access.departmentIds,
        }
      );
      return;
    }

    if (hasDepartmentScope && access.departmentIds.length) {
      qb.andWhere('assessment.departmentId in (:...departmentIds)', {
        departmentIds: access.departmentIds,
      });
      return;
    }

    if (hasAssignedScope) {
      qb.andWhere('assessment.assessorId = :userId', { userId });
      return;
    }

    qb.andWhere('1 = 0');
  }

  private async resolveDepartmentId(employeeId: number, departmentId?: number) {
    if (departmentId) {
      return departmentId;
    }

    const employee = await this.baseSysUserEntity.findOneBy({ id: employeeId });

    if (!employee?.departmentId) {
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE);
    }

    return employee.departmentId;
  }

  private generateAssessmentCode() {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(now.getDate()).padStart(2, '0')}`;
    const random = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}${
      Math.floor(Math.random() * 900) + 100
    }`;

    return `AS${date}${random}`;
  }

  private now() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }
}
