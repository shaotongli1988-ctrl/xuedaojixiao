/**
 * 课程学习与考试增强前端请求服务。
 * 这里只封装主题14冻结的背诵/练习/考试摘要接口，不负责课程 CRUD、独立 AI 平台或题库管理。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeCourseLearningPageResult,
	decodeCourseLearningTaskRecord
} from './course-learning-contract';
import { decodeCourseExamSummary } from './course-exam-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	CourseExamSummaryRecord,
	CourseExamSummaryQuery,
	CourseLearningInfoQuery,
	CourseLearningPageQuery,
	CourseLearningTaskPageResult,
	CourseLearningTaskRecord
} from '../course-learning';

class PerformanceCourseReciteService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.courseRecite.page,
		info: PERMISSIONS.performance.courseRecite.info,
		submit: PERMISSIONS.performance.courseRecite.submit
	};

	constructor() {
		super('admin/performance/courseRecite');
	}

	fetchPage(data: CourseLearningPageQuery) {
		return asPerformanceServicePromise<CourseLearningTaskPageResult>(
			this.request({
				url: '/page',
				method: 'POST',
				data
			}),
			decodeCourseLearningPageResult
		);
	}

	fetchInfo(params: CourseLearningInfoQuery) {
		return asPerformanceServicePromise<CourseLearningTaskRecord>(
			super.info(params),
			decodeCourseLearningTaskRecord
		);
	}

	submitTask(data: { id: number; submissionText: string }) {
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

class PerformanceCoursePracticeService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.coursePractice.page,
		info: PERMISSIONS.performance.coursePractice.info,
		submit: PERMISSIONS.performance.coursePractice.submit
	};

	constructor() {
		super('admin/performance/coursePractice');
	}

	fetchPage(data: CourseLearningPageQuery) {
		return asPerformanceServicePromise<CourseLearningTaskPageResult>(
			this.request({
				url: '/page',
				method: 'POST',
				data
			}),
			decodeCourseLearningPageResult
		);
	}

	fetchInfo(params: CourseLearningInfoQuery) {
		return asPerformanceServicePromise<CourseLearningTaskRecord>(
			super.info(params),
			decodeCourseLearningTaskRecord
		);
	}

	submitTask(data: { id: number; submissionText: string }) {
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

class PerformanceCourseExamService extends BaseService {
	permission = {
		summary: PERMISSIONS.performance.courseExam.summary
	};

	constructor() {
		super('admin/performance/courseExam');
	}

	fetchSummary(params: CourseExamSummaryQuery) {
		return asPerformanceServicePromise<CourseExamSummaryRecord>(
			this.request({
				url: '/summary',
				method: 'GET',
				params
			}),
			decodeCourseExamSummary
		);
	}
}

export const performanceCourseReciteService = new PerformanceCourseReciteService();
export const performanceCoursePracticeService = new PerformanceCoursePracticeService();
export const performanceCourseExamService = new PerformanceCourseExamService();

/**
 * 提供给模块自动装载器的默认服务导出。
 * 这里只占位主题14服务命名空间，不承载额外请求封装。
 */
export default class PerformanceCourseLearningRegistryService extends BaseService {
	constructor() {
		super('admin/performance/courseLearning');
	}
}
