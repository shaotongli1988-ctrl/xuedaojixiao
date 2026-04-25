/**
 * 主题17开发前评审的 producer 契约快照。
 * 这里只固化职位标准主链的最小资源、请求、状态动作和分页响应字段，不负责招聘计划、简历池、面试、录用或设计器扩展。
 * 维护重点是 page/info/add/update/setStatus 五个接口、draft/active/inactive 状态机和摘要字段边界必须与主题17冻结范围一致。
 */

export interface PagePagination {
  page: number;
  size: number;
  total: number;
}

export type JobStandardStatus = "draft" | "active" | "inactive";

export interface JobStandardPageQuery {
  page: number;
  size: number;
  keyword?: string;
  targetDepartmentId?: number;
  status?: JobStandardStatus;
}

export interface JobStandardRecord {
  id?: number;
  positionName: string;
  targetDepartmentId: number;
  targetDepartmentName?: string;
  jobLevel?: string | null;
  profileSummary?: string | null;
  requirementSummary?: string | null;
  skillTagList?: string[];
  interviewTemplateSummary?: string | null;
  status: JobStandardStatus;
  createTime?: string;
  updateTime?: string;
}

export interface JobStandardSaveRequest {
  id?: number;
  positionName: string;
  targetDepartmentId: number;
  jobLevel?: string | null;
  profileSummary?: string | null;
  requirementSummary?: string | null;
  skillTagList?: string[];
  interviewTemplateSummary?: string | null;
  status?: JobStandardStatus;
}

export interface JobStandardStatusUpdateRequest {
  id: number;
  status: JobStandardStatus;
}

export interface JobStandardPageResult {
  list: JobStandardRecord[];
  pagination: PagePagination;
}
