/**
 * 资产盘点前端请求服务。
 * 这里只封装主题20冻结的 assetInventory 标准接口，
 * 不负责扫码、RFID 或外部仓储系统对接。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssetInventoryPageResult,
	decodeAssetInventoryRecord
} from './asset-inventory-contract';
import type {
	AssetInventoryClosePayload,
	AssetInventoryCompletePayload,
	AssetInventoryCreatePayload,
	AssetInventoryInfoQuery,
	AssetInventoryPageQuery,
	AssetInventoryPageResult,
	AssetInventoryRecord,
	AssetInventoryStartPayload,
	AssetInventoryUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceAssetInventoryService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.assetInventory.page,
		info: PERMISSIONS.performance.assetInventory.info,
		add: PERMISSIONS.performance.assetInventory.add,
		update: PERMISSIONS.performance.assetInventory.update,
		start: PERMISSIONS.performance.assetInventory.start,
		complete: PERMISSIONS.performance.assetInventory.complete,
		close: PERMISSIONS.performance.assetInventory.close
	};

	constructor() {
		super('admin/performance/assetInventory');
	}

	fetchPage(data: AssetInventoryPageQuery) {
		return asPerformanceServicePromise<AssetInventoryPageResult>(
			super.page(data),
			decodeAssetInventoryPageResult
		);
	}

	fetchInfo(params: AssetInventoryInfoQuery) {
		return asPerformanceServicePromise<AssetInventoryRecord>(
			super.info(params),
			decodeAssetInventoryRecord
		);
	}

	createInventory(data: AssetInventoryCreatePayload) {
		return asPerformanceServicePromise<AssetInventoryRecord>(
			super.add(data),
			decodeAssetInventoryRecord
		);
	}

	updateInventory(data: AssetInventoryUpdatePayload) {
		return asPerformanceServicePromise<AssetInventoryRecord>(
			super.update(data),
			decodeAssetInventoryRecord
		);
	}

	startInventory(data: AssetInventoryStartPayload) {
		return asPerformanceServicePromise<AssetInventoryRecord>(
			this.request({
				url: '/start',
				method: 'POST',
				data
			}),
			decodeAssetInventoryRecord
		);
	}

	completeInventory(data: AssetInventoryCompletePayload) {
		return asPerformanceServicePromise<AssetInventoryRecord>(
			this.request({
				url: '/complete',
				method: 'POST',
				data
			}),
			decodeAssetInventoryRecord
		);
	}

	closeInventory(data: AssetInventoryClosePayload) {
		return asPerformanceServicePromise<AssetInventoryRecord>(
			this.request({
				url: '/close',
				method: 'POST',
				data
			}),
			decodeAssetInventoryRecord
		);
	}
}

export const performanceAssetInventoryService = new PerformanceAssetInventoryService();
