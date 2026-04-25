/**
 * 主题15开发前评审的 consumer 契约快照。
 * 这里只固化前端调用的最小类型和接口路径，作为 schema drift 与 endpoint drift 的消费侧证据，不负责真实页面实现。
 * 维护重点是只消费 resumePool 冻结边界内的字段、附件摘要和转换结果，不把页面私有派生字段重新写回 API 契约。
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

const resumePoolBaseUrl = "/admin/performance/resumePool";

declare function request(config: {
  url: string;
  method: "GET" | "POST";
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchResumePoolPage(data: ResumePoolPageQuery) {
  return request({
    url: `${resumePoolBaseUrl}/page`,
    method: "POST",
    data,
  });
}

export function fetchResumePoolInfo(params: { id: number }) {
  return request({
    url: `${resumePoolBaseUrl}/info`,
    method: "GET",
    params,
  });
}

export function createResumePool(data: ResumePoolSaveRequest) {
  return request({
    url: `${resumePoolBaseUrl}/add`,
    method: "POST",
    data,
  });
}

export function updateResumePool(data: ResumePoolSaveRequest & { id: number }) {
  return request({
    url: `${resumePoolBaseUrl}/update`,
    method: "POST",
    data,
  });
}

export function importResumePool(data: ResumePoolImportRequest) {
  return request({
    url: `${resumePoolBaseUrl}/import`,
    method: "POST",
    data,
  });
}

export function exportResumePool(data: ResumePoolExportQuery) {
  return request({
    url: `${resumePoolBaseUrl}/export`,
    method: "POST",
    data,
  });
}

export function uploadResumePoolAttachment(data: ResumePoolUploadAttachmentRequest) {
  return request({
    url: `${resumePoolBaseUrl}/uploadAttachment`,
    method: "POST",
    data,
  });
}

export function downloadResumePoolAttachment(data: ResumePoolDownloadAttachmentRequest) {
  return request({
    url: `${resumePoolBaseUrl}/downloadAttachment`,
    method: "POST",
    data,
  });
}

export function convertResumePoolToTalentAsset(data: ResumePoolActionRequest) {
  return request({
    url: `${resumePoolBaseUrl}/convertToTalentAsset`,
    method: "POST",
    data,
  });
}

export function createResumePoolInterview(data: ResumePoolActionRequest) {
  return request({
    url: `${resumePoolBaseUrl}/createInterview`,
    method: "POST",
    data,
  });
}
