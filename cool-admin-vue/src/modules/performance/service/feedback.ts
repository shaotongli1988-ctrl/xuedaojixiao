/**
 * 模块 5 统一前端服务入口。
 * 这里只封装 360 环评的事实接口与权限键，不负责页面统计、角色推断或本地补算。
 * 维护重点是 page/info/add/submit/summary 五个接口必须与后端契约保持同名同义。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeFeedbackExportRows,
	decodeFeedbackPageResult,
	decodeFeedbackSummary,
	decodeFeedbackTaskRecord
} from './feedback-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	FeedbackExportRow,
	FeedbackExportQuery,
	FeedbackInfoQuery,
	FeedbackPageQuery,
	FeedbackPageResult,
	FeedbackSubmitPayload,
	FeedbackSummary,
	FeedbackSummaryQuery,
	FeedbackTaskRecord
} from '../types';

/**
 * 360 环评前端请求服务。
 * 这里只封装模块 5 的统一接口，不负责页面内统计、权限判断或本地补算。
 * 维护重点是所有任务、提交和汇总数据都必须来自后端事实接口。
 */
export default class PerformanceFeedbackService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.feedback.page,
		info: PERMISSIONS.performance.feedback.info,
		add: PERMISSIONS.performance.feedback.add,
		submit: PERMISSIONS.performance.feedback.submit,
		summary: PERMISSIONS.performance.feedback.summary,
		export: PERMISSIONS.performance.feedback.export
	};

	constructor() {
		super('admin/performance/feedback');
	}

	fetchPage(data: FeedbackPageQuery) {
		return asPerformanceServicePromise<FeedbackPageResult>(
			super.page(data),
			decodeFeedbackPageResult
		);
	}

	fetchInfo(params: FeedbackInfoQuery) {
		return asPerformanceServicePromise<FeedbackTaskRecord>(
			super.info(params),
			decodeFeedbackTaskRecord
		);
	}

	createTask(data: FeedbackTaskRecord) {
		return asPerformanceServicePromise<FeedbackTaskRecord>(
			super.add(data),
			decodeFeedbackTaskRecord
		);
	}

	submitFeedback(data: FeedbackSubmitPayload) {
		return asPerformanceServicePromise<FeedbackTaskRecord>(
			this.request({
				url: '/submit',
				method: 'POST',
				data
			}),
			decodeFeedbackTaskRecord
		);
	}

	fetchSummary(params: FeedbackSummaryQuery) {
		return asPerformanceServicePromise<FeedbackSummary>(
			this.request({
				url: '/summary',
				method: 'GET',
				params: {
					id: params.taskId
				}
			}),
			decodeFeedbackSummary
		);
	}

	exportSummary(data: FeedbackExportQuery) {
		return asPerformanceServicePromise<FeedbackExportRow[]>(
			this.request({
				url: '/export',
				method: 'POST',
				data
			}),
			decodeFeedbackExportRows
		);
	}
}

export const performanceFeedbackService = new PerformanceFeedbackService();
