/**
 * 录用管理前端请求服务。
 * 这里只封装主题18冻结的 hiring 主链接口，不负责后端权限范围裁剪、跨主题自动联动或员工主数据创建。
 * 维护重点是接口前缀、权限键和动作集合必须固定为 page/info/add/updateStatus/close。
 */
import { BaseService } from '/@/cool';
import type { HiringPageResult, HiringRecord, HiringStatus } from '../types';

export default class PerformanceHiringService extends BaseService {
	permission = {
		page: 'performance:hiring:page',
		info: 'performance:hiring:info',
		add: 'performance:hiring:add',
		updateStatus: 'performance:hiring:updateStatus',
		close: 'performance:hiring:close'
	};

	constructor() {
		super('admin/performance/hiring');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<HiringPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<HiringRecord>;
	}

	createHiring(data: Partial<HiringRecord>) {
		return super.add(data) as unknown as Promise<HiringRecord>;
	}

	updateStatus(data: { id: number; status: HiringStatus }) {
		return this.request({
			url: '/updateStatus',
			method: 'POST',
			data
		}) as unknown as Promise<HiringRecord>;
	}

	close(data: { id: number; closeReason: string }) {
		return this.request({
			url: '/close',
			method: 'POST',
			data
		}) as unknown as Promise<HiringRecord>;
	}
}

export const performanceHiringService = new PerformanceHiringService();
