/**
 * 资产台账前端请求服务。
 * 这里只封装主题20冻结的 assetInfo 标准接口，
 * 不负责领用、维护、调拨、盘点或报废流程。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeAssetInfoPageResult, decodeAssetInfoRecord } from './asset-info-contract';
import type {
	AssetInfoCreatePayload,
	AssetInfoInfoQuery,
	AssetInfoPageQuery,
	AssetInfoPageResult,
	AssetInfoRecord,
	AssetInfoRemovePayload,
	AssetInfoUpdatePayload,
	AssetInfoUpdateStatusPayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceAssetInfoService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.assetInfo.page,
		info: PERMISSIONS.performance.assetInfo.info,
		add: PERMISSIONS.performance.assetInfo.add,
		update: PERMISSIONS.performance.assetInfo.update,
		delete: PERMISSIONS.performance.assetInfo.delete,
		updateStatus: PERMISSIONS.performance.assetInfo.updateStatus
	};

	constructor() {
		super('admin/performance/assetInfo');
	}

	fetchPage(data: AssetInfoPageQuery) {
		return asPerformanceServicePromise<AssetInfoPageResult>(
			super.page(data),
			decodeAssetInfoPageResult
		);
	}

	fetchInfo(params: AssetInfoInfoQuery) {
		return asPerformanceServicePromise<AssetInfoRecord>(
			super.info(params),
			decodeAssetInfoRecord
		);
	}

	createAsset(data: AssetInfoCreatePayload) {
		return asPerformanceServicePromise<AssetInfoRecord>(super.add(data), decodeAssetInfoRecord);
	}

	updateAsset(data: AssetInfoUpdatePayload) {
		return asPerformanceServicePromise<AssetInfoRecord>(
			super.update(data),
			decodeAssetInfoRecord
		);
	}

	removeAsset(data: AssetInfoRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}

	updateAssetStatus(data: AssetInfoUpdateStatusPayload) {
		return asPerformanceServicePromise<AssetInfoRecord>(
			this.request({
				url: '/updateStatus',
				method: 'POST',
				data
			}),
			decodeAssetInfoRecord
		);
	}
}

export const performanceAssetInfoService = new PerformanceAssetInfoService();
