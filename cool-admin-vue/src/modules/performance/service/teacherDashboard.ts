/**
 * 班主任化首页看板前端请求服务。
 * 这里只封装主题19冻结的 teacherDashboard summary 接口，
 * 不负责待办、资源或班级列表请求。
 */
import { BaseService } from '/@/cool';
import type { TeacherDashboardSummary } from '../types';

export default class PerformanceTeacherDashboardService extends BaseService {
	permission = {
		summary: 'performance:teacherDashboard:summary'
	};

	constructor() {
		super('admin/performance/teacherDashboard');
	}

	fetchSummary(params?: Record<string, unknown>) {
		return this.request({
			url: '/summary',
			method: 'GET',
			params
		}) as unknown as Promise<TeacherDashboardSummary>;
	}
}

export const performanceTeacherDashboardService = new PerformanceTeacherDashboardService();
