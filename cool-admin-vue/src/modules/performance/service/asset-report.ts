/**
 * 资产报表前端请求服务。
 * 这里只封装主题20冻结的 assetReport summary/page/export 接口，
 * 不负责报表展示、图表渲染或下载后的文件处理。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssetReportExportResult,
	decodeAssetReportPageResult,
	decodeAssetReportSummary
} from './asset-report-contract';
import type {
	AssetReportExportQuery,
	AssetReportExportResult,
	AssetReportPageQuery,
	AssetReportPageResult,
	AssetReportSummary,
	AssetReportSummaryQuery
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceAssetReportService extends BaseService {
	permission = {
		summary: PERMISSIONS.performance.assetReport.summary,
		page: PERMISSIONS.performance.assetReport.page,
		export: PERMISSIONS.performance.assetReport.export
	};

	constructor() {
		super('admin/performance/assetReport');
	}

	fetchSummary(params?: AssetReportSummaryQuery) {
		return asPerformanceServicePromise<AssetReportSummary>(
			this.request({
				url: '/summary',
				method: 'GET',
				params
			}),
			decodeAssetReportSummary
		);
	}

	fetchPage(data: AssetReportPageQuery) {
		return asPerformanceServicePromise<AssetReportPageResult>(
			super.page(data),
			decodeAssetReportPageResult
		);
	}

	exportReport(params?: AssetReportExportQuery) {
		return asPerformanceServicePromise<AssetReportExportResult>(
			this.request({
				url: '/export',
				method: 'GET',
				params
			}),
			decodeAssetReportExportResult
		);
	}
}

export const performanceAssetReportService = new PerformanceAssetReportService();
