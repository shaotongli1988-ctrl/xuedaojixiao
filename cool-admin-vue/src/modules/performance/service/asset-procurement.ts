/**
 * 资产采购入库前端请求服务。
 * 这里只封装主题20冻结的 assetProcurement 标准接口，
 * 不负责主题11采购订单审批链或供应商主数据中心。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssetProcurementPageResult,
	decodeAssetProcurementRecord
} from './asset-procurement-contract';
import type {
	AssetProcurementCancelPayload,
	AssetProcurementCreatePayload,
	AssetProcurementInfoQuery,
	AssetProcurementPageQuery,
	AssetProcurementPageResult,
	AssetProcurementReceivePayload,
	AssetProcurementRecord,
	AssetProcurementSubmitPayload,
	AssetProcurementUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceAssetProcurementService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.assetProcurement.page,
		info: PERMISSIONS.performance.assetProcurement.info,
		add: PERMISSIONS.performance.assetProcurement.add,
		update: PERMISSIONS.performance.assetProcurement.update,
		submit: PERMISSIONS.performance.assetProcurement.submit,
		receive: PERMISSIONS.performance.assetProcurement.receive,
		cancel: PERMISSIONS.performance.assetProcurement.cancel
	};

	constructor() {
		super('admin/performance/assetProcurement');
	}

	fetchPage(data: AssetProcurementPageQuery) {
		return asPerformanceServicePromise<AssetProcurementPageResult>(
			super.page(data),
			decodeAssetProcurementPageResult
		);
	}

	fetchInfo(params: AssetProcurementInfoQuery) {
		return asPerformanceServicePromise<AssetProcurementRecord>(
			super.info(params),
			decodeAssetProcurementRecord
		);
	}

	createProcurement(data: AssetProcurementCreatePayload) {
		return asPerformanceServicePromise<AssetProcurementRecord>(
			super.add(data),
			decodeAssetProcurementRecord
		);
	}

	updateProcurement(data: AssetProcurementUpdatePayload) {
		return asPerformanceServicePromise<AssetProcurementRecord>(
			super.update(data),
			decodeAssetProcurementRecord
		);
	}

	submitProcurement(data: AssetProcurementSubmitPayload) {
		return asPerformanceServicePromise<AssetProcurementRecord>(
			this.request({
				url: '/submit',
				method: 'POST',
				data
			}),
			decodeAssetProcurementRecord
		);
	}

	receiveProcurement(data: AssetProcurementReceivePayload) {
		return asPerformanceServicePromise<AssetProcurementRecord>(
			this.request({
				url: '/receive',
				method: 'POST',
				data
			}),
			decodeAssetProcurementRecord
		);
	}

	cancelProcurement(data: AssetProcurementCancelPayload) {
		return asPerformanceServicePromise<AssetProcurementRecord>(
			this.request({
				url: '/cancel',
				method: 'POST',
				data
			}),
			decodeAssetProcurementRecord
		);
	}
}

export const performanceAssetProcurementService = new PerformanceAssetProcurementService();
