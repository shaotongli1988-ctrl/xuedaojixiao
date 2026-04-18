/**
 * 会议管理前端请求服务。
 * 这里只封装主题 9 冻结的 meeting 主链接口，不负责会议驾驶舱、逐人签到或外部会议系统集成。
 * 维护重点是详情只消费摘要字段，签到动作只调用统一的 checkIn 接口。
 */
import { BaseService } from '/@/cool';
import type { MeetingPageResult, MeetingRecord } from '../types';

export default class PerformanceMeetingService extends BaseService {
	permission = {
		page: 'performance:meeting:page',
		info: 'performance:meeting:info',
		add: 'performance:meeting:add',
		update: 'performance:meeting:update',
		delete: 'performance:meeting:delete',
		checkIn: 'performance:meeting:checkIn'
	};

	constructor() {
		super('admin/performance/meeting');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<MeetingPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<MeetingRecord>;
	}

	createMeeting(data: Partial<MeetingRecord>) {
		return super.add(data) as unknown as Promise<MeetingRecord>;
	}

	updateMeeting(data: Partial<MeetingRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<MeetingRecord>;
	}

	removeMeeting(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}

	checkIn(data: { id: number }) {
		return this.request({
			url: '/checkIn',
			method: 'POST',
			data
		}) as unknown as Promise<MeetingRecord>;
	}
}

export const performanceMeetingService = new PerformanceMeetingService();
