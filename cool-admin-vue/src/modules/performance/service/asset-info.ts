/**
 * 资产台账前端请求服务。
 * 这里只封装主题20冻结的 assetInfo 标准接口，
 * 不负责领用、维护、调拨、盘点或报废流程。
 */
import { BaseService } from '/@/cool';
import type { AssetInfoPageResult, AssetInfoRecord, AssetStatus } from '../types';

export default class PerformanceAssetInfoService extends BaseService {
	permission = {
		page: 'performance:assetInfo:page',
		info: 'performance:assetInfo:info',
		add: 'performance:assetInfo:add',
		update: 'performance:assetInfo:update',
		delete: 'performance:assetInfo:delete',
		updateStatus: 'performance:assetInfo:updateStatus'
	};

	constructor() {
		super('admin/performance/assetInfo');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		category?: string;
		assetStatus?: AssetStatus;
		departmentId?: number;
		managerId?: number;
	}) {
		return super.page(data) as unknown as Promise<AssetInfoPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<AssetInfoRecord>;
	}

	createAsset(data: Partial<AssetInfoRecord>) {
		return super.add(data) as unknown as Promise<AssetInfoRecord>;
	}

	updateAsset(data: Partial<AssetInfoRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<AssetInfoRecord>;
	}

	removeAsset(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}

	updateAssetStatus(data: { id: number; assetStatus: AssetStatus; remark?: string }) {
		return this.request({
			url: '/updateStatus',
			method: 'POST',
			data
		}) as unknown as Promise<AssetInfoRecord>;
	}
}

export const performanceAssetInfoService = new PerformanceAssetInfoService();
