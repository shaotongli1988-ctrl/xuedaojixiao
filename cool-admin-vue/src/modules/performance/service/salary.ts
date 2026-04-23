/**
 * 薪资管理前端请求服务。
 * 这里只封装薪资主链接口，不负责页面金额格式化、调整记录展示或导出流程。
 * 维护重点是服务层请求体统一引用中心类型，避免和页面表单模型漂移。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeSalaryPageResult, decodeSalaryRecord } from './salary-contract';
import type {
	SalaryAddChangePayload,
	SalaryArchivePayload,
	SalaryConfirmPayload,
	SalaryCreatePayload,
	SalaryInfoQuery,
	SalaryPageQuery,
	SalaryPageResult,
	SalaryRecord,
	SalaryUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
export default class PerformanceSalaryService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.salary.page,
		info: PERMISSIONS.performance.salary.info,
		add: PERMISSIONS.performance.salary.add,
		update: PERMISSIONS.performance.salary.update,
		confirm: PERMISSIONS.performance.salary.confirm,
		archive: PERMISSIONS.performance.salary.archive,
		changeAdd: PERMISSIONS.performance.salary.changeAdd
	};

	constructor() {
		super('admin/performance/salary');
	}

	fetchPage(data: SalaryPageQuery) {
		return asPerformanceServicePromise<SalaryPageResult>(
			super.page(data),
			decodeSalaryPageResult
		);
	}

	fetchInfo(params: SalaryInfoQuery) {
		return asPerformanceServicePromise<SalaryRecord>(super.info(params), decodeSalaryRecord);
	}

	createSalary(data: SalaryCreatePayload) {
		return asPerformanceServicePromise<SalaryRecord>(super.add(data), decodeSalaryRecord);
	}

	updateSalary(data: SalaryUpdatePayload) {
		return asPerformanceServicePromise<SalaryRecord>(super.update(data), decodeSalaryRecord);
	}

	confirmSalary(data: SalaryConfirmPayload) {
		return asPerformanceServicePromise<SalaryRecord>(
			this.request({
				url: '/confirm',
				method: 'POST',
				data
			}),
			decodeSalaryRecord
		);
	}

	archiveSalary(data: SalaryArchivePayload) {
		return asPerformanceServicePromise<SalaryRecord>(
			this.request({
				url: '/archive',
				method: 'POST',
				data
			}),
			decodeSalaryRecord
		);
	}

	addChange(data: SalaryAddChangePayload) {
		return asPerformanceServicePromise<SalaryRecord>(
			this.request({
				url: '/changeAdd',
				method: 'POST',
				data
			}),
			decodeSalaryRecord
		);
	}
}

export const performanceSalaryService = new PerformanceSalaryService();
