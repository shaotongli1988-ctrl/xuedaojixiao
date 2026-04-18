/**
 * 自动建议引擎前端请求服务。
 * 这里只封装 suggestion 资源和动作接口，不负责正式 PIP/晋升单据创建。
 * 维护重点是权限键、状态动作和后端冻结契约必须保持同名同义。
 */
import { BaseService } from '/@/cool';
import type {
	SuggestionAcceptResult,
	SuggestionPageResult,
	SuggestionRecord,
	SuggestionRevokeReasonCode
} from '../types';

export default class PerformanceSuggestionService extends BaseService {
	permission = {
		page: 'performance:suggestion:page',
		info: 'performance:suggestion:info',
		accept: 'performance:suggestion:accept',
		ignore: 'performance:suggestion:ignore',
		reject: 'performance:suggestion:reject',
		revoke: 'performance:suggestion:revoke'
	};

	constructor() {
		super('admin/performance/suggestion');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<SuggestionPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<SuggestionRecord>;
	}

	accept(data: { id: number }) {
		return this.request({
			url: '/accept',
			method: 'POST',
			data
		}) as unknown as Promise<SuggestionAcceptResult>;
	}

	ignore(data: { id: number }) {
		return this.request({
			url: '/ignore',
			method: 'POST',
			data
		}) as unknown as Promise<SuggestionRecord>;
	}

	reject(data: { id: number }) {
		return this.request({
			url: '/reject',
			method: 'POST',
			data
		}) as unknown as Promise<SuggestionRecord>;
	}

	revoke(data: {
		id: number;
		revokeReasonCode: SuggestionRevokeReasonCode;
		revokeReason: string;
	}) {
		return this.request({
			url: '/revoke',
			method: 'POST',
			data
		}) as unknown as Promise<SuggestionRecord>;
	}
}

export const performanceSuggestionService = new PerformanceSuggestionService();
