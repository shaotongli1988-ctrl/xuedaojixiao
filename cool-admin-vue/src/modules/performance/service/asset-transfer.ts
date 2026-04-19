/**
 * 资产调拨前端请求服务。
 * 这里只封装主题20冻结的 assetTransfer 标准接口，
 * 不负责资产盘点、报废或跨主题物流能力。
 */
import { BaseService } from '/@/cool';
import type { AssetTransferPageResult, AssetTransferRecord } from '../types';

export default class PerformanceAssetTransferService extends BaseService {
	permission = {
		page: 'performance:assetTransfer:page',
		info: 'performance:assetTransfer:info',
		add: 'performance:assetTransfer:add',
		update: 'performance:assetTransfer:update',
		submit: 'performance:assetTransfer:submit',
		complete: 'performance:assetTransfer:complete',
		cancel: 'performance:assetTransfer:cancel'
	};

	constructor() {
		super('admin/performance/assetTransfer');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		status?: AssetTransferRecord['status'];
		fromDepartmentId?: number;
		toDepartmentId?: number;
	}) {
		return super.page(data) as unknown as Promise<AssetTransferPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<AssetTransferRecord>;
	}

	createTransfer(data: Partial<AssetTransferRecord>) {
		return super.add(data) as unknown as Promise<AssetTransferRecord>;
	}

	updateTransfer(data: Partial<AssetTransferRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<AssetTransferRecord>;
	}

	submitTransfer(data: { id: number }) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<AssetTransferRecord>;
	}

	completeTransfer(data: { id: number; completeTime?: string }) {
		return this.request({
			url: '/complete',
			method: 'POST',
			data
		}) as unknown as Promise<AssetTransferRecord>;
	}

	cancelTransfer(data: { id: number; remark?: string }) {
		return this.request({
			url: '/cancel',
			method: 'POST',
			data
		}) as unknown as Promise<AssetTransferRecord>;
	}
}

export const performanceAssetTransferService = new PerformanceAssetTransferService();
