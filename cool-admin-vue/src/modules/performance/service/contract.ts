/**
 * 合同管理前端请求服务。
 * 这里只封装主题 10 冻结的 contract page/info/add/update/delete 五个接口，
 * 不负责菜单注册、附件预览、签署轨迹或审批流联动。
 */
import { BaseService } from '/@/cool';
import type { ContractPageResult, ContractRecord } from '../types';

export default class PerformanceContractService extends BaseService {
	permission = {
		page: 'performance:contract:page',
		info: 'performance:contract:info',
		add: 'performance:contract:add',
		update: 'performance:contract:update',
		delete: 'performance:contract:delete'
	};

	constructor() {
		super('admin/performance/contract');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<ContractPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<ContractRecord>;
	}

	createContract(data: Partial<ContractRecord>) {
		return super.add(data) as unknown as Promise<ContractRecord>;
	}

	updateContract(data: Partial<ContractRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<ContractRecord>;
	}

	removeContract(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performanceContractService = new PerformanceContractService();
