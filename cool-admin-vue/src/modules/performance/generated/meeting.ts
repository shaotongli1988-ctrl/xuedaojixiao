/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance meeting.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface MeetingSaveRequest {
	id?: number;
	title: string;
	code?: string;
	type?: string;
	description?: string;
	startDate: string;
	endDate: string;
	location?: string;
	organizerId: number;
	participantIds?: Array<number>;
	status?: MeetingStatus;
}

export type MeetingStatus = "cancelled" | "completed" | "scheduled" | "in_progress";

export interface ApiResponse_MeetingRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  createTime?: string;
  updateTime?: string;
  title: string;
  startDate: string;
  endDate: string;
  participantCount?: number;
  participantIds?: Array<number>;
} & {
  code?: string;
  type?: string;
  description?: string;
  location?: string;
  organizerId: number;
  organizerName?: string;
  participantIds?: Array<number>;
  status?: MeetingStatus;
};
}

export interface MeetingCheckInRequest {
	id: number;
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_MeetingRemoveMeetingResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface MeetingInfoQuery {
	id: number;
}

export interface MeetingPageQuery {
	page: number;
	size: number;
	keyword?: string;
	status?: MeetingStatus;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_MeetingPageResult {
	code: number;
	message: string;
	data: {
  pagination: PagePagination;
} & {
  list: Array<MeetingRecord>;
};
}

export interface PagePagination {
	/**
	 * 页码
	 */
	page: number;
	/**
	 * 页大小
	 */
	size: number;
	/**
	 * 总数
	 */
	total: number;
}

export type MeetingRecord = {
  id?: number;
  createTime?: string;
  updateTime?: string;
  title: string;
  startDate: string;
  endDate: string;
  participantCount?: number;
  participantIds?: Array<number>;
} & {
  code?: string;
  type?: string;
  description?: string;
  location?: string;
  organizerId: number;
  organizerName?: string;
  participantIds?: Array<number>;
  status?: MeetingStatus;
};

export type MeetingUpdateMeetingRequest = MeetingSaveRequest & {
  id: number;
};
