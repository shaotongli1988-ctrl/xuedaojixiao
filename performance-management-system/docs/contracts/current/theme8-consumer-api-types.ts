/**
 * 主题8开发前评审的 consumer 契约快照。
 * 这里只固化前端消费的最小类型和接口路径，作为 schema drift 与 endpoint drift 的消费侧证据。
 * 维护重点是引用快照只允许 ID + 摘要，不得把 resumePool 联系方式、简历全文或附件能力再次混入 interview 契约。
 */

export interface PagePagination {
  page: number;
  size: number;
  total: number;
}

export interface DeleteIdsRequest {
  ids: number[];
}

export type InterviewStatus = "scheduled" | "completed" | "cancelled";

export type InterviewType = "technical" | "behavioral" | "manager" | "hr";

export type InterviewSourceResource =
  | "jobStandard"
  | "recruitPlan"
  | "resumePool"
  | "interview"
  | "talentAsset";

export type RecruitPlanStatus = "draft" | "active" | "voided" | "closed";

export type ResumePoolStatus = "new" | "screening" | "interviewing" | "archived";

export interface InterviewSourceSnapshot {
  sourceResource?: InterviewSourceResource | null;
  talentAssetId?: number | null;
  jobStandardId?: number | null;
  jobStandardPositionName?: string | null;
  jobStandardRequirementSummary?: string | null;
  recruitPlanId?: number | null;
  recruitPlanTitle?: string | null;
  recruitPlanStatus?: RecruitPlanStatus | null;
  resumePoolId?: number | null;
  interviewId?: number | null;
  candidateName?: string | null;
  targetDepartmentId?: number | null;
  targetDepartmentName?: string | null;
  targetPosition?: string | null;
  interviewStatus?: InterviewStatus | null;
  sourceStatusSnapshot?: string | null;
}

export interface InterviewResumePoolSummary {
  id: number;
  candidateName: string;
  targetDepartmentId: number;
  targetDepartmentName?: string | null;
  targetPosition?: string | null;
  status: ResumePoolStatus;
  recruitPlanId?: number | null;
  jobStandardId?: number | null;
}

export interface InterviewRecruitPlanSummary {
  id: number;
  title: string;
  positionName?: string | null;
  targetDepartmentId: number;
  targetDepartmentName?: string | null;
  headcount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: RecruitPlanStatus | null;
  jobStandardId?: number | null;
}

export interface InterviewPageQuery {
  page: number;
  size: number;
  candidateName?: string;
  position?: string;
  status?: InterviewStatus;
  startDate?: string;
  endDate?: string;
}

export interface InterviewRecord {
  id?: number;
  candidateName: string;
  position: string;
  departmentId?: number | null;
  interviewerId: number;
  interviewerName?: string;
  interviewDate: string;
  interviewType?: InterviewType | null;
  score?: number | null;
  resumePoolId?: number | null;
  recruitPlanId?: number | null;
  sourceSnapshot?: InterviewSourceSnapshot | null;
  resumePoolSummary?: InterviewResumePoolSummary | null;
  resumePoolSnapshot?: InterviewResumePoolSummary | null;
  recruitPlanSummary?: InterviewRecruitPlanSummary | null;
  recruitPlanSnapshot?: InterviewRecruitPlanSummary | null;
  status: InterviewStatus;
  createTime?: string;
  updateTime?: string;
}

export interface InterviewSaveRequest {
  id?: number;
  candidateName: string;
  position: string;
  departmentId?: number | null;
  interviewerId: number;
  interviewDate: string;
  interviewType?: InterviewType | null;
  score?: number | null;
  resumePoolId?: number | null;
  recruitPlanId?: number | null;
  sourceSnapshot?: InterviewSourceSnapshot | null;
  status?: InterviewStatus;
}

export interface InterviewPageResult {
  list: InterviewRecord[];
  pagination: PagePagination;
}

const interviewBaseUrl = "/admin/performance/interview";

declare function request(config: {
  url: string;
  method: "GET" | "POST";
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchInterviewPage(data: InterviewPageQuery) {
  return request({
    url: `${interviewBaseUrl}/page`,
    method: "POST",
    data,
  });
}

export function fetchInterviewInfo(params: { id: number }) {
  return request({
    url: `${interviewBaseUrl}/info`,
    method: "GET",
    params,
  });
}

export function createInterview(data: InterviewSaveRequest) {
  return request({
    url: `${interviewBaseUrl}/add`,
    method: "POST",
    data,
  });
}

export function updateInterview(data: InterviewSaveRequest & { id: number }) {
  return request({
    url: `${interviewBaseUrl}/update`,
    method: "POST",
    data,
  });
}

export function deleteInterview(data: DeleteIdsRequest) {
  return request({
    url: `${interviewBaseUrl}/delete`,
    method: "POST",
    data,
  });
}
