/**
 * 培训课程前端请求服务。
 * 这里只封装主题 7 的 course 主链和报名摘要只读查询，不负责培训全域扩展能力。
 */
import { BaseService } from '/@/cool';
import type {
	CourseEnrollmentPageResult,
	CoursePageResult,
	CourseRecord
} from '../types';

export default class PerformanceCourseService extends BaseService {
	permission = {
		page: 'performance:course:page',
		info: 'performance:course:info',
		add: 'performance:course:add',
		update: 'performance:course:update',
		delete: 'performance:course:delete',
		enrollmentPage: 'performance:course:enrollmentPage'
	};

	constructor() {
		super('admin/performance/course');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<CoursePageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<CourseRecord>;
	}

	createCourse(data: Partial<CourseRecord>) {
		return super.add(data) as unknown as Promise<CourseRecord>;
	}

	updateCourse(data: Partial<CourseRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<CourseRecord>;
	}

	removeCourse(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}

	fetchEnrollmentPage(data: {
		page: number;
		size: number;
		courseId: number;
		keyword?: string;
		status?: string;
	}) {
		return this.request({
			url: '/enrollmentPage',
			method: 'POST',
			data
		}) as unknown as Promise<CourseEnrollmentPageResult>;
	}
}

export const performanceCourseService = new PerformanceCourseService();
