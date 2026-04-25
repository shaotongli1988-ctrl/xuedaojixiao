/**
 * 资产调拨前端请求服务。
 * 这里只封装主题20冻结的 assetTransfer 标准接口，
 * 不负责资产盘点、报废或跨主题物流能力。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssetTransferPageResult,
	decodeAssetTransferRecord
} from './asset-transfer-contract';
import type {
	AssetTransferCancelPayload,
	AssetTransferCompletePayload,
	AssetTransferCreatePayload,
	AssetTransferInfoQuery,
	AssetTransferPageQuery,
	AssetTransferPageResult,
	AssetTransferRecord,
	AssetTransferSubmitPayload,
	AssetTransferUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceAssetTransferService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.assetTransfer.page,
		info: PERMISSIONS.performance.assetTransfer.info,
		add: PERMISSIONS.performance.assetTransfer.add,
		update: PERMISSIONS.performance.assetTransfer.update,
		submit: PERMISSIONS.performance.assetTransfer.submit,
		complete: PERMISSIONS.performance.assetTransfer.complete,
		cancel: PERMISSIONS.performance.assetTransfer.cancel
	};

	constructor() {
		super('admin/performance/assetTransfer');
	}

	fetchPage(data: AssetTransferPageQuery) {
		return asPerformanceServicePromise<AssetTransferPageResult>(
			super.page(data),
			decodeAssetTransferPageResult
		);
	}

	fetchInfo(params: AssetTransferInfoQuery) {
		return asPerformanceServicePromise<AssetTransferRecord>(
			super.info(params),
			decodeAssetTransferRecord
		);
	}

	createTransfer(data: AssetTransferCreatePayload) {
		return asPerformanceServicePromise<AssetTransferRecord>(
			super.add(data),
			decodeAssetTransferRecord
		);
	}

	updateTransfer(data: AssetTransferUpdatePayload) {
		return asPerformanceServicePromise<AssetTransferRecord>(
			super.update(data),
			decodeAssetTransferRecord
		);
	}

	submitTransfer(data: AssetTransferSubmitPayload) {
		return asPerformanceServicePromise<AssetTransferRecord>(
			this.request({
				url: '/submit',
				method: 'POST',
				data
			}),
			decodeAssetTransferRecord
		);
	}

	completeTransfer(data: AssetTransferCompletePayload) {
		return asPerformanceServicePromise<AssetTransferRecord>(
			this.request({
				url: '/complete',
				method: 'POST',
				data
			}),
			decodeAssetTransferRecord
		);
	}

	cancelTransfer(data: AssetTransferCancelPayload) {
		return asPerformanceServicePromise<AssetTransferRecord>(
			this.request({
				url: '/cancel',
				method: 'POST',
				data
			}),
			decodeAssetTransferRecord
		);
	}
}

export const performanceAssetTransferService = new PerformanceAssetTransferService();
