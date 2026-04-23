/**
 * 文件职责：提供行政协同 HR-only 元数据台账的标准 CRUD service 工厂；不负责具体页面字段语义或跨模块聚合逻辑。
 * 关键依赖：BaseService、固定的 admin/performance/<module> 路由约定，以及固定的权限动作集合。
 * 维护重点：保持各模块都走同一套 page/info/stats/add/update/delete 请求入口，避免前端自行发散接口形状。
 */

import { BaseService } from '/@/cool/service/base';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeOfficeLedgerBaseRecord,
	decodeOfficeLedgerPageResult,
	decodeOfficeLedgerStats,
	type OfficeLedgerRecordDecoder,
	type OfficeLedgerStatsDecoder
} from './office-ledger-contract';
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

export interface OfficeLedgerStatsParams {
	[key: string]: unknown;
}

export interface OfficeLedgerBaseRecord {
	id?: number;
	[key: string]: unknown;
}

export interface OfficeLedgerStats {
	[key: string]: unknown;
}

export interface OfficeLedgerInfoQuery {
	id: number;
}

export interface OfficeLedgerRemovePayload {
	ids: number[];
}

export type OfficeLedgerCreatePayload<TRecord extends OfficeLedgerBaseRecord> = Partial<TRecord>;

export type OfficeLedgerUpdatePayload<TRecord extends OfficeLedgerBaseRecord> = Partial<TRecord> & {
	id: number;
};

export interface OfficeLedgerPageResult<TRecord extends OfficeLedgerBaseRecord = OfficeLedgerBaseRecord> {
	list: TRecord[];
	pagination?: {
		page?: number;
		size?: number;
		total?: number;
	} | null;
}

export interface OfficeLedgerServiceDecoders<
	TRecord extends OfficeLedgerBaseRecord = OfficeLedgerBaseRecord,
	TStats extends OfficeLedgerStats = OfficeLedgerStats
> {
	decodeRecord?: OfficeLedgerRecordDecoder<TRecord>;
	decodeStats?: OfficeLedgerStatsDecoder<TStats>;
}

export class PerformanceOfficeLedgerService<
	TRecord extends OfficeLedgerBaseRecord = OfficeLedgerBaseRecord,
	TStats extends OfficeLedgerStats = OfficeLedgerStats
> extends BaseService {
	permission: OfficeLedgerServicePermission;
	private readonly decodeRecord: OfficeLedgerRecordDecoder<TRecord>;
	private readonly decodeStats: OfficeLedgerStatsDecoder<TStats>;

	constructor(
		readonly moduleKey: string,
		decoders?: OfficeLedgerServiceDecoders<TRecord, TStats>
	) {
		super(buildOfficeLedgerEndpoint(moduleKey));
		this.permission = buildOfficeLedgerPermissions(moduleKey) as OfficeLedgerServicePermission;
		this.decodeRecord =
			decoders?.decodeRecord ?? (decodeOfficeLedgerBaseRecord as OfficeLedgerRecordDecoder<TRecord>);
		this.decodeStats =
			decoders?.decodeStats ?? (decodeOfficeLedgerStats as OfficeLedgerStatsDecoder<TStats>);
	}

	fetchPage(data: OfficeLedgerPageParams) {
		return asPerformanceServicePromise<OfficeLedgerPageResult<TRecord>>(
			super.page(data),
			value => decodeOfficeLedgerPageResult(value, 'officeLedgerPageResult', this.decodeRecord)
		);
	}

	fetchInfo(params: OfficeLedgerInfoQuery) {
		return asPerformanceServicePromise<TRecord>(super.info(params), this.decodeRecord);
	}

	fetchStats(params?: OfficeLedgerStatsParams) {
		return asPerformanceServicePromise<TStats>(
			this.request({
				url: '/stats',
				method: 'GET',
				params
			}),
			this.decodeStats
		);
	}

	createItem(data: OfficeLedgerCreatePayload<TRecord>) {
		return asPerformanceServicePromise<TRecord>(super.add(data), this.decodeRecord);
	}

	updateItem(data: OfficeLedgerUpdatePayload<TRecord>) {
		return asPerformanceServicePromise<TRecord>(super.update(data), this.decodeRecord);
	}

	removeItem(data: OfficeLedgerRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export function createPerformanceOfficeLedgerService<
	TRecord extends OfficeLedgerBaseRecord = OfficeLedgerBaseRecord,
	TStats extends OfficeLedgerStats = OfficeLedgerStats
>(moduleKey: string, decoders?: OfficeLedgerServiceDecoders<TRecord, TStats>) {
	return new PerformanceOfficeLedgerService<TRecord, TStats>(moduleKey, decoders);
}
