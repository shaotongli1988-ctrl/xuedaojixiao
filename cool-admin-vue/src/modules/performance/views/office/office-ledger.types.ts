/**
 * 文件职责：集中定义行政协同台账页的共享视图类型边界。
 * 不负责模块字段实现、请求发送或页面交互逻辑。
 * 维护重点：page/config/service 必须共用这一份类型契约，避免在页面组件里继续维护平行接口定义。
 */

import type {
	AnnualInspectionRecord,
	AnnualInspectionStats,
	DesignCollabRecord,
	DesignCollabStats,
	ExpressCollabRecord,
	ExpressCollabStats,
	HonorRecord,
	HonorStats,
	IntellectualPropertyRecord,
	IntellectualPropertyStats,
	PublicityMaterialRecord,
	PublicityMaterialStats,
	VehicleRecord,
	VehicleStats
} from '../../types';
import type {
	OfficeLedgerBaseRecord,
	OfficeLedgerPageParams,
	OfficeLedgerPageResult,
	OfficeLedgerRemovePayload,
	OfficeLedgerServicePermission,
	OfficeLedgerStats,
	OfficeLedgerStatsParams
} from '../../service/office-ledger';

export type OfficeLedgerFilterValue = string | number | undefined;
export type OfficeLedgerFormScalar = string | number | boolean | null | undefined;
export type OfficeLedgerFormValue = OfficeLedgerFormScalar | string[] | number[];
export type OfficeLedgerFilterState = Record<string, OfficeLedgerFilterValue>;
export type OfficeLedgerFormState = Record<string, OfficeLedgerFormValue>;
export type OfficeLedgerStatsView = Record<string, string | number | null | undefined>;
export type OfficeLedgerTagType = 'success' | 'info' | 'warning' | 'danger' | 'primary';

export interface OfficeLedgerCrudService<
	TRecord extends OfficeLedgerBaseRecord = OfficeLedgerBaseRecord,
	TStats extends OfficeLedgerStats = OfficeLedgerStats
> {
	permission: OfficeLedgerServicePermission;
	fetchPage: (params: OfficeLedgerPageParams) => Promise<OfficeLedgerPageResult<TRecord>>;
	fetchInfo: (params: { id: number }) => Promise<TRecord>;
	fetchStats: (params?: OfficeLedgerStatsParams) => Promise<TStats>;
	createItem: (payload: Partial<TRecord> & Record<string, unknown>) => Promise<unknown>;
	updateItem: (
		payload: Partial<TRecord> & Record<string, unknown> & { id: number }
	) => Promise<unknown>;
	removeItem: (payload: OfficeLedgerRemovePayload) => Promise<void>;
}

export interface OfficeLedgerFieldOption {
	label: string;
	value: string | number;
	type?: string;
}

export interface OfficeLedgerField<
	TRecord extends OfficeLedgerBaseRecord = OfficeLedgerBaseRecord
> {
	prop: string;
	label: string;
	type?: string;
	options?: OfficeLedgerFieldOption[];
	optionsProp?: string;
	required?: boolean;
	rows?: number;
	span?: number;
	width?: string | number;
	minWidth?: string | number;
	min?: number;
	precision?: number;
	placeholder?: string;
	tag?: boolean;
	formatter?: (row: TRecord) => string | number;
}

export interface OfficeLedgerStatsCard {
	key: string;
	label: string;
	helper: string;
}

export interface OfficeLedgerConfig<
	TRecord extends OfficeLedgerBaseRecord = OfficeLedgerBaseRecord
> {
	moduleKey: string;
	title: string;
	description: string;
	entityLabel: string;
	notice: string;
	phaseLabel: string;
	badgeLabel: string;
	filters: OfficeLedgerField<TRecord>[];
	tableColumns: OfficeLedgerField<TRecord>[];
	detailFields: OfficeLedgerField<TRecord>[];
	formFields: OfficeLedgerField<TRecord>[];
	statsCards: OfficeLedgerStatsCard[];
	initialPageSize?: number;
	formWidth?: string;
	documentReference?: { prop: string; label: string } | null;
	createFilters: () => OfficeLedgerFilterState;
	normalizeFilters: (
		filters: Partial<OfficeLedgerFilterState> & Record<string, unknown>
	) => Record<string, unknown>;
	createEmptyForm: () => OfficeLedgerFormState;
	toFormValues: (record: TRecord) => OfficeLedgerFormState;
	toPayload: (form: OfficeLedgerFormState) => Partial<TRecord> & Record<string, unknown>;
	canEditRow?: (row: TRecord) => boolean;
	canDeleteRow?: (row: TRecord) => boolean;
	getDeleteMessage?: (row: TRecord) => string;
	formatStatsValue?: (value: unknown, card: OfficeLedgerStatsCard) => unknown;
	statusMap?: Record<string, { label: string; type?: string }>;
}

export type OfficeLedgerModuleKey =
	| 'annualInspection'
	| 'honor'
	| 'publicityMaterial'
	| 'designCollab'
	| 'expressCollab'
	| 'vehicle'
	| 'intellectualProperty';

export interface OfficeLedgerModuleRecordMap {
	annualInspection: AnnualInspectionRecord;
	honor: HonorRecord;
	publicityMaterial: PublicityMaterialRecord;
	designCollab: DesignCollabRecord;
	expressCollab: ExpressCollabRecord;
	vehicle: VehicleRecord;
	intellectualProperty: IntellectualPropertyRecord;
}

export interface OfficeLedgerModuleStatsMap {
	annualInspection: AnnualInspectionStats;
	honor: HonorStats;
	publicityMaterial: PublicityMaterialStats;
	designCollab: DesignCollabStats;
	expressCollab: ExpressCollabStats;
	vehicle: VehicleStats;
	intellectualProperty: IntellectualPropertyStats;
}

export type OfficeLedgerModuleConfigMap = {
	[K in OfficeLedgerModuleKey]: OfficeLedgerConfig<OfficeLedgerModuleRecordMap[K]>;
};
