/**
 * 招聘简历池领域服务。
 * 这里只负责主题15冻结的简历池主链接口，不负责前端联调脚本、招聘计划/职位标准/录用管理或附件二进制下发。
 * 维护重点是部门树权限、HR 下载类动作限制、状态机约束和主题8/12转换边界必须由服务端硬兜底。
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
import { Brackets, In, Repository } from 'typeorm';
import { BaseSysMenuService } from '../../base/service/sys/menu';
import { BaseSysPermsService } from '../../base/service/sys/perms';
import { BaseSysDepartmentEntity } from '../../base/entity/sys/department';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { PerformanceResumePoolEntity } from '../entity/resumePool';
import { PerformanceInterviewEntity } from '../entity/interview';
import { PerformanceRecruitPlanEntity } from '../entity/recruit-plan';
import { PerformanceJobStandardEntity } from '../entity/job-standard';
import { PerformanceTalentAssetEntity } from '../entity/talentAsset';
import { SpaceInfoEntity } from '../../space/entity/info';
import * as jwt from 'jsonwebtoken';

type ResumeStatus = 'new' | 'screening' | 'interviewing' | 'archived';
type ResumeSourceType = 'manual' | 'attachment' | 'external' | 'referral';

const RESUME_STATUS: ResumeStatus[] = [
  'new',
  'screening',
  'interviewing',
  'archived',
];
const RESUME_SOURCE_TYPES: ResumeSourceType[] = [
  'manual',
  'attachment',
  'external',
  'referral',
];
const EXPORT_LIMIT = 5000;

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../base/config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

function normalizePageNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeRequiredText(value: any, maxLength: number, message: string) {
  const text = String(value || '').trim();
  if (!text || text.length > maxLength) {
    throw new CoolCommException(message);
  }
  return text;
}

function normalizeOptionalText(value: any, maxLength: number) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeRequiredPositiveInt(value: any, message: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoolCommException(message);
  }
  return parsed;
}

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

function normalizePositiveIdList(value: any) {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value
          .split(',')
          .map(item => item.trim())
          .filter(item => !!item)
      : [];

  return Array.from(
    new Set(
      list
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    )
  );
}

function formatDateTime(input: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    input.getFullYear(),
    '-',
    pad(input.getMonth() + 1),
    '-',
    pad(input.getDate()),
    ' ',
    pad(input.getHours()),
    ':',
    pad(input.getMinutes()),
    ':',
    pad(input.getSeconds()),
  ].join('');
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class PerformanceResumePoolService extends BaseService {
  @InjectEntityModel(PerformanceResumePoolEntity)
  performanceResumePoolEntity: Repository<PerformanceResumePoolEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(SpaceInfoEntity)
  spaceInfoEntity: Repository<SpaceInfoEntity>;

  @InjectEntityModel(PerformanceInterviewEntity)
  performanceInterviewEntity: Repository<PerformanceInterviewEntity>;

  @InjectEntityModel(PerformanceRecruitPlanEntity)
  performanceRecruitPlanEntity: Repository<PerformanceRecruitPlanEntity>;

  @InjectEntityModel(PerformanceJobStandardEntity)
  performanceJobStandardEntity: Repository<PerformanceJobStandardEntity>;

  @InjectEntityModel(PerformanceTalentAssetEntity)
  performanceTalentAssetEntity: Repository<PerformanceTalentAssetEntity>;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private readonly perms = {
    page: 'performance:resumePool:page',
    info: 'performance:resumePool:info',
    add: 'performance:resumePool:add',
    update: 'performance:resumePool:update',
    import: 'performance:resumePool:import',
    export: 'performance:resumePool:export',
    uploadAttachment: 'performance:resumePool:uploadAttachment',
    downloadAttachment: 'performance:resumePool:downloadAttachment',
    convertToTalentAsset: 'performance:resumePool:convertToTalentAsset',
    createInterview: 'performance:resumePool:createInterview',
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

  async page(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.page, '无权限查看简历列表');

    const page = normalizePageNumber(query.page, 1);
    const size = normalizePageNumber(query.size, 20);
    const departmentIds = await this.departmentScopeIds(perms);
    const qb = this.performanceResumePoolEntity
      .createQueryBuilder('resume')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = resume.targetDepartmentId'
      )
      .select([
        'resume.id as id',
        'resume.candidateName as candidateName',
        'resume.targetDepartmentId as targetDepartmentId',
        'department.name as targetDepartmentName',
        'resume.targetPosition as targetPosition',
        'resume.phone as phone',
        'resume.email as email',
        'resume.attachmentIdList as attachmentIdList',
        'resume.sourceType as sourceType',
        'resume.status as status',
        'resume.linkedTalentAssetId as linkedTalentAssetId',
        'resume.latestInterviewId as latestInterviewId',
        'resume.recruitPlanId as recruitPlanId',
        'resume.jobStandardId as jobStandardId',
        'resume.recruitPlanSnapshot as recruitPlanSnapshot',
        'resume.jobStandardSnapshot as jobStandardSnapshot',
        'resume.createTime as createTime',
        'resume.updateTime as updateTime',
      ]);

    this.applyScope(qb, departmentIds);
    this.applyQueryFilters(qb, query);
    qb.orderBy('resume.updateTime', 'DESC');

    const total = await qb.getCount();
    const rows = await qb
      .offset((page - 1) * size)
      .limit(size)
      .getRawMany();
    const attachmentSummaryMap = await this.fetchAttachmentSummaryMapForRows(rows);
    const list = rows.map(item =>
      this.normalizeResumePageRow(
        item,
        attachmentSummaryMap.get(Number(item.id)) || []
      )
    );

    return {
      list,
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async info(id: number) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.info, '无权限查看简历详情');

    const resume = await this.requireResume(id);
    await this.assertResumeInScope(resume, perms, '无权查看该简历');

    return this.buildResumeDetail(resume);
  }

  async add(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.add, '无权限新增简历');

    const normalized = await this.normalizePayload(payload, null, perms, 'add');
    const saved = await this.performanceResumePoolEntity.save(
      this.performanceResumePoolEntity.create(normalized)
    );

    return this.info(saved.id);
  }

  async updateResume(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.update, '无权限修改简历');

    const resume = await this.requireResume(Number(payload.id));
    await this.assertResumeInScope(resume, perms, '无权修改该简历');

    if (resume.status === 'archived') {
      throw new CoolCommException('当前状态不允许编辑');
    }

    const normalized = await this.normalizePayload(payload, resume, perms, 'update');
    await this.performanceResumePoolEntity.update(
      { id: resume.id },
      normalized as any
    );

    return this.info(resume.id);
  }

  async importResume(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.import, '无权限导入简历');

    const fileId = normalizeRequiredPositiveInt(payload.fileId, '导入文件不能为空');
    const fileInfo = await this.spaceInfoEntity.findOneBy({ id: fileId });

    if (!fileInfo) {
      throw new CoolCommException('导入文件不存在');
    }

    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const overwriteRows = Array.isArray(payload.overwriteRows)
      ? payload.overwriteRows
      : [];
    let importedCount = 0;
    let overwrittenCount = 0;

    for (const row of overwriteRows) {
      const resume = await this.requireResume(Number(row.id));
      await this.assertResumeInScope(resume, perms, '无权导入覆盖该简历');

      if (resume.status === 'archived') {
        throw new CoolCommException('当前状态不允许导入覆盖');
      }

      const normalized = await this.normalizePayload(row, resume, perms, 'update');
      await this.performanceResumePoolEntity.update(
        { id: resume.id },
        normalized as any
      );
      overwrittenCount += 1;
    }

    for (const row of rows) {
      const normalized = await this.normalizePayload(
        {
          ...row,
          sourceType: row?.sourceType || 'attachment',
        },
        null,
        perms,
        'add'
      );

      await this.performanceResumePoolEntity.save(
        this.performanceResumePoolEntity.create(normalized)
      );
      importedCount += 1;
    }

    return {
      fileId,
      importedCount,
      overwrittenCount,
      skippedCount: 0,
    };
  }

  async exportResume(query: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.export, '无权限导出简历');

    const departmentIds = await this.departmentScopeIds(perms);
    const qb = this.performanceResumePoolEntity
      .createQueryBuilder('resume')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = resume.targetDepartmentId'
      )
      .select([
        'resume.id as id',
        'resume.candidateName as candidateName',
        'resume.targetDepartmentId as targetDepartmentId',
        'department.name as targetDepartmentName',
        'resume.targetPosition as targetPosition',
        'resume.phone as phone',
        'resume.email as email',
        'resume.resumeText as resumeText',
        'resume.sourceType as sourceType',
        'resume.sourceRemark as sourceRemark',
        'resume.externalLink as externalLink',
        'resume.status as status',
        'resume.linkedTalentAssetId as linkedTalentAssetId',
        'resume.latestInterviewId as latestInterviewId',
        'resume.createTime as createTime',
        'resume.updateTime as updateTime',
      ]);

    this.applyScope(qb, departmentIds);
    this.applyQueryFilters(qb, query);
    qb.orderBy('resume.updateTime', 'DESC').limit(EXPORT_LIMIT);

    const list = await qb.getRawMany();
    return list.map(item => ({
      id: Number(item.id),
      candidateName: item.candidateName || '',
      targetDepartmentId: Number(item.targetDepartmentId || 0),
      targetDepartmentName: item.targetDepartmentName || '',
      targetPosition: item.targetPosition || null,
      phone: item.phone || '',
      email: item.email || null,
      resumeText: item.resumeText || '',
      sourceType: item.sourceType || 'manual',
      sourceRemark: item.sourceRemark || null,
      externalLink: item.externalLink || null,
      status: item.status || 'new',
      linkedTalentAssetId: this.normalizeNullableNumber(item.linkedTalentAssetId),
      latestInterviewId: this.normalizeNullableNumber(item.latestInterviewId),
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    }));
  }

  async uploadAttachment(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.uploadAttachment, '无权限上传附件');

    const id = normalizeRequiredPositiveInt(payload.id, '简历 ID 不能为空');
    const fileId = normalizeRequiredPositiveInt(payload.fileId, '附件文件 ID 不能为空');
    const resume = await this.requireResume(id);
    await this.assertResumeInScope(resume, perms, '无权上传该简历附件');

    if (resume.status === 'archived') {
      throw new CoolCommException('当前状态不允许上传附件');
    }

    const attachment = await this.spaceInfoEntity.findOneBy({ id: fileId });
    if (!attachment) {
      throw new CoolCommException('附件文件不存在');
    }

    const attachmentIdList = this.normalizeAttachmentIdList(resume.attachmentIdList);
    if (!attachmentIdList.includes(fileId)) {
      attachmentIdList.push(fileId);
    }

    await this.performanceResumePoolEntity.update(
      { id: resume.id },
      { attachmentIdList }
    );

    return this.info(resume.id);
  }

  async downloadAttachment(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.downloadAttachment,
      '无权限下载简历附件'
    );

    const id = normalizeRequiredPositiveInt(payload.id, '简历 ID 不能为空');
    const attachmentId = normalizeRequiredPositiveInt(
      payload.attachmentId,
      '附件 ID 不能为空'
    );
    const resume = await this.requireResume(id);
    await this.assertResumeInScope(resume, perms, '无权下载该简历附件');

    const attachmentIdList = this.normalizeAttachmentIdList(resume.attachmentIdList);
    if (!attachmentIdList.includes(attachmentId)) {
      throw new CoolCommException('附件不存在');
    }

    const attachment = await this.spaceInfoEntity.findOneBy({ id: attachmentId });
    if (!attachment) {
      throw new CoolCommException('附件不存在');
    }

    return {
      id: Number(attachment.id),
      name: attachment.name || '',
      size: Number(attachment.size || 0),
      uploadTime: attachment.createTime || '',
      url: attachment.url || '',
      downloadUrl: attachment.url || '',
      fileId: attachment.fileId || '',
    };
  }

  async convertToTalentAsset(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(
      perms,
      this.perms.convertToTalentAsset,
      '无权限执行转人才资产'
    );

    const id = normalizeRequiredPositiveInt(payload.id, '简历 ID 不能为空');
    const resume = await this.requireResume(id);
    await this.assertResumeInScope(resume, perms, '无权转换该简历');

    if (resume.status === 'archived') {
      throw new CoolCommException('当前状态不允许转人才资产');
    }

    const linkedTalentAssetId = this.normalizeNullableNumber(resume.linkedTalentAssetId);
    if (linkedTalentAssetId) {
      const exists = await this.performanceTalentAssetEntity.findOneBy({
        id: linkedTalentAssetId,
      });
      if (exists) {
        return {
          talentAssetId: linkedTalentAssetId,
          created: false,
        };
      }
    }

    const talentAsset = await this.performanceTalentAssetEntity.save(
      this.performanceTalentAssetEntity.create({
        candidateName: resume.candidateName,
        targetDepartmentId: resume.targetDepartmentId,
        targetPosition: resume.targetPosition || null,
        source: this.buildTalentAssetSource(resume),
        tagList: [],
        followUpSummary: null,
        nextFollowUpDate: null,
        status: 'new',
      })
    );

    await this.performanceResumePoolEntity.update(
      { id: resume.id },
      { linkedTalentAssetId: talentAsset.id }
    );

    return {
      talentAssetId: Number(talentAsset.id),
      created: true,
    };
  }

  async createInterview(payload: any) {
    const perms = await this.currentPerms();
    this.assertPerm(perms, this.perms.createInterview, '无权限发起面试');

    const id = normalizeRequiredPositiveInt(payload.id, '简历 ID 不能为空');
    const resume = await this.requireResume(id);
    await this.assertResumeInScope(resume, perms, '无权发起该简历面试');

    if (resume.status === 'archived') {
      throw new CoolCommException('当前状态不允许发起面试');
    }

    if (resume.status === 'interviewing') {
      throw new CoolCommException('当前状态不允许再次发起面试');
    }

    if (!['new', 'screening'].includes(resume.status)) {
      throw new CoolCommException('当前状态不允许发起面试');
    }

    const operatorId = Number(this.currentAdmin?.userId || 0);
    if (!Number.isInteger(operatorId) || operatorId <= 0) {
      throw new CoolCommException('登录上下文缺失');
    }

    const operator = await this.baseSysUserEntity.findOneBy({ id: operatorId });
    if (!operator) {
      throw new CoolCommException('当前登录用户不存在');
    }

    const position = String(resume.targetPosition || '').trim();
    if (!position) {
      throw new CoolCommException('目标岗位不能为空，无法发起面试');
    }

    const resumePoolSnapshot = await this.buildResumeReferenceSnapshot(resume);
    const recruitPlanSnapshot = await this.resolveRecruitPlanSnapshot(
      resume.recruitPlanId,
      resume.recruitPlanSnapshot
    );
    const jobStandardSnapshot = await this.resolveJobStandardSnapshot(
      resume.jobStandardId,
      resume.jobStandardSnapshot
    );

    const interview = await this.performanceInterviewEntity.save(
      this.performanceInterviewEntity.create({
        candidateName: resume.candidateName,
        position,
        departmentId: Number(resume.targetDepartmentId),
        interviewerId: operatorId,
        interviewDate: formatDateTime(new Date()),
        interviewType: null,
        score: null,
        resumePoolId: Number(resume.id),
        recruitPlanId: this.normalizeNullableNumber(resume.recruitPlanId),
        resumePoolSnapshot,
        recruitPlanSnapshot,
        status: 'scheduled',
      })
    );

    await this.performanceResumePoolEntity.update(
      { id: resume.id },
      {
        status: 'interviewing',
        latestInterviewId: Number(interview.id),
      }
    );

    return {
      interviewId: Number(interview.id),
      status: 'interviewing',
      resumePoolId: Number(resume.id),
      recruitPlanId: this.normalizeNullableNumber(resume.recruitPlanId),
      jobStandardId: this.normalizeNullableNumber(resume.jobStandardId),
      snapshot: resumePoolSnapshot,
      resumePoolSummary: resumePoolSnapshot,
      resumePoolSnapshot,
      recruitPlanSummary: recruitPlanSnapshot,
      recruitPlanSnapshot,
      jobStandardSummary: jobStandardSnapshot,
      jobStandardSnapshot,
    };
  }

  private async normalizePayload(
    payload: any,
    existing: PerformanceResumePoolEntity | null,
    perms: string[],
    mode: 'add' | 'update'
  ) {
    const candidateName = normalizeRequiredText(
      payload.candidateName ?? existing?.candidateName,
      100,
      '候选人姓名不能为空'
    );
    const targetDepartmentId = normalizeRequiredPositiveInt(
      payload.targetDepartmentId ?? existing?.targetDepartmentId,
      '目标部门不能为空'
    );
    const targetPosition = normalizeOptionalText(
      payload.targetPosition ?? existing?.targetPosition,
      100
    );
    const phone = normalizeRequiredText(
      payload.phone ?? existing?.phone,
      30,
      '手机号不能为空'
    );
    const email = normalizeOptionalText(payload.email ?? existing?.email, 100);
    const resumeText = normalizeRequiredText(
      payload.resumeText ?? existing?.resumeText,
      30000,
      '简历全文不能为空'
    );
    const sourceType = this.normalizeSourceType(
      payload.sourceType ?? existing?.sourceType
    );
    const sourceRemark = normalizeOptionalText(
      payload.sourceRemark ?? existing?.sourceRemark,
      2000
    );
    const externalLink = normalizeOptionalText(
      payload.externalLink ?? existing?.externalLink,
      500
    );
    const attachmentIdList =
      payload.attachmentIdList !== undefined
        ? normalizePositiveIdList(payload.attachmentIdList)
        : this.normalizeAttachmentIdList(existing?.attachmentIdList);
    const linkedTalentAssetId = this.normalizeNullableNumber(
      existing?.linkedTalentAssetId
    );
    const latestInterviewId = this.normalizeNullableNumber(existing?.latestInterviewId);
    const recruitPlanId = normalizeOptionalPositiveInt(
      payload.recruitPlanId ?? existing?.recruitPlanId,
      '招聘计划不合法'
    );
    const recruitPlanSnapshot = await this.buildRecruitPlanSnapshot(
      recruitPlanId,
      targetDepartmentId,
      perms
    );
    const planJobStandardId = this.normalizeNullableNumber(
      recruitPlanSnapshot?.jobStandardId
    );
    const jobStandardId = normalizeOptionalPositiveInt(
      payload.jobStandardId ?? existing?.jobStandardId ?? planJobStandardId,
      '职位标准不合法'
    );
    const jobStandardSnapshot = await this.buildJobStandardSnapshot(
      jobStandardId,
      targetDepartmentId,
      perms
    );
    const status = this.resolveNextStatus(
      mode,
      (existing?.status as ResumeStatus) || 'new',
      payload.status
    );

    if (sourceType !== 'external' && externalLink) {
      throw new CoolCommException('仅 external 来源允许填写外部简历链接');
    }

    await this.assertCanManageDepartment(targetDepartmentId, perms);

    return {
      candidateName,
      targetDepartmentId,
      targetPosition,
      phone,
      email,
      resumeText,
      sourceType,
      sourceRemark,
      externalLink,
      attachmentIdList,
      status,
      linkedTalentAssetId,
      latestInterviewId,
      recruitPlanId,
      jobStandardId,
      recruitPlanSnapshot,
      jobStandardSnapshot,
    };
  }

  private resolveNextStatus(
    mode: 'add' | 'update',
    currentStatus: ResumeStatus,
    statusInput: any
  ) {
    const hasStatusInput =
      statusInput !== undefined && statusInput !== null && `${statusInput}`.trim() !== '';
    const nextStatus = this.normalizeStatus(
      hasStatusInput ? statusInput : currentStatus || 'new'
    );

    if (mode === 'add') {
      if (nextStatus !== 'new') {
        throw new CoolCommException('新增简历状态只能为 new');
      }
      return nextStatus;
    }

    if (currentStatus === 'archived') {
      throw new CoolCommException('当前状态不允许编辑');
    }

    if (
      (currentStatus === 'new' || currentStatus === 'screening') &&
      nextStatus === 'interviewing'
    ) {
      throw new CoolCommException('请通过发起面试动作进入 interviewing');
    }

    if (currentStatus === 'new' && ['new', 'screening', 'archived'].includes(nextStatus)) {
      return nextStatus;
    }

    if (currentStatus === 'screening' && ['screening', 'archived'].includes(nextStatus)) {
      return nextStatus;
    }

    if (
      currentStatus === 'interviewing' &&
      ['interviewing', 'archived'].includes(nextStatus)
    ) {
      return nextStatus;
    }

    throw new CoolCommException('当前状态不允许执行该操作');
  }

  private normalizeStatus(value: any) {
    const status = String(value || 'new').trim() as ResumeStatus;
    if (!RESUME_STATUS.includes(status)) {
      throw new CoolCommException('简历状态不合法');
    }
    return status;
  }

  private normalizeSourceType(value: any) {
    const sourceType = String(value || '').trim() as ResumeSourceType;
    if (!RESUME_SOURCE_TYPES.includes(sourceType)) {
      throw new CoolCommException('简历来源类型不合法');
    }
    return sourceType;
  }

  private normalizeAttachmentIdList(value: any) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return normalizePositiveIdList(value);
    }

    if (typeof value === 'string') {
      try {
        return normalizePositiveIdList(JSON.parse(value));
      } catch (error) {
        return normalizePositiveIdList(value);
      }
    }

    return [];
  }

  private applyQueryFilters(qb: any, query: any) {
    if (query.keyword) {
      const keyword = `%${String(query.keyword).trim()}%`;
      qb.andWhere(
        new Brackets(where => {
          where
            .where('resume.candidateName like :keyword', { keyword })
            .orWhere('resume.phone like :keyword', { keyword })
            .orWhere('resume.email like :keyword', { keyword })
            .orWhere('resume.targetPosition like :keyword', { keyword });
        })
      );
    }

    if (query.targetDepartmentId !== undefined && query.targetDepartmentId !== null) {
      const targetDepartmentId = normalizeRequiredPositiveInt(
        query.targetDepartmentId,
        '目标部门不合法'
      );
      qb.andWhere('resume.targetDepartmentId = :targetDepartmentId', {
        targetDepartmentId,
      });
    }

    if (query.status) {
      qb.andWhere('resume.status = :status', {
        status: this.normalizeStatus(query.status),
      });
    }

    if (query.sourceType) {
      qb.andWhere('resume.sourceType = :sourceType', {
        sourceType: this.normalizeSourceType(query.sourceType),
      });
    }
  }

  private async buildResumeDetail(resume: PerformanceResumePoolEntity) {
    const [department, attachmentSummaryList] = await Promise.all([
      this.baseSysDepartmentEntity.findOneBy({ id: Number(resume.targetDepartmentId) }),
      this.fetchAttachmentSummaryList(resume.attachmentIdList),
    ]);

    return {
      id: Number(resume.id),
      candidateName: resume.candidateName || '',
      targetDepartmentId: Number(resume.targetDepartmentId || 0),
      targetDepartmentName: department?.name || '',
      targetPosition: resume.targetPosition || null,
      phone: resume.phone || '',
      email: resume.email || null,
      resumeText: resume.resumeText || '',
      sourceType: resume.sourceType || 'manual',
      sourceRemark: resume.sourceRemark || null,
      externalLink: resume.externalLink || null,
      attachmentSummaryList,
      status: resume.status || 'new',
      linkedTalentAssetId: this.normalizeNullableNumber(resume.linkedTalentAssetId),
      latestInterviewId: this.normalizeNullableNumber(resume.latestInterviewId),
      recruitPlanId: this.normalizeNullableNumber(resume.recruitPlanId),
      jobStandardId: this.normalizeNullableNumber(resume.jobStandardId),
      recruitPlanSummary: this.normalizeRecruitPlanSnapshot(
        resume.recruitPlanSnapshot
      ),
      recruitPlanSnapshot: this.normalizeRecruitPlanSnapshot(
        resume.recruitPlanSnapshot
      ),
      jobStandardSummary: this.normalizeJobStandardSnapshot(
        resume.jobStandardSnapshot
      ),
      jobStandardSnapshot: this.normalizeJobStandardSnapshot(
        resume.jobStandardSnapshot
      ),
      createTime: resume.createTime || '',
      updateTime: resume.updateTime || '',
    };
  }

  private async fetchAttachmentSummaryList(attachmentIdList: any) {
    const ids = this.normalizeAttachmentIdList(attachmentIdList);

    if (!ids.length) {
      return [];
    }

    const rows = await this.spaceInfoEntity.findBy({ id: In(ids) } as any);
    const rowMap = new Map<number, SpaceInfoEntity>();

    rows.forEach(item => {
      rowMap.set(Number(item.id), item);
    });

    return ids
      .map(id => rowMap.get(id))
      .filter(item => !!item)
      .map(item => ({
        id: Number(item.id),
        name: item.name || '',
        size: Number(item.size || 0),
        uploadTime: item.createTime || '',
      }));
  }

  private async fetchAttachmentSummaryMapForRows(rows: any[]) {
    const rowIdMap = new Map<number, number[]>();
    const attachmentIds = new Set<number>();

    rows.forEach(item => {
      const resumeId = Number(item.id);
      const ids = this.normalizeAttachmentIdList(item.attachmentIdList);
      rowIdMap.set(resumeId, ids);
      ids.forEach(id => attachmentIds.add(id));
    });

    if (!attachmentIds.size) {
      return new Map<number, any[]>();
    }

    const attachmentRows = await this.spaceInfoEntity.findBy({
      id: In(Array.from(attachmentIds)),
    } as any);
    const attachmentMap = new Map<number, SpaceInfoEntity>();

    attachmentRows.forEach(item => {
      attachmentMap.set(Number(item.id), item);
    });

    const summaryMap = new Map<number, any[]>();
    rowIdMap.forEach((ids, resumeId) => {
      summaryMap.set(
        resumeId,
        ids
          .map(id => attachmentMap.get(id))
          .filter(item => !!item)
          .map(item => ({
            id: Number(item.id),
            name: item.name || '',
            size: Number(item.size || 0),
            uploadTime: item.createTime || '',
          }))
      );
    });

    return summaryMap;
  }

  private normalizeResumePageRow(item: any, attachmentSummaryList: any[] = []) {
    const recruitPlanSnapshot = this.normalizeRecruitPlanSnapshot(
      item.recruitPlanSnapshot
    );
    const jobStandardSnapshot = this.normalizeJobStandardSnapshot(
      item.jobStandardSnapshot
    );

    return {
      id: Number(item.id),
      candidateName: item.candidateName || '',
      targetDepartmentId: Number(item.targetDepartmentId || 0),
      targetDepartmentName: item.targetDepartmentName || '',
      targetPosition: item.targetPosition || null,
      phone: item.phone || '',
      email: item.email || null,
      attachmentSummaryList,
      sourceType: item.sourceType || 'manual',
      status: item.status || 'new',
      linkedTalentAssetId: this.normalizeNullableNumber(item.linkedTalentAssetId),
      latestInterviewId: this.normalizeNullableNumber(item.latestInterviewId),
      recruitPlanId: this.normalizeNullableNumber(item.recruitPlanId),
      jobStandardId: this.normalizeNullableNumber(item.jobStandardId),
      recruitPlanSummary: recruitPlanSnapshot,
      recruitPlanSnapshot,
      jobStandardSummary: jobStandardSnapshot,
      jobStandardSnapshot,
      createTime: item.createTime || '',
      updateTime: item.updateTime || '',
    };
  }

  private buildTalentAssetSource(resume: PerformanceResumePoolEntity) {
    const sourceType = resume.sourceType || 'manual';
    const sourceRemark = String(resume.sourceRemark || '').trim();
    const source = sourceRemark ? `${sourceType}:${sourceRemark}` : sourceType;
    return source.length > 100 ? source.slice(0, 100) : source;
  }

  private normalizeNullableNumber(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = Number(value);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
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

  private normalizeJobStandardSnapshot(value: any) {
    const snapshot = normalizeJsonObject(value);
    if (!snapshot) {
      return null;
    }

    return {
      id: this.normalizeNullableNumber(snapshot.id),
      positionName: snapshot.positionName || '',
      jobLevel: snapshot.jobLevel || null,
      targetDepartmentId: this.normalizeNullableNumber(snapshot.targetDepartmentId),
      targetDepartmentName: snapshot.targetDepartmentName || null,
      status: snapshot.status || null,
      requirementSummary: snapshot.requirementSummary || null,
    };
  }

  private async resolveRecruitPlanSnapshot(
    recruitPlanId: any,
    recruitPlanSnapshot: any
  ) {
    const normalizedRecruitPlanId = this.normalizeNullableNumber(recruitPlanId);
    if (normalizedRecruitPlanId) {
      return this.buildRecruitPlanSnapshot(normalizedRecruitPlanId, null, null);
    }

    return this.normalizeRecruitPlanSnapshot(recruitPlanSnapshot);
  }

  private async resolveJobStandardSnapshot(jobStandardId: any, jobStandardSnapshot: any) {
    const normalizedJobStandardId = this.normalizeNullableNumber(jobStandardId);
    if (normalizedJobStandardId) {
      return this.buildJobStandardSnapshot(normalizedJobStandardId, null, null);
    }

    return this.normalizeJobStandardSnapshot(jobStandardSnapshot);
  }

  private async buildRecruitPlanSnapshot(
    recruitPlanId: number | null,
    targetDepartmentId: number | null,
    perms: string[] | null
  ) {
    if (!recruitPlanId) {
      return null;
    }

    const record = await this.performanceRecruitPlanEntity.findOneBy({
      id: recruitPlanId,
    });
    if (!record) {
      throw new CoolCommException('招聘计划不存在');
    }

    if (
      targetDepartmentId &&
      Number(record.targetDepartmentId || 0) !== Number(targetDepartmentId)
    ) {
      throw new CoolCommException('招聘计划所属部门与简历目标部门不一致');
    }

    if (perms) {
      await this.assertCanManageDepartment(Number(record.targetDepartmentId), perms);
    }

    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: Number(record.targetDepartmentId),
    });

    return {
      id: Number(record.id),
      title: record.title || '',
      positionName: record.positionName || null,
      targetDepartmentId: Number(record.targetDepartmentId || 0),
      targetDepartmentName: department?.name || null,
      headcount: Number(record.headcount || 0),
      startDate: record.startDate || null,
      endDate: record.endDate || null,
      status: record.status || null,
      jobStandardId: this.normalizeNullableNumber(record.jobStandardId),
    };
  }

  private async buildJobStandardSnapshot(
    jobStandardId: number | null,
    targetDepartmentId: number | null,
    perms: string[] | null
  ) {
    if (!jobStandardId) {
      return null;
    }

    const record = await this.performanceJobStandardEntity.findOneBy({
      id: jobStandardId,
    });
    if (!record) {
      throw new CoolCommException('职位标准不存在');
    }

    if (
      targetDepartmentId &&
      Number(record.targetDepartmentId || 0) !== Number(targetDepartmentId)
    ) {
      throw new CoolCommException('职位标准所属部门与简历目标部门不一致');
    }

    if (perms) {
      await this.assertCanManageDepartment(Number(record.targetDepartmentId), perms);
    }

    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: Number(record.targetDepartmentId),
    });

    return {
      id: Number(record.id),
      positionName: record.positionName || '',
      jobLevel: record.jobLevel || null,
      targetDepartmentId: Number(record.targetDepartmentId || 0),
      targetDepartmentName: department?.name || null,
      status: record.status || null,
      requirementSummary: record.requirementSummary || null,
    };
  }

  private async buildResumeReferenceSnapshot(resume: PerformanceResumePoolEntity) {
    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: Number(resume.targetDepartmentId),
    });

    return {
      id: Number(resume.id),
      candidateName: resume.candidateName || '',
      targetDepartmentId: Number(resume.targetDepartmentId || 0),
      targetDepartmentName: department?.name || null,
      targetPosition: resume.targetPosition || null,
      phone: resume.phone || '',
      email: resume.email || null,
      status: resume.status || 'new',
      recruitPlanId: this.normalizeNullableNumber(resume.recruitPlanId),
      jobStandardId: this.normalizeNullableNumber(resume.jobStandardId),
    };
  }

  private async requireResume(id: number) {
    const resume = await this.performanceResumePoolEntity.findOneBy({
      id: Number(id),
    });

    if (!resume) {
      throw new CoolCommException('数据不存在');
    }

    return resume;
  }

  private async currentPerms() {
    const admin = this.currentAdmin;

    if (!admin?.roleIds) {
      throw new CoolCommException('登录状态已失效');
    }

    return this.baseSysMenuService.getPerms(admin.roleIds);
  }

  private hasPerm(perms: string[], perm: string) {
    return perms.includes(perm);
  }

  private assertPerm(perms: string[], perm: string, message: string) {
    if (!this.hasPerm(perms, perm)) {
      throw new CoolCommException(message);
    }
  }

  private isHr(perms: string[]) {
    return (
      this.currentAdmin?.isAdmin === true ||
      this.currentAdmin?.username === 'admin' ||
      this.hasPerm(perms, this.perms.export) ||
      this.hasPerm(perms, this.perms.downloadAttachment)
    );
  }

  private async departmentScopeIds(perms: string[]) {
    if (this.isHr(perms)) {
      return null;
    }

    const userId = Number(this.currentAdmin?.userId || 0);
    if (!userId) {
      throw new CoolCommException('登录上下文缺失');
    }

    const ids = await this.baseSysPermsService.departmentIds(userId);

    return Array.from(
      new Set(
        (Array.isArray(ids) ? ids : [])
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

    qb.andWhere('resume.targetDepartmentId in (:...departmentIds)', {
      departmentIds,
    });
  }

  private async assertResumeInScope(
    resume: PerformanceResumePoolEntity,
    perms: string[],
    message: string
  ) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);
    if (!departmentIds?.includes(Number(resume.targetDepartmentId || 0))) {
      throw new CoolCommException(message);
    }
  }

  private async assertCanManageDepartment(targetDepartmentId: number, perms: string[]) {
    if (this.isHr(perms)) {
      return;
    }

    const departmentIds = await this.departmentScopeIds(perms);
    if (!departmentIds?.includes(targetDepartmentId)) {
      throw new CoolCommException('无权操作该简历');
    }
  }
}
