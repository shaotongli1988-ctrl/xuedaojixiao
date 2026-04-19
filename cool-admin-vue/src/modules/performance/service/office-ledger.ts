/**
 * 文件职责：提供行政协同 HR-only 元数据台账的标准 CRUD service 工厂；不负责具体页面字段语义或跨模块聚合逻辑。
 * 关键依赖：BaseService、固定的 admin/performance/<module> 路由约定，以及固定的权限动作集合。
 * 维护重点：保持各模块都走同一套 page/info/stats/add/update/delete 请求入口，避免前端自行发散接口形状。
 */

import { BaseService } from '/@/cool';
import { buildOfficeLedgerEndpoint, buildOfficeLedgerPermissions } from './office-ledger-shared.js';

export interface OfficeLedgerServicePermission {
	page: string;
	info: string;
	stats: string;
	add: string;
	update: string;
	delete: string;
}

export interface OfficeLedgerPageParams {
	page: number;
	size: number;
	[key: string]: unknown;
}

export interface OfficeLedgerPageResult<TRecord = Record<string, unknown>> {
	list: TRecord[];
	pagination?: {
		page?: number;
		size?: number;
		total?: number;
	} | null;
}

export class PerformanceOfficeLedgerService<TRecord = Record<string, unknown>> extends BaseService {
	permission: OfficeLedgerServicePermission;

	constructor(readonly moduleKey: string) {
		super(buildOfficeLedgerEndpoint(moduleKey));
		this.permission = buildOfficeLedgerPermissions(moduleKey) as OfficeLedgerServicePermission;
	}

	fetchPage(data: OfficeLedgerPageParams) {
		return super.page(data) as unknown as Promise<OfficeLedgerPageResult<TRecord>>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<TRecord>;
	}

	fetchStats(params?: Record<string, unknown>) {
		return this.request({
			url: '/stats',
			method: 'GET',
			params
		}) as unknown as Promise<Record<string, unknown>>;
	}

	createItem(data: Partial<TRecord>) {
		return super.add(data) as unknown as Promise<TRecord>;
	}

	updateItem(data: Partial<TRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<TRecord>;
	}

	removeItem(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export function createPerformanceOfficeLedgerService<TRecord = Record<string, unknown>>(moduleKey: string) {
	return new PerformanceOfficeLedgerService<TRecord>(moduleKey);
}
