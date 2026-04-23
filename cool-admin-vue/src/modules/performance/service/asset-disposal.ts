/**
 * 资产报废前端请求服务。
 * 这里只封装主题20冻结的 assetDisposal 标准接口，
 * 不负责财务清理、回冲或外部审批流。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssetDisposalPageResult,
	decodeAssetDisposalRecord
} from './asset-disposal-contract';
import type {
	AssetDisposalApprovePayload,
	AssetDisposalCancelPayload,
	AssetDisposalCreatePayload,
	AssetDisposalExecutePayload,
	AssetDisposalInfoQuery,
	AssetDisposalPageQuery,
	AssetDisposalPageResult,
	AssetDisposalRecord,
	AssetDisposalSubmitPayload,
	AssetDisposalUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceAssetDisposalService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.assetDisposal.page,
		info: PERMISSIONS.performance.assetDisposal.info,
		add: PERMISSIONS.performance.assetDisposal.add,
		update: PERMISSIONS.performance.assetDisposal.update,
		submit: PERMISSIONS.performance.assetDisposal.submit,
		approve: PERMISSIONS.performance.assetDisposal.approve,
		execute: PERMISSIONS.performance.assetDisposal.execute,
		cancel: PERMISSIONS.performance.assetDisposal.cancel
	};

	constructor() {
		super('admin/performance/assetDisposal');
	}

	fetchPage(data: AssetDisposalPageQuery) {
		return asPerformanceServicePromise<AssetDisposalPageResult>(
			super.page(data),
			decodeAssetDisposalPageResult
		);
	}

	fetchInfo(params: AssetDisposalInfoQuery) {
		return asPerformanceServicePromise<AssetDisposalRecord>(
			super.info(params),
			decodeAssetDisposalRecord
		);
	}

	createDisposal(data: AssetDisposalCreatePayload) {
		return asPerformanceServicePromise<AssetDisposalRecord>(
			super.add(data),
			decodeAssetDisposalRecord
		);
	}

	updateDisposal(data: AssetDisposalUpdatePayload) {
		return asPerformanceServicePromise<AssetDisposalRecord>(
			super.update(data),
			decodeAssetDisposalRecord
		);
	}

	submitDisposal(data: AssetDisposalSubmitPayload) {
		return asPerformanceServicePromise<AssetDisposalRecord>(
			this.request({
				url: '/submit',
				method: 'POST',
				data
			}),
			decodeAssetDisposalRecord
		);
	}

	approveDisposal(data: AssetDisposalApprovePayload) {
		return asPerformanceServicePromise<AssetDisposalRecord>(
			this.request({
				url: '/approve',
				method: 'POST',
				data
			}),
			decodeAssetDisposalRecord
		);
	}

	executeDisposal(data: AssetDisposalExecutePayload) {
		return asPerformanceServicePromise<AssetDisposalRecord>(
			this.request({
				url: '/execute',
				method: 'POST',
				data
			}),
			decodeAssetDisposalRecord
		);
	}

	cancelDisposal(data: AssetDisposalCancelPayload) {
		return asPerformanceServicePromise<AssetDisposalRecord>(
			this.request({
				url: '/cancel',
				method: 'POST',
				data
			}),
			decodeAssetDisposalRecord
		);
	}
}

export const performanceAssetDisposalService = new PerformanceAssetDisposalService();
