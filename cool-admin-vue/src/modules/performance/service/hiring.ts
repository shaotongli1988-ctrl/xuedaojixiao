/**
 * 录用管理前端请求服务。
 * 这里只封装主题18冻结的 hiring 主链接口，不负责后端权限范围裁剪、跨主题自动联动或员工主数据创建。
 * 维护重点是接口前缀、权限键和动作集合必须固定为 page/info/add/updateStatus/close。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeHiringPageResult,
	decodeHiringTransportRecord
} from './hiring-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	HiringCloseRequest,
	HiringInfoQuery,
	HiringPageQuery,
	HiringSaveRequest,
	HiringStatusUpdateRequest,
	HiringPageResult,
	HiringTransportRecord
} from '../types';

export default class PerformanceHiringService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.hiring.page,
		info: PERMISSIONS.performance.hiring.info,
		add: PERMISSIONS.performance.hiring.add,
		updateStatus: PERMISSIONS.performance.hiring.updateStatus,
		close: PERMISSIONS.performance.hiring.close
	};

	constructor() {
		super('admin/performance/hiring');
	}

	fetchPage(data: HiringPageQuery) {
		return asPerformanceServicePromise<HiringPageResult>(
			super.page(data),
			decodeHiringPageResult
		);
	}

	fetchInfo(params: HiringInfoQuery) {
		return asPerformanceServicePromise<HiringTransportRecord>(
			super.info(params),
			decodeHiringTransportRecord
		);
	}

	createHiring(data: HiringSaveRequest) {
		return asPerformanceServicePromise<HiringTransportRecord>(
			super.add(data),
			decodeHiringTransportRecord
		);
	}

	updateStatus(data: HiringStatusUpdateRequest) {
		return asPerformanceServicePromise<HiringTransportRecord>(this.request({
			url: '/updateStatus',
			method: 'POST',
			data
		}), decodeHiringTransportRecord);
	}

	close(data: HiringCloseRequest) {
		return asPerformanceServicePromise<HiringTransportRecord>(this.request({
			url: '/close',
			method: 'POST',
			data
		}), decodeHiringTransportRecord);
	}
}

export const performanceHiringService = new PerformanceHiringService();
