/**
 * 主题4开发前评审的 producer 契约快照。
 * 这里只固化指标库的最小资源、请求和分页响应字段，不负责评估单、环评或其他模块引用逻辑。
 * 维护重点是字段名、值域和分页结构必须与指标库冻结范围一致，避免 schema drift 守卫失去依据。
 */

export interface PagePagination {
  page: number;
  size: number;
  total: number;
}

export type IndicatorCategory = "assessment" | "goal" | "feedback";
export type IndicatorApplyScope = "all" | "department" | "employee";
export type IndicatorStatus = 0 | 1;

export interface IndicatorPageQuery {
  page: number;
  size: number;
  keyword?: string;
  category?: IndicatorCategory;
  status?: IndicatorStatus;
}

export interface IndicatorRecord {
  id?: number;
  name: string;
  code: string;
  category: IndicatorCategory;
  weight: number;
  scoreScale: number;
  applyScope: IndicatorApplyScope;
  description?: string | null;
  status: IndicatorStatus;
  createTime?: string;
  updateTime?: string;
}

export interface IndicatorSaveRequest {
  id?: number;
  name: string;
  code: string;
  category: IndicatorCategory;
  weight: number;
  scoreScale: number;
  applyScope: IndicatorApplyScope;
  description?: string | null;
  status: IndicatorStatus;
}

export interface IndicatorPageResult {
  list: IndicatorRecord[];
  pagination: PagePagination;
}
