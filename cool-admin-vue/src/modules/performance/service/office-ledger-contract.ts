/**
 * 文件职责：定义行政协同元数据台账的 runtime 契约解码器。
 * 不负责请求发送、页面配置或表单交互。
 * 维护重点：Theme22 协同台账、车辆和知识产权必须共享同一组字段级 decoder，避免继续停留在泛型骨架校验。
 */

import {
	expectPerformanceServiceArray,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';
import {
	ANNUAL_INSPECTION_CATEGORY_VALUES,
	ANNUAL_INSPECTION_STATUS_VALUES,
	DESIGN_COLLAB_PRIORITY_VALUES,
	DESIGN_COLLAB_STATUS_VALUES,
	EXPRESS_COLLAB_SERVICE_LEVEL_VALUES,
	EXPRESS_COLLAB_STATUS_VALUES,
	EXPRESS_COLLAB_SYNC_STATUS_VALUES,
	HONOR_LEVEL_VALUES,
	HONOR_STATUS_VALUES,
	HONOR_TYPE_VALUES,
	INTELLECTUAL_PROPERTY_RISK_LEVEL_VALUES,
	INTELLECTUAL_PROPERTY_STATUS_VALUES,
	INTELLECTUAL_PROPERTY_TYPE_VALUES,
	PUBLICITY_MATERIAL_CHANNEL_VALUES,
	PUBLICITY_MATERIAL_STATUS_VALUES,
	PUBLICITY_MATERIAL_TYPE_VALUES,
	VEHICLE_STATUS_VALUES,
	VEHICLE_TYPE_VALUES
} from '../office-ledger.dictionary';
import type {
	AnnualInspectionCategory,
	AnnualInspectionRecord,
	AnnualInspectionStats,
	AnnualInspectionStatus,
	DesignCollabPriority,
	DesignCollabRecord,
	DesignCollabStats,
	DesignCollabStatus,
	ExpressCollabRecord,
	ExpressCollabServiceLevel,
	ExpressCollabStats,
	ExpressCollabStatus,
	ExpressCollabSyncStatus,
	HonorLevel,
	HonorRecord,
	HonorStats,
	HonorStatus,
	HonorType,
	IntellectualPropertyRecord,
	IntellectualPropertyRiskLevel,
	IntellectualPropertyStats,
	IntellectualPropertyStatus,
	IntellectualPropertyType,
	PublicityMaterialChannel,
	PublicityMaterialDocumentSummary,
	PublicityMaterialRecord,
	PublicityMaterialStats,
	PublicityMaterialStatus,
	PublicityMaterialType,
	VehicleRecord,
	VehicleStats,
	VehicleStatus,
	VehicleType
} from '../types';
import type {
	OfficeLedgerBaseRecord,
	OfficeLedgerPageResult,
	OfficeLedgerStats
} from './office-ledger';

export type OfficeLedgerRecordDecoder<TRecord extends OfficeLedgerBaseRecord> = (
	value: unknown,
	field?: string
) => TRecord;

export type OfficeLedgerStatsDecoder<TStats extends OfficeLedgerStats> = (
	value: unknown,
	field?: string
) => TStats;

function decodeOfficeLedgerString(value: unknown, field: string) {
	return expectPerformanceServiceString(value, field);
}

function decodeOptionalRecord<T>(
	value: unknown,
	field: string,
	decoder: (value: unknown, field: string) => T
) {
	if (value === undefined) {
		return undefined;
	}

	return decoder(value, field);
}

function decodeAnnualInspectionStatus(value: unknown, field: string): AnnualInspectionStatus {
	return expectPerformanceServiceEnum(value, field, ANNUAL_INSPECTION_STATUS_VALUES);
}

function decodeAnnualInspectionCategory(value: unknown, field: string): AnnualInspectionCategory {
	return expectPerformanceServiceEnum(value, field, ANNUAL_INSPECTION_CATEGORY_VALUES);
}

function decodeHonorStatus(value: unknown, field: string): HonorStatus {
	return expectPerformanceServiceEnum(value, field, HONOR_STATUS_VALUES);
}

function decodeHonorType(value: unknown, field: string): HonorType {
	return expectPerformanceServiceEnum(value, field, HONOR_TYPE_VALUES);
}

function decodeHonorLevel(value: unknown, field: string): HonorLevel {
	return expectPerformanceServiceEnum(value, field, HONOR_LEVEL_VALUES);
}

function decodePublicityMaterialStatus(value: unknown, field: string): PublicityMaterialStatus {
	return expectPerformanceServiceEnum(value, field, PUBLICITY_MATERIAL_STATUS_VALUES);
}

function decodePublicityMaterialType(value: unknown, field: string): PublicityMaterialType {
	return expectPerformanceServiceEnum(value, field, PUBLICITY_MATERIAL_TYPE_VALUES);
}

function decodePublicityMaterialChannel(value: unknown, field: string): PublicityMaterialChannel {
	return expectPerformanceServiceEnum(value, field, PUBLICITY_MATERIAL_CHANNEL_VALUES);
}

function decodeDesignCollabStatus(value: unknown, field: string): DesignCollabStatus {
	return expectPerformanceServiceEnum(value, field, DESIGN_COLLAB_STATUS_VALUES);
}

function decodeDesignCollabPriority(value: unknown, field: string): DesignCollabPriority {
	return expectPerformanceServiceEnum(value, field, DESIGN_COLLAB_PRIORITY_VALUES);
}

function decodeExpressCollabStatus(value: unknown, field: string): ExpressCollabStatus {
	return expectPerformanceServiceEnum(value, field, EXPRESS_COLLAB_STATUS_VALUES);
}

function decodeExpressCollabServiceLevel(value: unknown, field: string): ExpressCollabServiceLevel {
	return expectPerformanceServiceEnum(value, field, EXPRESS_COLLAB_SERVICE_LEVEL_VALUES);
}

function decodeExpressCollabSyncStatus(value: unknown, field: string): ExpressCollabSyncStatus {
	return expectPerformanceServiceEnum(value, field, EXPRESS_COLLAB_SYNC_STATUS_VALUES);
}

function decodeVehicleType(value: unknown, field: string): VehicleType {
	return expectPerformanceServiceEnum(value, field, VEHICLE_TYPE_VALUES);
}

function decodeVehicleStatus(value: unknown, field: string): VehicleStatus {
	return expectPerformanceServiceEnum(value, field, VEHICLE_STATUS_VALUES);
}

function decodeIntellectualPropertyType(value: unknown, field: string): IntellectualPropertyType {
	return expectPerformanceServiceEnum(value, field, INTELLECTUAL_PROPERTY_TYPE_VALUES);
}

function decodeIntellectualPropertyStatus(
	value: unknown,
	field: string
): IntellectualPropertyStatus {
	return expectPerformanceServiceEnum(value, field, INTELLECTUAL_PROPERTY_STATUS_VALUES);
}

function decodeNullableIntellectualPropertyRiskLevel(
	value: unknown,
	field: string
): IntellectualPropertyRiskLevel | null {
	if (value == null) {
		return null;
	}

	return expectPerformanceServiceEnum(value, field, INTELLECTUAL_PROPERTY_RISK_LEVEL_VALUES);
}

function decodeOfficeLedgerStatsShape<TStats extends OfficeLedgerStats>(
	value: unknown,
	field: string,
	keys: Array<keyof TStats & string>
): TStats {
	const record = expectPerformanceServiceRecord(value, field);
	const stats = {} as TStats;

	for (const key of keys) {
		(stats as Record<string, number>)[key] = expectPerformanceServiceNumber(
			record[key],
			`${field}.${key}`
		);
	}

	return stats;
}

export function decodeOfficeLedgerBaseRecord(
	value: unknown,
	field = 'officeLedgerRecord'
): OfficeLedgerBaseRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		...record,
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`)
	};
}

function decodeOfficeLedgerCommonRecord(record: Record<string, unknown>, field: string) {
	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		title: decodeOfficeLedgerString(record.title, `${field}.title`),
		notes: decodeOfficeLedgerString(record.notes, `${field}.notes`),
		createTime: decodeOfficeLedgerString(record.createTime, `${field}.createTime`),
		updateTime: decodeOfficeLedgerString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeAnnualInspectionRecord(
	value: unknown,
	field = 'annualInspectionRecord'
): AnnualInspectionRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		...decodeOfficeLedgerCommonRecord(record, field),
		status: decodeAnnualInspectionStatus(record.status, `${field}.status`),
		materialNo: decodeOfficeLedgerString(record.materialNo, `${field}.materialNo`),
		category: decodeAnnualInspectionCategory(record.category, `${field}.category`),
		department: decodeOfficeLedgerString(record.department, `${field}.department`),
		ownerName: decodeOfficeLedgerString(record.ownerName, `${field}.ownerName`),
		dueDate: decodeOfficeLedgerString(record.dueDate, `${field}.dueDate`),
		completeness: expectPerformanceServiceNumber(record.completeness, `${field}.completeness`),
		version: decodeOfficeLedgerString(record.version, `${field}.version`),
		reminderDays: expectPerformanceServiceNumber(record.reminderDays, `${field}.reminderDays`)
	};
}

export function decodeAnnualInspectionStats(
	value: unknown,
	field = 'annualInspectionStats'
): AnnualInspectionStats {
	return decodeOfficeLedgerStatsShape<AnnualInspectionStats>(value, field, [
		'total',
		'overdueCount',
		'approvedCount',
		'avgCompleteness'
	]);
}

export function decodeHonorRecord(value: unknown, field = 'honorRecord'): HonorRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		...decodeOfficeLedgerCommonRecord(record, field),
		status: decodeHonorStatus(record.status, `${field}.status`),
		honorNo: decodeOfficeLedgerString(record.honorNo, `${field}.honorNo`),
		honorType: decodeHonorType(record.honorType, `${field}.honorType`),
		level: decodeHonorLevel(record.level, `${field}.level`),
		winnerName: decodeOfficeLedgerString(record.winnerName, `${field}.winnerName`),
		department: decodeOfficeLedgerString(record.department, `${field}.department`),
		awardedAt: decodeOfficeLedgerString(record.awardedAt, `${field}.awardedAt`),
		issuer: decodeOfficeLedgerString(record.issuer, `${field}.issuer`),
		impactScore: expectPerformanceServiceNumber(record.impactScore, `${field}.impactScore`),
		evidenceUrl: expectPerformanceServiceNullableString(
			record.evidenceUrl,
			`${field}.evidenceUrl`
		)
	};
}

export function decodeHonorStats(value: unknown, field = 'honorStats'): HonorStats {
	return decodeOfficeLedgerStatsShape<HonorStats>(value, field, [
		'total',
		'publishedCount',
		'thisYearCount',
		'avgImpactScore'
	]);
}

export function decodePublicityMaterialDocumentSummary(
	value: unknown,
	field = 'publicityMaterialDocumentSummary'
): PublicityMaterialDocumentSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceNumber(record.id, `${field}.id`),
		fileNo: decodeOfficeLedgerString(record.fileNo, `${field}.fileNo`),
		fileName: decodeOfficeLedgerString(record.fileName, `${field}.fileName`)
	};
}

export function decodePublicityMaterialRecord(
	value: unknown,
	field = 'publicityMaterialRecord'
): PublicityMaterialRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		...decodeOfficeLedgerCommonRecord(record, field),
		status: decodePublicityMaterialStatus(record.status, `${field}.status`),
		materialNo: decodeOfficeLedgerString(record.materialNo, `${field}.materialNo`),
		materialType: decodePublicityMaterialType(record.materialType, `${field}.materialType`),
		channel: decodePublicityMaterialChannel(record.channel, `${field}.channel`),
		ownerName: decodeOfficeLedgerString(record.ownerName, `${field}.ownerName`),
		publishDate: decodeOfficeLedgerString(record.publishDate, `${field}.publishDate`),
		views: expectPerformanceServiceNumber(record.views, `${field}.views`),
		downloads: expectPerformanceServiceNumber(record.downloads, `${field}.downloads`),
		designOwner: decodeOfficeLedgerString(record.designOwner, `${field}.designOwner`),
		relatedDocumentId: expectPerformanceServiceNullableNumber(
			record.relatedDocumentId,
			`${field}.relatedDocumentId`
		),
		relatedDocumentSummary: decodeOptionalRecord(
			record.relatedDocumentSummary,
			`${field}.relatedDocumentSummary`,
			decodePublicityMaterialDocumentSummary
		)
	};
}

export function decodePublicityMaterialStats(
	value: unknown,
	field = 'publicityMaterialStats'
): PublicityMaterialStats {
	return decodeOfficeLedgerStatsShape<PublicityMaterialStats>(value, field, [
		'total',
		'reviewingCount',
		'publishedCount',
		'totalViews'
	]);
}

export function decodeDesignCollabRecord(
	value: unknown,
	field = 'designCollabRecord'
): DesignCollabRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		...decodeOfficeLedgerCommonRecord(record, field),
		status: decodeDesignCollabStatus(record.status, `${field}.status`),
		taskNo: decodeOfficeLedgerString(record.taskNo, `${field}.taskNo`),
		requesterName: decodeOfficeLedgerString(record.requesterName, `${field}.requesterName`),
		assigneeName: decodeOfficeLedgerString(record.assigneeName, `${field}.assigneeName`),
		priority: decodeDesignCollabPriority(record.priority, `${field}.priority`),
		dueDate: decodeOfficeLedgerString(record.dueDate, `${field}.dueDate`),
		progress: expectPerformanceServiceNumber(record.progress, `${field}.progress`),
		workload: expectPerformanceServiceNumber(record.workload, `${field}.workload`),
		relatedMaterialNo: expectPerformanceServiceNullableString(
			record.relatedMaterialNo,
			`${field}.relatedMaterialNo`
		)
	};
}

export function decodeDesignCollabStats(
	value: unknown,
	field = 'designCollabStats'
): DesignCollabStats {
	return decodeOfficeLedgerStatsShape<DesignCollabStats>(value, field, [
		'total',
		'doneCount',
		'inProgressCount',
		'overdueCount'
	]);
}

export function decodeExpressCollabRecord(
	value: unknown,
	field = 'expressCollabRecord'
): ExpressCollabRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		...decodeOfficeLedgerCommonRecord(record, field),
		status: decodeExpressCollabStatus(record.status, `${field}.status`),
		trackingNo: decodeOfficeLedgerString(record.trackingNo, `${field}.trackingNo`),
		orderNo: decodeOfficeLedgerString(record.orderNo, `${field}.orderNo`),
		courierCompany: decodeOfficeLedgerString(record.courierCompany, `${field}.courierCompany`),
		serviceLevel: decodeExpressCollabServiceLevel(record.serviceLevel, `${field}.serviceLevel`),
		origin: decodeOfficeLedgerString(record.origin, `${field}.origin`),
		destination: decodeOfficeLedgerString(record.destination, `${field}.destination`),
		senderName: decodeOfficeLedgerString(record.senderName, `${field}.senderName`),
		receiverName: decodeOfficeLedgerString(record.receiverName, `${field}.receiverName`),
		sourceSystem: decodeOfficeLedgerString(record.sourceSystem, `${field}.sourceSystem`),
		syncStatus: decodeExpressCollabSyncStatus(record.syncStatus, `${field}.syncStatus`),
		lastEvent: decodeOfficeLedgerString(record.lastEvent, `${field}.lastEvent`),
		lastUpdate: decodeOfficeLedgerString(record.lastUpdate, `${field}.lastUpdate`),
		etaDate: decodeOfficeLedgerString(record.etaDate, `${field}.etaDate`)
	};
}

export function decodeExpressCollabStats(
	value: unknown,
	field = 'expressCollabStats'
): ExpressCollabStats {
	return decodeOfficeLedgerStatsShape<ExpressCollabStats>(value, field, [
		'total',
		'inTransitCount',
		'deliveredCount',
		'exceptionCount',
		'pendingSyncCount'
	]);
}

export function decodeVehicleRecord(value: unknown, field = 'vehicleRecord'): VehicleRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		vehicleNo: decodeOfficeLedgerString(record.vehicleNo, `${field}.vehicleNo`),
		plateNo: decodeOfficeLedgerString(record.plateNo, `${field}.plateNo`),
		brand: decodeOfficeLedgerString(record.brand, `${field}.brand`),
		model: decodeOfficeLedgerString(record.model, `${field}.model`),
		vehicleType: decodeVehicleType(record.vehicleType, `${field}.vehicleType`),
		ownerDepartment: decodeOfficeLedgerString(
			record.ownerDepartment,
			`${field}.ownerDepartment`
		),
		managerName: decodeOfficeLedgerString(record.managerName, `${field}.managerName`),
		seats: expectPerformanceServiceNumber(record.seats, `${field}.seats`),
		registerDate: decodeOfficeLedgerString(record.registerDate, `${field}.registerDate`),
		inspectionDueDate: expectPerformanceServiceNullableString(
			record.inspectionDueDate,
			`${field}.inspectionDueDate`
		),
		insuranceDueDate: expectPerformanceServiceNullableString(
			record.insuranceDueDate,
			`${field}.insuranceDueDate`
		),
		status: decodeVehicleStatus(record.status, `${field}.status`),
		usageScope: expectPerformanceServiceNullableString(
			record.usageScope,
			`${field}.usageScope`
		),
		notes: expectPerformanceServiceNullableString(record.notes, `${field}.notes`),
		createTime: decodeOfficeLedgerString(record.createTime, `${field}.createTime`),
		updateTime: decodeOfficeLedgerString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeVehicleStats(value: unknown, field = 'vehicleStats'): VehicleStats {
	return decodeOfficeLedgerStatsShape<VehicleStats>(value, field, [
		'total',
		'inUseCount',
		'maintenanceCount',
		'inspectionDueCount'
	]);
}

export function decodeIntellectualPropertyRecord(
	value: unknown,
	field = 'intellectualPropertyRecord'
): IntellectualPropertyRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		ipNo: decodeOfficeLedgerString(record.ipNo, `${field}.ipNo`),
		title: decodeOfficeLedgerString(record.title, `${field}.title`),
		ipType: decodeIntellectualPropertyType(record.ipType, `${field}.ipType`),
		ownerDepartment: decodeOfficeLedgerString(
			record.ownerDepartment,
			`${field}.ownerDepartment`
		),
		ownerName: decodeOfficeLedgerString(record.ownerName, `${field}.ownerName`),
		applicantName: decodeOfficeLedgerString(record.applicantName, `${field}.applicantName`),
		applyDate: decodeOfficeLedgerString(record.applyDate, `${field}.applyDate`),
		grantDate: expectPerformanceServiceNullableString(record.grantDate, `${field}.grantDate`),
		expiryDate: expectPerformanceServiceNullableString(
			record.expiryDate,
			`${field}.expiryDate`
		),
		status: decodeIntellectualPropertyStatus(record.status, `${field}.status`),
		registryNo: expectPerformanceServiceNullableString(
			record.registryNo,
			`${field}.registryNo`
		),
		usageScope: expectPerformanceServiceNullableString(
			record.usageScope,
			`${field}.usageScope`
		),
		riskLevel: decodeNullableIntellectualPropertyRiskLevel(
			record.riskLevel,
			`${field}.riskLevel`
		),
		notes: expectPerformanceServiceNullableString(record.notes, `${field}.notes`),
		createTime: decodeOfficeLedgerString(record.createTime, `${field}.createTime`),
		updateTime: decodeOfficeLedgerString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeIntellectualPropertyStats(
	value: unknown,
	field = 'intellectualPropertyStats'
): IntellectualPropertyStats {
	return decodeOfficeLedgerStatsShape<IntellectualPropertyStats>(value, field, [
		'total',
		'registeredCount',
		'expiringCount',
		'expiredCount'
	]);
}

export function decodeOfficeLedgerStats(
	value: unknown,
	field = 'officeLedgerStats'
): OfficeLedgerStats {
	return {
		...expectPerformanceServiceRecord(value, field)
	};
}

export function decodeOfficeLedgerPageResult<TRecord extends OfficeLedgerBaseRecord>(
	value: unknown,
	field: string,
	decodeRecord: OfficeLedgerRecordDecoder<TRecord>
): OfficeLedgerPageResult<TRecord> {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		list: expectPerformanceServiceArray(record.list, `${field}.list`).map((item, index) =>
			decodeRecord(item, `${field}.list[${index}]`)
		),
		pagination:
			record.pagination == null
				? null
				: (() => {
						const pagination = expectPerformanceServiceRecord(
							record.pagination,
							`${field}.pagination`
						);
						return {
							page: expectPerformanceServiceOptionalNumber(
								pagination.page,
								`${field}.pagination.page`
							),
							size: expectPerformanceServiceOptionalNumber(
								pagination.size,
								`${field}.pagination.size`
							),
							total: expectPerformanceServiceOptionalNumber(
								pagination.total,
								`${field}.pagination.total`
							)
						};
					})()
	};
}
