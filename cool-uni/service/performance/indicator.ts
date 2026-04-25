/**
 * 文件职责：封装 cool-uni 对指标库移动页的列表和详情读取；
 * 不负责桌面端 CRUD、删除或引用联动；
 * 维护重点是只复用 indicator 既有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	IndicatorInfoQuery,
	IndicatorPageQuery,
	IndicatorPageResult,
	IndicatorRecord,
} from "/@/types/performance-indicator";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceIndicatorService {
	private requester = createServiceRequester("admin/performance/indicator");

	permission = {
		page: PERMISSIONS.performance.indicator.page,
		info: PERMISSIONS.performance.indicator.info,
	};

	fetchPage(data: IndicatorPageQuery) {
		return this.requester.page(data) as Promise<IndicatorPageResult>;
	}

	fetchInfo(params: IndicatorInfoQuery) {
		return this.requester.info(params) as Promise<IndicatorRecord>;
	}
}

export const performanceIndicatorService = new PerformanceIndicatorService();
