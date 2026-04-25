/**
 * 合同管理前端请求服务。
 * 这里只封装主题 10 冻结的 contract page/info/add/update/delete 五个接口，
 * 不负责菜单注册、附件预览、签署轨迹或审批流联动。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeContractPageResult, decodeContractRecord } from './contract-contract';
import type {
	ContractInfoQuery,
	ContractPageQuery,
	ContractPageResult,
	ContractRecord,
	ContractRemovePayload,
	ContractSaveRequest
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceContractService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.contract.page,
		info: PERMISSIONS.performance.contract.info,
		add: PERMISSIONS.performance.contract.add,
		update: PERMISSIONS.performance.contract.update,
		delete: PERMISSIONS.performance.contract.delete
	};

	constructor() {
		super('admin/performance/contract');
	}

	fetchPage(data: ContractPageQuery) {
		return asPerformanceServicePromise<ContractPageResult>(
			super.page(data),
			decodeContractPageResult
		);
	}

	fetchInfo(params: ContractInfoQuery) {
		return asPerformanceServicePromise<ContractRecord>(
			super.info(params),
			decodeContractRecord
		);
	}

	createContract(data: ContractSaveRequest) {
		return asPerformanceServicePromise<ContractRecord>(super.add(data), decodeContractRecord);
	}

	updateContract(data: ContractSaveRequest & { id: number }) {
		return asPerformanceServicePromise<ContractRecord>(
			super.update(data),
			decodeContractRecord
		);
	}

	removeContract(data: ContractRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceContractService = new PerformanceContractService();
