/**
 * 资产报表前端请求服务。
 * 这里只封装主题20冻结的 assetReport summary/page/export 接口，
 * 不负责报表展示、图表渲染或下载后的文件处理。
 */
import { BaseService } from '/@/cool';
import type { AssetReportPageResult, AssetReportSummary } from '../types';

export default class PerformanceAssetReportService extends BaseService {
	permission = {
		summary: 'performance:assetReport:summary',
		page: 'performance:assetReport:page',
		export: 'performance:assetReport:export'
	};

	constructor() {
		super('admin/performance/assetReport');
	}

	fetchSummary(params?: {
		departmentId?: number;
		category?: string;
		assetStatus?: string;
		reportDate?: string;
	}) {
		return this.request({
			url: '/summary',
			method: 'GET',
			params
		}) as unknown as Promise<AssetReportSummary>;
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		departmentId?: number;
		category?: string;
		assetStatus?: string;
		reportDate?: string;
	}) {
		return super.page(data) as unknown as Promise<AssetReportPageResult>;
	}

	exportReport(params?: {
		departmentId?: number;
		category?: string;
		assetStatus?: string;
		reportDate?: string;
	}) {
		return this.request({
			url: '/export',
			method: 'GET',
			params
		}) as Promise<any>;
	}
}

export const performanceAssetReportService = new PerformanceAssetReportService();
