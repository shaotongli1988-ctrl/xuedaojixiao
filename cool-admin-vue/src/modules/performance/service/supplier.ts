/**
 * 供应商台账前端请求服务。
 * 这里只封装主题11冻结的 supplier page/info/add/update/delete 五个接口，
 * 不负责资质、评级、结算中心或其他供应商扩展能力。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeSupplierPageResult,
	decodeSupplierRecord
} from './supplier-contract';
import type {
	SupplierCreatePayload,
	SupplierInfoQuery,
	SupplierPageQuery,
	SupplierPageResult,
	SupplierRecord,
	SupplierRemovePayload,
	SupplierUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceSupplierService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.supplier.page,
		info: PERMISSIONS.performance.supplier.info,
		add: PERMISSIONS.performance.supplier.add,
		update: PERMISSIONS.performance.supplier.update,
		delete: PERMISSIONS.performance.supplier.delete
	};

	constructor() {
		super('admin/performance/supplier');
	}

	fetchPage(data: SupplierPageQuery) {
		return asPerformanceServicePromise<SupplierPageResult>(
			super.page(data),
			decodeSupplierPageResult
		);
	}

	fetchInfo(params: SupplierInfoQuery) {
		return asPerformanceServicePromise<SupplierRecord>(
			super.info(params),
			decodeSupplierRecord
		);
	}

	createSupplier(data: SupplierCreatePayload) {
		return asPerformanceServicePromise<SupplierRecord>(
			super.add(data),
			decodeSupplierRecord
		);
	}

	updateSupplier(data: SupplierUpdatePayload) {
		return asPerformanceServicePromise<SupplierRecord>(
			super.update(data),
			decodeSupplierRecord
		);
	}

	removeSupplier(data: SupplierRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceSupplierService = new PerformanceSupplierService();
