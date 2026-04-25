/**
 * 文件职责：定义 Theme22 行政协同 5 个 HR-only 元数据台账页面的共享配置；不负责请求发送或 Vue 状态管理。
 * 关键依赖：各模块字段语义、状态枚举、统计键与后端 office-collab-record 契约必须一致。
 * 维护重点：页面保留各自业务命名，但不能脱离后端契约另起一套字段或状态。
 */

import type {
	AnnualInspectionRecord,
	DesignCollabRecord,
	ExpressCollabRecord,
	HonorRecord,
	IntellectualPropertyRecord,
	PublicityMaterialRecord,
	VehicleRecord
} from '../../types';
import {
	ANNUAL_INSPECTION_CATEGORY_OPTIONS,
	ANNUAL_INSPECTION_STATUS_OPTIONS,
	DESIGN_COLLAB_PRIORITY_OPTIONS,
	DESIGN_COLLAB_STATUS_OPTIONS,
	EXPRESS_COLLAB_SERVICE_LEVEL_OPTIONS,
	EXPRESS_COLLAB_STATUS_OPTIONS,
	EXPRESS_COLLAB_SYNC_STATUS_OPTIONS,
	HONOR_LEVEL_OPTIONS,
	HONOR_STATUS_OPTIONS,
	HONOR_TYPE_OPTIONS,
	INTELLECTUAL_PROPERTY_RISK_LEVEL_OPTIONS,
	INTELLECTUAL_PROPERTY_STATUS_OPTIONS,
	INTELLECTUAL_PROPERTY_TYPE_OPTIONS,
	PUBLICITY_MATERIAL_CHANNEL_OPTIONS,
	PUBLICITY_MATERIAL_STATUS_OPTIONS,
	PUBLICITY_MATERIAL_TYPE_OPTIONS,
	VEHICLE_STATUS_OPTIONS,
	VEHICLE_TYPE_OPTIONS
} from '../../office-ledger.dictionary';
import type { OfficeLedgerBaseRecord } from '../../service/office-ledger';
import type {
	OfficeLedgerConfig,
	OfficeLedgerField,
	OfficeLedgerFieldOption,
	OfficeLedgerFilterState,
	OfficeLedgerFormState,
	OfficeLedgerModuleConfigMap,
	OfficeLedgerStatsCard
} from './office-ledger.types';

interface OfficeLedgerModuleConfigInput<TRecord extends OfficeLedgerBaseRecord>
	extends Record<string, unknown> {
	moduleKey: string;
	title: string;
	description: string;
	entityLabel: string;
	notice: string;
	route: string;
	primaryTextProp: keyof TRecord & string;
	statusOptions: OfficeLedgerFieldOption[];
	filters: OfficeLedgerField<TRecord>[];
	tableColumns: OfficeLedgerField<TRecord>[];
	detailFields: OfficeLedgerField<TRecord>[];
	formFields: OfficeLedgerField<TRecord>[];
	statsCards: OfficeLedgerStatsCard[];
	phaseLabel?: string;
	badgeLabel?: string;
	initialPageSize?: number;
	formWidth?: string;
	documentReference?: { prop: string; label: string } | null;
	createFilters?: () => OfficeLedgerFilterState;
	normalizeFilters?: (
		filters: Partial<OfficeLedgerFilterState> & Record<string, unknown>
	) => Record<string, unknown>;
	createEmptyForm?: () => OfficeLedgerFormState;
	toFormValues?: (record: TRecord) => OfficeLedgerFormState;
	toPayload?: (form: OfficeLedgerFormState) => Partial<TRecord> & Record<string, unknown>;
	canEditRow?: (row: TRecord) => boolean;
	canDeleteRow?: (row: TRecord) => boolean;
	getDeleteMessage?: (row: TRecord) => string;
	formatStatsValue?: (value: unknown, card: OfficeLedgerStatsCard) => unknown;
}

function splitTextList(value: unknown) {
	return String(value || '')
		.split(/[,\s，]+/)
		.map(item => item.trim())
		.filter(Boolean);
}

function buildStatusMap(options: OfficeLedgerFieldOption[]) {
	return options.reduce<Record<string, { label: string; type?: string }>>((map, option) => {
		map[option.value] = option;
		return map;
	}, {});
}

function asNumber(value: unknown, fallback = 0) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDate(value: string | null | undefined) {
	return value || '-';
}

function formatDocumentRef(
	row:
		| { relatedDocumentSummary?: { fileNo?: string; fileName?: string } | null }
		| null
		| undefined
) {
	if (row?.relatedDocumentSummary?.fileNo) {
		return `${row.relatedDocumentSummary.fileNo} / ${row.relatedDocumentSummary.fileName}`;
	}
	return '-';
}

function createBaseConfig<TRecord extends OfficeLedgerBaseRecord, TExtra extends object = {}>(
	config: OfficeLedgerModuleConfigInput<TRecord> & TExtra
): OfficeLedgerConfig<TRecord> & TExtra {
	const statusMap = buildStatusMap(config.statusOptions);
	return {
		phaseLabel: '行政协同 / Theme22',
		badgeLabel: 'Theme 22',
		initialPageSize: 10,
		formWidth: '860px',
		documentReference: null,
		formatStatsValue: value => asNumber(value, 0),
		createFilters: () => ({
			keyword: '',
			status: ''
		}),
		normalizeFilters: filters => ({
			keyword: String(filters.keyword || '').trim() || undefined,
			status: filters.status || undefined
		}),
		createEmptyForm: () => ({
			status: config.statusOptions[0]?.value || '',
			tagsText: '',
			notes: ''
		}),
		toFormValues: record => ({
			...record,
			tagsText: Array.isArray(record?.tags) ? record.tags.join('，') : ''
		}),
		toPayload: form => ({
			...form,
			tags: splitTextList(form.tagsText)
		}),
		canEditRow: row => !['archived'].includes(String(row?.status || '')),
		canDeleteRow: row => !['archived'].includes(String(row?.status || '')),
		getDeleteMessage: row =>
			`确认删除“${String(
				row?.[config.primaryTextProp] || row?.title || row?.id || '当前记录'
			)}”吗？此操作只移除元数据台账记录。`,
		statusMap,
		...config
	};
}

export const officeLedgerModules = {
	annualInspection: createBaseConfig<AnnualInspectionRecord>({
		moduleKey: 'annualInspection',
		title: '年检材料',
		route: '/performance/office/annual-inspection',
		description: '维护年检材料台账的标题、责任人、截止日期和材料完整度元数据。',
		entityLabel: '年检材料',
		primaryTextProp: 'title',
		notice: '只维护后台元数据，不保存真实扫描件、外部系统账号或监管密码。',
		statusOptions: [...ANNUAL_INSPECTION_STATUS_OPTIONS],
		filters: [
			{
				prop: 'keyword',
				label: '标题 / 编号',
				type: 'text',
				width: '240px',
				placeholder: '标题 / 材料编号'
			},
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				width: '160px',
				optionsProp: 'status'
			},
			{
				prop: 'category',
				label: '年检分类',
				type: 'select',
				width: '180px',
				options: [...ANNUAL_INSPECTION_CATEGORY_OPTIONS]
			}
		],
		createFilters: () => ({
			keyword: '',
			status: '',
			category: ''
		}),
		normalizeFilters: filters => ({
			keyword: String(filters.keyword || '').trim() || undefined,
			status: filters.status || undefined,
			category: filters.category || undefined
		}),
		statsCards: [
			{ key: 'total', label: '材料总数', helper: '当前筛选范围内的年检材料数量' },
			{ key: 'overdueCount', label: '已逾期', helper: '截止日期已过且未完成的事项' },
			{ key: 'approvedCount', label: '已完成', helper: '已审核完成的事项' },
			{ key: 'avgCompleteness', label: '平均完整度', helper: '材料完整度平均值' }
		],
		tableColumns: [
			{ prop: 'materialNo', label: '材料编号', minWidth: 140 },
			{ prop: 'title', label: '事项标题', minWidth: 180 },
			{ prop: 'category', label: '分类', minWidth: 120, optionsProp: 'category' },
			{ prop: 'department', label: '部门', minWidth: 120 },
			{ prop: 'ownerName', label: '负责人', minWidth: 120 },
			{ prop: 'dueDate', label: '截止日期', minWidth: 130, type: 'date' },
			{ prop: 'completeness', label: '完整度', width: 100 },
			{ prop: 'status', label: '状态', width: 110, optionsProp: 'status', tag: true }
		],
		detailFields: [
			{ prop: 'materialNo', label: '材料编号' },
			{ prop: 'title', label: '事项标题' },
			{ prop: 'category', label: '分类', optionsProp: 'category' },
			{ prop: 'department', label: '部门' },
			{ prop: 'ownerName', label: '负责人' },
			{ prop: 'dueDate', label: '截止日期', type: 'date' },
			{ prop: 'version', label: '版本' },
			{ prop: 'completeness', label: '完整度' },
			{ prop: 'reminderDays', label: '提醒天数' },
			{ prop: 'status', label: '状态', optionsProp: 'status', tag: true },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2 }
		],
		formFields: [
			{ prop: 'materialNo', label: '材料编号', type: 'text', required: true },
			{ prop: 'title', label: '事项标题', type: 'text', required: true },
			{
				prop: 'category',
				label: '年检分类',
				type: 'select',
				required: true,
				options: [...ANNUAL_INSPECTION_CATEGORY_OPTIONS]
			},
			{ prop: 'department', label: '所属部门', type: 'text', required: true },
			{ prop: 'ownerName', label: '负责人', type: 'text', required: true },
			{ prop: 'dueDate', label: '截止日期', type: 'date', required: true },
			{ prop: 'version', label: '版本', type: 'text', required: true },
			{ prop: 'completeness', label: '完整度', type: 'number', min: 0, precision: 0 },
			{ prop: 'reminderDays', label: '提醒天数', type: 'number', min: 0, precision: 0 },
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				required: true,
				optionsProp: 'status'
			},
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2, rows: 4 }
		]
	}),
	honor: createBaseConfig<HonorRecord>({
		moduleKey: 'honor',
		title: '荣誉管理',
		route: '/performance/office/honor',
		description: '维护荣誉标题、对象、级别、授予单位和影响分元数据。',
		entityLabel: '荣誉记录',
		primaryTextProp: 'title',
		notice: '只维护后台元数据，不保存证书原图、展示页或对外分享链接。',
		statusOptions: [...HONOR_STATUS_OPTIONS],
		filters: [
			{
				prop: 'keyword',
				label: '标题 / 编号',
				type: 'text',
				width: '240px',
				placeholder: '荣誉标题 / 荣誉编号'
			},
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				width: '160px',
				optionsProp: 'status'
			},
			{
				prop: 'honorType',
				label: '对象类型',
				type: 'select',
				width: '160px',
				options: [...HONOR_TYPE_OPTIONS]
			}
		],
		createFilters: () => ({
			keyword: '',
			status: '',
			honorType: ''
		}),
		normalizeFilters: filters => ({
			keyword: String(filters.keyword || '').trim() || undefined,
			status: filters.status || undefined,
			honorType: filters.honorType || undefined
		}),
		statsCards: [
			{ key: 'total', label: '荣誉总数', helper: '当前筛选范围内的荣誉记录数量' },
			{ key: 'publishedCount', label: '已发布', helper: '可用于展示的荣誉数量' },
			{ key: 'thisYearCount', label: '本年度', helper: '授予日期在本年度的荣誉' },
			{ key: 'avgImpactScore', label: '平均影响分', helper: '荣誉影响分平均值' }
		],
		tableColumns: [
			{ prop: 'honorNo', label: '荣誉编号', minWidth: 140 },
			{ prop: 'title', label: '荣誉标题', minWidth: 180 },
			{ prop: 'honorType', label: '对象类型', minWidth: 120, optionsProp: 'honorType' },
			{ prop: 'level', label: '荣誉级别', minWidth: 120, optionsProp: 'level' },
			{ prop: 'winnerName', label: '获奖对象', minWidth: 140 },
			{ prop: 'awardedAt', label: '授予日期', minWidth: 130, type: 'date' },
			{ prop: 'impactScore', label: '影响分', width: 100 },
			{ prop: 'status', label: '状态', width: 110, optionsProp: 'status', tag: true }
		],
		detailFields: [
			{ prop: 'honorNo', label: '荣誉编号' },
			{ prop: 'title', label: '荣誉标题' },
			{ prop: 'honorType', label: '对象类型', optionsProp: 'honorType' },
			{ prop: 'level', label: '荣誉级别', optionsProp: 'level' },
			{ prop: 'winnerName', label: '获奖对象' },
			{ prop: 'department', label: '所属部门' },
			{ prop: 'issuer', label: '授予单位' },
			{ prop: 'awardedAt', label: '授予日期', type: 'date' },
			{ prop: 'impactScore', label: '影响分' },
			{ prop: 'status', label: '状态', optionsProp: 'status', tag: true },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2 }
		],
		formFields: [
			{ prop: 'honorNo', label: '荣誉编号', type: 'text', required: true },
			{ prop: 'title', label: '荣誉标题', type: 'text', required: true },
			{
				prop: 'honorType',
				label: '对象类型',
				type: 'select',
				required: true,
				options: [...HONOR_TYPE_OPTIONS]
			},
			{
				prop: 'level',
				label: '荣誉级别',
				type: 'select',
				required: true,
				options: [...HONOR_LEVEL_OPTIONS]
			},
			{ prop: 'winnerName', label: '获奖对象', type: 'text', required: true },
			{ prop: 'department', label: '所属部门', type: 'text', required: true },
			{ prop: 'issuer', label: '授予单位', type: 'text', required: true },
			{ prop: 'awardedAt', label: '授予日期', type: 'date', required: true },
			{ prop: 'impactScore', label: '影响分', type: 'number', min: 0, precision: 0 },
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				required: true,
				optionsProp: 'status'
			},
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2, rows: 4 }
		]
	}),
	publicityMaterial: createBaseConfig<PublicityMaterialRecord>({
		moduleKey: 'publicityMaterial',
		title: '宣传资料',
		route: '/performance/office/publicity-material',
		description: '维护宣传资料标题、类型、渠道、浏览量和引用文件元数据。',
		entityLabel: '宣传资料',
		primaryTextProp: 'title',
		notice: '可关联文件管理台账元数据，但不提供真实素材上传、预览和下载。',
		documentReference: {
			prop: 'documentIds',
			label: '关联文件元数据'
		},
		statusOptions: [...PUBLICITY_MATERIAL_STATUS_OPTIONS],
		filters: [
			{
				prop: 'keyword',
				label: '标题 / 编号',
				type: 'text',
				width: '240px',
				placeholder: '宣传标题 / 资料编号'
			},
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				width: '160px',
				optionsProp: 'status'
			},
			{
				prop: 'materialType',
				label: '资料类型',
				type: 'select',
				width: '180px',
				options: [...PUBLICITY_MATERIAL_TYPE_OPTIONS]
			}
		],
		createFilters: () => ({
			keyword: '',
			status: '',
			materialType: ''
		}),
		normalizeFilters: filters => ({
			keyword: String(filters.keyword || '').trim() || undefined,
			status: filters.status || undefined,
			materialType: filters.materialType || undefined
		}),
		createEmptyForm: () => ({
			status: 'draft',
			documentIds: [],
			tagsText: '',
			notes: ''
		}),
		toFormValues: record => {
			const { relatedDocumentSummary: _relatedDocumentSummary, ...formRecord } = record;
			return {
				...formRecord,
				documentIds: record?.relatedDocumentId ? [Number(record.relatedDocumentId)] : [],
				tagsText: Array.isArray(record?.tags) ? record.tags.join('，') : ''
			};
		},
		toPayload: form => ({
			...form,
			relatedDocumentId:
				Array.isArray(form.documentIds) && form.documentIds.length
					? Number(form.documentIds[0])
					: null,
			tags: splitTextList(form.tagsText)
		}),
		statsCards: [
			{ key: 'total', label: '资料总数', helper: '当前筛选范围内的宣传资料数量' },
			{ key: 'reviewingCount', label: '待审核', helper: '等待发布审核的资料' },
			{ key: 'publishedCount', label: '已发布', helper: '可投放的资料数量' },
			{ key: 'totalViews', label: '总浏览量', helper: '所有资料浏览量汇总' }
		],
		tableColumns: [
			{ prop: 'materialNo', label: '资料编号', minWidth: 140 },
			{ prop: 'title', label: '资料标题', minWidth: 180 },
			{ prop: 'materialType', label: '资料类型', minWidth: 120, optionsProp: 'materialType' },
			{ prop: 'channel', label: '投放渠道', minWidth: 120, optionsProp: 'channel' },
			{ prop: 'ownerName', label: '负责人', minWidth: 120 },
			{ prop: 'publishDate', label: '发布日期', minWidth: 130, type: 'date' },
			{ prop: 'views', label: '浏览量', width: 100 },
			{ prop: 'status', label: '状态', width: 110, optionsProp: 'status', tag: true }
		],
		detailFields: [
			{ prop: 'materialNo', label: '资料编号' },
			{ prop: 'title', label: '资料标题' },
			{ prop: 'materialType', label: '资料类型', optionsProp: 'materialType' },
			{ prop: 'channel', label: '投放渠道', optionsProp: 'channel' },
			{ prop: 'ownerName', label: '负责人' },
			{ prop: 'designOwner', label: '设计负责人' },
			{ prop: 'publishDate', label: '发布日期', type: 'date' },
			{ prop: 'views', label: '浏览量' },
			{ prop: 'downloads', label: '下载量' },
			{
				prop: 'relatedDocumentId',
				label: '关联文件',
				formatter: row => formatDocumentRef(row),
				span: 2
			},
			{ prop: 'status', label: '状态', optionsProp: 'status', tag: true },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2 }
		],
		formFields: [
			{ prop: 'materialNo', label: '资料编号', type: 'text', required: true },
			{ prop: 'title', label: '资料标题', type: 'text', required: true },
			{
				prop: 'materialType',
				label: '资料类型',
				type: 'select',
				required: true,
				options: [...PUBLICITY_MATERIAL_TYPE_OPTIONS]
			},
			{
				prop: 'channel',
				label: '投放渠道',
				type: 'select',
				required: true,
				options: [...PUBLICITY_MATERIAL_CHANNEL_OPTIONS]
			},
			{ prop: 'ownerName', label: '负责人', type: 'text', required: true },
			{ prop: 'designOwner', label: '设计负责人', type: 'text', required: true },
			{ prop: 'publishDate', label: '发布日期', type: 'date', required: true },
			{ prop: 'views', label: '浏览量', type: 'number', min: 0, precision: 0 },
			{ prop: 'downloads', label: '下载量', type: 'number', min: 0, precision: 0 },
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				required: true,
				optionsProp: 'status'
			},
			{ prop: 'documentIds', label: '关联文件元数据', type: 'document-multi', span: 2 },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2, rows: 4 }
		]
	}),
	designCollab: createBaseConfig<DesignCollabRecord>({
		moduleKey: 'designCollab',
		title: '美工协同',
		route: '/performance/office/design-collab',
		description: '维护设计协同的需求标题、优先级、需求方、执行人和进度元数据。',
		entityLabel: '设计协同',
		primaryTextProp: 'title',
		notice: '只维护协同元数据，不上传源文件、不提供评论流和审稿链接。',
		statusOptions: [...DESIGN_COLLAB_STATUS_OPTIONS],
		filters: [
			{
				prop: 'keyword',
				label: '标题 / 编号',
				type: 'text',
				width: '240px',
				placeholder: '任务标题 / 任务编号'
			},
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				width: '160px',
				optionsProp: 'status'
			},
			{
				prop: 'priority',
				label: '优先级',
				type: 'select',
				width: '160px',
				options: [...DESIGN_COLLAB_PRIORITY_OPTIONS]
			}
		],
		createFilters: () => ({
			keyword: '',
			status: '',
			priority: ''
		}),
		normalizeFilters: filters => ({
			keyword: String(filters.keyword || '').trim() || undefined,
			status: filters.status || undefined,
			priority: filters.priority || undefined
		}),
		statsCards: [
			{ key: 'total', label: '任务总数', helper: '当前筛选范围内的设计协同任务数量' },
			{ key: 'doneCount', label: '已完成', helper: '已经完成交付的任务' },
			{ key: 'inProgressCount', label: '处理中', helper: '正在执行中的任务' },
			{ key: 'overdueCount', label: '已逾期', helper: '截止日期已过但未完成的任务' }
		],
		tableColumns: [
			{ prop: 'taskNo', label: '任务编号', minWidth: 140 },
			{ prop: 'title', label: '任务标题', minWidth: 180 },
			{ prop: 'requesterName', label: '需求方', minWidth: 120 },
			{ prop: 'assigneeName', label: '执行人', minWidth: 120 },
			{ prop: 'priority', label: '优先级', width: 110, optionsProp: 'priority', tag: true },
			{ prop: 'dueDate', label: '截止日期', minWidth: 130, type: 'date' },
			{ prop: 'progress', label: '进度', width: 90 },
			{ prop: 'status', label: '状态', width: 110, optionsProp: 'status', tag: true }
		],
		detailFields: [
			{ prop: 'taskNo', label: '任务编号' },
			{ prop: 'title', label: '任务标题' },
			{ prop: 'requesterName', label: '需求方' },
			{ prop: 'assigneeName', label: '执行人' },
			{ prop: 'priority', label: '优先级', optionsProp: 'priority', tag: true },
			{ prop: 'dueDate', label: '截止日期', type: 'date' },
			{ prop: 'progress', label: '任务进度' },
			{ prop: 'workload', label: '工作量' },
			{ prop: 'relatedMaterialNo', label: '关联资料编号' },
			{ prop: 'status', label: '状态', optionsProp: 'status', tag: true },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2 }
		],
		formFields: [
			{ prop: 'taskNo', label: '任务编号', type: 'text', required: true },
			{ prop: 'title', label: '任务标题', type: 'text', required: true },
			{ prop: 'requesterName', label: '需求方', type: 'text', required: true },
			{ prop: 'assigneeName', label: '执行人', type: 'text', required: true },
			{
				prop: 'priority',
				label: '优先级',
				type: 'select',
				required: true,
				options: [...DESIGN_COLLAB_PRIORITY_OPTIONS]
			},
			{ prop: 'dueDate', label: '截止日期', type: 'date', required: true },
			{ prop: 'progress', label: '任务进度', type: 'number', min: 0, precision: 0 },
			{ prop: 'workload', label: '工作量', type: 'number', min: 1, precision: 0 },
			{ prop: 'relatedMaterialNo', label: '关联资料编号', type: 'text' },
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				required: true,
				optionsProp: 'status'
			},
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2, rows: 4 }
		]
	}),
	expressCollab: createBaseConfig<ExpressCollabRecord>({
		moduleKey: 'expressCollab',
		title: '快递协同',
		route: '/performance/office/express-collab',
		description: '维护运单号、快递公司、寄收件人、同步状态和最近事件时间元数据。',
		entityLabel: '快递协同',
		primaryTextProp: 'trackingNo',
		notice: '只维护寄递元数据，不接第三方物流轨迹、面单打印和结算流程。',
		statusOptions: [...EXPRESS_COLLAB_STATUS_OPTIONS],
		filters: [
			{
				prop: 'keyword',
				label: '单号 / 订单',
				type: 'text',
				width: '260px',
				placeholder: '运单号 / 订单号 / 标题'
			},
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				width: '160px',
				optionsProp: 'status'
			},
			{
				prop: 'serviceLevel',
				label: '服务等级',
				type: 'select',
				width: '160px',
				options: [...EXPRESS_COLLAB_SERVICE_LEVEL_OPTIONS]
			}
		],
		createFilters: () => ({
			keyword: '',
			status: '',
			serviceLevel: ''
		}),
		normalizeFilters: filters => ({
			keyword: String(filters.keyword || '').trim() || undefined,
			status: filters.status || undefined,
			serviceLevel: filters.serviceLevel || undefined
		}),
		statsCards: [
			{ key: 'total', label: '运单总数', helper: '当前筛选范围内的运单数量' },
			{ key: 'inTransitCount', label: '运输中', helper: '正在运输中的运单' },
			{ key: 'deliveredCount', label: '已送达', helper: '已经确认送达的运单' },
			{ key: 'exceptionCount', label: '异常件', helper: '需要人工跟进的运单' }
		],
		tableColumns: [
			{ prop: 'trackingNo', label: '运单号', minWidth: 160 },
			{ prop: 'orderNo', label: '订单号', minWidth: 140 },
			{ prop: 'courierCompany', label: '快递公司', minWidth: 120 },
			{ prop: 'senderName', label: '寄件人', minWidth: 120 },
			{ prop: 'receiverName', label: '收件人', minWidth: 120 },
			{ prop: 'etaDate', label: '预计送达', minWidth: 130, type: 'date' },
			{
				prop: 'syncStatus',
				label: '同步状态',
				minWidth: 110,
				optionsProp: 'syncStatus',
				tag: true
			},
			{ prop: 'status', label: '状态', width: 110, optionsProp: 'status', tag: true }
		],
		detailFields: [
			{ prop: 'trackingNo', label: '运单号' },
			{ prop: 'orderNo', label: '订单号' },
			{ prop: 'courierCompany', label: '快递公司' },
			{ prop: 'serviceLevel', label: '服务等级', optionsProp: 'serviceLevel' },
			{ prop: 'origin', label: '寄出地' },
			{ prop: 'destination', label: '目的地' },
			{ prop: 'senderName', label: '寄件人' },
			{ prop: 'receiverName', label: '收件人' },
			{ prop: 'etaDate', label: '预计送达', type: 'date' },
			{ prop: 'lastUpdate', label: '最近更新时间', type: 'date' },
			{ prop: 'status', label: '状态', optionsProp: 'status', tag: true },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2 }
		],
		formFields: [
			{ prop: 'trackingNo', label: '运单号', type: 'text', required: true },
			{ prop: 'orderNo', label: '订单号', type: 'text', required: true },
			{ prop: 'title', label: '标题', type: 'text', required: true },
			{ prop: 'courierCompany', label: '快递公司', type: 'text', required: true },
			{
				prop: 'serviceLevel',
				label: '服务等级',
				type: 'select',
				required: true,
				options: [...EXPRESS_COLLAB_SERVICE_LEVEL_OPTIONS]
			},
			{ prop: 'origin', label: '寄出地', type: 'text' },
			{ prop: 'destination', label: '目的地', type: 'text' },
			{ prop: 'senderName', label: '寄件人', type: 'text', required: true },
			{ prop: 'receiverName', label: '收件人', type: 'text', required: true },
			{ prop: 'sourceSystem', label: '来源系统', type: 'text' },
			{
				prop: 'syncStatus',
				label: '同步状态',
				type: 'select',
				required: true,
				options: [...EXPRESS_COLLAB_SYNC_STATUS_OPTIONS]
			},
			{ prop: 'lastEvent', label: '最近事件', type: 'text' },
			{ prop: 'lastUpdate', label: '最近更新时间', type: 'date', required: true },
			{ prop: 'etaDate', label: '预计送达', type: 'date', required: true },
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				required: true,
				optionsProp: 'status'
			},
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2, rows: 4 }
		]
	}),
	vehicle: createBaseConfig<VehicleRecord>({
		moduleKey: 'vehicle',
		title: '车辆管理',
		route: '/performance/office/vehicle',
		phaseLabel: '行政协同 / 行政主模块',
		badgeLabel: 'Admin Ledger',
		description: '维护车辆编号、车牌、到期日期和使用范围等台账元数据。',
		entityLabel: '车辆',
		primaryTextProp: 'plateNo',
		notice: '只维护后台台账元数据，不处理用车申请、调度回车、维保工单或费用结算。',
		statusOptions: [...VEHICLE_STATUS_OPTIONS],
		vehicleType: [...VEHICLE_TYPE_OPTIONS],
		filters: [
			{
				prop: 'keyword',
				label: '车辆编号 / 车牌',
				type: 'text',
				width: '240px',
				placeholder: '车辆编号 / 车牌 / 品牌 / 型号'
			},
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				width: '160px',
				optionsProp: 'status'
			},
			{
				prop: 'vehicleType',
				label: '车辆类型',
				type: 'select',
				width: '160px',
				options: [...VEHICLE_TYPE_OPTIONS]
			}
		],
		createFilters: () => ({
			keyword: '',
			status: '',
			vehicleType: ''
		}),
		normalizeFilters: filters => ({
			keyword: String(filters.keyword || '').trim() || undefined,
			status: filters.status || undefined,
			vehicleType: filters.vehicleType || undefined
		}),
		createEmptyForm: () => ({
			status: 'idle',
			seats: 5,
			usageScope: '',
			notes: ''
		}),
		statsCards: [
			{ key: 'total', label: '车辆总数', helper: '当前筛选范围内的车辆台账数量' },
			{ key: 'inUseCount', label: '使用中', helper: '当前处于使用中的车辆数量' },
			{ key: 'maintenanceCount', label: '维修中', helper: '当前处于维修中的车辆数量' },
			{ key: 'inspectionDueCount', label: '待年检', helper: '当前处于待年检状态的车辆数量' }
		],
		tableColumns: [
			{ prop: 'vehicleNo', label: '车辆编号', minWidth: 140 },
			{ prop: 'plateNo', label: '车牌号', minWidth: 130 },
			{ prop: 'brand', label: '品牌', minWidth: 120 },
			{ prop: 'model', label: '型号', minWidth: 140 },
			{ prop: 'vehicleType', label: '车辆类型', minWidth: 110, optionsProp: 'vehicleType' },
			{ prop: 'managerName', label: '管理员', minWidth: 110 },
			{ prop: 'inspectionDueDate', label: '年检到期', minWidth: 130, type: 'date' },
			{ prop: 'status', label: '状态', width: 110, optionsProp: 'status', tag: true }
		],
		detailFields: [
			{ prop: 'vehicleNo', label: '车辆编号' },
			{ prop: 'plateNo', label: '车牌号' },
			{ prop: 'brand', label: '品牌' },
			{ prop: 'model', label: '型号' },
			{ prop: 'vehicleType', label: '车辆类型', optionsProp: 'vehicleType' },
			{ prop: 'ownerDepartment', label: '归属部门' },
			{ prop: 'managerName', label: '管理员' },
			{ prop: 'seats', label: '座位数' },
			{ prop: 'registerDate', label: '登记日期', type: 'date' },
			{ prop: 'inspectionDueDate', label: '年检到期', type: 'date' },
			{ prop: 'insuranceDueDate', label: '保险到期', type: 'date' },
			{ prop: 'status', label: '状态', optionsProp: 'status', tag: true },
			{ prop: 'usageScope', label: '使用范围', type: 'textarea', span: 2 },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2 }
		],
		formFields: [
			{ prop: 'vehicleNo', label: '车辆编号', type: 'text', required: true },
			{ prop: 'plateNo', label: '车牌号', type: 'text', required: true },
			{ prop: 'brand', label: '品牌', type: 'text', required: true },
			{ prop: 'model', label: '型号', type: 'text', required: true },
			{
				prop: 'vehicleType',
				label: '车辆类型',
				type: 'select',
				required: true,
				options: [...VEHICLE_TYPE_OPTIONS]
			},
			{ prop: 'ownerDepartment', label: '归属部门', type: 'text', required: true },
			{ prop: 'managerName', label: '管理员', type: 'text', required: true },
			{ prop: 'seats', label: '座位数', type: 'number', min: 1, precision: 0 },
			{ prop: 'registerDate', label: '登记日期', type: 'date', required: true },
			{ prop: 'inspectionDueDate', label: '年检到期', type: 'date' },
			{ prop: 'insuranceDueDate', label: '保险到期', type: 'date' },
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				required: true,
				optionsProp: 'status'
			},
			{ prop: 'usageScope', label: '使用范围', type: 'textarea', span: 2, rows: 3 },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2, rows: 4 }
		]
	}),
	intellectualProperty: createBaseConfig<IntellectualPropertyRecord>({
		moduleKey: 'intellectualProperty',
		title: '知识产权管理',
		route: '/performance/office/intellectual-property',
		phaseLabel: '行政协同 / 行政主模块',
		badgeLabel: 'Admin Ledger',
		description: '维护专利、商标、著作权和软著的申请、登记、到期与风险元数据。',
		entityLabel: '知识产权',
		primaryTextProp: 'title',
		notice: '只维护后台台账元数据，不处理证书附件、续费审批、维权流程或侵权处置。',
		statusOptions: [...INTELLECTUAL_PROPERTY_STATUS_OPTIONS],
		ipType: [...INTELLECTUAL_PROPERTY_TYPE_OPTIONS],
		filters: [
			{
				prop: 'keyword',
				label: '编号 / 标题',
				type: 'text',
				width: '240px',
				placeholder: '编号 / 标题 / 归属人 / 登记号'
			},
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				width: '160px',
				optionsProp: 'status'
			},
			{
				prop: 'ipType',
				label: '类型',
				type: 'select',
				width: '180px',
				options: [...INTELLECTUAL_PROPERTY_TYPE_OPTIONS]
			}
		],
		createFilters: () => ({
			keyword: '',
			status: '',
			ipType: ''
		}),
		normalizeFilters: filters => ({
			keyword: String(filters.keyword || '').trim() || undefined,
			status: filters.status || undefined,
			ipType: filters.ipType || undefined
		}),
		createEmptyForm: () => ({
			status: 'drafting',
			riskLevel: '',
			usageScope: '',
			notes: ''
		}),
		statsCards: [
			{ key: 'total', label: '产权总数', helper: '当前筛选范围内的知识产权记录数量' },
			{ key: 'registeredCount', label: '已登记', helper: '已取得登记或授权的记录数量' },
			{ key: 'expiringCount', label: '即将到期', helper: '距离到期 30 天内的已登记记录数量' },
			{ key: 'expiredCount', label: '已到期', helper: '已到期或过期的记录数量' }
		],
		tableColumns: [
			{ prop: 'ipNo', label: '产权编号', minWidth: 140 },
			{ prop: 'title', label: '标题', minWidth: 200 },
			{ prop: 'ipType', label: '类型', minWidth: 120, optionsProp: 'ipType' },
			{ prop: 'ownerDepartment', label: '归属部门', minWidth: 120 },
			{ prop: 'ownerName', label: '归属人', minWidth: 110 },
			{ prop: 'expiryDate', label: '到期日期', minWidth: 130, type: 'date' },
			{ prop: 'status', label: '状态', width: 110, optionsProp: 'status', tag: true }
		],
		detailFields: [
			{ prop: 'ipNo', label: '产权编号' },
			{ prop: 'title', label: '标题' },
			{ prop: 'ipType', label: '类型', optionsProp: 'ipType' },
			{ prop: 'ownerDepartment', label: '归属部门' },
			{ prop: 'ownerName', label: '归属人' },
			{ prop: 'applicantName', label: '申请人' },
			{ prop: 'applyDate', label: '申请日期', type: 'date' },
			{ prop: 'grantDate', label: '授权日期', type: 'date' },
			{ prop: 'expiryDate', label: '到期日期', type: 'date' },
			{ prop: 'registryNo', label: '登记号' },
			{ prop: 'riskLevel', label: '风险等级', optionsProp: 'riskLevel', tag: true },
			{ prop: 'status', label: '状态', optionsProp: 'status', tag: true },
			{ prop: 'usageScope', label: '使用范围', type: 'textarea', span: 2 },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2 }
		],
		formFields: [
			{ prop: 'ipNo', label: '产权编号', type: 'text', required: true },
			{ prop: 'title', label: '标题', type: 'text', required: true },
			{
				prop: 'ipType',
				label: '类型',
				type: 'select',
				required: true,
				options: [...INTELLECTUAL_PROPERTY_TYPE_OPTIONS]
			},
			{ prop: 'ownerDepartment', label: '归属部门', type: 'text', required: true },
			{ prop: 'ownerName', label: '归属人', type: 'text', required: true },
			{ prop: 'applicantName', label: '申请人', type: 'text', required: true },
			{ prop: 'applyDate', label: '申请日期', type: 'date', required: true },
			{ prop: 'grantDate', label: '授权日期', type: 'date' },
			{ prop: 'expiryDate', label: '到期日期', type: 'date' },
			{ prop: 'registryNo', label: '登记号', type: 'text' },
			{
				prop: 'riskLevel',
				label: '风险等级',
				type: 'select',
				options: [...INTELLECTUAL_PROPERTY_RISK_LEVEL_OPTIONS]
			},
			{
				prop: 'status',
				label: '状态',
				type: 'select',
				required: true,
				optionsProp: 'status'
			},
			{ prop: 'usageScope', label: '使用范围', type: 'textarea', span: 2, rows: 3 },
			{ prop: 'notes', label: '备注', type: 'textarea', span: 2, rows: 4 }
		],
		riskLevel: [...INTELLECTUAL_PROPERTY_RISK_LEVEL_OPTIONS]
	})
} satisfies OfficeLedgerModuleConfigMap;
