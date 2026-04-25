/**
 * 资产领用归还前端请求服务。
 * 这里只封装主题20冻结的 assetAssignment 标准接口，
 * 不负责资产台账主数据维护或其他子单据流程。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssetAssignmentPageResult,
	decodeAssetAssignmentRecord
} from './asset-assignment-contract';
import type {
	AssetAssignmentCreatePayload,
	AssetAssignmentMarkLostPayload,
	AssetAssignmentPageQuery,
	AssetAssignmentPageResult,
	AssetAssignmentRecord,
	AssetAssignmentRemovePayload,
	AssetAssignmentReturnPayload,
	AssetAssignmentUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceAssetAssignmentService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.assetAssignment.page,
		add: PERMISSIONS.performance.assetAssignment.add,
		update: PERMISSIONS.performance.assetAssignment.update,
		return: PERMISSIONS.performance.assetAssignment.return,
		markLost: PERMISSIONS.performance.assetAssignment.markLost,
		delete: PERMISSIONS.performance.assetAssignment.delete
	};

	constructor() {
		super('admin/performance/assetAssignment');
	}

	fetchPage(data: AssetAssignmentPageQuery) {
		return asPerformanceServicePromise<AssetAssignmentPageResult>(
			super.page(data),
			decodeAssetAssignmentPageResult
		);
	}

	createAssignment(data: AssetAssignmentCreatePayload) {
		return asPerformanceServicePromise<AssetAssignmentRecord>(
			super.add(data),
			decodeAssetAssignmentRecord
		);
	}

	updateAssignment(data: AssetAssignmentUpdatePayload) {
		return asPerformanceServicePromise<AssetAssignmentRecord>(
			super.update(data),
			decodeAssetAssignmentRecord
		);
	}

	returnAsset(data: AssetAssignmentReturnPayload) {
		return asPerformanceServicePromise<AssetAssignmentRecord>(
			this.request({
				url: '/return',
				method: 'POST',
				data
			}),
			decodeAssetAssignmentRecord
		);
	}

	markLost(data: AssetAssignmentMarkLostPayload) {
		return asPerformanceServicePromise<AssetAssignmentRecord>(
			this.request({
				url: '/markLost',
				method: 'POST',
				data
			}),
			decodeAssetAssignmentRecord
		);
	}

	removeAssignment(data: AssetAssignmentRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceAssetAssignmentService = new PerformanceAssetAssignmentService();
