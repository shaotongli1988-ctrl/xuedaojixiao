/**
 * 主题16开发前评审的 consumer 契约快照。
 * 这里只固化前端调用的最小类型和接口路径，作为 schema drift 与 endpoint drift 的消费侧证据，不负责真实页面实现。
 * 维护重点是详情字段不能越过主题16冻结边界，且弱引用只允许 jobStandard 来源摘要/快照，不能混入审批流或招聘执行过程全文。
 */

export interface PagePagination {
  page: number;
  size: number;
  total: number;
}

export type JobStandardStatus = "draft" | "active" | "inactive";
export type RecruitPlanStatus = "draft" | "active" | "voided" | "closed";
export type RecruitPlanImportCellValue = string | number | null;

export interface RecruitPlanSourceSnapshot {
  id?: number | null;
  positionName?: string;
  jobLevel?: string | null;
  targetDepartmentId?: number | null;
  targetDepartmentName?: string | null;
  status?: JobStandardStatus | null;
  requirementSummary?: string | null;
}

export interface RecruitPlanPageQuery {
  page: number;
  size: number;
  keyword?: string;
  targetDepartmentId?: number;
  status?: RecruitPlanStatus;
  startDate?: string;
  endDate?: string;
}

export interface RecruitPlanRecord {
  id?: number;
  title: string;
  targetDepartmentId: number;
  targetDepartmentName?: string | null;
  positionName: string;
  headcount: number;
  startDate: string;
  endDate: string;
  recruiterId?: number | null;
  recruiterName?: string | null;
  requirementSummary?: string | null;
  jobStandardId?: number | null;
  jobStandardSummary?: RecruitPlanSourceSnapshot | null;
  jobStandardSnapshot?: RecruitPlanSourceSnapshot | null;
  status: RecruitPlanStatus;
  createTime?: string;
  updateTime?: string;
}

export interface RecruitPlanSaveRequest {
  id?: number;
  title: string;
  targetDepartmentId: number;
  positionName: string;
  headcount: number;
  startDate: string;
  endDate: string;
  recruiterId?: number | null;
  requirementSummary?: string | null;
  jobStandardId?: number | null;
  status?: RecruitPlanStatus;
}

export interface RecruitPlanActionRequest {
  id: number;
}

export interface RecruitPlanDeleteResult {
  id: number;
  deleted: boolean;
}

export interface RecruitPlanImportRow {
  title?: RecruitPlanImportCellValue;
  targetDepartmentId?: RecruitPlanImportCellValue;
  positionName?: RecruitPlanImportCellValue;
  headcount?: RecruitPlanImportCellValue;
  startDate?: RecruitPlanImportCellValue;
  endDate?: RecruitPlanImportCellValue;
  recruiterId?: RecruitPlanImportCellValue;
  requirementSummary?: RecruitPlanImportCellValue;
  jobStandardId?: RecruitPlanImportCellValue;
}

export interface RecruitPlanImportRequest {
  fileId: number;
  rows: RecruitPlanImportRow[];
}

export interface RecruitPlanImportResult {
  fileId: number;
  importedCount: number;
  skippedCount: number;
}

export interface RecruitPlanExportQuery {
  keyword?: string;
  targetDepartmentId?: number;
  status?: RecruitPlanStatus;
  startDate?: string;
  endDate?: string;
}

export interface RecruitPlanExportRow {
  id?: number;
  title: string;
  targetDepartmentId: number;
  targetDepartmentName?: string | null;
  positionName: string;
  headcount: number;
  startDate: string;
  endDate: string;
  recruiterId?: number | null;
  recruiterName?: string | null;
  requirementSummary?: string | null;
  jobStandardId?: number | null;
  jobStandardSummary?: RecruitPlanSourceSnapshot | null;
  jobStandardSnapshot?: RecruitPlanSourceSnapshot | null;
  status: RecruitPlanStatus;
  createTime?: string;
  updateTime?: string;
}

export interface RecruitPlanPageResult {
  list: RecruitPlanRecord[];
  pagination: PagePagination;
}

const recruitPlanBaseUrl = "/admin/performance/recruitPlan";

declare function request(config: {
  url: string;
  method: "GET" | "POST";
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchRecruitPlanPage(data: RecruitPlanPageQuery) {
  return request({
    url: `${recruitPlanBaseUrl}/page`,
    method: "POST",
    data,
  });
}

export function fetchRecruitPlanInfo(params: { id: number }) {
  return request({
    url: `${recruitPlanBaseUrl}/info`,
    method: "GET",
    params,
  });
}

export function createRecruitPlan(data: RecruitPlanSaveRequest) {
  return request({
    url: `${recruitPlanBaseUrl}/add`,
    method: "POST",
    data,
  });
}

export function updateRecruitPlan(data: RecruitPlanSaveRequest & { id: number }) {
  return request({
    url: `${recruitPlanBaseUrl}/update`,
    method: "POST",
    data,
  });
}

export function deleteRecruitPlan(data: RecruitPlanActionRequest) {
  return request({
    url: `${recruitPlanBaseUrl}/delete`,
    method: "POST",
    data,
  });
}

export function importRecruitPlan(data: RecruitPlanImportRequest) {
  return request({
    url: `${recruitPlanBaseUrl}/import`,
    method: "POST",
    data,
  });
}

export function exportRecruitPlan(data: RecruitPlanExportQuery) {
  return request({
    url: `${recruitPlanBaseUrl}/export`,
    method: "POST",
    data,
  });
}

export function submitRecruitPlan(data: RecruitPlanActionRequest) {
  return request({
    url: `${recruitPlanBaseUrl}/submit`,
    method: "POST",
    data,
  });
}

export function closeRecruitPlan(data: RecruitPlanActionRequest) {
  return request({
    url: `${recruitPlanBaseUrl}/close`,
    method: "POST",
    data,
  });
}

export function voidRecruitPlan(data: RecruitPlanActionRequest) {
  return request({
    url: `${recruitPlanBaseUrl}/void`,
    method: "POST",
    data,
  });
}

export function reopenRecruitPlan(data: RecruitPlanActionRequest) {
  return request({
    url: `${recruitPlanBaseUrl}/reopen`,
    method: "POST",
    data,
  });
}
