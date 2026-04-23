/**
 * 文件管理前端请求服务。
 * 这里只封装主题21冻结的 documentCenter page/info/stats/add/update/delete 接口，
 * 不负责目录树、真实文件上传、权限继承或二进制内容下载。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeDocumentCenterPageResult,
	decodeDocumentCenterRecord,
	decodeDocumentCenterStats
} from './document-center-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	DocumentCenterCreatePayload,
	DocumentCenterInfoQuery,
	DocumentCenterPageQuery,
	DocumentCenterPageResult,
	DocumentCenterRecord,
	DocumentCenterRemovePayload,
	DocumentCenterStats,
	DocumentCenterStatsQuery,
	DocumentCenterUpdatePayload
} from '../types';

export default class PerformanceDocumentCenterService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.documentCenter.page,
		info: PERMISSIONS.performance.documentCenter.info,
		stats: PERMISSIONS.performance.documentCenter.stats,
		add: PERMISSIONS.performance.documentCenter.add,
		update: PERMISSIONS.performance.documentCenter.update,
		delete: PERMISSIONS.performance.documentCenter.delete
	};

	constructor() {
		super('admin/performance/documentCenter');
	}

	fetchPage(data: DocumentCenterPageQuery) {
		return asPerformanceServicePromise<DocumentCenterPageResult>(
			super.page(data),
			decodeDocumentCenterPageResult
		);
	}

	fetchInfo(params: DocumentCenterInfoQuery) {
		return asPerformanceServicePromise<DocumentCenterRecord>(
			super.info(params),
			decodeDocumentCenterRecord
		);
	}

	fetchStats(params?: DocumentCenterStatsQuery) {
		return asPerformanceServicePromise<DocumentCenterStats>(
			this.request({
				url: '/stats',
				method: 'GET',
				params
			}),
			decodeDocumentCenterStats
		);
	}

	createDocument(data: DocumentCenterCreatePayload) {
		return asPerformanceServicePromise<DocumentCenterRecord>(
			super.add(data),
			decodeDocumentCenterRecord
		);
	}

	updateDocument(data: DocumentCenterUpdatePayload) {
		return asPerformanceServicePromise<DocumentCenterRecord>(
			super.update(data),
			decodeDocumentCenterRecord
		);
	}

	removeDocument(data: DocumentCenterRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceDocumentCenterService = new PerformanceDocumentCenterService();
