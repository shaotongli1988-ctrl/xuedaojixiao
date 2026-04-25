/**
 * 主题 14 AI 练习前端请求服务。
 * 这里只封装课程关联的练习任务分页、详情与文本提交，不负责课程管理后台或扩展媒体提交协议。
 * 维护重点是首批只允许文本提交，并保持接口与权限键完全对齐冻结口径。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeCourseLearningPageResult,
	decodeCourseLearningTaskRecord
} from './course-learning-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	CourseLearningInfoQuery,
	CourseLearningPageQuery,
	CourseLearningPageResult,
	CourseLearningSubmitPayload,
	CourseLearningTaskRecord,
	CourseLearningTaskStatus
} from '../course-learning.types';

export default class PerformanceCoursePracticeService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.coursePractice.page,
		info: PERMISSIONS.performance.coursePractice.info,
		submit: PERMISSIONS.performance.coursePractice.submit
	};

	constructor() {
		super('admin/performance/coursePractice');
	}

	fetchPage(data: CourseLearningPageQuery) {
		return asPerformanceServicePromise<CourseLearningPageResult>(
			super.page(data),
			decodeCourseLearningPageResult
		);
	}

	fetchInfo(params: CourseLearningInfoQuery) {
		return asPerformanceServicePromise<CourseLearningTaskRecord>(
			super.info(params),
			decodeCourseLearningTaskRecord
		);
	}

	submitTask(data: CourseLearningSubmitPayload) {
		return asPerformanceServicePromise<CourseLearningTaskRecord>(
			this.request({
				url: '/submit',
				method: 'POST',
				data
			}),
			decodeCourseLearningTaskRecord
		);
	}
}

export const performanceCoursePracticeService = new PerformanceCoursePracticeService();
