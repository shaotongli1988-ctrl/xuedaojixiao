import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeIndicatorPageResult, decodeIndicatorRecord } from './indicator-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	IndicatorInfoQuery,
	IndicatorPageQuery,
	IndicatorPageResult,
	IndicatorRemovePayload,
	IndicatorRecord,
	IndicatorSaveRequest
} from '../types';

/**
 * 指标库前端请求服务。
 * 这里只封装模块 4 的标准 CRUD 接口，不引入额外页面状态或共享鉴权逻辑。
 */
export default class PerformanceIndicatorService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.indicator.page,
		info: PERMISSIONS.performance.indicator.info,
		add: PERMISSIONS.performance.indicator.add,
		update: PERMISSIONS.performance.indicator.update,
		delete: PERMISSIONS.performance.indicator.delete
	};

	constructor() {
		super('admin/performance/indicator');
	}

	fetchPage(data: IndicatorPageQuery) {
		return asPerformanceServicePromise<IndicatorPageResult>(
			super.page(data),
			decodeIndicatorPageResult
		);
	}

	fetchInfo(params: IndicatorInfoQuery) {
		return asPerformanceServicePromise<IndicatorRecord>(
			super.info(params),
			decodeIndicatorRecord
		);
	}

	createIndicator(data: IndicatorSaveRequest) {
		return asPerformanceServicePromise<IndicatorRecord>(super.add(data), decodeIndicatorRecord);
	}

	updateIndicator(data: IndicatorSaveRequest & { id: number }) {
		return asPerformanceServicePromise<IndicatorRecord>(
			super.update(data),
			decodeIndicatorRecord
		);
	}

	removeIndicator(data: IndicatorRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceIndicatorService = new PerformanceIndicatorService();
