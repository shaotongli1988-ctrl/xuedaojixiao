import { BaseService } from '/@/cool';
import type { PipExportRow, PipPageResult, PipRecord } from '../types';

/**
 * PIP 前端请求服务。
 * 这里只封装模块 6 所需接口，不依赖自动生成的 EPS 服务。
 */
export default class PerformancePipService extends BaseService {
	permission = {
		page: 'performance:pip:page',
		info: 'performance:pip:info',
		add: 'performance:pip:add',
		update: 'performance:pip:update',
		start: 'performance:pip:start',
		track: 'performance:pip:track',
		complete: 'performance:pip:complete',
		close: 'performance:pip:close',
		export: 'performance:pip:export'
	};

	constructor() {
		super('admin/performance/pip');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<PipPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<PipRecord>;
	}

	createPip(data: PipRecord) {
		return super.add(data) as unknown as Promise<PipRecord>;
	}

	updatePip(data: PipRecord) {
		return super.update(data) as unknown as Promise<PipRecord>;
	}

	start(data: { id: number }) {
		return this.request({
			url: '/start',
			method: 'POST',
			data
		}) as unknown as Promise<PipRecord>;
	}

	track(data: { id: number; recordDate: string; progress: string; nextPlan?: string }) {
		return this.request({
			url: '/track',
			method: 'POST',
			data
		}) as unknown as Promise<PipRecord>;
	}

	complete(data: { id: number; resultSummary?: string }) {
		return this.request({
			url: '/complete',
			method: 'POST',
			data
		}) as unknown as Promise<PipRecord>;
	}

	close(data: { id: number; resultSummary?: string }) {
		return this.request({
			url: '/close',
			method: 'POST',
			data
		}) as unknown as Promise<PipRecord>;
	}

	exportSummary(data: any) {
		return this.request({
			url: '/export',
			method: 'POST',
			data
		}) as unknown as Promise<PipExportRow[]>;
	}
}

export const performancePipService = new PerformancePipService();
