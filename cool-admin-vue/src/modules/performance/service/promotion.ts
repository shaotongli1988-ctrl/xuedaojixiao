import { BaseService } from '/@/cool';
import type { PromotionPageResult, PromotionRecord } from '../types';

/**
 * 晋升管理前端请求服务。
 * 这里只封装模块 7 所需接口，不负责 PIP、薪资或自动推荐能力。
 */
export default class PerformancePromotionService extends BaseService {
	permission = {
		page: 'performance:promotion:page',
		info: 'performance:promotion:info',
		add: 'performance:promotion:add',
		update: 'performance:promotion:update',
		submit: 'performance:promotion:submit',
		review: 'performance:promotion:review'
	};

	constructor() {
		super('admin/performance/promotion');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<PromotionPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<PromotionRecord>;
	}

	createPromotion(data: PromotionRecord) {
		return super.add(data) as unknown as Promise<PromotionRecord>;
	}

	updatePromotion(data: PromotionRecord) {
		return super.update(data) as unknown as Promise<PromotionRecord>;
	}

	submit(data: { id: number }) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<PromotionRecord>;
	}

	review(data: { id: number; decision: 'approved' | 'rejected'; comment?: string }) {
		return this.request({
			url: '/review',
			method: 'POST',
			data
		}) as unknown as Promise<PromotionRecord>;
	}
}

export const performancePromotionService = new PerformancePromotionService();
