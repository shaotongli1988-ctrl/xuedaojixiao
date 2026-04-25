/**
 * 主题9开发前评审的 producer 契约快照。
 * 这里只固化会议管理主链的最小资源、请求和分页响应字段，不负责逐人签到、会议纪要全文或外部系统接入。
 * 维护重点是摘要字段、状态枚举和 checkIn 请求体必须与主题9冻结范围一致。
 */

export interface PagePagination {
  page: number;
  size: number;
  total: number;
}

export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface MeetingPageQuery {
  page: number;
  size: number;
  keyword?: string;
  status?: MeetingStatus;
  startDate?: string;
  endDate?: string;
}

export interface MeetingRecord {
  id?: number;
  title: string;
  code?: string | null;
  type?: string | null;
  description?: string | null;
  startDate: string;
  endDate: string;
  location?: string | null;
  organizerId: number;
  organizerName?: string;
  participantCount?: number;
  status: MeetingStatus;
  createTime?: string;
  updateTime?: string;
}

export interface MeetingSaveRequest {
  id?: number;
  title: string;
  code?: string | null;
  type?: string | null;
  description?: string | null;
  startDate: string;
  endDate: string;
  location?: string | null;
  organizerId: number;
  participantIds?: number[];
  status?: MeetingStatus;
}

export interface MeetingPageResult {
  list: MeetingRecord[];
  pagination: PagePagination;
}

export interface MeetingCheckInRequest {
  id: number;
}
