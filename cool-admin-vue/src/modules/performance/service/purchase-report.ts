/**
 * 采购报表前端请求服务。
 * 这里只封装主题11扩容冻结后的 summary/trend/supplierStats 三个只读接口，
 * 不负责图表渲染、导出、付款分析或库存总账联动。
 */
import { BaseService } from '/@/cool';
import type {
	PurchaseReportSummary,
	PurchaseReportSupplierStat,
	PurchaseReportTrendPoint
} from '../types';

export interface PurchaseReportQuery {
	departmentId?: number;
	supplierId?: number;
	startDate?: string;
	endDate?: string;
}

export default class PerformancePurchaseReportService extends BaseService {
	permission = {
		summary: 'performance:purchaseReport:summary',
		trend: 'performance:purchaseReport:trend',
		supplierStats: 'performance:purchaseReport:supplierStats'
	};

	constructor() {
		super('admin/performance/purchaseReport');
	}

	fetchSummary(params?: PurchaseReportQuery) {
		return this.request({
			url: '/summary',
			method: 'GET',
			params
		}) as unknown as Promise<PurchaseReportSummary>;
	}

	fetchTrend(params?: PurchaseReportQuery) {
		return this.request({
			url: '/trend',
			method: 'GET',
			params
		}) as unknown as Promise<PurchaseReportTrendPoint[]>;
	}

	fetchSupplierStats(params?: PurchaseReportQuery) {
		return this.request({
			url: '/supplierStats',
			method: 'GET',
			params
		}) as unknown as Promise<PurchaseReportSupplierStat[]>;
	}
}

export const performancePurchaseReportService = new PerformancePurchaseReportService();
