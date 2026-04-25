/**
 * 资产领用申请前端请求服务。
 * 这里只封装 Theme20 L1/L2 `assetAssignmentRequest` 标准接口，
 * 不负责真实领用执行记录的归还、丢失或审批中心动作。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssetAssignmentRequestPageResult,
	decodeAssetAssignmentRequestRecord
} from './asset-assignment-request-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	AssetAssignmentRequestAssignPayload,
	AssetAssignmentRequestCancelPayload,
	AssetAssignmentRequestCreatePayload,
	AssetAssignmentRequestInfoQuery,
	AssetAssignmentRequestPageQuery,
	AssetAssignmentRequestPageResult,
	AssetAssignmentRequestRecord,
	AssetAssignmentRequestSubmitPayload,
	AssetAssignmentRequestUpdatePayload,
	AssetAssignmentRequestWithdrawPayload
} from '../types';

export default class PerformanceAssetAssignmentRequestService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.assetAssignmentRequest.page,
		info: PERMISSIONS.performance.assetAssignmentRequest.info,
		add: PERMISSIONS.performance.assetAssignmentRequest.add,
		update: PERMISSIONS.performance.assetAssignmentRequest.update,
		submit: PERMISSIONS.performance.assetAssignmentRequest.submit,
		withdraw: PERMISSIONS.performance.assetAssignmentRequest.withdraw,
		assign: PERMISSIONS.performance.assetAssignmentRequest.assign,
		cancel: PERMISSIONS.performance.assetAssignmentRequest.cancel
	};

	constructor() {
		super('admin/performance/assetAssignmentRequest');
	}

	fetchPage(data: AssetAssignmentRequestPageQuery) {
		return asPerformanceServicePromise<AssetAssignmentRequestPageResult>(
			super.page(data),
			decodeAssetAssignmentRequestPageResult
		);
	}

	fetchInfo(id: AssetAssignmentRequestInfoQuery) {
		return asPerformanceServicePromise<AssetAssignmentRequestRecord>(
			this.request({
				url: '/info',
				method: 'GET',
				params: { id }
			}),
			decodeAssetAssignmentRequestRecord
		);
	}

	createDraft(data: AssetAssignmentRequestCreatePayload) {
		return asPerformanceServicePromise<AssetAssignmentRequestRecord>(
			super.add(data),
			decodeAssetAssignmentRequestRecord
		);
	}

	updateDraft(data: AssetAssignmentRequestUpdatePayload) {
		return asPerformanceServicePromise<AssetAssignmentRequestRecord>(
			super.update(data),
			decodeAssetAssignmentRequestRecord
		);
	}

	submitRequest(data: AssetAssignmentRequestSubmitPayload) {
		return asPerformanceServicePromise<AssetAssignmentRequestRecord>(
			this.request({
				url: '/submit',
				method: 'POST',
				data
			}),
			decodeAssetAssignmentRequestRecord
		);
	}

	withdrawRequest(data: AssetAssignmentRequestWithdrawPayload) {
		return asPerformanceServicePromise<AssetAssignmentRequestRecord>(
			this.request({
				url: '/withdraw',
				method: 'POST',
				data
			}),
			decodeAssetAssignmentRequestRecord
		);
	}

	assignAsset(data: AssetAssignmentRequestAssignPayload) {
		return asPerformanceServicePromise<AssetAssignmentRequestRecord>(
			this.request({
				url: '/assign',
				method: 'POST',
				data
			}),
			decodeAssetAssignmentRequestRecord
		);
	}

	cancelRequest(data: AssetAssignmentRequestCancelPayload) {
		return asPerformanceServicePromise<AssetAssignmentRequestRecord>(
			this.request({
				url: '/cancel',
				method: 'POST',
				data
			}),
			decodeAssetAssignmentRequestRecord
		);
	}
}

export const performanceAssetAssignmentRequestService =
	new PerformanceAssetAssignmentRequestService();
