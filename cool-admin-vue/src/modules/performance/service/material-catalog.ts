/**
 * 物资台账前端请求服务。
 * 这里只封装物资管理一期 materialCatalog 的基础台账接口，
 * 不负责库存、入库、领用或菜单接线。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeMaterialCatalogPageResult,
	decodeMaterialCatalogRecord
} from './material-catalog-contract';
import type {
	MaterialCatalogCreatePayload,
	MaterialCatalogInfoQuery,
	MaterialCatalogPageQuery,
	MaterialCatalogPageResult,
	MaterialCatalogRecord,
	MaterialCatalogRemovePayload,
	MaterialCatalogUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceMaterialCatalogService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.materialCatalog.page,
		info: PERMISSIONS.performance.materialCatalog.info,
		add: PERMISSIONS.performance.materialCatalog.add,
		update: PERMISSIONS.performance.materialCatalog.update,
		delete: PERMISSIONS.performance.materialCatalog.delete
	};

	constructor() {
		super('admin/performance/materialCatalog');
	}

	fetchPage(data: MaterialCatalogPageQuery) {
		return asPerformanceServicePromise<MaterialCatalogPageResult>(
			super.page(data),
			decodeMaterialCatalogPageResult
		);
	}

	fetchInfo(params: MaterialCatalogInfoQuery) {
		return asPerformanceServicePromise<MaterialCatalogRecord>(
			super.info(params),
			decodeMaterialCatalogRecord
		);
	}

	createMaterial(data: MaterialCatalogCreatePayload) {
		return asPerformanceServicePromise<MaterialCatalogRecord>(
			super.add(data),
			decodeMaterialCatalogRecord
		);
	}

	updateMaterial(data: MaterialCatalogUpdatePayload) {
		return asPerformanceServicePromise<MaterialCatalogRecord>(
			super.update(data),
			decodeMaterialCatalogRecord
		);
	}

	removeMaterial(data: MaterialCatalogRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceMaterialCatalogService = new PerformanceMaterialCatalogService();
