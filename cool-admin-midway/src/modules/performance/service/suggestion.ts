/**
 * 自动建议领域服务。
 * 这里负责 suggestion 资源的懒生成、只读查询、人工处理动作和数据范围裁剪，不负责菜单 seed、前端跳转或正式单据创建。
 * 维护重点是接口只返回建议摘要与审计摘要，内部审计字段绝不通过 suggestion 接口旁路暴露。
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
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformanceSuggestionEntity } from '../entity/suggestion';
import * as jwt from 'jsonwebtoken';
import {
  assertSuggestionTransition,
  deriveSuggestionCandidate,
  nextSuggestionStatus,
  SUGGESTION_ACTIVE_STATUSES,
  SUGGESTION_RULE_VERSION,
  type SuggestionAction,
  type SuggestionAssessmentSnapshot,
  type SuggestionStatus,
  validateRevokePayload,
} from './suggestion-helper';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

function formatNow() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceSuggestionService extends BaseService {
  @InjectEntityModel(PerformanceSuggestionEntity)
  performanceSuggestionEntity: Repository<PerformanceSuggestionEntity>;

  @InjectEntityModel(PerformanceAssessmentEntity)
  performanceAssessmentEntity: Repository<PerformanceAssessmentEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:suggestion:page',
    info: 'performance:suggestion:info',
    accept: 'performance:suggestion:accept',
    ignore: 'performance:suggestion:ignore',
    reject: 'performance:suggestion:reject',
    revoke: 'performance:suggestion:revoke',
    pipAdd: 'performance:pip:add',
    promotionAdd: 'performance:promotion:add',
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
      return jwt.verify(token, resolveBaseJwtConfig(this.app).secret) as any;
    } catch (error) {
      return undefined;
    }
  }

  async page(query: any) {
    const perms = await this.currentPerms();

    if (!this.hasPerm(perms, this.perms.page)) {
      throw new CoolCommException('无权限查看建议列表');
    }

    await this.ensureSuggestions(query, perms);

    const page = Number(query.page || 1);
    const size = Number(query.size || 20);
    const where = await this.buildSuggestionWhere(query, perms);

    const [list, total] = await this.performanceSuggestionEntity.findAndCount({
      where,
      order: {
        createTime: 'DESC',
      },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      list: await this.toSummaryList(list),
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
      throw new CoolCommException('无权限查看建议详情');
    }

    const suggestion = await this.requireSuggestion(id);
    await this.assertSuggestionInScope(suggestion, perms);
    return this.toDetail(suggestion);
  }

  async accept(payload: any) {
    return this.handleAction('accept', payload);
  }

  async ignore(payload: any) {
    return this.handleAction('ignore', payload);
  }

  async reject(payload: any) {
    return this.handleAction('reject', payload);
  }

  async revoke(payload: any) {
    return this.handleAction('revoke', payload);
  }

  async syncApprovedAssessment(assessment: SuggestionAssessmentSnapshot) {
    return this.performanceSuggestionEntity.manager.transaction(async manager => {
      await this.lockAssessmentRow(manager, Number(assessment.id));
      return this.syncApprovedAssessmentWithManager(manager, assessment);
    });
  }

  async syncApprovedAssessmentInTransaction(
    manager: EntityManager,
    assessment: SuggestionAssessmentSnapshot
  ) {
    await this.lockAssessmentRow(manager, Number(assessment.id));
    return this.syncApprovedAssessmentWithManager(manager, assessment);
  }

  private async syncApprovedAssessmentWithManager(
    manager: EntityManager,
    assessment: SuggestionAssessmentSnapshot
  ) {
    const candidate = deriveSuggestionCandidate(assessment);

    if (!candidate) {
      return null;
    }

    const suggestionRepo = manager.getRepository(PerformanceSuggestionEntity);
    const existing = await suggestionRepo.findOne({
      where: {
        assessmentId: Number(assessment.id),
        suggestionType: candidate.suggestionType,
        status: In(SUGGESTION_ACTIVE_STATUSES),
      },
      order: {
        id: 'DESC',
      },
    });

    if (existing) {
      return existing;
    }

    const entity = suggestionRepo.create({
      suggestionType: candidate.suggestionType,
      status: 'pending',
      assessmentId: Number(assessment.id),
      employeeId: Number(assessment.employeeId),
      departmentId: Number(assessment.departmentId),
      periodType: String(assessment.periodType || 'quarter').trim(),
      periodValue: String(assessment.periodValue || '').trim(),
      triggerLabel: candidate.triggerLabel,
      triggerGrade: candidate.triggerGrade,
      triggerScore: candidate.triggerScore,
      ruleVersion: SUGGESTION_RULE_VERSION,
      handleTime: null,
      handlerId: null,
      handlerName: null,
      revokeReasonCode: null,
      revokeReason: null,
      linkedEntityType: null,
      linkedEntityId: null,
      tenantId: (assessment as any).tenantId ?? null,
    });

    return suggestionRepo.save(entity);
  }

  async ensureSuggestions(query: any = {}, perms?: string[]) {
    const resolvedPerms = perms || (await this.currentPerms());
    const assessmentWhere = await this.buildAssessmentWhere(query, resolvedPerms);

    if (assessmentWhere === null) {
      return;
    }

    const assessments = await this.performanceAssessmentEntity.find({
      where: assessmentWhere,
      order: {
        id: 'DESC',
      },
    });

    for (const assessment of assessments) {
      await this.syncApprovedAssessment({
        id: Number(assessment.id),
        status: assessment.status,
        grade: assessment.grade,
        totalScore: Number(assessment.totalScore || 0),
        employeeId: Number(assessment.employeeId),
        departmentId: Number(assessment.departmentId),
        periodType: assessment.periodType,
        periodValue: assessment.periodValue,
        tenantId: assessment.tenantId ?? null,
      });
    }
  }

  async initSuggestionScope() {
    this.currentCtx.suggestionDepartmentIds = await this.departmentScopeIds();
  }

  private async handleAction(action: SuggestionAction, payload: any) {
    const perms = await this.currentPerms();
    const id = Number(payload?.id);
    const suggestion = await this.requireSuggestion(id);

    if (!this.hasPerm(perms, this.permForAction(action))) {
      throw new CoolCommException('无权限执行该建议动作');
    }

    await this.assertSuggestionInScope(suggestion, perms);
    assertSuggestionTransition(
      suggestion.status as SuggestionStatus,
      action,
      this.isHr(resolvedPermsOrEmpty(perms))
    );

    if (action === 'accept') {
      this.assertCanAcceptSuggestion(suggestion, perms);
    }

    if (action === 'revoke') {
      validateRevokePayload(payload || {});
    }

    const operator = await this.resolveCurrentOperator();
    suggestion.status = nextSuggestionStatus(action);
    suggestion.handleTime = formatNow();
    suggestion.handlerId = operator.id;
    suggestion.handlerName = operator.name;

    if (action === 'revoke') {
      suggestion.revokeReasonCode = String(payload.revokeReasonCode).trim();
      suggestion.revokeReason = String(payload.revokeReason).trim();
    }

    await this.performanceSuggestionEntity.save(suggestion);

    const detail = await this.toDetail(suggestion);

    if (action === 'accept') {
      return {
        suggestion: detail,
        prefill: {
          assessmentId: suggestion.assessmentId,
          employeeId: suggestion.employeeId,
          suggestionType: suggestion.suggestionType,
          suggestionId: suggestion.id,
        },
      };
    }

    return detail;
  }

  private async buildAssessmentWhere(query: any, perms: string[]) {
    const where: any = {
      status: 'approved',
    };

    if (query?.assessmentId) {
      where.id = Number(query.assessmentId);
    }

    if (query?.employeeId) {
      where.employeeId = Number(query.employeeId);
    }

    if (query?.periodValue) {
      where.periodValue = String(query.periodValue).trim();
    }

    if (this.isHr(perms)) {
      if (query?.departmentId) {
        where.departmentId = Number(query.departmentId);
      }
      return where;
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    if (!departmentIds.length) {
      return null;
    }

    if (query?.departmentId) {
      const departmentId = Number(query.departmentId);
      if (!departmentIds.includes(departmentId)) {
        return null;
      }
      where.departmentId = departmentId;
      return where;
    }

    where.departmentId = In(departmentIds);
    return where;
  }

  private async buildSuggestionWhere(query: any, perms: string[]) {
    const where: any = {};

    if (query?.suggestionType) {
      where.suggestionType = String(query.suggestionType).trim();
    }

    if (query?.status) {
      where.status = String(query.status).trim();
    }

    if (query?.employeeId) {
      where.employeeId = Number(query.employeeId);
    }

    if (query?.assessmentId) {
      where.assessmentId = Number(query.assessmentId);
    }

    if (query?.periodValue) {
      where.periodValue = String(query.periodValue).trim();
    }

    if (this.isHr(perms)) {
      if (query?.departmentId) {
        where.departmentId = Number(query.departmentId);
      }
      return where;
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    if (!departmentIds.length) {
      return {
        departmentId: -1,
      };
    }

    if (query?.departmentId) {
      const departmentId = Number(query.departmentId);
      if (!departmentIds.includes(departmentId)) {
        return {
          departmentId: -1,
        };
      }
      where.departmentId = departmentId;
      return where;
    }

    where.departmentId = In(departmentIds);
    return where;
  }

  private async toSummaryList(list: PerformanceSuggestionEntity[]) {
    const userMap = await this.resolveUserMap(list);
    const departmentMap = await this.resolveDepartmentMap(list);

    return list.map(item => this.toSummary(item, userMap, departmentMap));
  }

  private async toDetail(item: PerformanceSuggestionEntity) {
    const userMap = await this.resolveUserMap([item]);
    const departmentMap = await this.resolveDepartmentMap([item]);
    const summary = this.toSummary(item, userMap, departmentMap);

    return {
      ...summary,
      revokeReason:
        item.status === 'revoked' ? item.revokeReason || '' : undefined,
    };
  }

  private toSummary(
    item: PerformanceSuggestionEntity,
    userMap: Map<number, BaseSysUserEntity>,
    departmentMap: Map<number, BaseSysDepartmentEntity>
  ) {
    const employee = userMap.get(Number(item.employeeId));
    const department = departmentMap.get(Number(item.departmentId));

    return {
      id: item.id,
      suggestionType: item.suggestionType,
      status: item.status,
      assessmentId: item.assessmentId,
      employeeId: item.employeeId,
      employeeName: employee?.name || '',
      departmentId: item.departmentId,
      departmentName: department?.name || '',
      periodType: item.periodType,
      periodValue: item.periodValue,
      triggerLabel: item.triggerLabel,
      createTime: item.createTime,
      handleTime: item.handleTime,
      handlerId: item.handlerId,
      handlerName: item.handlerName,
      ruleVersion: item.ruleVersion,
      linkedEntityType: item.linkedEntityType,
      linkedEntityId: item.linkedEntityId,
    };
  }

  private async resolveUserMap(list: PerformanceSuggestionEntity[]) {
    const ids = Array.from(
      new Set(
        list
          .map(item => Number(item.employeeId))
          .concat(
            list
              .map(item => Number(item.handlerId || 0))
              .filter(item => item > 0)
          )
      )
    ).filter(item => item > 0);

    if (!ids.length) {
      return new Map<number, BaseSysUserEntity>();
    }

    const users = await this.baseSysUserEntity.findBy({ id: In(ids) });
    return new Map(users.map(item => [Number(item.id), item]));
  }

  private async resolveDepartmentMap(list: PerformanceSuggestionEntity[]) {
    const ids = Array.from(
      new Set(list.map(item => Number(item.departmentId)).filter(item => item > 0))
    );

    if (!ids.length) {
      return new Map<number, BaseSysDepartmentEntity>();
    }

    const departments = await this.baseSysDepartmentEntity.findBy({
      id: In(ids),
    });
    return new Map(departments.map(item => [Number(item.id), item]));
  }

  private permForAction(action: SuggestionAction) {
    switch (action) {
      case 'accept':
        return this.perms.accept;
      case 'ignore':
        return this.perms.ignore;
      case 'reject':
        return this.perms.reject;
      case 'revoke':
        return this.perms.revoke;
      default:
        throw new CoolCommException('不支持的建议动作');
    }
  }

  private async requireSuggestion(id: number) {
    const suggestion = await this.performanceSuggestionEntity.findOneBy({ id });

    if (!suggestion) {
      throw new CoolCommException('数据不存在');
    }

    return suggestion;
  }

  private async currentPerms() {
    return this.baseSysMenuService.getPerms(this.currentAdmin.roleIds);
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
      this.currentAdmin.userId
    );
    return Array.isArray(ids) ? ids.map(item => Number(item)) : [];
  }

  private async resolveScopeDepartmentIds() {
    const cached = this.currentCtx?.suggestionDepartmentIds;

    if (Array.isArray(cached)) {
      return cached.map(item => Number(item));
    }

    const departmentIds = await this.departmentScopeIds();
    this.currentCtx.suggestionDepartmentIds = departmentIds;
    return departmentIds;
  }

  private async assertSuggestionInScope(
    suggestion: PerformanceSuggestionEntity,
    perms: string[]
  ) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.resolveScopeDepartmentIds();

    if (!departmentIds.includes(Number(suggestion.departmentId))) {
      throw new CoolCommException('无权访问该建议');
    }
  }

  private assertCanAcceptSuggestion(
    suggestion: PerformanceSuggestionEntity,
    perms: string[]
  ) {
    const targetPerm =
      suggestion.suggestionType === 'pip'
        ? this.perms.pipAdd
        : this.perms.promotionAdd;

    if (!this.hasPerm(perms, targetPerm)) {
      throw new CoolCommException('无权限采用该建议');
    }
  }

  private async resolveCurrentOperator() {
    const operatorId = Number(this.currentAdmin?.userId || 0);
    const operator = operatorId
      ? await this.baseSysUserEntity.findOneBy({ id: operatorId })
      : null;

    return {
      id: operatorId || null,
      name: operator?.name || this.currentAdmin?.username || '',
    };
  }

  private async lockAssessmentRow(manager: EntityManager, assessmentId: number) {
    await manager.getRepository(PerformanceAssessmentEntity).findOne({
      where: { id: assessmentId },
      lock: { mode: 'pessimistic_write' },
    } as any);
  }
}

function resolvedPermsOrEmpty(perms: string[]) {
  return Array.isArray(perms) ? perms : [];
}
