/**
 * 主题 14 AI 背诵前端请求服务。
 * 这里只封装课程关联的背诵任务分页、详情与文本提交，不负责课程入口、题库配置或 AI 厂商细节。
 * 维护重点是只使用冻结的 page/info/submit 三个接口与对应权限键。
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

export default class PerformanceCourseReciteService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.courseRecite.page,
		info: PERMISSIONS.performance.courseRecite.info,
		submit: PERMISSIONS.performance.courseRecite.submit
	};

	constructor() {
		super('admin/performance/courseRecite');
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

export const performanceCourseReciteService = new PerformanceCourseReciteService();
