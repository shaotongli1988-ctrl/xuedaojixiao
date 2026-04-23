/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance meeting.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

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
	participantIds?: Array<number>;
	status?: MeetingStatus;
}

export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface ApiResponse_MeetingRecord {
	code: number;
	message: string;
	data: MeetingRecord;
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

export interface MeetingCheckInRequest {
	id: number;
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_Void {
	code: number;
	message: string;
	data?: null;
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
	data: MeetingPageResult;
}

export interface MeetingPageResult {
	list: Array<MeetingRecord>;
	pagination: PagePagination;
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
