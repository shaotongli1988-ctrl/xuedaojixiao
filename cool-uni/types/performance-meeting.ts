/**
 * cool-uni 会议管理移动页类型与前端状态文案。
 * 这里只定义会议列表和会议级签到最小结构，不处理逐人签到、复杂详情抽屉或会议全文展示。
 */
import type { MeetingRecord } from "/@/generated/performance-meeting.generated";

export type {
	MeetingCheckInRequest,
	MeetingPageQuery,
	MeetingPageResult,
	MeetingRecord,
	MeetingSaveRequest,
	MeetingStatus,
} from "/@/generated/performance-meeting.generated";

export interface MeetingInfoQuery {
	id: number;
}

export function canMeetingCheckIn(record?: MeetingRecord | null) {
	return Boolean(record?.id && String(record?.status || "") === "in_progress");
}
