/**
 * 培训课程前端请求服务。
 * 这里只封装主题 7 的 course 主链和报名摘要只读查询，不负责培训全域扩展能力。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeCourseEnrollmentPageResult,
	decodeCoursePageResult,
	decodeCourseRecord
} from './course-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	CourseCreatePayload,
	CourseEnrollmentPageQuery,
	CourseEnrollmentPageResult,
	CourseInfoQuery,
	CoursePageQuery,
	CoursePageResult,
	CourseRecord,
	CourseRemovePayload,
	CourseUpdatePayload
} from '../types';

export default class PerformanceCourseService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.course.page,
		info: PERMISSIONS.performance.course.info,
		add: PERMISSIONS.performance.course.add,
		update: PERMISSIONS.performance.course.update,
		delete: PERMISSIONS.performance.course.delete,
		enrollmentPage: PERMISSIONS.performance.course.enrollmentPage
	};

	constructor() {
		super('admin/performance/course');
	}

	fetchPage(data: CoursePageQuery) {
		return asPerformanceServicePromise<CoursePageResult>(
			super.page(data),
			decodeCoursePageResult
		);
	}

	fetchInfo(params: CourseInfoQuery) {
		return asPerformanceServicePromise<CourseRecord>(super.info(params), decodeCourseRecord);
	}

	createCourse(data: CourseCreatePayload) {
		return asPerformanceServicePromise<CourseRecord>(super.add(data), decodeCourseRecord);
	}

	updateCourse(data: CourseUpdatePayload) {
		return asPerformanceServicePromise<CourseRecord>(super.update(data), decodeCourseRecord);
	}

	removeCourse(data: CourseRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}

	fetchEnrollmentPage(data: CourseEnrollmentPageQuery) {
		return asPerformanceServicePromise<CourseEnrollmentPageResult>(
			this.request({
				url: '/enrollmentPage',
				method: 'POST',
				data
			}),
			decodeCourseEnrollmentPageResult
		);
	}
}

export const performanceCourseService = new PerformanceCourseService();
