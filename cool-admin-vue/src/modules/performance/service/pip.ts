/**
 * PIP 前端请求服务。
 * 这里只封装 PIP 主链接口，不负责详情弹窗、表单预填或导出文件处理。
 * 维护重点是查询与动作负载统一回收至中心类型，避免服务层继续散落内联 DTO。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodePipExportRows,
	decodePipPageResult,
	decodePipRecord
} from './pip-contract';
import type {
	PipClosePayload,
	PipCompletePayload,
	PipCreatePayload,
	PipExportQuery,
	PipExportRow,
	PipInfoQuery,
	PipPageQuery,
	PipPageResult,
	PipRecord,
	PipStartPayload,
	PipTrackPayload,
	PipUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
export default class PerformancePipService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.pip.page,
		info: PERMISSIONS.performance.pip.info,
		add: PERMISSIONS.performance.pip.add,
		update: PERMISSIONS.performance.pip.update,
		start: PERMISSIONS.performance.pip.start,
		track: PERMISSIONS.performance.pip.track,
		complete: PERMISSIONS.performance.pip.complete,
		close: PERMISSIONS.performance.pip.close,
		export: PERMISSIONS.performance.pip.export
	};

	constructor() {
		super('admin/performance/pip');
	}

	fetchPage(data: PipPageQuery) {
		return asPerformanceServicePromise<PipPageResult>(
			super.page(data),
			decodePipPageResult
		);
	}

	fetchInfo(params: PipInfoQuery) {
		return asPerformanceServicePromise<PipRecord>(
			super.info(params),
			decodePipRecord
		);
	}

	createPip(data: PipCreatePayload) {
		return asPerformanceServicePromise<PipRecord>(super.add(data), decodePipRecord);
	}

	updatePip(data: PipUpdatePayload) {
		return asPerformanceServicePromise<PipRecord>(super.update(data), decodePipRecord);
	}

	start(data: PipStartPayload) {
		return asPerformanceServicePromise<PipRecord>(this.request({
			url: '/start',
			method: 'POST',
			data
		}), decodePipRecord);
	}

	track(data: PipTrackPayload) {
		return asPerformanceServicePromise<PipRecord>(this.request({
			url: '/track',
			method: 'POST',
			data
		}), decodePipRecord);
	}

	complete(data: PipCompletePayload) {
		return asPerformanceServicePromise<PipRecord>(this.request({
			url: '/complete',
			method: 'POST',
			data
		}), decodePipRecord);
	}

	close(data: PipClosePayload) {
		return asPerformanceServicePromise<PipRecord>(this.request({
			url: '/close',
			method: 'POST',
			data
		}), decodePipRecord);
	}

	exportSummary(data: PipExportQuery) {
		return asPerformanceServicePromise<PipExportRow[]>(this.request({
			url: '/export',
			method: 'POST',
			data
		}), decodePipExportRows);
	}
}

export const performancePipService = new PerformancePipService();
