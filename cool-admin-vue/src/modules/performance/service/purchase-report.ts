/**
 * 采购报表前端请求服务。
 * 这里只封装主题11扩容冻结后的 summary/trend/supplierStats 三个只读接口，
 * 不负责图表渲染、导出、付款分析或库存总账联动。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodePurchaseReportSummary,
	decodePurchaseReportSupplierStats,
	decodePurchaseReportTrendPoints
} from './purchase-report-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	PurchaseReportQuery,
	PurchaseReportSummary,
	PurchaseReportSupplierStat,
	PurchaseReportTrendPoint
} from '../types';

export default class PerformancePurchaseReportService extends BaseService {
	permission = {
		summary: PERMISSIONS.performance.purchaseReport.summary,
		trend: PERMISSIONS.performance.purchaseReport.trend,
		supplierStats: PERMISSIONS.performance.purchaseReport.supplierStats
	};

	constructor() {
		super('admin/performance/purchaseReport');
	}

	fetchSummary(params?: PurchaseReportQuery) {
		return asPerformanceServicePromise<PurchaseReportSummary>(
			this.request({
				url: '/summary',
				method: 'GET',
				params
			}),
			decodePurchaseReportSummary
		);
	}

	fetchTrend(params?: PurchaseReportQuery) {
		return asPerformanceServicePromise<PurchaseReportTrendPoint[]>(
			this.request({
				url: '/trend',
				method: 'GET',
				params
			}),
			decodePurchaseReportTrendPoints
		);
	}

	fetchSupplierStats(params?: PurchaseReportQuery) {
		return asPerformanceServicePromise<PurchaseReportSupplierStat[]>(
			this.request({
				url: '/supplierStats',
				method: 'GET',
				params
			}),
			decodePurchaseReportSupplierStats
		);
	}
}

export const performancePurchaseReportService = new PerformancePurchaseReportService();
