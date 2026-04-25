/**
 * 会议管理前端请求服务。
 * 这里只封装主题 9 冻结的 meeting 主链接口，不负责会议驾驶舱、逐人签到或外部会议系统集成。
 * 维护重点是详情只消费摘要字段，签到动作只调用统一的 checkIn 接口。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeMeetingPageResult, decodeMeetingRecord } from './meeting-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	MeetingCheckInRequest,
	MeetingInfoQuery,
	MeetingPageQuery,
	MeetingPageResult,
	MeetingRemovePayload,
	MeetingRecord,
	MeetingSaveRequest
} from '../types';

export default class PerformanceMeetingService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.meeting.page,
		info: PERMISSIONS.performance.meeting.info,
		add: PERMISSIONS.performance.meeting.add,
		update: PERMISSIONS.performance.meeting.update,
		delete: PERMISSIONS.performance.meeting.delete,
		checkIn: PERMISSIONS.performance.meeting.checkIn
	};

	constructor() {
		super('admin/performance/meeting');
	}

	fetchPage(data: MeetingPageQuery) {
		return asPerformanceServicePromise<MeetingPageResult>(
			super.page(data),
			decodeMeetingPageResult
		);
	}

	fetchInfo(params: MeetingInfoQuery) {
		return asPerformanceServicePromise<MeetingRecord>(super.info(params), decodeMeetingRecord);
	}

	createMeeting(data: MeetingSaveRequest) {
		return asPerformanceServicePromise<MeetingRecord>(super.add(data), decodeMeetingRecord);
	}

	updateMeeting(data: MeetingSaveRequest & { id: number }) {
		return asPerformanceServicePromise<MeetingRecord>(super.update(data), decodeMeetingRecord);
	}

	removeMeeting(data: MeetingRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}

	checkIn(data: MeetingCheckInRequest) {
		return asPerformanceServicePromise<MeetingRecord>(
			this.request({
				url: '/checkIn',
				method: 'POST',
				data
			}),
			decodeMeetingRecord
		);
	}
}

export const performanceMeetingService = new PerformanceMeetingService();
