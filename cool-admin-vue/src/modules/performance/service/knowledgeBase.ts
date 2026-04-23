/**
 * 知识库前端请求服务。
 * 这里只封装主题21冻结的 knowledgeBase 主链、图谱、搜索和百问百答元数据接口，
 * 不负责正文编辑器、AI 问答、向量检索或员工自助知识门户。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeKnowledgeBasePageResult,
	decodeKnowledgeBaseRecord,
	decodeKnowledgeBaseStats,
	decodeKnowledgeGraphSummary,
	decodeKnowledgeQaListResult,
	decodeKnowledgeQaRecord,
	decodeKnowledgeSearchResult
} from './knowledge-base-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	KnowledgeBaseCreatePayload,
	KnowledgeBasePageQuery,
	KnowledgeBasePageResult,
	KnowledgeBaseRecord,
	KnowledgeBaseRemovePayload,
	KnowledgeBaseStats,
	KnowledgeBaseStatsQuery,
	KnowledgeBaseUpdatePayload,
	KnowledgeGraphSummary,
	KnowledgeQaCreatePayload,
	KnowledgeQaListQuery,
	KnowledgeQaListResult,
	KnowledgeQaRecord,
	KnowledgeSearchQuery,
	KnowledgeSearchResult
} from '../types';

export default class PerformanceKnowledgeBaseService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.knowledgeBase.page,
		stats: PERMISSIONS.performance.knowledgeBase.stats,
		add: PERMISSIONS.performance.knowledgeBase.add,
		update: PERMISSIONS.performance.knowledgeBase.update,
		delete: PERMISSIONS.performance.knowledgeBase.delete,
		graph: PERMISSIONS.performance.knowledgeBase.graph,
		search: PERMISSIONS.performance.knowledgeBase.search,
		qaList: PERMISSIONS.performance.knowledgeBase.qaList,
		qaAdd: PERMISSIONS.performance.knowledgeBase.qaAdd
	};

	constructor() {
		super('admin/performance/knowledgeBase');
	}

	fetchPage(data: KnowledgeBasePageQuery) {
		return asPerformanceServicePromise<KnowledgeBasePageResult>(
			super.page(data),
			decodeKnowledgeBasePageResult
		);
	}

	fetchStats(params?: KnowledgeBaseStatsQuery) {
		return asPerformanceServicePromise<KnowledgeBaseStats>(
			this.request({
				url: '/stats',
				method: 'GET',
				params
			}),
			decodeKnowledgeBaseStats
		);
	}

	createKnowledge(data: KnowledgeBaseCreatePayload) {
		return asPerformanceServicePromise<KnowledgeBaseRecord>(
			super.add(data),
			decodeKnowledgeBaseRecord
		);
	}

	updateKnowledge(data: KnowledgeBaseUpdatePayload) {
		return asPerformanceServicePromise<KnowledgeBaseRecord>(
			super.update(data),
			decodeKnowledgeBaseRecord
		);
	}

	removeKnowledge(data: KnowledgeBaseRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}

	fetchGraph() {
		return asPerformanceServicePromise<KnowledgeGraphSummary>(
			this.request({
				url: '/graph',
				method: 'GET'
			}),
			decodeKnowledgeGraphSummary
		);
	}

	fetchSearch(params: KnowledgeSearchQuery) {
		return asPerformanceServicePromise<KnowledgeSearchResult>(
			this.request({
				url: '/search',
				method: 'GET',
				params
			}),
			decodeKnowledgeSearchResult
		);
	}

	fetchQaList(params?: KnowledgeQaListQuery) {
		return asPerformanceServicePromise<KnowledgeQaListResult>(
			this.request({
				url: '/qaList',
				method: 'GET',
				params
			}),
			decodeKnowledgeQaListResult
		);
	}

	createQa(data: KnowledgeQaCreatePayload) {
		return asPerformanceServicePromise<KnowledgeQaRecord>(
			this.request({
				url: '/qaAdd',
				method: 'POST',
				data
			}),
			decodeKnowledgeQaRecord
		);
	}
}

export const performanceKnowledgeBaseService = new PerformanceKnowledgeBaseService();
