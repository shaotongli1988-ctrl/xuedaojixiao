/**
 * 文件职责：封装 cool-uni 对会议管理移动页的列表与会议级签到访问；
 * 不负责会议编辑、逐人签到或复杂详情编排；
 * 维护重点是签到动作继续走 meeting checkIn 既有接口。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	MeetingCheckInRequest,
	MeetingInfoQuery,
	MeetingPageQuery,
	MeetingPageResult,
	MeetingRecord
} from "/@/types/performance-meeting";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceMeetingService {
	private requester = createServiceRequester("admin/performance/meeting");

	permission = {
		page: PERMISSIONS.performance.meeting.page,
		info: PERMISSIONS.performance.meeting.info,
		checkIn: PERMISSIONS.performance.meeting.checkIn,
	};

	fetchPage(data: MeetingPageQuery) {
		return this.requester.page(data) as Promise<MeetingPageResult>;
	}

	fetchInfo(params: MeetingInfoQuery) {
		return this.requester.info(params) as Promise<MeetingRecord>;
	}

	checkIn(data: MeetingCheckInRequest) {
		return this.requester.request({
			url: "/checkIn",
			method: "POST",
			data,
		}) as Promise<MeetingRecord>;
	}
}

export const performanceMeetingService = new PerformanceMeetingService();
