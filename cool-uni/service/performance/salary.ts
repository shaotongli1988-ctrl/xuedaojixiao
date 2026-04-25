/**
 * 文件职责：封装 cool-uni 对薪资管理移动页的列表和详情读取；
 * 不负责确认、归档、调整或个人薪资视图；
 * 维护重点是只复用 salary 既有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	SalaryFetchInfoQuery,
	SalaryFetchPageRequest,
	SalaryPageResult,
	SalaryRecord,
} from "/@/types/performance-salary";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceSalaryService {
	private requester = createServiceRequester("admin/performance/salary");

	permission = {
		page: PERMISSIONS.performance.salary.page,
		info: PERMISSIONS.performance.salary.info,
	};

	fetchPage(data: SalaryFetchPageRequest) {
		return this.requester.page(data) as Promise<SalaryPageResult>;
	}

	fetchInfo(params: SalaryFetchInfoQuery) {
		return this.requester.info(params) as Promise<SalaryRecord>;
	}
}

export const performanceSalaryService = new PerformanceSalaryService();
