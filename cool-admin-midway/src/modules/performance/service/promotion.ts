/**
 * 晋升管理领域服务。
 * 这里负责晋升单主链查询、维护、提交评审和评审记录，不负责 PIP、薪资或自动推荐能力。
 * 维护重点是两条创建路径、状态流转和数据范围必须严格对齐唯一事实源。
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
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformancePromotionEntity } from '../entity/promotion';
import { PerformancePromotionRecordEntity } from '../entity/promotion-record';
import { PerformanceSuggestionEntity } from '../entity/suggestion';
import { PerformanceApprovalFlowService } from './approval-flow';
import * as jwt from 'jsonwebtoken';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';
import {
  assertPromotionTransition,
  normalizeNullableNumber,
  normalizePromotionDecision,
  type PromotionDecision,
  type PromotionStatus,
  validatePromotionPayload,
} from './promotion-helper';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_SOURCE_SUGGESTION_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.sourceSuggestionNotFound
  );
const PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound,
    '员工部门不存在'
  );
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_SUGGESTION_LINKED_ENTITY_TYPE_MISMATCH_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.suggestionLinkedEntityTypeMismatch
  );
const PERFORMANCE_SUGGESTION_ACCEPTED_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAcceptedOnly
  );
const PERFORMANCE_SUGGESTION_EMPLOYEE_MISMATCH_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.suggestionEmployeeMismatch
  );
const PERFORMANCE_SUGGESTION_ASSESSMENT_MISMATCH_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAssessmentMismatch
  );
const PERFORMANCE_SUGGESTION_ALREADY_LINKED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.suggestionAlreadyLinked
  );

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformancePromotionService extends BaseService {
  @InjectEntityModel(PerformancePromotionEntity)
  performancePromotionEntity: Repository<PerformancePromotionEntity>;

  @InjectEntityModel(PerformancePromotionRecordEntity)
  performancePromotionRecordEntity: Repository<PerformancePromotionRecordEntity>;

  @InjectEntityModel(PerformanceAssessmentEntity)
  performanceAssessmentEntity: Repository<PerformanceAssessmentEntity>;

  @InjectEntityModel(PerformanceSuggestionEntity)
  performanceSuggestionEntity: Repository<PerformanceSuggestionEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  ctx;

  @Inject()
  performanceApprovalFlowService: PerformanceApprovalFlowService;

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
    this.assertHasCapability(access, 'promotion.read', '无权限查看晋升列表');

    const page = Number(query.page || 1);
    const size = Number(query.size || 20);
    const qb = this.performancePromotionEntity
      .createQueryBuilder('promotion')
      .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = promotion.employeeId')
      .leftJoin(BaseSysUserEntity, 'sponsor', 'sponsor.id = promotion.sponsorId')
      .select([
        'promotion.id as id',
        'promotion.assessmentId as assessmentId',
        'promotion.employeeId as employeeId',
        'promotion.sponsorId as sponsorId',
        'promotion.fromPosition as fromPosition',
        'promotion.toPosition as toPosition',
        'promotion.reason as reason',
        'promotion.sourceReason as sourceReason',
        'promotion.status as status',
        'promotion.reviewTime as reviewTime',
        'promotion.createTime as createTime',
        'promotion.updateTime as updateTime',
        'employee.name as employeeName',
        'employee.departmentId as employeeDepartmentId',
        'sponsor.name as sponsorName',
      ]);

    this.applyScope(qb, access, 'promotion.read');

    if (query.employeeId) {
      qb.andWhere('promotion.employeeId = :employeeId', {
        employeeId: Number(query.employeeId),
      });
    }

    if (query.assessmentId) {
      qb.andWhere('promotion.assessmentId = :assessmentId', {
        assessmentId: Number(query.assessmentId),
      });
    }

    if (query.status) {
      qb.andWhere('promotion.status = :status', { status: query.status });
    }

    if (query.toPosition) {
      qb.andWhere('promotion.toPosition like :toPosition', {
        toPosition: `%${String(query.toPosition).trim()}%`,
      });
    }

    qb.orderBy('promotion.updateTime', 'DESC');

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
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const promotion = await this.requirePromotion(id);

    this.assertHasCapability(access, 'promotion.read', '无权限查看晋升详情');

    await this.assertPromotionInScope(promotion.employeeId, access, 'promotion.read');
    return this.buildPromotionDetail(promotion);
  }

  async add(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'promotion.create', '无权限创建晋升单');

    const normalized = await this.normalizePayload(payload, access, 'promotion.create');
    const saved = await this.performancePromotionEntity.manager.transaction(
      async manager => {
        const entity = this.performancePromotionEntity.create({
          assessmentId: normalized.assessmentId,
          employeeId: normalized.employeeId,
          sponsorId: normalized.sponsorId,
          fromPosition: normalized.fromPosition,
          toPosition: normalized.toPosition,
          reason: normalized.reason,
          sourceReason: normalized.sourceReason,
          status: 'draft',
          reviewTime: null,
        });
        const created = await manager.save(PerformancePromotionEntity, entity);

        await this.linkSuggestionIfPresent(manager, payload, {
          entityType: 'promotion',
          entityId: Number(created.id),
          assessmentId: normalized.assessmentId || null,
          employeeId: normalized.employeeId,
        });

        return created;
      }
    );

    return this.info(saved.id);
  }

  async updatePromotion(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const promotion = await this.requirePromotion(Number(payload.id));

    this.assertHasCapability(access, 'promotion.update', '无权限修改晋升单');

    if (promotion.status !== 'draft') {
      throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
    }

    this.assertIsSponsor(promotion.sponsorId);
    const normalized = await this.normalizePayload(
      {
        ...promotion,
        ...payload,
        sponsorId: promotion.sponsorId,
      },
      access,
      'promotion.update'
    );

    await this.performancePromotionEntity.update(
      { id: promotion.id },
      {
        assessmentId: normalized.assessmentId,
        employeeId: normalized.employeeId,
        sponsorId: promotion.sponsorId,
        fromPosition: normalized.fromPosition,
        toPosition: normalized.toPosition,
        reason: normalized.reason,
        sourceReason: normalized.sourceReason,
      }
    );

    return this.info(promotion.id);
  }

  async submit(id: number) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const promotion = await this.requirePromotion(id);

    this.assertHasCapability(access, 'promotion.submit', '无权限提交晋升单');

    this.assertIsSponsor(promotion.sponsorId);
    await this.assertPromotionInScope(
      promotion.employeeId,
      access,
      'promotion.submit'
    );
    assertPromotionTransition(promotion.status as PromotionStatus, 'submit');

    await this.performanceApprovalFlowService.submitPromotion(promotion);

    return this.info(promotion.id);
  }

  async review(id: number, decision: any, comment?: string) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const promotion = await this.requirePromotion(id);

    this.assertHasCapability(access, 'promotion.review', '无权限评审晋升单');

    await this.performanceApprovalFlowService.assertManualReviewAllowed(
      'promotion',
      promotion.id
    );
    await this.assertPromotionInScope(promotion.employeeId, access, 'promotion.review');

    const normalizedDecision = normalizePromotionDecision(decision);
    assertPromotionTransition(
      promotion.status as PromotionStatus,
      normalizedDecision
    );

    await this.performancePromotionEntity.manager.transaction(async manager => {
      await manager.update(
        PerformancePromotionEntity,
        { id: promotion.id },
        {
          status: normalizedDecision,
          reviewTime: this.now(),
        }
      );

      await manager.save(
        PerformancePromotionRecordEntity,
        manager.create(PerformancePromotionRecordEntity, {
          promotionId: promotion.id,
          reviewerId: this.currentAdmin.userId,
          decision: normalizedDecision,
          comment: comment ? String(comment).trim() : '',
        })
      );
    });

    return this.info(promotion.id);
  }

  private async normalizePayload(
    payload: any,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const assessmentId = normalizeNullableNumber(payload.assessmentId);
    let employeeId = Number(payload.employeeId || 0);

    if (assessmentId) {
      const assessment = await this.performanceAssessmentEntity.findOneBy({
        id: assessmentId,
      });

      if (!assessment) {
        throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
      }

      if (employeeId && employeeId !== Number(assessment.employeeId)) {
        throw new CoolCommException('评估单与员工不匹配');
      }

      employeeId = employeeId || Number(assessment.employeeId);
    }

    const currentUserId = Number(this.currentAdmin?.userId || 0);
    const sponsorId = Number(payload.sponsorId || currentUserId || 0);

    validatePromotionPayload({
      assessmentId,
      employeeId,
      sponsorId,
      fromPosition: payload.fromPosition,
      toPosition: payload.toPosition,
      sourceReason: payload.sourceReason,
    });

    if (!currentUserId || sponsorId !== currentUserId) {
      throw new CoolCommException('发起人必须是当前登录人');
    }

    await this.assertPromotionInScope(employeeId, access, capabilityKey);

    return {
      assessmentId,
      employeeId,
      sponsorId,
      fromPosition: String(payload.fromPosition || '').trim(),
      toPosition: String(payload.toPosition || '').trim(),
      reason: payload.reason ? String(payload.reason).trim() : '',
      sourceReason: payload.sourceReason
        ? String(payload.sourceReason).trim()
        : '',
    };
  }

  private async linkSuggestionIfPresent(
    manager: any,
    payload: any,
    context: {
      entityType: 'promotion';
      entityId: number;
      assessmentId: number | null;
      employeeId: number;
    }
  ) {
    const suggestionId = Number(payload?.suggestionId || 0);

    if (!suggestionId) {
      return;
    }

    const suggestion = await manager
      .getRepository(PerformanceSuggestionEntity)
      .findOneBy({ id: suggestionId });

    if (!suggestion) {
      throw new CoolCommException(PERFORMANCE_SOURCE_SUGGESTION_NOT_FOUND_MESSAGE);
    }

    if (suggestion.suggestionType !== context.entityType) {
      throw new CoolCommException(
        PERFORMANCE_SUGGESTION_LINKED_ENTITY_TYPE_MISMATCH_MESSAGE
      );
    }

    if (suggestion.status !== 'accepted') {
      throw new CoolCommException(PERFORMANCE_SUGGESTION_ACCEPTED_ONLY_MESSAGE);
    }

    if (Number(suggestion.employeeId) !== Number(context.employeeId)) {
      throw new CoolCommException(PERFORMANCE_SUGGESTION_EMPLOYEE_MISMATCH_MESSAGE);
    }

    if (
      context.assessmentId &&
      Number(suggestion.assessmentId) !== Number(context.assessmentId)
    ) {
      throw new CoolCommException(
        PERFORMANCE_SUGGESTION_ASSESSMENT_MISMATCH_MESSAGE
      );
    }

    if (suggestion.linkedEntityType || suggestion.linkedEntityId) {
      throw new CoolCommException(PERFORMANCE_SUGGESTION_ALREADY_LINKED_MESSAGE);
    }

    await manager.getRepository(PerformanceSuggestionEntity).update(
      { id: suggestionId },
      {
        linkedEntityType: context.entityType,
        linkedEntityId: context.entityId,
      }
    );
  }

  private async buildPromotionDetail(promotion: PerformancePromotionEntity) {
    const [employee, sponsor, records] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: promotion.employeeId }),
      this.baseSysUserEntity.findOneBy({ id: promotion.sponsorId }),
      this.performancePromotionRecordEntity.find({
        where: { promotionId: promotion.id },
        order: { createTime: 'DESC' },
      }),
    ]);

    const reviewerIds = [...new Set(records.map(item => Number(item.reviewerId)))];
    const reviewers = reviewerIds.length
      ? await this.baseSysUserEntity.findBy({ id: In(reviewerIds) })
      : [];

    return {
      ...promotion,
      id: Number(promotion.id),
      assessmentId: normalizeNullableNumber(promotion.assessmentId),
      employeeId: Number(promotion.employeeId),
      employeeName: employee?.name || '',
      sponsorId: Number(promotion.sponsorId),
      sponsorName: sponsor?.name || '',
      reviewRecords: records.map(item => {
        const reviewer = reviewers.find(
          reviewerItem => Number(reviewerItem.id) === Number(item.reviewerId)
        );

        return {
          id: Number(item.id),
          promotionId: Number(item.promotionId),
          reviewerId: Number(item.reviewerId),
          reviewerName: reviewer?.name || '',
          decision: item.decision,
          comment: item.comment || '',
          createTime: item.createTime,
        };
      }),
    };
  }

  private normalizeRow(item: any) {
    return {
      ...item,
      id: Number(item.id),
      assessmentId: normalizeNullableNumber(item.assessmentId),
      employeeId: Number(item.employeeId),
      sponsorId: Number(item.sponsorId),
      employeeDepartmentId: Number(item.employeeDepartmentId),
    };
  }

  private async requirePromotion(id: number) {
    const promotion = await this.performancePromotionEntity.findOneBy({ id });

    if (!promotion) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return promotion;
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

  private applyScope(
    qb: any,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const scopes = this.performanceAccessContextService.capabilityScopes(
      access,
      capabilityKey
    );

    if (scopes.includes('company')) {
      return;
    }

    if (
      !scopes.some(scope => scope === 'department' || scope === 'department_tree') ||
      !access.departmentIds.length
    ) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('employee.departmentId in (:...departmentIds)', {
      departmentIds: access.departmentIds,
    });
  }

  private async assertPromotionInScope(
    employeeId: number,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const employee = await this.baseSysUserEntity.findOneBy({ id: employeeId });

    if (!employee) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, capabilityKey),
        {
          departmentId: Number(employee.departmentId),
        }
      )
    ) {
      return;
    }

    if (
      capabilityKey === 'promotion.submit' &&
      Number(this.currentAdmin?.userId || 0) === Number(employeeId)
    ) {
      return;
    }

    if (
      !this.performanceAccessContextService
        .capabilityScopes(access, capabilityKey)
        .includes('company')
    ) {
      throw new CoolCommException('无权访问该晋升单');
    }
  }

  private assertIsSponsor(sponsorId: number) {
    if (Number(sponsorId) !== Number(this.currentAdmin?.userId || 0)) {
      throw new CoolCommException('仅允许发起人执行该操作');
    }
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

  private async resolveEmployeeDepartmentId(employeeId: number) {
    const employee = await this.baseSysUserEntity.findOneBy({
      id: employeeId,
    });

    if (!employee?.departmentId) {
      throw new CoolCommException(
        PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE
      );
    }

    return Number(employee.departmentId);
  }
}
