import { BaseService } from '/@/cool';
import type { IndicatorPageResult, IndicatorRecord } from '../types';

/**
 * 指标库前端请求服务。
 * 这里只封装模块 4 的标准 CRUD 接口，不引入额外页面状态或共享鉴权逻辑。
 */
export default class PerformanceIndicatorService extends BaseService {
	permission = {
		page: 'performance:indicator:page',
		info: 'performance:indicator:info',
		add: 'performance:indicator:add',
		update: 'performance:indicator:update',
		delete: 'performance:indicator:delete'
	};

	constructor() {
		super('admin/performance/indicator');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<IndicatorPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<IndicatorRecord>;
	}

	createIndicator(data: IndicatorRecord) {
		return super.add(data) as unknown as Promise<IndicatorRecord>;
	}

	updateIndicator(data: IndicatorRecord) {
		return super.update(data) as unknown as Promise<IndicatorRecord>;
	}

	removeIndicator(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performanceIndicatorService = new PerformanceIndicatorService();
