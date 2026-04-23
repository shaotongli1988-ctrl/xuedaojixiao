/**
 * 主题15开发前评审的 producer 契约快照。
 * 这里只固化简历池主链、附件动作、导入导出与主题8/12转换边界，不负责招聘计划、职位标准、录用或招聘驾驶舱主链。
 * 维护重点是 resumePool 十个接口、new/screening/interviewing/archived 状态与 HR-only 下载边界必须保持冻结口径一致。
 */

export interface PagePagination {
  page: number;
  size: number;
  total: number;
}

export type ResumePoolStatus = "new" | "screening" | "interviewing" | "archived";
export type ResumePoolSourceType = "manual" | "attachment" | "external" | "referral";

export interface ResumePoolAttachmentSummary {
  id: number;
  name: string;
  size: number;
  uploadTime: string;
}

export interface ResumePoolRecruitPlanSnapshot {
  id?: number | null;
  title?: string;
  positionName?: string | null;
  targetDepartmentId?: number | null;
  targetDepartmentName?: string | null;
  headcount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  jobStandardId?: number | null;
}

export interface ResumePoolJobStandardSnapshot {
  id?: number | null;
  positionName?: string;
  jobLevel?: string | null;
  targetDepartmentId?: number | null;
  targetDepartmentName?: string | null;
  status?: string | null;
  requirementSummary?: string | null;
}

export interface ResumePoolReferenceSnapshot {
  id?: number;
  candidateName: string;
  targetDepartmentId: number;
  targetDepartmentName?: string | null;
  targetPosition?: string | null;
  phone: string;
  email?: string | null;
  status: ResumePoolStatus;
  recruitPlanId?: number | null;
  jobStandardId?: number | null;
}

export interface ResumePoolInterviewSourceSnapshot {
  sourceResource: "resumePool";
  resumePoolId: number;
  recruitPlanId?: number | null;
  recruitPlanTitle?: string | null;
  candidateName?: string | null;
  targetDepartmentId: number;
  targetPosition?: string | null;
}

export interface ResumePoolPageQuery {
  page: number;
  size: number;
  keyword?: string;
  targetDepartmentId?: number;
  status?: ResumePoolStatus;
  sourceType?: ResumePoolSourceType;
}

export interface ResumePoolRecord {
  id?: number;
  candidateName: string;
  targetDepartmentId: number;
  targetDepartmentName?: string;
  targetPosition?: string | null;
  phone: string;
  email?: string | null;
  resumeText?: string;
  sourceType: ResumePoolSourceType;
  sourceRemark?: string | null;
  externalLink?: string | null;
  attachmentSummaryList?: ResumePoolAttachmentSummary[];
  status: ResumePoolStatus;
  linkedTalentAssetId?: number | null;
  latestInterviewId?: number | null;
  recruitPlanId?: number | null;
  jobStandardId?: number | null;
  recruitPlanSummary?: ResumePoolRecruitPlanSnapshot | null;
  recruitPlanSnapshot?: ResumePoolRecruitPlanSnapshot | null;
  jobStandardSummary?: ResumePoolJobStandardSnapshot | null;
  jobStandardSnapshot?: ResumePoolJobStandardSnapshot | null;
  createTime?: string;
  updateTime?: string;
}

export interface ResumePoolSaveRequest {
  id?: number;
  candidateName: string;
  targetDepartmentId: number;
  targetPosition?: string | null;
  phone: string;
  email?: string | null;
  resumeText: string;
  sourceType: ResumePoolSourceType;
  sourceRemark?: string | null;
  externalLink?: string | null;
  attachmentIdList?: number[];
  recruitPlanId?: number | null;
  jobStandardId?: number | null;
  status?: ResumePoolStatus;
}

export interface ResumePoolImportRequest {
  fileId: number;
  rows?: Array<Record<string, unknown>>;
  overwriteRows?: Array<Record<string, unknown>>;
}

export interface ResumePoolImportResult {
  fileId: number;
  importedCount: number;
  overwrittenCount: number;
  skippedCount: number;
}

export interface ResumePoolExportQuery {
  keyword?: string;
  targetDepartmentId?: number;
  status?: ResumePoolStatus;
  sourceType?: ResumePoolSourceType;
}

export interface ResumePoolExportRow {
  id?: number;
  candidateName: string;
  targetDepartmentId: number;
  phone: string;
  resumeText: string;
  sourceType: ResumePoolSourceType;
  status: ResumePoolStatus;
}

export interface ResumePoolUploadAttachmentRequest {
  id: number;
  fileId: number;
}

export interface ResumePoolDownloadAttachmentRequest {
  id: number;
  attachmentId: number;
}

export interface ResumePoolAttachmentDownloadResult {
  id: number;
  name: string;
  size: number;
  uploadTime: string;
  url: string;
  downloadUrl: string;
  fileId: string;
}

export interface ResumePoolActionRequest {
  id: number;
}

export interface ResumePoolTalentAssetConvertResult {
  talentAssetId: number;
  created: boolean;
}

export interface ResumePoolCreateInterviewResult {
  interviewId: number;
  status: ResumePoolStatus;
  resumePoolId: number;
  recruitPlanId?: number | null;
  jobStandardId?: number | null;
  sourceSnapshot?: ResumePoolInterviewSourceSnapshot;
  snapshot?: ResumePoolReferenceSnapshot;
  resumePoolSummary?: ResumePoolReferenceSnapshot;
  resumePoolSnapshot?: ResumePoolReferenceSnapshot;
  recruitPlanSummary?: ResumePoolRecruitPlanSnapshot | null;
  recruitPlanSnapshot?: ResumePoolRecruitPlanSnapshot | null;
  jobStandardSummary?: ResumePoolJobStandardSnapshot | null;
  jobStandardSnapshot?: ResumePoolJobStandardSnapshot | null;
}

export interface ResumePoolPageResult {
  list: ResumePoolRecord[];
  pagination: PagePagination;
}
