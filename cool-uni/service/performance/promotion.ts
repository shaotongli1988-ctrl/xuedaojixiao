/**
 * 文件职责：封装 cool-uni 对晋升管理移动页的列表和详情读取；
 * 不负责评审、提交或创建编辑动作；
 * 维护重点是只复用 promotion 既有接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	PromotionFetchInfoQuery,
	PromotionFetchPageRequest,
	PromotionPageResult,
	PromotionRecord,
} from "/@/types/performance-promotion";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformancePromotionService {
	private requester = createServiceRequester("admin/performance/promotion");

	permission = {
		page: PERMISSIONS.performance.promotion.page,
		info: PERMISSIONS.performance.promotion.info,
	};

	fetchPage(data: PromotionFetchPageRequest) {
		return this.requester.page(data) as Promise<PromotionPageResult>;
	}

	fetchInfo(params: PromotionFetchInfoQuery) {
		return this.requester.info(params) as Promise<PromotionRecord>;
	}
}

export const performancePromotionService = new PerformancePromotionService();
