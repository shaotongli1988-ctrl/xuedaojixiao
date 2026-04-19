/**
 * 资产首页前端请求服务。
 * 这里只封装主题20冻结的 assetDashboard summary 接口，
 * 不负责资产台账、单据列表或页面展示逻辑。
 */
import { BaseService } from '/@/cool';
import type { AssetDashboardSummary } from '../types';

export default class PerformanceAssetDashboardService extends BaseService {
	permission = {
		summary: 'performance:assetDashboard:summary'
	};

	constructor() {
		super('admin/performance/assetDashboard');
	}

	fetchSummary(params?: {
		departmentId?: number;
		category?: string;
		keyword?: string;
	}) {
		return this.request({
			url: '/summary',
			method: 'GET',
			params
		}) as unknown as Promise<AssetDashboardSummary>;
	}
}

export const performanceAssetDashboardService = new PerformanceAssetDashboardService();
