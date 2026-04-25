/**
 * 资产维护保养前端请求服务。
 * 这里只封装主题20冻结的 assetMaintenance 标准接口，
 * 不负责资产折旧、报废或财务扩展能力。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssetMaintenancePageResult,
	decodeAssetMaintenanceRecord
} from './asset-maintenance-contract';
import type {
	AssetMaintenanceCancelPayload,
	AssetMaintenanceCompletePayload,
	AssetMaintenanceCreatePayload,
	AssetMaintenancePageQuery,
	AssetMaintenancePageResult,
	AssetMaintenanceRecord,
	AssetMaintenanceRemovePayload,
	AssetMaintenanceUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceAssetMaintenanceService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.assetMaintenance.page,
		add: PERMISSIONS.performance.assetMaintenance.add,
		update: PERMISSIONS.performance.assetMaintenance.update,
		complete: PERMISSIONS.performance.assetMaintenance.complete,
		cancel: PERMISSIONS.performance.assetMaintenance.cancel,
		delete: PERMISSIONS.performance.assetMaintenance.delete
	};

	constructor() {
		super('admin/performance/assetMaintenance');
	}

	fetchPage(data: AssetMaintenancePageQuery) {
		return asPerformanceServicePromise<AssetMaintenancePageResult>(
			super.page(data),
			decodeAssetMaintenancePageResult
		);
	}

	createMaintenance(data: AssetMaintenanceCreatePayload) {
		return asPerformanceServicePromise<AssetMaintenanceRecord>(
			super.add(data),
			decodeAssetMaintenanceRecord
		);
	}

	updateMaintenance(data: AssetMaintenanceUpdatePayload) {
		return asPerformanceServicePromise<AssetMaintenanceRecord>(
			super.update(data),
			decodeAssetMaintenanceRecord
		);
	}

	completeMaintenance(data: AssetMaintenanceCompletePayload) {
		return asPerformanceServicePromise<AssetMaintenanceRecord>(
			this.request({
				url: '/complete',
				method: 'POST',
				data
			}),
			decodeAssetMaintenanceRecord
		);
	}

	cancelMaintenance(data: AssetMaintenanceCancelPayload) {
		return asPerformanceServicePromise<AssetMaintenanceRecord>(
			this.request({
				url: '/cancel',
				method: 'POST',
				data
			}),
			decodeAssetMaintenanceRecord
		);
	}

	removeMaintenance(data: AssetMaintenanceRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceAssetMaintenanceService = new PerformanceAssetMaintenanceService();
