/**
 * 人才发展与认证增强前端能力地图请求服务。
 * 这里只封装主题13冻结的 capabilityModel / capabilityItem / capabilityPortrait 接口，
 * 不负责课程主链、人才资产、面试流程或任何未冻结扩展能力。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeCapabilityItemRecord,
	decodeCapabilityModelPageResult,
	decodeCapabilityModelRecord,
	decodeCapabilityPortraitRecord
} from './capability-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	CapabilityItemInfoQuery,
	CapabilityModelInfoQuery,
	CapabilityModelPageQuery,
	CapabilityItemRecord,
	CapabilityModelPageResult,
	CapabilityModelRecord,
	CapabilityModelSaveRequest,
	CapabilityPortraitInfoQuery,
	CapabilityPortraitRecord
} from '../types';

export default class PerformanceCapabilityService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.capabilityModel.page,
		info: PERMISSIONS.performance.capabilityModel.info,
		add: PERMISSIONS.performance.capabilityModel.add,
		update: PERMISSIONS.performance.capabilityModel.update,
		itemInfo: PERMISSIONS.performance.capabilityItem.info,
		portraitInfo: PERMISSIONS.performance.capabilityPortrait.info
	};

	constructor() {
		super('admin/performance/capabilityModel');
	}

	fetchPage(data: CapabilityModelPageQuery) {
		return asPerformanceServicePromise<CapabilityModelPageResult>(
			super.page(data),
			decodeCapabilityModelPageResult
		);
	}

	fetchInfo(params: CapabilityModelInfoQuery) {
		return asPerformanceServicePromise<CapabilityModelRecord>(
			super.info(params),
			decodeCapabilityModelRecord
		);
	}

	createModel(data: CapabilityModelSaveRequest) {
		return asPerformanceServicePromise<CapabilityModelRecord>(
			super.add(data),
			decodeCapabilityModelRecord
		);
	}

	updateModel(data: CapabilityModelSaveRequest & { id: number }) {
		return asPerformanceServicePromise<CapabilityModelRecord>(
			super.update(data),
			decodeCapabilityModelRecord
		);
	}

	fetchItemInfo(params: CapabilityItemInfoQuery) {
		return asPerformanceServicePromise<CapabilityItemRecord>(
			this.request({
				url: '/admin/performance/capabilityItem/info',
				method: 'GET',
				params
			}),
			decodeCapabilityItemRecord
		);
	}

	fetchPortraitInfo(params: CapabilityPortraitInfoQuery) {
		return asPerformanceServicePromise<CapabilityPortraitRecord>(
			this.request({
				url: '/admin/performance/capabilityPortrait/info',
				method: 'GET',
				params
			}),
			decodeCapabilityPortraitRecord
		);
	}
}

export const performanceCapabilityService = new PerformanceCapabilityService();
