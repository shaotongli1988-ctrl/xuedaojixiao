/**
 * 知识库前端请求服务。
 * 这里只封装主题21冻结的 knowledgeBase 主链、图谱、搜索和百问百答元数据接口，
 * 不负责正文编辑器、AI 问答、向量检索或员工自助知识门户。
 */
import { BaseService } from '/@/cool';
import type {
	KnowledgeBasePageResult,
	KnowledgeBaseRecord,
	KnowledgeBaseStats,
	KnowledgeGraphSummary,
	KnowledgeQaRecord,
	KnowledgeSearchResult
} from '../types';

export default class PerformanceKnowledgeBaseService extends BaseService {
	permission = {
		page: 'performance:knowledgeBase:page',
		stats: 'performance:knowledgeBase:stats',
		add: 'performance:knowledgeBase:add',
		update: 'performance:knowledgeBase:update',
		delete: 'performance:knowledgeBase:delete',
		graph: 'performance:knowledgeBase:graph',
		search: 'performance:knowledgeBase:search',
		qaList: 'performance:knowledgeBase:qaList',
		qaAdd: 'performance:knowledgeBase:qaAdd'
	};

	constructor() {
		super('admin/performance/knowledgeBase');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		status?: string;
		category?: string;
		tag?: string;
	}) {
		return super.page(data) as unknown as Promise<KnowledgeBasePageResult>;
	}

	fetchStats(params?: {
		keyword?: string;
		status?: string;
		category?: string;
		tag?: string;
	}) {
		return this.request({
			url: '/stats',
			method: 'GET',
			params
		}) as unknown as Promise<KnowledgeBaseStats>;
	}

	createKnowledge(data: Partial<KnowledgeBaseRecord>) {
		return super.add(data) as unknown as Promise<KnowledgeBaseRecord>;
	}

	updateKnowledge(data: Partial<KnowledgeBaseRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<KnowledgeBaseRecord>;
	}

	removeKnowledge(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}

	fetchGraph() {
		return this.request({
			url: '/graph',
			method: 'GET'
		}) as unknown as Promise<KnowledgeGraphSummary>;
	}

	fetchSearch(params: { keyword: string }) {
		return this.request({
			url: '/search',
			method: 'GET',
			params
		}) as unknown as Promise<KnowledgeSearchResult>;
	}

	fetchQaList(params?: { keyword?: string }) {
		return this.request({
			url: '/qaList',
			method: 'GET',
			params
		}) as unknown as Promise<KnowledgeQaRecord[] | { list?: KnowledgeQaRecord[] }>;
	}

	createQa(data: Partial<KnowledgeQaRecord>) {
		return this.request({
			url: '/qaAdd',
			method: 'POST',
			data
		}) as unknown as Promise<KnowledgeQaRecord>;
	}
}

export const performanceKnowledgeBaseService = new PerformanceKnowledgeBaseService();
