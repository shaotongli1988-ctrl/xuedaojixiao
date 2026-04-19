/**
 * 采购订单前端请求服务。
 * 这里只封装主题11扩容冻结后的 purchaseOrder 列表、详情、CRUD 与流程动作接口，
 * 不负责付款、对账、库存总账或其他采购域扩张。
 */
import { BaseService } from '/@/cool';
import type {
	PurchaseOrderPageResult,
	PurchaseOrderRecord,
	PurchaseOrderStatus
} from '../types';

export default class PerformancePurchaseOrderService extends BaseService {
	permission = {
		page: 'performance:purchaseOrder:page',
		info: 'performance:purchaseOrder:info',
		add: 'performance:purchaseOrder:add',
		update: 'performance:purchaseOrder:update',
		delete: 'performance:purchaseOrder:delete',
		submitInquiry: 'performance:purchaseOrder:submitInquiry',
		submitApproval: 'performance:purchaseOrder:submitApproval',
		approve: 'performance:purchaseOrder:approve',
		reject: 'performance:purchaseOrder:reject',
		receive: 'performance:purchaseOrder:receive',
		close: 'performance:purchaseOrder:close'
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
		status?: PurchaseOrderStatus;
		statusList?: PurchaseOrderStatus[];
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

	submitInquiry(data: { id: number; remark?: string }) {
		return this.request({
			url: '/submitInquiry',
			method: 'POST',
			data
		}) as unknown as Promise<PurchaseOrderRecord>;
	}

	submitApproval(data: { id: number; remark?: string }) {
		return this.request({
			url: '/submitApproval',
			method: 'POST',
			data
		}) as unknown as Promise<PurchaseOrderRecord>;
	}

	approve(data: { id: number; approvalRemark?: string }) {
		return this.request({
			url: '/approve',
			method: 'POST',
			data
		}) as unknown as Promise<PurchaseOrderRecord>;
	}

	reject(data: { id: number; approvalRemark?: string }) {
		return this.request({
			url: '/reject',
			method: 'POST',
			data
		}) as unknown as Promise<PurchaseOrderRecord>;
	}

	receive(data: { id: number; receivedQuantity?: number; receivedAt?: string; remark?: string }) {
		return this.request({
			url: '/receive',
			method: 'POST',
			data
		}) as unknown as Promise<PurchaseOrderRecord>;
	}

	close(data: { id: number; closedReason: string }) {
		return this.request({
			url: '/close',
			method: 'POST',
			data
		}) as unknown as Promise<PurchaseOrderRecord>;
	}
}

export const performancePurchaseOrderService = new PerformancePurchaseOrderService();
