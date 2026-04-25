/**
 * 招聘面试领域服务。
 * 这里只负责主题8首批的面试分页、详情和标准 CRUD，不负责简历池、职位标准、录用管理或招聘驾驶舱。
 * 维护重点是部门经理范围按 departmentId 判定、completed/cancelled 终态不可编辑、删除仅 HR 可执行。
 */
import {
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceInterviewEntity } from '../entity/interview';
import { PerformanceResumePoolEntity } from '../entity/resumePool';
import { PerformanceRecruitPlanEntity } from '../entity/recruit-plan';
import { PerformanceTalentAssetEntity } from '../entity/talentAsset';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import {
  INTERVIEW_STATUS_VALUES,
  INTERVIEW_TYPE_VALUES,
} from './interview-dict';
import {
  PERFORMANCE_DOMAIN_ERROR_CODES,
  resolvePerformanceDomainErrorMessage,
} from '../domain/errors/catalog';
import {
  PerformanceAccessContextService,
  PerformanceCapabilityKey,
  PerformanceResolvedAccessContext,
} from './access-context';

const INTERVIEW_STATUS = [...INTERVIEW_STATUS_VALUES];
const INTERVIEW_TYPES = [...INTERVIEW_TYPE_VALUES];
const PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resourceNotFound
  );
const PERFORMANCE_RESUME_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.resumeNotFound
  );
const PERFORMANCE_RECRUIT_PLAN_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.recruitPlanNotFound
  );
const PERFORMANCE_TALENT_ASSET_NOT_FOUND_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.talentAssetNotFound
  );
const PERFORMANCE_SOURCE_TYPE_INVALID_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.sourceTypeInvalid
  );
const PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateEditNotAllowed
  );
const PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE =
  resolvePerformanceDomainErrorMessage(
    PERFORMANCE_DOMAIN_ERROR_CODES.stateDeleteNotAllowed
  );
const SOURCE_RESOURCES = [
  'jobStandard',
  'recruitPlan',
  'resumePool',
  'interview',
  'talentAsset',
];

function normalizeOptionalPositiveInt(value: any, message: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(message);
  }
  return parsed;
}

function normalizeJsonObject(value: any) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  return typeof value === 'object' ? value : null;
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceInterviewService extends BaseService {
  @InjectEntityModel(PerformanceInterviewEntity)
  performanceInterviewEntity: Repository<PerformanceInterviewEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(PerformanceResumePoolEntity)
  performanceResumePoolEntity: Repository<PerformanceResumePoolEntity>;

  @InjectEntityModel(PerformanceRecruitPlanEntity)
  performanceRecruitPlanEntity: Repository<PerformanceRecruitPlanEntity>;

  @InjectEntityModel(PerformanceTalentAssetEntity)
  performanceTalentAssetEntity: Repository<PerformanceTalentAssetEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  private readonly perms = {
    page: PERMISSIONS.performance.interview.page,
    info: PERMISSIONS.performance.interview.info,
    add: PERMISSIONS.performance.interview.add,
    update: PERMISSIONS.performance.interview.update,
    delete: PERMISSIONS.performance.interview.delete,
  };

  private readonly capabilityByPerm: Record<string, PerformanceCapabilityKey> = {
    [PERMISSIONS.performance.interview.page]: 'interview.read',
    [PERMISSIONS.performance.interview.info]: 'interview.read',
    [PERMISSIONS.performance.interview.add]: 'interview.create',
    [PERMISSIONS.performance.interview.update]: 'interview.update',
    [PERMISSIONS.performance.interview.delete]: 'interview.delete',
  };

  async page(query: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.page, '无权限查看面试列表');

    const page = Number(query.page || 1);
    const size = Number(query.size || 20);
    const departmentIds = await this.departmentScopeIds(access, 'interview.read');
    const qb = this.performanceInterviewEntity
      .createQueryBuilder('interview')
      .leftJoin(BaseSysUserEntity, 'interviewer', 'interviewer.id = interview.interviewerId')
      .select([
        'interview.id as id',
        'interview.candidateName as candidateName',
        'interview.position as position',
        'interview.departmentId as departmentId',
        'interview.interviewerId as interviewerId',
        'interviewer.name as interviewerName',
        'interview.interviewDate as interviewDate',
        'interview.interviewType as interviewType',
        'interview.score as score',
        'interview.resumePoolId as resumePoolId',
        'interview.recruitPlanId as recruitPlanId',
        'interview.sourceSnapshot as sourceSnapshot',
        'interview.resumePoolSnapshot as resumePoolSnapshot',
        'interview.recruitPlanSnapshot as recruitPlanSnapshot',
        'interview.status as status',
        'interview.createTime as createTime',
        'interview.updateTime as updateTime',
      ]);

    this.applyScope(qb, departmentIds);

    if (query.candidateName) {
      const candidateName = `%${String(query.candidateName).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where.where('interview.candidateName like :candidateName', {
            candidateName,
          });
        })
      );
    }

    if (query.position) {
      qb.andWhere('interview.position like :position', {
        position: `%${String(query.position).trim()}%`,
      });
    }

    if (query.status) {
      qb.andWhere('interview.status = :status', {
        status: String(query.status).trim(),
      });
    }

    if (query.startDate) {
      qb.andWhere('interview.interviewDate >= :startDate', {
        startDate: this.normalizeStartDate(query.startDate),
      });
    }

    if (query.endDate) {
      qb.andWhere('interview.interviewDate <= :endDate', {
        endDate: this.normalizeEndDate(query.endDate),
      });
    }

    qb.orderBy('interview.updateTime', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();

    return {
      list: list.map(item => this.normalizeInterview(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.info, '无权限查看面试详情');

    const interview = await this.requireInterview(id);
    await this.assertInterviewInScope(interview, access, 'interview.read');
    return this.buildInterviewDetail(interview);
  }

  async add(payload: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.add, '无权限新增面试');

    const normalized = await this.normalizePayload(
      payload,
      access,
      'add',
      'interview.create'
    );
    const saved = await this.performanceInterviewEntity.save(
      this.performanceInterviewEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateInterview(payload: any) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.update, '无权限修改面试');

    const interview = await this.requireInterview(Number(payload.id));
    await this.assertInterviewInScope(interview, access, 'interview.update');

    if (this.isTerminal(interview.status)) {
      throw new CoolCommException(PERFORMANCE_STATE_EDIT_NOT_ALLOWED_MESSAGE);
    }

    const normalized = await this.normalizePayload(
      {
        ...interview,
        ...payload,
        id: interview.id,
      },
      access,
      'update',
      'interview.update'
    );

    await this.performanceInterviewEntity.update(
      { id: interview.id },
      normalized as any
    );
    return this.info(interview.id);
  }

  async delete(ids: number[]) {
    const access = await this.currentPerms();
    this.assertPerm(access, this.perms.delete, '无权限删除面试');

    const validIds = (ids || [])
      .map(item => Number(item))
      .filter(item => Number.isInteger(item) && item > 0);

    if (!validIds.length) {
      return;
    }

    const interviews = await this.performanceInterviewEntity.findBy({
      id: In(validIds),
    });

    if (interviews.length !== validIds.length) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    for (const item of interviews) {
      await this.assertInterviewInScope(item, access, 'interview.delete');
      if (item.status !== 'scheduled') {
        throw new CoolCommException(PERFORMANCE_STATE_DELETE_NOT_ALLOWED_MESSAGE);
      }
    }

    await this.performanceInterviewEntity.delete(validIds);
  }

  private async currentPerms() {
    return this.performanceAccessContextService.resolveAccessContext(undefined, {
      allowEmptyRoleIds: false,
      missingAuthMessage: '登录状态已失效',
    });
  }

  private resolveCapabilityKey(perm: string): PerformanceCapabilityKey {
    const capabilityKey = this.capabilityByPerm[perm];
    if (!capabilityKey) {
      throw new CoolCommException(`未映射的面试权限: ${perm}`);
    }
    return capabilityKey;
  }

  private assertPerm(
    access: PerformanceResolvedAccessContext,
    perm: string,
    message: string
  ) {
    if (
      !this.performanceAccessContextService.hasCapability(
        access,
        this.resolveCapabilityKey(perm)
      )
    ) {
      throw new CoolCommException(message);
    }
  }

  private async departmentScopeIds(
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    if (
      this.performanceAccessContextService.hasCapabilityInScopes(
        access,
        capabilityKey,
        ['company']
      )
    ) {
      return null;
    }

    return Array.from(
      new Set(
        (Array.isArray(access.departmentIds) ? access.departmentIds : [])
          .map(item => Number(item))
          .filter(item => Number.isInteger(item) && item > 0)
      )
    );
  }

  private applyScope(qb: any, departmentIds: number[] | null) {
    if (departmentIds === null) {
      return;
    }

    if (!departmentIds.length) {
      qb.andWhere('1 = 0');
      return;
    }

    qb.andWhere('interview.departmentId in (:...departmentIds)', { departmentIds });
  }

  private async assertInterviewInScope(
    interview: PerformanceInterviewEntity,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const departmentId = this.normalizeNullableNumber(interview.departmentId);
    const scopes = this.performanceAccessContextService.capabilityScopes(
      access,
      capabilityKey
    );

    if (!departmentId) {
      if (scopes.includes('company')) {
        return;
      }
      throw new CoolCommException('无权访问该面试');
    }

    if (
      !this.performanceAccessContextService.matchesScope(access, scopes, {
        departmentId,
      })
    ) {
      throw new CoolCommException('无权访问该面试');
    }
  }

  private async assertCanManageDepartment(
    departmentId: number | null,
    access: PerformanceResolvedAccessContext,
    capabilityKey: PerformanceCapabilityKey
  ) {
    const scopes = this.performanceAccessContextService.capabilityScopes(
      access,
      capabilityKey
    );

    if (!departmentId) {
      if (scopes.includes('company')) {
        return;
      }
      throw new CoolCommException('部门经理必须选择归属部门');
    }

    if (
      !this.performanceAccessContextService.matchesScope(
        access,
        scopes,
        {
          departmentId,
        }
      )
    ) {
      throw new CoolCommException('无权操作该面试');
    }
  }

  private async normalizePayload(
    payload: any,
    access: PerformanceResolvedAccessContext,
    mode: 'add' | 'update',
    capabilityKey: PerformanceCapabilityKey
  ) {
    const candidateName = String(payload.candidateName || '').trim();
    const position = String(payload.position || '').trim();
    const interviewerId = Number(payload.interviewerId || 0);
    const interviewDate = String(payload.interviewDate || '').trim();
    const departmentId = this.normalizeNullableNumber(payload.departmentId);
    const resumePoolId = normalizeOptionalPositiveInt(
      payload.resumePoolId,
      'resumePoolId 不合法'
    );
    const resumeRecord = resumePoolId
      ? await this.performanceResumePoolEntity.findOneBy({ id: resumePoolId })
      : null;
    const explicitRecruitPlanId = normalizeOptionalPositiveInt(
      payload.recruitPlanId,
      'recruitPlanId 不合法'
    );
    const derivedRecruitPlanId =
      explicitRecruitPlanId ?? this.normalizeNullableNumber(resumeRecord?.recruitPlanId);
    const recruitPlanRecord = derivedRecruitPlanId
      ? await this.performanceRecruitPlanEntity.findOneBy({ id: derivedRecruitPlanId })
      : null;
    const interviewer = await this.baseSysUserEntity.findOneBy({ id: interviewerId });

    if (!candidateName) {
      throw new CoolCommException('候选人姓名不能为空');
    }

    if (!position) {
      throw new CoolCommException('职位不能为空');
    }

    if (!interviewerId) {
      throw new CoolCommException('面试官不能为空');
    }

    if (!interviewer) {
      throw new CoolCommException('面试官不存在');
    }

    if (!interviewDate) {
      throw new CoolCommException('面试时间不能为空');
    }

    if (resumePoolId && !resumeRecord) {
      throw new CoolCommException(PERFORMANCE_RESUME_NOT_FOUND_MESSAGE);
    }

    if (derivedRecruitPlanId && !recruitPlanRecord) {
      throw new CoolCommException(PERFORMANCE_RECRUIT_PLAN_NOT_FOUND_MESSAGE);
    }

    if (
      resumeRecord?.recruitPlanId &&
      explicitRecruitPlanId &&
      Number(resumeRecord.recruitPlanId) !== Number(explicitRecruitPlanId)
    ) {
      throw new CoolCommException('面试引用的简历与招聘计划不一致');
    }

    if (
      resumeRecord &&
      departmentId &&
      Number(resumeRecord.targetDepartmentId || 0) !== Number(departmentId)
    ) {
      throw new CoolCommException('面试归属部门与简历目标部门不一致');
    }

    if (
      recruitPlanRecord &&
      departmentId &&
      Number(recruitPlanRecord.targetDepartmentId || 0) !== Number(departmentId)
    ) {
      throw new CoolCommException('面试归属部门与招聘计划目标部门不一致');
    }

    const interviewType = this.normalizeInterviewType(payload.interviewType);
    const status = this.normalizeStatus(
      mode === 'add' ? payload.status || 'scheduled' : payload.status
    );
    const score = this.normalizeScore(payload.score);
    const sourceSnapshot = await this.normalizeSourceSnapshotInput(
      payload.sourceSnapshot,
      departmentId,
      resumeRecord,
      recruitPlanRecord
    );
    const resumePoolSnapshot = await this.buildResumePoolSnapshot(resumeRecord);
    const recruitPlanSnapshot = await this.buildRecruitPlanSnapshot(recruitPlanRecord);

    await this.assertCanManageDepartment(departmentId, access, capabilityKey);

    return {
      candidateName,
      position,
      departmentId,
      interviewerId,
      interviewDate,
      interviewType,
      score,
      resumePoolId,
      recruitPlanId: derivedRecruitPlanId,
      sourceSnapshot,
      resumePoolSnapshot,
      recruitPlanSnapshot,
      status,
    };
  }

  private async requireInterview(id: number) {
    const interview = await this.performanceInterviewEntity.findOneBy({ id });

    if (!interview) {
      throw new CoolCommException(PERFORMANCE_RESOURCE_NOT_FOUND_MESSAGE);
    }

    return interview;
  }

  private async buildInterviewDetail(interview: PerformanceInterviewEntity) {
    const interviewer = await this.baseSysUserEntity.findOneBy({
      id: interview.interviewerId,
    });

    return this.normalizeInterview({
      ...interview,
      interviewerName: interviewer?.name || '',
    });
  }

  private normalizeInterview(item: any) {
    const sourceSnapshot = this.normalizeSourceSnapshot(item.sourceSnapshot);
    const resumePoolSnapshot = this.normalizeResumePoolSnapshot(item.resumePoolSnapshot);
    const recruitPlanSnapshot = this.normalizeRecruitPlanSnapshot(
      item.recruitPlanSnapshot
    );

    return {
      id: Number(item.id),
      candidateName: item.candidateName || '',
      position: item.position || '',
      departmentId: this.normalizeNullableNumber(item.departmentId),
      interviewerId: Number(item.interviewerId),
      interviewerName: item.interviewerName || '',
      interviewDate: item.interviewDate || '',
      interviewType: item.interviewType || null,
      score: this.normalizeScore(item.score),
      resumePoolId: this.normalizeNullableNumber(item.resumePoolId),
      recruitPlanId: this.normalizeNullableNumber(item.recruitPlanId),
      sourceSnapshot,
      resumePoolSummary: resumePoolSnapshot,
      resumePoolSnapshot,
      recruitPlanSummary: recruitPlanSnapshot,
      recruitPlanSnapshot,
      status: item.status,
      createTime: item.createTime,
      updateTime: item.updateTime,
    };
  }

  private normalizeNullableNumber(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  private normalizeResumePoolSnapshot(value: any) {
    const snapshot = normalizeJsonObject(value);
    if (!snapshot) {
      return null;
    }

    return {
      id: this.normalizeNullableNumber(snapshot.id),
      candidateName: snapshot.candidateName || '',
      targetDepartmentId: this.normalizeNullableNumber(snapshot.targetDepartmentId),
      targetDepartmentName: snapshot.targetDepartmentName || null,
      targetPosition: snapshot.targetPosition || null,
      status: snapshot.status || null,
      recruitPlanId: this.normalizeNullableNumber(snapshot.recruitPlanId),
      jobStandardId: this.normalizeNullableNumber(snapshot.jobStandardId),
    };
  }

  private normalizeRecruitPlanSnapshot(value: any) {
    const snapshot = normalizeJsonObject(value);
    if (!snapshot) {
      return null;
    }

    return {
      id: this.normalizeNullableNumber(snapshot.id),
      title: snapshot.title || '',
      positionName: snapshot.positionName || null,
      targetDepartmentId: this.normalizeNullableNumber(snapshot.targetDepartmentId),
      targetDepartmentName: snapshot.targetDepartmentName || null,
      headcount: this.normalizeNullableNumber(snapshot.headcount),
      startDate: snapshot.startDate || null,
      endDate: snapshot.endDate || null,
      status: snapshot.status || null,
      jobStandardId: this.normalizeNullableNumber(snapshot.jobStandardId),
    };
  }

  private normalizeSourceSnapshot(value: any) {
    const snapshot = normalizeJsonObject(value);
    if (!snapshot) {
      return null;
    }

    const sourceResource = String(snapshot.sourceResource || '').trim();
    if (sourceResource && !SOURCE_RESOURCES.includes(sourceResource)) {
      throw new CoolCommException(PERFORMANCE_SOURCE_TYPE_INVALID_MESSAGE);
    }

    return {
      sourceResource: sourceResource || null,
      talentAssetId: this.normalizeNullableNumber(snapshot.talentAssetId),
      jobStandardId: this.normalizeNullableNumber(snapshot.jobStandardId),
      jobStandardPositionName: snapshot.jobStandardPositionName || null,
      jobStandardRequirementSummary: snapshot.jobStandardRequirementSummary || null,
      recruitPlanId: this.normalizeNullableNumber(snapshot.recruitPlanId),
      recruitPlanTitle: snapshot.recruitPlanTitle || null,
      recruitPlanStatus: snapshot.recruitPlanStatus || null,
      resumePoolId: this.normalizeNullableNumber(snapshot.resumePoolId),
      interviewId: this.normalizeNullableNumber(snapshot.interviewId),
      candidateName: snapshot.candidateName || null,
      targetDepartmentId: this.normalizeNullableNumber(snapshot.targetDepartmentId),
      targetDepartmentName: snapshot.targetDepartmentName || null,
      targetPosition: snapshot.targetPosition || null,
      interviewStatus: snapshot.interviewStatus || null,
      sourceStatusSnapshot: snapshot.sourceStatusSnapshot || null,
    };
  }

  private async normalizeSourceSnapshotInput(
    payloadSourceSnapshot: any,
    departmentId: number | null,
    resumeRecord: PerformanceResumePoolEntity | null,
    recruitPlanRecord: PerformanceRecruitPlanEntity | null
  ) {
    const sourceSnapshot = this.normalizeSourceSnapshot(payloadSourceSnapshot);

    if (sourceSnapshot?.sourceResource === 'talentAsset' || sourceSnapshot?.talentAssetId) {
      const talentAssetId = this.normalizeNullableNumber(sourceSnapshot.talentAssetId);
      if (!talentAssetId) {
        throw new CoolCommException('talentAssetId 不合法');
      }

      const talentAsset = await this.performanceTalentAssetEntity.findOneBy({
        id: talentAssetId,
      });
      if (!talentAsset) {
        throw new CoolCommException(PERFORMANCE_TALENT_ASSET_NOT_FOUND_MESSAGE);
      }

      if (
        departmentId &&
        Number(departmentId) !== Number(talentAsset.targetDepartmentId)
      ) {
        throw new CoolCommException('面试来源人才资产与目标部门不一致');
      }

      return this.buildTalentAssetSourceSnapshot(talentAsset);
    }

    if (resumeRecord) {
      return this.buildResumeSourceSnapshot(resumeRecord, recruitPlanRecord);
    }

    return sourceSnapshot;
  }

  private buildResumeSourceSnapshot(
    resumeRecord: PerformanceResumePoolEntity,
    recruitPlanRecord: PerformanceRecruitPlanEntity | null
  ) {
    return {
      sourceResource: 'resumePool',
      resumePoolId: Number(resumeRecord.id),
      recruitPlanId: this.normalizeNullableNumber(recruitPlanRecord?.id ?? resumeRecord.recruitPlanId),
      recruitPlanTitle: recruitPlanRecord?.title || null,
      candidateName: resumeRecord.candidateName || null,
      targetDepartmentId: this.normalizeNullableNumber(resumeRecord.targetDepartmentId),
      targetPosition: resumeRecord.targetPosition || null,
    };
  }

  private buildTalentAssetSourceSnapshot(talentAsset: PerformanceTalentAssetEntity) {
    return {
      sourceResource: 'talentAsset',
      talentAssetId: Number(talentAsset.id),
      candidateName: talentAsset.candidateName || null,
      targetDepartmentId: this.normalizeNullableNumber(talentAsset.targetDepartmentId),
      targetPosition: talentAsset.targetPosition || null,
    };
  }

  private async buildResumePoolSnapshot(resume: PerformanceResumePoolEntity | null) {
    if (!resume) {
      return null;
    }

    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: Number(resume.targetDepartmentId),
    });

    return {
      id: Number(resume.id),
      candidateName: resume.candidateName || '',
      targetDepartmentId: Number(resume.targetDepartmentId || 0),
      targetDepartmentName: department?.name || null,
      targetPosition: resume.targetPosition || null,
      status: resume.status || 'new',
      recruitPlanId: this.normalizeNullableNumber(resume.recruitPlanId),
      jobStandardId: this.normalizeNullableNumber(resume.jobStandardId),
    };
  }

  private async buildRecruitPlanSnapshot(recruitPlan: PerformanceRecruitPlanEntity | null) {
    if (!recruitPlan) {
      return null;
    }

    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: Number(recruitPlan.targetDepartmentId),
    });

    return {
      id: Number(recruitPlan.id),
      title: recruitPlan.title || '',
      positionName: recruitPlan.positionName || null,
      targetDepartmentId: Number(recruitPlan.targetDepartmentId || 0),
      targetDepartmentName: department?.name || null,
      headcount: this.normalizeNullableNumber(recruitPlan.headcount),
      startDate: recruitPlan.startDate || null,
      endDate: recruitPlan.endDate || null,
      status: recruitPlan.status || null,
      jobStandardId: this.normalizeNullableNumber(recruitPlan.jobStandardId),
    };
  }

  private normalizeScore(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = Number(value);

    if (!Number.isFinite(normalized)) {
      throw new CoolCommException('面试分数不合法');
    }

    return normalized;
  }

  private normalizeInterviewType(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const interviewType = String(value).trim();

    if (!INTERVIEW_TYPES.some(item => item === interviewType)) {
      throw new CoolCommException('面试类型不合法');
    }

    return interviewType;
  }

  private normalizeStatus(value: any) {
    const status = String(value || 'scheduled').trim();

    if (!INTERVIEW_STATUS.some(item => item === status)) {
      throw new CoolCommException('面试状态不合法');
    }

    return status;
  }

  private normalizeStartDate(value: any) {
    const date = String(value || '').trim();
    if (date.length === 10) {
      return `${date} 00:00:00`;
    }
    return date;
  }

  private normalizeEndDate(value: any) {
    const date = String(value || '').trim();
    if (date.length === 10) {
      return `${date} 23:59:59`;
    }
    return date;
  }

  private isTerminal(status: string) {
    return status === 'completed' || status === 'cancelled';
  }
}
