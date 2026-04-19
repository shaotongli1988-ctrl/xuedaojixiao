/**
 * 资产采购入库前端请求服务。
 * 这里只封装主题20冻结的 assetProcurement 标准接口，
 * 不负责主题11采购订单审批链或供应商主数据中心。
 */
import { BaseService } from '/@/cool';
import type { AssetProcurementPageResult, AssetProcurementRecord } from '../types';

export default class PerformanceAssetProcurementService extends BaseService {
	permission = {
		page: 'performance:assetProcurement:page',
		info: 'performance:assetProcurement:info',
		add: 'performance:assetProcurement:add',
		update: 'performance:assetProcurement:update',
		submit: 'performance:assetProcurement:submit',
		receive: 'performance:assetProcurement:receive',
		cancel: 'performance:assetProcurement:cancel'
	};

	constructor() {
		super('admin/performance/assetProcurement');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		status?: AssetProcurementRecord['status'];
		departmentId?: number;
		requesterId?: number;
	}) {
		return super.page(data) as unknown as Promise<AssetProcurementPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<AssetProcurementRecord>;
	}

	createProcurement(data: Partial<AssetProcurementRecord>) {
		return super.add(data) as unknown as Promise<AssetProcurementRecord>;
	}

	updateProcurement(data: Partial<AssetProcurementRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<AssetProcurementRecord>;
	}

	submitProcurement(data: { id: number }) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<AssetProcurementRecord>;
	}

	receiveProcurement(data: { id: number; receiveDate?: string }) {
		return this.request({
			url: '/receive',
			method: 'POST',
			data
		}) as unknown as Promise<AssetProcurementRecord>;
	}

	cancelProcurement(data: { id: number; remark?: string }) {
		return this.request({
			url: '/cancel',
			method: 'POST',
			data
		}) as unknown as Promise<AssetProcurementRecord>;
	}
}

export const performanceAssetProcurementService = new PerformanceAssetProcurementService();
