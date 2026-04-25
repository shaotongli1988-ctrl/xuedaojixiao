/**
 * 自动审批流领域服务。
 * 这里负责 assessment / promotion 两类对象的审批配置、实例状态机、HR 介入和与源业务对象的主链同步，不负责前端展示或共享鉴权基础设施。
 * 维护重点是自动审批只接管“提交后到最终结论前”的审批层，绝不扩成跨模块工作流平台。
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
import * as jwt from 'jsonwebtoken';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysRoleEntity } from '../../base/entity/sys/role';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysUserRoleEntity } from '../../base/entity/sys/user_role';
import { PerformanceAssessmentEntity } from '../entity/assessment';
import { PerformanceAssetAssignmentRequestEntity } from '../entity/assetAssignmentRequest';
import { PerformancePromotionEntity } from '../entity/promotion';
import { PerformanceSuggestionService } from './suggestion';
import { PerformanceApprovalActionLogEntity } from '../entity/approval-action-log';
import { PerformanceApprovalConfigEntity } from '../entity/approval-config';
import { PerformanceApprovalConfigNodeEntity } from '../entity/approval-config-node';
import { PerformanceApprovalInstanceEntity } from '../entity/approval-instance';
import { PerformanceApprovalInstanceNodeEntity } from '../entity/approval-instance-node';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
} from './access-context';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain';
import {
  APPROVAL_ACTIVE_STATUSES,
  APPROVAL_INSTANCE_STATUSES,
  APPROVAL_NODE_STATUSES,
  ApprovalInstanceStatus,
  ApprovalNodeStatus,
  ApprovalObjectType,
  assertApprovalActiveStatus,
  assertApprovalInstanceTransition,
  canWithdrawInstance,
  ensureApprovalConfigNodes,
  getApprovalSourceApprovedStatus,
  getApprovalSourceDraftStatus,
  getApprovalSourceRejectedStatus,
  getApprovalSourceStatus,
  normalizeApprovalObjectType,
  normalizeOptionalNumber,
  normalizeOptionalString,
  normalizeRequiredString,
} from './approval-flow-helper';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};
const PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.assetAssignmentRequestNotFound
  );
const PERFORMANCE_APPROVAL_INSTANCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.approvalInstanceNotFound
  );

function formatNow() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

type ApprovalScope = {
  isHr: boolean;
  departmentIds: number[] | null;
  userId: number;
  can: (capabilityKey: PerformanceCapabilityKey) => boolean;
};

type ApprovalContext = {
  objectType: ApprovalObjectType;
  applicantId: number;
  employeeId: number;
  departmentId: number;
};

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceApprovalFlowService extends BaseService {
  @InjectEntityModel(PerformanceApprovalConfigEntity)
  performanceApprovalConfigEntity: Repository<PerformanceApprovalConfigEntity>;

  @InjectEntityModel(PerformanceApprovalConfigNodeEntity)
  performanceApprovalConfigNodeEntity: Repository<PerformanceApprovalConfigNodeEntity>;

  @InjectEntityModel(PerformanceApprovalInstanceEntity)
  performanceApprovalInstanceEntity: Repository<PerformanceApprovalInstanceEntity>;

  @InjectEntityModel(PerformanceApprovalInstanceNodeEntity)
  performanceApprovalInstanceNodeEntity: Repository<PerformanceApprovalInstanceNodeEntity>;

  @InjectEntityModel(PerformanceApprovalActionLogEntity)
  performanceApprovalActionLogEntity: Repository<PerformanceApprovalActionLogEntity>;

  @InjectEntityModel(PerformanceAssessmentEntity)
  performanceAssessmentEntity: Repository<PerformanceAssessmentEntity>;

  @InjectEntityModel(PerformancePromotionEntity)
  performancePromotionEntity: Repository<PerformancePromotionEntity>;

  @InjectEntityModel(PerformanceAssetAssignmentRequestEntity)
  performanceAssetAssignmentRequestEntity: Repository<PerformanceAssetAssignmentRequestEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectEntityModel(BaseSysUserRoleEntity)
  baseSysUserRoleEntity: Repository<BaseSysUserRoleEntity>;

  @InjectEntityModel(BaseSysRoleEntity)
  baseSysRoleEntity: Repository<BaseSysRoleEntity>;

  @Inject()
  performanceSuggestionService: PerformanceSuggestionService;

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
      return jwt.verify(token, resolveBaseJwtConfig(this.app).secret) as any;
    } catch (error) {
      return undefined;
    }
  }

  async configInfo(objectTypeValue: any) {
    const objectType = normalizeApprovalObjectType(objectTypeValue);
    const scope = await this.getScope();

    if (!scope.can('approval.config.read')) {
      throw new CoolCommException('无权限查看审批流配置');
    }

    const config = await this.performanceApprovalConfigEntity.findOne({
      where: { objectType },
      order: { id: 'DESC' },
    });

    if (!config) {
      return {
        objectType,
        enabled: false,
        version: '',
        notifyMode: 'interface_only',
        nodes: [],
      };
    }

    const nodes = await this.performanceApprovalConfigNodeEntity.find({
      where: { configId: config.id },
      order: { nodeOrder: 'ASC' },
    });

    return {
      objectType: config.objectType,
      enabled: Boolean(config.enabled),
      version: config.version,
      notifyMode: config.notifyMode,
      nodes: nodes.map(item => this.toConfigNode(item)),
    };
  }

  async configSave(payload: any) {
    const scope = await this.getScope();

    if (!scope.can('approval.config.write')) {
      throw new CoolCommException('无权限保存审批流配置');
    }

    const objectType = normalizeApprovalObjectType(payload?.objectType);
    const version = normalizeRequiredString(
      payload?.version,
      '配置版本不能为空',
      30
    );
    const nodes = ensureApprovalConfigNodes(payload?.nodes || []);
    const enabled = Boolean(payload?.enabled);

    await this.performanceApprovalConfigEntity.manager.transaction(
      async manager => {
        const configRepo = manager.getRepository(PerformanceApprovalConfigEntity);
        const configNodeRepo = manager.getRepository(
          PerformanceApprovalConfigNodeEntity
        );
        let config = await configRepo.findOne({
          where: { objectType },
          order: { id: 'DESC' },
        });

        if (!config) {
          config = configRepo.create({
            objectType,
            version,
            enabled,
            notifyMode: 'interface_only',
            tenantId: this.currentAdmin?.tenantId ?? null,
          });
          config = await configRepo.save(config);
        } else {
          await configRepo.update(
            { id: config.id },
            {
              version,
              enabled,
              notifyMode: 'interface_only',
            }
          );
          config = await configRepo.findOneBy({ id: config.id });
        }

        await configNodeRepo.delete({ configId: config.id });
        const entities = nodes.map(item =>
          configNodeRepo.create({
            configId: config!.id,
            nodeOrder: item.nodeOrder,
            nodeCode: item.nodeCode,
            nodeName: item.nodeName,
            resolverType: item.resolverType,
            resolverValue: item.resolverValue || null,
            timeoutHours: item.timeoutHours,
            allowTransfer: item.allowTransfer,
            tenantId: this.currentAdmin?.tenantId ?? null,
          })
        );
        await configNodeRepo.save(entities);
      }
    );

    return this.configInfo(objectType);
  }

  async info(id: number) {
    const scope = await this.getScope();

    if (!scope.can('approval.instance.read')) {
      throw new CoolCommException('无权限查看审批实例');
    }

    const instance = await this.requireInstance(id);
    await this.assertInstanceInScope(instance, scope);

    return this.buildInstanceDetail(instance, scope);
  }

  async approve(payload: any) {
    const scope = await this.getScope();

    if (!scope.can('approval.instance.approve')) {
      throw new CoolCommException('无权限审批');
    }

    const instanceId = Number(payload?.instanceId);
    const comment = normalizeOptionalString(payload?.comment, 2000);

    await this.performanceApprovalInstanceEntity.manager.transaction(
      async manager => {
        const instance = await this.requireInstanceWithManager(manager, instanceId);
        await this.assertInstanceInScope(instance, scope);
        assertApprovalInstanceTransition(instance.status, 'approve');
        await this.assertCurrentApprover(instance, scope.userId);
        const currentNode = await this.requireCurrentNode(manager, instance);
        const now = this.now();
        const fromStatus = instance.status;

        await manager.getRepository(PerformanceApprovalInstanceNodeEntity).update(
          { id: currentNode.id },
          {
            status: 'approved',
            actionTime: now,
            comment: comment || '',
          }
        );

        const nextNode = (
          await manager.getRepository(PerformanceApprovalInstanceNodeEntity).find({
            where: {
              instanceId: instance.id,
            },
            order: {
              nodeOrder: 'ASC',
            },
          })
        ).find(
          item =>
            Number(item.nodeOrder) > Number(instance.currentNodeOrder || 0) &&
            item.status !== 'cancelled'
        );

        if (!nextNode) {
          await manager.getRepository(PerformanceApprovalInstanceEntity).update(
            { id: instance.id },
            {
              status: 'approved',
              sourceStatus: getApprovalSourceApprovedStatus(instance.objectType as ApprovalObjectType),
              currentNodeOrder: null,
              currentApproverId: null,
              finishTime: now,
            }
          );
          await this.syncSourceObject(
            manager,
            instance.objectType as ApprovalObjectType,
            instance.objectId,
            {
              finalStatus: 'approved',
              comment,
              now,
            }
          );
          await this.saveActionLog(manager, {
            instanceId: instance.id,
            instanceNodeId: currentNode.id,
            action: 'approve',
            operatorId: scope.userId,
            fromStatus,
            toStatus: 'approved',
            reason: comment || null,
          });
          return;
        }

        const nextContext = {
          objectType: instance.objectType as ApprovalObjectType,
          applicantId: instance.applicantId,
          employeeId: instance.employeeId,
          departmentId: instance.departmentId,
        };
        const resolution = await this.resolveNodeApprover(manager, nextNode, nextContext);
        const nextStatus: ApprovalInstanceStatus = resolution.approverId
          ? 'in_review'
          : 'pending_resolution';

        await manager.getRepository(PerformanceApprovalInstanceNodeEntity).update(
          { id: nextNode.id },
          {
            approverId: resolution.approverId,
            status: 'pending',
            actionTime: null,
            transferFromUserId: null,
            transferReason: null,
            comment: null,
          }
        );

        await manager.getRepository(PerformanceApprovalInstanceEntity).update(
          { id: instance.id },
          {
            status: nextStatus,
            sourceStatus: getApprovalSourceStatus(
              instance.objectType as ApprovalObjectType
            ),
            currentNodeOrder: nextNode.nodeOrder,
            currentApproverId: resolution.approverId,
          }
        );
        await this.syncSourceApprovalRuntime(manager, instance.id);

        await this.saveActionLog(manager, {
          instanceId: instance.id,
          instanceNodeId: currentNode.id,
          action: 'approve',
          operatorId: scope.userId,
          fromStatus,
          toStatus: nextStatus,
          reason: comment || null,
          detail: resolution.detail,
        });
      }
    );

    return this.info(instanceId);
  }

  async reject(payload: any) {
    const scope = await this.getScope();

    if (!scope.can('approval.instance.reject')) {
      throw new CoolCommException('无权限驳回');
    }

    const instanceId = Number(payload?.instanceId);
    const comment = normalizeRequiredString(
      payload?.comment,
      '驳回意见不能为空',
      2000
    );

    await this.performanceApprovalInstanceEntity.manager.transaction(
      async manager => {
        const instance = await this.requireInstanceWithManager(manager, instanceId);
        await this.assertInstanceInScope(instance, scope);
        assertApprovalInstanceTransition(instance.status, 'reject');
        await this.assertCurrentApprover(instance, scope.userId);
        const currentNode = await this.requireCurrentNode(manager, instance);
        const now = this.now();

        await manager.getRepository(PerformanceApprovalInstanceNodeEntity).update(
          { id: currentNode.id },
          {
            status: 'rejected',
            actionTime: now,
            comment,
          }
        );
        await this.cancelPendingNodes(manager, instance.id, [currentNode.id]);
        await manager.getRepository(PerformanceApprovalInstanceEntity).update(
          { id: instance.id },
          {
            status: 'rejected',
            sourceStatus: getApprovalSourceRejectedStatus(
              instance.objectType as ApprovalObjectType
            ),
            currentNodeOrder: null,
            currentApproverId: null,
            finishTime: now,
          }
        );
        await this.syncSourceObject(
          manager,
          instance.objectType as ApprovalObjectType,
          instance.objectId,
          {
            finalStatus: 'rejected',
            comment,
            now,
          }
        );
        await this.saveActionLog(manager, {
          instanceId: instance.id,
          instanceNodeId: currentNode.id,
          action: 'reject',
          operatorId: scope.userId,
          fromStatus: instance.status,
          toStatus: 'rejected',
          reason: comment,
        });
      }
    );

    return this.info(instanceId);
  }

  async transfer(payload: any) {
    const scope = await this.getScope();

    if (!scope.can('approval.instance.transfer')) {
      throw new CoolCommException('无权限转办');
    }

    const instanceId = Number(payload?.instanceId);
    const toUserId = Number(payload?.toUserId);
    const reason = normalizeRequiredString(payload?.reason, '转办原因不能为空', 500);
    const force = Boolean(payload?.force);

    await this.performanceApprovalInstanceEntity.manager.transaction(
      async manager => {
        const instance = await this.requireInstanceWithManager(manager, instanceId);
        await this.assertInstanceInScope(instance, scope);
        assertApprovalInstanceTransition(instance.status, 'transfer');

        const currentNode = await this.requireCurrentNode(manager, instance);
        const allowTransfer = await this.nodeAllowsTransfer(instance, currentNode);

        if (!force) {
          await this.assertCurrentApprover(instance, scope.userId);
          if (!allowTransfer) {
            throw new CoolCommException('当前节点不允许转办');
          }
          const candidates = await this.resolveCandidateApproverIds(manager, currentNode, {
            objectType: instance.objectType as ApprovalObjectType,
            applicantId: instance.applicantId,
            employeeId: instance.employeeId,
            departmentId: instance.departmentId,
          });

          if (!candidates.includes(toUserId)) {
            throw new CoolCommException('转办目标不在当前节点允许范围内');
          }
        } else if (!scope.isHr) {
          throw new CoolCommException('只有 HR 可以强制转办');
        }

        const assignee = await this.findActiveUser(manager, toUserId);

        if (!assignee) {
          throw new CoolCommException('转办目标不存在或已停用');
        }

        await manager.getRepository(PerformanceApprovalInstanceNodeEntity).update(
          { id: currentNode.id },
          {
            approverId: toUserId,
            transferFromUserId: currentNode.approverId,
            transferReason: reason,
            comment: currentNode.comment || null,
          }
        );
        await manager.getRepository(PerformanceApprovalInstanceEntity).update(
          { id: instance.id },
          {
            currentApproverId: toUserId,
          }
        );
        await this.syncSourceApprovalRuntime(manager, instance.id);
        await this.saveActionLog(manager, {
          instanceId: instance.id,
          instanceNodeId: currentNode.id,
          action: 'transfer',
          operatorId: scope.userId,
          fromStatus: instance.status,
          toStatus: instance.status,
          reason,
          detail: `toUserId=${toUserId}${force ? ';force=true' : ''}`,
        });
      }
    );

    return this.info(instanceId);
  }

  async withdraw(payload: any) {
    const scope = await this.getScope();

    if (!scope.can('approval.instance.withdraw')) {
      throw new CoolCommException('无权限撤回');
    }

    const instanceId = Number(payload?.instanceId);
    const reason = normalizeOptionalString(payload?.reason, 500);

    await this.performanceApprovalInstanceEntity.manager.transaction(
      async manager => {
        const instance = await this.requireInstanceWithManager(manager, instanceId);
        await this.assertInstanceInScope(instance, scope);
        assertApprovalInstanceTransition(instance.status, 'withdraw');

        if (scope.userId !== Number(instance.applicantId)) {
          throw new CoolCommException('仅允许发起人撤回');
        }

        const currentNode = instance.currentNodeOrder
          ? await this.requireCurrentNode(manager, instance)
          : null;
        if (
          !canWithdrawInstance(
            instance.status as ApprovalInstanceStatus,
            instance.currentNodeOrder,
            (currentNode?.status || null) as ApprovalNodeStatus | null,
            currentNode?.actionTime
          )
        ) {
          throw new CoolCommException('当前状态不允许撤回');
        }

        const now = this.now();
        await this.cancelPendingNodes(manager, instance.id);
        await manager.getRepository(PerformanceApprovalInstanceEntity).update(
          { id: instance.id },
          {
            status: 'withdrawn',
            sourceStatus: getApprovalSourceDraftStatus(
              instance.objectType as ApprovalObjectType
            ),
            currentNodeOrder: null,
            currentApproverId: null,
            finishTime: now,
          }
        );
        await this.syncSourceObject(
          manager,
          instance.objectType as ApprovalObjectType,
          instance.objectId,
          {
            finalStatus: 'withdrawn',
            comment: reason,
            now,
          }
        );
        await this.saveActionLog(manager, {
          instanceId: instance.id,
          instanceNodeId: currentNode?.id ?? null,
          action: 'withdraw',
          operatorId: scope.userId,
          fromStatus: instance.status,
          toStatus: 'withdrawn',
          reason: reason || null,
        });
      }
    );

    return this.info(instanceId);
  }

  async remind(payload: any) {
    const scope = await this.getScope();

    if (!scope.can('approval.instance.remind')) {
      throw new CoolCommException('无权限催办');
    }

    const instanceId = Number(payload?.instanceId);
    const note = normalizeOptionalString(payload?.note, 1000);

    await this.performanceApprovalInstanceEntity.manager.transaction(
      async manager => {
        const instance = await this.requireInstanceWithManager(manager, instanceId);
        await this.assertInstanceInScope(instance, scope);
        assertApprovalInstanceTransition(instance.status, 'remind');
        assertApprovalActiveStatus(instance.status);

        if (!scope.isHr && scope.userId !== Number(instance.applicantId)) {
          throw new CoolCommException('仅允许发起人或 HR 催办');
        }

        const currentNode = instance.currentNodeOrder
          ? await this.requireCurrentNode(manager, instance)
          : null;

        await this.saveActionLog(manager, {
          instanceId: instance.id,
          instanceNodeId: currentNode?.id ?? null,
          action: 'remind',
          operatorId: scope.userId,
          fromStatus: instance.status,
          toStatus: instance.status,
          detail: note || null,
        });
      }
    );

    return this.info(instanceId);
  }

  async resolve(payload: any) {
    const scope = await this.getScope();

    if (!scope.can('approval.instance.resolve') || !scope.isHr) {
      throw new CoolCommException('只有 HR 可以人工恢复审批');
    }

    const instanceId = Number(payload?.instanceId);
    const assigneeUserId = Number(payload?.assigneeUserId);
    const reason = normalizeRequiredString(payload?.reason, '恢复原因不能为空', 500);

    await this.performanceApprovalInstanceEntity.manager.transaction(
      async manager => {
        const instance = await this.requireInstanceWithManager(manager, instanceId);
        await this.assertInstanceInScope(instance, scope);
        assertApprovalInstanceTransition(instance.status, 'resolve');

        const assignee = await this.findActiveUser(manager, assigneeUserId);

        if (!assignee) {
          throw new CoolCommException('指定审批人不存在或已停用');
        }

        const currentNode = await this.requireCurrentNode(manager, instance);
        await manager.getRepository(PerformanceApprovalInstanceNodeEntity).update(
          { id: currentNode.id },
          {
            approverId: assigneeUserId,
            status: 'pending',
            actionTime: null,
            transferFromUserId: null,
            transferReason: null,
          }
        );
        await manager.getRepository(PerformanceApprovalInstanceEntity).update(
          { id: instance.id },
          {
            status: 'in_review',
            sourceStatus: getApprovalSourceStatus(
              instance.objectType as ApprovalObjectType
            ),
            currentApproverId: assigneeUserId,
          }
        );
        await this.syncSourceApprovalRuntime(manager, instance.id);
        await this.saveActionLog(manager, {
          instanceId: instance.id,
          instanceNodeId: currentNode.id,
          action: 'resolve',
          operatorId: scope.userId,
          fromStatus: instance.status,
          toStatus: 'in_review',
          reason,
          detail: `assigneeUserId=${assigneeUserId}`,
        });
      }
    );

    return this.info(instanceId);
  }

  async fallback(payload: any) {
    const scope = await this.getScope();

    if (!scope.can('approval.instance.fallback') || !scope.isHr) {
      throw new CoolCommException('只有 HR 可以回退到手工审批主链');
    }

    const instanceId = Number(payload?.instanceId);
    const reason = normalizeRequiredString(payload?.reason, '回退原因不能为空', 500);

    await this.performanceApprovalInstanceEntity.manager.transaction(
      async manager => {
        const instance = await this.requireInstanceWithManager(manager, instanceId);
        await this.assertInstanceInScope(instance, scope);
        assertApprovalInstanceTransition(instance.status, 'fallback');

        await this.cancelPendingNodes(manager, instance.id);
        await manager.getRepository(PerformanceApprovalInstanceEntity).update(
          { id: instance.id },
          {
            status: 'terminated',
            sourceStatus: getApprovalSourceStatus(
              instance.objectType as ApprovalObjectType
            ),
            currentNodeOrder: null,
            currentApproverId: null,
            finishTime: this.now(),
            fallbackReason: reason,
            fallbackOperatorId: scope.userId,
          }
        );
        await this.syncSourceObject(
          manager,
          instance.objectType as ApprovalObjectType,
          instance.objectId,
          {
            finalStatus: 'fallback',
            now: this.now(),
          }
        );
        await this.saveActionLog(manager, {
          instanceId: instance.id,
          action: 'fallback',
          operatorId: scope.userId,
          fromStatus: instance.status,
          toStatus: 'terminated',
          reason,
        });
      }
    );

    return this.info(instanceId);
  }

  async terminate(payload: any) {
    const scope = await this.getScope();

    if (!scope.can('approval.instance.terminate') || !scope.isHr) {
      throw new CoolCommException('只有 HR 可以强制终止审批实例');
    }

    const instanceId = Number(payload?.instanceId);
    const reason = normalizeRequiredString(payload?.reason, '终止原因不能为空', 500);

    await this.performanceApprovalInstanceEntity.manager.transaction(
      async manager => {
        const instance = await this.requireInstanceWithManager(manager, instanceId);
        await this.assertInstanceInScope(instance, scope);
        assertApprovalInstanceTransition(instance.status, 'terminate');

        await this.cancelPendingNodes(manager, instance.id);
        await manager.getRepository(PerformanceApprovalInstanceEntity).update(
          { id: instance.id },
          {
            status: 'terminated',
            currentNodeOrder: null,
            currentApproverId: null,
            finishTime: this.now(),
            terminateReason: reason,
            terminateOperatorId: scope.userId,
          }
        );
        await this.syncSourceObject(
          manager,
          instance.objectType as ApprovalObjectType,
          instance.objectId,
          {
            finalStatus: 'terminated',
            now: this.now(),
          }
        );
        await this.saveActionLog(manager, {
          instanceId: instance.id,
          action: 'terminate',
          operatorId: scope.userId,
          fromStatus: instance.status,
          toStatus: 'terminated',
          reason,
        });
      }
    );

    return this.info(instanceId);
  }

  async markTimeout(instanceId: number, detail = '节点超时未处理') {
    await this.performanceApprovalInstanceEntity.manager.transaction(
      async manager => {
        const instance = await this.requireInstanceWithManager(manager, instanceId);

        if (instance.status !== 'in_review') {
          throw new CoolCommException('当前状态不允许标记超时');
        }

        const currentNode = await this.requireCurrentNode(manager, instance);
        await manager.getRepository(PerformanceApprovalInstanceNodeEntity).update(
          { id: currentNode.id },
          {
            status: 'timed_out',
            actionTime: this.now(),
            transferReason: detail,
          }
        );
        await manager.getRepository(PerformanceApprovalInstanceEntity).update(
          { id: instance.id },
          {
            status: 'manual_pending',
            currentApproverId: null,
          }
        );
      }
    );

    return this.info(instanceId);
  }

  async submitAssessment(
    assessment: PerformanceAssessmentEntity,
    summary: { totalScore: number; grade: string }
  ) {
    await this.performanceAssessmentEntity.manager.transaction(async manager => {
      await this.lockSourceObject(manager, 'assessment', assessment.id);
      const config = await this.findEnabledConfig(manager, 'assessment');
      const now = this.now();

      if (config) {
        await this.ensureNoActiveInstance(manager, 'assessment', assessment.id);
      }

      await manager.getRepository(PerformanceAssessmentEntity).update(
        { id: assessment.id },
        {
          totalScore: summary.totalScore,
          grade: summary.grade,
          status: 'submitted',
          submitTime: now,
        }
      );

      if (config) {
        await this.launchInstance(manager, {
          objectType: 'assessment',
          objectId: assessment.id,
          sourceStatus: 'submitted',
          applicantId: assessment.employeeId,
          employeeId: assessment.employeeId,
          departmentId: assessment.departmentId,
          tenantId: assessment.tenantId ?? null,
        });
      }
    });
  }

  async submitPromotion(promotion: PerformancePromotionEntity) {
    await this.performancePromotionEntity.manager.transaction(async manager => {
      await this.lockSourceObject(manager, 'promotion', promotion.id);
      const config = await this.findEnabledConfig(manager, 'promotion');

      if (config) {
        await this.ensureNoActiveInstance(manager, 'promotion', promotion.id);
      }

      await manager.getRepository(PerformancePromotionEntity).update(
        { id: promotion.id },
        {
          status: 'reviewing',
        }
      );

      if (config) {
        const employee = await manager
          .getRepository(BaseSysUserEntity)
          .findOneBy({ id: promotion.employeeId });
        await this.launchInstance(manager, {
          objectType: 'promotion',
          objectId: promotion.id,
          sourceStatus: 'reviewing',
          applicantId: promotion.sponsorId,
          employeeId: promotion.employeeId,
          departmentId: Number(employee?.departmentId || 0),
          tenantId: promotion.tenantId ?? null,
        });
      }
    });
  }

  async launchForObject(
    payload: {
      objectType: ApprovalObjectType;
      objectId: number;
      applicantId: number;
      employeeId: number;
      departmentId: number;
      tenantId: number | null;
    },
    manager?: EntityManager
  ) {
    const sourceStatus = getApprovalSourceStatus(payload.objectType);

    if (manager) {
      return this.launchInstance(manager, {
        ...payload,
        sourceStatus,
      });
    }

    return this.performanceApprovalInstanceEntity.manager.transaction(txManager =>
      this.launchInstance(txManager, {
        ...payload,
        sourceStatus,
      })
    );
  }

  async assertManualReviewAllowed(objectTypeValue: any, objectId: number) {
    const objectType = normalizeApprovalObjectType(objectTypeValue);
    const activeInstance = await this.performanceApprovalInstanceEntity.findOne({
      where: {
        objectType,
        objectId: Number(objectId),
        status: In(APPROVAL_ACTIVE_STATUSES),
      },
      order: { id: 'DESC' },
    });

    if (activeInstance) {
      throw new CoolCommException(
        '当前对象存在进行中的自动审批实例，请改用 approval-flow 接口'
      );
    }
  }

  async assertManualReviewEntryAllowed(objectTypeValue: any, objectId: number) {
    return this.assertManualReviewAllowed(objectTypeValue, objectId);
  }

  private async buildInstanceDetail(
    instance: PerformanceApprovalInstanceEntity,
    scope: ApprovalScope
  ) {
    const [nodes, applicant, employee, department] = await Promise.all([
      this.performanceApprovalInstanceNodeEntity.find({
        where: { instanceId: instance.id },
        order: { nodeOrder: 'ASC' },
      }),
      this.baseSysUserEntity.findOneBy({ id: instance.applicantId }),
      this.baseSysUserEntity.findOneBy({ id: instance.employeeId }),
      this.baseSysDepartmentEntity.findOneBy({ id: instance.departmentId }),
    ]);

    const userIds = [
      ...new Set(
        [instance.currentApproverId]
          .concat(nodes.map(item => item.approverId))
          .filter(Boolean) as number[]
      ),
    ];
    const users = userIds.length
      ? await this.baseSysUserEntity.findBy({ id: In(userIds) })
      : [];
    const currentNode = nodes.find(
      item => Number(item.nodeOrder) === Number(instance.currentNodeOrder || 0)
    );
    const currentApprover = users.find(
      item => Number(item.id) === Number(instance.currentApproverId || 0)
    );

    return {
      instanceId: Number(instance.id),
      objectType: instance.objectType,
      objectId: Number(instance.objectId),
      sourceStatus: instance.sourceStatus,
      status: instance.status,
      applicantId: Number(instance.applicantId),
      applicantName: applicant?.name || '',
      employeeId: Number(instance.employeeId),
      employeeName: employee?.name || '',
      departmentId: Number(instance.departmentId),
      departmentName: department?.name || '',
      configVersion: scope.isHr || this.isParticipant(instance, nodes, scope.userId)
        ? instance.configVersion
        : undefined,
      currentNodeOrder: instance.currentNodeOrder
        ? Number(instance.currentNodeOrder)
        : null,
      currentNodeCode: currentNode?.nodeCode || null,
      currentNodeName: currentNode?.nodeName || null,
      currentApproverId: instance.currentApproverId
        ? Number(instance.currentApproverId)
        : null,
      currentApproverName: currentApprover?.name || null,
      availableActions: this.resolveAvailableActions(instance, currentNode, scope),
      createTime: instance.createTime,
      updateTime: instance.updateTime,
      fallbackReason: scope.isHr ? instance.fallbackReason : undefined,
      terminateReason: scope.isHr ? instance.terminateReason : undefined,
      nodes: nodes.map(item => this.toInstanceNode(item, users, scope)),
    };
  }

  private async launchInstance(
    manager: EntityManager,
    payload: {
      objectType: ApprovalObjectType;
      objectId: number;
      sourceStatus: string;
      applicantId: number;
      employeeId: number;
      departmentId: number;
      tenantId: number | null;
    }
  ) {
    const config = await this.requireEnabledConfig(manager, payload.objectType);
    const configNodes = await manager
      .getRepository(PerformanceApprovalConfigNodeEntity)
      .find({
        where: { configId: config.id },
        order: { nodeOrder: 'ASC' },
      });

    if (!configNodes.length) {
      throw new CoolCommException('审批流配置缺少节点');
    }

    const applicableNodeOrders = await this.resolveApplicableNodeOrders(
      manager,
      payload.objectType,
      payload.objectId,
      configNodes
    );
    const firstNode = configNodes.find(item =>
      applicableNodeOrders.has(Number(item.nodeOrder))
    );

    if (!firstNode) {
      throw new CoolCommException('当前申请未命中可执行审批节点');
    }

    const context: ApprovalContext = {
      objectType: payload.objectType,
      applicantId: payload.applicantId,
      employeeId: payload.employeeId,
      departmentId: payload.departmentId,
    };
    const resolution = await this.resolveNodeApprover(manager, firstNode, context);
    const now = this.now();
    let instance = await manager.getRepository(PerformanceApprovalInstanceEntity).save(
      manager.getRepository(PerformanceApprovalInstanceEntity).create({
        objectType: payload.objectType,
        objectId: payload.objectId,
        sourceStatus: payload.sourceStatus,
        configId: config.id,
        configVersion: config.version,
        applicantId: payload.applicantId,
        employeeId: payload.employeeId,
        departmentId: payload.departmentId,
        status: resolution.approverId ? 'in_review' : 'pending_resolution',
        currentNodeOrder: firstNode.nodeOrder,
        currentApproverId: resolution.approverId,
        launchTime: now,
        finishTime: null,
        fallbackReason: null,
        fallbackOperatorId: null,
        terminateReason: null,
        terminateOperatorId: null,
        tenantId: payload.tenantId,
      })
    );
    const nodeEntities = configNodes.map(item =>
      manager.getRepository(PerformanceApprovalInstanceNodeEntity).create({
        instanceId: instance.id,
        nodeOrder: item.nodeOrder,
        nodeCode: item.nodeCode,
        nodeName: item.nodeName,
        resolverType: item.resolverType,
        resolverValueSnapshot: item.resolverValue || null,
        allowTransfer: Boolean(item.allowTransfer),
        approverId:
          applicableNodeOrders.has(Number(item.nodeOrder)) &&
          item.nodeOrder === firstNode.nodeOrder
            ? resolution.approverId
            : null,
        status: applicableNodeOrders.has(Number(item.nodeOrder))
          ? 'pending'
          : 'cancelled',
        actionTime: null,
        transferFromUserId: null,
        transferReason: null,
        comment: null,
        tenantId: payload.tenantId,
      })
    );
    await manager.getRepository(PerformanceApprovalInstanceNodeEntity).save(nodeEntities);
    await this.saveActionLog(manager, {
      instanceId: instance.id,
      action: 'launch',
      operatorId: payload.applicantId,
      fromStatus: null,
      toStatus: instance.status,
      detail: resolution.detail,
    });
    instance = await manager
      .getRepository(PerformanceApprovalInstanceEntity)
      .findOneBy({ id: instance.id });
    return instance;
  }

  private async syncSourceObject(
    manager: EntityManager,
    objectType: ApprovalObjectType,
    objectId: number,
    payload: {
      finalStatus:
        | 'approved'
        | 'rejected'
        | 'withdrawn'
        | 'fallback'
        | 'terminated';
      comment?: string;
      now: string;
    }
  ) {
    if (objectType === 'assessment') {
      switch (payload.finalStatus) {
        case 'approved':
          await manager.getRepository(PerformanceAssessmentEntity).update(
            { id: objectId },
            {
              status: 'approved',
              managerFeedback: payload.comment || '',
              approveTime: payload.now,
            }
          );
          {
            const assessment = await manager
              .getRepository(PerformanceAssessmentEntity)
              .findOneBy({ id: objectId });
            if (assessment) {
              await this.performanceSuggestionService.syncApprovedAssessmentInTransaction(
                manager,
                {
                  id: assessment.id,
                  employeeId: Number(assessment.employeeId),
                  departmentId: Number(assessment.departmentId),
                  periodType: assessment.periodType,
                  periodValue: assessment.periodValue,
                  status: 'approved',
                  grade: assessment.grade,
                  totalScore: Number(assessment.totalScore || 0),
                  tenantId: assessment.tenantId ?? null,
                }
              );
            }
          }
          return;
        case 'rejected':
          await manager.getRepository(PerformanceAssessmentEntity).update(
            { id: objectId },
            {
              status: 'rejected',
              managerFeedback: payload.comment || '',
              approveTime: payload.now,
            }
          );
          return;
        case 'withdrawn':
          await manager.getRepository(PerformanceAssessmentEntity).update(
            { id: objectId },
            {
              status: 'draft',
              managerFeedback: '',
              approveTime: null,
              submitTime: null,
            }
          );
          return;
        case 'fallback':
        case 'terminated':
          await manager.getRepository(PerformanceAssessmentEntity).update(
            { id: objectId },
            {
              status: 'submitted',
            }
          );
      }
      return;
    }

    if (objectType === 'promotion') {
      switch (payload.finalStatus) {
        case 'approved':
          await manager.getRepository(PerformancePromotionEntity).update(
            { id: objectId },
            {
              status: 'approved',
              reviewTime: payload.now,
            }
          );
          return;
        case 'rejected':
          await manager.getRepository(PerformancePromotionEntity).update(
            { id: objectId },
            {
              status: 'rejected',
              reviewTime: payload.now,
            }
          );
          return;
        case 'withdrawn':
          await manager.getRepository(PerformancePromotionEntity).update(
            { id: objectId },
            {
              status: 'draft',
              reviewTime: null,
            }
          );
          return;
        case 'fallback':
        case 'terminated':
          await manager.getRepository(PerformancePromotionEntity).update(
            { id: objectId },
            {
              status: 'reviewing',
            }
          );
      }
      return;
    }

    switch (payload.finalStatus) {
      case 'approved':
        await manager.getRepository(PerformanceAssetAssignmentRequestEntity).update(
          { id: objectId },
          {
            status: 'approvedPendingAssignment',
            approvalStatus: 'approved',
            currentApproverId: null,
          }
        );
        return;
      case 'rejected':
        await manager.getRepository(PerformanceAssetAssignmentRequestEntity).update(
          { id: objectId },
          {
            status: 'rejected',
            approvalStatus: 'rejected',
            currentApproverId: null,
          }
        );
        return;
      case 'withdrawn':
        await manager.getRepository(PerformanceAssetAssignmentRequestEntity).update(
          { id: objectId },
          {
            status: 'withdrawn',
            approvalStatus: 'withdrawn',
            currentApproverId: null,
            withdrawTime: payload.now,
          }
        );
        return;
      case 'fallback':
        await manager.getRepository(PerformanceAssetAssignmentRequestEntity).update(
          { id: objectId },
          {
            status: 'manualPending',
            approvalStatus: 'manual_pending',
            currentApproverId: null,
          }
        );
        return;
      case 'terminated':
        await manager.getRepository(PerformanceAssetAssignmentRequestEntity).update(
          { id: objectId },
          {
            status: 'cancelled',
            approvalStatus: 'terminated',
            currentApproverId: null,
            cancelReason: payload.comment || '审批实例已终止',
          }
        );
        return;
    }
  }

  private async resolveNodeApprover(
    manager: EntityManager,
    node:
      | PerformanceApprovalConfigNodeEntity
      | PerformanceApprovalInstanceNodeEntity,
    context: ApprovalContext
  ) {
    const candidates = await this.resolveCandidateApproverIds(manager, node, context);

    if (candidates.length !== 1) {
      return {
        approverId: null,
        detail:
          candidates.length === 0
            ? '当前节点未解析出唯一审批人'
            : '当前节点解析出多个审批人，等待 HR 指定',
      };
    }

    return {
      approverId: candidates[0],
      detail: null,
    };
  }

  private async resolveApplicableNodeOrders(
    manager: EntityManager,
    objectType: ApprovalObjectType,
    objectId: number,
    nodes: PerformanceApprovalConfigNodeEntity[]
  ) {
    if (objectType !== 'assetAssignmentRequest') {
      return new Set(nodes.map(item => Number(item.nodeOrder)));
    }

    const request = await manager
      .getRepository(PerformanceAssetAssignmentRequestEntity)
      .findOneBy({ id: objectId });

    if (!request) {
      throw new CoolCommException(PERFORMANCE_ASSIGNMENT_REQUEST_NOT_FOUND_MESSAGE);
    }

    const triggeredRules = this.parseAssetAssignmentRequestRules(
      request.approvalTriggeredRules
    );
    const requiresManagementApproval =
      String(request.requestLevel || '') === 'L2' &&
      [
        'highAmount',
        'sensitiveAsset',
        'crossDepartmentBorrow',
        'lostReplacement',
        'abnormalReissue',
        'scrapReplacement',
      ].some(rule => triggeredRules.includes(rule));

    return new Set(
      nodes
        .filter(item =>
          this.isAssetAssignmentRequestNodeApplicable(item.nodeCode, {
            requestLevel: String(request.requestLevel || ''),
            requiresManagementApproval,
          })
        )
        .map(item => Number(item.nodeOrder))
    );
  }

  private isAssetAssignmentRequestNodeApplicable(
    nodeCodeValue: string | null | undefined,
    payload: {
      requestLevel: string;
      requiresManagementApproval: boolean;
    }
  ) {
    const nodeCode = String(nodeCodeValue || '').trim();

    if (!nodeCode) {
      return true;
    }

    if (nodeCode === 'department-manager-review') {
      return true;
    }

    if (nodeCode === 'asset-admin-confirm') {
      return payload.requestLevel === 'L2';
    }

    if (nodeCode === 'management-confirm') {
      return payload.requiresManagementApproval;
    }

    return true;
  }

  private parseAssetAssignmentRequestRules(value: string | null | undefined) {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
    } catch (error) {
      return [];
    }
  }

  private async resolveCandidateApproverIds(
    manager: EntityManager,
    node:
      | PerformanceApprovalConfigNodeEntity
      | PerformanceApprovalInstanceNodeEntity,
    context: ApprovalContext
  ) {
    switch (node.resolverType) {
      case 'specified_user': {
        const userId = normalizeOptionalNumber(
          (node as any).resolverValue || (node as any).resolverValueSnapshot
        );
        const user = userId ? await this.findActiveUser(manager, userId) : null;
        return user ? [Number(user.id)] : [];
      }
      case 'applicant_direct_manager':
        return this.resolveDepartmentManagerCandidates(manager, context.applicantId);
      case 'employee_department_manager':
        return this.resolveDepartmentManagerCandidates(manager, context.employeeId);
      case 'department_tree_role':
        return this.resolveDepartmentTreeRoleCandidates(
          manager,
          context.departmentId,
          normalizeOptionalNumber(
            (node as any).resolverValue || (node as any).resolverValueSnapshot
          )
        );
      case 'hr_manual_assign':
        return [];
      default:
        return [];
    }
  }

  private async resolveDepartmentManagerCandidates(
    manager: EntityManager,
    userId: number
  ) {
    const user = await manager.getRepository(BaseSysUserEntity).findOneBy({ id: userId });

    if (!user?.departmentId) {
      return [];
    }

    const department = await manager
      .getRepository(BaseSysDepartmentEntity)
      .findOneBy({ id: user.departmentId });

    if (!department?.userId) {
      return [];
    }

    const managerUser = await this.findActiveUser(manager, Number(department.userId));
    return managerUser ? [Number(managerUser.id)] : [];
  }

  private async resolveDepartmentTreeRoleCandidates(
    manager: EntityManager,
    rootDepartmentId: number,
    roleId: number | null
  ) {
    if (!rootDepartmentId || !roleId) {
      return [];
    }

    const departmentIds = await this.collectDepartmentTreeIds(manager, rootDepartmentId);
    if (!departmentIds.length) {
      return [];
    }

    const bindings = await manager.getRepository(BaseSysUserRoleEntity).find({
      where: { roleId },
    });
    if (!bindings.length) {
      return [];
    }

    const userIds = bindings.map(item => Number(item.userId));
    const users = await manager.getRepository(BaseSysUserEntity).find({
      where: {
        id: In(userIds),
        departmentId: In(departmentIds),
        status: 1,
      },
    });

    return [...new Set(users.map(item => Number(item.id)))];
  }

  private async collectDepartmentTreeIds(
    manager: EntityManager,
    rootDepartmentId: number
  ) {
    const departments = await manager.getRepository(BaseSysDepartmentEntity).find();
    const childrenMap = new Map<number, number[]>();

    departments.forEach(item => {
      const parentId = Number(item.parentId || 0);
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(Number(item.id));
    });

    const queue = [Number(rootDepartmentId)];
    const visited = new Set<number>();

    while (queue.length) {
      const current = queue.shift()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      (childrenMap.get(current) || []).forEach(childId => {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      });
    }

    return [...visited];
  }

  private async nodeAllowsTransfer(
    instance: PerformanceApprovalInstanceEntity,
    currentNode: PerformanceApprovalInstanceNodeEntity
  ) {
    const configNode = await this.performanceApprovalConfigNodeEntity.findOne({
      where: {
        configId: instance.configId,
        nodeOrder: currentNode.nodeOrder,
      },
    });

    return configNode ? Boolean(configNode.allowTransfer) : true;
  }

  private async syncSourceApprovalRuntime(
    manager: EntityManager,
    instanceId: number
  ) {
    const instance = await manager
      .getRepository(PerformanceApprovalInstanceEntity)
      .findOneBy({ id: instanceId });

    if (!instance || instance.objectType !== 'assetAssignmentRequest') {
      return;
    }

    await manager.getRepository(PerformanceAssetAssignmentRequestEntity).update(
      { id: instance.objectId },
      {
        approvalStatus: instance.status,
        currentApproverId: instance.currentApproverId
          ? Number(instance.currentApproverId)
          : null,
      }
    );
  }

  private async requireEnabledConfig(
    manager: EntityManager,
    objectType: ApprovalObjectType
  ) {
    const config = await this.findEnabledConfig(manager, objectType);

    if (!config) {
      throw new CoolCommException('当前对象未启用自动审批流');
    }

    return config;
  }

  private async findEnabledConfig(
    manager: EntityManager,
    objectType: ApprovalObjectType
  ) {
    return manager.getRepository(PerformanceApprovalConfigEntity).findOne({
      where: {
        objectType,
        enabled: true,
      },
      order: { id: 'DESC' },
    });
  }

  private async ensureNoActiveInstance(
    manager: EntityManager,
    objectType: ApprovalObjectType,
    objectId: number
  ) {
    const existing = await manager.getRepository(PerformanceApprovalInstanceEntity).findOne({
      where: {
        objectType,
        objectId,
        status: In(APPROVAL_ACTIVE_STATUSES),
      },
      order: { id: 'DESC' },
    });

    if (existing) {
      throw new CoolCommException('当前对象已存在进行中的自动审批实例');
    }
  }

  private async lockSourceObject(
    manager: EntityManager,
    objectType: ApprovalObjectType,
    objectId: number
  ) {
    const entity =
      objectType === 'assessment'
        ? PerformanceAssessmentEntity
        : objectType === 'promotion'
          ? PerformancePromotionEntity
          : PerformanceAssetAssignmentRequestEntity;

    await manager.getRepository(entity).findOne({
      where: { id: objectId },
      lock: { mode: 'pessimistic_write' },
    } as any);
  }

  private async requireInstance(id: number) {
    const instance = await this.performanceApprovalInstanceEntity.findOneBy({ id });

    if (!instance) {
      throw new CoolCommException(PERFORMANCE_APPROVAL_INSTANCE_NOT_FOUND_MESSAGE);
    }

    return instance;
  }

  private async requireInstanceWithManager(manager: EntityManager, id: number) {
    const instance = await manager
      .getRepository(PerformanceApprovalInstanceEntity)
      .findOneBy({ id });

    if (!instance) {
      throw new CoolCommException(PERFORMANCE_APPROVAL_INSTANCE_NOT_FOUND_MESSAGE);
    }

    return instance;
  }

  private async requireCurrentNode(
    manager: EntityManager,
    instance: PerformanceApprovalInstanceEntity
  ) {
    const node = await manager.getRepository(PerformanceApprovalInstanceNodeEntity).findOne({
      where: {
        instanceId: instance.id,
        nodeOrder: Number(instance.currentNodeOrder || 0),
      },
    });

    if (!node) {
      throw new CoolCommException('当前审批节点不存在');
    }

    return node;
  }

  private async findActiveUser(manager: EntityManager, userId: number) {
    return manager.getRepository(BaseSysUserEntity).findOneBy({
      id: userId,
      status: 1,
    });
  }

  private async cancelPendingNodes(
    manager: EntityManager,
    instanceId: number,
    excludeIds: number[] = []
  ) {
    const nodes = await manager.getRepository(PerformanceApprovalInstanceNodeEntity).find({
      where: { instanceId },
    });
    const now = this.now();

    for (const node of nodes) {
      if (excludeIds.includes(Number(node.id))) {
        continue;
      }
      if (node.status === 'pending') {
        await manager.getRepository(PerformanceApprovalInstanceNodeEntity).update(
          { id: node.id },
          {
            status: 'cancelled',
            actionTime: now,
          }
        );
      }
    }
  }

  private async saveActionLog(
    manager: EntityManager,
    payload: {
      instanceId: number;
      instanceNodeId?: number | null;
      action:
        | 'launch'
        | 'approve'
        | 'reject'
        | 'transfer'
        | 'withdraw'
        | 'remind'
        | 'resolve'
        | 'fallback'
        | 'terminate';
      operatorId: number;
      fromStatus?: string | null;
      toStatus?: string | null;
      reason?: string | null;
      detail?: string | null;
    }
  ) {
    await manager.getRepository(PerformanceApprovalActionLogEntity).save(
      manager.getRepository(PerformanceApprovalActionLogEntity).create({
        instanceId: payload.instanceId,
        instanceNodeId: payload.instanceNodeId ?? null,
        action: payload.action,
        operatorId: payload.operatorId,
        fromStatus: payload.fromStatus ?? null,
        toStatus: payload.toStatus ?? null,
        reason: payload.reason ?? null,
        detail: payload.detail ?? null,
        tenantId: this.currentAdmin?.tenantId ?? null,
      })
    );
  }

  private async getScope(): Promise<ApprovalScope> {
    const access = await this.performanceAccessContextService.resolveAccessContext();
    const userId = Number(access.userId || 0);

    if (!userId) {
      throw new CoolCommException(
        resolvePerformanceDomainErrorMessage(
          PERFORMANCE_DOMAIN_ERROR_CODES.authContextMissing
        )
      );
    }
    const isHr = access.availablePersonas.some(item =>
      ['org.hrbp', 'fn.performance_operator'].includes(item.key)
    );

    if (isHr) {
      return {
        isHr: true,
        departmentIds: null,
        userId,
        can: capabilityKey =>
          this.performanceAccessContextService.hasCapability(access, capabilityKey),
      };
    }
    return {
      isHr: false,
      departmentIds: access.departmentIds,
      userId,
      can: capabilityKey =>
        this.performanceAccessContextService.hasCapability(access, capabilityKey),
    };
  }

  private async assertInstanceInScope(
    instance: PerformanceApprovalInstanceEntity,
    scope: ApprovalScope
  ) {
    if (scope.isHr) {
      return;
    }

    if (scope.userId === Number(instance.applicantId)) {
      return;
    }

    if (scope.userId === Number(instance.currentApproverId || 0)) {
      return;
    }

    if (
      Array.isArray(scope.departmentIds) &&
      scope.departmentIds.includes(Number(instance.departmentId))
    ) {
      return;
    }

    const participant = await this.performanceApprovalInstanceNodeEntity.findOne({
      where: {
        instanceId: instance.id,
        approverId: scope.userId,
      },
    });

    if (participant) {
      return;
    }

    throw new CoolCommException('无权限查看该审批实例');
  }

  private async assertCurrentApprover(
    instance: PerformanceApprovalInstanceEntity,
    userId: number
  ) {
    if (instance.status !== 'in_review') {
      throw new CoolCommException('当前状态不允许执行审批动作');
    }

    if (Number(instance.currentApproverId || 0) !== Number(userId)) {
      throw new CoolCommException('仅当前审批人可执行该操作');
    }
  }

  private resolveAvailableActions(
    instance: PerformanceApprovalInstanceEntity,
    currentNode: PerformanceApprovalInstanceNodeEntity | undefined,
    scope: ApprovalScope
  ) {
    const actions: string[] = [];

    if (
      instance.status === 'in_review' &&
      Number(instance.currentApproverId || 0) === scope.userId
    ) {
      if (scope.can('approval.instance.approve')) {
        actions.push('approve');
      }
      if (scope.can('approval.instance.reject')) {
        actions.push('reject');
      }
      if (scope.can('approval.instance.transfer')) {
        actions.push('transfer');
      }
    }

    if (
      scope.can('approval.instance.withdraw') &&
      scope.userId === Number(instance.applicantId) &&
      canWithdrawInstance(
        instance.status as ApprovalInstanceStatus,
        instance.currentNodeOrder,
        (currentNode?.status || null) as ApprovalNodeStatus | null,
        currentNode?.actionTime
      )
    ) {
      actions.push('withdraw');
    }

    if (
      scope.can('approval.instance.remind') &&
      (scope.isHr || scope.userId === Number(instance.applicantId)) &&
      APPROVAL_ACTIVE_STATUSES.includes(instance.status as ApprovalInstanceStatus)
    ) {
      actions.push('remind');
    }

    if (
      scope.isHr &&
      scope.can('approval.instance.resolve') &&
      ['pending_resolution', 'manual_pending'].includes(instance.status)
    ) {
      actions.push('resolve');
    }

    if (
      scope.isHr &&
      scope.can('approval.instance.fallback') &&
      ['pending_resolution', 'manual_pending'].includes(instance.status)
    ) {
      actions.push('fallback');
    }

    if (
      scope.isHr &&
      scope.can('approval.instance.terminate') &&
      ['pending_resolution', 'manual_pending', 'in_review'].includes(instance.status)
    ) {
      actions.push('terminate');
    }

    return actions;
  }

  private toConfigNode(item: PerformanceApprovalConfigNodeEntity) {
    return {
      id: Number(item.id),
      nodeOrder: Number(item.nodeOrder),
      nodeCode: item.nodeCode,
      nodeName: item.nodeName,
      resolverType: item.resolverType,
      resolverValue: item.resolverValue,
      timeoutHours: item.timeoutHours == null ? null : Number(item.timeoutHours),
      allowTransfer: Boolean(item.allowTransfer),
    };
  }

  private toInstanceNode(
    item: PerformanceApprovalInstanceNodeEntity,
    users: BaseSysUserEntity[],
    scope: ApprovalScope
  ) {
    const approver = users.find(user => Number(user.id) === Number(item.approverId || 0));
    const isOwnApprovalNode = Number(item.approverId || 0) === Number(scope.userId);

    return {
      nodeOrder: Number(item.nodeOrder),
      nodeCode: item.nodeCode,
      nodeName: item.nodeName,
      resolverType: scope.isHr || isOwnApprovalNode ? item.resolverType : undefined,
      resolverValue: scope.isHr ? item.resolverValueSnapshot : undefined,
      approverId: item.approverId == null ? null : Number(item.approverId),
      approverName: approver?.name || '',
      status: item.status,
      actionTime: item.actionTime,
      transferReason: scope.isHr || isOwnApprovalNode ? item.transferReason : undefined,
      comment: scope.isHr || isOwnApprovalNode ? item.comment || '' : undefined,
    };
  }

  private isParticipant(
    instance: PerformanceApprovalInstanceEntity,
    nodes: PerformanceApprovalInstanceNodeEntity[],
    userId: number
  ) {
    if (Number(instance.applicantId) === Number(userId)) {
      return true;
    }

    return nodes.some(item => Number(item.approverId || 0) === Number(userId));
  }

  private now() {
    return formatNow();
  }
}
