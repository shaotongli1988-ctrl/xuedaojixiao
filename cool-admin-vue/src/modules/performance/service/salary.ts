import { BaseService } from '/@/cool';
import type { SalaryPageResult, SalaryRecord } from '../types';

/**
 * 薪资管理前端请求服务。
 * 这里只封装模块 8 所需接口，不开放导出能力。
 */
export default class PerformanceSalaryService extends BaseService {
	permission = {
		page: 'performance:salary:page',
		info: 'performance:salary:info',
		add: 'performance:salary:add',
		update: 'performance:salary:update',
		confirm: 'performance:salary:confirm',
		archive: 'performance:salary:archive',
		changeAdd: 'performance:salary:changeAdd'
	};

	constructor() {
		super('admin/performance/salary');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<SalaryPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<SalaryRecord>;
	}

	createSalary(data: SalaryRecord) {
		return super.add(data) as unknown as Promise<SalaryRecord>;
	}

	updateSalary(data: SalaryRecord) {
		return super.update(data) as unknown as Promise<SalaryRecord>;
	}

	confirmSalary(data: { id: number }) {
		return this.request({
			url: '/confirm',
			method: 'POST',
			data
		}) as unknown as Promise<SalaryRecord>;
	}

	archiveSalary(data: { id: number }) {
		return this.request({
			url: '/archive',
			method: 'POST',
			data
		}) as unknown as Promise<SalaryRecord>;
	}

	addChange(data: { salaryId: number; adjustAmount: number; changeReason: string }) {
		return this.request({
			url: '/changeAdd',
			method: 'POST',
			data
		}) as unknown as Promise<SalaryRecord>;
	}
}

export const performanceSalaryService = new PerformanceSalaryService();
