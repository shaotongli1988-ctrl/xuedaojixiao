/**
 * 主题12开发前评审的 producer 契约快照。
 * 这里只固化人才资产摘要主链的 page/info/add/update/delete 五个接口，不负责联系方式、简历全文、附件全文或面试自动创建。
 * 维护重点是 talentAsset 的字段边界、new/tracking/archived 状态机和 HR-only 删除约束必须与主题12冻结口径一致。
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
