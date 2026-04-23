/**
 * 物资库存前端请求服务。
 * 这里只封装物资管理一期 materialStock 的库存查询接口，
 * 不负责库存调整、盘点任务或其他仓储扩展能力。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeMaterialStockPageResult,
	decodeMaterialStockRecord
} from './material-stock-contract';
import type {
	MaterialStockInfoQuery,
	MaterialStockPageQuery,
	MaterialStockPageResult,
	MaterialStockRecord
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceMaterialStockService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.materialStock.page,
		info: PERMISSIONS.performance.materialStock.info
	};

	constructor() {
		super('admin/performance/materialStock');
	}

	fetchPage(data: MaterialStockPageQuery) {
		return asPerformanceServicePromise<MaterialStockPageResult>(
			super.page(data),
			decodeMaterialStockPageResult
		);
	}

	fetchInfo(params: MaterialStockInfoQuery) {
		return asPerformanceServicePromise<MaterialStockRecord>(
			super.info(params),
			decodeMaterialStockRecord
		);
	}
}

export const performanceMaterialStockService = new PerformanceMaterialStockService();
