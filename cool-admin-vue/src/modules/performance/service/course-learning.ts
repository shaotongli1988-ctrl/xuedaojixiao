/**
 * 课程学习与考试增强前端请求服务。
 * 这里只封装主题14冻结的背诵/练习/考试摘要接口，不负责课程 CRUD、独立 AI 平台或题库管理。
 */
import { BaseService } from '/@/cool';
import type {
	CourseExamSummaryRecord,
	CourseLearningTaskPageResult,
	CourseLearningTaskRecord
} from '../course-learning';

class PerformanceCourseReciteService extends BaseService {
	permission = {
		page: 'performance:courseRecite:page',
		info: 'performance:courseRecite:info',
		submit: 'performance:courseRecite:submit'
	};

	constructor() {
		super('admin/performance/courseRecite');
	}

	fetchPage(data: { page: number; size: number; courseId: number; status?: string }) {
		return this.request({
			url: '/page',
			method: 'POST',
			data
		}) as unknown as Promise<CourseLearningTaskPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<CourseLearningTaskRecord>;
	}

	submitTask(data: { id: number; submissionText: string }) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<CourseLearningTaskRecord>;
	}
}

class PerformanceCoursePracticeService extends BaseService {
	permission = {
		page: 'performance:coursePractice:page',
		info: 'performance:coursePractice:info',
		submit: 'performance:coursePractice:submit'
	};

	constructor() {
		super('admin/performance/coursePractice');
	}

	fetchPage(data: { page: number; size: number; courseId: number; status?: string }) {
		return this.request({
			url: '/page',
			method: 'POST',
			data
		}) as unknown as Promise<CourseLearningTaskPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<CourseLearningTaskRecord>;
	}

	submitTask(data: { id: number; submissionText: string }) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<CourseLearningTaskRecord>;
	}
}

class PerformanceCourseExamService extends BaseService {
	permission = {
		summary: 'performance:courseExam:summary'
	};

	constructor() {
		super('admin/performance/courseExam');
	}

	fetchSummary(params: { courseId: number }) {
		return this.request({
			url: '/summary',
			method: 'GET',
			params
		}) as unknown as Promise<CourseExamSummaryRecord>;
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
