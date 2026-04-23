/**
 * 驾驶舱前端请求服务类型与接口封装。
 * 这里只维护绩效域 summary 与主题 6 crossSummary 的只读契约，
 * 不负责页面展示逻辑或其他绩效子模块请求。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeDashboardCrossSummary,
	decodeDashboardSummary
} from './dashboard-contract';
import type {
	DashboardCrossSummary,
	DashboardCrossSummaryQuery,
	DashboardSummary,
	DashboardSummaryQuery
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

/**
 * 驾驶舱前端请求服务。
 * 这里只封装模块 3 的汇总接口，不负责评估单、目标地图和其他绩效页面请求。
 */
export default class PerformanceDashboardService extends BaseService {
	permission = {
		summary: PERMISSIONS.performance.dashboard.summary,
		crossSummary: PERMISSIONS.performance.dashboard.crossSummary
	};

	constructor() {
		super('admin/performance/dashboard');
	}

	fetchSummary(params: DashboardSummaryQuery) {
		return asPerformanceServicePromise<DashboardSummary>(this.request({
			url: '/summary',
			method: 'GET',
			params
		}), decodeDashboardSummary);
	}

	fetchCrossSummary(params: DashboardCrossSummaryQuery) {
		return asPerformanceServicePromise<DashboardCrossSummary>(this.request({
			url: '/crossSummary',
			method: 'GET',
			params
		}), decodeDashboardCrossSummary);
	}
}

export const performanceDashboardService = new PerformanceDashboardService();
