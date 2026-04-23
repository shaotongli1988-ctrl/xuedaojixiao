/**
 * 采购订单前端请求服务。
 * 这里只封装主题11扩容冻结后的 purchaseOrder 列表、详情、CRUD 与流程动作接口，
 * 不负责付款、对账、库存总账或其他采购域扩张。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodePurchaseOrderPageResult,
	decodePurchaseOrderRecord
} from './purchase-order-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	PurchaseOrderApprovePayload,
	PurchaseOrderClosePayload,
	PurchaseOrderCreatePayload,
	PurchaseOrderInfoQuery,
	PurchaseOrderPageQuery,
	PurchaseOrderPageResult,
	PurchaseOrderRecord,
	PurchaseOrderReceivePayload,
	PurchaseOrderRejectPayload,
	PurchaseOrderRemovePayload,
	PurchaseOrderSubmitApprovalPayload,
	PurchaseOrderSubmitInquiryPayload,
	PurchaseOrderUpdatePayload
} from '../types';

export default class PerformancePurchaseOrderService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.purchaseOrder.page,
		info: PERMISSIONS.performance.purchaseOrder.info,
		add: PERMISSIONS.performance.purchaseOrder.add,
		update: PERMISSIONS.performance.purchaseOrder.update,
		delete: PERMISSIONS.performance.purchaseOrder.delete,
		submitInquiry: PERMISSIONS.performance.purchaseOrder.submitInquiry,
		submitApproval: PERMISSIONS.performance.purchaseOrder.submitApproval,
		approve: PERMISSIONS.performance.purchaseOrder.approve,
		reject: PERMISSIONS.performance.purchaseOrder.reject,
		receive: PERMISSIONS.performance.purchaseOrder.receive,
		close: PERMISSIONS.performance.purchaseOrder.close
	};

	constructor() {
		super('admin/performance/purchaseOrder');
	}

	fetchPage(data: PurchaseOrderPageQuery) {
		return asPerformanceServicePromise<PurchaseOrderPageResult>(
			super.page(data),
			decodePurchaseOrderPageResult
		);
	}

	fetchInfo(params: PurchaseOrderInfoQuery) {
		return asPerformanceServicePromise<PurchaseOrderRecord>(
			super.info(params),
			decodePurchaseOrderRecord
		);
	}

	createPurchaseOrder(data: PurchaseOrderCreatePayload) {
		return asPerformanceServicePromise<PurchaseOrderRecord>(
			super.add(data),
			decodePurchaseOrderRecord
		);
	}

	updatePurchaseOrder(data: PurchaseOrderUpdatePayload) {
		return asPerformanceServicePromise<PurchaseOrderRecord>(
			super.update(data),
			decodePurchaseOrderRecord
		);
	}

	removePurchaseOrder(data: PurchaseOrderRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}

	submitInquiry(data: PurchaseOrderSubmitInquiryPayload) {
		return asPerformanceServicePromise<PurchaseOrderRecord>(this.request({
			url: '/submitInquiry',
			method: 'POST',
			data
		}), decodePurchaseOrderRecord);
	}

	submitApproval(data: PurchaseOrderSubmitApprovalPayload) {
		return asPerformanceServicePromise<PurchaseOrderRecord>(this.request({
			url: '/submitApproval',
			method: 'POST',
			data
		}), decodePurchaseOrderRecord);
	}

	approve(data: PurchaseOrderApprovePayload) {
		return asPerformanceServicePromise<PurchaseOrderRecord>(this.request({
			url: '/approve',
			method: 'POST',
			data
		}), decodePurchaseOrderRecord);
	}

	reject(data: PurchaseOrderRejectPayload) {
		return asPerformanceServicePromise<PurchaseOrderRecord>(this.request({
			url: '/reject',
			method: 'POST',
			data
		}), decodePurchaseOrderRecord);
	}

	receive(data: PurchaseOrderReceivePayload) {
		return asPerformanceServicePromise<PurchaseOrderRecord>(this.request({
			url: '/receive',
			method: 'POST',
			data
		}), decodePurchaseOrderRecord);
	}

	close(data: PurchaseOrderClosePayload) {
		return asPerformanceServicePromise<PurchaseOrderRecord>(this.request({
			url: '/close',
			method: 'POST',
			data
		}), decodePurchaseOrderRecord);
	}
}

export const performancePurchaseOrderService = new PerformancePurchaseOrderService();
