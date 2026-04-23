import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeInterviewPageResult, decodeInterviewRecord } from './interview-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	DeleteIdsRequest,
	InterviewInfoQuery,
	InterviewPageQuery,
	InterviewPageResult,
	InterviewRecord,
	InterviewSaveRequest
} from '../types';

/**
 * 招聘面试前端请求服务。
 * 这里只封装主题 8 冻结的 interview page/info/add/update/delete 五个接口，
 * 不负责招聘计划、简历池、录用管理或任何敏感候选人信息补取。
 */
export default class PerformanceInterviewService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.interview.page,
		info: PERMISSIONS.performance.interview.info,
		add: PERMISSIONS.performance.interview.add,
		update: PERMISSIONS.performance.interview.update,
		delete: PERMISSIONS.performance.interview.delete
	};

	constructor() {
		super('admin/performance/interview');
	}

	fetchPage(data: InterviewPageQuery) {
		return asPerformanceServicePromise<InterviewPageResult>(
			super.page(data),
			decodeInterviewPageResult
		);
	}

	fetchInfo(params: InterviewInfoQuery) {
		return asPerformanceServicePromise<InterviewRecord>(
			super.info(params),
			decodeInterviewRecord
		);
	}

	createInterview(data: InterviewSaveRequest) {
		return asPerformanceServicePromise<InterviewRecord>(super.add(data), decodeInterviewRecord);
	}

	updateInterview(data: InterviewSaveRequest & { id: number }) {
		return asPerformanceServicePromise<InterviewRecord>(
			super.update(data),
			decodeInterviewRecord
		);
	}

	removeInterview(data: DeleteIdsRequest) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceInterviewService = new PerformanceInterviewService();
