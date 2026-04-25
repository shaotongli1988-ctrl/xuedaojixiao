/**
 * 资产折旧前端请求服务。
 * 这里只封装主题20冻结的 assetDepreciation page/summary/recalculate 接口，
 * 不负责财务凭证、关账或会计扩展能力。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssetDepreciationPageResult,
	decodeAssetDepreciationSummary
} from './asset-depreciation-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	AssetDepreciationPageQuery,
	AssetDepreciationPageResult,
	AssetDepreciationRecalculatePayload,
	AssetDepreciationSummary,
	AssetDepreciationSummaryQuery
} from '../types';

export default class PerformanceAssetDepreciationService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.assetDepreciation.page,
		summary: PERMISSIONS.performance.assetDepreciation.summary,
		recalculate: PERMISSIONS.performance.assetDepreciation.recalculate
	};

	constructor() {
		super('admin/performance/assetDepreciation');
	}

	fetchPage(data: AssetDepreciationPageQuery) {
		return asPerformanceServicePromise<AssetDepreciationPageResult>(
			super.page(data),
			decodeAssetDepreciationPageResult
		);
	}

	fetchSummary(params?: AssetDepreciationSummaryQuery) {
		return asPerformanceServicePromise<AssetDepreciationSummary>(
			this.request({
				url: '/summary',
				method: 'GET',
				params
			}),
			decodeAssetDepreciationSummary
		);
	}

	recalculate(data: AssetDepreciationRecalculatePayload) {
		return asPerformanceServicePromise<AssetDepreciationSummary>(
			this.request({
				url: '/recalculate',
				method: 'POST',
				data
			}),
			decodeAssetDepreciationSummary
		);
	}
}

export const performanceAssetDepreciationService = new PerformanceAssetDepreciationService();
