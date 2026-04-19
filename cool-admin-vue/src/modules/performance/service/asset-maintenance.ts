/**
 * 资产维护保养前端请求服务。
 * 这里只封装主题20冻结的 assetMaintenance 标准接口，
 * 不负责资产折旧、报废或财务扩展能力。
 */
import { BaseService } from '/@/cool';
import type { AssetMaintenancePageResult, AssetMaintenanceRecord } from '../types';

export default class PerformanceAssetMaintenanceService extends BaseService {
	permission = {
		page: 'performance:assetMaintenance:page',
		add: 'performance:assetMaintenance:add',
		update: 'performance:assetMaintenance:update',
		complete: 'performance:assetMaintenance:complete',
		cancel: 'performance:assetMaintenance:cancel',
		delete: 'performance:assetMaintenance:delete'
	};

	constructor() {
		super('admin/performance/assetMaintenance');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		status?: AssetMaintenanceRecord['status'];
		assetId?: number;
	}) {
		return super.page(data) as unknown as Promise<AssetMaintenancePageResult>;
	}

	createMaintenance(data: Partial<AssetMaintenanceRecord>) {
		return super.add(data) as unknown as Promise<AssetMaintenanceRecord>;
	}

	updateMaintenance(data: Partial<AssetMaintenanceRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<AssetMaintenanceRecord>;
	}

	completeMaintenance(data: { id: number; completeDate?: string; resultSummary?: string }) {
		return this.request({
			url: '/complete',
			method: 'POST',
			data
		}) as unknown as Promise<AssetMaintenanceRecord>;
	}

	cancelMaintenance(data: { id: number; resultSummary?: string }) {
		return this.request({
			url: '/cancel',
			method: 'POST',
			data
		}) as unknown as Promise<AssetMaintenanceRecord>;
	}

	removeMaintenance(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performanceAssetMaintenanceService = new PerformanceAssetMaintenanceService();
