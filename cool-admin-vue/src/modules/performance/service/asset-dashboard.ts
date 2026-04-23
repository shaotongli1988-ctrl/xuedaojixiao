/**
 * 资产首页前端请求服务。
 * 这里只封装主题20冻结的 assetDashboard summary 接口，
 * 不负责资产台账、单据列表或页面展示逻辑。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeAssetDashboardSummary } from './asset-dashboard-contract';
import type { AssetDashboardSummary } from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceAssetDashboardService extends BaseService {
	permission = {
		summary: PERMISSIONS.performance.assetDashboard.summary
	};

	constructor() {
		super('admin/performance/assetDashboard');
	}

	fetchSummary(params?: {
		departmentId?: number;
		category?: string;
		keyword?: string;
	}) {
		return asPerformanceServicePromise<AssetDashboardSummary>(
			this.request({
				url: '/summary',
				method: 'GET',
				params
			}),
			decodeAssetDashboardSummary
		);
	}
}

export const performanceAssetDashboardService = new PerformanceAssetDashboardService();
