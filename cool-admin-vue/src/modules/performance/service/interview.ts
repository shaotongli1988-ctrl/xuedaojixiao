import { BaseService } from '/@/cool';
import type { InterviewPageResult, InterviewRecord } from '../types';

/**
 * 招聘面试前端请求服务。
 * 这里只封装主题 8 冻结的 interview page/info/add/update/delete 五个接口，
 * 不负责招聘计划、简历池、录用管理或任何敏感候选人信息补取。
 */
export default class PerformanceInterviewService extends BaseService {
	permission = {
		page: 'performance:interview:page',
		info: 'performance:interview:info',
		add: 'performance:interview:add',
		update: 'performance:interview:update',
		delete: 'performance:interview:delete'
	};

	constructor() {
		super('admin/performance/interview');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<InterviewPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<InterviewRecord>;
	}

	createInterview(data: InterviewRecord) {
		return super.add(data) as unknown as Promise<InterviewRecord>;
	}

	updateInterview(data: InterviewRecord) {
		return super.update(data) as unknown as Promise<InterviewRecord>;
	}

	removeInterview(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performanceInterviewService = new PerformanceInterviewService();
