/**
 * 人才发展与认证增强前端能力地图请求服务。
 * 这里只封装主题13冻结的 capabilityModel / capabilityItem / capabilityPortrait 接口，
 * 不负责课程主链、人才资产、面试流程或任何未冻结扩展能力。
 */
import { BaseService } from '/@/cool';
import type {
	CapabilityItemRecord,
	CapabilityModelPageResult,
	CapabilityModelRecord,
	CapabilityPortraitRecord
} from '../types';

export default class PerformanceCapabilityService extends BaseService {
	permission = {
		page: 'performance:capabilityModel:page',
		info: 'performance:capabilityModel:info',
		add: 'performance:capabilityModel:add',
		update: 'performance:capabilityModel:update',
		itemInfo: 'performance:capabilityItem:info',
		portraitInfo: 'performance:capabilityPortrait:info'
	};

	constructor() {
		super('admin/performance/capabilityModel');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		category?: string;
		status?: string;
	}) {
		return super.page(data) as unknown as Promise<CapabilityModelPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<CapabilityModelRecord>;
	}

	createModel(data: Partial<CapabilityModelRecord>) {
		return super.add(data) as unknown as Promise<CapabilityModelRecord>;
	}

	updateModel(data: Partial<CapabilityModelRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<CapabilityModelRecord>;
	}

	fetchItemInfo(params: { id: number }) {
		return this.request({
			url: '/admin/performance/capabilityItem/info',
			method: 'GET',
			params
		}) as unknown as Promise<CapabilityItemRecord>;
	}

	fetchPortraitInfo(params: { employeeId: number }) {
		return this.request({
			url: '/admin/performance/capabilityPortrait/info',
			method: 'GET',
			params
		}) as unknown as Promise<CapabilityPortraitRecord>;
	}
}

export const performanceCapabilityService = new PerformanceCapabilityService();
