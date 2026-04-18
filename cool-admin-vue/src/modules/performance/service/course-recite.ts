/**
 * 主题 14 AI 背诵前端请求服务。
 * 这里只封装课程关联的背诵任务分页、详情与文本提交，不负责课程入口、题库配置或 AI 厂商细节。
 * 维护重点是只使用冻结的 page/info/submit 三个接口与对应权限键。
 */
import { BaseService } from '/@/cool';
import type {
	CourseLearningPageResult,
	CourseLearningSubmitPayload,
	CourseLearningTaskRecord,
	CourseLearningTaskStatus
} from '../course-learning.types';

export default class PerformanceCourseReciteService extends BaseService {
	permission = {
		page: 'performance:courseRecite:page',
		info: 'performance:courseRecite:info',
		submit: 'performance:courseRecite:submit'
	};

	constructor() {
		super('admin/performance/courseRecite');
	}

	fetchPage(data: {
		page: number;
		size: number;
		courseId: number;
		status?: CourseLearningTaskStatus;
	}) {
		return super.page(data) as unknown as Promise<CourseLearningPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<CourseLearningTaskRecord>;
	}

	submitTask(data: CourseLearningSubmitPayload) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<CourseLearningTaskRecord>;
	}
}

export const performanceCourseReciteService = new PerformanceCourseReciteService();
