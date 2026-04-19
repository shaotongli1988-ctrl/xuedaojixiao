/**
 * 资产盘点前端请求服务。
 * 这里只封装主题20冻结的 assetInventory 标准接口，
 * 不负责扫码、RFID 或外部仓储系统对接。
 */
import { BaseService } from '/@/cool';
import type { AssetInventoryPageResult, AssetInventoryRecord } from '../types';

export default class PerformanceAssetInventoryService extends BaseService {
	permission = {
		page: 'performance:assetInventory:page',
		info: 'performance:assetInventory:info',
		add: 'performance:assetInventory:add',
		update: 'performance:assetInventory:update',
		start: 'performance:assetInventory:start',
		complete: 'performance:assetInventory:complete',
		close: 'performance:assetInventory:close'
	};

	constructor() {
		super('admin/performance/assetInventory');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		status?: AssetInventoryRecord['status'];
		departmentId?: number;
		ownerId?: number;
	}) {
		return super.page(data) as unknown as Promise<AssetInventoryPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<AssetInventoryRecord>;
	}

	createInventory(data: Partial<AssetInventoryRecord>) {
		return super.add(data) as unknown as Promise<AssetInventoryRecord>;
	}

	updateInventory(data: Partial<AssetInventoryRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<AssetInventoryRecord>;
	}

	startInventory(data: { id: number }) {
		return this.request({
			url: '/start',
			method: 'POST',
			data
		}) as unknown as Promise<AssetInventoryRecord>;
	}

	completeInventory(data: { id: number; completedDate?: string }) {
		return this.request({
			url: '/complete',
			method: 'POST',
			data
		}) as unknown as Promise<AssetInventoryRecord>;
	}

	closeInventory(data: { id: number; remark?: string }) {
		return this.request({
			url: '/close',
			method: 'POST',
			data
		}) as unknown as Promise<AssetInventoryRecord>;
	}
}

export const performanceAssetInventoryService = new PerformanceAssetInventoryService();
