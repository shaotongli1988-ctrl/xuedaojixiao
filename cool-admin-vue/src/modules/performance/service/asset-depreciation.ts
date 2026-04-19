/**
 * 资产折旧前端请求服务。
 * 这里只封装主题20冻结的 assetDepreciation page/summary/recalculate 接口，
 * 不负责财务凭证、关账或会计扩展能力。
 */
import { BaseService } from '/@/cool';
import type {
	AssetDepreciationPageResult,
	AssetDepreciationSummary
} from '../types';

export default class PerformanceAssetDepreciationService extends BaseService {
	permission = {
		page: 'performance:assetDepreciation:page',
		summary: 'performance:assetDepreciation:summary',
		recalculate: 'performance:assetDepreciation:recalculate'
	};

	constructor() {
		super('admin/performance/assetDepreciation');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		depreciationMonth?: string;
		departmentId?: number;
	}) {
		return super.page(data) as unknown as Promise<AssetDepreciationPageResult>;
	}

	fetchSummary(params?: { depreciationMonth?: string; departmentId?: number }) {
		return this.request({
			url: '/summary',
			method: 'GET',
			params
		}) as unknown as Promise<AssetDepreciationSummary>;
	}

	recalculate(data: { depreciationMonth: string; departmentId?: number }) {
		return this.request({
			url: '/recalculate',
			method: 'POST',
			data
		}) as unknown as Promise<AssetDepreciationSummary>;
	}
}

export const performanceAssetDepreciationService = new PerformanceAssetDepreciationService();
