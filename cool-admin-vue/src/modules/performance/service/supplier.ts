/**
 * 供应商台账前端请求服务。
 * 这里只封装主题11冻结的 supplier page/info/add/update/delete 五个接口，
 * 不负责资质、评级、结算中心或其他供应商扩展能力。
 */
import { BaseService } from '/@/cool';
import type { SupplierPageResult, SupplierRecord } from '../types';

export default class PerformanceSupplierService extends BaseService {
	permission = {
		page: 'performance:supplier:page',
		info: 'performance:supplier:info',
		add: 'performance:supplier:add',
		update: 'performance:supplier:update',
		delete: 'performance:supplier:delete'
	};

	constructor() {
		super('admin/performance/supplier');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		category?: string;
		status?: string;
	}) {
		return super.page(data) as unknown as Promise<SupplierPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<SupplierRecord>;
	}

	createSupplier(data: Partial<SupplierRecord>) {
		return super.add(data) as unknown as Promise<SupplierRecord>;
	}

	updateSupplier(data: Partial<SupplierRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<SupplierRecord>;
	}

	removeSupplier(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performanceSupplierService = new PerformanceSupplierService();
