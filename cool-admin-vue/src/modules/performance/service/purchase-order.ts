/**
 * 采购订单前端请求服务。
 * 这里只封装主题11冻结的 purchaseOrder page/info/add/update/delete 五个接口，
 * 不负责采购计划、审批、收货、付款或其他扩展采购流。
 */
import { BaseService } from '/@/cool';
import type { PurchaseOrderPageResult, PurchaseOrderRecord } from '../types';

export default class PerformancePurchaseOrderService extends BaseService {
	permission = {
		page: 'performance:purchaseOrder:page',
		info: 'performance:purchaseOrder:info',
		add: 'performance:purchaseOrder:add',
		update: 'performance:purchaseOrder:update',
		delete: 'performance:purchaseOrder:delete'
	};

	constructor() {
		super('admin/performance/purchaseOrder');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		supplierId?: number;
		departmentId?: number;
		status?: string;
		startDate?: string;
		endDate?: string;
	}) {
		return super.page(data) as unknown as Promise<PurchaseOrderPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<PurchaseOrderRecord>;
	}

	createPurchaseOrder(data: Partial<PurchaseOrderRecord>) {
		return super.add(data) as unknown as Promise<PurchaseOrderRecord>;
	}

	updatePurchaseOrder(data: Partial<PurchaseOrderRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<PurchaseOrderRecord>;
	}

	removePurchaseOrder(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performancePurchaseOrderService = new PerformancePurchaseOrderService();
