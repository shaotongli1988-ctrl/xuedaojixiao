/**
 * 文件职责：定义文件中心关键响应的前端 runtime 契约解码器。
 * 不负责发请求、文件上传下载或页面筛选状态管理。
 * 维护重点：文件元数据、分页和统计必须共享同一条结构边界，避免可空字段和枚举字段被异常响应污染。
 */

import type {
	DocumentCenterConfidentiality,
	DocumentCenterFileType,
	DocumentCenterPageResult,
	DocumentCenterRecord,
	DocumentCenterStats,
	DocumentCenterStatus,
	DocumentCenterStorage,
	DocumentCenterCategory
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString,
	expectPerformanceServiceStringArray
} from './service-contract';

const DOCUMENT_CENTER_CATEGORY = [
	'policy',
	'process',
	'template',
	'contract',
	'archive',
	'other'
] as const;
const DOCUMENT_CENTER_STATUS = ['draft', 'published', 'review', 'archived'] as const;
const DOCUMENT_CENTER_FILE_TYPE = ['other', 'pdf', 'doc', 'xls', 'ppt', 'img', 'zip'] as const;
const DOCUMENT_CENTER_STORAGE = ['local', 'cloud', 'hybrid'] as const;
const DOCUMENT_CENTER_CONFIDENTIALITY = ['public', 'internal', 'secret'] as const;

function decodeDocumentCenterCategory(
	value: unknown,
	field: string
): DocumentCenterCategory {
	return expectPerformanceServiceEnum(value, field, DOCUMENT_CENTER_CATEGORY);
}

function decodeDocumentCenterStatus(value: unknown, field: string): DocumentCenterStatus {
	return expectPerformanceServiceEnum(value, field, DOCUMENT_CENTER_STATUS);
}

function decodeDocumentCenterFileType(
	value: unknown,
	field: string
): DocumentCenterFileType {
	return expectPerformanceServiceEnum(value, field, DOCUMENT_CENTER_FILE_TYPE);
}

function decodeDocumentCenterStorage(value: unknown, field: string): DocumentCenterStorage {
	return expectPerformanceServiceEnum(value, field, DOCUMENT_CENTER_STORAGE);
}

function decodeDocumentCenterConfidentiality(
	value: unknown,
	field: string
): DocumentCenterConfidentiality {
	return expectPerformanceServiceEnum(value, field, DOCUMENT_CENTER_CONFIDENTIALITY);
}

export function decodeDocumentCenterRecord(
	value: unknown,
	field = 'documentCenterRecord'
): DocumentCenterRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		category: decodeDocumentCenterCategory(record.category, `${field}.category`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`),
		status:
			record.status === undefined
				? undefined
				: decodeDocumentCenterStatus(record.status, `${field}.status`),
		fileNo: expectPerformanceServiceString(record.fileNo, `${field}.fileNo`),
		fileName: expectPerformanceServiceString(record.fileName, `${field}.fileName`),
		fileType: decodeDocumentCenterFileType(record.fileType, `${field}.fileType`),
		storage: decodeDocumentCenterStorage(record.storage, `${field}.storage`),
		confidentiality: decodeDocumentCenterConfidentiality(
			record.confidentiality,
			`${field}.confidentiality`
		),
		ownerName: expectPerformanceServiceString(record.ownerName, `${field}.ownerName`),
		department: expectPerformanceServiceString(record.department, `${field}.department`),
		version: expectPerformanceServiceString(record.version, `${field}.version`),
		downloadCount: expectPerformanceServiceOptionalNumber(
			record.downloadCount,
			`${field}.downloadCount`
		),
		tags:
			record.tags === undefined
				? undefined
				: expectPerformanceServiceStringArray(record.tags, `${field}.tags`),
		notes: expectPerformanceServiceOptionalString(record.notes, `${field}.notes`),
		sizeMb:
			record.sizeMb === undefined
				? undefined
				: expectPerformanceServiceNullableNumber(record.sizeMb, `${field}.sizeMb`),
		expireDate:
			record.expireDate === undefined
				? undefined
				: expectPerformanceServiceNullableString(record.expireDate, `${field}.expireDate`)
	};
}

export function decodeDocumentCenterPageResult(
	value: unknown,
	field = 'documentCenterPageResult'
): DocumentCenterPageResult {
	return decodePerformanceServicePageResult(value, field, decodeDocumentCenterRecord);
}

export function decodeDocumentCenterStats(
	value: unknown,
	field = 'documentCenterStats'
): DocumentCenterStats {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		total: expectPerformanceServiceNumber(record.total, `${field}.total`),
		publishedCount: expectPerformanceServiceNumber(
			record.publishedCount,
			`${field}.publishedCount`
		),
		reviewCount: expectPerformanceServiceNumber(record.reviewCount, `${field}.reviewCount`),
		archivedCount: expectPerformanceServiceNumber(record.archivedCount, `${field}.archivedCount`),
		totalSizeMb: expectPerformanceServiceNumber(record.totalSizeMb, `${field}.totalSizeMb`),
		totalDownloads: expectPerformanceServiceNumber(
			record.totalDownloads,
			`${field}.totalDownloads`
		)
	};
}
