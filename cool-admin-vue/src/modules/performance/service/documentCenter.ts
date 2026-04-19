/**
 * 文件管理前端请求服务。
 * 这里只封装主题21冻结的 documentCenter page/info/stats/add/update/delete 接口，
 * 不负责目录树、真实文件上传、权限继承或二进制内容下载。
 */
import { BaseService } from '/@/cool';
import type {
	DocumentCenterPageResult,
	DocumentCenterRecord,
	DocumentCenterStats
} from '../types';

export default class PerformanceDocumentCenterService extends BaseService {
	permission = {
		page: 'performance:documentCenter:page',
		info: 'performance:documentCenter:info',
		stats: 'performance:documentCenter:stats',
		add: 'performance:documentCenter:add',
		update: 'performance:documentCenter:update',
		delete: 'performance:documentCenter:delete'
	};

	constructor() {
		super('admin/performance/documentCenter');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		status?: string;
		category?: string;
		confidentiality?: string;
		storage?: string;
	}) {
		return super.page(data) as unknown as Promise<DocumentCenterPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<DocumentCenterRecord>;
	}

	fetchStats(params?: {
		keyword?: string;
		status?: string;
		category?: string;
		confidentiality?: string;
		storage?: string;
	}) {
		return this.request({
			url: '/stats',
			method: 'GET',
			params
		}) as unknown as Promise<DocumentCenterStats>;
	}

	createDocument(data: Partial<DocumentCenterRecord>) {
		return super.add(data) as unknown as Promise<DocumentCenterRecord>;
	}

	updateDocument(data: Partial<DocumentCenterRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<DocumentCenterRecord>;
	}

	removeDocument(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performanceDocumentCenterService = new PerformanceDocumentCenterService();
