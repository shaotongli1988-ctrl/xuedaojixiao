/**
 * 主题12开发前评审的 consumer 契约快照。
 * 这里只固化前端调用的最小类型和接口路径，作为 schema drift 与 endpoint drift 的消费侧证据，不负责真实页面实现。
 * 维护重点是只消费 talentAsset 摘要字段和标准 CRUD 路径，不把联系方式、简历全文或面试自动化写回 API 契约。
 */

export interface PagePagination {
  page: number;
  size: number;
  total: number;
}

export type TalentAssetStatus = "new" | "tracking" | "archived";

export interface TalentAssetPageQuery {
  page: number;
  size: number;
  keyword?: string;
  targetDepartmentId?: number;
  source?: string;
  tag?: string;
  status?: TalentAssetStatus;
}

export interface TalentAssetRecord {
  id?: number;
  candidateName: string;
  code?: string | null;
  targetDepartmentId: number;
  targetDepartmentName?: string;
  targetPosition?: string | null;
  source: string;
  tagList?: string[];
  followUpSummary?: string | null;
  nextFollowUpDate?: string | null;
  status: TalentAssetStatus;
  createTime?: string;
  updateTime?: string;
}

export interface TalentAssetSaveRequest {
  id?: number;
  candidateName: string;
  code?: string | null;
  targetDepartmentId: number;
  targetPosition?: string | null;
  source: string;
  tagList?: string[];
  followUpSummary?: string | null;
  nextFollowUpDate?: string | null;
  status?: TalentAssetStatus;
}

export interface TalentAssetPageResult {
  list: TalentAssetRecord[];
  pagination: PagePagination;
}

export interface DeleteIdsRequest {
  ids: number[];
}

const talentAssetBaseUrl = "/admin/performance/talentAsset";

declare function request(config: {
  url: string;
  method: "GET" | "POST";
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchTalentAssetPage(data: TalentAssetPageQuery) {
  return request({
    url: `${talentAssetBaseUrl}/page`,
    method: "POST",
    data,
  });
}

export function fetchTalentAssetInfo(params: { id: number }) {
  return request({
    url: `${talentAssetBaseUrl}/info`,
    method: "GET",
    params,
  });
}

export function createTalentAsset(data: TalentAssetSaveRequest) {
  return request({
    url: `${talentAssetBaseUrl}/add`,
    method: "POST",
    data,
  });
}

export function updateTalentAsset(data: TalentAssetSaveRequest & { id: number }) {
  return request({
    url: `${talentAssetBaseUrl}/update`,
    method: "POST",
    data,
  });
}

export function deleteTalentAsset(data: DeleteIdsRequest) {
  return request({
    url: `${talentAssetBaseUrl}/delete`,
    method: "POST",
    data,
  });
}
