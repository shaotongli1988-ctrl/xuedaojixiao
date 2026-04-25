/**
 * 自动建议引擎前端请求服务。
 * 这里只封装 suggestion 资源和动作接口，不负责正式 PIP/晋升单据创建。
 * 维护重点是权限键、状态动作和后端冻结契约必须保持同名同义。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeSuggestionAcceptResult,
	decodeSuggestionPageResult,
	decodeSuggestionRecord
} from './suggestion-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	SuggestionAcceptPayload,
	SuggestionAcceptResult,
	SuggestionIgnorePayload,
	SuggestionInfoQuery,
	SuggestionPageResult,
	SuggestionPageQuery,
	SuggestionRejectPayload,
	SuggestionRecord,
	SuggestionRevokePayload
} from '../types';

export default class PerformanceSuggestionService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.suggestion.page,
		info: PERMISSIONS.performance.suggestion.info,
		accept: PERMISSIONS.performance.suggestion.accept,
		ignore: PERMISSIONS.performance.suggestion.ignore,
		reject: PERMISSIONS.performance.suggestion.reject,
		revoke: PERMISSIONS.performance.suggestion.revoke
	};

	constructor() {
		super('admin/performance/suggestion');
	}

	fetchPage(data: SuggestionPageQuery) {
		return asPerformanceServicePromise<SuggestionPageResult>(
			super.page(data),
			decodeSuggestionPageResult
		);
	}

	fetchInfo(params: SuggestionInfoQuery) {
		return asPerformanceServicePromise<SuggestionRecord>(
			super.info(params),
			decodeSuggestionRecord
		);
	}

	accept(data: SuggestionAcceptPayload) {
		return asPerformanceServicePromise<SuggestionAcceptResult>(
			this.request({
				url: '/accept',
				method: 'POST',
				data
			}),
			decodeSuggestionAcceptResult
		);
	}

	ignore(data: SuggestionIgnorePayload) {
		return asPerformanceServicePromise<SuggestionRecord>(
			this.request({
				url: '/ignore',
				method: 'POST',
				data
			}),
			decodeSuggestionRecord
		);
	}

	reject(data: SuggestionRejectPayload) {
		return asPerformanceServicePromise<SuggestionRecord>(
			this.request({
				url: '/reject',
				method: 'POST',
				data
			}),
			decodeSuggestionRecord
		);
	}

	revoke(data: SuggestionRevokePayload) {
		return asPerformanceServicePromise<SuggestionRecord>(
			this.request({
				url: '/revoke',
				method: 'POST',
				data
			}),
			decodeSuggestionRecord
		);
	}
}

export const performanceSuggestionService = new PerformanceSuggestionService();
