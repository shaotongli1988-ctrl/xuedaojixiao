/**
 * 文件职责：定义知识库关键响应的前端 runtime 契约解码器。
 * 不负责页面状态管理、搜索交互编排或正文展示。
 * 维护重点：知识条目、图谱、搜索和问答元数据必须共享同一条结构边界，避免联合返回结构在页面层散落兼容。
 */

import type {
	DocumentCenterRecord,
	DocumentCenterStatus,
	KnowledgeBasePageResult,
	KnowledgeBaseRecord,
	KnowledgeBaseStats,
	KnowledgeBaseStatus,
	KnowledgeGraphLink,
	KnowledgeGraphNode,
	KnowledgeGraphSummary,
	KnowledgeQaListResult,
	KnowledgeQaRecord,
	KnowledgeSearchResult
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNumber,
	expectPerformanceServiceNumberArray,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString,
	expectPerformanceServiceStringArray
} from './service-contract';

const KNOWLEDGE_BASE_STATUS = ['draft', 'published', 'archived'] as const;
const DOCUMENT_CENTER_STATUS = ['draft', 'published', 'review', 'archived'] as const;
const DOCUMENT_CENTER_CATEGORY = [
	'policy',
	'process',
	'template',
	'contract',
	'archive',
	'other'
] as const;
const DOCUMENT_CENTER_FILE_TYPE = ['other', 'pdf', 'doc', 'xls', 'ppt', 'img', 'zip'] as const;
const DOCUMENT_CENTER_STORAGE = ['local', 'cloud', 'hybrid'] as const;
const DOCUMENT_CENTER_CONFIDENTIALITY = ['public', 'internal', 'secret'] as const;

function decodeKnowledgeBaseStatus(value: unknown, field: string): KnowledgeBaseStatus {
	return expectPerformanceServiceEnum(value, field, KNOWLEDGE_BASE_STATUS);
}

function decodeDocumentCenterStatus(value: unknown, field: string): DocumentCenterStatus {
	return expectPerformanceServiceEnum(value, field, DOCUMENT_CENTER_STATUS);
}

export function decodeKnowledgeBaseRecord(
	value: unknown,
	field = 'knowledgeBaseRecord'
): KnowledgeBaseRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		kbNo: expectPerformanceServiceString(record.kbNo, `${field}.kbNo`),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		category: expectPerformanceServiceString(record.category, `${field}.category`),
		summary: expectPerformanceServiceString(record.summary, `${field}.summary`),
		ownerName: expectPerformanceServiceString(record.ownerName, `${field}.ownerName`),
		status:
			record.status === undefined
				? undefined
				: decodeKnowledgeBaseStatus(record.status, `${field}.status`),
		tags:
			record.tags === undefined
				? undefined
				: expectPerformanceServiceStringArray(record.tags, `${field}.tags`),
		relatedFileIds:
			record.relatedFileIds === undefined
				? undefined
				: expectPerformanceServiceNumberArray(
						record.relatedFileIds,
						`${field}.relatedFileIds`
					),
		relatedTopics:
			record.relatedTopics === undefined
				? undefined
				: expectPerformanceServiceStringArray(
						record.relatedTopics,
						`${field}.relatedTopics`
					),
		importance: expectPerformanceServiceOptionalNumber(
			record.importance,
			`${field}.importance`
		),
		viewCount: expectPerformanceServiceOptionalNumber(record.viewCount, `${field}.viewCount`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeKnowledgeBasePageResult(
	value: unknown,
	field = 'knowledgeBasePageResult'
): KnowledgeBasePageResult {
	return decodePerformanceServicePageResult(value, field, decodeKnowledgeBaseRecord);
}

export function decodeKnowledgeBaseStats(
	value: unknown,
	field = 'knowledgeBaseStats'
): KnowledgeBaseStats {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		total: expectPerformanceServiceNumber(record.total, `${field}.total`),
		publishedCount: expectPerformanceServiceNumber(
			record.publishedCount,
			`${field}.publishedCount`
		),
		draftCount: expectPerformanceServiceNumber(record.draftCount, `${field}.draftCount`),
		fileLinkedCount: expectPerformanceServiceNumber(
			record.fileLinkedCount,
			`${field}.fileLinkedCount`
		),
		avgImportance: expectPerformanceServiceNumber(
			record.avgImportance,
			`${field}.avgImportance`
		),
		topicCount: expectPerformanceServiceNumber(record.topicCount, `${field}.topicCount`)
	};
}

function decodeKnowledgeGraphNode(
	value: unknown,
	field = 'knowledgeGraphNode'
): KnowledgeGraphNode {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceString(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		category: expectPerformanceServiceOptionalString(record.category, `${field}.category`),
		value: expectPerformanceServiceOptionalNumber(record.value, `${field}.value`)
	};
}

function decodeKnowledgeGraphLink(
	value: unknown,
	field = 'knowledgeGraphLink'
): KnowledgeGraphLink {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		source: expectPerformanceServiceString(record.source, `${field}.source`),
		target: expectPerformanceServiceString(record.target, `${field}.target`),
		value: expectPerformanceServiceOptionalNumber(record.value, `${field}.value`)
	};
}

export function decodeKnowledgeGraphSummary(
	value: unknown,
	field = 'knowledgeGraphSummary'
): KnowledgeGraphSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		categories:
			record.categories === undefined
				? undefined
				: expectPerformanceServiceArray(record.categories, `${field}.categories`).map(
						(item, index) => {
							const category = expectPerformanceServiceRecord(
								item,
								`${field}.categories[${index}]`
							);

							return {
								name: expectPerformanceServiceString(
									category.name,
									`${field}.categories[${index}].name`
								)
							};
						}
					),
		nodes: expectPerformanceServiceArray(record.nodes, `${field}.nodes`).map((item, index) =>
			decodeKnowledgeGraphNode(item, `${field}.nodes[${index}]`)
		),
		links: expectPerformanceServiceArray(record.links, `${field}.links`).map((item, index) =>
			decodeKnowledgeGraphLink(item, `${field}.links[${index}]`)
		)
	};
}

export function decodeKnowledgeQaRecord(
	value: unknown,
	field = 'knowledgeQaRecord'
): KnowledgeQaRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		question: expectPerformanceServiceString(record.question, `${field}.question`),
		answer: expectPerformanceServiceString(record.answer, `${field}.answer`),
		relatedKnowledgeIds:
			record.relatedKnowledgeIds === undefined
				? undefined
				: expectPerformanceServiceNumberArray(
						record.relatedKnowledgeIds,
						`${field}.relatedKnowledgeIds`
					),
		relatedFileIds:
			record.relatedFileIds === undefined
				? undefined
				: expectPerformanceServiceNumberArray(
						record.relatedFileIds,
						`${field}.relatedFileIds`
					),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeKnowledgeQaListResult(
	value: unknown,
	field = 'knowledgeQaListResult'
): KnowledgeQaListResult {
	if (Array.isArray(value)) {
		return value.map((item, index) => decodeKnowledgeQaRecord(item, `${field}[${index}]`));
	}

	const record = expectPerformanceServiceRecord(value, field);

	return {
		list:
			record.list === undefined
				? undefined
				: expectPerformanceServiceArray(record.list, `${field}.list`).map((item, index) =>
						decodeKnowledgeQaRecord(item, `${field}.list[${index}]`)
					)
	};
}

function decodeKnowledgeSearchDocumentRecord(
	value: unknown,
	field = 'knowledgeSearchDocumentRecord'
): DocumentCenterRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		category: expectPerformanceServiceEnum(
			record.category,
			`${field}.category`,
			DOCUMENT_CENTER_CATEGORY
		),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(
			record.updateTime,
			`${field}.updateTime`
		),
		status:
			record.status === undefined
				? undefined
				: decodeDocumentCenterStatus(record.status, `${field}.status`),
		fileNo: expectPerformanceServiceString(record.fileNo, `${field}.fileNo`),
		fileName: expectPerformanceServiceString(record.fileName, `${field}.fileName`),
		fileType: expectPerformanceServiceEnum(
			record.fileType,
			`${field}.fileType`,
			DOCUMENT_CENTER_FILE_TYPE
		),
		storage: expectPerformanceServiceEnum(
			record.storage,
			`${field}.storage`,
			DOCUMENT_CENTER_STORAGE
		),
		confidentiality: expectPerformanceServiceEnum(
			record.confidentiality,
			`${field}.confidentiality`,
			DOCUMENT_CENTER_CONFIDENTIALITY
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
		sizeMb: expectPerformanceServiceOptionalNumber(record.sizeMb, `${field}.sizeMb`),
		expireDate: expectPerformanceServiceOptionalString(record.expireDate, `${field}.expireDate`)
	};
}

export function decodeKnowledgeSearchResult(
	value: unknown,
	field = 'knowledgeSearchResult'
): KnowledgeSearchResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		total: expectPerformanceServiceNumber(record.total, `${field}.total`),
		knowledge: expectPerformanceServiceArray(record.knowledge, `${field}.knowledge`).map(
			(item, index) => decodeKnowledgeBaseRecord(item, `${field}.knowledge[${index}]`)
		),
		files: expectPerformanceServiceArray(record.files, `${field}.files`).map((item, index) =>
			decodeKnowledgeSearchDocumentRecord(item, `${field}.files[${index}]`)
		),
		qas: expectPerformanceServiceArray(record.qas, `${field}.qas`).map((item, index) =>
			decodeKnowledgeQaRecord(item, `${field}.qas[${index}]`)
		)
	};
}
