/**
 * 主题8开发前评审的 producer 契约快照。
 * 这里只固化面试管理主链的 page/info/add/update/delete 五个接口，以及允许的弱引用来源快照。
 * 维护重点是 scheduled/completed/cancelled 状态、resumePool/recruitPlan/talentAsset 来源摘要与“禁止下沉联系方式全文”必须与仓库 OpenAPI 主源一致。
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
