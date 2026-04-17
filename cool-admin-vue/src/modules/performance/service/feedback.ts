/**
 * 模块 5 统一前端服务入口。
 * 这里只封装 360 环评的事实接口与权限键，不负责页面统计、角色推断或本地补算。
 * 维护重点是 page/info/add/submit/summary 五个接口必须与后端契约保持同名同义。
 */
import { BaseService } from '/@/cool';
import type {
	FeedbackPageResult,
	FeedbackSummary,
	FeedbackTaskRecord
} from '../types';

/**
 * 360 环评前端请求服务。
 * 这里只封装模块 5 的统一接口，不负责页面内统计、权限判断或本地补算。
 * 维护重点是所有任务、提交和汇总数据都必须来自后端事实接口。
 */
export default class PerformanceFeedbackService extends BaseService {
	permission = {
		page: 'performance:feedback:page',
		info: 'performance:feedback:info',
		add: 'performance:feedback:add',
		submit: 'performance:feedback:submit',
		summary: 'performance:feedback:summary'
	};

	constructor() {
		super('admin/performance/feedback');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<FeedbackPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<FeedbackTaskRecord>;
	}

	createTask(data: FeedbackTaskRecord) {
		return super.add(data) as unknown as Promise<FeedbackTaskRecord>;
	}

	submitFeedback(data: {
		taskId: number;
		score: number;
		content?: string;
		relationType: string;
	}) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<FeedbackTaskRecord>;
	}

	fetchSummary(params: { taskId: number }) {
		return this.request({
			url: '/summary',
			method: 'GET',
			params: {
				id: params.taskId
			}
		}) as unknown as Promise<FeedbackSummary>;
	}
}

export const performanceFeedbackService = new PerformanceFeedbackService();
