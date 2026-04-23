/**
 * 主题9开发前评审的 consumer 契约快照。
 * 这里只固化前端调用的最小类型和接口路径，作为 schema drift 与 endpoint drift 的消费侧证据，不负责真实页面实现。
 * 维护重点是详情字段不能越过主题9冻结边界，且不得混入 participantIds 或逐人签到明细。
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

const meetingBaseUrl = "/admin/performance/meeting";

declare function request(config: {
  url: string;
  method: "GET" | "POST";
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchMeetingPage(data: MeetingPageQuery) {
  return request({
    url: `${meetingBaseUrl}/page`,
    method: "POST",
    data,
  });
}

export function fetchMeetingInfo(params: { id: number }) {
  return request({
    url: `${meetingBaseUrl}/info`,
    method: "GET",
    params,
  });
}

export function createMeeting(data: MeetingSaveRequest) {
  return request({
    url: `${meetingBaseUrl}/add`,
    method: "POST",
    data,
  });
}

export function updateMeeting(data: MeetingSaveRequest & { id: number }) {
  return request({
    url: `${meetingBaseUrl}/update`,
    method: "POST",
    data,
  });
}

export function deleteMeeting(data: { ids: number[] }) {
  return request({
    url: `${meetingBaseUrl}/delete`,
    method: "POST",
    data,
  });
}

export function checkInMeeting(data: MeetingCheckInRequest) {
  return request({
    url: `${meetingBaseUrl}/checkIn`,
    method: "POST",
    data,
  });
}
