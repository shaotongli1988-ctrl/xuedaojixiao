/**
 * 主题17开发前评审的 consumer 契约快照。
 * 这里只固化前端调用的最小类型和接口路径，作为 schema drift 与 endpoint drift 的消费侧证据，不负责真实页面实现。
 * 维护重点是详情字段不能越过主题17冻结边界，且不得混入 delete、薪资区间或招聘链全文字段。
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

const jobStandardBaseUrl = "/admin/performance/jobStandard";

declare function request(config: {
  url: string;
  method: "GET" | "POST";
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchJobStandardPage(data: JobStandardPageQuery) {
  return request({
    url: `${jobStandardBaseUrl}/page`,
    method: "POST",
    data,
  });
}

export function fetchJobStandardInfo(params: { id: number }) {
  return request({
    url: `${jobStandardBaseUrl}/info`,
    method: "GET",
    params,
  });
}

export function createJobStandard(data: JobStandardSaveRequest) {
  return request({
    url: `${jobStandardBaseUrl}/add`,
    method: "POST",
    data,
  });
}

export function updateJobStandard(data: JobStandardSaveRequest & { id: number }) {
  return request({
    url: `${jobStandardBaseUrl}/update`,
    method: "POST",
    data,
  });
}

export function setJobStandardStatus(data: JobStandardStatusUpdateRequest) {
  return request({
    url: `${jobStandardBaseUrl}/setStatus`,
    method: "POST",
    data,
  });
}
