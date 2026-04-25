/**
 * 主题4开发前评审的 consumer 契约快照。
 * 这里只固化前端调用的最小类型和接口路径，作为 schema drift 与 endpoint drift 的消费侧证据，不负责真实页面实现。
 * 维护重点是路径、字段和值域只能落在指标库冻结范围内，不能混入评估单或环评语义。
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

const indicatorBaseUrl = "/admin/performance/indicator";

declare function request(config: {
  url: string;
  method: "GET" | "POST";
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchIndicatorPage(data: IndicatorPageQuery) {
  return request({
    url: `${indicatorBaseUrl}/page`,
    method: "POST",
    data,
  });
}

export function fetchIndicatorInfo(params: { id: number }) {
  return request({
    url: `${indicatorBaseUrl}/info`,
    method: "GET",
    params,
  });
}

export function createIndicator(data: IndicatorSaveRequest) {
  return request({
    url: `${indicatorBaseUrl}/add`,
    method: "POST",
    data,
  });
}

export function updateIndicator(data: IndicatorSaveRequest & { id: number }) {
  return request({
    url: `${indicatorBaseUrl}/update`,
    method: "POST",
    data,
  });
}

export function deleteIndicator(data: { ids: number[] }) {
  return request({
    url: `${indicatorBaseUrl}/delete`,
    method: "POST",
    data,
  });
}
