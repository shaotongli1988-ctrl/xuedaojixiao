/**
 * 文件职责：封装 cool-uni 对合同管理移动页的列表和详情读取；
 * 不负责附件、删除、签署轨迹或桌面端编辑动作；
 * 维护重点是只复用 contract 标准接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	ContractInfoQuery,
	ContractPageQuery,
	ContractPageResult,
	ContractRecord,
} from "/@/types/performance-contract";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceContractService {
	private requester = createServiceRequester("admin/performance/contract");

	permission = {
		page: PERMISSIONS.performance.contract.page,
		info: PERMISSIONS.performance.contract.info,
	};

	fetchPage(data: ContractPageQuery) {
		return this.requester.page(data) as Promise<ContractPageResult>;
	}

	fetchInfo(params: ContractInfoQuery) {
		return this.requester.info(params) as Promise<ContractRecord>;
	}
}

export const performanceContractService = new PerformanceContractService();
