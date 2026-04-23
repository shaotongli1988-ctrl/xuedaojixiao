/**
 * 主题16开发前评审的 producer 契约快照。
 * 这里只固化招聘计划主链的最小资源、导入导出、状态动作和来源摘要快照字段，不负责简历池、面试、录用或审批流扩展。
 * 维护重点是 page/info/add/update/delete/import/export/submit/close/void/reopen 十一个接口、draft/active/voided/closed 状态机和弱引用边界必须与主题16冻结范围一致。
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
