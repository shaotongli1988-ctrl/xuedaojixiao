/**
 * 主题 14 AI 练习前端请求服务。
 * 这里只封装课程关联的练习任务分页、详情与文本提交，不负责课程管理后台或扩展媒体提交协议。
 * 维护重点是首批只允许文本提交，并保持接口与权限键完全对齐冻结口径。
 */
import { BaseService } from '/@/cool';
import type {
	CourseLearningPageResult,
	CourseLearningSubmitPayload,
	CourseLearningTaskRecord,
	CourseLearningTaskStatus
} from '../course-learning.types';

export default class PerformanceCoursePracticeService extends BaseService {
	permission = {
		page: 'performance:coursePractice:page',
		info: 'performance:coursePractice:info',
		submit: 'performance:coursePractice:submit'
	};

	constructor() {
		super('admin/performance/coursePractice');
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

export const performanceCoursePracticeService = new PerformanceCoursePracticeService();
