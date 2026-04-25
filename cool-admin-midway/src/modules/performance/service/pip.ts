/**
 * PIP 领域服务。
 * 这里负责 PIP 主链查询、创建、状态流转与跟进记录，不负责评估模块既有流程或共享鉴权基础层。
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
import { BaseSysLogEntity } from '../../base/entity/sys/log';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformancePipEntity } from '../entity/pip';
import { PerformancePipRecordEntity } from '../entity/pip-record';
import { PerformanceSuggestionEntity } from '../entity/suggestion';
import * as jwt from 'jsonwebtoken';
import { PIP_STATUS_VALUES } from './pip-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

type PipStatus = (typeof PIP_STATUS_VALUES)[number];
export type PipAction = 'start' | 'track' | 'complete' | 'close';
const [PIP_DRAFT_STATUS, PIP_ACTIVE_STATUS, PIP_COMPLETED_STATUS, PIP_CLOSED_STATUS] =
  PIP_STATUS_VALUES;
const PERFORMANCE_EMPLOYEE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeNotFound
  );
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_ASSESSMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assessmentNotFound
  );
const PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeDepartmentNotFound
  );
const PERFORMANCE_SOURCE_SUGGESTION_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.sourceSuggestionNotFound
  );
const PERFORMANCE_OWNER_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.ownerRequired
  );
const PERFORMANCE_EMPLOYEE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.employeeRequired
  );
const PERFORMANCE_OWNER_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.ownerNotFound
  );
const PERFORMANCE_DATE_RANGE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeRequired
  );
const PERFORMANCE_DATE_RANGE_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.dateRangeInvalid
  );
const PERFORMANCE_PIP_ACTION_UNSUPPORTED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.pipActionUnsupported
  );
const PERFORMANCE_PIP_TITLE_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.pipTitleRequired
  );
const PERFORMANCE_PIP_IMPROVEMENT_GOAL_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.pipImprovementGoalRequired
  );
const PERFORMANCE_PIP_SOURCE_REASON_REQUIRED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.pipSourceReasonRequired
  );
const PERFORMANCE_PIP_START_DRAFT_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.pipStartDraftOnly
  );
const PERFORMANCE_PIP_TRACK_ACTIVE_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.pipTrackActiveOnly
  );
const PERFORMANCE_PIP_COMPLETE_ACTIVE_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.pipCompleteActiveOnly
  );
const PERFORMANCE_PIP_CLOSE_ACTIVE_ONLY_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.pipCloseActiveOnly
  );
const PERFORMANCE_PIP_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.pipEditNotAllowed
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

const PIP_EXPORT_LIMIT = 5000;
const PIP_EXPORT_ACTION = '/admin/performance/pip/export';
const PIP_EXPORT_FIELD_VERSION = 'pip-summary-v1';
const PIP_EXPORT_ERRORS = {
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

export function assertPipEditable(status?: string) {
  if ((status || PIP_DRAFT_STATUS) !== PIP_DRAFT_STATUS) {
    throw new CoolCommException(PERFORMANCE_PIP_EDIT_NOT_ALLOWED_MESSAGE);
  }
}

export function validatePipPayload(payload: {
  assessmentId?: number | null;
  title?: string;
  improvementGoal?: string;
  sourceReason?: string;
  startDate?: string;
  endDate?: string;
}) {
  if (!String(payload.title || '').trim()) {
    throw new CoolCommException(PERFORMANCE_PIP_TITLE_REQUIRED_MESSAGE);
  }

  if (!String(payload.improvementGoal || '').trim()) {
    throw new CoolCommException(PERFORMANCE_PIP_IMPROVEMENT_GOAL_REQUIRED_MESSAGE);
  }

  if (!payload.assessmentId && !String(payload.sourceReason || '').trim()) {
    throw new CoolCommException(PERFORMANCE_PIP_SOURCE_REASON_REQUIRED_MESSAGE);
  }

  if (!payload.startDate || !payload.endDate) {
    throw new CoolCommException(PERFORMANCE_DATE_RANGE_REQUIRED_MESSAGE);
  }

  if (payload.startDate > payload.endDate) {
    throw new CoolCommException(PERFORMANCE_DATE_RANGE_INVALID_MESSAGE);
  }
}

export function resolvePipStatusTransition(
  currentStatus: PipStatus,
  action: PipAction
): PipStatus {
  switch (action) {
    case 'start':
      if (currentStatus !== PIP_DRAFT_STATUS) {
        throw new CoolCommException(PERFORMANCE_PIP_START_DRAFT_ONLY_MESSAGE);
      }
      return PIP_ACTIVE_STATUS;
    case 'track':
      if (currentStatus !== PIP_ACTIVE_STATUS) {
        throw new CoolCommException(PERFORMANCE_PIP_TRACK_ACTIVE_ONLY_MESSAGE);
      }
      return PIP_ACTIVE_STATUS;
    case 'complete':
      if (currentStatus !== PIP_ACTIVE_STATUS) {
        throw new CoolCommException(PERFORMANCE_PIP_COMPLETE_ACTIVE_ONLY_MESSAGE);
      }
      return PIP_COMPLETED_STATUS;
    case 'close':
      if (currentStatus !== PIP_ACTIVE_STATUS) {
        throw new CoolCommException(PERFORMANCE_PIP_CLOSE_ACTIVE_ONLY_MESSAGE);
      }
      return PIP_CLOSED_STATUS;
    default:
      throw new CoolCommException(PERFORMANCE_PIP_ACTION_UNSUPPORTED_MESSAGE);
  }
}

function compactObject<T extends Record<string, any>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== '')
  ) as Partial<T>;
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformancePipService extends BaseService {
  @InjectEntityModel(PerformancePipEntity)
  performancePipEntity: Repository<PerformancePipEntity>;

  @InjectEntityModel(PerformancePipRecordEntity)
  performancePipRecordEntity: Repository<PerformancePipRecordEntity>;

  @InjectEntityModel(PerformanceAssessmentEntity)
  performanceAssessmentEntity: Repository<PerformanceAssessmentEntity>;

  @InjectEntityModel(PerformanceSuggestionEntity)
  performanceSuggestionEntity: Repository<PerformanceSuggestionEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysLogEntity)
  baseSysLogEntity: Repository<BaseSysLogEntity>;

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
    const page = Number(query.page || 1);
    const size = Number(query.size || 20);

    this.assertHasCapability(access, 'pip.read', '无权限查看 PIP');

    const qb = this.performancePipEntity
      .createQueryBuilder('pip')
      .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = pip.employeeId')
      .leftJoin(BaseSysUserEntity, 'owner', 'owner.id = pip.ownerId')
      .select([
        'pip.id as id',
        'pip.assessmentId as assessmentId',
        'pip.employeeId as employeeId',
        'pip.ownerId as ownerId',
        'pip.title as title',
        'pip.improvementGoal as improvementGoal',
        'pip.sourceReason as sourceReason',
        'pip.startDate as startDate',
        'pip.endDate as endDate',
        'pip.status as status',
        'pip.resultSummary as resultSummary',
        'pip.createTime as createTime',
        'pip.updateTime as updateTime',
        'employee.name as employeeName',
        'owner.name as ownerName',
      ]);

    await this.applyPipScope(qb, access);

    if (query.employeeId) {
      qb.andWhere('pip.employeeId = :employeeId', {
        employeeId: Number(query.employeeId),
      });
    }

    if (query.ownerId) {
      qb.andWhere('pip.ownerId = :ownerId', {
        ownerId: Number(query.ownerId),
      });
    }

    if (query.assessmentId) {
      qb.andWhere('pip.assessmentId = :assessmentId', {
        assessmentId: Number(query.assessmentId),
      });
    }

    if (query.status) {
      qb.andWhere('pip.status = :status', { status: query.status });
    }

    if (query.keyword) {
      qb.andWhere('(pip.title like :keyword or pip.sourceReason like :keyword)', {
        keyword: `%${query.keyword}%`,
      });
    }

    qb.orderBy('pip.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizePipRow(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const pip = await this.requirePip(id);

    this.assertHasCapability(access, 'pip.read', '无权限查看 PIP 详情');
    await this.assertCanViewPip(pip, access);

    return this.buildPipDetail(pip);
  }

  async add(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    this.assertHasCapability(access, 'pip.create', '无权限新建 PIP');

    const normalized = await this.normalizePipPayload(payload);
    await this.assertCanManageEmployee(
      normalized.employeeId,
      access,
      'pip.create',
      '无权管理该员工 PIP'
    );

    const pip = await this.performancePipEntity.manager.transaction(async manager => {
      const saved = await manager.save(
        PerformancePipEntity,
        this.performancePipEntity.create({
          assessmentId: normalized.assessmentId || null,
          employeeId: normalized.employeeId,
          ownerId: normalized.ownerId,
          title: normalized.title,
          improvementGoal: normalized.improvementGoal,
          sourceReason: normalized.sourceReason,
          startDate: normalized.startDate,
          endDate: normalized.endDate,
          status: PIP_DRAFT_STATUS,
          resultSummary: '',
        })
      );

      await this.linkSuggestionIfPresent(manager, payload, {
        entityType: 'pip',
        entityId: Number(saved.id),
        assessmentId: normalized.assessmentId || null,
        employeeId: normalized.employeeId,
      });

      return saved;
    });

    return this.info(pip.id);
  }

  async updatePip(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const pip = await this.requirePip(Number(payload.id));

    this.assertHasCapability(access, 'pip.update', '无权限修改 PIP');

    assertPipEditable(pip.status);
    await this.assertCanManagePip(pip, access, 'pip.update');

    const normalized = await this.normalizePipPayload({
      ...pip,
      ...payload,
    });

    await this.assertCanManageEmployee(
      normalized.employeeId,
      access,
      'pip.update',
      '无权管理该员工 PIP'
    );

    await this.performancePipEntity.update(
      { id: pip.id },
      {
        assessmentId: normalized.assessmentId || null,
        employeeId: normalized.employeeId,
        ownerId: normalized.ownerId,
        title: normalized.title,
        improvementGoal: normalized.improvementGoal,
        sourceReason: normalized.sourceReason,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
      }
    );

    return this.info(pip.id);
  }

  async start(payload: { id: number }) {
    return this.updateStatus(Number(payload.id), 'start');
  }

  async track(payload: any) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const pip = await this.requirePip(Number(payload.id));

    this.assertHasCapability(access, 'pip.track', '无权限提交 PIP 跟进');

    await this.assertCanManagePip(pip, access, 'pip.track');
    resolvePipStatusTransition(pip.status as PipStatus, 'track');

    if (!payload.recordDate) {
      throw new CoolCommException('跟进日期不能为空');
    }

    if (!String(payload.progress || '').trim()) {
      throw new CoolCommException('跟进内容不能为空');
    }

    await this.performancePipRecordEntity.save(
      this.performancePipRecordEntity.create({
        pipId: pip.id,
        recordDate: String(payload.recordDate),
        progress: String(payload.progress || '').trim(),
        nextPlan: payload.nextPlan ? String(payload.nextPlan).trim() : '',
        operatorId: this.currentAdmin.userId,
      })
    );

    return this.info(pip.id);
  }

  async complete(payload: { id: number; resultSummary?: string }) {
    return this.updateStatus(Number(payload.id), 'complete', payload.resultSummary);
  }

  async close(payload: { id: number; resultSummary?: string }) {
    return this.updateStatus(Number(payload.id), 'close', payload.resultSummary);
  }

  async export(query: any) {
    let access: PerformanceResolvedAccessContext | null = null;

    try {
      access = await this.performanceAccessContextService.resolveAccessContext();
      this.assertHasCapability(access, 'pip.export', PIP_EXPORT_ERRORS.denied);

      const qb = this.performancePipEntity
        .createQueryBuilder('pip')
        .leftJoin(BaseSysUserEntity, 'employee', 'employee.id = pip.employeeId')
        .leftJoin(BaseSysUserEntity, 'owner', 'owner.id = pip.ownerId')
        .select([
          'pip.id as id',
          'pip.assessmentId as assessmentId',
          'pip.employeeId as employeeId',
          'pip.ownerId as ownerId',
          'pip.title as title',
          'pip.startDate as startDate',
          'pip.endDate as endDate',
          'pip.status as status',
          'pip.createTime as createTime',
          'pip.updateTime as updateTime',
          'employee.name as employeeName',
          'employee.departmentId as departmentId',
          'owner.name as ownerName',
        ]);

      await this.applyPipExportScope(qb, access);

      if (query.employeeId) {
        qb.andWhere('pip.employeeId = :employeeId', {
          employeeId: Number(query.employeeId),
        });
      }

      if (query.ownerId) {
        qb.andWhere('pip.ownerId = :ownerId', {
          ownerId: Number(query.ownerId),
        });
      }

      if (query.assessmentId) {
        qb.andWhere('pip.assessmentId = :assessmentId', {
          assessmentId: Number(query.assessmentId),
        });
      }

      if (query.status) {
        qb.andWhere('pip.status = :status', { status: String(query.status).trim() });
      }

      if (query.keyword) {
        qb.andWhere('pip.title like :keyword', {
          keyword: `%${String(query.keyword).trim()}%`,
        });
      }

      qb.orderBy('pip.updateTime', 'DESC');

      const total = await qb.getCount();

      if (!total) {
        throw new CoolCommException(PIP_EXPORT_ERRORS.noData);
      }

      if (total > PIP_EXPORT_LIMIT) {
        throw new CoolCommException(PIP_EXPORT_ERRORS.overLimit);
      }

      const list = await qb.getRawMany();
      const result = list.map(item => {
        return {
          id: Number(item.id),
          assessmentId: item.assessmentId ? Number(item.assessmentId) : null,
          employeeId: Number(item.employeeId),
          employeeName: item.employeeName || '',
          ownerId: Number(item.ownerId),
          ownerName: item.ownerName || '',
          title: item.title || '',
          startDate: item.startDate || '',
          endDate: item.endDate || '',
          status: item.status || PIP_DRAFT_STATUS,
          createTime: item.createTime || '',
          updateTime: item.updateTime || '',
        };
      });

      await this.recordExportAudit({
        access,
        query,
        rowCount: result.length,
        resultStatus: 'success',
      });

      return result;
    } catch (error) {
      await this.recordExportAudit({
        access,
        query,
        rowCount: 0,
        resultStatus: 'failed',
        failureReason: this.resolveExportFailureReason(error),
      });

      throw error;
    }
  }

  private async updateStatus(
    id: number,
    action: Exclude<PipAction, 'track'>,
    resultSummary?: string
  ) {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const pip = await this.requirePip(id);
    const capabilityKey = this.resolveActionCapability(action);

    this.assertHasCapability(access, capabilityKey, `无权限执行 PIP ${action} 动作`);

    await this.assertCanManagePip(pip, access, capabilityKey);

    const nextStatus = resolvePipStatusTransition(pip.status as PipStatus, action);

    await this.performancePipEntity.update(
      { id: pip.id },
      {
        status: nextStatus,
        resultSummary:
          resultSummary !== undefined
            ? String(resultSummary || '').trim()
            : pip.resultSummary || '',
      }
    );

    return this.info(pip.id);
  }

  private async buildPipDetail(pip: PerformancePipEntity) {
    const [employee, owner, trackRecords] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: pip.employeeId }),
      this.baseSysUserEntity.findOneBy({ id: pip.ownerId }),
      this.performancePipRecordEntity.find({
        where: { pipId: pip.id },
        order: { recordDate: 'DESC', createTime: 'DESC' },
      }),
    ]);

    const operatorIds = trackRecords.map(item => Number(item.operatorId));
    const operators = operatorIds.length
      ? await this.baseSysUserEntity.findBy({ id: In(operatorIds) } as any)
      : [];

    return {
      ...pip,
      id: Number(pip.id),
      assessmentId: pip.assessmentId ? Number(pip.assessmentId) : null,
      employeeId: Number(pip.employeeId),
      ownerId: Number(pip.ownerId),
      employeeName: employee?.name || '',
      ownerName: owner?.name || '',
      sourceReason: pip.sourceReason || '',
      resultSummary: pip.resultSummary || '',
      trackRecords: trackRecords.map(item => {
        const operator = operators.find(
          operatorItem => Number(operatorItem.id) === Number(item.operatorId)
        );

        return {
          id: Number(item.id),
          pipId: Number(item.pipId),
          recordDate: item.recordDate,
          progress: item.progress || '',
          nextPlan: item.nextPlan || '',
          operatorId: Number(item.operatorId),
          operatorName: operator?.name || '',
          createTime: item.createTime,
        };
      }),
    };
  }

  private normalizePipRow(item: any) {
    return {
      ...item,
      id: Number(item.id),
      assessmentId: item.assessmentId ? Number(item.assessmentId) : null,
      employeeId: Number(item.employeeId),
      ownerId: Number(item.ownerId),
      sourceReason: item.sourceReason || '',
      resultSummary: item.resultSummary || '',
    };
  }

  private async normalizePipPayload(payload: any) {
    const assessment = await this.resolveLinkedAssessment(payload.assessmentId);
    const employeeId = assessment
      ? Number(assessment.employeeId)
      : Number(payload.employeeId);
    const ownerId = assessment ? Number(assessment.assessorId) : Number(payload.ownerId);

    if (!employeeId) {
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_REQUIRED_MESSAGE);
    }

    if (!ownerId) {
      throw new CoolCommException(PERFORMANCE_OWNER_REQUIRED_MESSAGE);
    }

    const [employee, owner] = await Promise.all([
      this.baseSysUserEntity.findOneBy({ id: employeeId }),
      this.baseSysUserEntity.findOneBy({ id: ownerId }),
    ]);

    if (!employee) {
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_NOT_FOUND_MESSAGE);
    }

    if (!owner) {
      throw new CoolCommException(PERFORMANCE_OWNER_NOT_FOUND_MESSAGE);
    }

    const normalized = {
      assessmentId: assessment ? Number(assessment.id) : payload.assessmentId ? Number(payload.assessmentId) : null,
      employeeId,
      ownerId,
      title: String(payload.title || '').trim(),
      improvementGoal: String(payload.improvementGoal || '').trim(),
      sourceReason: assessment
        ? String(payload.sourceReason || '').trim()
        : String(payload.sourceReason || '').trim(),
      startDate: String(payload.startDate || ''),
      endDate: String(payload.endDate || ''),
    };

    validatePipPayload(normalized);

    return normalized;
  }

  private async linkSuggestionIfPresent(
    manager: any,
    payload: any,
    context: {
      entityType: 'pip';
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

  private async resolveLinkedAssessment(assessmentId?: number | string | null) {
    const id = Number(assessmentId || 0);

    if (!id) {
      return null;
    }

    const assessment = await this.performanceAssessmentEntity.findOneBy({ id });

    if (!assessment) {
      throw new CoolCommException(
        resolvePerformanceDomainErrorMessage(
          PERFORMANCE_DOMAIN_ERROR_CODES.assessmentNotFound,
          '来源评估单不存在'
        )
      );
    }

    return assessment;
  }

  private async requirePip(id: number) {
    const pip = await this.performancePipEntity.findOneBy({ id });

    if (!pip) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return pip;
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

  private async applyPipScope(
    qb: any,
    access: PerformanceResolvedAccessContext
  ) {
    const readScopes = this.performanceAccessContextService.capabilityScopes(
      access,
      'pip.read'
    );

    if (readScopes.includes('company')) {
      return;
    }

    const userId = this.currentAdmin.userId;

    if (
      !this.performanceAccessContextService.hasAnyCapability(access, [
        'pip.create',
        'pip.update',
        'pip.start',
        'pip.track',
        'pip.complete',
        'pip.close',
      ])
    ) {
      qb.andWhere('pip.employeeId = :userId', { userId });
      return;
    }

    if (!access.departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('employee.departmentId in (:...departmentIds)', {
      departmentIds: access.departmentIds,
    });
  }

  private async applyPipExportScope(
    qb: any,
    access: PerformanceResolvedAccessContext
  ) {
    const exportScopes = this.performanceAccessContextService.capabilityScopes(
      access,
      'pip.export'
    );

    if (exportScopes.includes('company')) {
      return;
    }

    if (!access.departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('employee.departmentId in (:...departmentIds)', {
      departmentIds: access.departmentIds,
    });
  }

  private async assertCanViewPip(
    pip: PerformancePipEntity,
    access: PerformanceResolvedAccessContext
  ) {
    const employee = await this.baseSysUserEntity.findOneBy({ id: pip.employeeId });

    if (!employee) {
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_NOT_FOUND_MESSAGE);
    }

    if (
      this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, 'pip.read'),
        {
          subjectUserId: Number(pip.employeeId),
          departmentId: Number(employee.departmentId),
        }
      )
    ) {
      return;
    }

    throw new CoolCommException('无权查看该 PIP');
  }

  private async assertCanManagePip(
    pip: PerformancePipEntity,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    await this.assertCanManageEmployee(
      Number(pip.employeeId),
      access,
      capabilityKey,
      '无权管理该员工 PIP'
    );
  }

  private async assertCanManageEmployee(
    employeeId: number,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey,
    message: string
  ) {
    const employee = await this.baseSysUserEntity.findOneBy({ id: employeeId });

    if (!employee?.departmentId) {
      throw new CoolCommException(PERFORMANCE_EMPLOYEE_DEPARTMENT_NOT_FOUND_MESSAGE);
    }

    if (
      !this.performanceAccessContextService.matchesScope(
        access,
        this.performanceAccessContextService.capabilityScopes(access, capabilityKey),
        {
          departmentId: Number(employee.departmentId),
        }
      )
    ) {
      throw new CoolCommException(message);
    }
  }

  private resolveExportFailureReason(error: any) {
    const message = String(error?.message || '');

    switch (message) {
      case PIP_EXPORT_ERRORS.denied:
        return 'permission_denied';
      case PIP_EXPORT_ERRORS.noData:
        return 'no_data';
      case PIP_EXPORT_ERRORS.overLimit:
        return 'over_limit';
      default:
        return 'unknown';
    }
  }

  private resolveExportOperatorRole(access: PerformanceResolvedAccessContext | null) {
    if (this.currentAdmin?.isAdmin === true) {
      return 'admin';
    }

    if (
      access &&
      (this.performanceAccessContextService
        .capabilityScopes(access, 'pip.read')
        .includes('company') ||
        this.performanceAccessContextService
          .capabilityScopes(access, 'pip.export')
          .includes('company'))
    ) {
      return 'hr';
    }

    if (
      access &&
      this.performanceAccessContextService.hasAnyCapability(access, [
        'pip.export',
        'pip.create',
        'pip.update',
        'pip.start',
        'pip.track',
        'pip.complete',
        'pip.close',
      ])
    ) {
      return 'manager';
    }

    return 'employee';
  }

  private buildExportFilterSummary(query: any) {
    return compactObject({
      assessmentId: query?.assessmentId ? Number(query.assessmentId) : undefined,
      employeeId: query?.employeeId ? Number(query.employeeId) : undefined,
      ownerId: query?.ownerId ? Number(query.ownerId) : undefined,
      status: query?.status ? String(query.status).trim() : undefined,
      keyword: query?.keyword ? String(query.keyword).trim() : undefined,
    });
  }

  private async recordExportAudit(input: {
    access: PerformanceResolvedAccessContext | null;
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
      operatorRole: this.resolveExportOperatorRole(input.access),
      moduleKey: 'pip',
      filterSummary: this.buildExportFilterSummary(input.query),
      exportFieldVersion: PIP_EXPORT_FIELD_VERSION,
      rowCount: input.rowCount,
      triggerTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      resultStatus: input.resultStatus,
      failureReason: input.failureReason || '',
    };

    await this.baseSysLogEntity.insert(
      this.baseSysLogEntity.create
        ? this.baseSysLogEntity.create({
            userId: operatorId || undefined,
            action: PIP_EXPORT_ACTION,
            params,
          } as any)
        : ({
            userId: operatorId || undefined,
            action: PIP_EXPORT_ACTION,
            params,
          } as any)
    );
  }

  async initPipScope() {
    return;
  }

  private resolveActionCapability(
    action: Exclude<PipAction, 'track'>
  ): PerformanceCapabilityKey {
    switch (action) {
      case 'start':
        return 'pip.start';
      case 'complete':
        return 'pip.complete';
      case 'close':
        return 'pip.close';
      default:
        throw new CoolCommException(PERFORMANCE_PIP_ACTION_UNSUPPORTED_MESSAGE);
    }
  }
}
