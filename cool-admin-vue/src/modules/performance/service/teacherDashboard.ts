/**
 * 班主任化首页看板前端请求服务。
 * 这里只封装主题19冻结的 teacherDashboard summary 接口，
 * 不负责待办、资源或班级列表请求。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeTeacherDashboardSummary } from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type { TeacherDashboardSummary, TeacherDashboardSummaryQuery } from '../types';

export default class PerformanceTeacherDashboardService extends BaseService {
	permission = PERMISSIONS.performance.teacherDashboard;

	constructor() {
		super('admin/performance/teacherDashboard');
	}

	fetchSummary(params?: TeacherDashboardSummaryQuery) {
		return asPerformanceServicePromise<TeacherDashboardSummary>(
			this.request({
				url: '/summary',
				method: 'GET',
				params
			}),
			decodeTeacherDashboardSummary
		);
	}
}

export const performanceTeacherDashboardService = new PerformanceTeacherDashboardService();
