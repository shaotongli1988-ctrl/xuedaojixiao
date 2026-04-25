/**
 * 文件职责：封装 cool-uni 对供应商管理移动页的列表和详情读取；
 * 不负责桌面端增删改、采购联动或敏感字段脱敏逻辑；
 * 维护重点是只复用 supplier 标准接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	SupplierFetchInfoQuery,
	SupplierFetchPageRequest,
	SupplierPageResult,
	SupplierRecord,
} from "/@/types/performance-supplier";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceSupplierService {
	private requester = createServiceRequester("admin/performance/supplier");

	permission = {
		page: PERMISSIONS.performance.supplier.page,
		info: PERMISSIONS.performance.supplier.info,
	};

	fetchPage(data: SupplierFetchPageRequest) {
		return this.requester.page(data) as Promise<SupplierPageResult>;
	}

	fetchInfo(params: SupplierFetchInfoQuery) {
		return this.requester.info(params) as Promise<SupplierRecord>;
	}
}

export const performanceSupplierService = new PerformanceSupplierService();
