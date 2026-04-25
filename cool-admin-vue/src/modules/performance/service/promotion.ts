/**
 * 晋升管理前端请求服务。
 * 这里只封装晋升主链接口，不负责页面表单编排、选项回填或跨模块联动。
 * 维护重点是页面查询与提交负载统一引用中心类型，避免服务层自造 DTO。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodePromotionPageResult, decodePromotionRecord } from './promotion-contract';
import type {
	PromotionCreatePayload,
	PromotionInfoQuery,
	PromotionPageQuery,
	PromotionPageResult,
	PromotionRecord,
	PromotionReviewPayload,
	PromotionSubmitPayload,
	PromotionUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
export default class PerformancePromotionService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.promotion.page,
		info: PERMISSIONS.performance.promotion.info,
		add: PERMISSIONS.performance.promotion.add,
		update: PERMISSIONS.performance.promotion.update,
		submit: PERMISSIONS.performance.promotion.submit,
		review: PERMISSIONS.performance.promotion.review
	};

	constructor() {
		super('admin/performance/promotion');
	}

	fetchPage(data: PromotionPageQuery) {
		return asPerformanceServicePromise<PromotionPageResult>(
			super.page(data),
			decodePromotionPageResult
		);
	}

	fetchInfo(params: PromotionInfoQuery) {
		return asPerformanceServicePromise<PromotionRecord>(
			super.info(params),
			decodePromotionRecord
		);
	}

	createPromotion(data: PromotionCreatePayload) {
		return asPerformanceServicePromise<PromotionRecord>(super.add(data), decodePromotionRecord);
	}

	updatePromotion(data: PromotionUpdatePayload) {
		return asPerformanceServicePromise<PromotionRecord>(
			super.update(data),
			decodePromotionRecord
		);
	}

	submit(data: PromotionSubmitPayload) {
		return asPerformanceServicePromise<PromotionRecord>(
			this.request({
				url: '/submit',
				method: 'POST',
				data
			}),
			decodePromotionRecord
		);
	}

	review(data: PromotionReviewPayload) {
		return asPerformanceServicePromise<PromotionRecord>(
			this.request({
				url: '/review',
				method: 'POST',
				data
			}),
			decodePromotionRecord
		);
	}
}

export const performancePromotionService = new PerformancePromotionService();
