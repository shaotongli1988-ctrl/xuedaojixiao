/**
 * 文件职责：封装 cool-uni 对能力地图移动页的列表和详情读取；
 * 不负责能力项详情、画像详情或桌面端维护动作；
 * 维护重点是只复用 capabilityModel 已有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	CapabilityModelInfoQuery,
	CapabilityModelPageQuery,
	CapabilityModelPageResult,
	CapabilityModelRecord,
} from "/@/types/performance-capability";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceCapabilityService {
	private requester = createServiceRequester("admin/performance/capabilityModel");

	permission = {
		page: PERMISSIONS.performance.capabilityModel.page,
		info: PERMISSIONS.performance.capabilityModel.info,
	};

	fetchPage(data: CapabilityModelPageQuery) {
		return this.requester.page(data) as Promise<CapabilityModelPageResult>;
	}

	fetchInfo(params: CapabilityModelInfoQuery) {
		return this.requester.info(params) as Promise<CapabilityModelRecord>;
	}
}

export const performanceCapabilityService = new PerformanceCapabilityService();
